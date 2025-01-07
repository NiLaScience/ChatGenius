import { Server } from "http";
import { Server as SocketServer } from "socket.io";
import { db } from "@db";
import { messages, users } from "@db/schema";
import { eq, and } from "drizzle-orm";

export function setupWebSocket(server: Server) {
  const io = new SocketServer(server, {
    path: "/socket.io",
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    serveClient: false,
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Join both channel and thread rooms
    socket.on("join_channel", (channelId: number) => {
      console.log("Client joining channel:", channelId);
      socket.join(`channel:${channelId}`);
    });

    socket.on("join_thread", (threadId: number) => {
      console.log("Client joining thread:", threadId);
      socket.join(`thread:${threadId}`);
    });

    socket.on("leave_channel", (channelId: number) => {
      console.log("Client leaving channel:", channelId);
      socket.leave(`channel:${channelId}`);
    });

    socket.on("leave_thread", (threadId: number) => {
      console.log("Client leaving thread:", threadId);
      socket.leave(`thread:${threadId}`);
    });

    socket.on("message", async (data: {
      content: string,
      channelId: number,
      userId: number,
      parentId?: number
    }) => {
      try {
        console.log("Received message:", data);

        // Insert the message into the database
        const [newMessage] = await db
          .insert(messages)
          .values({
            content: data.content,
            channelId: data.channelId,
            userId: data.userId,
            parentId: data.parentId || null,
          })
          .returning();

        if (!newMessage) {
          throw new Error("Failed to save message");
        }

        // Fetch the complete message with user data
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

        if (!messageWithUser) {
          throw new Error("Failed to fetch message with user data");
        }

        // Emit to both channel and thread if it's a reply
        if (data.parentId) {
          console.log("Broadcasting thread message:", data.parentId);
          io.to(`thread:${data.parentId}`).emit("thread_message", messageWithUser);
        }

        console.log("Broadcasting message to channel:", data.channelId);
        io.to(`channel:${data.channelId}`).emit("message", messageWithUser);
      } catch (error) {
        console.error("Error saving/broadcasting message:", error);
        socket.emit("message_error", {
          error: "Failed to send message",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    socket.on("typing", (data: { channelId: number, threadId?: number, username: string }) => {
      if (data.threadId) {
        socket.to(`thread:${data.threadId}`).emit("typing", data);
      } else {
        socket.to(`channel:${data.channelId}`).emit("typing", data);
      }
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    socket.on("disconnect", (reason) => {
      console.log("Client disconnected:", socket.id, "Reason:", reason);
    });
  });

  return io;
}