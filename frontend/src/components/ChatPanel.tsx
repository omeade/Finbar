"use client";

import { useRef, useState } from "react";
import { ChatMessage, RiskProfile, Strategy } from "@/types";
import { sendChatMessage } from "@/lib/api";

interface Props {
  context: { strategy: Strategy | null; risk_profile: RiskProfile | null };
  onClose: () => void;
}

export default function ChatPanel({ context, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your investment coach. Ask me anything about your strategy, ETFs, risk, or how investing works. I'm here to educate — not give financial advice.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const response = await sendChatMessage(text, context);
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't reach the server. Please try again." },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 w-[380px] max-h-[520px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-indigo-600 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-white font-semibold text-sm">Investment Coach</span>
        </div>
        <button onClick={onClose} className="text-indigo-200 hover:text-white transition-colors text-lg leading-none">
          ×
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] text-sm rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-sm"
                  : "bg-gray-100 text-gray-800 rounded-bl-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask about ETFs, risk, strategy…"
            className="flex-1 text-sm px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-900"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
