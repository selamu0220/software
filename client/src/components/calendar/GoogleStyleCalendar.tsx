import { useState, useEffect, useRef } from "react";
import { 
  format, 
  addDays, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  isSameMonth,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  getDay,
  addHours
} from "date-fns";
import { es } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CalendarEntry, User, VideoIdea, GenerationRequest } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { VideoIdeaContent } from "@/lib/openai";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Video,
  Pencil,
  Trash2,
  Repeat,
  RefreshCw,
  AlignLeft
} from "lucide-react";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

interface GoogleStyleCalendarProps {
  user: User | null;
}

// Componente principal del calendario estilo Google
export default function GoogleStyleCalendar({ user }: GoogleStyleCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [showNewEntryDialog, setShowNewEntryDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showGenerateIdeaDialog, setShowGenerateIdeaDialog] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<CalendarEntry | null>(null);
  const [quickGenerateCategory, setQuickGenerateCategory] = useState("tecnología");
  const [quickGenerateLoading, setQuickGenerateLoading] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<number | null>(null);
  
  const { toast } = useToast();
  
  // Form state para nueva entrada
  const [newEntry, setNewEntry] = useState({
    title: "",
    notes: "",
    date: new Date(),
    color: "#3b82f6" // Color por defecto: azul
  });
  
  // Referencia para scrollear al día seleccionado
  const calendarRef = useRef<HTMLDivElement>(null);
  
  // Categorías para generación rápida
  const categories = [
    { value: "tecnología", label: "Tecnología" },
    { value: "negocios", label: "Negocios" },
    { value: "productividad", label: "Productividad" },
    { value: "marketing", label: "Marketing Digital" },
    { value: "finanzas", label: "Finanzas Personales" },
    { value: "desarrollo personal", label: "Desarrollo Personal" },
    { value: "educación", label: "Educación" },
    { value: "entretenimiento", label: "Entretenimiento" },
    { value: "cocina", label: "Cocina" },
    { value: "viajes", label: "Viajes" },
    { value: "gaming", label: "Gaming" },
    { value: "salud", label: "Salud y Bienestar" },
    { value: "deportes", label: "Deportes" },
    { value: "arte", label: "Arte y Creatividad" },
  ];
  
  // Formateo de fechas
  const formattedMonth = format(currentDate, 'MMMM yyyy', { locale: es });
  const capitalizedMonth = formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1);
  
  // Cargar entradas del calendario
  useEffect(() => {
    const fetchEntries = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        
        const response = await apiRequest(
          "GET", 
          `/api/calendar/month?year=${year}&month=${month}`
        );
        
        if (!response.ok) {
          throw new Error("Error al cargar el calendario");
        }
        
        const data = await response.json();
        setEntries(data);
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
    
    fetchEntries();
  }, [currentDate, user, toast]);
  
  // Navegación entre meses
  const prevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };
  
  // Reset a la fecha actual
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };
  
  // Obtener entradas para un día específico
  const getEntriesForDay = (day: Date) => {
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return isSameDay(entryDate, day);
    });
  };
  
  // Marcar una entrada como completada/incompleta
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
      
      // Actualizar estado local
      setEntries(prev => 
        prev.map(entry => 
          entry.id === entryId ? { ...entry, completed: !completed } : entry
        )
      );
      
      toast({
        title: completed ? "Tarea desmarcada" : "Tarea completada",
        description: completed 
          ? "Has desmarcado esta tarea como pendiente" 
          : "Has marcado esta tarea como completada",
      });
    } catch (error) {
      console.error("Error updating entry:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la entrada",
        variant: "destructive",
      });
    }
  };
  
  // Crear nueva entrada
  const createNewEntry = async () => {
    if (!user) return;
    
    try {
      const response = await apiRequest(
        "POST", 
        "/api/calendar", 
        {
          userId: user.id,
          title: newEntry.title,
          date: newEntry.date.toISOString(),
          notes: newEntry.notes || "",
          color: newEntry.color,
        }
      );
      
      if (!response.ok) {
        throw new Error("Error al crear la entrada");
      }
      
      const createdEntry = await response.json();
      
      // Actualizar estado local
      setEntries(prev => [...prev, createdEntry]);
      
      // Reset form & cerrar diálogo
      setNewEntry({
        title: "",
        notes: "",
        date: new Date(),
        color: "#3b82f6"
      });
      setShowNewEntryDialog(false);
      
      toast({
        title: "Entrada creada",
        description: "Se ha creado una nueva entrada en tu calendario",
      });
    } catch (error) {
      console.error("Error creating entry:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la entrada en el calendario",
        variant: "destructive",
      });
    }
  };
  
  // Eliminar entrada
  const deleteEntry = async () => {
    if (!entryToDelete) return;
    
    try {
      const response = await apiRequest(
        "DELETE", 
        `/api/calendar/entry/${entryToDelete}`
      );
      
      if (!response.ok) {
        throw new Error("Error al eliminar la entrada");
      }
      
      // Actualizar estado local
      setEntries(prev => prev.filter(entry => entry.id !== entryToDelete));
      
      // Cerrar diálogo y resetear estado
      setShowDeleteDialog(false);
      setEntryToDelete(null);
      
      toast({
        title: "Entrada eliminada",
        description: "La entrada ha sido eliminada del calendario",
      });
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la entrada",
        variant: "destructive",
      });
    }
  };
  
  // Generar idea rápida
  const generateQuickIdea = async () => {
    if (!user || quickGenerateLoading) return;
    
    setQuickGenerateLoading(true);
    
    try {
      // Preparar parámetros para la generación
      const params: GenerationRequest = {
        category: quickGenerateCategory,
        subcategory: "",
        videoFocus: `Ideas para video de ${quickGenerateCategory}`,
        videoLength: "5-10",
        templateStyle: "educativo",
        contentTone: "profesional",
        contentType: "idea",
        timingDetail: false,
        useSubcategory: false
      };
      
      // Llamar a la API para generar la idea
      const response = await apiRequest("POST", "/api/generate-idea", params);
      
      if (!response.ok) {
        throw new Error("Error al generar la idea");
      }
      
      const generatedIdea: VideoIdeaContent = await response.json();
      
      // Crear una entrada en el calendario con la idea generada
      const calendarResponse = await apiRequest(
        "POST", 
        "/api/calendar", 
        {
          userId: user.id,
          title: generatedIdea.title,
          date: selectedDate.toISOString(),
          notes: generatedIdea.outline.join("\n"),
          color: "#10b981", // Verde para ideas generadas
          videoIdeaContent: generatedIdea
        }
      );
      
      if (!calendarResponse.ok) {
        throw new Error("Error al añadir la idea al calendario");
      }
      
      const createdEntry = await calendarResponse.json();
      
      // Actualizar estado local
      setEntries(prev => [...prev, createdEntry]);
      
      // Cerrar diálogo
      setShowGenerateIdeaDialog(false);
      
      toast({
        title: "Idea generada y añadida",
        description: "Se ha generado una nueva idea y se ha añadido al calendario",
      });
      
    } catch (error) {
      console.error("Error generating idea:", error);
      toast({
        title: "Error",
        description: "No se pudo generar la idea",
        variant: "destructive",
      });
    } finally {
      setQuickGenerateLoading(false);
    }
  };

  // Renderizar días del mes (vista mensual)
  const renderMonthView = () => {
    // Determinar el primer día del mes y el último día visible del calendario
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    // Obtener el primer día de la semana (lunes = 1)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    
    // Calcular el último día visible, asegurando que se muestre hasta el final del mes
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    // Generar todos los días que se mostrarán en el calendario
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Agrupar los días en semanas para la representación de la cuadrícula
    const weeks: Date[][] = [];
    let week: Date[] = [];
    
    days.forEach(day => {
      week.push(day);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    });
    
    // Añadir la última semana si hay días restantes
    if (week.length > 0) {
      weeks.push(week);
    }
    
    return (
      <div className="bg-card rounded-md border border-border">
        {/* Encabezados de días de semana */}
        <div className="grid grid-cols-7 border-b border-border">
          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day, i) => (
            <div key={`header-${i}`} className="p-3 text-center text-sm font-medium">
              {day}
            </div>
          ))}
        </div>
        
        {/* Cuadrícula de días */}
        <div>
          {weeks.map((week, weekIndex) => (
            <div key={`week-${weekIndex}`} className="grid grid-cols-7 border-b border-border last:border-b-0">
              {week.map((day, dayIndex) => {
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedDate);
                const dayEntries = getEntriesForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                
                return (
                  <div
                    key={`day-${dayIndex}`}
                    className={`min-h-[120px] p-1 ${
                      isCurrentMonth ? 'bg-card' : 'bg-muted/20 text-muted-foreground'
                    } ${isSelected ? 'ring-2 ring-primary ring-inset' : ''}`}
                    onClick={() => {
                      setSelectedDate(day);
                      if (dayEntries.length > 0) {
                        setSelectedEntry(dayEntries[0]);
                      } else {
                        setSelectedEntry(null);
                        setNewEntry(prev => ({ ...prev, date: day }));
                      }
                    }}
                  >
                    <div className="flex justify-between items-start h-full flex-col">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm mb-1 
                        ${isToday ? 'bg-primary text-primary-foreground' : ''}
                      `}>
                        {format(day, 'd')}
                      </div>
                      
                      <div className="flex-1 w-full">
                        {dayEntries.length > 0 ? (
                          <div className="space-y-1 w-full">
                            {dayEntries.slice(0, 3).map((entry) => (
                              <div
                                key={entry.id}
                                className={`
                                  px-2 py-1 rounded text-xs truncate 
                                  ${entry.completed ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'}`}
                                style={{ backgroundColor: `${entry.color}20`, color: entry.color }}
                              >
                                {entry.title}
                              </div>
                            ))}
                            {dayEntries.length > 3 && (
                              <div className="text-xs text-muted-foreground mt-1 pl-2">
                                +{dayEntries.length - 3} más
                              </div>
                            )}
                          </div>
                        ) : isCurrentMonth ? (
                          <div 
                            className="flex items-center justify-center h-full opacity-0 hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNewEntry(prev => ({ ...prev, date: day }));
                              setShowNewEntryDialog(true);
                            }}
                          >
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Si no hay usuario, mostrar mensaje para login
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
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" ref={calendarRef}>
      <div className="flex flex-col space-y-4">
        {/* Barra de herramientas del calendario */}
        <div className="flex flex-wrap items-center justify-between bg-card p-4 rounded-md border border-border">
          <div className="flex items-center space-x-4 mb-2 sm:mb-0">
            <h2 className="text-xl font-bold font-heading">Calendario de Contenido</h2>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Hoy
            </Button>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {capitalizedMonth}
              </span>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Select defaultValue="month" onValueChange={(value: any) => setView(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Vista" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Mes</SelectItem>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="day">Día</SelectItem>
              </SelectContent>
            </Select>
            
            <Dialog open={showNewEntryDialog} onOpenChange={setShowNewEntryDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Entrada
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear nueva entrada</DialogTitle>
                  <DialogDescription>
                    Añade una nueva entrada a tu calendario de contenido.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título</Label>
                    <Input 
                      id="title"
                      value={newEntry.title}
                      onChange={(e) => setNewEntry({...newEntry, title: e.target.value})}
                      placeholder="Título del video o tarea"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Fecha</Label>
                    <Input 
                      id="date"
                      type="date"
                      value={format(newEntry.date, 'yyyy-MM-dd')}
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : new Date();
                        setNewEntry({...newEntry, date});
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea 
                      id="notes"
                      value={newEntry.notes}
                      onChange={(e) => setNewEntry({...newEntry, notes: e.target.value})}
                      placeholder="Detalles adicionales..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <div className="flex space-x-2">
                      {['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'].map((color) => (
                        <div
                          key={color}
                          className={`w-6 h-6 rounded-full cursor-pointer ${
                            newEntry.color === color ? 'ring-2 ring-offset-2 ring-black' : ''
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewEntry({...newEntry, color})}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewEntryDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={createNewEntry}>Guardar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Dialog open={showGenerateIdeaDialog} onOpenChange={setShowGenerateIdeaDialog}>
              <DialogTrigger asChild>
                <Button variant="secondary">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generar Idea
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generar idea para video</DialogTitle>
                  <DialogDescription>
                    Genera automáticamente una idea para tu próximo video y añádela al calendario.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría</Label>
                    <Select 
                      value={quickGenerateCategory} 
                      onValueChange={setQuickGenerateCategory}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Fecha</Label>
                    <Input 
                      id="date"
                      type="date"
                      value={format(selectedDate, 'yyyy-MM-dd')}
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : new Date();
                        setSelectedDate(date);
                      }}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowGenerateIdeaDialog(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={generateQuickIdea}
                    disabled={quickGenerateLoading}
                  >
                    {quickGenerateLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Generar
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Vista principal del calendario */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Vista de calendario (izquierda) */}
          <div className="md:col-span-3">
            {view === "month" && renderMonthView()}
            {view === "week" && (
              <div className="bg-card rounded-md border border-border p-4">
                <h3 className="text-lg font-medium mb-4">Vista semanal</h3>
                <p className="text-muted-foreground">Vista semanal en desarrollo...</p>
              </div>
            )}
            {view === "day" && (
              <div className="bg-card rounded-md border border-border p-4">
                <h3 className="text-lg font-medium mb-4">Vista diaria</h3>
                <p className="text-muted-foreground">Vista diaria en desarrollo...</p>
              </div>
            )}
          </div>
          
          {/* Panel de detalles (derecha) */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}
                </CardTitle>
                <CardDescription>
                  {getEntriesForDay(selectedDate).length 
                    ? `${getEntriesForDay(selectedDate).length} entradas programadas` 
                    : "No hay entradas para este día"}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {getEntriesForDay(selectedDate).length > 0 ? (
                  <div className="space-y-3">
                    {getEntriesForDay(selectedDate).map((entry) => (
                      <div 
                        key={entry.id}
                        className="p-3 rounded-md border border-border hover:bg-muted/50"
                        style={{ borderLeftColor: entry.color, borderLeftWidth: '4px' }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center">
                            <button 
                              onClick={() => toggleEntryCompletion(entry.id, entry.completed)}
                              className="mr-2"
                            >
                              {entry.completed ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : (
                                <Circle className="h-5 w-5 text-muted-foreground" />
                              )}
                            </button>
                            <div>
                              <h4 className="font-medium text-sm">{entry.title}</h4>
                              <p className="text-xs text-muted-foreground">
                                {entry.videoIdeaId ? "Idea generada por IA" : "Entrada manual"}
                              </p>
                            </div>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                                </svg>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setEntryToDelete(entry.id);
                                  setShowDeleteDialog(true);
                                }}
                                className="text-red-500"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        {entry.notes && (
                          <div className="mt-2 pl-7 text-xs text-muted-foreground">
                            <p className="whitespace-pre-line">{entry.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <AlignLeft className="h-10 w-10 text-muted-foreground mb-3" />
                    <h4 className="text-sm font-medium mb-1">Sin entradas</h4>
                    <p className="text-xs text-muted-foreground mb-4">
                      No hay entradas programadas para este día.
                    </p>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setNewEntry(prev => ({ ...prev, date: selectedDate }));
                          setShowNewEntryDialog(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Añadir
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => {
                          setSelectedDate(selectedDate);
                          setShowGenerateIdeaDialog(true);
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Generar Idea
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="border-t pt-4 flex justify-between">
                <p className="text-xs text-muted-foreground">
                  Hay {entries.length} entradas este mes
                </p>
                {getEntriesForDay(selectedDate).length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setNewEntry(prev => ({ ...prev, date: selectedDate }));
                      setShowNewEntryDialog(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Añadir más
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta entrada? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={deleteEntry}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}