import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    const currentUserId = (user as any)?.id;

    if (!currentUserId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({ users: [], channels: [], messages: [] });
    }

    const [users, channels, messages] = await Promise.all([
      // Поиск пользователей
      db.user.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { username: { contains: query } },
            { email: { contains: query } },
          ],
          NOT: { id: currentUserId }
        },
        take: 5,
      }),
      // Поиск групп и каналов, в которых состоит пользователь
      db.channel.findMany({
        where: {
          isGroup: true,
          name: { contains: query },
          members: { some: { id: currentUserId } }
        },
        take: 5,
      }),
      // Поиск сообщений по тексту в доступных пользователю чатах
      db.message.findMany({
        where: {
          text: { contains: query },
          channel: { members: { some: { id: currentUserId } } }
        },
        include: {
          user: true,
          channel: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    return NextResponse.json({ users, channels, messages });
  } catch (error) {
    console.error("SEARCH_GET", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
