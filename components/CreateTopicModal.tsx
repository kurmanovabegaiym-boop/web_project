"use client";

import { useState } from "react";
import { X } from "lucide-react";
import axios from "axios";

interface CreateTopicModalProps {
  channelId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (topic: any) => void;
  topicToEdit?: any;
}

export default function CreateTopicModal({ 
  channelId, 
  isOpen, 
  onClose, 
  onSuccess,
  topicToEdit 
}: CreateTopicModalProps) {
  const [name, setName] = useState(topicToEdit?.name || "");
  const [description, setDescription] = useState(topicToEdit?.description || "");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      setLoading(true);
      if (topicToEdit) {
        const res = await axios.patch(`/api/channels/${channelId}/topics/${topicToEdit.id}`, {
          name,
          description
        });
        onSuccess(res.data);
      } else {
        const res = await axios.post(`/api/channels/${channelId}/topics`, {
          name,
          description
        });
        onSuccess(res.data);
      }
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-[#11151c] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">
            {topicToEdit ? "Редактировать топик" : "Создать новый топик"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Название топика</label>
            <input
              autoFocus
              type="text"
              placeholder="Напр. Флуд, Важное, Мемы..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 mt-1 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Описание (необязательно)</label>
            <textarea
              placeholder="О чем этот топик?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 mt-1 text-white focus:outline-none focus:border-blue-500 h-24 resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading || !name}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3 rounded-xl transition"
            >
              {loading ? "Сохранение..." : (topicToEdit ? "Сохранить" : "Создать")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
