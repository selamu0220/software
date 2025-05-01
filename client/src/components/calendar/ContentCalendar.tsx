import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, Circle } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parse } from "date-fns";
import { es } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CalendarEntry, User } from "@shared/schema";
import { useIsMobile } from "@/hooks/use-mobile";

interface ContentCalendarProps {
  user: User | null;
}

export default function ContentCalendar({ user }: ContentCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarEntries, setCalendarEntries] = useState<CalendarEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const currentMonth = format(selectedDate, 'MMMM yyyy', { locale: es });
  
  // Formatear el mes con la primera letra en mayúscula
  const formattedMonth = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);

  // Navegar entre meses
  const prevMonth = () => {
    const prevMonthDate = new Date(selectedDate);
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    setSelectedDate(prevMonthDate);
  };

  const nextMonth = () => {
    const nextMonthDate = new Date(selectedDate);
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
    setSelectedDate(nextMonthDate);
  };

  // Cargar entradas del calendario para el mes seleccionado
  useEffect(() => {
    const fetchCalendarEntries = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth() + 1; // API espera mes en formato 1-12
        
        const response = await apiRequest(
          "GET", 
          `/api/calendar/${year}/${month}`
        );
        
        if (!response.ok) {
          throw new Error("Error al cargar entradas del calendario");
        }
        
        const entries = await response.json();
        setCalendarEntries(entries);
      } catch (error) {
        console.error("Error fetching calendar entries:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las entradas del calendario",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCalendarEntries();
  }, [selectedDate, user, toast]);

  // Marcar días con entradas en el calendario
  const getCalendarDaysWithContent = () => {
    const days: Date[] = [];
    
    // Convertir las fechas de string a objetos Date
    calendarEntries.forEach(entry => {
      const entryDate = new Date(entry.date);
      // Evitar duplicados
      if (!days.some(day => isSameDay(day, entryDate))) {
        days.push(entryDate);
      }
    });
    
    return days;
  };

  // Obtener entradas para un día específico
  const getEntriesForDay = (date: Date) => {
    return calendarEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return isSameDay(entryDate, date);
    });
  };

  // Completar/descompletar una entrada
  const toggleEntryCompletion = async (entryId: number, completed: boolean) => {
    if (!user) return;
    
    try {
      const response = await apiRequest(
        "PATCH", 
        `/api/calendar/entry/${entryId}`,
        { completed: !completed }
      );
      
      if (!response.ok) {
        throw new Error("Error al actualizar la entrada");
      }
      
      // Actualizar la entrada localmente
      setCalendarEntries(prev => 
        prev.map(entry => 
          entry.id === entryId ? { ...entry, completed: !completed } : entry
        )
      );
      
      // Mostrar toast de confirmación
      toast({
        title: completed ? "Entrada desmarcada" : "Entrada completada",
        description: completed 
          ? "La entrada ha sido desmarcada como completada" 
          : "La entrada ha sido marcada como completada",
      });
    } catch (error) {
      console.error("Error updating calendar entry:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la entrada",
        variant: "destructive",
      });
    }
  };

  // Si no hay usuario autenticado, mostrar mensaje de inicio de sesión
  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mb-6">
              <CalendarIcon className="h-16 w-16 mx-auto text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Calendario de Contenido</h2>
            <p className="text-muted-foreground mb-6">
              Inicia sesión para acceder a tu calendario de contenido y organizar tus videos.
            </p>
            <div className="flex justify-center space-x-4">
              <Button variant="outline" asChild>
                <a href="/login">Iniciar Sesión</a>
              </Button>
              <Button asChild>
                <a href="/register">Crear Cuenta</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Generar array de días para la vista móvil
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(selectedDate),
    end: endOfMonth(selectedDate)
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Calendario de Contenido</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {formattedMonth}
            </span>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <>
              {!isMobile ? (
                // Vista de escritorio: Calendario completo
                <div className="mt-4">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border"
                    locale={es}
                    modifiers={{
                      withContent: getCalendarDaysWithContent(),
                    }}
                    modifiersClassNames={{
                      withContent: "withContent",
                    }}
                    // Aplicamos estilos personalizados vía className
                  />
                </div>
              ) : (
                // Vista móvil: Lista de días
                <div className="mt-4 grid grid-cols-7 gap-1 text-center">
                  {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => (
                    <div key={`header-${i}`} className="text-xs font-medium text-muted-foreground py-1">
                      {day}
                    </div>
                  ))}
                  
                  {daysInMonth.map((day, i) => {
                    const hasContent = getCalendarDaysWithContent().some(d => isSameDay(d, day));
                    const isSelected = isSameDay(day, selectedDate);
                    
                    return (
                      <div 
                        key={`day-${i}`} 
                        className={`
                          py-2 text-sm cursor-pointer rounded-full
                          ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                          ${hasContent && !isSelected ? 'bg-primary/10 font-medium text-primary' : ''}
                          hover:bg-muted
                        `}
                        onClick={() => setSelectedDate(day)}
                      >
                        {format(day, 'd')}
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Lista de entradas para el día seleccionado */}
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">
                  {format(selectedDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                </h3>
                
                <div className="space-y-3">
                  {getEntriesForDay(selectedDate).length > 0 ? (
                    getEntriesForDay(selectedDate).map(entry => (
                      <div 
                        key={entry.id} 
                        className="flex items-start p-3 border rounded-lg bg-card"
                      >
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="mt-0.5 mr-2 flex-shrink-0" 
                          onClick={() => toggleEntryCompletion(entry.id, entry.completed)}
                        >
                          {entry.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </Button>
                        
                        <div className="flex-1">
                          <div className="font-medium text-foreground">{entry.title}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>No hay contenido programado para este día.</p>
                      <p className="text-sm mt-2">Genera ideas de video y agrégalas al calendario.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}