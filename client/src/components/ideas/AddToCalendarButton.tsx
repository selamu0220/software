import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AddToCalendarButtonProps {
  videoIdeaId: number;
  disabled?: boolean;
}

export default function AddToCalendarButton({ videoIdeaId, disabled = false }: AddToCalendarButtonProps) {
  const [date, setDate] = useState<Date>();
  const [isAdding, setIsAdding] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleAddToCalendar = async () => {
    if (!date) {
      toast({
        title: "Error",
        description: "Por favor selecciona una fecha",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);
    try {
      const response = await apiRequest(
        "POST", 
        `/api/video-ideas/${videoIdeaId}/add-to-calendar`,
        { date: date.toISOString() }
      );

      if (!response.ok) {
        throw new Error("Failed to add to calendar");
      }

      toast({
        title: "¡Agregado al calendario!",
        description: `Contenido agendado para el ${format(date, 'PPPP', { locale: es })}`,
      });
      
      setIsOpen(false);
    } catch (error) {
      console.error("Error adding to calendar:", error);
      toast({
        title: "Error",
        description: "No se pudo agregar al calendario. Inténtalo nuevamente más tarde.",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="mt-2 w-full sm:w-auto"
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          Agregar al calendario
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          <h3 className="font-medium mb-2">
            Selecciona una fecha para este contenido
          </h3>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            locale={es}
            initialFocus
          />
          <Button 
            onClick={handleAddToCalendar} 
            className="w-full mt-2"
            disabled={!date || isAdding}
          >
            {isAdding ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                Agregando...
              </>
            ) : (
              'Confirmar'
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}