import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { IoSend } from "react-icons/io5";
import { FaHourglassEnd } from "react-icons/fa";

interface Message {
  id: number;
  from: "user" | "bot";
  text: string;
  typing?: boolean;
}

interface ChatBotProps {
  apiEndpoint: string;
  modelName?: string;
}

const ChatBot: React.FC<ChatBotProps> = ({
  apiEndpoint,
  modelName = "llama3:latest",
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageId = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Typing animation helper
  const simulateTyping = (
    fullText: string,
    updateCallback: (partial: string) => void,
    doneCallback: () => void,
    speed = 20
  ) => {
    let index = 0;
    const interval = setInterval(() => {
      updateCallback(fullText.slice(0, index + 1));
      index++;
      if (index >= fullText.length) {
        clearInterval(interval);
        doneCallback();
      }
    }, speed);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    setError(null);

    // Add user message
    const userMessageId = ++messageId.current;
    const userText = input;
    setMessages((prev) => [
      ...prev,
      { id: userMessageId, from: "user", text: userText },
    ]);

    // Add placeholder for bot typing
    const typingMessageId = ++messageId.current;
    setMessages((prev) => [
      ...prev,
      {
        id: typingMessageId,
        from: "bot",
        text: "buBot is thinking...",
        typing: true,
      },
    ]);

    setInput("");
    setLoading(true);

    try {
      const res = await axios.post(apiEndpoint, {
        model: modelName,
        prompt: userText,
        stream: false,
      });

      const botReply = res.data.response || "Sorry, no response from API.";

      // Simulate typing
      simulateTyping(
        botReply,
        (partialText) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === typingMessageId ? { ...msg, text: partialText } : msg
            )
          );
        },
        () => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === typingMessageId ? { ...msg, typing: false } : msg
            )
          );
        }
      );
    } catch (e: any) {
      console.error("API Error:", e);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === typingMessageId
            ? {
                ...msg,
                text: "Error: Could not get response.",
                typing: false,
              }
            : msg
        )
      );

      if (e.response) {
        setError(
          `Failed: ${e.response.status} - ${
            e.response.data?.error || e.message
          }`
        );
      } else if (e.request) {
        setError("No response from server. Check network or server status.");
      } else {
        setError(`Request failed: ${e.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col max-w-4xl mx-auto h-[650px] border border-gray-800 rounded-lg shadow-lg bg-gray-950 text-gray-100 font-sans">
      {/* Header */}
      <header className="px-6 py-3 border-b border-gray-800 text-base font-medium bg-gray-900 shadow-sm select-none">
        Chat Assistant
      </header>

      {/* Messages */}
      <main className="flex-grow overflow-y-auto px-4 py-3 space-y-4 bg-gray-950 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
        {messages.map(({ id, from, text, typing }) => (
          <div
            key={id}
            className={`w-full flex ${
              from === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[75%] px-6 py-4 rounded-md border text-sm ${
                from === "user"
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-gray-800 border-gray-700 text-gray-100"
              }`}
            >
              <div className="text-xs opacity-50 mb-1">
                {from === "user" ? "You" : "Assistant"}
              </div>
              <div className="whitespace-pre-wrap break-words">
                {typing ? (
                  <span className="italic text-gray-400 animate-pulse">
                    {text}
                  </span>
                ) : (
                  text
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </main>

      {/* Error */}
      {error && (
        <div className="text-red-500 text-center py-2 px-6 font-medium select-none border-t border-red-700">
          {error}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!loading) handleSend();
        }}
        className="px-6 py-4 border-t border-gray-800 bg-gray-950 flex items-end gap-4"
      >
        <textarea
          rows={1}
          className="flex-grow resize-none rounded-md border border-gray-700 bg-gray-900 px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
          placeholder="Ask anything ..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !loading) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="h-12 w-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md flex items-center justify-center transition"
        >
          {loading ? <FaHourglassEnd size={20} /> : <IoSend size={20} />}
        </button>
      </form>
    </div>
  );
};

export default ChatBot;
