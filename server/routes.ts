import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupWebSocket } from "./websocket";
import { db } from "@db";
import { channels, messages, channelMembers, users } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

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

      // Add the creator as a channel member with admin privileges
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
        })
        .from(messages)
        .where(eq(messages.channelId, parseInt(req.params.channelId)))
        .leftJoin(users, eq(messages.userId, users.id))
        .orderBy(desc(messages.createdAt))
        .limit(50);

      res.json(channelMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).send("Error fetching messages");
    }
  });

  const httpServer = createServer(app);
  setupWebSocket(httpServer);

  return httpServer;
}