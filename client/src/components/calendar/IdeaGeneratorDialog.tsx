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
import { format, addDays, startOfWeek, endOfWeek, addWeeks, addMonths, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  const [selectedTimeframe, setSelectedTimeframe] = useState<'single' | 'week' | 'month'>('single');
  const [generationMode, setGenerationMode] = useState<'idea' | 'keypoints' | 'fullScript'>('idea');
  const [generationStrategy, setGenerationStrategy] = useState<'random' | 'thesis'>('random');
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  
  // Configuración para Personal Brand Thesis
  const [contentPillar, setContentPillar] = useState<string>('ways_of_action');
  
  const contentPillars = [
    { value: 'ways_of_action', label: 'Formas de Acción', description: 'Contenido práctico y aplicable inmediatamente', color: 'bg-blue-600' },
    { value: 'awareness_expansion', label: 'Expansión de Conciencia', description: 'Desafiar el pensamiento convencional', color: 'bg-purple-600' },
    { value: 'narrative', label: 'Narrativa Personal', description: 'Experiencias personales y viaje', color: 'bg-amber-600' },
    { value: 'attractor', label: 'Atracción', description: 'Contenido que atrae a nuevas personas', color: 'bg-green-600' },
    { value: 'nurture', label: 'Nutrición', description: 'Contenido que crea conexión profunda', color: 'bg-red-600' }
  ];

  const handleIdeaGenerated = (idea: VideoIdeaContent) => {
    setGeneratedIdea(idea);
  };

  // Obtener fechas basadas en el timeframe seleccionado
  const getDatesForTimeframe = () => {
    if (selectedTimeframe === 'single') {
      return [selectedDate];
    } else if (selectedTimeframe === 'week') {
      const start = startOfWeek(selectedDate, { locale: es });
      const end = endOfWeek(selectedDate, { locale: es });
      return eachDayOfInterval({ start, end });
    } else if (selectedTimeframe === 'month') {
      const start = startOfMonth(selectedDate);
      const end = endOfMonth(selectedDate);
      return eachDayOfInterval({ start, end });
    }
    return [selectedDate];
  };

  const addIdeaToCalendar = async () => {
    if (!generatedIdea) return;

    setIsAddingToCalendar(true);
    try {
      const response = await apiRequest("POST", "/api/calendar/entry", {
        title: generatedIdea.title,
        date: selectedDate.toISOString(),
        notes: generatedIdea.outline.join("\n"),
        contentType: generationMode,
        contentPillar: generationStrategy === 'thesis' ? contentPillar : undefined,
        fullScript: generationMode === 'fullScript' ? generatedIdea.fullScript : undefined,
        color: getColorForPillar(contentPillar),
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
  
  const getColorForPillar = (pillar: string) => {
    const pillarObj = contentPillars.find(p => p.value === pillar);
    switch(pillar) {
      case 'ways_of_action': return '#3b82f6';
      case 'awareness_expansion': return '#9333ea';
      case 'narrative': return '#d97706';
      case 'attractor': return '#16a34a';
      case 'nurture': return '#dc2626';
      default: return '#4f46e5';
    }
  };
  
  const generateBatch = async () => {
    const dates = getDatesForTimeframe();
    setIsBatchGenerating(true);
    setProgress({ current: 0, total: dates.length });
    
    try {
      for (let i = 0; i < dates.length; i++) {
        const date = dates[i];
        setProgress({ current: i + 1, total: dates.length });
        
        // Aquí realizaríamos la generación de idea y guardado para cada fecha
        // Cada estrategia de contenido tendría parámetros diferentes
        
        const pillarToUse = generationStrategy === 'thesis' 
          ? (i % contentPillars.length === 0 ? contentPillars[0].value : 
             contentPillars[i % contentPillars.length].value)
          : undefined;
        
        const generationParams = {
          date: date.toISOString(),
          contentType: generationMode,
          contentPillar: pillarToUse,
        };
        
        // Simular pausa para evitar sobrecargar la API
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Aquí iría la lógica real de generación y guardado
        // ...
      }
      
      toast({
        title: "Generación completada",
        description: `Se han generado ideas para ${dates.length} días en tu calendario`,
      });
      
      // Invalidar consultas relacionadas
      queryClient.invalidateQueries({ queryKey: ['/api/calendar'] });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/month'] });
      
      // Cerrar el diálogo
      onClose();
    } catch (error) {
      console.error("Error en generación por lotes:", error);
      toast({
        title: "Error",
        description: "Ha ocurrido un error durante la generación por lotes",
        variant: "destructive"
      });
    } finally {
      setIsBatchGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Planificación de Contenido</DialogTitle>
          <DialogDescription>
            Genera ideas y guiones para videos basados en tu estrategia de marca personal
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="generator" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="generator">Generador Individual</TabsTrigger>
            <TabsTrigger value="batch">Planificación en Lote</TabsTrigger>
          </TabsList>
          
          <TabsContent value="generator" className="space-y-4">
            <SimpleGenerator
              onIdeaGenerated={handleIdeaGenerated}
              selectedDate={selectedDate}
            />
            
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
          </TabsContent>
          
          <TabsContent value="batch" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Período de Generación</CardTitle>
                  <CardDescription>Selecciona el rango de fechas para generar contenido</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup 
                    value={selectedTimeframe} 
                    onValueChange={(v) => setSelectedTimeframe(v as 'single' | 'week' | 'month')}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="single" id="single" />
                      <Label htmlFor="single">Día individual ({format(selectedDate, "dd/MM/yyyy")})</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="week" id="week" />
                      <Label htmlFor="week">Semana completa ({format(startOfWeek(selectedDate, { locale: es }), "dd/MM")} - {format(endOfWeek(selectedDate, { locale: es }), "dd/MM")})</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="month" id="month" />
                      <Label htmlFor="month">Mes completo ({format(selectedDate, "MMMM yyyy", { locale: es })})</Label>
                    </div>
                  </RadioGroup>
                  
                  <div className="mt-4">
                    <Label htmlFor="content-type" className="mb-2 block">Tipo de Contenido</Label>
                    <Select 
                      value={generationMode} 
                      onValueChange={(v) => setGenerationMode(v as 'idea' | 'keypoints' | 'fullScript')}
                    >
                      <SelectTrigger id="content-type">
                        <SelectValue placeholder="Selecciona tipo de contenido" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="idea">Solo idea</SelectItem>
                        <SelectItem value="keypoints">Puntos clave</SelectItem>
                        <SelectItem value="fullScript">Guión completo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Estrategia de Contenido</CardTitle>
                  <CardDescription>Define cómo se generará tu contenido</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup 
                    value={generationStrategy} 
                    onValueChange={(v) => setGenerationStrategy(v as 'random' | 'thesis')}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="random" id="random" />
                      <Label htmlFor="random">Aleatorio (temas variados)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="thesis" id="thesis" />
                      <Label htmlFor="thesis">Personal Brand Thesis</Label>
                    </div>
                  </RadioGroup>
                  
                  {generationStrategy === 'thesis' && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <Label className="mb-2 block">Pilares de Contenido</Label>
                        <div className="grid grid-cols-1 gap-2">
                          {contentPillars.map((pillar) => (
                            <div 
                              key={pillar.value}
                              className={`p-2 border rounded-md cursor-pointer transition-all ${contentPillar === pillar.value ? 'border-primary bg-primary/5' : 'border-border'}`}
                              onClick={() => setContentPillar(pillar.value)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className={`w-3 h-3 rounded-full ${pillar.color}`}></div>
                                  <span className="ml-2 font-medium">{pillar.label}</span>
                                </div>
                                {contentPillar === pillar.value && (
                                  <Badge variant="outline" className="ml-auto">Seleccionado</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{pillar.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {selectedTimeframe !== 'single' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Generación múltiple</AlertTitle>
                <AlertDescription>
                  Estás a punto de generar {selectedTimeframe === 'week' ? '7' : '~30'} ideas de contenido.
                  {generationMode === 'fullScript' && ' Recuerda que los guiones completos consumen más recursos.'}
                </AlertDescription>
              </Alert>
            )}
            
            {isBatchGenerating && (
              <div className="w-full bg-secondary rounded-full h-2.5 mb-4">
                <div 
                  className="bg-primary h-2.5 rounded-full transition-all" 
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                ></div>
                <p className="text-xs text-center mt-1 text-muted-foreground">
                  Generando {progress.current} de {progress.total}
                </p>
              </div>
            )}
            
            <DialogFooter className="flex justify-between items-center">
              <Button variant="outline" onClick={onClose} disabled={isBatchGenerating}>
                Cancelar
              </Button>
              <Button
                onClick={generateBatch}
                disabled={isBatchGenerating}
                className="gap-2"
              >
                {isBatchGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <CalendarIcon className="h-4 w-4" />
                    Generar y Añadir al Calendario
                  </>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}