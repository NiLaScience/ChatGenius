import { db } from "@db";
import { users, channels, messages, channelMembers } from "@db/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hash(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seed() {
  try {
    // Create example users
    const usersList = [
      { username: "alice", password: "password123", avatarUrl: "👩", status: "online" },
      { username: "bob", password: "password123", avatarUrl: "👨", status: "away" },
      { username: "charlie", password: "password123", avatarUrl: "🧑", status: "busy" },
    ];

    const createdUsers = await Promise.all(
      usersList.map(async (user) => {
        const [createdUser] = await db
          .insert(users)
          .values({
            ...user,
            password: await hash(user.password),
            isGuest: false,
          })
          .returning();
        return createdUser;
      })
    );

    // Create channels
    const channelsList = [
      { name: "general", description: "General discussions" },
      { name: "random", description: "Random chat" },
      { name: "tech", description: "Tech discussions" },
    ];

    const createdChannels = await Promise.all(
      channelsList.map(async (channel) => {
        const [createdChannel] = await db
          .insert(channels)
          .values(channel)
          .returning();
        return createdChannel;
      })
    );

    // Add users to channels
    await Promise.all(
      createdChannels.flatMap((channel) =>
        createdUsers.map((user) =>
          db.insert(channelMembers).values({
            channelId: channel.id,
            userId: user.id,
            isAdmin: user.username === "alice",
          })
        )
      )
    );

    // Add messages
    for (const channel of createdChannels) {
      const messagesList = [
        "Hey everyone! 👋",
        "How's it going?",
        "Anyone up for a chat?",
        "Check out this cool feature!",
      ];

      for (const content of messagesList) {
        const [message] = await db
          .insert(messages)
          .values({
            content,
            channelId: channel.id,
            userId: createdUsers[Math.floor(Math.random() * createdUsers.length)].id,
          })
          .returning();

        // Add some replies
        const replies = ["Nice!", "That's cool!", "Interesting..."];
        for (const replyContent of replies) {
          await db.insert(messages).values({
            content: replyContent,
            channelId: channel.id,
            userId: createdUsers[Math.floor(Math.random() * createdUsers.length)].id,
            parentId: message.id,
          });
        }
      }
    }

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();