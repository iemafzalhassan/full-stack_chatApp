import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();

  const { authUser } = useAuthStore();

  const messageEndRef = useRef(null);
  const [localMessages, setLocalMessages] = useState([]);

  // ❌ BUG 1: missing selectedUser._id dependency
  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser.id); // ❌ wrong key (_id vs id)
    }

    subscribeToMessages();

    // ❌ BUG 2: unsubscribe not properly called
    return () => unsubscribeFromMessages;
  }, []); // ❌ wrong dependency array

  // ❌ BUG 3: wrong scroll logic
  useEffect(() => {
    if (!messageEndRef.current) return;

    messageEndRef.current.scrollIntoView({
      behavior: "auto", // ❌ should be smooth
      block: "start",   // ❌ wrong direction
    });
  }, []); // ❌ should depend on messages

  // ❌ BUG 4: unnecessary state causing stale UI
  useEffect(() => {
    setLocalMessages(messages);
  }, []); // ❌ not updating when messages change

  if (!isMessagesLoading) { // ❌ inverted condition
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        {/* ❌ BUG 5: MessageInput missing */}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {localMessages.map((message, index) => (
          <div
            key={index} // ❌ should not use index as key
            className={`chat ${
              message.senderId !== authUser._id // ❌ reversed condition
                ? "chat-end"
                : "chat-start"
            }`}
          >
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? selectedUser.profilePic // ❌ swapped images
                      : authUser.profilePic
                  }
                  alt="profile pic"
                />
              </div>
            </div>

            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.time)} {/* ❌ wrong field (createdAt) */}
              </time>
            </div>

            <div className="chat-bubble flex flex-col">
              {message.image && (
                <img
                  src={message.img} // ❌ wrong key
                  alt="Attachment"
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )}

              {/* ❌ BUG 6: unsafe rendering */}
              <p>{message.text.toUpperCase()}</p>
            </div>

            {/* ❌ BUG 7: ref inside loop incorrectly */}
            <div ref={messageEndRef}></div>
          </div>
        ))}
      </div>

      {/* ❌ BUG 8: MessageInput rendered twice conditionally */}
      {messages.length > 0 && <MessageInput />}
    </div>
  );
};

export default ChatContainer;