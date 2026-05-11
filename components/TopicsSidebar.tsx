"use client";

import { useEffect, useState } from "react";
import { Plus, Hash, MoreVertical, Edit2, Trash2, MessageSquare } from "lucide-react";
import { useChatStore } from "@/hooks/useChatStore";
import axios from "axios";
import CreateTopicModal from "./CreateTopicModal";

interface Topic {
  id: string;
  name: string;
  description: string | null;
}

interface TopicsSidebarProps {
  channelId: string;
  isAdmin: boolean;
}

export default function TopicsSidebar({ channelId, isAdmin }: TopicsSidebarProps) {
  const { 
    topics, 
    setTopics, 
    activeTopicId, 
    setActiveTopicId, 
    addTopic, 
    updateTopic, 
    removeTopic 
  } = useChatStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [topicToEdit, setTopicToEdit] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/channels/${channelId}/topics`);
        setTopics(res.data);
        
        // If no active topic, select the first one (General)
        if (!activeTopicId && res.data.length > 0) {
          setActiveTopicId(res.data[0].id);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [channelId]);

  const handleDeleteTopic = async (topicId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Удалить этот топик и все сообщения в нем?")) return;

    try {
      await axios.delete(`/api/channels/${channelId}/topics/${topicId}`);
      removeTopic(topicId);
      if (activeTopicId === topicId) {
        setActiveTopicId(topics[0]?.id || null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleEditTopic = (topic: Topic, e: React.MouseEvent) => {
    e.stopPropagation();
    setTopicToEdit(topic);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="w-64 border-r border-white/5 bg-black/20 flex flex-col items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-64 border-r border-white/5 bg-black/20 flex flex-col h-full z-20">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <MessageSquare size={16} /> Топики
        </h3>
        {isAdmin && (
          <button 
            onClick={() => { setTopicToEdit(null); setIsModalOpen(true); }}
            className="p-1.5 hover:bg-white/5 rounded-lg text-blue-500 transition"
            title="Создать топик"
          >
            <Plus size={18} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {topics.map((topic) => (
          <div
            key={topic.id}
            onClick={() => setActiveTopicId(topic.id)}
            className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
              activeTopicId === topic.id 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
              activeTopicId === topic.id ? "bg-white/20" : "bg-white/5"
            }`}>
              <Hash size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{topic.name}</p>
              {topic.description && (
                <p className={`text-[10px] truncate opacity-60 ${activeTopicId === topic.id ? "text-white" : "text-slate-500"}`}>
                  {topic.description}
                </p>
              )}
            </div>

            {isAdmin && (
              <div className={`flex items-center opacity-0 group-hover:opacity-100 transition ${activeTopicId === topic.id ? "text-white" : "text-slate-500"}`}>
                <button 
                  onClick={(e) => handleEditTopic(topic, e)}
                  className="p-1 hover:bg-white/10 rounded"
                >
                  <Edit2 size={12} />
                </button>
                <button 
                  onClick={(e) => handleDeleteTopic(topic.id, e)}
                  className="p-1 hover:bg-white/10 rounded text-red-400"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}
          </div>
        ))}

        {topics.length === 0 && (
          <div className="p-4 text-center">
            <p className="text-xs text-slate-500">Нет топиков</p>
          </div>
        )}
      </div>

      <CreateTopicModal 
        channelId={channelId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(topic) => {
          if (topicToEdit) updateTopic(topic);
          else addTopic(topic);
        }}
        topicToEdit={topicToEdit}
      />
    </div>
  );
}
