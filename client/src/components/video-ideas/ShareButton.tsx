import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Share, Lock, Loader2 } from "lucide-react";
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { VideoIdea } from '@shared/schema';

interface ShareButtonProps {
  videoIdea: VideoIdea;
  onVisibilityChange?: (updatedIdea: VideoIdea) => void;
}

export function ShareButton({ videoIdea, onVisibilityChange }: ShareButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const isPublic = videoIdea.isPublic;

  const toggleVisibility = async () => {
    try {
      setIsLoading(true);
      
      const response = await apiRequest('PATCH', `/api/video-ideas/${videoIdea.id}/visibility`, {
        isPublic: !isPublic
      });
      
      if (!response.ok) {
        throw new Error('Error cambiando la visibilidad');
      }
      
      const data = await response.json();
      
      toast({
        title: !isPublic ? "Idea compartida" : "Idea configurada como privada",
        description: !isPublic 
          ? "La idea ahora es visible públicamente con una URL compartible." 
          : "La idea ahora es privada.",
        variant: "default",
      });
      
      // Llamar al callback con la idea actualizada
      if (onVisibilityChange) {
        onVisibilityChange(data.videoIdea);
      }
    } catch (error) {
      console.error('Error al cambiar visibilidad:', error);
      toast({
        title: "Error",
        description: "No se pudo cambiar la visibilidad de la idea.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getShareUrl = () => {
    return `${window.location.origin}/ideas/${videoIdea.slug}`;
  };

  const copyToClipboard = (event: React.MouseEvent) => {
    if (isPublic) {
      event.stopPropagation();
      const url = getShareUrl();
      navigator.clipboard.writeText(url);
      
      toast({
        title: "URL copiada",
        description: "Enlace copiado al portapapeles",
        variant: "default",
      });
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleVisibility}
            disabled={isLoading}
            className={isPublic ? "text-green-500 hover:text-green-600" : "text-muted-foreground hover:text-foreground"}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isPublic ? (
              <Share className="h-4 w-4" onClick={copyToClipboard} />
            ) : (
              <Lock className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isPublic 
            ? "Idea compartida públicamente. Haz clic para hacer privada o haz clic en el icono para copiar el enlace." 
            : "Idea privada. Haz clic para compartir públicamente."}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}