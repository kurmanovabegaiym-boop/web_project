import React from 'react';
import Link from 'next/link';
import { Settings, MessageSquare, Hash, User, LogOut, Plus } from 'lucide-react';

const Sidebar = ({ currentUser }) => {
  // Заглушка для каналов, если база пока не подгрузилась
  const channels = [
    { id: '1', name: 'общий' },
    { id: '2', name: 'разработка' }
  ];

  return (
    <div className="flex flex-col h-full bg-[#090b10] border-r border-white/5">
      {/* Логотип */}
      <div className="p-6">
        <div className="flex items-center space-x-3 group cursor-pointer">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.3)]">
            <MessageSquare className="text-white" size={22} />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">MESSENGER</span>
        </div>
      </div>

      {/* Навигация */}
      <nav className="flex-1 px-4 space-y-6 overflow-y-auto">
        <div>
          <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Меню</p>
          <div className="space-y-1">
            <Link href="/" className="flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all">
              <Hash size={18} />
              <span className="text-sm font-medium">Каналы</span>
            </Link>
            <Link href="/profile" className="flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all">
              <User size={18} />
              <span className="text-sm font-medium">Профиль</span>
            </Link>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between px-4 mb-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Твои чаты</p>
            <Plus size={14} className="text-slate-500 cursor-pointer hover:text-white" />
          </div>
          <div className="space-y-1">
            {channels.map((channel) => (
              <Link 
                key={channel.id} 
                href={`/chat/${channel.id}`} 
                className="flex items-center space-x-3 px-4 py-2 rounded-lg text-slate-400 hover:text-white group"
              >
                <span className="text-blue-500/50 group-hover:text-blue-400">#</span>
                <span className="text-sm truncate">{channel.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Футер с пользователем */}
      <div className="p-4 mt-auto border-t border-white/5">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white/5">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold">
              {currentUser?.name?.[0] || "U"}
            </div>
            <div className="max-w-[100px]">
              <p className="text-xs font-bold text-white truncate">{currentUser?.name || "User"}</p>
            </div>
          </div>
          <LogOut size={14} className="text-slate-500 hover:text-red-400 cursor-pointer" />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;