import { useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import MessageList from "../components/chat/MessageList";
import MessageInput from "../components/chat/MessageInput";
import ThreadView from "../components/chat/ThreadView";
import { useChannels } from "../hooks/use-channels";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

export default function ChatPage() {
  const [selectedChannel, setSelectedChannel] = useState<number | null>(null);
  const [selectedThread, setSelectedThread] = useState<number | null>(null);
  const { channels } = useChannels();

  const selectedChannelData = channels?.find(c => c.id === selectedChannel);

  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-screen">
      <ResizablePanel defaultSize={20} minSize={15} maxSize={25}>
        <Sidebar
          channels={channels || []}
          selectedChannel={selectedChannel}
          onSelectChannel={setSelectedChannel}
        />
      </ResizablePanel>

      <ResizableHandle />

      <ResizablePanel defaultSize={selectedThread ? 50 : 80} minSize={45}>
        <div className="flex flex-col h-screen">
          <div className="px-6 py-4 border-b bg-card">
            <h2 className="text-xl font-semibold text-card-foreground">
              {selectedChannelData ? `#${selectedChannelData.name}` : "Select a channel"}
            </h2>
            {selectedChannelData?.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {selectedChannelData.description}
              </p>
            )}
          </div>

          <div className="flex-1 overflow-hidden">
            {selectedChannel && (
              <MessageList
                channelId={selectedChannel}
                onThreadSelect={setSelectedThread}
              />
            )}
          </div>

          {selectedChannel && !selectedThread && (
            <div className="px-6 py-4 border-t bg-background">
              <MessageInput channelId={selectedChannel} />
            </div>
          )}
        </div>
      </ResizablePanel>

      {selectedThread && (
        <>
          <ResizableHandle />
          <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
            <ThreadView
              messageId={selectedThread}
              onClose={() => setSelectedThread(null)}
            />
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
}