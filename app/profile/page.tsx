import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { User, Mail, Shield, Calendar } from "lucide-react";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="h-full overflow-y-auto bg-white/5">
      {/* Header / Banner */}
      <div className="h-48 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 border-b border-white/5 relative">
        <div className="absolute -bottom-16 left-12">
          <div className="w-32 h-32 rounded-[2.5rem] bg-[#0e1117] p-2">
            <div className="w-full h-full rounded-[2rem] bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-4xl font-black text-white shadow-2xl">
              {user.name?.[0]}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-20 px-12 pb-12">
        <div className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2">{user.name}</h1>
            <p className="text-blue-400 font-medium flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 shadow-[0_0_10px_rgba(59,130,246,1)]" />
              Online
            </p>
          </div>
          <button className="bg-white text-black px-6 py-3 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all">
            Редактировать
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem]">
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6">Личные данные</h3>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Имя пользователя</p>
                  <p className="text-white font-medium">{user.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Email адрес</p>
                  <p className="text-white font-medium">{user.email}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem]">
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6">Безопасность</h3>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
                  <Shield size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Статус аккаунта</p>
                  <p className="text-green-500 font-bold">Подтвержден</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">ID пользователя</p>
                  <p className="text-white font-mono text-xs">{user.id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}