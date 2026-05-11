// components/MessageList.tsx
"use client"
import { useState } from "react";

export default function MessageList({ initialMessages }: { initialMessages: any[] }) {
  const [messages] = useState(initialMessages);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
      {messages.map((msg, index) => {
        const isMe = index % 2 === 0; // Имитация: каждое второе сообщение - наше
        return (
          <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] p-4 rounded-3xl shadow-sm text-sm leading-relaxed ${
              isMe 
                ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-tr-none" 
                : "bg-white text-slate-700 rounded-tl-none border border-slate-100"
            }`}>
              <p>{msg.text}</p>
              <span className={`text-[10px] block mt-2 opacity-70 ${isMe ? "text-right" : "text-left"}`}>
                12:30
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}