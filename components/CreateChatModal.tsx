"use client";

import { useState, useEffect } from "react";
import { X, Search, Check } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/hooks/useChatStore";
import { UploadDropzone } from "@/lib/uploadthing";

interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  status: string;
}

export default function CreateChatModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isGroup, setIsGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupIcon, setGroupIcon] = useState("");
  const [isSupergroup, setIsSupergroup] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setSelectedChannelId } = useChatStore();

  useEffect(() => {
    if (isOpen) {
      axios.get("/api/users").then((res) => setUsers(res.data));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter((uid) => uid !== id));
    } else {
      // If it's not a group, we can only select one user
      if (!isGroup) {
        setSelectedUserIds([id]);
      } else {
        setSelectedUserIds([...selectedUserIds, id]);
      }
    }
  };

  const handleCreate = async () => {
    if (selectedUserIds.length === 0) return;
    if (isGroup && !groupName) return;

    try {
      setLoading(true);
      const res = await axios.post("/api/channels", {
        name: isGroup ? groupName : null,
        isGroup,
        isSupergroup,
        memberIds: selectedUserIds,
        icon: isGroup ? groupIcon : null,
      });

      setSelectedChannelId(res.data.id);
      router.refresh();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#11151c] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Создать чат</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex gap-2 p-1 bg-white/5 rounded-lg">
            <button
              onClick={() => { setIsGroup(false); setSelectedUserIds([]); }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${!isGroup ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
            >
              Личный чат
            </button>
            <button
              onClick={() => { setIsGroup(true); setSelectedUserIds([]); }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${isGroup ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
            >
              Группа
            </button>
          </div>

          {isGroup && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 py-2">
                {groupIcon ? (
                  <div className="relative w-20 h-20">
                    <img src={groupIcon} alt="Group icon" className="w-full h-full object-cover rounded-2xl" />
                    <button 
                      onClick={() => setGroupIcon("")} 
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="w-full">
                    <UploadDropzone 
                      endpoint="messageAttachment"
                      onClientUploadComplete={(res) => {
                        setGroupIcon(res?.[0].url);
                      }}
                      className="ut-button:bg-blue-600 ut-label:text-blue-500 ut-allowed-content:text-slate-500 border-white/10 bg-white/5 h-24"
                      content={{ label: "Аватар группы" }}
                    />
                  </div>
                )}
              </div>
                <input
                  type="text"
                  placeholder="Название группы"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
                <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/10">
                  <input 
                    type="checkbox" 
                    id="isSupergroup"
                    checked={isSupergroup}
                    onChange={(e) => setIsSupergroup(e.target.checked)}
                    className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isSupergroup" className="text-sm text-slate-300 cursor-pointer">
                    Включить темы (Supergroup)
                  </label>
                </div>
              </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Поиск пользователей..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1">
            {filteredUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => toggleSelect(u.id)}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-500 font-bold">
                    {u.name?.charAt(0) || "U"}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedUserIds.includes(u.id) ? "bg-blue-600 border-blue-600" : "border-slate-600"}`}>
                  {selectedUserIds.includes(u.id) && <Check size={12} className="text-white" />}
                </div>
              </button>
            ))}
            {filteredUsers.length === 0 && (
              <p className="text-center text-slate-500 text-sm py-4">Пользователи не найдены</p>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-white/5 bg-black/20">
          <button
            onClick={handleCreate}
            disabled={loading || selectedUserIds.length === 0 || (isGroup && !groupName)}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3 rounded-xl transition"
          >
            {loading ? "Создание..." : "Создать"}
          </button>
        </div>
      </div>
    </div>
  );
}
