import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import MessageInput from "./MessageInput";
import type { Message } from "@db/schema";

interface ThreadViewProps {
  messageId: number;
  onClose: () => void;
}

export default function ThreadView({ messageId, onClose }: ThreadViewProps) {
  const [parentMessage, setParentMessage] = useState<Message | null>(null);
  
  const { data: replies } = useQuery<Message[]>({
    queryKey: [`/api/messages/${messageId}/replies`],
    enabled: !!messageId,
  });

  const { data: message } = useQuery<Message>({
    queryKey: [`/api/messages/${messageId}`],
    enabled: !!messageId,
  });

  useEffect(() => {
    if (message) {
      setParentMessage(message);
    }
  }, [message]);

  if (!parentMessage) {
    return (
      <div className="h-full flex items-center justify-center">
        Loading thread...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Thread</h3>
          <p className="text-sm text-muted-foreground">
            {replies?.length || 0} replies
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Parent Message */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">{parentMessage.user?.username}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(parentMessage.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="text-sm">{parentMessage.content}</p>
          </div>

          {/* Replies */}
          <div className="pl-4 border-l-2 border-muted space-y-4">
            {replies?.map((reply) => (
              <div key={reply.id} className="bg-accent/50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{reply.user?.username}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(reply.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm">{reply.content}</p>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <MessageInput
          channelId={parentMessage.channelId}
          threadId={parentMessage.id}
        />
      </div>
    </div>
  );
}
