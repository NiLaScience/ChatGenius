import { useState } from "react";
import { useUsers } from "@/hooks/use-users";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user/UserAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { MessageSquare } from "lucide-react";
import { type User } from "@db/schema";

interface UserListProps {
  onSelectUser: (userId: number) => void;
  selectedUserId: number | null;
}

export default function UserList({ onSelectUser, selectedUserId }: UserListProps) {
  const { users, isLoading } = useUsers();
  const [expanded, setExpanded] = useState(true);

  if (isLoading) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Direct Messages</SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start px-2"
          onClick={() => setExpanded(!expanded)}
        >
          Direct Messages ({users?.length || 0})
        </Button>
      </SidebarGroupLabel>
      {expanded && (
        <SidebarMenu>
          {users?.map((user) => (
            <SidebarMenuItem key={user.id}>
              <SidebarMenuButton
                onClick={() => onSelectUser(user.id)}
                isActive={selectedUserId === user.id}
                className="w-full justify-start gap-2"
              >
                <UserAvatar user={user} className="h-6 w-6" />
                <span>{user.username}</span>
                <MessageSquare className="ml-auto h-4 w-4 opacity-60" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      )}
    </SidebarGroup>
  );
}
