import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    const userId = (user as any)?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");
    const topicId = searchParams.get("topicId");
    const cursor = searchParams.get("cursor");
    const limit = 30;

    if (!channelId) {
      return new NextResponse("Channel ID is required", { status: 400 });
    }

    // DIAGNOSTIC LOGS
    const totalInChannel = await db.message.count({ 
      where: { 
        channelId, 
        topicId: topicId || null 
      } 
    });
    console.log(`[MESSAGES_DIAGNOSTIC] Channel: ${channelId}, User: ${userId || "GUEST"}, Total in DB for this channel: ${totalInChannel}`);

    const messages = await db.message.findMany({
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      where: {
        channelId,
        topicId: topicId || null,
        // Apply filter ONLY if we have a valid userId
        ...(userId ? {
          deletedBy: {
            none: {
              id: userId
            }
          }
        } : {})
      },
      include: {
        user: true,
        attachments: true,
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    console.log(`[MESSAGES_GET_SUCCESS] Found: ${messages.length} messages (after filtering)`);

    let nextCursor: string | null = null;

    if (messages.length > limit) {
      nextCursor = messages[limit].id;
    }

    const data = {
      messages: messages.slice(0, limit).reverse(), // Reverse back to chronological order
      nextCursor,
      hasMore: !!nextCursor
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("MESSAGES_GET", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const userId = (user as any)?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { message, conversationId, topicId, fileUrl, fileType, fileName } = body;

    if (!conversationId) {
      return new NextResponse("Conversation ID is required", { status: 400 });
    }

    if (!message && !fileUrl) {
      return new NextResponse("Message or file is required", { status: 400 });
    }

    let newMessage = await db.message.create({
      data: {
        text: message || "",
        channelId: conversationId,
        topicId: topicId || null,
        userId: userId,
      },
      include: {
        user: true,
        attachments: true,
      }
    });

    if (fileUrl && fileType) {
      await db.attachment.create({
        data: {
          url: fileUrl,
          type: fileType,
          name: fileName || "file",
          messageId: newMessage.id
        }
      });
      
      // Refetch to include the new attachment
      newMessage = await db.message.findUnique({
        where: {
          id: newMessage.id
        },
        include: {
          user: true,
          attachments: true
        }
      }) as any;
    }

    // Trigger pusher event to all subscribers of this conversation
    await pusherServer.trigger(conversationId, "messages:new", newMessage);

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error("MESSAGES_POST", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
