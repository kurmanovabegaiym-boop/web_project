import { NextApiRequest } from "next";
import { NextApiResponseServerIo } from "../../../../types";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponseServerIo) {
  if (req.method !== "PATCH" && req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    const userId = (session?.user as any)?.id;
    const { messageId } = req.query;
    const { message: newText } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!messageId) {
      return res.status(400).json({ error: "Message ID missing" });
    }

    const existingMessage = await db.message.findUnique({
      where: { id: messageId as string },
      include: { user: true, attachments: true }
    });

    if (!existingMessage) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (req.method === "PATCH" && existingMessage.userId !== userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (req.method === "PATCH") {
      console.log("[EDIT_MESSAGE_REQUEST]", { messageId, newText });
      
      if (!newText) {
        return res.status(400).json({ error: "Message content missing" });
      }

      const updatedMessage = await db.message.update({
        where: { id: messageId as string },
        data: { 
          text: newText,
          editedAt: new Date()
        } as any,
        include: { user: true, attachments: true }
      });

      console.log("[EDIT_MESSAGE_SUCCESS]", updatedMessage);

      const updateKey = `chat:${existingMessage.channelId}:messages:update`;
      if (existingMessage.topicId) {
        const topicUpdateKey = `chat:${existingMessage.channelId}:${existingMessage.topicId}:messages:update`;
        console.log(`[SOCKET_EMIT] ${topicUpdateKey}`);
        res.socket.server.io.to(existingMessage.channelId).emit(topicUpdateKey, updatedMessage);
      }
      
      console.log(`[SOCKET_EMIT] ${updateKey}`);
      res.socket.server.io.to(existingMessage.channelId).emit(updateKey, updatedMessage);

      return res.status(200).json(updatedMessage);
    }

    if (req.method === "DELETE") {
      const { type } = req.query; // "me" or "everyone"
      console.log("[DELETE_MESSAGE_REQUEST]", { messageId, type, userId });

      if (type === "me") {
        // Soft delete for the current user
        const updatedMessage = await db.message.update({
          where: { id: messageId as string },
          data: {
            deletedBy: {
              connect: { id: userId }
            }
          } as any
        });
        return res.status(200).json(updatedMessage);
      }

      // Hard delete for everyone
      // Check if user is author OR admin/owner
      const channel = await db.channel.findUnique({
        where: { id: existingMessage.channelId },
        include: { admins: true }
      });

      const isAuthor = existingMessage.userId === userId;
      const isOwner = channel?.ownerId === userId;
      const isAdmin = channel?.admins.some(a => a.id === userId);

      if (!isAuthor && !isOwner && !isAdmin) {
        return res.status(403).json({ error: "Forbidden" });
      }

      console.log("[HARD_DELETE_EXECUTION]", { messageId, channelId: existingMessage.channelId, userId });
      const deletedMessage = await db.message.delete({
        where: { id: messageId as string },
        include: { user: true, attachments: true }
      });

      const deleteKey = `chat:${existingMessage.channelId}:messages:delete`;
      if (existingMessage.topicId) {
        const topicDeleteKey = `chat:${existingMessage.channelId}:${existingMessage.topicId}:messages:delete`;
        console.log(`[SOCKET_EMIT] ${topicDeleteKey}`);
        res.socket.server.io.to(existingMessage.channelId).emit(topicDeleteKey, deletedMessage);
      }
      
      console.log(`[SOCKET_EMIT] ${deleteKey}`);
      res.socket.server.io.to(existingMessage.channelId).emit(deleteKey, deletedMessage);

      return res.status(200).json(deletedMessage);
    }
  } catch (error) {
    console.error("[MESSAGE_ID_API]", error);
    return res.status(500).json({ message: "Internal Error" });
  }
}
