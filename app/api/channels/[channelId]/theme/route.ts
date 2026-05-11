import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { channelId: string } }) {
  try {
    const user = await getCurrentUser();
    const userId = (user as any)?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const chatTheme = await db.chatTheme.findUnique({
      where: {
        userId_channelId: {
          userId,
          channelId: params.channelId
        }
      }
    });

    return NextResponse.json(chatTheme || { theme: "DEFAULT" });
  } catch (error) {
    console.error("THEME_GET_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { channelId: string } }) {
  try {
    const user = await getCurrentUser();
    const userId = (user as any)?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { theme } = await req.json();

    const updatedTheme = await db.chatTheme.upsert({
      where: {
        userId_channelId: {
          userId,
          channelId: params.channelId
        }
      },
      update: {
        theme
      },
      create: {
        userId,
        channelId: params.channelId,
        theme
      }
    });

    return NextResponse.json(updatedTheme);
  } catch (error) {
    console.error("THEME_POST_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
