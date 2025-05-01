import React from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopyIcon, DownloadIcon, SaveIcon, Share2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { VideoIdeaContent } from "@/lib/openai";
import AddToCalendarButton from "@/components/ideas/AddToCalendarButton";

interface ResultViewProps {
  ideaData: VideoIdeaContent | null;
  onSave: (idea: VideoIdeaContent) => void;
  user: any;
  videoIdeaId?: number;
}

export default function ResultView({ ideaData, onSave, user, videoIdeaId }: ResultViewProps) {
  const { toast } = useToast();

  if (!ideaData) {
    return null;
  }

  // Identificar el tipo de contenido basado en los campos presentes
  const hasFullScript = !!ideaData.fullScript;
  const hasKeypoints = !hasFullScript && (!!ideaData.intro || !!ideaData.conclusion);
  const contentType = hasFullScript ? "fullScript" : hasKeypoints ? "keypoints" : "idea";

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado al portapapeles",
      description: "El contenido ha sido copiado al portapapeles",
    });
  };

  const handleSaveIdea = () => {
    if (!user) {
      toast({
        title: "Necesitas iniciar sesión",
        description: "Debes iniciar sesión para guardar ideas",
        variant: "destructive",
      });
      return;
    }
    
    onSave(ideaData);
    toast({
      title: "Idea guardada",
      description: "La idea ha sido guardada en tu perfil",
    });
  };

  const handleShare = () => {
    const shareText = `¡Mira esta idea de video sobre ${ideaData.title}!`;
    if (navigator.share) {
      navigator.share({
        title: ideaData.title,
        text: shareText,
        url: window.location.href,
      }).catch(error => {
        console.log('Error al compartir', error);
      });
    } else {
      handleCopyToClipboard(shareText + "\n" + window.location.href);
    }
  };

  const handleDownload = () => {
    const fileContent = JSON.stringify(ideaData, null, 2);
    const blob = new Blob([fileContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ideaData.title.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Idea descargada",
      description: "La idea ha sido descargada como archivo JSON",
    });
  };

  return (
    <div id="results" className="py-8">
      <Card className="border-border shadow-lg">
        <CardHeader className="bg-muted/30 pt-6 pb-4 border-b border-border">
          <CardTitle className="font-heading text-xl md:text-2xl break-words">
            {ideaData.title}
          </CardTitle>
          <CardDescription className="flex items-center gap-2 text-xs mt-2">
            <span className="bg-primary text-white px-2 py-0.5 rounded-full">{ideaData.category}</span>
            <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{ideaData.subcategory}</span>
            <span className="bg-accent/20 text-foreground px-2 py-0.5 rounded-full">{ideaData.videoLength}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 pb-2">
          {contentType === "idea" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider font-mono">Esquema del Video</h3>
                <ul className="list-decimal ml-5 space-y-2">
                  {ideaData.outline.map((point, i) => (
                    <li key={i} className="text-base">{point}</li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider font-mono">Mención a Mitad del Video</h3>
                  <p className="text-base">{ideaData.midVideoMention}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider font-mono">Mención al Final</h3>
                  <p className="text-base">{ideaData.endVideoMention}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider font-mono">Idea de Miniatura</h3>
                  <p className="text-base">{ideaData.thumbnailIdea}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider font-mono">Pregunta para Interacción</h3>
                  <p className="text-base">{ideaData.interactionQuestion}</p>
                </div>
              </div>
            </div>
          )}

          {contentType === "keypoints" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider font-mono">Introducción</h3>
                <div className="p-4 bg-muted/30 rounded-lg mb-4">
                  <p className="text-base">{ideaData.intro}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider font-mono">Puntos Clave</h3>
                <ul className="list-decimal ml-5 space-y-3">
                  {ideaData.outline.map((point, i) => (
                    <li key={i} className="text-base">
                      <div className="font-medium">{point}</div>
                      {ideaData.timings && Array.isArray(ideaData.timings) && ideaData.timings[i] && (
                        <div className="text-xs font-mono mt-1 text-muted-foreground">{ideaData.timings[i]}</div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider font-mono">Mención a Mitad del Video</h3>
                <div className="p-4 bg-muted/30 rounded-lg mb-4">
                  <p className="text-base">{ideaData.midVideoMention}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider font-mono">Conclusión</h3>
                <div className="p-4 bg-muted/30 rounded-lg mb-4">
                  <p className="text-base">{ideaData.conclusion}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider font-mono">Idea de Miniatura</h3>
                  <p className="text-base">{ideaData.thumbnailIdea}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider font-mono">Pregunta para Interacción</h3>
                  <p className="text-base">{ideaData.interactionQuestion}</p>
                </div>
              </div>
            </div>
          )}

          {contentType === "fullScript" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider font-mono">Resumen de Secciones</h3>
                <ul className="list-decimal ml-5 space-y-2">
                  {ideaData.outline.map((point, i) => (
                    <li key={i} className="text-base">{point}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider font-mono">Guión Completo</h3>
                
                <Tabs defaultValue="text" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="text">Texto Plano</TabsTrigger>
                    <TabsTrigger value="sections">Por Secciones</TabsTrigger>
                    {ideaData.timings && <TabsTrigger value="timeline">Línea de Tiempo</TabsTrigger>}
                  </TabsList>
                  
                  <TabsContent value="text" className="space-y-4">
                    {typeof ideaData.fullScript === 'string' ? (
                      <div className="p-4 bg-muted/30 rounded-lg whitespace-pre-wrap">
                        {ideaData.fullScript}
                      </div>
                    ) : (
                      Object.entries(ideaData.fullScript || {}).map(([section, content], i) => (
                        <div key={i} className="mb-4">
                          <div className="p-4 bg-muted/30 rounded-lg whitespace-pre-wrap">
                            <span className="font-bold block mb-2">{section}:</span>
                            {content}
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>
                  
                  <TabsContent value="sections">
                    {typeof ideaData.fullScript === 'object' && (
                      <div className="space-y-4">
                        {Object.entries(ideaData.fullScript || {}).map(([section, content], i) => (
                          <div key={i} className="border border-border rounded-lg overflow-hidden">
                            <div className="bg-primary/10 p-3 font-semibold border-b border-border">
                              {section}
                              {ideaData.timings && 
                               typeof ideaData.timings === 'object' && 
                               !Array.isArray(ideaData.timings) && 
                               section in ideaData.timings && (
                                <span className="float-right text-xs font-mono text-muted-foreground">
                                  {ideaData.timings[section as keyof typeof ideaData.timings]}
                                </span>
                              )}
                            </div>
                            <div className="p-4 whitespace-pre-wrap">
                              {content}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  
                  {ideaData.timings && (
                    <TabsContent value="timeline">
                      <div className="border border-border rounded-lg">
                        <div className="bg-primary/10 p-3 font-semibold border-b border-border">
                          Línea de Tiempo
                        </div>
                        <div className="divide-y divide-border">
                          {ideaData.timings && typeof ideaData.timings === 'object' && !Array.isArray(ideaData.timings) ? (
                            Object.entries(ideaData.timings).map(([section, timing], i: number) => (
                              <div key={i} className="p-3 flex justify-between items-center">
                                <span className="font-medium">{section}</span>
                                <span className="text-sm font-mono text-muted-foreground">{timing}</span>
                              </div>
                            ))
                          ) : (
                            Array.isArray(ideaData.timings) && ideaData.timings.map((timing: string, i: number) => (
                              <div key={i} className="p-3 flex justify-between items-center">
                                <span className="font-medium">{ideaData.outline[i] || `Sección ${i+1}`}</span>
                                <span className="text-sm font-mono text-muted-foreground">{timing}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider font-mono">Idea de Miniatura</h3>
                  <p className="text-base">{ideaData.thumbnailIdea}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider font-mono">Pregunta para Interacción</h3>
                  <p className="text-base">{ideaData.interactionQuestion}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2 justify-between items-center py-4 px-6 border-t border-border">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => handleCopyToClipboard(JSON.stringify(ideaData, null, 2))}>
              <CopyIcon className="h-4 w-4 mr-1" />
              Copiar
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <DownloadIcon className="h-4 w-4 mr-1" />
              Descargar
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-1" />
              Compartir
            </Button>
            {user && videoIdeaId && (
              <AddToCalendarButton 
                videoIdeaId={videoIdeaId}
              />
            )}
          </div>
          <Button onClick={handleSaveIdea} disabled={!user}>
            <SaveIcon className="h-4 w-4 mr-1" />
            {!user ? "Inicia sesión para guardar" : "Guardar Idea"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}