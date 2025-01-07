import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserAvatar } from "@/components/user/UserAvatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { User } from "@db/schema";

interface DirectMessageViewProps {
  userId: number;
}

export default function DirectMessageView({ userId }: DirectMessageViewProps) {
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();

  const { data: messages } = useQuery({
    queryKey: [`/api/users/${userId}/messages`],
  });

  const { data: user } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
  });

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/users/${userId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/messages`] });
      setMessage("");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    await sendMessage.mutateAsync(message);
  };

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
        {messages?.map((message: any) => (
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

      <form onSubmit={handleSubmit} className="px-6 py-4 border-t bg-background">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}