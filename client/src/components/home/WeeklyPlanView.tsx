import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MultiGenerationResponse, VideoIdeaContent } from '@/lib/openai';
import { CalendarDays, ChevronRight, Eye, FileText, PlusCircle, CalendarPlus } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import ScriptViewer from './ScriptViewer';

interface WeeklyPlanViewProps {
  weeklyPlan: MultiGenerationResponse;
  onSelectIdea: (idea: VideoIdeaContent) => void;
}

export default function WeeklyPlanView({ weeklyPlan, onSelectIdea }: WeeklyPlanViewProps) {
  const { toast } = useToast();
  const [addingToCalendar, setAddingToCalendar] = useState(false);
  const [selectedScript, setSelectedScript] = useState<VideoIdeaContent | null>(null);
  const [isScriptViewerOpen, setIsScriptViewerOpen] = useState(false);

  // Añadir una idea individual al calendario
  const addToCalendar = async (idea: VideoIdeaContent, index: number) => {
    try {
      // Calcular la fecha para esta idea (hoy + días en el índice)
      const targetDate = addDays(new Date(), index);
      
      const response = await apiRequest('POST', '/api/calendar/entry', {
        title: idea.title,
        date: format(targetDate, 'yyyy-MM-dd'),
        description: idea.outline.join('\n'),
        videoIdeaId: null // Se establecerá después de guardar la idea
      });
      
      if (!response.ok) {
        throw new Error('Error adding to calendar');
      }
      
      // Guardar la idea y actualizar la entrada de calendario
      const calendarEntry = await response.json();
      
      const videoIdeaResponse = await apiRequest('POST', '/api/video-ideas', {
        ...idea,
        calendarEntryId: calendarEntry.id
      });
      
      if (!videoIdeaResponse.ok) {
        throw new Error('Error saving video idea');
      }
      
      const videoIdea = await videoIdeaResponse.json();
      
      // Actualizar el ID de la idea de video en la entrada del calendario
      await apiRequest('PATCH', `/api/calendar/entry/${calendarEntry.id}`, {
        videoIdeaId: videoIdea.id
      });
      
      // Invalidar caché para refrescar el calendario
      queryClient.invalidateQueries({ queryKey: ['/api/calendar'] });
      
      toast({
        title: 'Añadido al calendario',
        description: `"${idea.title}" ha sido añadido al calendario para el ${format(targetDate, 'EEEE d/MM', { locale: es })}`,
      });
    } catch (error) {
      console.error('Error adding to calendar:', error);
      toast({
        title: 'Error',
        description: 'No se pudo añadir al calendario',
        variant: 'destructive',
      });
    }
  };
  
  // Añadir todas las ideas de la semana al calendario
  const addAllToCalendar = async () => {
    try {
      setAddingToCalendar(true);
      
      // Procesar cada idea secuencialmente
      for (let i = 0; i < weeklyPlan.ideas.length; i++) {
        const idea = weeklyPlan.ideas[i];
        
        // Calcular la fecha para esta idea (hoy + días en el índice)
        const targetDate = addDays(new Date(), i);
        
        const response = await apiRequest('POST', '/api/calendar/entry', {
          title: idea.title,
          date: format(targetDate, 'yyyy-MM-dd'),
          description: idea.outline.join('\n'),
          videoIdeaId: null // Se establecerá después de guardar la idea
        });
        
        if (!response.ok) {
          throw new Error('Error adding to calendar');
        }
        
        // Guardar la idea y actualizar la entrada de calendario
        const calendarEntry = await response.json();
        
        const videoIdeaResponse = await apiRequest('POST', '/api/video-ideas', {
          ...idea,
          calendarEntryId: calendarEntry.id
        });
        
        if (!videoIdeaResponse.ok) {
          throw new Error('Error saving video idea');
        }
        
        const videoIdea = await videoIdeaResponse.json();
        
        // Actualizar el ID de la idea de video en la entrada del calendario
        await apiRequest('PATCH', `/api/calendar/entry/${calendarEntry.id}`, {
          videoIdeaId: videoIdea.id
        });
      }
      
      // Invalidar caché para refrescar el calendario
      queryClient.invalidateQueries({ queryKey: ['/api/calendar'] });
      
      toast({
        title: 'Plan semanal añadido',
        description: `Se han añadido ${weeklyPlan.ideas.length} ideas al calendario`,
      });
    } catch (error) {
      console.error('Error adding all to calendar:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron añadir todas las ideas al calendario',
        variant: 'destructive',
      });
    } finally {
      setAddingToCalendar(false);
    }
  };

  // Abrir el visor de guion
  const openScriptViewer = (idea: VideoIdeaContent) => {
    setSelectedScript(idea);
    setIsScriptViewerOpen(true);
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold font-heading">Plan de Contenido Semanal</h2>
        <Button 
          onClick={addAllToCalendar} 
          disabled={addingToCalendar}
          className="gap-2"
        >
          <CalendarPlus className="h-4 w-4" />
          Añadir toda la semana
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {weeklyPlan.ideas.map((idea, index) => {
          // Calcular el día para esta idea
          const targetDate = addDays(new Date(), index);
          const dayName = format(targetDate, 'EEEE', { locale: es });
          const dayFormatted = format(targetDate, 'd MMMM', { locale: es });
          
          return (
            <Card key={`weekly-idea-${index}`} className="overflow-hidden h-full flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="text-sm font-medium text-primary">
                    {dayName.charAt(0).toUpperCase() + dayName.slice(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {dayFormatted}
                  </div>
                </div>
                <CardTitle className="text-base line-clamp-2">{idea.title}</CardTitle>
                <CardDescription className="line-clamp-3">
                  {idea.outline.length > 0 && idea.outline[0]}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pb-3 flex-1">
                <div className="text-xs text-muted-foreground mb-2">
                  <span className="font-semibold">Duración:</span> {idea.videoLength}
                </div>
                
                {idea.outline.length > 1 && (
                  <div className="border-t pt-2 text-sm">
                    <div className="font-medium mb-1">Puntos adicionales:</div>
                    <ul className="list-disc list-inside text-xs space-y-1">
                      {idea.outline.slice(1, 4).map((point, i) => (
                        <li key={i} className="line-clamp-1">
                          {point}
                        </li>
                      ))}
                      {idea.outline.length > 4 && (
                        <li className="text-muted-foreground italic">
                          + {idea.outline.length - 4} puntos más...
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="pt-0 flex justify-between gap-2 flex-wrap">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1"
                  onClick={() => openScriptViewer(idea)}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Ver guion</span>
                </Button>
                
                <div className="flex gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="gap-1" 
                    onClick={() => addToCalendar(idea, index)}
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>Añadir</span>
                  </Button>
                  
                  <Button 
                    size="sm" 
                    className="gap-1 px-2"
                    onClick={() => onSelectIdea(idea)}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
      
      {selectedScript && (
        <ScriptViewer 
          videoIdea={selectedScript}
          isOpen={isScriptViewerOpen}
          onClose={() => setIsScriptViewerOpen(false)}
        />
      )}
    </div>
  );
}