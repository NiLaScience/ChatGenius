import { useState } from "react";
import { useUsers } from "@/hooks/use-users";
import { Button } from "@/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { MessageSquare, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
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
        <SidebarGroupLabel>
          <div className="flex items-center gap-2">
            <ChevronDown className="h-4 w-4" />
            <span>Direct Messages</span>
          </div>
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {[1, 2, 3].map((i) => (
              <SidebarMenuItem key={i}>
                <SidebarMenuButton
                  className="animate-pulse bg-muted/50"
                  disabled
                />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
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
          className="w-full justify-start px-2 gap-2"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <span>Direct Messages</span>
          <span className="ml-auto text-xs text-muted-foreground">
            ({users?.length || 0})
          </span>
        </Button>
      </SidebarGroupLabel>
      {expanded && (
        <SidebarGroupContent>
          <SidebarMenu>
            {users?.map((user) => (
              <SidebarMenuItem key={user.id}>
                <SidebarMenuButton
                  onClick={() => onSelectUser(user.id)}
                  isActive={selectedUserId === user.id}
                >
                  <div className="relative flex items-center">
                    <div className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                      {user.avatarUrl}
                      <div
                        className={cn(
                          "absolute bottom-0 right-0 h-2 w-2 rounded-full border border-background",
                          user.status === "online"
                            ? "bg-green-500"
                            : "bg-zinc-500"
                        )}
                      />
                    </div>
                    <span className="ml-2 truncate">{user.username}</span>
                  </div>
                  <MessageSquare className="ml-auto h-4 w-4 opacity-60" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      )}
    </SidebarGroup>
  );
}