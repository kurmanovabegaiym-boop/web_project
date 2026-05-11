"use client";
import { signOut } from "next-auth/react";
import { useChatStore } from "@/hooks/useChatStore";

export default function SignOutButton() {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <button
      onClick={handleSignOut}
      className="text-xs text-slate-400 hover:text-red-400 transition-colors uppercase tracking-wider font-medium"
    >
      Выйти
    </button>
  );
}