import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return new NextResponse("Missing fields", { status: 400 });
    }

    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return new NextResponse("Email already exists", { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("REGISTER_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
