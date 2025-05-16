import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VideoIdeaContent } from "@/lib/openai";
import SimpleGenerator from "@/components/generator/SimpleGenerator";
import { CalendarEntry } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface IdeaGeneratorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
}

export default function IdeaGeneratorDialog({
  isOpen,
  onClose,
  selectedDate,
}: IdeaGeneratorDialogProps) {
  const { toast } = useToast();
  const [generatedIdea, setGeneratedIdea] = useState<VideoIdeaContent | null>(null);
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false);

  const handleIdeaGenerated = (idea: VideoIdeaContent) => {
    setGeneratedIdea(idea);
  };

  const addIdeaToCalendar = async () => {
    if (!generatedIdea) return;

    setIsAddingToCalendar(true);
    try {
      const response = await apiRequest("POST", "/api/calendar/entry", {
        title: generatedIdea.title,
        date: selectedDate.toISOString(),
        notes: generatedIdea.outline.join("\n"),
        color: "#4f46e5", // Indigo
      });

      if (!response.ok) {
        throw new Error("Error al añadir la idea al calendario");
      }

      toast({
        title: "Idea añadida al calendario",
        description: `La idea "${generatedIdea.title}" se ha añadido a tu calendario para el ${format(selectedDate, "dd/MM/yyyy")}`,
      });

      // Invalidar consultas relacionadas
      queryClient.invalidateQueries({ queryKey: ['/api/calendar'] });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/month'] });

      // Cerrar el diálogo
      onClose();
    } catch (error) {
      console.error("Error adding idea to calendar:", error);
      toast({
        title: "Error",
        description: "No se pudo añadir la idea al calendario",
        variant: "destructive",
      });
    } finally {
      setIsAddingToCalendar(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generar Idea para {format(selectedDate, "dd 'de' MMMM, yyyy")}</DialogTitle>
          <DialogDescription>
            Genera ideas para videos y añádelas directamente a tu calendario
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <SimpleGenerator
            onIdeaGenerated={handleIdeaGenerated}
            selectedDate={selectedDate}
          />
        </div>

        <DialogFooter className="flex justify-between items-center">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={addIdeaToCalendar}
            disabled={!generatedIdea || isAddingToCalendar}
          >
            {isAddingToCalendar ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Añadiendo...
              </>
            ) : (
              "Añadir al Calendario"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}