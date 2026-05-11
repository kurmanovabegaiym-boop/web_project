"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useChatSocket } from "@/hooks/use-chat-socket";
import { format } from "date-fns";
import axios from "axios";
import { useChatStore } from "@/hooks/useChatStore";
import { THEMES } from "./ChatThemeSelector";
import { useSocket } from "@/components/providers/socket-provider";
import { Pencil, Trash2, X, Check as CheckIcon, Check, CheckCheck } from "lucide-react";

interface ChatMessagesProps {
  conversationId: string;
  topicId: string | null;
  currentUserId: string;
  channel: any;
}

export default function ChatMessages({ conversationId, topicId, currentUserId, channel }: ChatMessagesProps) {
  const { 
    messages, 
    setMessages, 
    addMessages, 
    addMessage, 
    setProfileToView, 
    hasMore, 
    setHasMore, 
    nextCursor, 
    setNextCursor,
    updateMessage,
    deleteMessage,
    chatThemes
  } = useChatStore();
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      else setLoadingMore(true);

      const cursor = isInitial ? "" : nextCursor;
      const url = new URL("/api/messages", window.location.origin);
      url.searchParams.set("channelId", conversationId);
      if (topicId) url.searchParams.set("topicId", topicId);
      if (cursor) url.searchParams.set("cursor", cursor);

      const res = await axios.get(url.toString());
      
      if (isInitial) {
        setMessages(res.data.messages);
      } else {
        // Сохраняем высоту перед добавлением
        const scrollHeight = chatContainerRef.current?.scrollHeight || 0;
        
        addMessages(res.data.messages, true);
        
        // Восстанавливаем позицию после обновления DOM
        setTimeout(() => {
          if (chatContainerRef.current) {
            const newScrollHeight = chatContainerRef.current.scrollHeight;
            chatContainerRef.current.scrollTop = newScrollHeight - scrollHeight;
          }
        }, 0);
      }
      
      setNextCursor(res.data.nextCursor);
      setHasMore(res.data.hasMore);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [conversationId, topicId, nextCursor, currentUserId, setMessages, addMessages, setNextCursor, setHasMore]);

  // Initial fetch — re-runs when channel, topic, OR user changes
  useEffect(() => {
    fetchMessages(true);
  }, [conversationId, topicId, currentUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchMessages(false);
        }
      },
      { threshold: 1.0 }
    );

    const currentTopRef = topRef.current;
    if (currentTopRef) {
      observer.observe(currentTopRef);
    }

    return () => {
      if (currentTopRef) {
        observer.unobserve(currentTopRef);
      }
    };
  }, [hasMore, loadingMore, loading, fetchMessages]);

  // Realtime messages
  useChatSocket({
    addKey: topicId 
      ? `chat:${conversationId}:${topicId}:messages`
      : `chat:${conversationId}:messages`,
    queryKey: topicId ? `chat:${conversationId}:${topicId}` : `chat:${conversationId}`,
    callback: (message) => addMessage(message)
  });

  const { socket } = useSocket();

  // Realtime updates/deletes/reads
  useEffect(() => {
    if (!socket || !conversationId) return;

    const onRead = ({ messageId }: any) => {
      useChatStore.getState().updateMessageStatus(messageId, "READ");
    };

    const onUpdate = (message: any) => {
      console.log("[SOCKET_RECV] message:update", message);
      updateMessage(message);
    };

    const onDelete = (message: any) => {
      console.log("[SOCKET_RECV] message:delete", message.id);
      deleteMessage(message.id);
    };

    const updateKey = topicId 
      ? `chat:${conversationId}:${topicId}:messages:update`
      : `chat:${conversationId}:messages:update`;
    
    const deleteKey = topicId 
      ? `chat:${conversationId}:${topicId}:messages:delete`
      : `chat:${conversationId}:messages:delete`;

    console.log("[SOCKET_LISTEN_START]", { updateKey, deleteKey });

    socket.on("chat:read", onRead);
    socket.on(updateKey, onUpdate);
    socket.on(deleteKey, onDelete);

    return () => {
      socket.off("chat:read", onRead);
      socket.off(updateKey, onUpdate);
      socket.off(deleteKey, onDelete);
    };
  }, [socket, conversationId, topicId, updateMessage, deleteMessage]);

  // Mark as read
  useEffect(() => {
    const markAsRead = async () => {
      if (messages.length > 0 && socket) {
        try {
          const res = await axios.post("/api/messages/read", { channelId: conversationId });
          if (res.data.count > 0) {
            res.data.messageIds.forEach((messageId: string) => {
              socket.emit("chat:read", { channelId: conversationId, userId: currentUserId, messageId });
            });
          }
        } catch (error) {
          console.error("Failed to mark messages as read", error);
        }
      }
    };
    
    markAsRead();
  }, [messages.length, socket, conversationId, currentUserId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (!loading && !loadingMore) {
      bottomRef?.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, loading, loadingMore]);

  const currentThemeKey = (conversationId && chatThemes && chatThemes[conversationId]) || "DEFAULT";
  const currentTheme = THEMES[currentThemeKey] || THEMES["DEFAULT"];

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-slate-500">Загрузка сообщений...</div>;
  }

  return (
    <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-5 space-y-4">
      {hasMore && (
        <div ref={topRef} className="flex justify-center py-2">
          {loadingMore ? (
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <div className="h-6" />
          )}
        </div>
      )}

      {messages.length === 0 && (
        <div className="h-full flex items-center justify-center text-slate-500">
          Здесь пока нет сообщений. Напишите что-нибудь!
        </div>
      )}

      {messages.map((msg: any) => {
        const isOwn = msg.userId === currentUserId;
        const isEditing = editingId === msg.id;
        const isEdited = !!msg.editedAt;

        const handleEdit = async () => {
          if (!editValue || editValue === msg.text) {
            setEditingId(null);
            return;
          }
          try {
            console.log("[EDIT_REQUEST]", { id: msg.id, text: editValue });
            const res = await axios.patch(`/api/socket/messages/${msg.id}`, { message: editValue });
            console.log("[EDIT_RESPONSE]", res.data);
            setEditingId(null);
          } catch (error) {
            console.error(error);
          }
        };

        const handleDeleteEveryone = async () => {
          if (!confirm("Удалить сообщение для всех?")) return;
          try {
            console.log("[DELETE_EVERYONE_REQUEST]", { id: msg.id });
            await axios.delete(`/api/socket/messages/${msg.id}?type=everyone`);
            deleteMessage(msg.id);
          } catch (error) {
            console.error(error);
          }
        };

        const handleDeleteMe = async () => {
          if (!confirm("Удалить сообщение у себя?")) return;
          try {
            console.log("[DELETE_ME_REQUEST]", { id: msg.id });
            await axios.delete(`/api/socket/messages/${msg.id}?type=me`);
            deleteMessage(msg.id);
          } catch (error) {
            console.error(error);
          }
        };

        const canDeleteEveryone = isOwn || channel?.ownerId === currentUserId || channel?.admins?.some((a: any) => a.id === currentUserId);

        return (
          <div key={msg.id} className={`group flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {!isOwn && (
              <div 
                onClick={() => setProfileToView(msg.userId)}
                className="w-8 h-8 rounded-full bg-slate-800 mr-2 flex items-center justify-center text-xs font-bold text-blue-500 shrink-0 cursor-pointer hover:opacity-80 transition overflow-hidden"
              >
                {msg.user?.image ? (
                  <img src={msg.user.image} alt={msg.user.name} className="w-full h-full object-cover" />
                ) : (
                  msg.user?.name?.charAt(0) || "U"
                )}
              </div>
            )}
            
            <div className={`flex flex-col gap-1 max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-2 group/bubble">
                {isOwn && !isEditing && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button 
                      onClick={() => { setEditingId(msg.id); setEditValue(msg.text); }}
                      className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 hover:text-blue-400 transition"
                    >
                      <Pencil size={14} />
                    </button>
                    <button 
                      onClick={handleDeleteMe}
                      className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 hover:text-orange-400 transition"
                      title="Удалить у себя"
                    >
                      <Trash2 size={14} />
                    </button>
                    {canDeleteEveryone && (
                      <button 
                        onClick={handleDeleteEveryone}
                        className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 hover:text-red-400 transition"
                        title="Удалить у всех"
                      >
                        <Trash2 size={14} className="fill-current" />
                      </button>
                    )}
                  </div>
                )}
                
                <div className={`px-4 py-2 rounded-2xl shadow-sm flex flex-col min-w-[60px] ${
                  isOwn 
                    ? `${currentTheme.bubble} ${currentThemeKey === 'LIGHT' ? 'text-white' : 'text-white'} rounded-br-none` 
                    : `${currentThemeKey === 'LIGHT' ? 'bg-white text-slate-900 border border-slate-200' : 'bg-white/10 text-white'} rounded-bl-none`
                }`}>
                  {!isOwn && (
                    <span className={`text-xs font-bold mb-1 ${currentThemeKey === 'LIGHT' ? 'text-blue-600' : 'text-blue-400'}`}>{msg.user?.name}</span>
                  )}
                  
                  {msg.attachments?.length > 0 && (
                    <div className="mb-2">
                      {msg.attachments.map((att: any) => (
                        att.type.toLowerCase().includes('image') ? (
                          <img key={att.id} src={att.url} alt="attachment" className="rounded-lg max-h-64 object-cover" />
                        ) : att.type.toLowerCase().includes('audio') ? (
                          <div key={att.id} className="flex flex-col gap-1 min-w-[200px]">
                            <audio controls className="h-8 w-full">
                              <source src={att.url} type={att.type} />
                            </audio>
                            <span className="text-[9px] opacity-40 px-1">Голосовое сообщение</span>
                          </div>
                        ) : (
                          <a key={att.id} href={att.url} target="_blank" rel="noreferrer" className="underline text-sm text-blue-400">Файл</a>
                        )
                      ))}
                    </div>
                  )}

                  {isEditing ? (
                    <div className="flex flex-col gap-2 min-w-[200px] py-1">
                      <textarea
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:border-white/20 resize-none"
                        rows={3}
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingId(null)} className="p-1 hover:bg-white/10 rounded text-slate-400">
                          <X size={16} />
                        </button>
                        <button onClick={handleEdit} className="p-1 hover:bg-white/10 rounded text-blue-400">
                          <CheckIcon size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>
                  )}
                  
                  <div className="text-[10px] opacity-60 mt-1 flex justify-end items-center gap-1">
                    {isEdited && <span className="italic mr-1 text-[9px]">изменено</span>}
                    {format(new Date(msg.createdAt), "HH:mm")}
                    {isOwn && (
                      <span>
                        {msg.status === "READ" ? <CheckCheck size={12} className="text-blue-200" /> : <Check size={12} />}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}