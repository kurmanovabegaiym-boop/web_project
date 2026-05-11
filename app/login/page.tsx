"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import axios from "axios";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("savedEmail");
    const savedPassword = localStorage.getItem("savedPassword");
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(atob(savedPassword));
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isLogin) {
      if (rememberMe) {
        localStorage.setItem("savedEmail", email);
        localStorage.setItem("savedPassword", btoa(password));
      } else {
        localStorage.removeItem("savedEmail");
        localStorage.removeItem("savedPassword");
      }

      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Неверный email или пароль");
      } else {
        // Full page reload clears JS heap and Zustand store automatically
        window.location.href = "/";
      }
    } else {
      try {
        await axios.post("/api/register", { email, password, name });
        if (rememberMe) {
          localStorage.setItem("savedEmail", email);
          localStorage.setItem("savedPassword", btoa(password));
        }

        const res = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
        if (!res?.error) {
          // Full page reload clears JS heap and Zustand store automatically
          window.location.href = "/";
        }
      } catch (err: any) {
        setError(err.response?.data || "Ошибка регистрации");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="bg-[#1e293b] p-8 rounded-2xl w-full max-w-md shadow-2xl border border-white/5">
        <h1 className="text-3xl font-black italic text-blue-500 text-center mb-8">
          NOVA CHAT
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-slate-400 text-sm mb-2">Имя</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                placeholder="John Doe"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-slate-400 text-sm mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
              placeholder="test@test.com"
              required
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-2">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input 
              type="checkbox" 
              id="remember" 
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 bg-slate-900 border-slate-700 rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="remember" className="text-sm text-slate-400 cursor-pointer">
              Запомнить меня
            </label>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-500 transition-all mt-4"
          >
            {isLogin ? "Войти в чат" : "Зарегистрироваться"}
          </button>
        </form>

        <p className="text-slate-400 text-sm text-center mt-6">
          {isLogin ? "Нет аккаунта? " : "Уже есть аккаунт? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-500 hover:underline"
          >
            {isLogin ? "Создать" : "Войти"}
          </button>
        </p>
      </div>
    </div>
  );
}