import { useState } from "react";
import { useForm } from "react-hook-form";
import { useChannels } from "@/hooks/use-channels";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface CreateChannelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  name: string;
  description: string;
  isPrivate: boolean;
}

export default function CreateChannel({ open, onOpenChange }: CreateChannelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { createChannel } = useChannels();
  const { toast } = useToast();
  const form = useForm<FormData>({
    defaultValues: {
      name: "",
      description: "",
      isPrivate: false,
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await createChannel({
        name: data.name.toLowerCase().replace(/\s+/g, "-"),
        description: data.description,
        isPrivate: data.isPrivate,
      });

      toast({
        title: "Channel created",
        description: `#${data.name} has been created successfully.`,
      });

      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a new channel</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Channel name</Label>
            <Input
              id="name"
              placeholder="e.g. general"
              {...form.register("name", { required: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What's this channel about?"
              {...form.register("description")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="private">Private channel</Label>
              <div className="text-sm text-muted-foreground">
                Only invited members can view this channel
              </div>
            </div>
            <Switch
              id="private"
              checked={form.watch("isPrivate")}
              onCheckedChange={(checked) =>
                form.setValue("isPrivate", checked)
              }
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
                  Creating...
                </div>
              ) : (
                "Create Channel"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
