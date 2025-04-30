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
    <section id="results" className="py-8 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-foreground mb-6 font-heading">Ideas Generadas</h2>

        {generatedIdea ? (
          // Single Generated Idea
          <Card className="idea-card mb-6">
            <div className="px-4 py-5 sm:px-6 flex items-start justify-between">
              <div>
                <h3 className="text-lg leading-6 font-medium text-foreground">
                  {generatedIdea.title}
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
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
            <CardContent className="border-t border-border">
              <div className="text-sm text-foreground">
                <p className="font-medium mb-2">Estructura del Video:</p>
                <ul className="space-y-1">
                  {generatedIdea.outline.map((point, index) => (
                    <li key={index} className="idea-list-item">{point}</li>
                  ))}
                </ul>
                <div className="mt-4 p-3 bg-accent rounded-md border border-border">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">Mención a mitad de video:</span> {generatedIdea.midVideoMention}
                  </p>
                </div>
                <div className="mt-3 p-3 bg-secondary rounded-md border border-border">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">Mención al final de video:</span> {generatedIdea.endVideoMention}
                  </p>
                </div>
                <div className="mt-3 p-3 bg-accent rounded-md border border-border">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">Idea para la miniatura:</span> {generatedIdea.thumbnailIdea}
                  </p>
                </div>
                <div className="mt-3 p-3 bg-secondary rounded-md border border-border">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">Pregunta para interacción:</span> {generatedIdea.interactionQuestion}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-card px-4 py-4 sm:px-6 flex justify-between flex-wrap gap-2">
              <Button variant="outline" onClick={downloadIdea}>
                <Download className="mr-2 h-4 w-4" />
                Descargar
              </Button>
              {user?.isPremium || user?.lifetimeAccess ? (
                <Button onClick={saveToCalendar} variant="default">
                  <Calendar className="mr-2 h-4 w-4" />
                  Guardar en calendario
                </Button>
              ) : (
                <Link href="/subscribe">
                  <Button variant="link" className="text-primary hover:text-primary/80">
                    <Lock className="mr-2 h-4 w-4" />
                    Guardar en calendario (Upgrade a Pro)
                  </Button>
                </Link>
              )}
            </CardFooter>
          </Card>
        ) : null}

        {/* Login/Signup Prompt */}
        {!user && (
          <Card className="mb-6">
            <CardContent className="px-4 py-5 sm:p-6 text-center">
              <h3 className="text-lg leading-6 font-medium text-foreground mb-2">
                ¿Quieres más ideas y un calendario de contenido?
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Regístrate gratis durante nuestro periodo Beta para generar ideas ilimitadas y organizar tu calendario de contenido.
              </p>
              <div className="flex justify-center space-x-4">
                <Link href="/login">
                  <Button variant="outline">Iniciar Sesión</Button>
                </Link>
                <Link href="/register">
                  <Button>Registrarse Gratis</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
