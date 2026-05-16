import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { SocketProvider } from "@/components/providers/socket-provider";
import { SettingsProvider } from "@/components/providers/settings-provider";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <AuthProvider>
          <SettingsProvider>
            <SocketProvider>
              {children}
            </SocketProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}