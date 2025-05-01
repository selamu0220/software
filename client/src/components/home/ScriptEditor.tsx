import React, { useState } from 'react';
import { VideoIdeaContent } from '@/lib/openai';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Importar el editor de texto enriquecido
import RichTextEditor from "../editor/RichTextEditor";

interface ScriptEditorProps {
  videoIdea: VideoIdeaContent;
  onSave?: (updatedIdea: VideoIdeaContent) => void;
  onAddToCalendar?: (idea: VideoIdeaContent, date: Date) => Promise<void>;
  geminiApiKey?: string;
}

export default function ScriptEditor({ 
  videoIdea, 
  onSave,
  onAddToCalendar,
  geminiApiKey = ''
}: ScriptEditorProps) {
  const [editedIdea, setEditedIdea] = useState<VideoIdeaContent>(videoIdea);
  const [activeTab, setActiveTab] = useState("outline");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Función para manejar la actualización de contenido desde el editor
  const handleContentChange = (field: keyof VideoIdeaContent, content: string) => {
    setEditedIdea((prev) => ({
      ...prev,
      [field]: content
    }));
  };

  // Función para guardar los cambios
  const handleSave = () => {
    if (onSave) {
      onSave(editedIdea);
    }
  };

  // Función para agregar al calendario
  const handleAddToCalendar = async () => {
    if (onAddToCalendar && date) {
      await onAddToCalendar(editedIdea, date);
      setDialogOpen(false);
    }
  };

  // Función para solicitar asistencia de IA
  const getAIAssistance = async (prompt: string, content: string): Promise<string> => {
    try {
      const response = await apiRequest("POST", "/api/ai-assist", {
        prompt,
        content,
        geminiApiKey
      });
      
      if (!response.ok) {
        throw new Error("Error al obtener asistencia de IA");
      }
      
      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error("Error al solicitar asistencia de IA:", error);
      toast({
        title: "Error de asistencia",
        description: "No se pudo obtener ayuda de la IA. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
      return content;
    }
  };

  // Convertir la lista de puntos en texto para el editor
  const outlineToText = (outline: string[] | undefined | null): string => {
    if (!outline || !Array.isArray(outline)) return '';
    return outline.map((point, index) => `${index + 1}. ${point}`).join('\n\n');
  };

  // Crear guión completo a partir del esquema
  const handleCreateFullScript = async () => {
    if (!editedIdea.fullScript) {
      const outlineContent = Array.isArray(editedIdea.outline) 
        ? editedIdea.outline.join('\n') 
        : "";
        
      const prompt = `Crea un guión completo basado en este esquema para un video de YouTube sobre "${editedIdea.title}". 
      Incluye una introducción atractiva, desarrolla cada punto del esquema y añade una conclusión fuerte con llamada a la acción.`;
      
      toast({
        title: "Generando guión completo",
        description: "Esto puede tomar unos momentos...",
      });
      
      try {
        const scriptContent = await getAIAssistance(prompt, outlineContent);
        
        setEditedIdea(prev => ({
          ...prev,
          fullScript: scriptContent
        }));
        
        toast({
          title: "Guión generado",
          description: "El guión completo ha sido generado con éxito",
        });
      } catch (error) {
        console.error("Error al generar guión completo:", error);
        toast({
          title: "Error",
          description: "No se pudo generar el guión completo",
          variant: "destructive",
        });
      }
    }
  };

  // Agregar tiempos al guión
  const handleAddTimings = async () => {
    if (editedIdea.fullScript && !editedIdea.timings) {
      const fullScriptText = typeof editedIdea.fullScript === 'string' 
        ? editedIdea.fullScript 
        : JSON.stringify(editedIdea.fullScript);
        
      const prompt = `Añade estimaciones de tiempo a este guión para un video de YouTube sobre "${editedIdea.title}". 
      Divide el guión en secciones con sus tiempos correspondientes (en formato MM:SS). 
      El video debería durar aproximadamente ${editedIdea.videoLength}.`;
      
      toast({
        title: "Añadiendo tiempos al guión",
        description: "Esto puede tomar unos momentos...",
      });
      
      try {
        const timingsContent = await getAIAssistance(prompt, fullScriptText);
        
        // Asegúrate de que el tipo de timings sea compatible con VideoIdeaContent
        setEditedIdea((prev) => {
          const updatedIdea = { ...prev };
          // Asignamos el contenido como un objeto (para asegurar compatibilidad con el tipo)
          updatedIdea.timings = { content: timingsContent };
          return updatedIdea;
        });
        
        toast({
          title: "Tiempos añadidos",
          description: "Se han añadido estimaciones de tiempo al guión",
        });
      } catch (error) {
        console.error("Error al añadir tiempos:", error);
        toast({
          title: "Error",
          description: "No se pudieron añadir los tiempos al guión",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="outline">Esquema</TabsTrigger>
          <TabsTrigger value="script">Guión completo</TabsTrigger>
          <TabsTrigger value="timings">Tiempos</TabsTrigger>
        </TabsList>

        <TabsContent value="outline" className="space-y-4">
          <RichTextEditor
            initialContent={outlineToText(editedIdea.outline || [])}
            onUpdate={(content) => handleContentChange('outline', content)}
            onRequestAIAssistance={(content) => 
              getAIAssistance(
                `Mejora y expande este esquema para un video de YouTube sobre "${editedIdea.title}". Agrega más detalles y puntos interesantes.`, 
                content
              )
            }
            placeholder="Edita el esquema del video aquí..."
          />
        </TabsContent>

        <TabsContent value="script" className="space-y-4">
          {!editedIdea.fullScript ? (
            <div className="p-6 text-center border border-dashed rounded-md">
              <h3 className="mb-2 font-medium">No hay un guión completo</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Puedes generar automáticamente un guión completo basado en el esquema.
              </p>
              <Button onClick={handleCreateFullScript}>Generar guión completo</Button>
            </div>
          ) : (
            <RichTextEditor
              initialContent={typeof editedIdea.fullScript === 'string' ? editedIdea.fullScript : JSON.stringify(editedIdea.fullScript)}
              onUpdate={(content) => handleContentChange('fullScript', content)}
              onRequestAIAssistance={(content) => 
                getAIAssistance(
                  `Mejora este guión para un video de YouTube sobre "${editedIdea.title}". 
                  Hazlo más atractivo, conversacional y agrega ejemplos o anécdotas para ilustrar los puntos clave.`, 
                  content
                )
              }
              placeholder="Edita el guión completo aquí..."
            />
          )}
        </TabsContent>

        <TabsContent value="timings" className="space-y-4">
          {!editedIdea.timings ? (
            <div className="p-6 text-center border border-dashed rounded-md">
              <h3 className="mb-2 font-medium">No hay tiempos definidos</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Puedes generar automáticamente estimaciones de tiempo para el guión.
              </p>
              <Button 
                onClick={handleAddTimings}
                disabled={!editedIdea.fullScript}
              >
                Añadir tiempos al guión
              </Button>
              {!editedIdea.fullScript && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Necesitas crear primero un guión completo.
                </p>
              )}
            </div>
          ) : (
            <RichTextEditor
              initialContent={typeof editedIdea.timings === 'string' ? editedIdea.timings : JSON.stringify(editedIdea.timings)}
              onUpdate={(content) => handleContentChange('timings', content)}
              onRequestAIAssistance={(content) => 
                getAIAssistance(
                  `Ajusta las estimaciones de tiempo para este guión. Asegúrate de que son realistas para un video de ${editedIdea.videoLength} 
                  y tienen un buen ritmo. Mantén el formato MM:SS.`, 
                  content
                )
              }
              placeholder="Edita los tiempos del guión aquí..."
            />
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={handleSave}>
          Guardar cambios
        </Button>
        
        {onAddToCalendar && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default">
                Añadir al calendario
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Programar contenido</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <div className="flex flex-col space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Selecciona una fecha:</h4>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP", { locale: es }) : "Selecciona una fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={(newDate) => {
                            setDate(newDate);
                            setCalendarOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddToCalendar}>
                  Añadir
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}