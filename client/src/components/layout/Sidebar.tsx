import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import ChannelList from "../chat/ChannelList";
import UserList from "../chat/UserList";
import CreateChannel from "../modals/CreateChannel";
import type { Channel } from "@db/schema";

interface SidebarProps {
  channels: Channel[];
  selectedChannel: number | null;
  onSelectChannel: (channelId: number) => void;
  selectedUserId: number | null;
  onSelectUser: (userId: number) => void;
}

type Status = "online" | "offline" | "away" | "busy";

export function Sidebar({
  channels,
  selectedChannel,
  onSelectChannel,
  selectedUserId,
  onSelectUser,
}: SidebarProps) {
  const { user, logout, updateStatus } = useUser();
  const [showCreateChannel, setShowCreateChannel] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  const handleStatusUpdate = async (status: Status) => {
    try {
      await updateStatus(status);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getStatusColor = (status: string | null | undefined) => {
    if (!status) return "bg-zinc-500";
    
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "busy":
        return "bg-red-500";
      default:
        return "bg-zinc-500";
    }
  };

  return (
    <div className="flex flex-col h-screen bg-sidebar border-r">
      <div className="p-4 border-b flex justify-between items-center">
        <h1 className="text-xl font-bold text-sidebar-foreground">ChatGenius</h1>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <div className={cn(
                "h-2 w-2 rounded-full",
                getStatusColor(user?.status)
              )} />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="end" className="w-[200px]">
            <div className="space-y-2">
              <h4 className="font-medium leading-none mb-3">Set Status</h4>
              <button
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-sm hover:bg-accent"
                onClick={() => handleStatusUpdate('online')}
              >
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Online
              </button>
              <button
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-sm hover:bg-accent"
                onClick={() => handleStatusUpdate('away')}
              >
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                Away
              </button>
              <button
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-sm hover:bg-accent"
                onClick={() => handleStatusUpdate('busy')}
              >
                <div className="w-2 h-2 rounded-full bg-red-500" />
                Do Not Disturb
              </button>
              <button
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-sm hover:bg-accent"
                onClick={() => handleStatusUpdate('offline')}
              >
                <div className="w-2 h-2 rounded-full bg-zinc-500" />
                Offline
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 p-4">
          <ChannelList
            channels={channels}
            selectedChannel={selectedChannel}
            onSelectChannel={onSelectChannel}
            onCreateChannel={() => setShowCreateChannel(true)}
          />

          <UserList
            selectedUserId={selectedUserId}
            onSelectUser={onSelectUser}
          />
        </div>
      </div>

      <div className="p-4 border-t mt-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 px-2"
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={user?.avatarUrl} />
                <AvatarFallback>
                  {user?.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{user?.username}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CreateChannel
        open={showCreateChannel}
        onOpenChange={setShowCreateChannel}
      />
    </div>
  );
}

export default Sidebar;