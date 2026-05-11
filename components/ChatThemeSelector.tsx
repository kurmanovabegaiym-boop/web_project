"use client";

import { Palette, X, Check } from "lucide-react";
import { useState } from "react";
import axios from "axios";
import { useChatStore } from "@/hooks/useChatStore";

export const THEMES: Record<string, any> = {
  DEFAULT: { name: "По умолчанию", bg: "bg-[#09090b]", bubble: "bg-blue-600", preview: "bg-[#09090b]" },
  LIGHT: { name: "Светлая", bg: "bg-slate-100", bubble: "bg-blue-500", preview: "bg-slate-100" },
  DARK: { name: "Тёмная", bg: "bg-black", bubble: "bg-zinc-800", preview: "bg-black" },
  RED: { name: "Красная", bg: "bg-rose-950", bubble: "bg-rose-600", preview: "bg-rose-900" },
  BLUE: { name: "Синяя", bg: "bg-blue-950", bubble: "bg-blue-600", preview: "bg-blue-900" },
  PURPLE: { name: "Фиолетовая", bg: "bg-purple-950", bubble: "bg-purple-600", preview: "bg-purple-900" },
  GRADIENT: { name: "Градиент", bg: "bg-gradient-to-br from-indigo-950 via-slate-950 to-purple-950", bubble: "bg-gradient-to-r from-blue-600 to-indigo-600", preview: "bg-indigo-900" },
};

export default function ChatThemeSelector({ channelId, isOpen, onClose }: { channelId: string, isOpen: boolean, onClose: () => void }) {
  const { chatThemes, setChatTheme } = useChatStore();
  const currentTheme = chatThemes[channelId] || "DEFAULT";

  const onSelectTheme = async (themeKey: string) => {
    try {
      setChatTheme(channelId, themeKey);
      await axios.post(`/api/channels/${channelId}/theme`, { theme: themeKey });
    } catch (error) {
      console.error("Failed to save theme", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="bg-[#11151c] w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Palette size={18} className="text-blue-500" />
            <h2 className="font-bold text-white text-sm">Тема чата</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 grid grid-cols-2 gap-3">
          {Object.entries(THEMES).map(([key, theme]) => (
            <button
              key={key}
              onClick={() => onSelectTheme(key)}
              className={`relative h-20 rounded-xl overflow-hidden border-2 transition ${currentTheme === key ? "border-blue-500" : "border-transparent hover:border-white/10"}`}
            >
              <div className={`absolute inset-0 ${theme.bg}`} />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <div className={`w-8 h-4 rounded-full ${theme.bubble} shadow-lg`} />
                <span className="text-[10px] font-bold text-white uppercase tracking-tighter">{theme.name}</span>
              </div>
              {currentTheme === key && (
                <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-0.5">
                  <Check size={10} className="text-white" />
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="p-4 bg-black/20 text-center">
          <p className="text-[10px] text-slate-500 italic">Тема применяется мгновенно для вас</p>
        </div>
      </div>
    </div>
  );
}
