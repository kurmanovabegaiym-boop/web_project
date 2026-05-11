import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { userId: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const profile = await db.user.findUnique({
      where: {
        id: params.userId
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        background: true,
        bio: true,
        status: true,
        createdAt: true,
      }
    });

    if (!profile) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("USER_GET_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { userId: string } }) {
  try {
    const currentUser = await getCurrentUser();
    const currentUserId = (currentUser as any)?.id;

    if (!currentUserId || currentUserId !== params.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name, username, bio, image, background } = body;

    // If updating username, check for uniqueness
    if (username) {
      const existing = await db.user.findFirst({
        where: {
          username,
          NOT: { id: currentUserId }
        }
      });

      if (existing) {
        return new NextResponse("Username already taken", { status: 400 });
      }
    }

    const updatedUser = await db.user.update({
      where: {
        id: currentUserId
      },
      data: {
        name,
        username,
        bio,
        image,
        background
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("USER_PATCH_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
