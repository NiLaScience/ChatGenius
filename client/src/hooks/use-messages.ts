import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSocket } from "./use-socket";
import { useEffect } from "react";
import type { Message } from "@db/schema";

export function useMessages(channelId: number) {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: [`/api/channels/${channelId}/messages`],
    enabled: !!channelId,
  });

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!socket) throw new Error("Socket not connected");
      
      socket.emit("message", {
        content,
        channelId,
        userId: socket.auth.userId,
      });
    },
  });

  useEffect(() => {
    if (!socket || !channelId) return;

    socket.emit("join_channel", channelId);

    socket.on("message", (newMessage: Message) => {
      queryClient.setQueryData(
        [`/api/channels/${channelId}/messages`],
        (old: Message[] = []) => [...old, newMessage]
      );
    });

    return () => {
      socket.emit("leave_channel", channelId);
      socket.off("message");
    };
  }, [channelId, socket, queryClient]);

  return {
    messages,
    isLoading,
    sendMessage: sendMessage.mutateAsync,
  };
}
