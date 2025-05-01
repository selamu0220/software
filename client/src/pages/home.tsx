import { useState } from "react";
import { User, VideoIdea } from "@shared/schema";
import { VideoIdeaContent } from "@/lib/openai";
import Hero from "@/components/home/Hero";
import Generator from "@/components/home/Generator";
import ResultView from "@/components/home/ResultView";
import WeeklyGenerator from "@/components/home/WeeklyGenerator";
import CalendarPreview from "@/components/home/CalendarPreview";
import Templates from "@/components/home/Templates";
import ThumbnailIdeas from "@/components/home/ThumbnailIdeas";
import Pricing from "@/components/home/Pricing";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GenerationRequest } from "@shared/schema";

interface HomeProps {
  user: User | null;
}

export default function Home({ user }: HomeProps) {
  const [generatedIdea, setGeneratedIdea] = useState<VideoIdeaContent | null>(null);
  const [weeklyIdeas, setWeeklyIdeas] = useState<VideoIdeaContent[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedIdeaId, setSavedIdeaId] = useState<number | null>(null);
  const [generationParams, setGenerationParams] = useState<GenerationRequest | null>(null);
  const { toast } = useToast();

  const handleIdeaGenerated = (idea: VideoIdeaContent, params: GenerationRequest) => {
    setGeneratedIdea(idea);
    setGenerationParams(params);
  };
  
  const handleWeeklyIdeasGenerated = (ideas: VideoIdeaContent[]) => {
    setWeeklyIdeas(ideas);
    // Si hay ideas generadas, mostrar la primera
    if (ideas.length > 0) {
      setGeneratedIdea(ideas[0]);
    }
  };

  const saveIdeaToProfile = async (idea: VideoIdeaContent) => {
    if (!user) {
      toast({
        title: "Necesitas iniciar sesión",
        description: "Debes iniciar sesión para guardar ideas",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await apiRequest("POST", "/api/video-ideas", {
        title: idea.title,
        category: idea.category,
        subcategory: idea.subcategory,
        videoLength: idea.videoLength,
        content: idea,
      });
      
      if (!response.ok) {
        throw new Error("Failed to save idea");
      }
      
      // Get the ID of the saved idea from the response
      const savedIdea = await response.json() as VideoIdea;
      setSavedIdeaId(savedIdea.id);
      
      toast({
        title: "Idea guardada",
        description: "Tu idea ha sido guardada en tu perfil",
      });
    } catch (error) {
      console.error("Error saving idea:", error);
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar la idea. Intenta de nuevo más tarde.",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <Hero user={user} />
      
      <Generator 
        onIdeaGenerated={handleIdeaGenerated} 
        isGenerating={isGenerating}
        setIsGenerating={setIsGenerating}
        user={user}
      />
      
      {generatedIdea && (
        <ResultView 
          ideaData={generatedIdea} 
          onSave={saveIdeaToProfile}
          user={user} 
          videoIdeaId={savedIdeaId || undefined}
        />
      )}
      
      {/* Generación de ideas semanales */}
      {user && (
        <WeeklyGenerator 
          user={user}
          generationParams={generationParams}
          onSuccess={handleWeeklyIdeasGenerated}
        />
      )}
      
      {!user && generatedIdea && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 mb-12">
          <div className="bg-muted/30 border border-border rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium mb-2">
              ¿Quieres más ideas y un calendario de contenido?
            </h3>
            <p className="text-muted-foreground mb-4">
              Regístrate gratis para generar ideas ilimitadas y organizar tu calendario de contenido.
            </p>
            <div className="flex justify-center space-x-4">
              <a href="/login" className="inline-flex items-center px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium bg-muted/50 hover:bg-muted">
                Iniciar Sesión
              </a>
              <a href="/register" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90">
                Registrarse Gratis
              </a>
            </div>
          </div>
        </div>
      )}
      
      <CalendarPreview 
        isLoggedIn={!!user} 
        isPremium={!!(user?.isPremium || user?.lifetimeAccess)} 
      />
      
      <Templates />
      
      <ThumbnailIdeas />
      
      <Pricing user={user} />
    </div>
  );
}
