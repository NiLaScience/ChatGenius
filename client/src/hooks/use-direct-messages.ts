import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSocket } from "./use-socket";
import { useEffect, useCallback } from "react";
import { useUser } from "./use-user";
import { useToast } from "@/hooks/use-toast";
import type { DirectMessage, User } from "@db/schema";

export function useDirectMessages(otherUserId?: number) {
  const queryClient = useQueryClient();
  const socket = useSocket();
  const { user } = useUser();
  const { toast } = useToast();

  const { data: messages, isLoading } = useQuery<DirectMessage[]>({
    queryKey: [`/api/users/${otherUserId}/messages`],
    enabled: !!otherUserId && !!user,
  });

  const updateMessages = useCallback((newMessage: DirectMessage) => {
    queryClient.setQueryData<DirectMessage[]>(
      [`/api/users/${otherUserId}/messages`],
      (oldMessages = []) => {
        const exists = oldMessages.some((msg) => msg.id === newMessage.id);
        if (exists) return oldMessages;

        return [...oldMessages, newMessage].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
    );
  }, [otherUserId, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!socket || !user || !otherUserId) {
        throw new Error("Socket not connected or user not logged in");
      }

      return new Promise<void>((resolve, reject) => {
        socket.emit("direct_message", {
          content,
          senderId: user.id,
          receiverId: otherUserId,
        });

        const errorHandler = (error: any) => {
          socket.off("direct_message_error", errorHandler);
          reject(error);
        };

        socket.once("direct_message_error", errorHandler);

        setTimeout(() => {
          socket.off("direct_message_error", errorHandler);
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
    if (!socket || !user) return;

    // Authenticate the socket connection
    socket.emit("authenticate", user.id);

    // Handle direct messages
    const messageHandler = (newMessage: DirectMessage) => {
      if (
        otherUserId &&
        (newMessage.senderId === otherUserId || newMessage.receiverId === otherUserId)
      ) {
        updateMessages(newMessage);
      }
    };

    socket.on("direct_message", messageHandler);

    return () => {
      socket.off("direct_message", messageHandler);
    };
  }, [socket, user, otherUserId, updateMessages]);

  return {
    messages: messages || [],
    isLoading,
    sendMessage: sendMessage.mutateAsync,
  };
}

export function useOnlineUsers() {
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const queryClient = useQueryClient();
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const statusHandler = (data: {
      userId: number;
      status: string;
      lastSeen: Date;
    }) => {
      queryClient.setQueryData<User[]>(["/api/users"], (oldUsers = []) => {
        return oldUsers.map((user) => {
          if (user.id === data.userId) {
            return {
              ...user,
              status: data.status,
              lastSeen: data.lastSeen,
            };
          }
          return user;
        });
      });
    };

    socket.on("user_status", statusHandler);

    return () => {
      socket.off("user_status", statusHandler);
    };
  }, [socket, queryClient]);

  return {
    users: users || [],
    onlineUsers: users?.filter((user) => user.status === "online") || [],
  };
}
