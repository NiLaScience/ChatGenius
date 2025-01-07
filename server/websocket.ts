import { Server } from "http";
import { Server as SocketServer } from "socket.io";
import { db } from "@db";
import { messages, users } from "@db/schema";
import { eq } from "drizzle-orm";

export function setupWebSocket(server: Server) {
  const io = new SocketServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join_channel", (channelId: number) => {
      console.log("Client joining channel:", channelId);
      socket.join(`channel:${channelId}`);
    });

    socket.on("leave_channel", (channelId: number) => {
      console.log("Client leaving channel:", channelId);
      socket.leave(`channel:${channelId}`);
    });

    socket.on("message", async (data: {
      content: string,
      channelId: number,
      userId: number,
      parentId?: number
    }) => {
      try {
        console.log("Received message:", data);
        const [newMessage] = await db
          .insert(messages)
          .values(data)
          .returning();

        const [messageWithUser] = await db
          .select({
            id: messages.id,
            content: messages.content,
            channelId: messages.channelId,
            userId: messages.userId,
            parentId: messages.parentId,
            createdAt: messages.createdAt,
            updatedAt: messages.updatedAt,
            user: {
              id: users.id,
              username: users.username,
              avatarUrl: users.avatarUrl,
            },
          })
          .from(messages)
          .where(eq(messages.id, newMessage.id))
          .leftJoin(users, eq(messages.userId, users.id))
          .limit(1);

        console.log("Broadcasting message to channel:", data.channelId);
        io.to(`channel:${data.channelId}`).emit("message", messageWithUser);
      } catch (error) {
        console.error("Error saving message:", error);
      }
    });

    socket.on("typing", (data: { channelId: number, username: string }) => {
      socket.to(`channel:${data.channelId}`).emit("typing", data);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
}