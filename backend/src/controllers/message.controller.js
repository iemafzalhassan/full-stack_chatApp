import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import mongoose from "mongoose";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

const MAX_MESSAGE_TEXT_LENGTH = 2000;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const IMAGE_DATA_URI_REGEX = /^data:image\/(png|jpe?g|webp|gif);base64,/i;

const getBase64ImageSize = (image) => {
  const base64Data = image.split(",")[1] || "";
  const padding = (base64Data.match(/=*$/) || [""])[0].length;

  return Math.floor((base64Data.length * 3) / 4) - padding;
};

const validateImage = (image) => {
  if (typeof image !== "string" || !IMAGE_DATA_URI_REGEX.test(image)) {
    return "Image must be a PNG, JPG, WEBP, or GIF data URI";
  }

  if (getBase64ImageSize(image) > MAX_IMAGE_SIZE_BYTES) {
    return "Image must be 5MB or smaller";
  }

  return null;
};

const emitToUser = (userId, event, payload) => {
  const socketIds = getReceiverSocketId(userId);
  if (socketIds.length > 0) {
    io.to(socketIds).emit(event, payload);
  }
};

const markConversationAsRead = async (readerId, senderId) => {
  const unreadMessages = await Message.find({
    senderId,
    receiverId: readerId,
    readAt: null,
    deletedAt: null,
  }).select("_id");

  if (unreadMessages.length === 0) {
    return { messageIds: [], readAt: null };
  }

  const readAt = new Date();
  const messageIds = unreadMessages.map((message) => message._id);

  await Message.updateMany({ _id: { $in: messageIds } }, { $set: { readAt } });

  const payload = {
    readerId: readerId.toString(),
    messageIds: messageIds.map((messageId) => messageId.toString()),
    readAt,
  };

  emitToUser(senderId, "messagesRead", payload);

  return payload;
};

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
    const unreadCounts = await Message.aggregate([
      {
        $match: {
          receiverId: loggedInUserId,
          readAt: null,
          deletedAt: null,
        },
      },
      {
        $group: {
          _id: "$senderId",
          count: { $sum: 1 },
        },
      },
    ]);
    const unreadCountMap = new Map(
      unreadCounts.map((item) => [item._id.toString(), item.count])
    );
    const usersWithUnreadCounts = filteredUsers.map((user) => ({
      ...user.toObject(),
      unreadCount: unreadCountMap.get(user._id.toString()) || 0,
    }));

    res.status(200).json(usersWithUnreadCounts);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(userToChatId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const userToChat = await User.exists({ _id: userToChatId });
    if (!userToChat) {
      return res.status(404).json({ message: "User not found" });
    }

    await markConversationAsRead(myId, userToChatId);

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const { id: senderId } = req.params;
    const readerId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(senderId)) {
      return res.status(400).json({ message: "Invalid sender id" });
    }

    const sender = await User.exists({ _id: senderId });
    if (!sender) {
      return res.status(404).json({ message: "Sender not found" });
    }

    const payload = await markConversationAsRead(readerId, senderId);

    res.status(200).json(payload);
  } catch (error) {
    console.log("Error in markMessagesAsRead controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    const trimmedText = typeof text === "string" ? text.trim() : "";

    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: "Invalid receiver id" });
    }

    if (senderId.equals(receiverId)) {
      return res.status(400).json({ message: "Cannot send a message to yourself" });
    }

    if (!trimmedText && !image) {
      return res.status(400).json({ message: "Message text or image is required" });
    }

    if (text !== undefined && typeof text !== "string") {
      return res.status(400).json({ message: "Message text must be a string" });
    }

    if (trimmedText.length > MAX_MESSAGE_TEXT_LENGTH) {
      return res
        .status(400)
        .json({ message: `Message text must be ${MAX_MESSAGE_TEXT_LENGTH} characters or fewer` });
    }

    const receiver = await User.exists({ _id: receiverId });
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    let imageUrl;
    if (image) {
      const imageError = validateImage(image);
      if (imageError) {
        return res.status(400).json({ message: imageError });
      }

      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image, { resource_type: "image" });
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text: trimmedText,
      image: imageUrl,
    });

    await newMessage.save();

    emitToUser(receiverId, "newMessage", newMessage);

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { text } = req.body;
    const senderId = req.user._id;
    const trimmedText = typeof text === "string" ? text.trim() : "";

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid message id" });
    }

    if (typeof text !== "string") {
      return res.status(400).json({ message: "Message text must be a string" });
    }

    if (!trimmedText) {
      return res.status(400).json({ message: "Message text is required" });
    }

    if (trimmedText.length > MAX_MESSAGE_TEXT_LENGTH) {
      return res
        .status(400)
        .json({ message: `Message text must be ${MAX_MESSAGE_TEXT_LENGTH} characters or fewer` });
    }

    const message = await Message.findOne({
      _id: messageId,
      senderId,
      deletedAt: null,
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    message.text = trimmedText;
    message.editedAt = new Date();
    await message.save();

    emitToUser(message.senderId, "messageUpdated", message);
    emitToUser(message.receiverId, "messageUpdated", message);

    res.status(200).json(message);
  } catch (error) {
    console.log("Error in updateMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const senderId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid message id" });
    }

    const message = await Message.findOne({
      _id: messageId,
      senderId,
      deletedAt: null,
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    message.text = "";
    message.image = "";
    message.deletedAt = new Date();
    await message.save();

    emitToUser(message.senderId, "messageDeleted", message);
    emitToUser(message.receiverId, "messageDeleted", message);

    res.status(200).json(message);
  } catch (error) {
    console.log("Error in deleteMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
