import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params }: { params: { channelId: string; userId: string } }
) {
  try {
    const user = await getCurrentUser();
    const currentUserId = (user as any)?.id;

    if (!currentUserId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { channelId, userId } = params;

    // Check permissions
    const channel = await db.channel.findUnique({
      where: { id: channelId },
      include: { admins: true }
    });

    if (!channel) return new NextResponse("Not Found", { status: 404 });

    const isOwner = channel.ownerId === currentUserId;
    const isAdmin = channel.admins.some(a => a.id === currentUserId);

    if (!isOwner && !isAdmin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Cannot remove owner
    if (userId === channel.ownerId) {
      return new NextResponse("Cannot remove owner", { status: 400 });
    }

    const updatedChannel = await db.channel.update({
      where: { id: channelId },
      data: {
        members: {
          disconnect: { id: userId }
        },
        admins: {
          disconnect: { id: userId }
        }
      }
    });

    return NextResponse.json(updatedChannel);
  } catch (error) {
    console.error("MEMBER_DELETE", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
