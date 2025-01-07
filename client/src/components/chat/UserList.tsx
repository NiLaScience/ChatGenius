import { useState } from "react";
import { useUsers } from "@/hooks/use-users";
import { Button } from "@/components/ui/button";
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
      <div className="space-y-2">
        <div className="px-2">
          <Button variant="ghost" size="sm" disabled className="w-full justify-start">
            <ChevronDown className="h-4 w-4 mr-2" />
            Direct Messages
          </Button>
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-9 px-2 animate-pulse rounded-md bg-muted/50"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="px-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 mr-2" />
          ) : (
            <ChevronRight className="h-4 w-4 mr-2" />
          )}
          Direct Messages
          <span className="ml-auto text-xs text-muted-foreground">
            ({users.length})
          </span>
        </Button>
      </div>

      {expanded && (
        <div className="space-y-1">
          {users.map((user) => (
            <Button
              key={user.id}
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start px-4 relative",
                selectedUserId === user.id && "bg-accent text-accent-foreground"
              )}
              onClick={() => onSelectUser(user.id)}
            >
              <div className="relative flex items-center min-w-0">
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
                <MessageSquare className="ml-auto h-4 w-4 opacity-60" />
              </div>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}