import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Channel } from "@db/schema";

interface ChannelListProps {
  channels: Channel[];
  selectedChannel: number | null;
  onSelectChannel: (channelId: number) => void;
  onCreateChannel: () => void;
}

export default function ChannelList({
  channels,
  selectedChannel,
  onSelectChannel,
  onCreateChannel,
}: ChannelListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4">
        <h2 className="text-lg font-semibold">Channels</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCreateChannel}
          className="h-8 w-8"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <ScrollArea className="h-[calc(100vh-10rem)]">
        <div className="space-y-1 p-2">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => onSelectChannel(channel.id)}
              className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                selectedChannel === channel.id
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              }`}
            >
              <span className="text-sm font-medium">#{channel.name}</span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
