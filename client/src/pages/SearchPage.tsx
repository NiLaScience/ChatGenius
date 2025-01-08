import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { FileText, MessageSquare, Loader2, ArrowLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface SearchResult {
  id: number;
  type: "message" | "file";
  content: string;
  channelId: number;
  channelName: string;
  fileName?: string;
  fileUrl?: string;
  fileType?: string;
  username: string;
  createdAt: string;
  threadId?: number;
}

async function fetchSearchResults(query: string): Promise<SearchResult[]> {
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch search results');
  }
  
  return response.json();
}

export default function SearchPage() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const query = searchParams.get("q") || "";

  const { data: results, isLoading } = useQuery<SearchResult[]>({
    queryKey: ['search', query],
    queryFn: () => fetchSearchResults(query),
    enabled: !!query,
  });

  const navigateToMessage = (result: SearchResult) => {
    const baseUrl = `/channels/${result.channelId}`;
    const url = result.threadId 
      ? `${baseUrl}/threads/${result.threadId}` 
      : baseUrl;
    setLocation(url);
  };

  const handleBack = () => {
    setLocation("/");
  };

  const BackButton = () => (
    <Button 
      variant="outline" 
      onClick={handleBack}
      className="absolute top-4 left-4"
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      Back to Chat
    </Button>
  );

  if (!query) {
    return (
      <div className="relative h-full">
        <BackButton />
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Enter a search term to begin
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="relative h-full">
        <BackButton />
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!results?.length) {
    return (
      <div className="relative h-full">
        <BackButton />
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No results found for "{query}"
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col p-6">
      <BackButton />
      <h1 className="text-2xl font-semibold mb-4 mt-12">
        Search results for "{query}"
      </h1>
      <ScrollArea className="flex-1">
        <div className="space-y-4">
          {results.map((result) => (
            <Button
              key={`${result.type}-${result.id}`}
              variant="ghost"
              className="w-full justify-start p-4 h-auto"
              onClick={() => navigateToMessage(result)}
            >
              <div className="flex gap-3 items-start w-full">
                {result.type === "file" ? (
                  <FileText className="h-5 w-5 flex-shrink-0 mt-1" />
                ) : (
                  <MessageSquare className="h-5 w-5 flex-shrink-0 mt-1" />
                )}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{result.username}</span>
                    <span className="text-xs text-muted-foreground">
                      in #{result.channelName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(result.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {result.type === "file" ? (
                    <div>
                      <span className="text-sm">{result.content}</span>
                      <div className="mt-1 text-sm text-muted-foreground">
                        File: {result.fileName}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm">{result.content}</span>
                  )}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
