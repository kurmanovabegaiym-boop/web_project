"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io as ClientIO } from "socket.io-client";
import { useSession } from "next-auth/react";

type SocketContextType = {
  socket: any | null;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    // Ждем, пока сессия загрузится
    if (status === "loading") return;

    // Инициализируем серверный сокет
    fetch("/api/socket/io").catch(err => console.error("Socket init error:", err));

    const socketInstance = new (ClientIO as any)(process.env.NEXT_PUBLIC_SITE_URL!, {
      path: "/api/socket/io",
      addTrailingSlash: false,
      transports: ["websocket"],
    });

    socketInstance.on("connect", () => {
      console.log("[SOCKET_CONNECTED]", socketInstance.id, "Session:", session?.user?.email);
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("[SOCKET_DISCONNECTED]");
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      console.log("[SOCKET_CLEANUP] Removing listeners and disconnecting");
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
    };
  }, [session, status]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
