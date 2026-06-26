import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    editMessage,
    deleteMessage,
    isMessagesLoading,
    selectedUser,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    getMessages(selectedUser._id);
  }, [selectedUser._id, getMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const startEditing = (message) => {
    setEditingMessageId(message._id);
    setEditText(message.text || "");
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditText("");
  };

  const handleEditMessage = async (e) => {
    e.preventDefault();
    if (!editText.trim()) return;

    await editMessage(editingMessageId, editText.trim());
    cancelEditing();
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Delete this message?")) return;
    await deleteMessage(messageId);
  };

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwnMessage = message.senderId === authUser._id;
          const isDeleted = Boolean(message.deletedAt);
          const isEditing = editingMessageId === message._id;

          return (
            <div
              key={message._id}
              className={`chat ${isOwnMessage ? "chat-end" : "chat-start"}`}
              ref={messageEndRef}
            >
              <div className=" chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={
                      isOwnMessage
                        ? authUser.profilePic || "/avatar.png"
                        : selectedUser.profilePic || "/avatar.png"
                    }
                    alt="profile pic"
                  />
                </div>
              </div>
              <div className="chat-header mb-1">
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
                {message.editedAt && !isDeleted && (
                  <span className="text-xs opacity-50 ml-2">Edited</span>
                )}
              </div>
              <div className="chat-bubble flex flex-col gap-2">
                {isDeleted ? (
                  <p className="italic opacity-70">Message deleted</p>
                ) : isEditing ? (
                  <form onSubmit={handleEditMessage} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="input input-bordered input-sm w-full text-base-content"
                      autoFocus
                    />
                    <button type="submit" className="btn btn-xs btn-circle" title="Save edit">
                      <Check className="size-3" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-xs btn-circle"
                      title="Cancel edit"
                      onClick={cancelEditing}
                    >
                      <X className="size-3" />
                    </button>
                  </form>
                ) : (
                  <>
                    {message.image && (
                      <img
                        src={message.image}
                        alt="Attachment"
                        className="sm:max-w-[200px] rounded-md mb-2"
                      />
                    )}
                    {message.text && <p>{message.text}</p>}
                  </>
                )}
              </div>
              <div className="chat-footer mt-1 flex items-center gap-2 opacity-70">
                {isOwnMessage && !isDeleted && (
                  <div className="flex items-center gap-1">
                    {message.text && (
                      <button
                        type="button"
                        title="Edit message"
                        className="btn btn-ghost btn-xs btn-circle"
                        onClick={() => startEditing(message)}
                      >
                        <Pencil className="size-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      title="Delete message"
                      className="btn btn-ghost btn-xs btn-circle"
                      onClick={() => handleDeleteMessage(message._id)}
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                )}
                {isOwnMessage && (
                  <span className="text-xs">{message.readAt ? "Read" : "Sent"}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <MessageInput />
    </div>
  );
};
export default ChatContainer;
