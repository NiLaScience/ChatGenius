import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSocket } from "./use-socket";
import { useEffect } from "react";
import { useUser } from "./use-user";
import type { Message } from "@db/schema";

export function useMessages(channelId: number, threadId?: number) {
  const queryClient = useQueryClient();
  const socket = useSocket();
  const { user } = useUser();

  // Query for messages - either channel messages or thread replies
  const queryKey = threadId 
    ? [`/api/messages/${threadId}/replies`]
    : [`/api/channels/${channelId}/messages`];

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey,
    enabled: threadId ? !!threadId : !!channelId,
  });

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!socket || !user) throw new Error("Socket not connected or user not logged in");

      socket.emit("message", {
        content,
        channelId,
        userId: user.id,
        parentId: threadId, // Include parentId for thread replies
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
    socket.on("message", (newMessage: Message) => {
      console.log("Received new channel message:", newMessage);
      if (!threadId) { // Only update channel messages if not in a thread
        queryClient.setQueryData(
          [`/api/channels/${channelId}/messages`],
          (old: Message[] = []) => [...old, newMessage]
        );
      }
    });

    // Handle thread messages
    socket.on("thread_message", (newMessage: Message) => {
      console.log("Received new thread message:", newMessage);
      if (threadId === newMessage.parentId) {
        queryClient.setQueryData(
          [`/api/messages/${threadId}/replies`],
          (old: Message[] = []) => [...old, newMessage]
        );
      }
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
      socket.off("message");
      socket.off("thread_message");
    };
  }, [channelId, threadId, socket, queryClient]);

  return {
    messages,
    isLoading,
    sendMessage: sendMessage.mutateAsync,
  };
}