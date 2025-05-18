import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CalendarDays, FileText, Plus, Save } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";

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
    }
  }, [isOpen]);
  
  const { toast } = useToast();
  
  // Obtener las colecciones existentes
  const { data: collections, isLoading: isLoadingCollections } = useQuery({
    queryKey: ['/api/script-collections'],
    enabled: isOpen,
  });
  
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
    if (selectedDates.length === 0) {
      toast({
        title: "Selecciona fechas",
        description: "Debes seleccionar al menos una fecha para generar guiones",
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
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generar múltiples guiones para el calendario</DialogTitle>
          <DialogDescription>
            Selecciona los días donde quieres crear guiones completos. Estos guiones se guardarán en una colección y se vincularán al calendario.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div>
            <div className="space-y-2">
              <Label>Selecciona las fechas para los guiones</Label>
              <div className="border rounded-lg p-2">
                <Calendar
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={(dates) => setSelectedDates(dates || [])}
                  className="rounded-md border"
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
                  <SelectItem value="Gaming">Gaming</SelectItem>
                  <SelectItem value="Tutorial">Tutorial</SelectItem>
                  <SelectItem value="Educación">Educación</SelectItem>
                  <SelectItem value="Entretenimiento">Entretenimiento</SelectItem>
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
                  <SelectItem value="Short (< 5 min)">Corto (menos de 5 min)</SelectItem>
                  <SelectItem value="Medium (5-10 min)">Medio (5-10 min)</SelectItem>
                  <SelectItem value="Long (10-20 min)">Largo (10-20 min)</SelectItem>
                  <SelectItem value="Extra Long (20+ min)">Extra largo (20+ min)</SelectItem>
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
                    value={selectedCollectionId?.toString() || ""} 
                    onValueChange={(val) => setSelectedCollectionId(parseInt(val))}
                    disabled={isGenerating || isLoadingCollections}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una colección" />
                    </SelectTrigger>
                    <SelectContent>
                      {collections?.map((collection: any) => (
                        <SelectItem key={collection.id} value={collection.id.toString()}>
                          {collection.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Cancelar
          </Button>
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || selectedDates.length === 0}
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
                Generar {selectedDates.length} guión(es)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}