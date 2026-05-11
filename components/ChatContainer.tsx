"use client";

import { useEffect, useState } from "react";
import { SendHorizonal, Paperclip, Mic, Square, ChevronLeft, Palette } from "lucide-react";
import { useChatStore } from "@/hooks/useChatStore";
import { useRouter } from "next/navigation";
import axios from "axios";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import UserProfileModal from "./UserProfileModal";
import GroupProfileModal from "./GroupProfileModal";
import ChatThemeSelector, { THEMES } from "./ChatThemeSelector";
import { useSocket } from "@/components/providers/socket-provider";
import TopicsSidebar from "./TopicsSidebar";
import { useSession } from "next-auth/react";


interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface Channel {
  id: string;
  name: string | null;
  isGroup: boolean;
  isSupergroup: boolean;
  ownerId: string | null;
  icon: string | null;
  members: User[];
  admins: User[];
}

export default function ChatContainer({ currentUserId }: { currentUserId: string }) {
  const { selectedChannelId, setSelectedChannelId, chatThemes, setChatTheme, activeTopicId } = useChatStore();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Use live session userId so changes propagate reactively on account switch
  const { data: session } = useSession();
  const liveUserId = (session?.user as any)?.id || currentUserId;

  const { socket } = useSocket();
  const [typers, setTypers] = useState<any[]>([]);
  const [isGroupProfileOpen, setIsGroupProfileOpen] = useState(false);
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);

  useEffect(() => {
    if (!selectedChannelId) return;

    const fetchChannel = async () => {
      setLoading(true);
      try {
        const [channelRes, themeRes] = await Promise.all([
          axios.get(`/api/channels/${selectedChannelId}`),
          axios.get(`/api/channels/${selectedChannelId}/theme`)
        ]);
        setChannel(channelRes.data);
        if (themeRes.data.theme) {
          setChatTheme(selectedChannelId, themeRes.data.theme);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchChannel();

    // Присоединяемся к комнате сокета
    if (socket) {
      socket.emit("chat:join", selectedChannelId);
      socket.emit("user:online", liveUserId);

      const onTyping = ({ userId, userName }: any) => {
        setTypers((prev) => {
          if (prev.find(t => t.userId === userId)) return prev;
          return [...prev, { userId, userName }];
        });
      };

      const onStopTyping = ({ userId }: any) => {
        setTypers((prev) => prev.filter(t => t.userId !== userId));
      };

      socket.on("chat:typing", onTyping);
      socket.on("chat:stop-typing", onStopTyping);

      socket.on("user:status", ({ userId, status }: { userId: string, status: "ONLINE" | "OFFLINE" }) => {
        useChatStore.getState().setUserStatus(userId, status);
      });

      socket.on("user:all-statuses", (statuses: Record<string, "ONLINE" | "OFFLINE">) => {
        Object.entries(statuses).forEach(([userId, status]) => {
          useChatStore.getState().setUserStatus(userId, status);
        });
      });

      socket.on("channel:update", (updatedChannel: any) => {
        if (updatedChannel.id === selectedChannelId) {
          setChannel(updatedChannel);
        }
      });

      socket.on("member:removed", ({ channelId, userId }: { channelId: string, userId: string }) => {
        console.log("[SOCKET_RECV] member:removed", { channelId, userId });
        if (userId === currentUserId) {
          console.log("[LEAVE_GROUP_SYNC] Closing chat and refreshing sidebar");
          useChatStore.getState().setSelectedChannelId(null);
          router.refresh();
        } else if (channelId === selectedChannelId) {
          console.log("[MEMBER_REMOVED_SYNC] Refreshing channel data");
          fetchChannel();
        }
      });

      return () => {
        socket.off("chat:typing", onTyping);
        socket.off("chat:stop-typing", onStopTyping);
        socket.off("user:status");
        socket.off("channel:update");
        socket.off("member:removed");
        setTypers([]);
      };
    }
  }, [selectedChannelId, socket, currentUserId]);

  const userStatuses = useChatStore((state) => state.userStatuses);
  const currentThemeKey = (selectedChannelId && chatThemes && chatThemes[selectedChannelId]) || "DEFAULT";
  const currentTheme = THEMES[currentThemeKey] || THEMES["DEFAULT"];

  if (!selectedChannelId) {
    return (
      <div className="flex-1 hidden md:flex items-center justify-center flex-col gap-4 text-slate-500 relative bg-[#09090b]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[120px] -z-10 rounded-full" />
        <div className="w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center">
          <span className="text-blue-500 text-3xl font-bold">#</span>
        </div>
        <p className="font-medium">Выберите чат в боковой панели, чтобы начать общение</p>
      </div>
    );
  }

  if (loading || !channel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#09090b]">
        <p className="text-slate-500">Загрузка чата...</p>
      </div>
    );
  }


  // Determine chat name and avatar for 1-on-1 chats
  let displayName = channel.name;
  let displayInitial = "#";
  
  if (!channel.isGroup) {
    const otherUser = channel.members.find(m => m.id !== currentUserId);
    displayName = otherUser?.name || "Без имени";
    displayInitial = displayName.charAt(0) || "@";
  }

  return (
    <div className={`flex-1 flex relative overflow-hidden transition-colors duration-500 ${currentTheme.bg} ${selectedChannelId ? "flex w-full h-full" : "hidden md:flex"}`}>
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[120px] -z-10 rounded-full" />
      
      {channel.isSupergroup && (
        <TopicsSidebar 
          channelId={channel.id} 
          isAdmin={channel.ownerId === currentUserId || channel.admins?.some(a => a.id === currentUserId)} 
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 relative h-full">
      
      {/* Chat Header */}
      <header className={`h-16 border-b border-white/5 flex items-center px-4 md:px-6 gap-2 backdrop-blur-md z-10 ${currentThemeKey === 'LIGHT' ? 'bg-white/70' : 'bg-black/20'}`}>
        <button 
          onClick={() => setSelectedChannelId(null)}
          className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white transition"
        >
          <ChevronLeft size={24} />
        </button>
        <div 
          onClick={() => {
            if (!channel.isGroup) {
              const otherUser = channel.members.find(m => m.id !== currentUserId);
              if (otherUser) useChatStore.getState().setProfileToView(otherUser.id);
            } else {
              setIsGroupProfileOpen(true);
            }
          }}
          className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 -ml-2 rounded-xl transition"
        >
          <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center font-bold overflow-hidden">
            {channel.isGroup ? (
              channel.icon ? (
                <img src={channel.icon} alt={displayName || ""} className="w-full h-full object-cover" />
              ) : (
                "#"
              )
            ) : (
              channel.members.find(m => m.id !== currentUserId)?.image ? (
                <img src={channel.members.find(m => m.id !== currentUserId)?.image!} alt={displayName || ""} className="w-full h-full object-cover" />
              ) : (
                displayInitial
              )
            )}
          </div>
          <div className="flex flex-col">
            <h2 className={`font-bold text-sm tracking-wide ${currentThemeKey === 'LIGHT' ? 'text-slate-900' : 'text-white'}`}>{displayName}</h2>
            <span className="text-xs text-slate-500">
              {typers.length > 0 
                ? `${typers[0].userName} печатает...` 
                : (channel.isGroup 
                    ? `${channel.members.length} участников` 
                    : (userStatuses[channel.members.find(m => m.id !== currentUserId)?.id || ""] === "ONLINE" 
                        ? <span className="text-green-500">В сети</span>
                        : "Был(а) недавно"
                      )
                  )
              }
            </span>
          </div>
        </div>

        <div className="flex-1" />

        <button 
          onClick={() => setIsThemeSelectorOpen(true)}
          className="p-2 text-slate-400 hover:text-white transition hover:bg-white/5 rounded-lg"
          title="Изменить тему чата"
        >
          <Palette size={20} />
        </button>
      </header>

      {/* Messages Area */}
      <ChatMessages conversationId={selectedChannelId} topicId={activeTopicId} currentUserId={liveUserId} channel={channel} />
      
      {/* Input Area */}
      <ChatInput 
        conversationId={selectedChannelId} 
        topicId={activeTopicId}
        currentUser={channel.members.find(m => m.id === currentUserId)}
      />
      </div>

      <UserProfileModal currentUserId={liveUserId} />
      <GroupProfileModal 
        isOpen={isGroupProfileOpen} 
        onClose={() => setIsGroupProfileOpen(false)}
        channel={channel}
        currentUserId={liveUserId}
      />

      <ChatThemeSelector 
        channelId={selectedChannelId}
        isOpen={isThemeSelectorOpen}
        onClose={() => setIsThemeSelectorOpen(false)}
      />
    </div>
  );
}
