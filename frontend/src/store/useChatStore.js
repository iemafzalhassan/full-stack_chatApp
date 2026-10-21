import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isTyping: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true, isTyping: false });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  markMessagesAsSeen: async (userId) => {
    const socket = useAuthStore.getState().socket;
    if (socket?.connected) {
      socket.emit("markMessagesAsSeen", { senderId: userId });
    }
    try {
      await axiosInstance.put(`/messages/mark-seen/${userId}`);
    } catch (err) {
      // Non-critical, socket handles real-time update
    }
  },
  sendTyping: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    const socket = useAuthStore.getState().socket;
    if (socket?.connected) {
      socket.emit("typing", { receiverId: selectedUser._id });
    }
  },
  sendStopTyping: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    const socket = useAuthStore.getState().socket;
    if (socket?.connected) {
      socket.emit("stopTyping", { receiverId: selectedUser._id });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser, messages, sendStopTyping } = get();
    sendStopTyping();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser, markMessagesAsSeen } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
        isTyping: false,
      });
      // Mark the incoming message as seen immediately since conversation is open
      markMessagesAsSeen(selectedUser._id);
    });
    socket.on("userTyping", ({ senderId }) => {
      if (senderId === selectedUser._id) {
        set({ isTyping: true });
      }
    });
    socket.on("userStoppedTyping", ({ senderId }) => {
      if (senderId === selectedUser._id) {
        set({ isTyping: false });
      }
    });
    socket.on("messagesSeen", ({ byUserId }) => {
      if (byUserId === selectedUser._id) {
        set({
          messages: get().messages.map((m) =>
            m.receiverId === byUserId ? { ...m, isSeen: true } : m
          ),
        });
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
    socket.off("userTyping");
    socket.off("userStoppedTyping");
    socket.off("messagesSeen");
    set({ isTyping: false });
  },

  setSelectedUser: (selectedUser) => set({ selectedUser, isTyping: false }),
}));
