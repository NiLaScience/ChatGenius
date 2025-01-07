import { useQuery } from '@tanstack/react-query';
import type { User } from "@db/schema";

async function fetchUsers(): Promise<User[]> {
  try {
    const response = await fetch('/api/users', {
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Not authenticated');
      }
      throw new Error(`${response.status}: ${await response.text()}`);
    }

    return response.json();
  } catch (error: any) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

export function useUsers() {
  const { data: users, error, isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: fetchUsers,
    refetchInterval: 30000, // Refresh every 30 seconds to update status
    retry: false,
  });

  return {
    users: users || [],
    isLoading,
    error,
  };
}