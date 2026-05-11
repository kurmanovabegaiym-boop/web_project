"use client";

import { useState, useEffect } from "react";
import { X, Camera, Users, Shield, ShieldAlert, LogOut, Trash2 } from "lucide-react";
import axios from "axios";
import { UploadDropzone } from "@/lib/uploadthing";
import { useChatStore } from "@/hooks/useChatStore";

interface GroupProfileModalProps {
  channel: any;
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function GroupProfileModal({ channel, currentUserId, isOpen, onClose }: GroupProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(channel.name || "");
  const [description, setDescription] = useState(channel.description || "");
  const [icon, setIcon] = useState(channel.icon || "");
  const [isSupergroup, setIsSupergroup] = useState(channel.isSupergroup || false);
  const [loading, setLoading] = useState(false);

  // Check roles
  const isOwner = channel.ownerId === currentUserId;
  const isAdmin = channel.admins?.some((a: any) => a.id === currentUserId);
  const canEdit = isOwner || isAdmin;

  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.patch(`/api/socket/channels?channelId=${channel.id}`, { name, description, icon, isSupergroup });
      setIsEditing(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Вы уверены, что хотите удалить этого участника?")) return;
    try {
      console.log("[REMOVE_MEMBER_REQUEST]", { channelId: channel.id, memberId });
      await axios.delete(`/api/socket/channels?channelId=${channel.id}&userId=${memberId}`);
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  const handleLeave = async () => {
    if (!confirm("Вы уверены, что хотите выйти из группы?")) return;
    try {
      console.log("[LEAVE_GROUP_REQUEST]", { channelId: channel.id, userId: currentUserId });
      await axios.delete(`/api/socket/channels?channelId=${channel.id}&userId=${currentUserId}`);
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#11151c] w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Информация о группе</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Hero Section with Avatar */}
          <div className="relative h-48 bg-blue-600/10 flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-slate-800 border-4 border-[#11151c] flex items-center justify-center text-blue-500 text-3xl font-bold overflow-hidden shadow-xl">
                {icon ? (
                  <img src={icon} alt={name} className="w-full h-full object-cover" />
                ) : (
                  name?.charAt(0) || "#"
                )}
              </div>
              {canEdit && !isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-lg border-2 border-[#11151c] text-white hover:bg-blue-500 transition shadow-lg"
                >
                  <Camera size={16} />
                </button>
              )}
            </div>
            {!isEditing && (
              <div className="flex flex-col items-center">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  {channel.name}
                  {channel.isSupergroup && (
                    <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">
                      SUPERGROUP
                    </span>
                  )}
                </h3>
              </div>
            )}
          </div>

          <div className="p-6 space-y-6">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Название группы</label>
                  <input 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 mt-1 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Описание</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 mt-1 text-white focus:outline-none focus:border-blue-500 h-24"
                  />
                </div>
                <div className="pt-2">
                  <UploadDropzone 
                    endpoint="messageAttachment"
                    onClientUploadComplete={(res) => setIcon(res?.[0].url)}
                    className="ut-button:bg-blue-600 ut-label:text-blue-500 border-white/10 bg-white/5 h-20"
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">Включить темы (Topics)</span>
                    <span className="text-xs text-slate-500">Позволяет разделять чат на подразделы</span>
                  </div>
                  <button 
                    onClick={() => setIsSupergroup(!isSupergroup)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${isSupergroup ? 'bg-blue-600' : 'bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isSupergroup ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
                <div className="flex gap-2 pt-4">
                  <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl transition"
                  >
                    Сохранить
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-2 rounded-xl transition"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {channel.description && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Описание</h4>
                    <p className="text-sm text-slate-300">{channel.description}</p>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between">
                    Участники ({channel.members?.length})
                  </h4>
                  <div className="space-y-2">
                    {channel.members?.map((m: any) => (
                      <div key={m.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-500 font-bold overflow-hidden">
                            {m.image ? <img src={m.image} className="w-full h-full object-cover" /> : m.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white flex items-center gap-2">
                              {m.name}
                              {channel.ownerId === m.id && (
                                <span className="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold uppercase tracking-wider">
                                  OWNER
                                </span>
                              )}
                              {channel.admins?.some((a: any) => a.id === m.id) && (
                                <span className="text-[9px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded border border-blue-500/20 font-bold uppercase tracking-wider">
                                  ADMIN
                                </span>
                              )}
                              {channel.ownerId !== m.id && !channel.admins?.some((a: any) => a.id === m.id) && (
                                <span className="text-[9px] bg-slate-500/10 text-slate-500 px-1.5 py-0.5 rounded border border-slate-500/20 font-bold uppercase tracking-wider">
                                  MEMBER
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500">@{m.username || "user"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {canEdit && m.id !== channel.ownerId && m.id !== currentUserId && (
                            <button 
                              onClick={() => handleRemoveMember(m.id)}
                              className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
                              title="Удалить участника"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleLeave}
                    className="w-full flex items-center justify-center gap-2 text-red-500 hover:bg-red-500/10 p-3 rounded-xl transition font-bold"
                  >
                    <LogOut size={18} /> Выйти из группы
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
