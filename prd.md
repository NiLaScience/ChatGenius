# ChatGenius: Core Product Requirements Document (PRD) and Development Prompts

This document contains:

1. **ChatGenius PRD (Core MVP)** – a non-AI baseline for workplace communication (akin to Slack-like functionality).  
2. **Step-by-step Development Prompts** – short, targeted instructions for building out the MVP using Next.js 13, Tailwind CSS, and shadcn/ui.  

> **Note on Authentication**:  
> At this stage, we are **not** implementing or demonstrating user authentication because our dev model cannot handle it. We simply define a `User` model in the database for reference and will add authentication at a later phase.

---

## 1. Product Requirements Document (PRD) for ChatGenius

### 1.1 Project Overview
**ChatGenius** is a modern workplace messaging platform focused on real-time collaboration. In its first release, we aim to support the **core messaging features**—channels, direct messaging, file sharing, threads, and reactions. Future versions will introduce advanced AI features (such as generative replies or summarization).  

### 1.2 Goals & Objectives
1. **Enhance Team Communication**  
   Provide an intuitive interface for real-time text-based chat.
2. **Organize Discussions**  
   Use channels, direct messages, and threads to structure different topics.
3. **File Sharing & Reactions**  
   Allow quick file attachments and emoji-based feedback on messages.
4. **Extensibility**  
   Build a foundation for advanced features (AI enhancements, admin workflows, etc.).
5. **Scalability**  
   Choose tooling that is easy to scale out as user load increases.

### 1.3 User Stories
For this MVP, we define three primary user roles: **Regular User**, **Team Admin**, and **System Admin**. (Authentication for these roles is planned for a future phase.)

**Regular User**  
1. “I want to see a list of channels so I can join relevant conversations.”  
2. “I want to post messages and have them appear in real time for others.”  
3. “I want to upload files and share them with my teammates.”  
4. “I want to search older messages and files.”  
5. “I want to use threads and emoji reactions to organize and respond quickly.”

**Team Admin**  
6. “I want to create or archive channels for my team’s needs.”  
7. “I want to invite or remove users from private channels.”

**System Admin**  
8. “I want to manage all channels, users, or even entire workspaces.”  
9. “I want to suspend or delete user accounts if needed.”

### 1.4 Core Functionality Overview
1. **Channel Organization**: Public or private channels, plus direct messages.  
2. **Real-Time Messaging**: Messages broadcast instantly to all participants in a channel.  
3. **File Sharing**: Users can attach files (images, PDFs, etc.) to their messages.  
4. **Threading**: Sub-replies under any message. Show a thread view when clicking on the number of replies. Always show the latest reply in the main view with the number of replies.
5. **Reactions**: Inline emoji reactions for quick feedback.  
6. **Search**: Simple text-based search across messages, files, or channels.
7. **Presence & Status**: Show online/offline status for users. Allow users to set a status like 'Busy' or 'In meeting' etc.
8. **User Management**: Allow users to manage their own profiles, including name, email, and profile picture.
9. **Admin Dashboard**: Allow system admins to manage all users, channels, and workspaces.

### 1.5 Proposed Architecture
1. **Frontend**  
   - Next.js 13 with Tailwind CSS and shadcn/ui for layout and styling.  
   - WebSocket (Socket.IO or similar) for real-time events.

2. **Backend**  
   - Next.js API routes or a custom server for real-time messaging.  
   - Database: PostgreSQL with a data access layer (e.g., Prisma, Knex, or raw SQL).

3. **Data Models** (Prisma Example)
   - **User**: `id`, `name`, `createdAt`, `updatedAt`  
   - **Channel**: `id`, `name`, `isPrivate`, `createdAt`, `updatedAt`  
   - **ChannelMembership**: `id`, `channelId`, `userId`, `createdAt`  
   - **Message**: `id`, `channelId`, `senderId`, `content`, `parentMessageId`, `createdAt`, `updatedAt`  
   - **Reaction**: `id`, `messageId`, `userId`, `emoji`, `createdAt`  
   - **File**: `id`, `messageId`, `filename`, `fileUrl`, `contentType`, `createdAt`  

