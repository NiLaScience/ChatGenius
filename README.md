# ChatGenius 💬

A modern real-time chat application built with React, Node.js, and WebSocket technology.

## ✨ Features

### Authentication & Users 🔐
- User registration and login
- Guest access for quick start
- Customizable user avatars
- Real-time presence indicators
- User status management (Online, Away, Busy, Offline)

### Messaging 📝
- Real-time message delivery
- Channel-based conversations
- Direct messaging between users
- Message threading for organized discussions
- Typing indicators
- Rich text formatting
- Message history with infinite scroll

### Channels 🌐
- Public channels for team-wide communication
- Channel creation and management
- Channel member list
- Channel-specific notifications

### Files & Media 📎
- File attachments support
- Image previews
- PDF document support
- File size limits and type restrictions
- Secure file storage

### Reactions & Engagement 👍
- Emoji reactions to messages
- Thread-based replies
- Message timestamps
- User avatars in messages

### Search 🔍
- Full-text search across messages
- File search by name
- Search results with context
- Quick navigation to search results

### Real-time Features ⚡
- Instant message delivery
- Live typing indicators
- Real-time status updates
- Connection state management
- Automatic reconnection

## 🛠️ Tech Stack

- **Frontend**:
  - React with TypeScript
  - Tailwind CSS for styling
  - shadcn/ui components
  - React Query for data management
  - Socket.IO client for real-time features

- **Backend**:
  - Node.js with Express
  - PostgreSQL with Drizzle ORM
  - Socket.IO for WebSocket communication
  - Multer for file uploads

## 🚀 Getting Started

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/chatgenius.git
cd chatgenius
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up your environment variables:
\`\`\`env
DATABASE_URL="postgresql://username:password@localhost:5432/chatgenius"
\`\`\`

4. Run database migrations:
\`\`\`bash
npm run db:push
\`\`\`

5. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

## 📱 Usage

1. Register a new account or use guest access
2. Join existing channels or create new ones
3. Start chatting with real-time message delivery
4. Use threads to organize conversations
5. Share files and react to messages
6. Search through messages and files

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/)
- Icons by [Lucide](https://lucide.dev/)
- Real-time features powered by [Socket.IO](https://socket.io/) 