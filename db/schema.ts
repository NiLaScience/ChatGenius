import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  avatarUrl: text("avatar_url"),
  status: text("status").default("online"),
  customStatus: text("custom_status"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const channels = pgTable("channels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isPrivate: boolean("is_private").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const channelMembers = pgTable("channel_members", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").references(() => channels.id),
  userId: integer("user_id").references(() => users.id),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  channelId: integer("channel_id").references(() => channels.id),
  userId: integer("user_id").references(() => users.id),
  parentId: integer("parent_id").references(() => messages.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const reactions = pgTable("reactions", {
  id: serial("id").primaryKey(),
  emoji: text("emoji").notNull(),
  messageId: integer("message_id").references(() => messages.id),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  fileUrl: text("file_url").notNull(),
  contentType: text("content_type").notNull(),
  messageId: integer("message_id").references(() => messages.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const channelsRelations = relations(channels, ({ many }) => ({
  members: many(channelMembers),
  messages: many(messages),
}));

export const usersRelations = relations(users, ({ many }) => ({
  channelMembers: many(channelMembers),
  messages: many(messages),
  reactions: many(reactions),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  channel: one(channels, {
    fields: [messages.channelId],
    references: [channels.id],
  }),
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
  parent: one(messages, {
    fields: [messages.parentId],
    references: [messages.id],
  }),
  reactions: many(reactions),
  files: many(files),
}));

export const reactionsRelations = relations(reactions, ({ one }) => ({
  message: one(messages, {
    fields: [reactions.messageId],
    references: [messages.id],
  }),
  user: one(users, {
    fields: [reactions.userId],
    references: [users.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertChannelSchema = createInsertSchema(channels);
export const selectChannelSchema = createSelectSchema(channels);
export const insertMessageSchema = createInsertSchema(messages);
export const selectMessageSchema = createSelectSchema(messages);
export const insertReactionSchema = createInsertSchema(reactions);
export const selectReactionSchema = createSelectSchema(reactions);

// Types
export type User = typeof users.$inferSelect;
export type Channel = typeof channels.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Reaction = typeof reactions.$inferSelect;
export type File = typeof files.$inferSelect;