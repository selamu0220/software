import { useState } from "react";
import { User, VideoIdea } from "@shared/schema";
import { VideoIdeaContent, MultiGenerationResponse } from "@/lib/openai";

import Hero from "@/components/home/Hero";
import Generator from "@/components/home/Generator";
import ResultView from "@/components/home/ResultView";
import WeeklyGenerator from "@/components/home/WeeklyGenerator";
import WeeklyPlanView from "@/components/home/WeeklyPlanView";
import ScriptViewer from "@/components/home/ScriptViewer";
import IdeasViewer from "@/components/home/IdeasViewer";
import CalendarPreview from "@/components/home/CalendarPreview";
import Templates from "@/components/home/Templates";
import ThumbnailIdeas from "@/components/home/ThumbnailIdeas";
import TrustpilotBanner from "@/components/home/TrustpilotBanner";
import Pricing from "@/components/home/Pricing";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GenerationRequest } from "@shared/schema";

interface HomeProps {
  user: User | null;
}

export default function Home({ user }: HomeProps) {
  const [generatedIdea, setGeneratedIdea] = useState<VideoIdeaContent | null>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<MultiGenerationResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedIdeaId, setSavedIdeaId] = useState<number | null>(null);
  const [generationParams, setGenerationParams] = useState<GenerationRequest | null>(null);
  const [selectedScriptViewerOpen, setSelectedScriptViewerOpen] = useState(false);
  const [selectedScript, setSelectedScript] = useState<VideoIdeaContent | null>(null);
  const { toast } = useToast();

  const handleIdeaGenerated = (idea: VideoIdeaContent, params: GenerationRequest) => {
    setGeneratedIdea(idea);
    setGenerationParams(params);
  };
  
  const handleWeeklyIdeasGenerated = (weeklyPlanData: MultiGenerationResponse) => {
    // Actualizar el estado con el plan semanal
    setWeeklyPlan(weeklyPlanData);
    
    // Si hay ideas generadas, mostrar la primera
    if (weeklyPlanData.ideas && weeklyPlanData.ideas.length > 0) {
      setGeneratedIdea(weeklyPlanData.ideas[0]);
    }
  };
  
  const handleSelectIdea = (idea: VideoIdeaContent) => {
    setGeneratedIdea(idea);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const openScriptViewer = (idea: VideoIdeaContent) => {
    setSelectedScript(idea);
    setSelectedScriptViewerOpen(true);
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
      
      {/* Botón para Acceso Directo al Generador de Guiones */}
      {user && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 mb-6">
          <div className="flex justify-center">
            <a href="/mis-guiones" className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-md font-medium text-white bg-primary hover:bg-primary/90 transition-colors">
              ✏️ Acceder al Generador de Guiones
            </a>
          </div>
        </div>
      )}
      
      <Generator 
        onIdeaGenerated={handleIdeaGenerated} 
        isGenerating={isGenerating}
        setIsGenerating={setIsGenerating}
        user={user}
      />
      
      {generatedIdea && (
        <>
          <IdeasViewer 
            idea={generatedIdea} 
            generationParams={generationParams}
            onAddToCalendar={async (idea, date) => {
              if (!user) {
                toast({
                  title: "Necesitas iniciar sesión",
                  description: "Debes iniciar sesión para agregar ideas al calendario",
                  variant: "destructive",
                });
                return;
              }
              
              try {
                await apiRequest("POST", "/api/calendar", {
                  title: idea.title,
                  videoIdeaId: savedIdeaId,
                  date,
                  completed: false
                });
                
                toast({
                  title: "Añadido al calendario",
                  description: `Contenido programado para ${date.toLocaleDateString()}`,
                });
              } catch (error) {
                toast({
                  title: "Error",
                  description: "No se pudo añadir al calendario",
                  variant: "destructive"
                });
              }
            }}
            geminiApiKey={generationParams?.geminiApiKey}
          />
          
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 mb-8 flex justify-center">
            <button 
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
              onClick={() => saveIdeaToProfile(generatedIdea)}
              disabled={!user}
            >
              {savedIdeaId ? "Guardado ✓" : "Guardar Idea"}
            </button>
          </div>
        </>
      )}
      
      {/* Generación de ideas semanales */}
      {user && (
        <>
          <WeeklyGenerator 
            user={user}
            generationParams={generationParams}
            onSuccess={handleWeeklyIdeasGenerated}
          />
          
          {weeklyPlan && weeklyPlan.ideas && weeklyPlan.ideas.length > 0 && (
            <WeeklyPlanView 
              weeklyPlan={weeklyPlan} 
              onSelectIdea={handleSelectIdea}
            />
          )}
          
          {selectedScript && (
            <ScriptViewer
              videoIdea={selectedScript}
              isOpen={selectedScriptViewerOpen}
              onClose={() => setSelectedScriptViewerOpen(false)}
            />
          )}
        </>
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
      
      <TrustpilotBanner />
      
      <Pricing user={user} />
    </div>
  );
}
