import { NextApiRequest } from "next";
import { NextApiResponseServerIo } from "../../../types";
import { db } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponseServerIo) {
  if (req.method !== "PATCH" && req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await getCurrentUser(req, res);
    const currentUserId = (user as any)?.id;

    if (!currentUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { channelId, userId: memberId } = req.query;

    // ПРОВЕРКА ПРАВ
    const channel = await db.channel.findUnique({
      where: { id: channelId as string },
      include: { admins: true }
    });

    if (!channel) return res.status(404).json({ error: "Channel not found" });

    const isOwner = channel.ownerId === currentUserId;
    const isAdmin = channel.admins.some(a => a.id === currentUserId);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (req.method === "PATCH") {
        const { name, description, icon, isSupergroup } = req.body;
        
        const updatedChannel = await db.channel.update({
          where: { id: channelId as string },
          data: { name, description, icon, isSupergroup },
          include: { members: true, admins: true, topics: true }
        });

        // If enabled topics, ensure at least one topic exists
        if (isSupergroup && updatedChannel.topics.length === 0) {
          await db.topic.create({
            data: {
              name: "General",
              description: "Main discussion topic",
              channelId: channelId as string
            }
          });
        }

       res.socket.server.io.to(channelId as string).emit("channel:update", updatedChannel);
       return res.status(200).json(updatedChannel);
    }

    if (req.method === "DELETE") {
       // Нельзя удалить владельца
       if (memberId === channel.ownerId) {
          return res.status(400).json({ error: "Cannot remove owner" });
       }

       const updatedChannel = await db.channel.update({
         where: { id: channelId as string },
         data: {
           members: { disconnect: { id: memberId as string } },
           admins: { disconnect: { id: memberId as string } }
         },
         include: { members: true, admins: true }
       });

       res.socket.server.io.to(channelId as string).emit("channel:update", updatedChannel);
       // Оповещаем удаленного пользователя (чтобы его выкинуло из чата)
       res.socket.server.io.emit("member:removed", { channelId, userId: memberId });
       
       return res.status(200).json(updatedChannel);
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Error" });
  }
}
