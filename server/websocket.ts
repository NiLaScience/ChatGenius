import { Server } from "http";
import { Server as SocketServer } from "socket.io";
import { db } from "@db";
import { messages, users, reactions, directMessages, fileAttachments } from "@db/schema";
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

  // Track connected users
  const connectedUsers = new Map<string, number>();

  io.on("connection", async (socket) => {
    console.log("Client connected:", socket.id);

    // Handle user authentication and status
    socket.on("authenticate", async (userId: number) => {
      try {
        await db
          .update(users)
          .set({ 
            status: "online",
            lastSeen: new Date()
          })
          .where(eq(users.id, userId));

        connectedUsers.set(socket.id, userId);

        socket.broadcast.emit("user_status", {
          userId,
          status: "online",
          lastSeen: new Date()
        });

        socket.join(`user:${userId}`);
      } catch (error) {
        console.error("Error authenticating user:", error);
      }
    });

    socket.on("join_channel", (channelId: number) => {
      console.log("Client joining channel:", channelId);
      socket.join(`channel:${channelId}`);
    });

    socket.on("join_thread", (threadId: number) => {
      console.log("Client joining thread:", threadId);
      socket.join(`thread:${threadId}`);
    });

    // Handle messages
    socket.on("message", async (data: {
      content: string,
      channelId: number,
      userId: number,
      parentId?: number,
      fileAttachment?: {
        fileName: string,
        fileUrl: string,
        fileType: string
      }
    }) => {
      try {
        console.log("Received message:", data);

        // Insert message first
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

        // If there's a file attachment, create it
        if (data.fileAttachment) {
          await db
            .insert(fileAttachments)
            .values({
              fileName: data.fileAttachment.fileName,
              fileUrl: data.fileAttachment.fileUrl,
              fileType: data.fileAttachment.fileType,
              messageId: newMessage.id,
            });
        }

        // Fetch complete message with user and file attachment
        const [messageWithData] = await db.execute(`
          SELECT 
            m.*,
            jsonb_build_object(
              'id', u.id,
              'username', u.username,
              'avatarUrl', u.avatar_url
            ) as user,
            CASE 
              WHEN fa.id IS NOT NULL THEN
                jsonb_build_object(
                  'fileName', fa.file_name,
                  'fileUrl', fa.file_url,
                  'fileType', fa.file_type
                )
              ELSE NULL
            END as file_attachment
          FROM messages m
          LEFT JOIN users u ON m.user_id = u.id
          LEFT JOIN file_attachments fa ON m.id = fa.message_id
          WHERE m.id = $1
        `, [newMessage.id]);

        if (!messageWithData) {
          throw new Error("Failed to fetch message data");
        }

        // Broadcast message
        if (data.parentId) {
          io.to(`thread:${data.parentId}`).emit("thread_message", messageWithData);
        }
        io.to(`channel:${data.channelId}`).emit("message", messageWithData);

      } catch (error) {
        console.error("Error handling message:", error);
        socket.emit("message_error", {
          error: "Failed to send message",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    // Handle direct messages
    socket.on("direct_message", async (data: {
      content: string,
      senderId: number,
      receiverId: number
    }) => {
      try {
        console.log("Received direct message:", data);

        // Insert the message into the database
        const [newMessage] = await db
          .insert(directMessages)
          .values({
            content: data.content,
            senderId: data.senderId,
            receiverId: data.receiverId,
          })
          .returning();

        if (!newMessage) {
          throw new Error("Failed to save direct message");
        }

        // Fetch the complete message with user data
        const messageWithUser = await db.query.directMessages.findFirst({
          where: eq(directMessages.id, newMessage.id),
          with: {
            sender: true,
            receiver: true
          }
        });

        if (!messageWithUser) {
          throw new Error("Failed to fetch message with user data");
        }

        // Emit to both sender and receiver
        io.to(`user:${data.senderId}`).to(`user:${data.receiverId}`).emit("direct_message", messageWithUser);
      } catch (error) {
        console.error("Error saving/broadcasting direct message:", error);
        socket.emit("direct_message_error", {
          error: "Failed to send message",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    // Handle reactions
    socket.on("reaction", async (data: {
      messageId: number,
      userId: number,
      emoji: string
    }) => {
      try {
        console.log("Received reaction:", data);

        const [newReaction] = await db
          .insert(reactions)
          .values({
            messageId: data.messageId,
            userId: data.userId,
            emoji: data.emoji
          })
          .returning();

        if (!newReaction) {
          throw new Error("Failed to save reaction");
        }

        const reactionWithUser = await db.query.reactions.findFirst({
          where: eq(reactions.id, newReaction.id),
          with: {
            user: true
          }
        });

        if (!reactionWithUser) {
          throw new Error("Failed to fetch reaction with user data");
        }

        const message = await db.query.messages.findFirst({
          where: eq(messages.id, data.messageId)
        });

        if (!message) {
          throw new Error("Message not found");
        }

        console.log("Broadcasting reaction:", data);
        io.to(`channel:${message.channelId}`).emit("reaction", {
          messageId: data.messageId,
          reaction: reactionWithUser,
        });

        if (message.parentId) {
          io.to(`thread:${message.parentId}`).emit("reaction", {
            messageId: data.messageId,
            reaction: reactionWithUser,
          });
        }
      } catch (error) {
        console.error("Error saving/broadcasting reaction:", error);
        socket.emit("reaction_error", {
          error: "Failed to add reaction",
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

    socket.on("disconnect", async (reason) => {
      console.log("Client disconnected:", socket.id, "Reason:", reason);

      const userId = connectedUsers.get(socket.id);
      if (userId) {
        try {
          await db
            .update(users)
            .set({ 
              status: "offline",
              lastSeen: new Date()
            })
            .where(eq(users.id, userId));

          socket.broadcast.emit("user_status", {
            userId,
            status: "offline",
            lastSeen: new Date()
          });

          connectedUsers.delete(socket.id);
        } catch (error) {
          console.error("Error updating user status:", error);
        }
      }
    });
  });

  return io;
}