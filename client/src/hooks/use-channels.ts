import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Channel } from "@db/schema";

export function useChannels() {
  const queryClient = useQueryClient();

  const { data: channels, isLoading } = useQuery<Channel[]>({
    queryKey: ["/api/channels"],
  });

  const createChannel = useMutation({
    mutationFn: async (channelData: Partial<Channel>) => {
      const response = await fetch("/api/channels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(channelData),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
    },
  });

  return {
    channels,
    isLoading,
    createChannel: createChannel.mutateAsync,
  };
}
