"use client";

import { useState, useEffect } from "react";
import { X, Camera, Save, Image as ImageIcon } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/hooks/useChatStore";

export default function EditProfileModal({ currentUser }: { currentUser: any }) {
  const { isEditingProfile, setIsEditingProfile } = useChatStore();
  const [name, setName] = useState(currentUser?.name || "");
  const [username, setUsername] = useState(currentUser?.username || "");
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [image, setImage] = useState(currentUser?.image || "");
  const [background, setBackground] = useState(currentUser?.background || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Update local state if currentUser changes
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setUsername(currentUser.username || "");
      setBio(currentUser.bio || "");
      setImage(currentUser.image || "");
      setBackground(currentUser.background || "");
    }
  }, [currentUser]);

  if (!isEditingProfile) return null;

  const handleSave = async () => {
    try {
      setLoading(true);
      setError("");
      console.log("[PROFILE_UPDATE_START]", { name, username, bio, image, background });
      const res = await axios.patch(`/api/users/${currentUser.id}`, {
        name,
        username,
        bio,
        image,
        background
      });
      console.log("[PROFILE_UPDATE_SUCCESS]", res.data);
      setIsEditingProfile(false);
      router.refresh();
    } catch (err: any) {
      console.error("[PROFILE_UPDATE_ERROR]", err);
      setError(err.response?.data || "Ошибка сохранения");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'background') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", file);

      console.log("[PROFILE_FILE_UPLOAD_START]", type);
      const res = await axios.post("/api/upload", formData);
      console.log("[PROFILE_FILE_UPLOAD_SUCCESS]", res.data.url);

      if (type === 'avatar') setImage(res.data.url);
      else setBackground(res.data.url);
    } catch (err) {
      console.error("[PROFILE_FILE_UPLOAD_ERROR]", err);
      setError("Ошибка при загрузке изображения");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#11151c] w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden my-8">
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
          <h2 className="text-lg font-bold text-white">Редактировать профиль</h2>
          <button onClick={() => setIsEditingProfile(false)} className="text-slate-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        <div className="relative w-full h-40 bg-slate-800">
          {background ? (
            <img src={background} alt="Background" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
          )}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/50 transition-opacity cursor-pointer">
            <label className="w-full h-full flex items-center justify-center cursor-pointer">
              <input 
                type="file" 
                className="hidden" 
                onChange={(e) => handleFileUpload(e, 'background')} 
                accept="image/*"
              />
              <div className="flex flex-col items-center gap-2">
                <ImageIcon className="text-white" size={24} />
                <span className="text-white text-xs font-medium">Изменить фон</span>
              </div>
            </label>
          </div>

          {/* Avatar */}
          <div className="absolute -bottom-10 left-6">
            <div className="relative w-20 h-20 rounded-full border-4 border-[#11151c] bg-slate-800 flex items-center justify-center overflow-hidden">
              {image ? (
                <img src={image} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-blue-500">{name.charAt(0) || "U"}</span>
              )}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/50 transition-opacity cursor-pointer">
                <label className="w-full h-full flex items-center justify-center cursor-pointer">
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={(e) => handleFileUpload(e, 'avatar')} 
                    accept="image/*"
                  />
                  <Camera className="text-white" size={20} />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 pt-14 space-y-4">
          {error && <p className="text-red-500 text-sm bg-red-500/10 p-3 rounded-lg">{error}</p>}

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Имя</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Юзернейм</label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-slate-500">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                placeholder="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">О себе</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition resize-none"
              placeholder="Расскажите о себе..."
            />
          </div>
        </div>

        <div className="p-4 border-t border-white/5 bg-black/20 flex justify-end gap-3">
          <button
            onClick={() => setIsEditingProfile(false)}
            className="px-5 py-2.5 rounded-xl font-medium text-slate-300 hover:text-white hover:bg-white/5 transition"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !name}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-400 text-white font-bold rounded-xl transition flex items-center gap-2"
          >
            {loading ? "Сохранение..." : <><Save size={18} /> Сохранить</>}
          </button>
        </div>
      </div>
    </div>
  );
}
