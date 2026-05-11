import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";

// Импорт из этой же папки (используем ./)
import { db } from "./db"; 

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Неверные данные");
        }

        // Оставляем только ОДИН раз объявление через const
const user = await db.user.findUnique({
  where: { 
    email: credentials.email 
  }
});

// Проверяем через .password (так как мы выяснили, что в схеме поле называется так)
if (!user || !user.password) {
  throw new Error("Пользователь не найден или пароль не установлен");
}

const isCorrectPassword = await bcrypt.compare(
  credentials.password,
  user.password
);

        if (!isCorrectPassword) {
          throw new Error("Неверный пароль");
        }

        return user;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};

import { getToken } from "next-auth/jwt";

// Функция, которую мы вызываем в API и в page.tsx
export async function getCurrentUser(req?: any, res?: any) {
  if (req && res) {
    const token = await getToken({ req });
    if (!token) return null;
    return { id: token.id, email: token.email, name: token.name };
  }
  const session = await getServerSession(authOptions);
  return session?.user;
}