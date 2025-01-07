import { Server } from "http";
import { Server as SocketServer } from "socket.io";
import { db } from "@db";
import { messages, users, channels, reactions } from "@db/schema";
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
      socket.join(`channel:${channelId}`);
    });

    socket.on("leave_channel", (channelId: number) => {
      socket.leave(`channel:${channelId}`);
    });

    socket.on("message", async (data: {
      content: string,
      channelId: number,
      userId: number,
      parentId?: number
    }) => {
      try {
        const [newMessage] = await db
          .insert(messages)
          .values(data)
          .returning();

        const [messageWithUser] = await db
          .select()
          .from(messages)
          .where(eq(messages.id, newMessage.id))
          .leftJoin(users, eq(messages.userId, users.id))
          .limit(1);

        io.to(`channel:${data.channelId}`).emit("message", messageWithUser);
      } catch (error) {
        console.error("Error saving message:", error);
      }
    });

    socket.on("reaction", async (data: {
      messageId: number,
      userId: number,
      emoji: string
    }) => {
      try {
        const [newReaction] = await db
          .insert(reactions)
          .values(data)
          .returning();

        const message = await db
          .select()
          .from(messages)
          .where(eq(messages.id, data.messageId))
          .limit(1);

        if (message) {
          io.to(`channel:${message[0].channelId}`).emit("reaction", newReaction);
        }
      } catch (error) {
        console.error("Error saving reaction:", error);
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
