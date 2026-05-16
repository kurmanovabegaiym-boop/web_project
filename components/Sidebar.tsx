"use client";

import { useState, useEffect } from "react";
import { Hash, Users, Settings, Search, Plus } from "lucide-react";
import { useChatStore } from "@/hooks/useChatStore";
import CreateChatModal from "./CreateChatModal";
import EditProfileModal from "./EditProfileModal";
import { signOut } from "next-auth/react";
import { LogOut, Edit3 } from "lucide-react";
import { useSocket } from "@/components/providers/socket-provider";
import { useRouter } from "next/navigation";
import SearchModal from "./SearchModal";
import SettingsModal from "./SettingsModal";

interface Channel {
  id: string;
  name: string | null;
  isGroup: boolean;
  icon: string | null;
  members: any[];
}

export default function Sidebar({ channels, currentUser }: { channels: Channel[], currentUser: any }) {
  const { selectedChannelId, setSelectedChannelId, setCurrentStoreUserId } = useChatStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { socket } = useSocket();
  const router = useRouter();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});

  // Sync user ID with store (triggers internal reset if user changed)
  useEffect(() => {
    if (currentUser?.id) {
      console.log("[SIDEBAR] Syncing user", currentUser.id);
      setCurrentStoreUserId(currentUser.id);
    }
  }, [currentUser?.id, setCurrentStoreUserId]);

  // If selected channel doesn't belong to this user, deselect it (NO redirect - just clear)
  useEffect(() => {
    if (selectedChannelId && channels.length > 0 && !channels.some(c => c.id === selectedChannelId)) {
      console.log("[SIDEBAR] Channel not in user list, deselecting", selectedChannelId);
      setSelectedChannelId(null);
    }
  }, [channels, selectedChannelId, setSelectedChannelId]);

  // Auto-select first channel when none is selected (e.g. after login/account switch)
  // Guard: only fire when session is active (currentUser exists) to prevent logout race condition
  useEffect(() => {
    if (!selectedChannelId && channels.length > 0 && currentUser?.id) {
      console.log("[SIDEBAR] Auto-selecting first channel", channels[0].id);
      setSelectedChannelId(channels[0].id);
    }
  }, [channels, selectedChannelId, setSelectedChannelId, currentUser?.id]);

  useEffect(() => {
    const counts: Record<string, number> = {};
    channels.forEach(c => {
      counts[c.id] = (c as any).unreadCount || 0;
    });
    setUnreadMessages(counts);
  }, [channels]);


  useEffect(() => {
    if (!socket) return;

    socket.on("user:status", ({ userId, status }: { userId: string, status: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (status === "ONLINE") next.add(userId);
        else next.delete(userId);
        return next;
      });
    });

    // Обновляем список при любом новом сообщении (чтобы поднять чат наверх)
    socket.on("chat:new-message", (message: any) => {
      if (message.channelId !== useChatStore.getState().selectedChannelId) {
        setUnreadMessages(prev => ({
          ...prev,
          [message.channelId]: (prev[message.channelId] || 0) + 1
        }));
      }
      router.refresh();
    });

    return () => {
      socket.off("user:status");
      socket.off("chat:new-message");
    };
  }, [socket, router]);

  return (
    <aside className={`w-80 bg-[#11151c] border-r border-white/5 flex flex-col shrink-0 ${selectedChannelId ? "hidden md:flex" : "flex w-full md:w-80"}`}>
      <div className="p-6 h-16 border-b border-white/5 flex items-center justify-between">
        <h1 className="font-black text-xl tracking-tighter text-blue-500 italic">NOVA</h1>
        <Settings size={18} className="text-slate-500 cursor-pointer hover:text-white transition" onClick={() => setIsSettingsOpen(true)} />
      </div>
      
      <div className="p-4">
        <div className="relative cursor-pointer" onClick={() => setIsSearchOpen(true)}>
          <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
          <div 
            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-xs text-slate-500 flex items-center"
          >
            Поиск чатов...
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-1">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-[10px] uppercase font-bold text-slate-600 tracking-widest">Чаты</p>
          <button onClick={() => setIsModalOpen(true)} className="text-slate-500 hover:text-blue-500 transition">
            <Plus size={16} />
          </button>
        </div>

        {channels.map(channel => {
          // Determine chat name for 1-on-1 chats
          let displayName = channel.name;
          if (!channel.isGroup) {
            const otherUser = channel.members.find(m => m.id !== currentUser.id);
            displayName = otherUser?.name || "Без имени";
          }

          return (
            <button 
              key={channel.id}
              onClick={() => {
                setSelectedChannelId(channel.id);
                setUnreadMessages(prev => ({ ...prev, [channel.id]: 0 }));
              }}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition ${selectedChannelId === channel.id ? "bg-blue-600/10 border-l-2 border-blue-500 rounded-l-none" : "hover:bg-white/5"}`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`relative w-8 h-8 rounded-lg flex items-center justify-center font-bold overflow-hidden shrink-0 ${channel.isGroup ? "bg-blue-600/20 text-blue-500" : "bg-slate-800 text-slate-300"}`}>
                  {channel.isGroup ? (
                    channel.icon ? (
                      <img src={channel.icon} alt={channel.name || ""} className="w-full h-full object-cover" />
                    ) : (
                      "#"
                    )
                  ) : (
                    displayName?.charAt(0) || "@"
                  )}
                  {!channel.isGroup && onlineUsers.has(channel.members.find(m => m.id !== currentUser.id)?.id) && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#11151c] rounded-full" />
                  )}
                </div>
                <span className={`text-sm font-medium truncate ${selectedChannelId === channel.id ? "italic text-white" : "text-slate-400"}`}>
                  {displayName}
                </span>
              </div>
              
              {unreadMessages[channel.id] > 0 && (
                <div className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] flex items-center justify-center animate-pulse">
                  {unreadMessages[channel.id]}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-white/5 bg-black/20 flex items-center justify-between group">
        <div 
          onClick={() => useChatStore.getState().setIsEditingProfile(true)}
          className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-xl transition -ml-2"
        >
          <div className="relative w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center font-bold text-blue-500 overflow-hidden shrink-0">
            {currentUser.image ? (
              <img src={currentUser.image} alt={currentUser.name} className="w-full h-full object-cover" />
            ) : (
              currentUser.name?.charAt(0) || "U"
            )}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <Edit3 size={14} className="text-white" />
            </div>
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold text-white leading-tight truncate max-w-[120px]">{currentUser.name}</span>
            <span className="text-xs text-slate-500 truncate max-w-[120px]">{currentUser.username ? `@${currentUser.username}` : currentUser.email}</span>
          </div>
        </div>
        <button 
          onClick={async () => {
            await signOut({ callbackUrl: "/login" });
          }}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-500 hover:text-red-400 transition"
          title="Выйти"
        >
          <LogOut size={16} />
        </button>
      </div>

      <CreateChatModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <EditProfileModal currentUser={currentUser} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </aside>
  );
}
