"use client";

import { useEffect, useState } from "react";
import { X, MessageSquare, Clock, Calendar, AtSign } from "lucide-react";
import axios from "axios";
import { useChatStore } from "@/hooks/useChatStore";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useRouter } from "next/navigation";

export default function UserProfileModal({ currentUserId }: { currentUserId: string }) {
  const { profileToView, setProfileToView, setSelectedChannelId } = useChatStore();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!profileToView) return;
    
    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/users/${profileToView}`);
        setUser(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [profileToView]);

  if (!profileToView) return null;

  const handleSendMessage = async () => {
    if (profileToView === currentUserId) {
      setProfileToView(null);
      return;
    }
    
    // Check if channel already exists, or create new one
    try {
      const res = await axios.post("/api/channels", {
        isGroup: false,
        memberIds: [profileToView],
      });
      setSelectedChannelId(res.data.id);
      setProfileToView(null);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto transition-opacity">
      <div className="bg-[#11151c] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden my-8 flex flex-col">
        {loading || !user ? (
          <div className="p-8 text-center text-slate-500">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            Загрузка профиля...
          </div>
        ) : (
          <>
            <div className="relative w-full h-48 bg-slate-800">
              <button 
                onClick={() => setProfileToView(null)} 
                className="absolute top-4 right-4 z-10 w-8 h-8 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/60 transition"
              >
                <X size={18} />
              </button>
              
              {user.background ? (
                <img src={user.background} alt="Background" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-600/30 to-purple-600/30" />
              )}
              
              <div className="absolute -bottom-12 left-6">
                <div className="w-24 h-24 rounded-full border-4 border-[#11151c] bg-slate-800 flex items-center justify-center overflow-hidden shadow-xl">
                  {user.image ? (
                    <img src={user.image} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-blue-500">{user.name?.charAt(0) || "U"}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 pt-16 pb-6">
              <h2 className="text-2xl font-bold text-white mb-1">{user.name}</h2>
              {user.username && (
                <p className="text-blue-400 font-medium text-sm flex items-center gap-1 mb-4">
                  <AtSign size={14} /> {user.username}
                </p>
              )}

              {user.bio && (
                <div className="bg-white/5 rounded-xl p-4 mb-6">
                  <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{user.bio}</p>
                </div>
              )}

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-300">
                    <Clock size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5">Статус</p>
                    <p className="text-white font-medium">{user.status === "ONLINE" ? "В сети" : (user.lastSeen ? `Был(а) ${format(new Date(user.lastSeen), "d MMM в HH:mm", { locale: ru })}` : "Был(а) недавно")}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-300">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5">Дата регистрации</p>
                    <p className="text-white font-medium">{user.createdAt ? format(new Date(user.createdAt), "d MMMM yyyy", { locale: ru }) : "Неизвестно"}</p>
                  </div>
                </div>
              </div>

              {currentUserId !== user.id && (
                <button
                  onClick={handleSendMessage}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                >
                  <MessageSquare size={18} />
                  Написать сообщение
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
