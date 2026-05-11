"use client";

import { useEffect } from "react";
import { useSocket } from "@/components/providers/socket-provider";

type ChatSocketProps = {
  addKey: string;
  queryKey: string;
  callback: (message: any) => void;
};

export const useChatSocket = ({ addKey, queryKey, callback }: ChatSocketProps) => {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const eventHandler = (message: any) => {
      console.log("[SOCKET_RECV]", addKey, message);
      callback(message);
    };

    socket.on(addKey, eventHandler);

    return () => {
      socket.off(addKey, eventHandler);
    };
  }, [socket, addKey, callback]);
};
