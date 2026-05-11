import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import ChatContainer from "@/components/ChatContainer";
import { redirect } from "next/navigation";

export default async function Home() {
  const sessionUser = await getCurrentUser();
  
  if (!sessionUser || !(sessionUser as any).id) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: (sessionUser as any).id }
  });

  if (!user) {
    redirect("/login");
  }

  const rawChannels = await db.channel.findMany({
    where: {
      members: {
        some: { id: (user as any).id }
      }
    },
    include: {
      members: true,
      messages: {
        where: {
          userId: { not: (user as any).id },
          status: { not: "READ" }
        },
        select: { id: true }
      }
    }
  });

  const channels = rawChannels.map(channel => ({
    ...channel,
    unreadCount: channel.messages.length
  }));

  return (
    <div className="flex h-screen bg-[#09090b] text-white antialiased font-sans">
      <Sidebar channels={channels} currentUser={user as any} />
      <ChatContainer currentUserId={(user as any).id} />
    </div>
  );
}