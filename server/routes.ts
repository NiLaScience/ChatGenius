import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupWebSocket } from "./websocket";
import { db } from "@db";
import { channels, messages, channelMembers, users, directMessages, fileAttachments } from "@db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import { sql } from "drizzle-orm";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // File upload endpoint
  app.post("/api/upload", upload.single('file'), (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });

  // Get all users (excluding current user)
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const allUsers = await db
        .select({
          id: users.id,
          username: users.username,
          avatarUrl: users.avatarUrl,
          status: users.status,
          customStatus: users.customStatus,
          lastSeen: users.lastSeen,
        })
        .from(users)
        .where(eq(users.id, req.user.id, false));

      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).send("Error fetching users");
    }
  });

  // Get user by ID
  app.get("/api/users/:userId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const [user] = await db
        .select({
          id: users.id,
          username: users.username,
          avatarUrl: users.avatarUrl,
          status: users.status,
          customStatus: users.customStatus,
          lastSeen: users.lastSeen,
        })
        .from(users)
        .where(eq(users.id, parseInt(req.params.userId)))
        .limit(1);

      if (!user) {
        return res.status(404).send("User not found");
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).send("Error fetching user");
    }
  });

  // Get direct messages between two users
  app.get("/api/users/:userId/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const messages = await db
        .select({
          id: directMessages.id,
          content: directMessages.content,
          senderId: directMessages.senderId,
          receiverId: directMessages.receiverId,
          createdAt: directMessages.createdAt,
          sender: {
            id: users.id,
            username: users.username,
            avatarUrl: users.avatarUrl,
          },
        })
        .from(directMessages)
        .where(
          and(
            eq(directMessages.senderId, req.user.id),
            eq(directMessages.receiverId, parseInt(req.params.userId))
          )
        )
        .leftJoin(users, eq(directMessages.senderId, users.id))
        .orderBy(desc(directMessages.createdAt));

      res.json(messages);
    } catch (error) {
      console.error("Error fetching direct messages:", error);
      res.status(500).send("Error fetching direct messages");
    }
  });

  // Send a direct message
  app.post("/api/users/:userId/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const [message] = await db
        .insert(directMessages)
        .values({
          content: req.body.content,
          senderId: req.user.id,
          receiverId: parseInt(req.params.userId),
        })
        .returning();

      const [fullMessage] = await db
        .select({
          id: directMessages.id,
          content: directMessages.content,
          senderId: directMessages.senderId,
          receiverId: directMessages.receiverId,
          createdAt: directMessages.createdAt,
          sender: {
            id: users.id,
            username: users.username,
            avatarUrl: users.avatarUrl,
          },
        })
        .from(directMessages)
        .where(eq(directMessages.id, message.id))
        .leftJoin(users, eq(directMessages.senderId, users.id))
        .limit(1);

      res.json(fullMessage);
    } catch (error) {
      console.error("Error sending direct message:", error);
      res.status(500).send("Error sending direct message");
    }
  });

  // Update user avatar
  app.put("/api/user/avatar", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          avatarUrl: req.body.avatarUrl,
          updatedAt: new Date()
        })
        .where(eq(users.id, req.user.id))
        .returning();

      res.json({ message: "Avatar updated", user: updatedUser });
    } catch (error) {
      console.error("Error updating avatar:", error);
      res.status(500).send("Error updating avatar");
    }
  });

  // Update user status
  app.put("/api/user/status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          status: req.body.status,
          lastSeen: new Date(),
          updatedAt: new Date()
        })
        .where(eq(users.id, req.user.id))
        .returning();

      res.json({ message: "Status updated", user: updatedUser });
    } catch (error) {
      console.error("Error updating status:", error);
      res.status(500).send("Error updating status");
    }
  });
  // Channel routes
  app.get("/api/channels", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const userChannels = await db
        .select({
          id: channels.id,
          name: channels.name,
          description: channels.description,
          isPrivate: channels.isPrivate,
          createdAt: channels.createdAt,
        })
        .from(channels)
        .leftJoin(channelMembers, eq(channels.id, channelMembers.channelId))
        .where(
          and(
            eq(channelMembers.userId, req.user.id),
            eq(channels.isPrivate, false)
          )
        );

      res.json(userChannels);
    } catch (error) {
      console.error("Error fetching channels:", error);
      res.status(500).send("Error fetching channels");
    }
  });

  app.post("/api/channels", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const [newChannel] = await db
        .insert(channels)
        .values({
          name: req.body.name,
          description: req.body.description,
          isPrivate: req.body.isPrivate || false,
        })
        .returning();

      await db.insert(channelMembers).values({
        channelId: newChannel.id,
        userId: req.user.id,
        isAdmin: true,
      });

      res.json(newChannel);
    } catch (error) {
      console.error("Error creating channel:", error);
      res.status(500).send("Error creating channel");
    }
  });

  // Message routes
  app.post("/api/channels/:channelId/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const { content, fileAttachment } = req.body;

      // Create the message first
      const [message] = await db
        .insert(messages)
        .values({
          content,
          channelId: parseInt(req.params.channelId),
          userId: req.user.id,
          parentId: req.body.parentId,
        })
        .returning();

      // If there's a file attachment, create it
      if (fileAttachment) {
        await db.insert(fileAttachments).values({
          fileName: fileAttachment.fileName,
          fileUrl: fileAttachment.fileUrl,
          fileType: fileAttachment.fileType,
          messageId: message.id,
        });
      }

      // Fetch the complete message with user and file attachment
      const [fullMessage] = await db
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
          fileAttachment: {
            fileName: fileAttachments.fileName,
            fileUrl: fileAttachments.fileUrl,
            fileType: fileAttachments.fileType,
          },
        })
        .from(messages)
        .where(eq(messages.id, message.id))
        .leftJoin(users, eq(messages.userId, users.id))
        .leftJoin(fileAttachments, eq(messages.id, fileAttachments.messageId))
        .limit(1);

      res.json(fullMessage);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).send("Error creating message");
    }
  });

  // Update the messages fetch endpoint to include file attachments
  app.get("/api/channels/:channelId/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const channelMessages = await db
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
          fileAttachment: {
            fileName: fileAttachments.fileName,
            fileUrl: fileAttachments.fileUrl,
            fileType: fileAttachments.fileType,
          },
        })
        .from(messages)
        .where(
          and(
            eq(messages.channelId, parseInt(req.params.channelId)),
            isNull(messages.parentId) // Only get top-level messages
          )
        )
        .leftJoin(users, eq(messages.userId, users.id))
        .leftJoin(fileAttachments, eq(messages.id, fileAttachments.messageId))
        .orderBy(desc(messages.createdAt))
        .limit(50);

      res.json(channelMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).send("Error fetching messages");
    }
  });

  // Thread routes
  app.get("/api/messages/:messageId/replies", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const replies = await db
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
        .where(eq(messages.parentId, parseInt(req.params.messageId)))
        .leftJoin(users, eq(messages.userId, users.id))
        .orderBy(messages.createdAt);

      res.json(replies);
    } catch (error) {
      console.error("Error fetching replies:", error);
      res.status(500).send("Error fetching replies");
    }
  });

  app.get("/api/messages/:messageId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const [message] = await db
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
        .where(eq(messages.id, parseInt(req.params.messageId)))
        .leftJoin(users, eq(messages.userId, users.id))
        .limit(1);

      if (!message) {
        return res.status(404).send("Message not found");
      }

      res.json(message);
    } catch (error) {
      console.error("Error fetching message:", error);
      res.status(500).send("Error fetching message");
    }
  });

  // Search endpoint
  app.get("/api/search", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const query = req.query.q as string;
    if (!query) {
      return res.status(400).send("Search query is required");
    }

    try {
      const messageResults = await db
        .select({
          id: messages.id,
          type: sql<'message'>`'message'`,
          content: messages.content,
          channelId: messages.channelId,
          channelName: channels.name,
          username: users.username,
          createdAt: messages.createdAt,
          threadId: messages.parentId,
          fileName: sql<string | null>`null`,
          fileUrl: sql<string | null>`null`,
          fileType: sql<string | null>`null`,
        })
        .from(messages)
        .where(sql`${messages.content} ILIKE ${'%' + query + '%'}`)
        .innerJoin(users, eq(messages.userId, users.id))
        .innerJoin(channels, eq(messages.channelId, channels.id));

      const fileResults = await db
        .select({
          id: messages.id,
          type: sql<'file'>`'file'`,
          content: messages.content,
          channelId: messages.channelId,
          channelName: channels.name,
          username: users.username,
          createdAt: messages.createdAt,
          threadId: messages.parentId,
          fileName: fileAttachments.fileName,
          fileUrl: fileAttachments.fileUrl,
          fileType: fileAttachments.fileType,
        })
        .from(fileAttachments)
        .innerJoin(messages, eq(fileAttachments.messageId, messages.id))
        .innerJoin(users, eq(messages.userId, users.id))
        .innerJoin(channels, eq(messages.channelId, channels.id))
        .where(sql`${fileAttachments.fileName} ILIKE ${'%' + query + '%'}`);

      const searchResults = [...messageResults, ...fileResults]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 50);

      res.json(searchResults);
    } catch (error) {
      console.error("Error searching:", error);
      res.status(500).send("Error performing search");
    }
  });

  const httpServer = createServer(app);
  setupWebSocket(httpServer);

  return httpServer;
}