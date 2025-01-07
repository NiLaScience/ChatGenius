import { useState, useRef, useEffect } from "react";
import { useMessages } from "@/hooks/use-messages";
import { useSocket } from "@/hooks/use-socket";
import { useUser } from "@/hooks/use-user";
import { Paperclip, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface MessageInputProps {
  channelId: number;
  threadId?: number;
}

export default function MessageInput({ channelId, threadId }: MessageInputProps) {
  const [content, setContent] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const { sendMessage } = useMessages(channelId);
  const socket = useSocket();
  const { user } = useUser();
  const { toast } = useToast();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socket?.emit("typing", {
        channelId,
        username: user?.username,
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;

    try {
      await sendMessage(content);
      setContent("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message. Please try again.",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex-1">
        <Textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            handleTyping();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="min-h-[80px] resize-none"
        />
      </div>
      
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        
        <Button
          type="submit"
          size="icon"
          className="h-10 w-10"
          disabled={!content.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
