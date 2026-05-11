import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !(user as any).id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const users = await db.user.findMany({
      where: {
        NOT: {
          id: (user as any).id
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        status: true,
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("USERS_GET", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
