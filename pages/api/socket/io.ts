import { Server as NetServer } from "http";
import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";
import { NextApiResponseServerIo } from "../../../types";

export const config = {
  api: {
    bodyParser: false,
  },
};

// Используем глобальную переменную для хранения инстанса сокета в режиме разработки
// Это предотвращает дублирование серверов при горячей перезагрузке (Hot Reload)
const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIo) => {
  if (!res.socket.server.io) {
    console.log("Initializing Socket.io server...");
    const path = "/api/socket/io";
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: path,
      addTrailingSlash: false,
      transports: ["websocket"],
    });

    // Хранилище онлайн пользователей
    const onlineUsers = new Map();

    io.on("connection", (socket) => {
      console.log("Socket connected:", socket.id);

      // Пользователь заходит в онлайн
      socket.on("user:online", (userId) => {
        onlineUsers.set(userId, socket.id);
        // Сообщаем всем, что этот пользователь онлайн
        io.emit("user:status", { userId, status: "ONLINE" });
        
        // Сообщаем только этому пользователю, кто еще онлайн
        const statuses: any = {};
        onlineUsers.forEach((_, uid) => {
          statuses[uid] = "ONLINE";
        });
        socket.emit("user:all-statuses", statuses);
      });

      // Вход в комнату чата
      socket.on("chat:join", (channelId) => {
        // Покидаем старые комнаты (кроме своей личной)
        socket.rooms.forEach(room => {
          if (room !== socket.id) socket.leave(room);
        });
        socket.join(channelId);
        console.log(`User ${socket.id} joined room: ${channelId}`);
      });

      // Печатает...
      socket.on("chat:typing", ({ channelId, userId, userName }) => {
        socket.to(channelId).emit("chat:typing", { userId, userName });
      });

      // Перестал печатать
      socket.on("chat:stop-typing", ({ channelId, userId }) => {
        socket.to(channelId).emit("chat:stop-typing", { userId });
      });

      // Сообщение прочитано
      socket.on("chat:read", ({ channelId, userId, messageId }) => {
        socket.to(channelId).emit("chat:read", { userId, messageId });
      });

      // Сообщение доставлено
      socket.on("message:delivered", ({ channelId, messageId }) => {
        socket.to(channelId).emit("message:delivered", { messageId });
      });

      // Отметить весь чат прочитанным
      socket.on("chat:mark_read", ({ channelId, userId }) => {
        socket.to(channelId).emit("chat:mark_read", { channelId, userId });
      });

      socket.on("disconnect", () => {
        let disconnectedUserId = null;
        onlineUsers.forEach((socketId, userId) => {
          if (socketId === socket.id) {
            disconnectedUserId = userId;
          }
        });

        if (disconnectedUserId) {
          onlineUsers.delete(disconnectedUserId);
          io.emit("user:status", { userId: disconnectedUserId, status: "OFFLINE" });
        }
        console.log("Socket disconnected");
      });
    });

    res.socket.server.io = io;
  }

  res.end();
};

export default ioHandler;
