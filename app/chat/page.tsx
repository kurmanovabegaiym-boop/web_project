import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";

export default async function ChatPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const channel = await db.channel.findUnique({
    where: { id: params.id },
    include: {
      messages: {
        include: { user: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!channel) return notFound();

  return (
    <div className="flex flex-col h-full bg-black/10 backdrop-blur-md">
      {/* Шапка чата */}
      <header className="h-20 border-b border-white/5 flex items-center px-8 justify-between bg-white/5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white"># {channel.name}</h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Общий канал</p>
        </div>
      </header>

      {/* Список сообщений */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {channel.messages.map((msg: any) => (
          <div key={msg.id} className={`flex ${msg.userId === user.id ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[70%] p-4 rounded-3xl shadow-xl ${
              msg.userId === user.id 
                ? "bg-blue-600 text-white rounded-br-none" 
                : "bg-white/10 text-slate-200 border border-white/5 rounded-bl-none"
            }`}>
              <p className="text-[10px] opacity-50 mb-1 font-bold">{msg.user.name}</p>
              <p className="text-sm leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Поле ввода */}
      <div className="p-6 bg-white/5 border-t border-white/5">
        <div className="relative group">
          <input 
            type="text" 
            placeholder={`Написать в #${channel.name}`}
            className="w-full bg-white/10 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-500"
          />
          <button className="absolute right-3 top-2.5 bg-blue-600 hover:bg-blue-500 p-2 rounded-xl transition-colors shadow-lg shadow-blue-600/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}