### 1.6 MVP Deliverables
1. **Channels**: Create, list, update, and delete (or archive) channels.  
2. **Messaging**: Basic UI for sending and viewing messages in real time.  
3. **Threads**: Nested messages (parent/child).  
4. **Reactions**: Emoji-based quick feedback.  
5. **File Sharing**: File attachment with metadata stored in the database.  
6. **Search**: Basic endpoint or UI to query messages/files.  

---

## 2. Step-by-Step Development Prompts

Below are **short, targeted prompts** to instruct a Next.js + Tailwind CSS + shadcn/ui model to build the core MVP. Present them **one at a time** in your development workflow. Adjust folder structures or naming conventions as needed.

---

### Prompt 1: Project Initialization & Basic Layout
Create a new Next.js 13 app with Tailwind CSS and initialize shadcn/ui.

Set up a top navigation bar (placeholder “ChatGenius” text).
Create a responsive Sidebar that can collapse on smaller screens.
Add a MainContent area (<main>) where pages render. No authentication at this time. Just the basic layout components.
yaml
Copy code

---

### Prompt 2: Prisma Setup & Core Data Models
Install Prisma with PostgreSQL. In schema.prisma, define these models: User { id, name, createdAt, updatedAt } Channel { id, name, isPrivate, createdAt, updatedAt } ChannelMembership { id, channelId, userId, createdAt } Message { id, channelId, senderId, content, parentMessageId, createdAt, updatedAt } Reaction { id, messageId, userId, emoji, createdAt } File { id, messageId, filename, fileUrl, contentType, createdAt } Generate migrations and seed minimal data: (1 user, 1 channel, 2 messages).

yaml
Copy code

---

### Prompt 3: Channels Listing Page
Create a page at /channels:

Fetch and display all channels from the database.
Display each channel’s name in a list.
Provide a “Create Channel” button opening a shadcn/ui dialog with a form: channel name, isPrivate.
Insert the new channel in the database and refresh the list.
yaml
Copy code

---

### Prompt 4: Channel Detail View & Messaging
Build a page at /channels/[channelId]:

Show the channel name at the top.
Display existing messages from this channel (sorted by createdAt).
Provide a text box at the bottom to send new messages. Insert them in the DB.
Skip real-time for now. Just update the list on message send (page refresh or local state). Use shadcn/ui for styling.
yaml
Copy code

---

### Prompt 5: WebSocket Real-Time Messaging
Add Socket.IO or a similar library for real-time updates:

Set up a basic Socket.IO server in your Next.js app or custom server.
On /channels/[channelId], connect to Socket.IO and join a room named after channelId.
When a new message is posted, broadcast to the room so all clients see it instantly.
Update the UI in real-time, no page refresh required.
yaml
Copy code

---

### Prompt 6: Threads & Reactions
Extend messaging for threads and reactions:

“Reply to Thread” sets parentMessageId for replies.
Show a nested list of replies below each message with children (Message.parentMessageId = this message’s id).
A “React” button opens a small list of emojis. Insert the chosen emoji into Reaction table (messageId, userId, emoji).
Display existing reactions next to each message.
yaml
Copy code

---

### Prompt 7: File Upload & Display
Add file-sharing functionality:

Allow users to attach a file to a new message.
Store file metadata in the File model. Store the actual file locally or a dummy bucket.
Display a small preview for images or an icon/link for other file types.
yaml
Copy code

---

### Prompt 8: Basic Search
Implement a simple search at /search:

Create an endpoint /api/search that accepts a query string.
Search Messages.content and Files.filename (LIKE %query%).
Display results grouped by messages and files in a simple results page.
Add a search bar in the nav or sidebar to navigate to /search?query=<userQuery>.
yaml
Copy code

---

### Prompt 9: Presence & Status (Optional)
Add presence and status tracking:

Add a 'status' field to the User model (e.g., online, offline).
On Socket.IO connect, mark the user as online; on disconnect, mark them as offline.
Show the status indicator next to each user in a channel or DM list.
Optionally, allow a user to set a custom status like 'Busy' or 'DND'.
markdown
Copy code

---

## 3. Next Steps

Once the above core features are in place, you’ll have an MVP that supports:

- **Channel-based chat**  
- **Real-time messaging**  
- **Threads and reactions**  
- **File sharing**  
- **Basic search**  

**Authentication**, **role management**, and **AI enhancements** can be integrated afterward.  

This concludes the ChatGenius MVP PRD and a series of prompts for building it step by step.