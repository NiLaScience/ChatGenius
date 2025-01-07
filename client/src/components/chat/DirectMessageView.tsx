import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserAvatar } from "@/components/user/UserAvatar";
import MessageInput from "./MessageInput";
import { formatDistanceToNow } from "date-fns";
import type { User } from "@db/schema";

interface DirectMessageViewProps {
  userId: number;
}

export default function DirectMessageView({ userId }: DirectMessageViewProps) {
  const { data: messages } = useQuery({
    queryKey: [`/api/users/${userId}/messages`],
  });

  const { data: user } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
  });

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="px-6 py-4 border-b bg-card">
        <div className="flex items-center gap-3">
          <UserAvatar user={user} className="h-10 w-10" />
          <div>
            <h2 className="text-xl font-semibold text-card-foreground">
              {user.username}
            </h2>
            <p className="text-sm text-muted-foreground">
              {user.status === "online" ? (
                "Online"
              ) : user.lastSeen ? (
                `Last seen ${formatDistanceToNow(new Date(user.lastSeen))} ago`
              ) : (
                "Offline"
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages?.map((message) => (
          <div key={message.id} className="flex gap-3">
            <UserAvatar user={message.sender} className="h-8 w-8" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{message.sender.username}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(message.createdAt))} ago
                </span>
              </div>
              <p className="text-sm mt-1">{message.content}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 py-4 border-t bg-background">
        <MessageInput userId={userId} isDM />
      </div>
    </div>
  );
}
