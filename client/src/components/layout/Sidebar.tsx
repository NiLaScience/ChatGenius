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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, LogOut } from "lucide-react";
import ChannelList from "../chat/ChannelList";
import UserList from "../chat/UserList";
import CreateChannel from "../modals/CreateChannel";
import type { Channel } from "@db/schema";
import {
  Sidebar as SidebarComponent,
  SidebarProvider,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";

interface SidebarProps {
  channels: Channel[];
  selectedChannel: number | null;
  onSelectChannel: (channelId: number) => void;
  selectedUserId: number | null;
  onSelectUser: (userId: number) => void;
}

export default function Sidebar({
  channels,
  selectedChannel,
  onSelectChannel,
  selectedUserId,
  onSelectUser,
}: SidebarProps) {
  const { user, logout } = useUser();
  const [showCreateChannel, setShowCreateChannel] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  return (
    <SidebarProvider defaultOpen>
      <SidebarComponent>
        <SidebarHeader className="border-b">
          <h1 className="text-xl font-bold px-4 py-3">ChatGenius</h1>
        </SidebarHeader>

        <SidebarContent>
          <div className="space-y-4">
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
        </SidebarContent>

        <SidebarFooter className="border-t">
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
        </SidebarFooter>

        <CreateChannel
          open={showCreateChannel}
          onOpenChange={setShowCreateChannel}
        />
      </SidebarComponent>
    </SidebarProvider>
  );
}