import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSocket } from "./use-socket";
import { useEffect, useCallback } from "react";
import { useUser } from "./use-user";
import { useToast } from "@/hooks/use-toast";
import type { Message } from "@db/schema";

interface FileAttachment {
  fileName: string;
  fileUrl: string;
  fileType: string;
}

export function useMessages(channelId: number, threadId?: number) {
  const queryClient = useQueryClient();
  const socket = useSocket();
  const { user } = useUser();
  const { toast } = useToast();

  // Query for messages - either channel messages or thread replies
  const queryKey = threadId 
    ? [`/api/messages/${threadId}/replies`]
    : [`/api/channels/${channelId}/messages`];

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey,
    enabled: threadId ? !!threadId : !!channelId,
  });

  const updateMessages = useCallback((newMessage: Message, queryKey: string[]) => {
    queryClient.setQueryData<Message[]>(queryKey, (oldMessages = []) => {
      // Check if message already exists
      const exists = oldMessages.some(msg => msg.id === newMessage.id);
      if (exists) return oldMessages;

      // Add new message and sort by creation time
      return [...oldMessages, newMessage].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });
  }, [queryClient]);

  const sendMessage = useMutation({
    mutationFn: async (content: string, fileAttachment?: FileAttachment) => {
      if (!socket || !user) {
        throw new Error("Socket not connected or user not logged in");
      }

      return new Promise<void>((resolve, reject) => {
        socket.emit("message", {
          content,
          channelId,
          userId: user.id,
          parentId: threadId,
          fileAttachment,
        });

        // Wait for error or success
        const errorHandler = (error: any) => {
          socket.off("message_error", errorHandler);
          reject(error);
        };

        socket.once("message_error", errorHandler);

        // Resolve after a short delay if no error received
        setTimeout(() => {
          socket.off("message_error", errorHandler);
          resolve();
        }, 1000);
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error sending message",
        description: error.message || "Please try again",
      });
    },
  });

  useEffect(() => {
    if (!socket) return;

    // Join channel room
    if (channelId) {
      console.log("Joining channel:", channelId);
      socket.emit("join_channel", channelId);
    }

    // Join thread room if in a thread
    if (threadId) {
      console.log("Joining thread:", threadId);
      socket.emit("join_thread", threadId);
    }

    // Handle new messages
    const messageHandler = (newMessage: Message) => {
      console.log("Received new channel message:", newMessage);
      if (!threadId && newMessage.channelId === channelId) {
        updateMessages(newMessage, [`/api/channels/${channelId}/messages`]);
      }
    };

    // Handle thread messages
    const threadMessageHandler = (newMessage: Message) => {
      console.log("Received new thread message:", newMessage);
      if (threadId === newMessage.parentId) {
        updateMessages(newMessage, [`/api/messages/${threadId}/replies`]);
      }
    };

    socket.on("message", messageHandler);
    socket.on("thread_message", threadMessageHandler);
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Lost connection to the chat server. Trying to reconnect...",
      });
    });

    return () => {
      if (channelId) {
        console.log("Leaving channel:", channelId);
        socket.emit("leave_channel", channelId);
      }
      if (threadId) {
        console.log("Leaving thread:", threadId);
        socket.emit("leave_thread", threadId);
      }
      socket.off("message", messageHandler);
      socket.off("thread_message", threadMessageHandler);
      socket.off("connect_error");
    };
  }, [channelId, threadId, socket, updateMessages, toast, queryKey]);

  return {
    messages: messages || [],
    isLoading,
    sendMessage: sendMessage.mutateAsync,
  };
}