import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { VIDEO_CATEGORIES, VIDEO_SUBCATEGORIES, VIDEO_LENGTHS, TEMPLATE_STYLES, CONTENT_TONES } from "@/lib/utils";
import { generateVideoIdea, generateWeeklyIdeas, generateMonthlyIdeas, VideoIdeaContent } from "@/lib/openai";
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
  onIdeaGenerated: (idea: VideoIdeaContent) => void;
  isGenerating: boolean;
  setIsGenerating: (isGenerating: boolean) => void;
  user: User | null;
}

export default function Generator({ onIdeaGenerated, isGenerating, setIsGenerating, user }: GeneratorProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('single');
  const [weeklyResult, setWeeklyResult] = useState<{message: string, count: number, ideas: any[]} | null>(null);
  const [monthlyResult, setMonthlyResult] = useState<{message: string, count: number, ideas: any[]} | null>(null);
  
  const [formData, setFormData] = useState<GenerationRequest>({
    category: VIDEO_CATEGORIES[0],
    subcategory: VIDEO_SUBCATEGORIES[VIDEO_CATEGORIES[0]][0],
    videoFocus: "",
    videoLength: VIDEO_LENGTHS[0],
    templateStyle: TEMPLATE_STYLES[0],
    contentTone: CONTENT_TONES[0],
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
      category: VIDEO_CATEGORIES[0],
      subcategory: VIDEO_SUBCATEGORIES[VIDEO_CATEGORIES[0]][0],
      videoFocus: "",
      videoLength: VIDEO_LENGTHS[0],
      templateStyle: TEMPLATE_STYLES[0],
      contentTone: CONTENT_TONES[0],
    });
  };

  const handleChange = (name: keyof GenerationRequest, value: string) => {
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
      onIdeaGenerated(generatedIdea);
      
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
        onIdeaGenerated(result.ideas[0]);
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
        onIdeaGenerated(result.ideas[0]);
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
    <section id="generator" className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase font-heading">Generator</h2>
          <p className="mt-2 text-3xl leading-8 font-bold tracking-tight text-ytdark sm:text-4xl font-heading">
            Create Engaging YouTube Video Ideas
          </p>
          <p className="mt-4 max-w-2xl text-xl text-ytgray lg:mx-auto">
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
                      <Label htmlFor="category">Channel Type</Label>
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
            <div className="mt-6">
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-4">
                    {weeklyResult ? "Plan Semanal de Contenido" : "Plan Mensual de Contenido"}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(weeklyResult?.ideas || monthlyResult?.ideas)?.map((idea, index) => (
                      <div key={index} className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                        onClick={() => onIdeaGenerated(idea)}>
                        <p className="font-medium text-primary">Día {index + 1}</p>
                        <h4 className="font-semibold">{idea.title}</h4>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
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
