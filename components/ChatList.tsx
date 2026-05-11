import React from 'react'
import Link from 'next/link'
import { Hash, Plus, User as UserIcon } from 'lucide-react'
import { db } from "@/lib/prisma"

interface ChatListProps {
  currentUser: any
}

export default async function ChatList({ currentUser }: ChatListProps) {
  // Пытаемся получить каналы. Если база пуста или ошибка — используем пустой массив.
  let channels: any[] = []
  try {
    channels = await db.channel.findMany({
      where: {
        members: {
          some: { id: currentUser?.id }
        }
      },
      include: {
        members: true
      },
      orderBy: { createdAt: 'asc' }
    })
  } catch (error) {
    console.error("Ошибка при загрузке каналов:", error)
  }

  return (
    <div className="flex flex-col h-full bg-[#090b10]/20 backdrop-blur-xl">
      <div className="p-6">
        <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-2xl border border-white/10 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center font-bold text-white">
            {currentUser?.name ? currentUser.name[0].toUpperCase() : <UserIcon size={18}/>}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-black text-white truncate">
              {currentUser?.name || 'Пользователь'}
            </p>
            <div className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[9px] text-green-500 font-bold uppercase tracking-tighter">Online</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 overflow-y-auto">
        <div className="flex items-center justify-between px-2 mb-4">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Каналы</span>
          <Plus size={14} className="text-slate-500 cursor-pointer hover:text-white transition-colors" />
        </div>

        <div className="space-y-1">
          {/* Если channels существует и это массив, проходим по нему */}
          {channels && channels.length > 0 ? (
            channels.map((channel: any) => (
              <Link
                key={channel.id}
                href={`/chat/${channel.id}`}
                className="flex items-center space-x-3 px-4 py-3 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white transition-all group border border-transparent hover:border-white/5"
              >
                <Hash size={18} className="text-slate-600 group-hover:text-blue-500" />
                <span className="text-sm font-semibold truncate">{channel.name}</span>
              </Link>
            ))
          ) : (
            <div className="mt-10 text-center">
              <p className="text-[10px] text-slate-600 italic">Каналы не найдены</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}