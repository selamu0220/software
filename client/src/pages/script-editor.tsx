import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardDescription,
  CardHeader,
  CardFooter,
  CardTitle 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

// Iconos para la barra de herramientas
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  ListOrdered,
  List as ListBullet,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Clock,
  Save,
  Trash,
  Copy,
  FileText,
  FileQuestion,
  MessageSquare,
  BookOpen,
  Play,
  Type,
  FolderOpen,
  Music,
  Film,
  ChevronDown,
  Plus,
  ArrowLeft,
  Settings
} from "lucide-react";

// Tipos
interface ScriptSection {
  id: string;
  title: string;
  content: string;
  type: "intro" | "main" | "conclusion" | "custom";
  duration?: string; // duración estimada para la sección
}

interface Script {
  id: number;
  title: string;
  subtitle?: string;
  description?: string;
  tags: string[];
  category?: string;
  sections: ScriptSection[];
  template?: boolean;
  createdAt: Date;
  updatedAt: Date;
  collectionId: number;
  totalDuration?: string;
}

interface TemplateOption {
  id: string;
  name: string;
  description: string;
  structure: {
    sections: Array<{
      title: string;
      type: string;
      placeholder: string;
    }>;
  };
}

// Plantillas predefinidas
const SCRIPT_TEMPLATES: TemplateOption[] = [
  {
    id: "standard",
    name: "Guión Estándar",
    description: "Estructura básica con introducción, desarrollo y conclusión",
    structure: {
      sections: [
        {
          title: "Introducción",
          type: "intro",
          placeholder: "Presenta el tema y capta la atención del espectador..."
        },
        {
          title: "Desarrollo",
          type: "main",
          placeholder: "Desarrolla los puntos principales del tema..."
        },
        {
          title: "Conclusión",
          type: "conclusion",
          placeholder: "Resume los puntos clave y proporciona un cierre..."
        }
      ]
    }
  },
  {
    id: "tutorial",
    name: "Tutorial Paso a Paso",
    description: "Estructura ideal para tutoriales con pasos claros",
    structure: {
      sections: [
        {
          title: "Introducción",
          type: "intro",
          placeholder: "Presenta el problema y lo que aprenderán..."
        },
        {
          title: "Requisitos",
          type: "custom",
          placeholder: "Lista los materiales o conocimientos previos necesarios..."
        },
        {
          title: "Paso 1",
          type: "main",
          placeholder: "Describe el primer paso del tutorial..."
        },
        {
          title: "Paso 2",
          type: "main",
          placeholder: "Describe el segundo paso del tutorial..."
        },
        {
          title: "Paso 3",
          type: "main",
          placeholder: "Describe el tercer paso del tutorial..."
        },
        {
          title: "Conclusión",
          type: "conclusion",
          placeholder: "Resume lo aprendido y sugiere aplicaciones..."
        }
      ]
    }
  },
  {
    id: "listicle",
    name: "Formato Lista Top 10",
    description: "Ideal para videos de ranking y listas de ítems",
    structure: {
      sections: [
        {
          title: "Introducción",
          type: "intro",
          placeholder: "Introduce el tema y explica los criterios de la lista..."
        },
        {
          title: "Ítem #10",
          type: "main",
          placeholder: "Describe el décimo elemento de la lista..."
        },
        {
          title: "Ítem #9",
          type: "main",
          placeholder: "Describe el noveno elemento de la lista..."
        },
        {
          title: "Ítem #8",
          type: "main",
          placeholder: "Describe el octavo elemento de la lista..."
        },
        {
          title: "Ítem #7",
          type: "main",
          placeholder: "Describe el séptimo elemento de la lista..."
        },
        {
          title: "Ítem #6",
          type: "main",
          placeholder: "Describe el sexto elemento de la lista..."
        },
        {
          title: "Ítem #5",
          type: "main",
          placeholder: "Describe el quinto elemento de la lista..."
        },
        {
          title: "Ítem #4",
          type: "main",
          placeholder: "Describe el cuarto elemento de la lista..."
        },
        {
          title: "Ítem #3",
          type: "main",
          placeholder: "Describe el tercer elemento de la lista..."
        },
        {
          title: "Ítem #2",
          type: "main",
          placeholder: "Describe el segundo elemento de la lista..."
        },
        {
          title: "Ítem #1",
          type: "main",
          placeholder: "Describe el primer elemento de la lista (el mejor)..."
        },
        {
          title: "Conclusión",
          type: "conclusion",
          placeholder: "Resume la lista y pide opiniones a los espectadores..."
        }
      ]
    }
  },
  {
    id: "review",
    name: "Reseña de Producto",
    description: "Estructura para reseñas detalladas de productos o servicios",
    structure: {
      sections: [
        {
          title: "Introducción",
          type: "intro",
          placeholder: "Presenta el producto y por qué lo estás reseñando..."
        },
        {
          title: "Especificaciones",
          type: "custom",
          placeholder: "Detalla las características técnicas o especificaciones..."
        },
        {
          title: "Lo Bueno",
          type: "main",
          placeholder: "Describe los aspectos positivos del producto..."
        },
        {
          title: "Lo Malo",
          type: "main",
          placeholder: "Menciona los puntos negativos o áreas de mejora..."
        },
        {
          title: "Comparación",
          type: "main",
          placeholder: "Compara con productos similares en el mercado..."
        },
        {
          title: "Veredicto Final",
          type: "conclusion",
          placeholder: "Da tu opinión final y recomendación..."
        }
      ]
    }
  }
];

