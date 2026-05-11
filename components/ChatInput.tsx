"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { SendHorizonal, Paperclip, Mic, Square } from "lucide-react";
import { useSocket } from "@/components/providers/socket-provider";
import { useChatStore } from "@/hooks/useChatStore";
import { useRef } from "react";
import { UploadButton } from "@/lib/uploadthing";

interface ChatInputProps {
  conversationId: string;
  topicId: string | null;
  currentUser: any;
}

export default function ChatInput({ conversationId, topicId, currentUser }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const { socket } = useSocket();
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!message || !socket) {
      if (isTyping) {
        socket.emit("chat:stop-typing", { channelId: conversationId, userId: currentUser?.id });
        setIsTyping(false);
      }
      return;
    }

    if (!isTyping) {
      socket.emit("chat:typing", { 
        channelId: conversationId, 
        userId: currentUser?.id, 
        userName: currentUser?.name 
      });
      setIsTyping(true);
    }

    const timeout = setTimeout(() => {
      socket.emit("chat:stop-typing", { channelId: conversationId, userId: currentUser?.id });
      setIsTyping(false);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [message, socket, conversationId, currentUser, isTyping]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Safari compatibility: check for supported MIME types
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") 
        ? "audio/webm" 
        : "audio/mp4";
      
      console.log("[AUDIO_RECORDING_START]", { mimeType });
      
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          console.log("[AUDIO_CHUNK_RECV]", e.data.size);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        console.log("[AUDIO_RECORDING_STOP]", { 
          totalSize: blob.size, 
          type: blob.type 
        });

        if (blob.size < 100) {
          console.warn("[AUDIO_EMPTY_BLOB] Recording might have failed");
          return;
        }

        const extension = mimeType.split("/")[1];
        const file = new File([blob], `voice.${extension}`, { type: mimeType });
        
        const formData = new FormData();
        formData.append("file", file);

        try {
          const res = await axios.post("/api/upload", formData);
          await axios.post("/api/socket/messages", {
            fileUrl: res.data.url,
            fileType: "AUDIO",
            conversationId,
            topicId
          });
        } catch (err) {
          console.error("Voice upload failed", err);
        }

        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access denied", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const { addMessage } = useChatStore();

  const onSubmit = async () => {
    if (!message) return;
    const val = message;
    
    try {
      const tempId = Date.now().toString();
      const optimisticMessage = {
        id: tempId,
        text: val,
        userId: currentUser.id,
        user: currentUser,
        createdAt: new Date().toISOString(),
        isOptimistic: true
      };

      // Добавляем сразу в UI
      addMessage(optimisticMessage);
      
      setMessage("");
      setIsTyping(false);
      if (socket) {
        socket.emit("chat:stop-typing", { channelId: conversationId, userId: currentUser?.id });
      }
      
      const response = await axios.post("/api/socket/messages", { 
        message: val, 
        conversationId,
        topicId
      });

      // Сокет сам пришлет подтверждение (настоящее сообщение), 
      // и так как у них будут разные ID (tempId vs DB id), 
      // нам нужно быть аккуратными, чтобы не было дублей. 
      // В addMessage в store я добавил проверку на ID.
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessage(val);
    }
  };

  return (
    <div className="p-4 bg-[#11151c]/50 backdrop-blur-lg border-t border-white/5">
      <div className="flex items-center gap-3 max-w-5xl mx-auto">
        <input 
          type="file" 
          id="file-upload" 
          className="hidden" 
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              console.log("[LOCAL_UPLOAD_START]", file.name);
              const formData = new FormData();
              formData.append("file", file);
              
              try {
                const res = await axios.post("/api/upload", formData, {
                  headers: { "Content-Type": "multipart/form-data" }
                });
                
                console.log("[LOCAL_UPLOAD_SUCCESS]", res.data.url);
                await axios.post("/api/socket/messages", { 
                  fileUrl: res.data.url, 
                  fileType: "IMAGE",
                  conversationId,
                  topicId
                });
              } catch (err) {
                console.error("[LOCAL_UPLOAD_ERROR]", err);
                alert("Ошибка загрузки файла");
              }
            }
          }}
        />
        <button 
          onClick={() => document.getElementById("file-upload")?.click()}
          className="p-2 text-slate-400 hover:text-white transition"
        >
          <Paperclip size={22} />
        </button>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          placeholder="Написать сообщение..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition"
        />
        <button 
          onClick={isRecording ? stopRecording : startRecording}
          className={`p-2.5 rounded-xl transition ${isRecording ? 'bg-red-500 animate-pulse text-white' : 'text-slate-400 hover:text-white'}`}
        >
          {isRecording ? <Square size={20} /> : <Mic size={20} />}
        </button>
        <button 
          onClick={onSubmit}
          className="p-2.5 bg-blue-600 rounded-xl text-white hover:bg-blue-500 transition shadow-lg shadow-blue-600/20"
        >
          <SendHorizonal size={20} />
        </button>
      </div>
    </div>
  );
}