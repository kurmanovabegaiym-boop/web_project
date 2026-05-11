import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const currentUserId = (user as any)?.id;

    if (!currentUserId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { name, isGroup, memberIds, icon, isSupergroup } = await req.json();

    if (!memberIds || memberIds.length === 0) {
      return new NextResponse("Members are required", { status: 400 });
    }

    // Add current user to members if not already included
    const allMembers = memberIds.includes(currentUserId) 
      ? memberIds 
      : [...memberIds, currentUserId];

    // If it's a 1-on-1 chat, check if it already exists
    if (!isGroup && allMembers.length === 2) {
      const existingChannel = await db.channel.findFirst({
        where: {
          isGroup: false,
          AND: [
            { members: { some: { id: allMembers[0] } } },
            { members: { some: { id: allMembers[1] } } }
          ]
        }
      });

      if (existingChannel) {
        return NextResponse.json(existingChannel);
      }
    }

    const channel = await db.channel.create({
      data: {
        name: isGroup ? name : null,
        isGroup: isGroup || false,
        isSupergroup: isSupergroup || false,
        icon: isGroup ? icon : null,
        ownerId: currentUserId,
        members: {
          connect: allMembers.map((id: string) => ({ id }))
        },
        topics: isSupergroup ? {
          create: {
            name: "General",
            description: "Main discussion topic"
          }
        } : undefined
      }
    });

    return NextResponse.json(channel);
  } catch (error) {
    console.error("CHANNELS_POST", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