const ScriptEditor = () => {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Estado para el script actual
  const [script, setScript] = useState<Script>({
    id: 0,
    title: "Nuevo Guión",
    tags: [],
    sections: [],
    collectionId: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  // Estado para la sección actualmente seleccionada
  const [activeSection, setActiveSection] = useState<string | null>(null);
  
  // Estado para diálogos
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Estados para el análisis de estructura
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  
  // Estado para colecciones de guiones
  const [collections, setCollections] = useState<Array<{id: number, name: string}>>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number>(0);
  
  // Cargar colecciones de guiones
  const { data: collectionsData, isLoading: loadingCollections } = useQuery({
    queryKey: ['/api/script-collections'],
    enabled: !!user,
  });
  
  // Cargar un guión específico si se proporciona ID
  const { data: scriptData, isLoading: loadingScript } = useQuery({
    queryKey: [`/api/scripts/${id}`],
    enabled: !!id && !!user,
  });
  
  // Mutación para guardar el guión
  const saveMutation = useMutation({
    mutationFn: async (scriptData: any) => {
      const endpoint = script.id 
        ? `/api/scripts/${script.id}`
        : `/api/script-collections/${selectedCollectionId}/scripts`;
      
      const method = script.id ? "PUT" : "POST";
      const res = await apiRequest(method, endpoint, scriptData);
      
      if (!res.ok) {
        throw new Error("Error al guardar el guión");
      }
      
      return await res.json();
    },
    onSuccess: (savedScript) => {
      // Actualizar estado local con el guión guardado
      setScript(savedScript);
      
      // Si es nuevo guión, navegar a la URL con ID
      if (!script.id && savedScript.id) {
        navigate(`/script-editor/${savedScript.id}`);
      }
      
      toast({
        title: "Guión guardado",
        description: "El guión se ha guardado correctamente",
      });
      
      // Invalidar consultas relacionadas
      queryClient.invalidateQueries({ queryKey: ['/api/script-collections'] });
      
      setShowSaveDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo guardar el guión: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Mutación para eliminar el guión
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!script.id) return;
      
      const res = await apiRequest("DELETE", `/api/scripts/${script.id}`);
      
      if (!res.ok) {
        throw new Error("Error al eliminar el guión");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Guión eliminado",
        description: "El guión se ha eliminado correctamente",
      });
      
      // Invalidar consultas relacionadas
      queryClient.invalidateQueries({ queryKey: ['/api/script-collections'] });
      
      // Navegar a la lista de guiones
      navigate('/mis-guiones');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo eliminar el guión: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Inicializar script desde datos cargados
  useEffect(() => {
    if (scriptData) {
      setScript(scriptData);
      setSelectedCollectionId(scriptData.collectionId);
      
      // Seleccionar primera sección si existe
      if (scriptData.sections && scriptData.sections.length > 0) {
        setActiveSection(scriptData.sections[0].id);
      }
    }
  }, [scriptData]);
  
  // Inicializar colecciones desde datos cargados
  useEffect(() => {
    if (collectionsData) {
      setCollections(collectionsData);
      
      // Seleccionar primera colección por defecto si no hay nada seleccionado
      if (!selectedCollectionId && collectionsData.length > 0) {
        setSelectedCollectionId(collectionsData[0].id);
      }
    }
  }, [collectionsData, selectedCollectionId]);
  
  // Función para generar un ID único para secciones
  const generateSectionId = () => {
    return `section-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  };
  
  // Función para aplicar una plantilla
  const applyTemplate = (templateId: string) => {
    const template = SCRIPT_TEMPLATES.find(t => t.id === templateId);
    
    if (!template) return;
    
    // Crear secciones basadas en la plantilla
    const sections = template.structure.sections.map(section => ({
      id: generateSectionId(),
      title: section.title,
      content: section.placeholder,
      type: section.type as any,
      duration: "00:00"
    }));
    
    // Actualizar script con la plantilla
    setScript(prev => ({
      ...prev,
      sections
    }));
    
    // Seleccionar primera sección
    if (sections.length > 0) {
      setActiveSection(sections[0].id);
    }
    
    setShowTemplateDialog(false);
    
    toast({
      title: "Plantilla aplicada",
      description: `Se ha aplicado la plantilla "${template.name}"`,
    });
  };
  
  // Función para actualizar el contenido de una sección
  const updateSectionContent = (sectionId: string, content: string) => {
    setScript(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId ? { ...section, content } : section
      )
    }));
  };
  
  // Función para actualizar el título de una sección
  const updateSectionTitle = (sectionId: string, title: string) => {
    setScript(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId ? { ...section, title } : section
      )
    }));
  };
  
  // Función para actualizar la duración de una sección
  const updateSectionDuration = (sectionId: string, duration: string) => {
    setScript(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId ? { ...section, duration } : section
      ),
    }));
    
    // Actualizar duración total
    calculateTotalDuration();
  };
  
  // Función para calcular la duración total
  const calculateTotalDuration = () => {
    // Suma todas las duraciones en segundos
    let totalSeconds = 0;
    
    script.sections.forEach(section => {
      if (section.duration) {
        const [minutes, seconds] = section.duration.split(':').map(Number);
        totalSeconds += (minutes * 60) + seconds;
      }
    });
    
    // Convertir de nuevo a formato MM:SS
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    const formattedDuration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    setScript(prev => ({
      ...prev,
      totalDuration: formattedDuration
    }));
  };
  
  // Función para añadir una nueva sección
  const addSection = () => {
    const newSection: ScriptSection = {
      id: generateSectionId(),
      title: "Nueva Sección",
      content: "",
      type: "custom",
      duration: "00:00"
    };
    
    setScript(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
    
    // Seleccionar la nueva sección
    setActiveSection(newSection.id);
  };
  
  // Función para eliminar una sección
  const deleteSection = (sectionId: string) => {
    // Confirmar eliminación
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta sección?")) {
      return;
    }
    
    setScript(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId)
    }));
    
    // Si es la sección activa, seleccionar otra
    if (activeSection === sectionId) {
      const remainingSections = script.sections.filter(s => s.id !== sectionId);
      if (remainingSections.length > 0) {
        setActiveSection(remainingSections[0].id);
      } else {
        setActiveSection(null);
      }
    }
  };
  
  // Función para mover una sección hacia arriba o abajo
  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    const sectionIndex = script.sections.findIndex(s => s.id === sectionId);
    
    if (sectionIndex === -1) return;
    
    if (direction === 'up' && sectionIndex === 0) return;
    if (direction === 'down' && sectionIndex === script.sections.length - 1) return;
    
    const newSections = [...script.sections];
    const targetIndex = direction === 'up' ? sectionIndex - 1 : sectionIndex + 1;
    
    // Intercambiar posiciones
    [newSections[sectionIndex], newSections[targetIndex]] = 
      [newSections[targetIndex], newSections[sectionIndex]];
    
    setScript(prev => ({
      ...prev,
      sections: newSections
    }));
  };
  
  // Función para analizar la estructura del guión
  const analyzeScript = async () => {
    setAnalyzing(true);
    
    try {
      // Preparar texto completo del guión
      const fullScript = script.sections.map(section => 
        `${section.title}:\n${section.content}`
      ).join('\n\n');
      
      // Llamar a la API para análisis
      const response = await apiRequest('POST', '/api/ai-assist', {
        prompt: "Analiza este guión de video y proporciona retroalimentación sobre su estructura, coherencia, y efectividad. Identifica fortalezas y áreas de mejora. Incluye sugerencias específicas para mejorar la introducción, desarrollo y conclusión. Proporciona también una estimación del tiempo aproximado para cada sección basada en el contenido.",
        content: fullScript
      });
      
      if (!response.ok) {
        throw new Error("Error al analizar el guión");
      }
      
      const result = await response.json();
      setAnalysisResult(result.content);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo analizar el guión",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };
  
  // Función para guardar el guión
  const saveScript = () => {
    // Si no hay colección seleccionada, mostrar el diálogo de guardar
    if (!selectedCollectionId) {
      setShowSaveDialog(true);
      return;
    }
    
    // Preparar datos para guardar
    const scriptToSave = {
      ...script,
      collectionId: selectedCollectionId
    };
    
    // Guardar el guión
    saveMutation.mutate(scriptToSave);
  };
  
  // Función para exportar el guión como texto
  const exportAsText = () => {
    // Generar texto del guión
    const scriptText = script.sections.map(section => 
      `${section.title.toUpperCase()}\n${section.duration ? `[Duración estimada: ${section.duration}]\n` : ''}${section.content}`
    ).join('\n\n');
    
    // Crear un blob y descargarlo
    const blob = new Blob([scriptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${script.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Renderizar sección activa
  const renderActiveSection = () => {
    if (!activeSection) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <FileText className="w-12 h-12 mb-4" />
          <p>Selecciona una sección del guión o crea una nueva</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setShowTemplateDialog(true)}
          >
            Usar plantilla
          </Button>
        </div>
      );
    }
    
    const section = script.sections.find(s => s.id === activeSection);
    
    if (!section) return null;
    
    return (
      <div className="space-y-4 h-full flex flex-col">
        <div className="flex items-center gap-2">
          <Input
            value={section.title}
            onChange={e => updateSectionTitle(section.id, e.target.value)}
            className="text-lg font-semibold"
            placeholder="Título de la sección"
          />
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Input 
              type="text"
              placeholder="MM:SS"
              value={section.duration || "00:00"}
              onChange={e => updateSectionDuration(section.id, e.target.value)}
              className="w-20 text-xs"
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-2">
          <Badge variant={section.type === "intro" ? "default" : "outline"}>
            Introducción
          </Badge>
          <Badge variant={section.type === "main" ? "default" : "outline"}>
            Desarrollo
          </Badge>
          <Badge variant={section.type === "conclusion" ? "default" : "outline"}>
            Conclusión
          </Badge>
          <Badge variant={section.type === "custom" ? "default" : "outline"}>
            Personalizado
          </Badge>
        </div>
        
        <div className="border-b pb-2 flex items-center gap-1">
          <Button variant="ghost" size="icon" title="Negrita">
            <Bold className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Cursiva">
            <Italic className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Subrayado">
            <Underline className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Button variant="ghost" size="icon" title="Alinear a la izquierda">
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Centrar">
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Alinear a la derecha">
            <AlignRight className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Button variant="ghost" size="icon" title="Lista numerada">
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Lista con viñetas">
            <ListBullet className="h-4 w-4" />
          </Button>
        </div>
        
        <Textarea
          value={section.content}
          onChange={e => updateSectionContent(section.id, e.target.value)}
          placeholder="Escribe el contenido de esta sección..."
          className="flex-1 min-h-[300px] font-mono text-sm"
        />
      </div>
    );
  };
  
  // Verificar si hay guiones
  const hasScript = script.sections.length > 0;
  
  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/mis-guiones")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div>
            <Input
              value={script.title}
              onChange={e => setScript({...script, title: e.target.value})}
              className="text-2xl font-bold mb-1"
              placeholder="Título del guión"
            />
            
            {script.totalDuration && (
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Duración total estimada: {script.totalDuration}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {loadingScript && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          
          <Select
            value={selectedCollectionId?.toString() || ""}
            onValueChange={(value) => setSelectedCollectionId(parseInt(value))}
            disabled={loadingCollections}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Seleccionar colección" />
            </SelectTrigger>
            <SelectContent>
              {collections.map(collection => (
                <SelectItem 
                  key={collection.id} 
                  value={collection.id.toString()}
                >
                  {collection.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setShowTemplateDialog(true)}
                  disabled={hasScript}
                >
                  <FileText className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Usar plantilla</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setShowAnalysisDialog(true)}
                  disabled={!hasScript}
                >
                  <FileQuestion className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Analizar guión</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={exportAsText}
                  disabled={!hasScript}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Exportar como texto</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button
            onClick={saveScript}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar
          </Button>
          
          {script.id > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="destructive" 
                    size="icon"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Eliminar guión</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-200px)]">
        {/* Panel lateral izquierdo */}
        <div className="col-span-3 border rounded-lg">
          <div className="p-3 border-b flex items-center justify-between">
            <h3 className="font-medium">Secciones</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={addSection}
            >
              <Plus className="h-4 w-4 mr-1" />
              Añadir
            </Button>
          </div>
          
          <div className="p-2 space-y-2 overflow-auto max-h-[calc(100vh-250px)]">
            {script.sections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm">
                <FileText className="h-8 w-8 mb-2" />
                <p>No hay secciones</p>
                <p className="text-xs">Crea una nueva sección o usa una plantilla</p>
              </div>
            ) : (
              script.sections.map((section, index) => (
                <div 
                  key={section.id}
                  className={`
                    p-2 rounded-md cursor-pointer 
                    ${activeSection === section.id ? 'bg-muted' : 'hover:bg-muted/50'}
                  `}
                  onClick={() => setActiveSection(section.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">
                      {section.title || "Sin título"}
                    </span>
                    
                    <div className="flex items-center gap-1">
                      {section.duration && (
                        <span className="text-xs text-muted-foreground">
                          {section.duration}
                        </span>
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => moveSection(section.id, 'up')} disabled={index === 0}>
                            Mover arriba
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => moveSection(section.id, 'down')} disabled={index === script.sections.length - 1}>
                            Mover abajo
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => deleteSection(section.id)} className="text-red-500">
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground truncate mt-1">
                    {section.content ? 
                      section.content.substring(0, 50) + (section.content.length > 50 ? '...' : '') 
                      : 'Sin contenido'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Editor principal */}
        <div className="col-span-9 border rounded-lg p-4">
          {renderActiveSection()}
        </div>
      </div>
      
      {/* Diálogo de plantillas */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Seleccionar plantilla</DialogTitle>
            <DialogDescription>
              Elige una plantilla para tu guión o empieza desde cero
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            {SCRIPT_TEMPLATES.map(template => (
              <Card 
                key={template.id}
                className="cursor-pointer hover:border-primary"
                onClick={() => applyTemplate(template.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">
                    <p>Secciones: {template.structure.sections.length}</p>
                    <p className="mt-1">Incluye: {template.structure.sections.slice(0, 3).map(s => s.title).join(', ')}
                      {template.structure.sections.length > 3 && '...'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                setScript(prev => ({
                  ...prev,
                  sections: [{
                    id: generateSectionId(),
                    title: "Nueva Sección",
                    content: "",
                    type: "custom",
                    duration: "00:00"
                  }]
                }));
                setActiveSection(generateSectionId());
                setShowTemplateDialog(false);
              }}
            >
              Empezar desde cero
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de análisis */}
      <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Análisis de guión</DialogTitle>
            <DialogDescription>
              Análisis de estructura, coherencia y efectividad del guión
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {analyzing ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Analizando guión...</p>
              </div>
            ) : analysisResult ? (
              <div className="whitespace-pre-wrap">
                {analysisResult}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileQuestion className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p>Haga clic en "Analizar" para obtener un análisis detallado del guión</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAnalysisDialog(false)}>
              Cerrar
            </Button>
            <Button 
              onClick={analyzeScript}
              disabled={analyzing || !hasScript}
            >
              {analyzing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Analizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de eliminar */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar guión</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar este guión? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScriptEditor;