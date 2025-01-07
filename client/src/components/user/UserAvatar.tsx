import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";

const AVATARS = ["👤", "🐱", "🐶", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸"];

export function UserAvatar({ user, className }: { user: any; className?: string }) {
  const [open, setOpen] = useState(false);
  const { updateAvatar } = useUser();
  const isOnline = user.status === "online";

  const handleAvatarSelect = async (emoji: string) => {
    try {
      await updateAvatar(emoji);
      setOpen(false);
    } catch (error) {
      console.error("Failed to update avatar:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="relative p-0">
          <Avatar className={cn("h-8 w-8", className)}>
            <AvatarImage src={user.avatarUrl} />
            <AvatarFallback>{user.avatarUrl || user.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <span 
            className={cn(
              "absolute bottom-0 right-0 h-2 w-2 rounded-full border border-background",
              isOnline ? "bg-green-500" : "bg-gray-500"
            )}
          />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Choose your avatar</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-6 gap-2">
          {AVATARS.map((emoji) => (
            <Button
              key={emoji}
              variant="outline"
              className="h-12 w-12 text-xl"
              onClick={() => handleAvatarSelect(emoji)}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function UserStatus({ user, className }: { user: any; className?: string }) {
  const [open, setOpen] = useState(false);
  const { updateStatus } = useUser();
  const statuses = ["online", "away", "busy", "offline"];

  const handleStatusSelect = async (status: string) => {
    try {
      await updateStatus(status);
      setOpen(false);
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className={className}>
          {user.status === "online" && "🟢 "}
          {user.status === "away" && "🌙 "}
          {user.status === "busy" && "⛔ "}
          {user.status === "offline" && "⚫ "}
          {user.customStatus || user.status}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set your status</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {statuses.map((status) => (
            <Button
              key={status}
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleStatusSelect(status)}
            >
              {status === "online" && "🟢 Online"}
              {status === "away" && "🌙 Away"}
              {status === "busy" && "⛔ Do not disturb"}
              {status === "offline" && "⚫ Appear offline"}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
