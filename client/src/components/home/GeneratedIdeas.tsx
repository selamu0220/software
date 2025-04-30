import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VideoIdeaContent } from "@/lib/openai";
import { User } from "@shared/schema";
import { RefreshCw, Calendar, Bookmark, Download, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GeneratedIdeasProps {
  generatedIdea: VideoIdeaContent | null;
  user: User | null;
  regenerateIdea: () => void;
  isGenerating: boolean;
}

export default function GeneratedIdeas({ generatedIdea, user, regenerateIdea, isGenerating }: GeneratedIdeasProps) {
  const { toast } = useToast();
  const [isSaved, setIsSaved] = useState(false);

  // Save to calendar function (mock for now)
  const saveToCalendar = () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "You need to sign in to save ideas to your calendar.",
        variant: "destructive",
      });
      return;
    }

    // If user is not premium, show upgrade message
    if (!user.isPremium && !user.lifetimeAccess) {
      toast({
        title: "Premium feature",
        description: "You need to upgrade to premium to use the calendar feature.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Added to calendar",
      description: "Your video idea has been added to your content calendar.",
    });
  };

  // Save to favorites function
  const saveToFavorites = () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "You need to sign in to save ideas to your favorites.",
        variant: "destructive",
      });
      return;
    }

    setIsSaved(!isSaved);
    toast({
      title: isSaved ? "Removed from favorites" : "Saved to favorites",
      description: isSaved 
        ? "Your video idea has been removed from your favorites." 
        : "Your video idea has been saved to your favorites.",
    });
  };

  // Download idea as text
  const downloadIdea = () => {
    if (!generatedIdea) return;

    const content = `
      # ${generatedIdea.title}
      
      ## Video Details
      - Category: ${generatedIdea.category}
      - Subcategory: ${generatedIdea.subcategory}
      - Video Length: ${generatedIdea.videoLength}
      
      ## Outline
      ${generatedIdea.outline.map((point, index) => `${index + 1}. ${point}`).join('\n')}
      
      ## Mid-Video Mention
      ${generatedIdea.midVideoMention}
      
      ## End-Video Mention
      ${generatedIdea.endVideoMention}
      
      ## Thumbnail Idea
      ${generatedIdea.thumbnailIdea}
      
      ## Viewer Interaction Question
      ${generatedIdea.interactionQuestion}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `youtube-idea-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section id="results" className="py-8 bg-ytlight">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-ytdark mb-6 font-heading">Generated Ideas</h2>

        {generatedIdea ? (
          // Single Generated Idea
          <Card className="bg-white shadow overflow-hidden sm:rounded-md mb-6">
            <div className="px-4 py-5 sm:px-6 flex items-start justify-between">
              <div>
                <h3 className="text-lg leading-6 font-medium text-ytdark">
                  {generatedIdea.title}
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-ytgray">
                  {generatedIdea.category} | {generatedIdea.subcategory} | {generatedIdea.videoLength}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full" 
                  onClick={regenerateIdea}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full" 
                  onClick={saveToCalendar}
                >
                  <Calendar className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className={`rounded-full ${isSaved ? 'text-primary border-primary' : ''}`}
                  onClick={saveToFavorites}
                >
                  <Bookmark className="h-4 w-4" fill={isSaved ? "currentColor" : "none"} />
                </Button>
              </div>
            </div>
            <CardContent className="border-t border-gray-200">
              <div className="text-sm text-ytdark">
                <p className="font-medium mb-2">Video Outline:</p>
                <ul className="list-disc pl-5 space-y-1">
                  {generatedIdea.outline.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
                <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Mid-video mention:</span> {generatedIdea.midVideoMention}
                  </p>
                </div>
                <div className="mt-3 p-3 bg-green-50 rounded-md border border-green-100">
                  <p className="text-sm text-green-800">
                    <span className="font-medium">End-video mention:</span> {generatedIdea.endVideoMention}
                  </p>
                </div>
                <div className="mt-3 p-3 bg-purple-50 rounded-md border border-purple-100">
                  <p className="text-sm text-purple-800">
                    <span className="font-medium">Thumbnail idea:</span> {generatedIdea.thumbnailIdea}
                  </p>
                </div>
                <div className="mt-3 p-3 bg-yellow-50 rounded-md border border-yellow-100">
                  <p className="text-sm text-yellow-800">
                    <span className="font-medium">Interaction question:</span> {generatedIdea.interactionQuestion}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-between flex-wrap gap-2">
              <Button variant="outline" onClick={downloadIdea}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              {user?.isPremium || user?.lifetimeAccess ? (
                <Button onClick={saveToCalendar} className="bg-accent hover:bg-blue-700">
                  <Calendar className="mr-2 h-4 w-4" />
                  Save to calendar
                </Button>
              ) : (
                <Link href="/subscribe">
                  <Button variant="link" className="text-accent hover:text-blue-700">
                    <Lock className="mr-2 h-4 w-4" />
                    Save to calendar (Upgrade to Pro)
                  </Button>
                </Link>
              )}
            </CardFooter>
          </Card>
        ) : null}

        {/* Login/Signup Prompt */}
        {!user && (
          <Card className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <CardContent className="px-4 py-5 sm:p-6 text-center">
              <h3 className="text-lg leading-6 font-medium text-ytdark mb-2">
                Want more ideas and a content calendar?
              </h3>
              <p className="text-sm text-ytgray mb-4">
                Sign up for free during our Beta period to generate unlimited ideas and organize your content calendar.
              </p>
              <div className="flex justify-center space-x-4">
                <Link href="/login">
                  <Button variant="outline">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button>Sign Up Free</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
