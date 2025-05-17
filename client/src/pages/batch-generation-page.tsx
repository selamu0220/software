import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { Loader2, Calendar as CalendarIcon, BrainCircuit, Braces, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { BatchGenerationParams, BatchProgress, TimeframeType, ContentPillarType, GenerationStrategyType, getDatesForTimeframe, generateBatch } from "@/lib/batch-generation";

export default function BatchGenerationPage() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [params, setParams] = useState<BatchGenerationParams>({
    timeframe: 'week',
    startDate: new Date(),
    contentType: 'idea',
    strategy: 'thesis',
    geminiApiKey: '',
  });
  const [progress, setProgress] = useState<BatchProgress>({
    current: 0,
    total: 0,
    status: 'pending'
  });
  
  // Calcular fechas resultantes
  const resultDates = getDatesForTimeframe(params.startDate, params.timeframe);
  
  // Función para iniciar la generación por lotes
  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress({
      current: 0,
      total: resultDates.length,
      status: 'generating',
      message: 'Iniciando generación por lotes...'
    });
    
    try {
      const success = await generateBatch(params, (progressUpdate) => {
        setProgress(progressUpdate);
      });
      
      if (success) {
        toast({
          title: "Generación completada",
          description: `Se han generado ${resultDates.length} ideas y añadido al calendario.`,
        });
      } else {
        toast({
          title: "Error en generación",
          description: "No se pudieron generar algunas ideas. Revisa el calendario para ver las que se han creado.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error en generación por lotes:", error);
      toast({
        title: "Error en generación",
        description: "Ha ocurrido un error durante la generación por lotes. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="container py-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Generación por lotes</h1>
        <p className="text-muted-foreground">
          Genera ideas de videos, guiones o puntos clave para toda la semana o mes en un solo proceso.
        </p>
        
        <Tabs defaultValue="configuration" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="configuration">Configuración</TabsTrigger>
            <TabsTrigger value="preview">Previsualización ({resultDates.length} fechas)</TabsTrigger>
          </TabsList>
          
          <TabsContent value="configuration" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Periodo y contenido</CardTitle>
                  <CardDescription>
                    Selecciona el periodo de tiempo y el tipo de contenido a generar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Periodo</Label>
                        <Select 
                          value={params.timeframe} 
                          onValueChange={(value: TimeframeType) => 
                            setParams({...params, timeframe: value})
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un periodo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">Una fecha</SelectItem>
                            <SelectItem value="week">Semana completa</SelectItem>
                            <SelectItem value="month">Mes completo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Fecha inicial</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {params.startDate ? (
                                format(params.startDate, "PPP", { locale: es })
                              ) : (
                                <span>Selecciona una fecha</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={params.startDate}
                              onSelect={(date) => date && setParams({...params, startDate: date})}
                              initialFocus
                              locale={es}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Tipo de contenido</Label>
                      <Select 
                        value={params.contentType} 
                        onValueChange={(value: 'idea' | 'keypoints' | 'fullScript') => 
                          setParams({...params, contentType: value})
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="idea">
                            <div className="flex items-center">
                              <BrainCircuit className="mr-2 h-4 w-4" />
                              <span>Ideas de video</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="keypoints">
                            <div className="flex items-center">
                              <Braces className="mr-2 h-4 w-4" />
                              <span>Puntos clave</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="fullScript">
                            <div className="flex items-center">
                              <FileText className="mr-2 h-4 w-4" />
                              <span>Guión completo</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Estrategia de contenido</CardTitle>
                  <CardDescription>
                    Configura la estrategia y pilares de contenido basados en Personal Brand Thesis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Estrategia</Label>
                      <Select 
                        value={params.strategy} 
                        onValueChange={(value: GenerationStrategyType) => 
                          setParams({...params, strategy: value})
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una estrategia" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="random">Contenido variado (sin estrategia)</SelectItem>
                          <SelectItem value="thesis">Personal Brand Thesis</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {params.strategy === 'thesis' && (
                      <div className="space-y-2">
                        <Label>Pilar de contenido (opcional)</Label>
                        <Select 
                          value={params.contentPillar || ''} 
                          onValueChange={(value: string) => 
                            setParams({...params, contentPillar: value as ContentPillarType || undefined})
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un pilar o deja en blanco para rotar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Rotar entre todos los pilares</SelectItem>
                            <SelectItem value="ways_of_action">Ways of Action (Práctico)</SelectItem>
                            <SelectItem value="awareness_expansion">Awareness Expansion (Educativo)</SelectItem>
                            <SelectItem value="narrative">Narrative (Historias)</SelectItem>
                            <SelectItem value="attractor">Attractor (Viral)</SelectItem>
                            <SelectItem value="nurture">Nurture (Conexión)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Configuración de IA</CardTitle>
                  <CardDescription>
                    Configura las APIs de IA para la generación de contenido
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Clave API de Gemini (opcional)</Label>
                      <Input 
                        type="password" 
                        placeholder="Introduce tu clave API de Gemini" 
                        value={params.geminiApiKey || ''} 
                        onChange={(e) => setParams({...params, geminiApiKey: e.target.value})}
                      />
                      <p className="text-xs text-muted-foreground">
                        Si no introduces una clave, se usará la API del servidor.
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleGenerate} 
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generando contenido...
                      </>
                    ) : (
                      'Generar contenido'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Fechas para generación</CardTitle>
                <CardDescription>
                  Se generará contenido para las siguientes fechas:
                </CardDescription>
              </CardHeader>
              <CardContent>
                {resultDates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {resultDates.map((date, index) => (
                      <div 
                        key={index} 
                        className={cn(
                          "p-2 border rounded-md",
                          params.strategy === 'thesis' && "border-l-4",
                          params.strategy === 'thesis' && index % 5 === 0 && "border-l-blue-500",
                          params.strategy === 'thesis' && index % 5 === 1 && "border-l-purple-500",
                          params.strategy === 'thesis' && index % 5 === 2 && "border-l-amber-500",
                          params.strategy === 'thesis' && index % 5 === 3 && "border-l-green-500",
                          params.strategy === 'thesis' && index % 5 === 4 && "border-l-red-500",
                        )}
                      >
                        <div className="flex justify-between items-center">
                          <span>{format(date, "EEEE d MMM", { locale: es })}</span>
                          {params.strategy === 'thesis' && (
                            <span className="text-xs text-muted-foreground">
                              {index % 5 === 0 && "Ways of Action"}
                              {index % 5 === 1 && "Awareness Expansion"}
                              {index % 5 === 2 && "Narrative"}
                              {index % 5 === 3 && "Attractor"}
                              {index % 5 === 4 && "Nurture"}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No se han seleccionado fechas.</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {isGenerating && (
              <Card>
                <CardHeader>
                  <CardTitle>Progreso de generación</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={(progress.current / progress.total) * 100} />
                  <div className="flex justify-between text-sm">
                    <span>Generado: {progress.current} de {progress.total}</span>
                    <span>
                      {progress.status === 'generating' && 'Generando...'}
                      {progress.status === 'completed' && '¡Completado!'}
                      {progress.status === 'failed' && 'Error'}
                    </span>
                  </div>
                  {progress.message && (
                    <p className="text-sm text-muted-foreground">{progress.message}</p>
                  )}
                  {progress.error && (
                    <p className="text-sm text-destructive">{progress.error}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}