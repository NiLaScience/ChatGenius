import { useState, useEffect, useRef } from "react";
import { useMessages } from "@/hooks/use-messages";
import { useUser } from "@/hooks/use-user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MessageSquare, Smile } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Message } from "@db/schema";

interface MessageListProps {
  channelId: number;
  onThreadSelect: (messageId: number) => void;
}

export default function MessageList({ channelId, onThreadSelect }: MessageListProps) {
  const { messages, isLoading } = useMessages(channelId);
  const { user } = useUser();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, autoScroll]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollHeight, scrollTop, clientHeight } = e.currentTarget;
    const atBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 10;
    setAutoScroll(atBottom);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const groupedMessages = messages?.reduce((groups: Record<string, Message[]>, message) => {
    const date = new Date(message.createdAt).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {}) || {};

  return (
    <ScrollArea
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 p-4"
    >
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date} className="space-y-4">
          <div className="sticky top-0 z-10 flex justify-center">
            <span className="bg-muted px-2 py-1 rounded-full text-xs text-muted-foreground">
              {date}
            </span>
          </div>

          {dateMessages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 group ${
                message.userId === user?.id ? "justify-end" : ""
              }`}
            >
              {message.userId !== user?.id && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={message.user?.avatarUrl} />
                  <AvatarFallback>
                    {message.user?.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}

              <div className={`flex flex-col ${
                message.userId === user?.id ? "items-end" : ""
              }`}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {message.user?.username}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </span>
                </div>

                <div className={`relative px-3 py-2 rounded-lg max-w-md ${
                  message.userId === user?.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}>
                  <p className="text-sm">{message.content}</p>
                </div>

                <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onThreadSelect(message.id)}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="grid grid-cols-8 gap-2">
                        {["👍", "❤️", "😂", "😮", "😢", "🎉", "🤔", "👀"].map(
                          (emoji) => (
                            <button
                              key={emoji}
                              className="text-2xl hover:bg-accent p-1 rounded"
                              onClick={() => {
                                // TODO: Implement emoji reactions
                              }}
                            >
                              {emoji}
                            </button>
                          )
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </ScrollArea>
  );
}
