import React, { useState, useCallback } from 'react';
import RichTextEditor from '@/components/editor/RichTextEditor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { VideoIdeaContent } from '@/lib/openai';
import { Save, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';

interface ScriptEditorProps {
  videoIdea?: VideoIdeaContent | null;
  onSave?: (content: VideoIdeaContent) => void;
  onAddToCalendar?: (content: VideoIdeaContent, date: Date) => Promise<void>;
  geminiApiKey?: string;
}

export function ScriptEditor({ 
  videoIdea = null, 
  onSave,
  onAddToCalendar,
  geminiApiKey = ''
}: ScriptEditorProps) {
  const [title, setTitle] = useState(videoIdea?.title || '');
  const [content, setContent] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Manejar cambio en el contenido del editor
  const handleContentChange = useCallback((html: string) => {
    setContent(html);
  }, []);

  // Guardar el contenido
  const handleSave = useCallback(async (html: string, title: string) => {
    if (!onSave || !videoIdea) return;
    
    setIsSaving(true);
    
    try {
      // Actualizar la idea de video con el contenido editado
      const updatedIdea: VideoIdeaContent = {
        ...videoIdea,
        title: title,
        // Si hay un guión completo, actualízalo
        ...(videoIdea.fullScript ? { fullScript: html } : {})
      };
      
      onSave(updatedIdea);
      
      toast({
        title: "Contenido guardado",
        description: "El guión ha sido guardado correctamente",
      });
    } catch (error) {
      console.error('Error al guardar el guión:', error);
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar el contenido",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }, [videoIdea, onSave, toast]);

  // Agregar al calendario
  const handleAddToCalendar = useCallback(async () => {
    if (!onAddToCalendar || !videoIdea) return;
    
    setIsAddingToCalendar(true);
    
    try {
      await onAddToCalendar(videoIdea, selectedDate);
      
      toast({
        title: "Añadido al calendario",
        description: `El video "${videoIdea.title}" ha sido programado para ${format(selectedDate, 'dd/MM/yyyy')}`,
      });
    } catch (error) {
      console.error('Error al añadir al calendario:', error);
      toast({
        title: "Error",
        description: "No se pudo añadir al calendario",
        variant: "destructive"
      });
    } finally {
      setIsAddingToCalendar(false);
    }
  }, [videoIdea, selectedDate, onAddToCalendar, toast]);

  // Si no hay idea de video, mostrar un mensaje
  if (!videoIdea) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Editor de Guiones</CardTitle>
          <CardDescription>
            Selecciona una idea de video para comenzar a editar su guión
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No hay contenido seleccionado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex justify-between items-center">
          Editor de Guión
          <div className="flex gap-2 items-center">
            {onAddToCalendar && (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  className="w-auto"
                  value={format(selectedDate, 'yyyy-MM-dd')}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                />
                <Button 
                  variant="outline" 
                  onClick={handleAddToCalendar}
                  disabled={isAddingToCalendar}
                >
                  <CalendarDays className="h-4 w-4 mr-1" />
                  {isAddingToCalendar ? 'Añadiendo...' : 'Añadir al Calendario'}
                </Button>
              </div>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          Edita el guión de tu video usando el editor enriquecido con asistencia de IA
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RichTextEditor
          initialContent={content}
          placeholder="Escribe o edita el contenido de tu guión aquí..."
          onChange={handleContentChange}
          onSave={handleSave}
          readOnly={false}
          videoIdea={videoIdea}
          geminiApiKey={geminiApiKey}
        />
      </CardContent>
    </Card>
  );
}

export default ScriptEditor;