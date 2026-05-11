import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { channelId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { channelId } = params;

    const topics = await db.topic.findMany({
      where: {
        channelId: channelId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(topics);
  } catch (error) {
    console.error("[TOPICS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { channelId: string } }
) {
  try {
    const user = await getCurrentUser();
    const userId = (user as any)?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { channelId } = params;
    const { name, description } = await req.json();

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    // Check if user is admin or owner
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

    const topic = await db.topic.create({
      data: {
        name,
        description,
        channelId,
      },
    });

    return NextResponse.json(topic);
  } catch (error) {
    console.error("[TOPICS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
