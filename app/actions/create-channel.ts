"use server"

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createChannel(name: string, isGroup: boolean = true) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const channel = await db.channel.create({
    data: {
      name,
      isGroup,
      members: {
        connect: { id: user.id }
      }
    }
  });

  revalidatePath("/");
  return channel;
}