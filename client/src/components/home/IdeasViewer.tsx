import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { VideoIdeaContent } from '@/lib/openai';
import { Edit, Sparkles, Book, Lightbulb, Calendar, Copy, CheckCheck } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import ScriptEditor from './ScriptEditor';
import { apiRequest } from "@/lib/queryClient";
import { scrollToElement } from "@/lib/utils";
import { format } from 'date-fns';

interface IdeasViewerProps {
  idea: VideoIdeaContent | null;
  generationParams?: any; // Los parámetros utilizados para generar
  onAddToCalendar?: (idea: VideoIdeaContent, date: Date) => Promise<void>;
  geminiApiKey?: string;
}

export function IdeasViewer({ 
  idea, 
  generationParams, 
  onAddToCalendar,
  geminiApiKey = ''
}: IdeasViewerProps) {
  const [activeTab, setActiveTab] = useState('outline');
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Resetear a la pestaña de esquema cuando cambia la idea
    if (idea) {
      setActiveTab('outline');
    }
  }, [idea]);

  const handleCopyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopySuccess(type);
        setTimeout(() => setCopySuccess(null), 2000);
        
        toast({
          title: "Copiado al portapapeles",
          description: `El ${type} ha sido copiado con éxito`,
        });
      },
      () => {
        toast({
          title: "Error al copiar",
          description: "No se pudo copiar el texto",
          variant: "destructive",
        });
      }
    );
  };

  const formatOutlineToText = (outline: string[]) => {
    return outline.map((point, index) => `${index + 1}. ${point}`).join('\n');
  };
  
  const handleSaveScript = (updatedIdea: VideoIdeaContent) => {
    // Aquí podríamos guardar el guión actualizado, por ejemplo a través de una API
    console.log("Guardando guión actualizado:", updatedIdea);
    
    toast({
      title: "Guión guardado",
      description: "Los cambios han sido guardados exitosamente",
    });
  };

  if (!idea) {
    return (
      <Card className="mt-8 bg-muted/30">
        <CardHeader>
          <CardTitle>Ideas Generator</CardTitle>
          <CardDescription>
            Complete the form above to generate YouTube video ideas
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <Sparkles className="h-12 w-12 text-muted mb-4" />
          <p className="text-muted-foreground text-center">
            No ideas generated yet. Fill out the form and click "Generate" to create video ideas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div id="results" className="mt-8 space-y-8">
      <Card className="bg-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold break-words">{idea.title}</CardTitle>
          <CardDescription className="flex flex-wrap gap-2 mt-2">
            <span className="px-2 py-1 rounded-full bg-primary/10 text-xs font-medium">
              {idea.category}
            </span>
            <span className="px-2 py-1 rounded-full bg-primary/10 text-xs font-medium">
              {idea.subcategory}
            </span>
            <span className="px-2 py-1 rounded-full bg-primary/10 text-xs font-medium">
              {idea.videoLength}
            </span>
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="outline" className="flex items-center">
                <Lightbulb className="h-4 w-4 mr-2" />
                Esquema
              </TabsTrigger>
              <TabsTrigger value="script" className="flex items-center">
                <Book className="h-4 w-4 mr-2" />
                Guión Completo
              </TabsTrigger>
              <TabsTrigger value="editor" className="flex items-center">
                <Edit className="h-4 w-4 mr-2" />
                Editor Avanzado
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="outline" className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
                    Esquema
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleCopyToClipboard(formatOutlineToText(idea.outline), 'esquema')}
                    className="h-8"
                  >
                    {copySuccess === 'esquema' ? (
                      <CheckCheck className="h-4 w-4 mr-1" />
                    ) : (
                      <Copy className="h-4 w-4 mr-1" />
                    )}
                    Copiar
                  </Button>
                </div>
                <ul className="list-disc pl-6 space-y-2">
                  {idea.outline.map((point, index) => (
                    <li key={index} className="text-muted-foreground">{point}</li>
                  ))}
                </ul>
              </div>
              
              <Separator />
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold">Mención a Mitad del Video</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleCopyToClipboard(idea.midVideoMention, 'mención a mitad')}
                    className="h-8"
                  >
                    {copySuccess === 'mención a mitad' ? (
                      <CheckCheck className="h-4 w-4 mr-1" />
                    ) : (
                      <Copy className="h-4 w-4 mr-1" />
                    )}
                    Copiar
                  </Button>
                </div>
                <p className="text-muted-foreground">{idea.midVideoMention}</p>
              </div>
              
              <Separator />
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold">Mención al Final del Video</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleCopyToClipboard(idea.endVideoMention, 'mención final')}
                    className="h-8"
                  >
                    {copySuccess === 'mención final' ? (
                      <CheckCheck className="h-4 w-4 mr-1" />
                    ) : (
                      <Copy className="h-4 w-4 mr-1" />
                    )}
                    Copiar
                  </Button>
                </div>
                <p className="text-muted-foreground">{idea.endVideoMention}</p>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Idea de Miniatura</h3>
                  <p className="text-muted-foreground">{idea.thumbnailIdea}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Pregunta para Interacción</h3>
                  <p className="text-muted-foreground">{idea.interactionQuestion}</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="script" className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Book className="h-4 w-4 mr-2 text-blue-500" />
                    Guión Completo con Tiempos
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleCopyToClipboard(
                      typeof idea.fullScript === 'string' 
                        ? idea.fullScript 
                        : Object.entries(idea.fullScript || {}).map(([section, content]) => 
                            `${section}\n${content}`
                          ).join('\n\n'),
                      'guión completo'
                    )}
                    className="h-8"
                  >
                    {copySuccess === 'guión completo' ? (
                      <CheckCheck className="h-4 w-4 mr-1" />
                    ) : (
                      <Copy className="h-4 w-4 mr-1" />
                    )}
                    Copiar Todo
                  </Button>
                </div>

                {/* Guión con formato y tiempos */}
                <div className="rounded-lg border p-4 bg-card/50">
                  {typeof idea.fullScript === 'string' ? (
                    <div className="whitespace-pre-wrap text-muted-foreground">{idea.fullScript}</div>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(idea.fullScript || {}).map(([section, content], index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h4 className="font-semibold">{section}</h4>
                            {idea.timings && 
                             typeof idea.timings === 'object' && 
                             !Array.isArray(idea.timings) && 
                             Object.prototype.hasOwnProperty.call(idea.timings, section) && (
                              <span className="text-xs bg-muted px-2 py-1 rounded-full">
                                ⏱️ {(idea.timings as Record<string, string>)[section]}
                              </span>
                            )}
                          </div>
                          <div className="whitespace-pre-wrap text-muted-foreground pl-4 border-l-2 border-primary/30">
                            {content as string}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {Array.isArray(idea.timings) && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-semibold mb-2">Tiempos Recomendados</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {idea.timings.map((timing, index) => (
                          <div key={index} className="text-xs bg-muted px-3 py-2 rounded-md">
                            {timing}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Consejos para la Grabación</h3>
                <div className="grid grid-cols-1 gap-2">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm">🎙️ Habla con un ritmo constante y haz pausas después de puntos importantes</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm">🎬 Divide la grabación en secciones para facilitar la edición</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm">🔊 Asegúrate de enfatizar los puntos clave de cada sección</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="editor">
              <ScriptEditor 
                videoIdea={idea}
                onSave={handleSaveScript}
                onAddToCalendar={onAddToCalendar}
                geminiApiKey={geminiApiKey}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Generado: {format(new Date(), 'dd/MM/yyyy HH:mm')}
          </div>
          <div className="flex gap-2">
            {onAddToCalendar && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setActiveTab('editor');
                    scrollToElement('results');
                  }}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => {
                    // Agregar directamente al calendario con la fecha actual
                    onAddToCalendar(idea, new Date());
                    toast({
                      title: "Idea añadida al calendario",
                      description: "Se ha programado para hoy",
                    });
                  }}
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Añadir al Calendario
                </Button>
              </>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default IdeasViewer;