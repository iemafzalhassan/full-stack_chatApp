import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

const replaceMessage = (messages, updatedMessage) =>
  messages.map((message) => (message._id === updatedMessage._id ? updatedMessage : message));

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  unreadCounts: {},
  typingUsers: {},
  isSubscribedToMessages: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      const unreadCounts = res.data.reduce((counts, user) => {
        counts[user._id] = user.unreadCount || 0;
        return counts;
      }, {});

      set({ users: res.data, unreadCounts });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set((state) => ({
        messages: res.data,
        unreadCounts: { ...state.unreadCounts, [userId]: 0 },
      }));
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },
  editMessage: async (messageId, text) => {
    try {
      const res = await axiosInstance.put(`/messages/${messageId}`, { text });
      set({ messages: replaceMessage(get().messages, res.data) });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },
  deleteMessage: async (messageId) => {
    try {
      const res = await axiosInstance.delete(`/messages/${messageId}`);
      set({ messages: replaceMessage(get().messages, res.data) });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },
  markMessagesAsRead: async (userId) => {
    try {
      const res = await axiosInstance.patch(`/messages/read/${userId}`);
      const messageIds = new Set(res.data.messageIds || []);

      set((state) => ({
        unreadCounts: { ...state.unreadCounts, [userId]: 0 },
        messages:
          messageIds.size === 0
            ? state.messages
            : state.messages.map((message) =>
                messageIds.has(message._id) ? { ...message, readAt: res.data.readAt } : message
              ),
      }));
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },
  sendTyping: (receiverId, isTyping) => {
    const socket = useAuthStore.getState().socket;
    if (!socket?.connected || !receiverId) return;

    socket.emit("typing", { receiverId, isTyping });
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket || get().isSubscribedToMessages) return;

    socket.on("newMessage", (newMessage) => {
      const { selectedUser } = get();
      const authUser = useAuthStore.getState().authUser;
      const isSelectedConversation = newMessage.senderId === selectedUser?._id;

      if (isSelectedConversation) {
        set({ messages: [...get().messages, newMessage] });
        get().markMessagesAsRead(newMessage.senderId);
        return;
      }

      if (newMessage.receiverId === authUser?._id) {
        set((state) => ({
          unreadCounts: {
            ...state.unreadCounts,
            [newMessage.senderId]: (state.unreadCounts[newMessage.senderId] || 0) + 1,
          },
        }));
      }
    });

    socket.on("messageUpdated", (updatedMessage) => {
      set({ messages: replaceMessage(get().messages, updatedMessage) });
    });

    socket.on("messageDeleted", (deletedMessage) => {
      set({ messages: replaceMessage(get().messages, deletedMessage) });
    });

    socket.on("messagesRead", ({ messageIds, readAt }) => {
      const readMessageIds = new Set(messageIds || []);
      if (readMessageIds.size === 0) return;

      set((state) => ({
        messages: state.messages.map((message) =>
          readMessageIds.has(message._id) ? { ...message, readAt } : message
        ),
      }));
    });

    socket.on("typing", ({ senderId, isTyping }) => {
      set((state) => {
        const typingUsers = { ...state.typingUsers };

        if (isTyping) {
          typingUsers[senderId] = true;
        } else {
          delete typingUsers[senderId];
        }

        return { typingUsers };
      });
    });

    set({ isSubscribedToMessages: true });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newMessage");
    socket.off("messageUpdated");
    socket.off("messageDeleted");
    socket.off("messagesRead");
    socket.off("typing");
    set({ isSubscribedToMessages: false, typingUsers: {} });
  },

  setSelectedUser: (selectedUser) => {
    const currentSelectedUser = get().selectedUser;
    if (currentSelectedUser?._id && currentSelectedUser?._id !== selectedUser?._id) {
      get().sendTyping(currentSelectedUser._id, false);
    }

    set({ selectedUser });
    if (selectedUser?._id) {
      set((state) => ({
        unreadCounts: { ...state.unreadCounts, [selectedUser._id]: 0 },
      }));
    }
  },
}));
