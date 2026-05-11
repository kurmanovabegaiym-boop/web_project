import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const userId = (user as any)?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { channelId } = await req.json();

    if (!channelId) {
      return new NextResponse("Channel ID is required", { status: 400 });
    }

    // Находим все непрочитанные сообщения в этом чате от других пользователей
    const unreadMessages = await db.message.findMany({
      where: {
        channelId,
        userId: { not: userId },
        status: { not: "READ" }
      }
    });

    if (unreadMessages.length === 0) {
      return NextResponse.json({ count: 0 });
    }

    // Обновляем статус сообщений
    await db.message.updateMany({
      where: {
        id: { in: unreadMessages.map(m => m.id) }
      },
      data: {
        status: "READ"
      }
    });

    // Создаем записи ReadReceipt для каждого сообщения
    for (const m of unreadMessages) {
      try {
        await db.readReceipt.upsert({
          where: {
            userId_messageId: {
              userId,
              messageId: m.id
            }
          },
          create: {
            userId,
            messageId: m.id
          },
          update: {}
        });
      } catch (e) {}
    }

    return NextResponse.json({ count: unreadMessages.length, messageIds: unreadMessages.map(m => m.id) });
  } catch (error) {
    console.error("MESSAGES_READ_POST", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
