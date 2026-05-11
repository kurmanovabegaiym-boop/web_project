import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(req: Request) {
  try {
    const uploadDir = join(process.cwd(), "public/uploads");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {}

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new NextResponse("No file uploaded", { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const extension = file.name.split(".").pop();
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
    const path = join(process.cwd(), "public/uploads", filename);

    await writeFile(path, buffer);

    const url = `/uploads/${filename}`;

    return NextResponse.json({ url });
  } catch (error) {
    console.error("UPLOAD_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
