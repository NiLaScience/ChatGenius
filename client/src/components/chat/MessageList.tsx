import { useState, useEffect, useRef } from "react";
import { useMessages } from "@/hooks/use-messages";
import { useUser } from "@/hooks/use-user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MessageSquare, Smile, FileText } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import type { Message } from "@db/schema";

interface MessageListProps {
  channelId: number;
  onThreadSelect: (messageId: number) => void;
}

interface ReactionCount {
  emoji: string;
  count: number;
  users: { id: number; username: string }[];
}

interface FileAttachment {
  fileName: string;
  fileUrl: string;
  fileType: 'image' | 'pdf';
}

export default function MessageList({ channelId, onThreadSelect }: MessageListProps) {
  const { messages, isLoading, addReaction } = useMessages(channelId);
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

  // Function to get thread preview for a message
  const ThreadPreview = ({ messageId }: { messageId: number }) => {
    const { data: replies } = useQuery<Message[]>({
      queryKey: [`/api/messages/${messageId}/replies`],
      enabled: !!messageId,
    });

    if (!replies?.length) return null;

    const replyCount = replies.length;
    const latestReply = replies[replies.length - 1];

    return (
      <div 
        className="mt-2 pl-4 border-l-2 border-muted cursor-pointer hover:bg-accent/50 rounded p-2"
        onClick={(e) => {
          e.stopPropagation();
          onThreadSelect(messageId);
        }}
      >
        <div className="text-sm text-muted-foreground">
          {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
        </div>
        {latestReply && (
          <div className="flex items-center gap-2 mt-1">
            <Avatar className="h-6 w-6">
              <AvatarImage src={latestReply.user?.avatarUrl} />
              <AvatarFallback>
                {latestReply.user?.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm truncate">{latestReply.content}</div>
          </div>
        )}
      </div>
    );
  };

  // Function to render file attachments
  const FileAttachmentView = ({ attachment }: { attachment: FileAttachment }) => {
    if (attachment.fileType === 'image') {
      return (
        <a 
          href={attachment.fileUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block max-w-sm mt-2"
        >
          <img 
            src={attachment.fileUrl} 
            alt={attachment.fileName}
            className="rounded-lg max-h-64 object-cover"
          />
        </a>
      );
    }

    return (
      <a 
        href={attachment.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-background hover:bg-accent transition-colors"
      >
        <FileText className="h-4 w-4" />
        <span className="text-sm truncate">{attachment.fileName}</span>
      </a>
    );
  };

  // Function to aggregate reactions
  const aggregateReactions = (reactions: any[]): ReactionCount[] => {
    const counts = reactions.reduce((acc: Record<string, ReactionCount>, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: [],
        };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].users.push({
        id: reaction.userId,
        username: reaction.user.username,
      });
      return acc;
    }, {});
    return Object.values(counts);
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 pb-4"
      >
        <div className="flex flex-col gap-4 p-6">
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
                      {message.content && <p className="text-sm">{message.content}</p>}
                      {message.fileAttachment && (
                        <FileAttachmentView attachment={message.fileAttachment} />
                      )}
                    </div>

                    {/* Reactions */}
                    {message.reactions?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {aggregateReactions(message.reactions).map((reaction) => (
                          <Button
                            key={reaction.emoji}
                            onClick={() => addReaction(message.id, reaction.emoji)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent hover:bg-accent/80"
                            title={reaction.users.map(u => u.username).join(', ')}
                          >
                            <span>{reaction.emoji}</span>
                            <span className="text-xs">{reaction.count}</span>
                          </Button>
                        ))}
                      </div>
                    )}

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
                                  onClick={() => addReaction(message.id, emoji)}
                                >
                                  {emoji}
                                </button>
                              )
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Thread Preview */}
                    <ThreadPreview messageId={message.id} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}