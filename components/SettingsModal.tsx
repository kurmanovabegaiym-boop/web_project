"use client";

import { useEffect, useState } from "react";
import { X, Moon, Sun, Monitor, BellOff, Layout } from "lucide-react";
import { useSettingsStore } from "@/hooks/useSettingsStore";

export default function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { theme, setTheme, doNotDisturb, setDoNotDisturb, density, setDensity } = useSettingsStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <div 
        className="bg-[#11151c] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative z-10 flex flex-col transform transition-all duration-300 scale-100 opacity-100"
      >
        <div className="p-4 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            ⚙️ Настройки
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh] custom-scrollbar">
          
          {/* ТЕМА */}
          <section className="space-y-3">
            <h3 className="text-xs uppercase font-bold text-slate-500 tracking-widest flex items-center gap-2">
              <Sun size={14} /> Тема оформления
            </h3>
            <div className="grid grid-cols-3 gap-2 bg-white/5 p-1 rounded-xl">
              <button
                onClick={() => setTheme("light")}
                className={`py-2 px-3 text-sm font-medium rounded-lg flex flex-col items-center gap-1 transition ${theme === "light" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
              >
                <Sun size={18} /> Light
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`py-2 px-3 text-sm font-medium rounded-lg flex flex-col items-center gap-1 transition ${theme === "dark" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
              >
                <Moon size={18} /> Dark
              </button>
              <button
                onClick={() => setTheme("system")}
                className={`py-2 px-3 text-sm font-medium rounded-lg flex flex-col items-center gap-1 transition ${theme === "system" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
              >
                <Monitor size={18} /> System
              </button>
            </div>
          </section>

          {/* НЕ БЕСПОКОИТЬ */}
          <section className="space-y-3">
            <h3 className="text-xs uppercase font-bold text-slate-500 tracking-widest flex items-center gap-2">
              <BellOff size={14} /> Уведомления
            </h3>
            <div className="bg-white/5 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Не беспокоить</p>
                <p className="text-xs text-slate-500 mt-0.5">Отключить звуки и пуши</p>
              </div>
              <button 
                onClick={() => setDoNotDisturb(!doNotDisturb)}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${doNotDisturb ? 'bg-blue-600' : 'bg-white/10'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${doNotDisturb ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </section>

          {/* ПЛОТНОСТЬ ИНТЕРФЕЙСА */}
          <section className="space-y-3">
            <h3 className="text-xs uppercase font-bold text-slate-500 tracking-widest flex items-center gap-2">
              <Layout size={14} /> Плотность интерфейса
            </h3>
            <div className="space-y-2">
              {[
                { id: "compact", label: "Compact", desc: "Как Telegram Desktop" },
                { id: "normal", label: "Normal", desc: "Стандартный вид" },
                { id: "spacious", label: "Spacious", desc: "Больше воздуха" }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setDensity(opt.id as any)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition ${density === opt.id ? "bg-blue-600/10 border-blue-500" : "bg-white/5 border-white/5 hover:border-white/10"}`}
                >
                  <div className="flex flex-col items-start text-left">
                    <span className={`text-sm font-medium ${density === opt.id ? "text-blue-400" : "text-white"}`}>{opt.label}</span>
                    <span className="text-xs text-slate-500">{opt.desc}</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${density === opt.id ? "border-blue-500" : "border-slate-600"}`}>
                    {density === opt.id && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
