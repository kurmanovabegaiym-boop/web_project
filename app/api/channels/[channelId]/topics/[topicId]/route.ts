import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: { channelId: string; topicId: string } }
) {
  try {
    const user = await getCurrentUser();
    const userId = (user as any)?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { channelId, topicId } = params;
    const { name, description } = await req.json();

    const channel = await db.channel.findUnique({
      where: {
        id: channelId,
      },
      include: {
        admins: true,
      },
    });

    if (!channel) {
      return new NextResponse("Channel not found", { status: 404 });
    }

    const isOwner = channel.ownerId === userId;
    const isAdmin = channel.admins.some((admin) => admin.id === userId);

    if (!isOwner && !isAdmin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const topic = await db.topic.update({
      where: {
        id: topicId,
        channelId: channelId,
      },
      data: {
        name,
        description,
      },
    });

    return NextResponse.json(topic);
  } catch (error) {
    console.error("[TOPIC_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { channelId: string; topicId: string } }
) {
  try {
    const user = await getCurrentUser();
    const userId = (user as any)?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { channelId, topicId } = params;

    const channel = await db.channel.findUnique({
      where: {
        id: channelId,
      },
      include: {
        admins: true,
      },
    });

    if (!channel) {
      return new NextResponse("Channel not found", { status: 404 });
    }

    const isOwner = channel.ownerId === userId;
    const isAdmin = channel.admins.some((admin) => admin.id === userId);

    if (!isOwner && !isAdmin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const topic = await db.topic.delete({
      where: {
        id: topicId,
        channelId: channelId,
      },
    });

    return NextResponse.json(topic);
  } catch (error) {
    console.error("[TOPIC_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
