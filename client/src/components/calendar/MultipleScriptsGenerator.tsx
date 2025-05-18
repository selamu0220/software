import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CalendarDays, FileText, Plus, Save, Upload, Calendar as CalendarIcon } from "lucide-react";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

interface MultipleScriptsGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MultipleScriptsGenerator({ isOpen, onClose }: MultipleScriptsGeneratorProps) {
  // Estados
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [category, setCategory] = useState("YouTube");
  const [subcategory, setSubcategory] = useState("");
  const [videoLength, setVideoLength] = useState("Medium (5-10 min)");
  const [isGenerating, setIsGenerating] = useState(false);
  const [createNewCollection, setCreateNewCollection] = useState(true);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | undefined>(undefined);
  const [customInstructions, setCustomInstructions] = useState("");
  const [selectedAiModel, setSelectedAiModel] = useState("gemini");
  const [uploadedFileId, setUploadedFileId] = useState<number | undefined>(undefined);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [generateWeek, setGenerateWeek] = useState(false);
  const [generateMonth, setGenerateMonth] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState("selection");
  
  // Referencias
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Limpiar estado al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      setSelectedDates([]);
      setCategory("YouTube");
      setSubcategory("");
      setVideoLength("Medium (5-10 min)");
      setCreateNewCollection(true);
      setNewCollectionName(format(new Date(), "'Guiones para' MMMM yyyy", { locale: es }));
      setSelectedCollectionId(undefined);
      setCustomInstructions("");
      setSelectedAiModel("gemini");
      setUploadedFileId(undefined);
      setUploadedFileName("");
      setGenerateWeek(false);
      setGenerateMonth(false);
      setStartDate(new Date());
      setActiveTab("selection");
    }
  }, [isOpen]);
  
  const { toast } = useToast();
  
  // Obtener las colecciones existentes
  const { data: collections, isLoading: isLoadingCollections } = useQuery({
    queryKey: ['/api/script-collections'],
    enabled: isOpen,
  });
  
  // Subir archivo de instrucciones
  const uploadFileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest('POST', '/api/upload', formData);
      if (!response.ok) {
        throw new Error('Error al subir el archivo');
      }
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Archivo subido correctamente',
        description: `El archivo ${data.fileName} se ha subido correctamente.`,
      });
      setUploadedFileId(data.id);
      setUploadedFileName(data.fileName);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al subir archivo',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Manejar la subida del archivo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'instructions');
    
    uploadFileMutation.mutate(formData);
  };

  // Abrir el selector de archivos
  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };
  
  // Mutación para generar múltiples guiones
  const generateMutation = useMutation({
    mutationFn: async (data: {
      dates: string[];
      category: string;
      subcategory: string;
      videoLength: string;
      collectionId?: number;
      createNewCollection: boolean;
      newCollectionName?: string;
      customInstructions?: string;
      uploadedFileId?: number;
      aiModel?: string;
      generateWeek?: boolean;
      generateMonth?: boolean;
      startDate?: string;
    }) => {
      const response = await apiRequest("POST", "/api/generate-multiple-scripts", data);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al generar los guiones");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Guiones generados correctamente",
        description: `Se han generado ${data.count} guiones en la colección "${data.collectionName}"`,
      });
      
      // Invalidar consultas
      queryClient.invalidateQueries({ queryKey: ['/api/script-collections'] });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar'] });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/month'] });
      
      // Cerrar el diálogo
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error al generar guiones",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsGenerating(false);
    }
  });
  
  const handleGenerate = async () => {
    // Si no se ha seleccionado generación por semana/mes, verificar fechas seleccionadas
    if (!generateWeek && !generateMonth && selectedDates.length === 0) {
      toast({
        title: "Selecciona fechas",
        description: "Debes seleccionar al menos una fecha o elegir generar para toda la semana/mes",
        variant: "destructive",
      });
      return;
    }
    
    if (createNewCollection && !newCollectionName) {
      toast({
        title: "Nombre requerido",
        description: "Debes proporcionar un nombre para la nueva colección",
        variant: "destructive",
      });
      return;
    }
    
    if (!createNewCollection && !selectedCollectionId) {
      toast({
        title: "Colección requerida",
        description: "Debes seleccionar una colección existente o crear una nueva",
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerating(true);
    
    // Formatear fechas como strings ISO
    const dateStrings = selectedDates.map(date => date.toISOString());
    
    generateMutation.mutate({
      dates: dateStrings,
      category,
      subcategory,
      videoLength,
      collectionId: !createNewCollection ? selectedCollectionId : undefined,
      createNewCollection,
      newCollectionName: createNewCollection ? newCollectionName : undefined,
      customInstructions,
      uploadedFileId,
      aiModel: selectedAiModel,
      generateWeek,
      generateMonth,
      startDate: startDate ? startDate.toISOString() : undefined,
    });
  };
  
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generar múltiples guiones</DialogTitle>
          <DialogDescription>
            Configura los parámetros para generar guiones automáticamente para varias fechas.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="selection">Selección</TabsTrigger>
            <TabsTrigger value="advanced">Opciones Avanzadas</TabsTrigger>
            <TabsTrigger value="ia">Modelo IA</TabsTrigger>
          </TabsList>
          
          <TabsContent value="selection">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <div className="space-y-4">
                  <Label className="text-base font-medium">Selección de fechas</Label>
                  
                  {/* Opciones de generación rápida */}
                  <div className="space-y-2 bg-muted p-3 rounded-md">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="generate-week"
                        checked={generateWeek}
                        onCheckedChange={(checked) => {
                          setGenerateWeek(checked);
                          if (checked) {
                            setGenerateMonth(false);
                            setSelectedDates([]);
                          }
                        }}
                      />
                      <Label htmlFor="generate-week">Generar para toda la semana</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="generate-month"
                        checked={generateMonth}
                        onCheckedChange={(checked) => {
                          setGenerateMonth(checked);
                          if (checked) {
                            setGenerateWeek(false);
                            setSelectedDates([]);
                          }
                        }}
                      />
                      <Label htmlFor="generate-month">Generar para todo el mes</Label>
                    </div>
                    
                    {(generateWeek || generateMonth) && (
                      <div className="mt-2 space-y-2">
                        <Label htmlFor="start-date">Fecha de inicio</Label>
                        <div className="border rounded-lg p-2">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            className="rounded-md"
                            locale={es}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {!generateWeek && !generateMonth && (
                    <>
                      <Label>Selecciona fechas específicas</Label>
                      <div className="border rounded-lg p-2">
                        <Calendar
                          mode="multiple"
                          selected={selectedDates}
                          onSelect={(dates) => setSelectedDates(dates || [])}
                          className="rounded-md"
                          locale={es}
                        />
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        {selectedDates.length === 0 ? (
                          <p>No hay fechas seleccionadas</p>
                        ) : (
                          <p>Has seleccionado {selectedDates.length} día(s)</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Categoría de video</Label>
                  <Select 
                    value={category} 
                    onValueChange={setCategory}
                    disabled={isGenerating}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YouTube">YouTube</SelectItem>
                      <SelectItem value="Instagram">Instagram</SelectItem>
                      <SelectItem value="TikTok">TikTok</SelectItem>
                      <SelectItem value="Shorts">YouTube Shorts</SelectItem>
                      <SelectItem value="Facebook">Facebook</SelectItem>
                      <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                      <SelectItem value="Twitter">Twitter</SelectItem>
                      <SelectItem value="Blog">Blog</SelectItem>
                      <SelectItem value="Podcast">Podcast</SelectItem>
                      <SelectItem value="Other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Subcategoría (opcional)</Label>
                  <Input
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    placeholder="Ej: Tutoriales de programación"
                    disabled={isGenerating}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Duración de los videos</Label>
                  <Select 
                    value={videoLength} 
                    onValueChange={setVideoLength}
                    disabled={isGenerating}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una duración" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Short (1-3 min)">Corto (1-3 min)</SelectItem>
                      <SelectItem value="Medium (5-10 min)">Medio (5-10 min)</SelectItem>
                      <SelectItem value="Long (10-20 min)">Largo (10-20 min)</SelectItem>
                      <SelectItem value="Extended (20+ min)">Extendido (20+ min)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <Label className="text-base font-medium">Colección de guiones</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      id="newCollection" 
                      checked={createNewCollection} 
                      onChange={() => setCreateNewCollection(true)}
                      className="w-4 h-4"
                      disabled={isGenerating}
                    />
                    <Label htmlFor="newCollection" className="cursor-pointer">
                      Crear nueva colección
                    </Label>
                  </div>
                  
                  {createNewCollection && (
                    <div className="pl-6 space-y-2">
                      <Label>Nombre de la colección</Label>
                      <Input
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        placeholder="Ej: Guiones para mayo 2025"
                        disabled={isGenerating}
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      id="existingCollection" 
                      checked={!createNewCollection} 
                      onChange={() => setCreateNewCollection(false)}
                      className="w-4 h-4"
                      disabled={isGenerating || (collections?.length ?? 0) === 0}
                    />
                    <Label htmlFor="existingCollection" className="cursor-pointer">
                      Usar colección existente
                    </Label>
                  </div>
                  
                  {!createNewCollection && (
                    <div className="pl-6 space-y-2">
                      <Label>Selecciona una colección</Label>
                      <Select 
                        value={selectedCollectionId?.toString() || "default"} 
                        onValueChange={(val) => val !== "default" && setSelectedCollectionId(parseInt(val))}
                        disabled={isGenerating || isLoadingCollections}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una colección" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default" disabled>
                            Selecciona una colección
                          </SelectItem>
                          {collections && collections.length > 0 ? (
                            collections.map((collection: any) => (
                              <SelectItem key={collection.id} value={collection.id.toString()}>
                                {collection.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="empty" disabled>
                              No hay colecciones disponibles
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced">
            <div className="space-y-6">
              {/* Instrucciones personalizadas */}
              <div className="space-y-2">
                <Label htmlFor="custom-instructions">Instrucciones personalizadas</Label>
                <Textarea
                  id="custom-instructions"
                  placeholder="Escribe instrucciones específicas para la generación de guiones..."
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  className="min-h-[150px]"
                  disabled={isGenerating}
                />
                <p className="text-xs text-muted-foreground">
                  Estas instrucciones se utilizarán para personalizar la generación de guiones, por ejemplo: "Incluir una frase motivacional al inicio" o "Dirigirse a un público empresarial".
                </p>
              </div>
              
              {/* Subir archivo PDF o TXT con instrucciones */}
              <div className="space-y-2">
                <Label>Subir archivo de instrucciones</Label>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,.txt"
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex gap-2"
                    onClick={handleChooseFile}
                    disabled={uploadFileMutation.isPending || isGenerating}
                  >
                    {uploadFileMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Seleccionar archivo (.pdf, .txt)
                  </Button>
                  {uploadedFileName && (
                    <div className="text-sm bg-muted p-2 rounded-md flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>{uploadedFileName}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Sube un archivo PDF o TXT con instrucciones detalladas para la generación de tus guiones. Este archivo puede contener ejemplos de estructura, tono, formato, etc.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="ia">
            <div className="space-y-6">
              {/* Selección de modelo de IA */}
              <div className="space-y-2">
                <Label htmlFor="ai-model">Modelo de IA</Label>
                <Select
                  value={selectedAiModel}
                  onValueChange={setSelectedAiModel}
                  disabled={isGenerating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar modelo de IA" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini">Gemini Pro 1.5</SelectItem>
                    <SelectItem value="anthropic">Claude 3 Sonnet</SelectItem>
                    <SelectItem value="perplexity">Perplexity API</SelectItem>
                    <SelectItem value="openai">GPT-4o</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Selecciona el modelo de IA que quieres utilizar para la generación de guiones.
                </p>
                
                {/* Información sobre el modelo seleccionado */}
                <div className="bg-muted p-4 rounded-md mt-4">
                  <h4 className="font-medium mb-2">Información del modelo</h4>
                  {selectedAiModel === "gemini" && (
                    <p className="text-sm">
                      Gemini Pro 1.5 es un modelo multimodal de Google con capacidades avanzadas para la generación de guiones. Ideal para textos estructurados y creativos.
                    </p>
                  )}
                  {selectedAiModel === "anthropic" && (
                    <p className="text-sm">
                      Claude 3 Sonnet de Anthropic destaca por su capacidad para seguir instrucciones complejas y generar contenido de alta calidad con un enfoque conversacional.
                    </p>
                  )}
                  {selectedAiModel === "perplexity" && (
                    <p className="text-sm">
                      Perplexity API utiliza un modelo basado en LLaMa 3 con acceso a internet para proporcionar respuestas actualizadas y bien fundamentadas.
                    </p>
                  )}
                  {selectedAiModel === "openai" && (
                    <p className="text-sm">
                      GPT-4o es el modelo más reciente de OpenAI, con capacidades avanzadas para entender contexto y generar contenido coherente y de alta calidad.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Cancelar
          </Button>
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                {generateWeek ? "Generar guiones para la semana" : 
                 generateMonth ? "Generar guiones para el mes" : 
                 `Generar ${selectedDates.length} guión(es)`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}