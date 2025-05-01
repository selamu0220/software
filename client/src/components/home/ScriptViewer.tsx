import React, { useState } from 'react';
import { VideoIdeaContent } from '@/lib/openai';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, AlarmClock, CheckCircle, FileText, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ScriptViewerProps {
  videoIdea: VideoIdeaContent;
  isOpen: boolean;
  onClose: () => void;
}

export default function ScriptViewer({ videoIdea, isOpen, onClose }: ScriptViewerProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Función para copiar el contenido del guion al portapapeles
  const copyToClipboard = () => {
    let scriptContent = '';
    
    // Comprobar si el guion es un string o un objeto
    if (typeof videoIdea.fullScript === 'string') {
      scriptContent = videoIdea.fullScript;
    } else if (typeof videoIdea.fullScript === 'object' && videoIdea.fullScript) {
      // Si es un objeto, recorrer sus secciones
      Object.entries(videoIdea.fullScript).forEach(([section, content]) => {
        scriptContent += `${section.toUpperCase()}:\n${content}\n\n`;
      });
    }

    // Si no hay guion, usar el outline como alternativa
    if (!scriptContent && videoIdea.outline) {
      if (videoIdea.intro) scriptContent += `INTRO:\n${videoIdea.intro}\n\n`;
      
      videoIdea.outline.forEach((point, index) => {
        scriptContent += `PUNTO ${index + 1}:\n${point}\n\n`;
      });
      
      if (videoIdea.conclusion) scriptContent += `CONCLUSIÓN:\n${videoIdea.conclusion}\n\n`;
    }

    navigator.clipboard.writeText(scriptContent)
      .then(() => {
        setCopied(true);
        toast({
          title: 'Guion copiado',
          description: 'El contenido del guion ha sido copiado al portapapeles',
        });
        
        // Resetear el estado 'copied' después de 2 segundos
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        toast({
          title: 'Error al copiar',
          description: 'No se pudo copiar el contenido al portapapeles',
          variant: 'destructive',
        });
      });
  };

  // Renderizar el guion según su formato
  const renderScript = () => {
    // Si es un string, mostrarlo directamente
    if (typeof videoIdea.fullScript === 'string') {
      return (
        <div className="whitespace-pre-wrap font-mono text-sm bg-muted/50 p-4 rounded-md overflow-auto max-h-[400px]">
          {videoIdea.fullScript}
        </div>
      );
    }
    
    // Si es un objeto, mostrar cada sección
    if (typeof videoIdea.fullScript === 'object' && videoIdea.fullScript) {
      return (
        <div className="space-y-4 overflow-auto max-h-[400px]">
          {Object.entries(videoIdea.fullScript).map(([section, content], index) => (
            <div key={`script-section-${index}`} className="border-b border-border pb-4 last:border-0">
              <h3 className="text-lg font-semibold mb-2">{section}</h3>
              <div className="whitespace-pre-wrap font-mono text-sm">
                {content as string}
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    // Si no hay guion completo, construirlo desde las partes
    return (
      <div className="space-y-4 overflow-auto max-h-[400px]">
        {videoIdea.intro && (
          <div className="border-b border-border pb-4">
            <h3 className="text-lg font-semibold mb-2">Introducción</h3>
            <p className="whitespace-pre-wrap font-mono text-sm">{videoIdea.intro}</p>
          </div>
        )}
        
        {videoIdea.outline && videoIdea.outline.length > 0 && (
          <div className="border-b border-border pb-4">
            <h3 className="text-lg font-semibold mb-2">Contenido principal</h3>
            <div className="space-y-4">
              {videoIdea.outline.map((point, index) => (
                <div key={`outline-${index}`} className="pl-4 border-l-2 border-primary/20">
                  <h4 className="font-medium mb-1">Punto {index + 1}</h4>
                  <p className="whitespace-pre-wrap font-mono text-sm">{point}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {videoIdea.conclusion && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Conclusión</h3>
            <p className="whitespace-pre-wrap font-mono text-sm">{videoIdea.conclusion}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">{videoIdea.title}</DialogTitle>
          <DialogDescription>
            Guion completo para video de {videoIdea.videoLength}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-wrap gap-3 mt-2 mb-4">
          <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-xs">
            <Clock className="h-3.5 w-3.5" />
            <span>{videoIdea.videoLength}</span>
          </div>
          {videoIdea.scriptDuration && (
            <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-xs">
              <AlarmClock className="h-3.5 w-3.5" />
              <span>{videoIdea.scriptDuration} minutos</span>
            </div>
          )}
          {videoIdea.wordCount && (
            <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-xs">
              <FileText className="h-3.5 w-3.5" />
              <span>{videoIdea.wordCount} palabras</span>
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {renderScript()}
        </div>
        
        <DialogFooter className="mt-4 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={copyToClipboard}
          >
            {copied ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar Guion
              </>
            )}
          </Button>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}