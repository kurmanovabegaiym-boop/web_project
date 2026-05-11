import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { channelId: string } }) {
  try {
    const user = await getCurrentUser();
    const currentUserId = (user as any)?.id;

    if (!currentUserId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const channel = await db.channel.findUnique({
      where: { id: params.channelId },
      include: {
        members: true,
        admins: true,
      }
    });

    return NextResponse.json(channel);
  } catch (error) {
    console.error("CHANNEL_GET", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { channelId: string } }) {
  try {
    const user = await getCurrentUser();
    const currentUserId = (user as any)?.id;

    if (!currentUserId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { name, description, icon } = await req.json();

    // Check if user has permission (Owner or Admin)
    const channel = await db.channel.findUnique({
      where: { id: params.channelId },
      include: { admins: true }
    });

    if (!channel) return new NextResponse("Not Found", { status: 404 });

    const isOwner = channel.ownerId === currentUserId;
    const isAdmin = channel.admins.some(a => a.id === currentUserId);

    if (!isOwner && !isAdmin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const updatedChannel = await db.channel.update({
      where: { id: params.channelId },
      data: { name, description, icon }
    });

    return NextResponse.json(updatedChannel);
  } catch (error) {
    console.error("CHANNEL_PATCH", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
