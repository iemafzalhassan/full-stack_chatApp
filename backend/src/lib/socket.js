import { Server } from "socket.io";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:8080", "http://localhost"],
    credentials: true,
  },
});

export function getReceiverSocketId(userId) {
  return Array.from(userSocketMap.get(userId.toString()) || []);
}

// used to store online users
const userSocketMap = new Map(); // Map<userId, Set<socketId>>

const getCookieValue = (cookieHeader, cookieName) => {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const cookie = cookies.find((item) => item.startsWith(`${cookieName}=`));

  return cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : null;
};

const emitOnlineUsers = () => {
  io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
};

io.use(async (socket, next) => {
  try {
    const token = getCookieValue(socket.handshake.headers.cookie, "jwt");

    if (!token) {
      return next(new Error("Unauthorized - No Token Provided"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("_id");

    if (!user) {
      return next(new Error("Unauthorized - User Not Found"));
    }

    socket.userId = user._id.toString();
    next();
  } catch (error) {
    next(new Error("Unauthorized - Invalid Token"));
  }
});

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.userId;
  const socketIds = userSocketMap.get(userId) || new Set();
  socketIds.add(socket.id);
  userSocketMap.set(userId, socketIds);

  // io.emit() is used to send events to all the connected clients
  emitOnlineUsers();

  socket.on("typing", ({ receiverId, isTyping }) => {
    if (!receiverId) return;

    const receiverSocketIds = getReceiverSocketId(receiverId);
    if (receiverSocketIds.length > 0) {
      io.to(receiverSocketIds).emit("typing", {
        senderId: userId,
        isTyping: Boolean(isTyping),
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);

    const activeSocketIds = userSocketMap.get(userId);
    if (activeSocketIds) {
      activeSocketIds.delete(socket.id);
      if (activeSocketIds.size === 0) userSocketMap.delete(userId);
    }

    emitOnlineUsers();
  });
});

export { io, app, server };
