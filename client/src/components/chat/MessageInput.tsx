import { useState, useRef, useEffect } from "react";
import { useMessages } from "@/hooks/use-messages";
import { useSocket } from "@/hooks/use-socket";
import { useUser } from "@/hooks/use-user";
import { Paperclip, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface MessageInputProps {
  channelId: number;
  threadId?: number;
}

type FileUpload = {
  file: File;
  preview?: string;
  progress: number;
};

export default function MessageInput({ channelId, threadId }: MessageInputProps) {
  const [content, setContent] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [fileUpload, setFileUpload] = useState<FileUpload | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sendMessage } = useMessages(channelId, threadId);
  const socket = useSocket();
  const { user } = useUser();
  const { toast } = useToast();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (fileUpload?.preview) {
        URL.revokeObjectURL(fileUpload.preview);
      }
    };
  }, [fileUpload]);

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socket?.emit("typing", {
        channelId,
        threadId,
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const isImage = file.type.startsWith('image/');
    const isPDF = file.type === 'application/pdf';

    if (!isImage && !isPDF) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload only images or PDF files.",
      });
      return;
    }

    // Create preview for images
    const preview = isImage ? URL.createObjectURL(file) : undefined;

    setFileUpload({
      file,
      preview,
      progress: 0,
    });
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() && !fileUpload) return;

    try {
      let fileUrl;
      if (fileUpload) {
        fileUrl = await uploadFile(fileUpload.file);
      }

      await sendMessage(content, fileUpload ? {
        fileName: fileUpload.file.name,
        fileUrl,
        fileType: fileUpload.file.type.startsWith('image/') ? 'image' : 'pdf'
      } : undefined);

      setContent("");
      setFileUpload(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {fileUpload && (
        <div className="relative px-4 py-2 bg-accent rounded-lg">
          <div className="flex items-start gap-2">
            {fileUpload.preview ? (
              <img
                src={fileUpload.preview}
                alt="Upload preview"
                className="w-20 h-20 object-cover rounded"
              />
            ) : (
              <div className="w-20 h-20 bg-background rounded flex items-center justify-center">
                <span className="text-sm">PDF</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{fileUpload.file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(fileUpload.file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <Progress value={fileUpload.progress} className="h-1 mt-2" />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => {
                if (fileUpload.preview) {
                  URL.revokeObjectURL(fileUpload.preview);
                }
                setFileUpload(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              handleTyping();
            }}
            onKeyDown={handleKeyDown}
            placeholder={threadId ? "Reply in thread..." : "Type a message..."}
            className="min-h-[80px] resize-none"
          />
        </div>

        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <Button
            type="submit"
            size="icon"
            className="h-10 w-10"
            disabled={!content.trim() && !fileUpload}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </form>
  );
}