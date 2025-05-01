import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { VIDEO_CATEGORIES, VIDEO_SUBCATEGORIES, VIDEO_LENGTHS, TEMPLATE_STYLES, CONTENT_TONES, VIDEO_TITLE_TEMPLATES } from "@/lib/utils";
import { 
  generateVideoIdea, 
  generateWeeklyIdeas, 
  generateMonthlyIdeas, 
  VideoIdeaContent,
  MultiGenerationResponse
} from "@/lib/openai";
import { GenerationRequest } from "@shared/schema";
import { Info, RefreshCw, Calendar, Calendar1 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { User } from "@shared/schema";

interface GeneratorProps {
  onIdeaGenerated: (idea: VideoIdeaContent, params: GenerationRequest) => void;
  isGenerating: boolean;
  setIsGenerating: (isGenerating: boolean) => void;
  user: User | null;
}

export default function Generator({ onIdeaGenerated, isGenerating, setIsGenerating, user }: GeneratorProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('single');
  const [weeklyResult, setWeeklyResult] = useState<MultiGenerationResponse | null>(null);
  const [monthlyResult, setMonthlyResult] = useState<MultiGenerationResponse | null>(null);
  
  const [formData, setFormData] = useState<GenerationRequest>({
    category: VIDEO_CATEGORIES[0] || "Entertainment",
    subcategory: VIDEO_SUBCATEGORIES[VIDEO_CATEGORIES[0]]?.[0] || "General",
    videoFocus: "",
    videoLength: VIDEO_LENGTHS[0] || "10-15min",
    templateStyle: TEMPLATE_STYLES[0] || "Educational",
    contentTone: CONTENT_TONES[0] || "Informative",
    titleTemplate: VIDEO_TITLE_TEMPLATES[0] || "",
    contentType: "fullScript", // Guiones completos por defecto
    timingDetail: true, // Incluir tiempos en los guiones
    customChannelType: "", // Campo para tipo de canal personalizado
    useSubcategory: true, // Opción para usar subcategorías
    geminiApiKey: "", // API key personalizada de Gemini
  });

  // Update subcategories when category changes
  useEffect(() => {
    if (formData.category && VIDEO_SUBCATEGORIES[formData.category]) {
      setFormData((prev) => ({
        ...prev,
        subcategory: VIDEO_SUBCATEGORIES[formData.category][0],
      }));
    }
  }, [formData.category]);

  const handleReset = () => {
    setFormData({
      category: VIDEO_CATEGORIES[0] || "Entertainment",
      subcategory: VIDEO_SUBCATEGORIES[VIDEO_CATEGORIES[0]]?.[0] || "General",
      videoFocus: "",
      videoLength: VIDEO_LENGTHS[0] || "10-15min",
      templateStyle: TEMPLATE_STYLES[0] || "Educational",
      contentTone: CONTENT_TONES[0] || "Informative",
      titleTemplate: VIDEO_TITLE_TEMPLATES[0] || "",
      contentType: "fullScript", // Guiones completos por defecto
      timingDetail: true,
      customChannelType: "", // Campo para tipo de canal personalizado
      useSubcategory: true, // Opción para usar subcategorías
      geminiApiKey: "", // Mantener la API key personalizada
    });
  };

  const handleChange = (name: keyof GenerationRequest, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Validar formulario básico
  const validateForm = (): boolean => {
    if (!formData.videoFocus) {
      toast({
        title: "Video focus required",
        description: "Please enter what your video should focus on",
        variant: "destructive",
      });
      return false;
    }
    
    // Verificar que todos los campos requeridos estén presentes
    if (!formData.category || 
        (formData.useSubcategory && !formData.subcategory) || 
        (!formData.useSubcategory && !formData.customChannelType) || 
        !formData.videoLength || 
        !formData.templateStyle || 
        !formData.contentTone) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  // Generar una idea individual
  const handleSubmit = async () => {
    try {
      if (!validateForm()) {
        return;
      }
      
      setIsGenerating(true);
      
      const generatedIdea = await generateVideoIdea(formData);
      onIdeaGenerated(generatedIdea, formData);
      
      // Limpiar resultados anteriores
      setWeeklyResult(null);
      setMonthlyResult(null);
      
      // Scroll to results
      const resultsSection = document.getElementById("results");
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: "smooth" });
      }
    } catch (error: any) {
      console.error("Error generating idea:", error);
      
      if (error.message === "DAILY_LIMIT_REACHED") {
        toast({
          title: "Límite diario alcanzado",
          description: "Has alcanzado el límite diario de generación de ideas gratuitas. Suscríbete para generar más ideas.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error de generación",
          description: "No se pudo generar la idea. Por favor, intenta de nuevo.",
          variant: "destructive",
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Generar ideas para una semana
  const handleWeeklySubmit = async () => {
    try {
      if (!validateForm()) {
        return;
      }
      
      setIsGenerating(true);
      
      const result = await generateWeeklyIdeas(formData);
      
      // Limpiar resultado mensual y configurar el resultado semanal
      setMonthlyResult(null);
      setWeeklyResult(result);
      
      // Mostrar primera idea en la vista principal
      if (result.ideas && result.ideas.length > 0) {
        onIdeaGenerated(result.ideas[0], formData);
      }
      
      toast({
        title: "Plan semanal generado",
        description: `Se han generado ${result.count} ideas para tu semana de contenido.`,
      });
      
      // Scroll to results
      const resultsSection = document.getElementById("results");
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: "smooth" });
      }
    } catch (error) {
      console.error("Error generating weekly ideas:", error);
      toast({
        title: "Error de generación",
        description: "No se pudieron generar ideas semanales. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Generar ideas para un mes (sólo premium)
  const handleMonthlySubmit = async () => {
    try {
      if (!validateForm()) {
        return;
      }
      
      setIsGenerating(true);
      
      const result = await generateMonthlyIdeas(formData);
      
      // Limpiar resultado semanal y configurar el resultado mensual
      setWeeklyResult(null);
      setMonthlyResult(result);
      
      // Mostrar primera idea en la vista principal
      if (result.ideas && result.ideas.length > 0) {
        onIdeaGenerated(result.ideas[0], formData);
      }
      
      toast({
        title: "Plan mensual generado",
        description: `Se han generado ${result.count} ideas para tu mes de contenido.`,
      });
      
      // Scroll to results
      const resultsSection = document.getElementById("results");
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: "smooth" });
      }
    } catch (error: any) {
      console.error("Error generating monthly ideas:", error);
      
      if (error.message === "PREMIUM_REQUIRED") {
        toast({
          title: "Funcionalidad premium",
          description: "La generación mensual solo está disponible para usuarios premium. Suscríbete para acceder a esta función.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error de generación",
          description: "No se pudieron generar ideas mensuales. Por favor, intenta de nuevo.",
          variant: "destructive",
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section id="generator" className="py-16 bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-sm text-primary font-semibold tracking-wide uppercase font-heading">Generator</h2>
          <p className="mt-2 text-3xl leading-8 font-bold tracking-tight sm:text-4xl font-heading">
            Create Engaging YouTube Video Ideas
          </p>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground mx-auto">
            Generate one idea for free, or sign up for unlimited ideas and monthly content planning.
          </p>
        </div>

        <div className="mt-10">
          <Card>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="px-4 pt-4">
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="single">
                      Idea Diaria
                    </TabsTrigger>
                    <TabsTrigger value="weekly">
                      Plan Semanal
                    </TabsTrigger>
                    <TabsTrigger value="monthly" disabled={!user?.isPremium}>
                      Plan Mensual
                      {!user?.isPremium && (
                        <span className="ml-1 text-xs bg-primary text-white rounded-full px-1">
                          Premium
                        </span>
                      )}
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <div className="px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <div className="flex justify-between">
                        <Label htmlFor="category">Channel Type</Label>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">Usar subcategorías</span>
                          <input
                            type="checkbox"
                            id="use-subcategory"
                            checked={formData.useSubcategory}
                            onChange={(e) => handleChange("useSubcategory", e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300"
                            disabled={isGenerating}
                          />
                        </div>
                      </div>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => handleChange("category", value)}
                        disabled={isGenerating}
                      >
                        <SelectTrigger id="category" className="mt-1">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {VIDEO_CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.useSubcategory ? (
                      <div className="sm:col-span-3">
                        <Label htmlFor="subcategory">Subcategory</Label>
                        <Select
                          value={formData.subcategory}
                          onValueChange={(value) => handleChange("subcategory", value)}
                          disabled={isGenerating}
                        >
                          <SelectTrigger id="subcategory" className="mt-1">
                            <SelectValue placeholder="Select subcategory" />
                          </SelectTrigger>
                          <SelectContent>
                            {formData.category &&
                              VIDEO_SUBCATEGORIES[formData.category]?.map((subcategory) => (
                                <SelectItem key={subcategory} value={subcategory}>
                                  {subcategory}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="sm:col-span-3">
                        <Label htmlFor="custom-channel-type">Tipo de Canal Personalizado</Label>
                        <Input
                          id="custom-channel-type"
                          placeholder="Ej: Canal de reseñas de juegos"
                          value={formData.customChannelType || ""}
                          onChange={(e) => handleChange("customChannelType", e.target.value)}
                          className="mt-1"
                          disabled={isGenerating}
                        />
                      </div>
                    )}

                    <div className="sm:col-span-6">
                      <Label htmlFor="video-focus">Video Focus</Label>
                      <Input
                        id="video-focus"
                        placeholder="e.g., Video Editing, AI Tools, Web Development"
                        value={formData.videoFocus}
                        onChange={(e) => handleChange("videoFocus", e.target.value)}
                        className="mt-1"
                        disabled={isGenerating}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <Label htmlFor="video-length">Video Length</Label>
                      <Select
                        value={formData.videoLength}
                        onValueChange={(value) => handleChange("videoLength", value)}
                        disabled={isGenerating}
                      >
                        <SelectTrigger id="video-length" className="mt-1">
                          <SelectValue placeholder="Select length" />
                        </SelectTrigger>
                        <SelectContent>
                          {VIDEO_LENGTHS.map((length) => (
                            <SelectItem key={length} value={length}>
                              {length}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="sm:col-span-2">
                      <Label htmlFor="template-style">Template Style</Label>
                      <Select
                        value={formData.templateStyle}
                        onValueChange={(value) => handleChange("templateStyle", value)}
                        disabled={isGenerating}
                      >
                        <SelectTrigger id="template-style" className="mt-1">
                          <SelectValue placeholder="Select style" />
                        </SelectTrigger>
                        <SelectContent>
                          {TEMPLATE_STYLES.map((style) => (
                            <SelectItem key={style} value={style}>
                              {style}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="sm:col-span-2">
                      <Label htmlFor="content-tone">Content Tone</Label>
                      <Select
                        value={formData.contentTone}
                        onValueChange={(value) => handleChange("contentTone", value)}
                        disabled={isGenerating}
                      >
                        <SelectTrigger id="content-tone" className="mt-1">
                          <SelectValue placeholder="Select tone" />
                        </SelectTrigger>
                        <SelectContent>
                          {CONTENT_TONES.map((tone) => (
                            <SelectItem key={tone} value={tone}>
                              {tone}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="sm:col-span-6 mt-4">
                      <Label htmlFor="title-template">Plantilla de Título</Label>
                      <Select
                        value={formData.titleTemplate || ""}
                        onValueChange={(value) => handleChange("titleTemplate", value)}
                        disabled={isGenerating}
                      >
                        <SelectTrigger id="title-template" className="mt-1">
                          <SelectValue placeholder="Seleccionar plantilla de título" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {VIDEO_TITLE_TEMPLATES.map((template) => (
                            <SelectItem key={template} value={template}>
                              {template}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="mt-1 text-xs text-muted-foreground">
                        La plantilla se personalizará con el tema de tu video. Las variables como [Número], [Tema], [Acción] serán reemplazadas automáticamente.
                      </p>
                    </div>
                    
                    <div className="sm:col-span-4 mt-4">
                      <Label htmlFor="content-type">Tipo de Contenido</Label>
                      <Select
                        value={formData.contentType || "idea"}
                        onValueChange={(value) => handleChange("contentType", value as "idea" | "keypoints" | "fullScript")}
                        disabled={isGenerating}
                      >
                        <SelectTrigger id="content-type" className="mt-1">
                          <SelectValue placeholder="Seleccionar tipo de contenido" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="idea">Idea de video</SelectItem>
                          <SelectItem value="keypoints">Puntos clave (keypoints)</SelectItem>
                          <SelectItem value="fullScript">Guión completo</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Selecciona el tipo de contenido que quieres generar para tu video.
                      </p>
                    </div>

                    <div className="sm:col-span-2 mt-4">
                      <Label htmlFor="timing-detail">Incluir tiempos detallados</Label>
                      <Select
                        value={formData.timingDetail ? "true" : "false"}
                        onValueChange={(value) => handleChange("timingDetail", value === "true")}
                        disabled={isGenerating || formData.contentType === "idea"}
                      >
                        <SelectTrigger id="timing-detail" className="mt-1">
                          <SelectValue placeholder="¿Incluir tiempos?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Sí</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Incluir tiempos específicos para cada parte del guión.
                      </p>
                    </div>
                    
                    <div className="sm:col-span-6 mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="gemini-api-key">API Key de Gemini (opcional)</Label>
                        <span className="text-xs text-muted-foreground">
                          {formData.geminiApiKey ? "Configurada ✓" : "No configurada"}
                        </span>
                      </div>
                      <Input
                        id="gemini-api-key"
                        type="password"
                        placeholder="Introduce tu API Key de Gemini para usar tu propio servicio"
                        value={formData.geminiApiKey || ""}
                        onChange={(e) => handleChange("geminiApiKey", e.target.value)}
                        className="mt-1"
                        disabled={isGenerating}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Si proporcionas tu propia API Key de Gemini, se usará para las generaciones en lugar del servicio predeterminado.
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                          Obtener API Key
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="px-4 py-4 sm:px-6 flex justify-end space-x-3 border-t border-gray-200">
                  <span className="inline-flex text-xs text-ytgray items-center mr-auto">
                    <Info className="h-3 w-3 mr-1" />
                    {activeTab === 'single' && "Generate 1 idea for free without signing up"}
                    {activeTab === 'weekly' && "Generate a week of content (7 ideas)"}
                    {activeTab === 'monthly' && "Generate a month of content (30 ideas) - Premium only"}
                  </span>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={isGenerating}
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={
                      activeTab === 'single'
                        ? handleSubmit
                        : activeTab === 'weekly'
                        ? handleWeeklySubmit
                        : handleMonthlySubmit
                    }
                    disabled={isGenerating || (activeTab === 'monthly' && !user?.isPremium)}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        {activeTab === 'single' && "Generar Idea"}
                        {activeTab === 'weekly' && "Generar Plan Semanal"}
                        {activeTab === 'monthly' && "Generar Plan Mensual"}
                      </>
                    )}
                  </Button>
                </div>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Resultados de la generación semanal o mensual */}
          {(weeklyResult || monthlyResult) && (
            <div className="mt-8">
              <Card className="border border-border">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-6 font-heading">
                    {weeklyResult ? "Plan Semanal de Contenido" : "Plan Mensual de Contenido"}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(weeklyResult?.ideas || monthlyResult?.ideas)?.map((idea, index) => (
                      <div key={index} 
                           className="border border-border rounded-md p-4 hover:bg-muted/50 transition-colors cursor-pointer idea-card"
                           onClick={() => onIdeaGenerated(idea, formData)}>
                        <p className="text-xs font-medium text-primary/90 mb-1 font-mono">DÍA {index + 1}</p>
                        <h4 className="font-semibold font-heading mb-2">{idea.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {idea.outline[0]}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
