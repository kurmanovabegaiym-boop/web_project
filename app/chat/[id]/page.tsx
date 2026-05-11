import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";

export default async function ChatByIdPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const channel = await db.channel.findUnique({
    where: { id: params.id },
    include: {
      members: { select: { id: true } },
      messages: {
        include: { user: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  // Channel doesn't exist → 404
  if (!channel) return notFound();

  // User is not a member → redirect to home
  const isMember = channel.members.some((m) => m.id === (user as any).id);
  if (!isMember) redirect("/");

  return (
    <div className="flex flex-col h-full bg-black/10 backdrop-blur-md">
      <header className="h-20 border-b border-white/5 flex items-center px-8 justify-between bg-white/5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white"># {channel.name}</h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
            {channel.members.length} участников
          </p>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {channel.messages.map((msg: any) => (
          <div key={msg.id} className={`flex ${msg.userId === (user as any).id ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[70%] p-4 rounded-3xl shadow-xl ${
              msg.userId === (user as any).id
                ? "bg-blue-600 text-white rounded-br-none"
                : "bg-white/10 text-slate-200 border border-white/5 rounded-bl-none"
            }`}>
              <p className="text-[10px] opacity-50 mb-1 font-bold">{msg.user.name}</p>
              <p className="text-sm leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
