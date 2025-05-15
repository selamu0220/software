import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Lock, Plus, Calendar, Sparkles } from "lucide-react";
import { getMonthAndYear, getFirstDayOfMonth, getDaysInMonth, getNextMonth, getPreviousMonth } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { VideoIdeaContent, generateVideoIdea } from "@/lib/openai";
import { format } from "date-fns";
import { GenerationRequest } from "@shared/schema";

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

interface CalendarPreviewProps {
  isLoggedIn: boolean;
  isPremium: boolean;
}

interface CalendarEntry {
  id: number;
  title: string;
  date: string;
  userId: number;
  videoIdeaId?: number;
  status?: string;
  color?: string;
}

export default function CalendarPreview({ isLoggedIn, isPremium }: CalendarPreviewProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  // Cargar entradas del calendario si el usuario está autenticado
  useEffect(() => {
    if (isLoggedIn) {
      fetchCalendarEntries();
    }
  }, [isLoggedIn, currentMonth, currentYear]);

  const handlePreviousMonth = () => {
    const { year, month } = getPreviousMonth(currentYear, currentMonth);
    setCurrentYear(year);
    setCurrentMonth(month);
  };

  const handleNextMonth = () => {
    const { year, month } = getNextMonth(currentYear, currentMonth);
    setCurrentYear(year);
    setCurrentMonth(month);
  };

  // Obtener entradas del calendario para el mes actual
  const fetchCalendarEntries = async () => {
    if (!isLoggedIn) return;
    
    try {
      setIsLoading(true);
      const response = await apiRequest("GET", `/api/calendar/month?year=${currentYear}&month=${currentMonth + 1}`);
      
      if (response.ok) {
        const data = await response.json();
        setEntries(data);
      }
    } catch (error) {
      console.error("Error fetching calendar entries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generar idea rápida y agregarla al calendario para un día específico
  const generateQuickIdeaForDay = async (day: number) => {
    if (!isLoggedIn) {
      toast({
        title: "Necesitas iniciar sesión",
        description: "Para agregar ideas al calendario, primero inicia sesión",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsGenerating(true);
      
      // Crear fecha para este día
      const targetDate = new Date(currentYear, currentMonth, day);
      const formattedDate = format(targetDate, "yyyy-MM-dd");
      
      // Parámetros rápidos para la generación
      const quickParams: GenerationRequest = {
        category: "Gaming",
        subcategory: "Game Reviews",
        videoFocus: "Game Reviews sin mostrar la cara",
        videoLength: "Medium (5-10 min)",
        templateStyle: "Listicle",
        contentTone: "Enthusiastic",
        titleTemplate: "TOP [Número] SECRETOS que Nadie te Cuenta sobre [Tema]",
        contentType: "fullScript",
        timingDetail: true,
        useSubcategory: true,
        customChannelType: "",
      };
      
      // Generar la idea
      const generatedIdea = await generateVideoIdea(quickParams);
      
      // Guardar la idea en el servidor
      const saveResponse = await apiRequest("POST", "/api/video-ideas", {
        title: generatedIdea.title,
        category: generatedIdea.category,
        subcategory: generatedIdea.subcategory,
        videoLength: generatedIdea.videoLength,
        content: generatedIdea,
      });
      
      if (!saveResponse.ok) {
        throw new Error("Error al guardar la idea");
      }
      
      const savedIdea = await saveResponse.json();
      
      // Añadir al calendario
      const calendarResponse = await apiRequest("POST", "/api/calendar", {
        title: savedIdea.title,
        date: new Date(formattedDate), // Asegurarnos de que se envía como objeto Date
        videoIdeaId: savedIdea.id,
        color: "#3b82f6", // Azul para ideas programadas
      });
      
      if (!calendarResponse.ok) {
        const errorData = await calendarResponse.json().catch(() => ({}));
        console.error("Error al agregar al calendario:", errorData);
        throw new Error(errorData.message || "Error al agregar al calendario");
      }
      
      // Recargar entradas
      await fetchCalendarEntries();
      
      toast({
        title: "¡Idea agregada!",
        description: `Se ha programado "${savedIdea.title}" para el ${day} de ${getMonthAndYear(targetDate)}`,
      });
      
    } catch (error) {
      console.error("Error generating idea for calendar:", error);
      toast({
        title: "Error al generar idea",
        description: "No se pudo generar o guardar la idea. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate calendar days
  const generateCalendarGrid = () => {
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    
    // Previous month
    const prevMonth = getPreviousMonth(currentYear, currentMonth);
    const daysInPrevMonth = getDaysInMonth(prevMonth.year, prevMonth.month);
    
    // Calendar rows (first two weeks)
    let days = [];
    
    // Add days from previous month
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      days.push({ day, currentMonth: false });
    }
    
    // Add days from current month
    for (let day = 1; day <= daysInMonth; day++) {
      // Buscar entrada para este día en los datos reales
      const entryDate = new Date(currentYear, currentMonth, day);
      const formattedDate = format(entryDate, "yyyy-MM-dd");
      const entry = entries.find(e => e.date === formattedDate);
      
      days.push({ 
        day, 
        currentMonth: true,
        entry: entry ? { title: entry.title, color: entry.color || "blue" } : undefined,
        date: formattedDate,
      });
      
      // Only show two weeks
      if (days.length >= 14) break;
    }
    
    return days;
  };

  const calendarDays = generateCalendarGrid();

  return (
    <section className="py-16 bg-gradient-to-b from-slate-950 to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center mb-10">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase font-heading">Calendario de Contenido</h2>
          <p className="mt-2 text-3xl leading-8 font-bold tracking-tight sm:text-4xl font-heading">
            Planifica Todo Tu Mes
          </p>
          <p className="mt-4 max-w-2xl text-xl text-muted-foreground lg:mx-auto">
            Organiza tus ideas de videos con nuestro modo rápido: ¡un clic y se genera la idea directamente en tu calendario!
          </p>
        </div>

        <Card className="bg-slate-950 border-slate-800">
          <CardHeader className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-slate-800">
            <h3 className="text-lg leading-6 font-medium font-heading">{getMonthAndYear(new Date(currentYear, currentMonth))}</h3>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handlePreviousMonth} disabled={isLoading || isGenerating}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextMonth} disabled={isLoading || isGenerating}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          {isLoggedIn ? (
            <>
              <div className="px-4 py-2 bg-primary/10 border-y border-slate-800">
                <p className="text-sm font-medium flex items-center">
                  <Sparkles className="h-4 w-4 mr-2 text-primary" />
                  Haz clic en cualquier día para generar una idea rápida y agregarla al calendario
                </p>
              </div>
              
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <>
                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 text-center text-xs leading-6 text-muted-foreground">
                      {WEEKDAYS.map(day => (
                        <div key={day} className="py-2">{day}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 text-sm border-t border-l border-slate-800">
                      {calendarDays.map((day, index) => (
                        <div
                          key={index}
                          className={`calendar-day border-r border-b border-slate-800 ${!day.currentMonth ? 'calendar-day-gray' : 'cursor-pointer hover:bg-primary/5'}`}
                          onClick={() => day.currentMonth && !isGenerating && !day.entry && generateQuickIdeaForDay(day.day)}
                        >
                          <div className="flex justify-between items-center">
                            <span className={!day.currentMonth ? 'text-slate-500' : ''}>{day.day}</span>
                            {day.currentMonth && !day.entry && (
                              <button 
                                className="text-xs text-primary hover:text-primary-dark" 
                                disabled={isGenerating}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  generateQuickIdeaForDay(day.day);
                                }}
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          {day.entry && (
                            <div className={`calendar-day-idea calendar-day-idea-${day.entry.color || 'blue'}`}>
                              {day.entry.title}
                            </div>
                          )}
                          
                          {isGenerating && day.currentMonth && (
                            <div className="text-xs text-center mt-1 text-primary animate-pulse">
                              Generando...
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
              
              <CardFooter className="bg-slate-900 px-4 py-4 sm:px-6 border-t border-slate-800 flex justify-between">
                <span className="text-xs text-muted-foreground">
                  {entries.length} {entries.length === 1 ? 'video planificado' : 'videos planificados'} este mes
                </span>
                
                <Link to="/calendar">
                  <Button size="sm">
                    <Calendar className="h-4 w-4 mr-1" />
                    Ver Calendario Completo
                  </Button>
                </Link>
              </CardFooter>
            </>
          ) : (
            <>
              <CardContent className="p-6">
                <div className="text-center py-10 bg-slate-900/50 rounded-lg border border-dashed border-slate-800">
                  <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Acceso Restringido</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                    Inicia sesión para planificar tus videos con un solo clic y organizar todo tu contenido.
                  </p>
                  <Link to="/login">
                    <Button>Iniciar Sesión</Button>
                  </Link>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </section>
  );
}
