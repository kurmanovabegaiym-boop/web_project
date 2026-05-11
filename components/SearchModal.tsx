"use client";

import { useState, useEffect } from "react";
import { X, Search, MessageSquare, Users, Hash } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/hooks/useChatStore";

export default function SearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { setSelectedChannelId } = useChatStore();
  const router = useRouter();

  const navigateToChat = (id: string) => {
    setSelectedChannelId(id);
    onClose();
    router.push("/"); 
  };

  useEffect(() => {
    if (!query) {
      setResults(null);
      return;
    }

    const delay = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/search?q=${query}`);
        setResults(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [query]);

  const handleUserClick = async (userId: string) => {
    try {
      setLoading(true);
      const res = await axios.post("/api/channels", {
        memberIds: [userId],
        isGroup: false,
      });
      navigateToChat(res.data.id);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4">
      <div className="bg-[#11151c] w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
        <div className="p-4 border-b border-white/5 flex items-center gap-4">
          <Search className="text-slate-500" size={20} />
          <input
            autoFocus
            placeholder="Поиск людей, групп или сообщений..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none text-white focus:outline-none text-lg"
          />
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {loading && <p className="text-center text-slate-500">Поиск...</p>}
          
          {results && (
            <>
              {/* Users */}
              {results.users?.length > 0 && (
                <section>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Users size={14} /> Люди
                  </h3>
                  <div className="grid gap-2">
                    {results.users.map((u: any) => (
                      <button 
                        key={u.id} 
                        onClick={() => handleUserClick(u.id)}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition text-left w-full"
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-500 font-bold">
                          {u.image ? <img src={u.image} className="w-full h-full rounded-full object-cover" /> : u.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{u.name}</p>
                          <p className="text-xs text-slate-500">@{u.username || u.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Channels/Groups */}
              {results.channels?.length > 0 && (
                <section>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Hash size={14} /> Группы и каналы
                  </h3>
                  <div className="grid gap-2">
                    {results.channels.map((c: any) => (
                      <button 
                        key={c.id} 
                        onClick={() => navigateToChat(c.id)}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition text-left w-full"
                      >
                        <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-500 font-bold overflow-hidden">
                          {c.icon ? <img src={c.icon} className="w-full h-full object-cover" /> : "#"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{c.name}</p>
                          <p className="text-xs text-slate-500">{c.isGroup ? "Группа" : "Личный чат"}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Messages */}
              {results.messages?.length > 0 && (
                <section>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <MessageSquare size={14} /> Сообщения
                  </h3>
                  <div className="grid gap-2">
                    {results.messages.map((m: any) => (
                      <button 
                        key={m.id} 
                        onClick={() => navigateToChat(m.channelId)}
                        className="flex flex-col gap-1 p-3 rounded-xl hover:bg-white/5 transition text-left w-full border border-white/5"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-blue-500">{m.user.name}</span>
                          <span className="text-[10px] text-slate-500">{new Date(m.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-slate-300 line-clamp-2">{m.text}</p>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {results.users.length === 0 && results.channels.length === 0 && results.messages.length === 0 && (
                <p className="text-center text-slate-500 py-10">Ничего не найдено</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
