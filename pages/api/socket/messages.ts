import { NextApiRequest } from "next";
import { NextApiResponseServerIo } from "../../../types";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponseServerIo) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    const { message, conversationId, topicId, fileUrl, fileType } = req.body;
    console.log("[SOCKET_API_RECV]", { message, conversationId, fileUrl });

    if (!session?.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!conversationId) {
      return res.status(400).json({ error: "Conversation ID missing" });
    }

    if (!message && !fileUrl) {
      return res.status(400).json({ error: "Message content missing" });
    }

    // Сохраняем в БД
    console.log("[DB_SAVING_MESSAGE]...");
    const newMessage = await db.message.create({
      data: {
        text: message || "",
        channelId: conversationId,
        topicId: topicId || null,
        userId: (session.user as any).id,
        attachments: fileUrl ? {
          create: {
            url: fileUrl,
            type: fileType || "IMAGE"
          }
        } : undefined
      },
      include: {
        user: true,
        attachments: true,
      }
    });
    console.log("[DB_SAVED_SUCCESS]", newMessage.id);

    // Эмитим событие через сокет в комнату канала
    const channelKey = topicId 
      ? `chat:${conversationId}:${topicId}:messages`
      : `chat:${conversationId}:messages`;
    
    if (res?.socket?.server?.io) {
      console.log(`Emitting to room ${conversationId} with key ${channelKey}`);
      res.socket.server.io.to(conversationId).emit(channelKey, newMessage);
      
      // Эмитим глобальное событие для обновления списка чатов у всех участников
      res.socket.server.io.emit("chat:new-message", newMessage);
    } else {
      console.error("Socket.io instance not found on res.socket.server");
    }

    return res.status(200).json(newMessage);
  } catch (error) {
    console.error("SOCKET_MESSAGES_POST", error);
    return res.status(500).json({ message: "Internal Error" });
  }
}
