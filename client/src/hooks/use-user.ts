import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { User } from "@db/schema";
import { useSocket } from './use-socket';
import { useEffect } from 'react';

type RequestResult = {
  message: string;
  user?: User;
};

async function handleRequest(
  url: string,
  method: string,
  body?: { username?: string; password?: string; avatarUrl?: string; status?: string; customStatus?: string }
): Promise<RequestResult> {
  try {
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return response.json();
  } catch (error: any) {
    throw new Error(error.message);
  }
}

async function fetchUser(): Promise<User | null> {
  try {
    const response = await fetch('/api/user', {
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }
      throw new Error(await response.text());
    }

    return response.json();
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export function useUser() {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const { data: user, error, isLoading } = useQuery<User | null>({
    queryKey: ['user'],
    queryFn: fetchUser,
    staleTime: Infinity,
    retry: false
  });

  const loginMutation = useMutation({
    mutationFn: (userData: { username: string; password: string; }) => 
      handleRequest('/api/login', 'POST', userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => handleRequest('/api/logout', 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (userData: { username: string; password: string; }) => 
      handleRequest('/api/register', 'POST', userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const guestLoginMutation = useMutation({
    mutationFn: () => handleRequest('/api/guest-login', 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const updateAvatarMutation = useMutation({
    mutationFn: (avatarUrl: string) => 
      handleRequest('/api/user/avatar', 'PUT', { avatarUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const result = await handleRequest('/api/user/status', 'PUT', { status });
      // Emit socket event after successful status update
      if (socket && user) {
        socket.emit("status_update", {
          userId: user.id,
          status,
          lastSeen: new Date()
        });
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  // Listen for status updates from other users
  useEffect(() => {
    if (!socket) return;

    const statusHandler = (data: {
      userId: number;
      status: string;
      lastSeen: Date;
    }) => {
      // Update the user query cache if it's the current user
      if (user && data.userId === user.id) {
        queryClient.setQueryData(['user'], (oldData: User | null) => {
          if (!oldData) return null;
          return {
            ...oldData,
            status: data.status,
            lastSeen: data.lastSeen
          };
        });
      }
    };

    socket.on("user_status", statusHandler);

    return () => {
      socket.off("user_status", statusHandler);
    };
  }, [socket, user, queryClient]);

  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    loginAsGuest: guestLoginMutation.mutateAsync,
    updateAvatar: updateAvatarMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
  };
}