import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AddToCalendarButtonProps {
  videoIdeaId: number;
  title: string;
}

const AddToCalendarButton = ({ videoIdeaId, title }: AddToCalendarButtonProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [date, setDate] = useState<Date>();
  const { toast } = useToast();

  const addToCalendarMutation = useMutation({
    mutationFn: async ({ ideaId, date }: { ideaId: number; date: Date }) => {
      return await apiRequest(
        "POST", 
        `/api/video-ideas/${ideaId}/add-to-calendar`,
        { date: date.toISOString() }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar'] });
      toast({
        title: "Idea agregada al calendario",
        description: "La idea de video ha sido programada exitosamente",
      });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      console.error("Error adding to calendar:", error);
      toast({
        title: "Error al agregar al calendario",
        description: "No se pudo agregar la idea al calendario. Intenta de nuevo más tarde.",
        variant: "destructive",
      });
    }
  });

  const handleAddToCalendar = () => {
    if (!date) {
      toast({
        title: "Fecha requerida",
        description: "Por favor selecciona una fecha para programar este video",
        variant: "destructive",
      });
      return;
    }

    addToCalendarMutation.mutate({ ideaId: videoIdeaId, date });
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarIcon className="h-4 w-4 mr-1" />
          Agregar al Calendario
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agregar al Calendario</DialogTitle>
          <DialogDescription>
            Programa la idea "{title}" en tu calendario de contenido.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: es }) : "Selecciona una fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleAddToCalendar}
            disabled={addToCalendarMutation.isPending || !date}
          >
            {addToCalendarMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Agregando...
              </>
            ) : (
              "Agregar al Calendario"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddToCalendarButton;