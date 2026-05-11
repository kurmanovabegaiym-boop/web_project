// app/actions.ts
"use server"
import { db } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import Pusher from "pusher"

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: "eu",
  useTLS: true,
})

export async function sendMessage(formData: FormData) {
  const text = formData.get("text") as string
  const channelId = formData.get("channelId") as string
  const user = await getCurrentUser()
  const userId = (user as any)?.id

  if (!userId || !text || !channelId) return

  const newMessage = await db.message.create({
    data: { 
      text, 
      channelId, 
      userId 
    },
    include: { user: true }
  })

  await pusher.trigger(`chat-${channelId}`, "new-message", newMessage)
  revalidatePath(`/chat/${channelId}`)
}