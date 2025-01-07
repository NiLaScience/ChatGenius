import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSocket } from "./use-socket";
import { useEffect } from "react";
import { useUser } from "./use-user";
import type { Message } from "@db/schema";

export function useMessages(channelId: number) {
  const queryClient = useQueryClient();
  const socket = useSocket();
  const { user } = useUser();

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: [`/api/channels/${channelId}/messages`],
    enabled: !!channelId,
  });

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!socket || !user) throw new Error("Socket not connected or user not logged in");

      socket.emit("message", {
        content,
        channelId,
        userId: user.id,
      });
    },
  });

  useEffect(() => {
    if (!socket || !channelId) return;

    console.log("Joining channel:", channelId);
    socket.emit("join_channel", channelId);

    socket.on("message", (newMessage: Message) => {
      console.log("Received new message:", newMessage);
      queryClient.setQueryData(
        [`/api/channels/${channelId}/messages`],
        (old: Message[] = []) => [...old, newMessage]
      );
    });

    return () => {
      console.log("Leaving channel:", channelId);
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