import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Video, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { VideoIdeaContent, generateVideoIdea } from "@/lib/openai";
import { format } from "date-fns";

interface SimpleGeneratorProps {
  onIdeaGenerated?: (idea: VideoIdeaContent) => void;
  onAddToCalendar?: (idea: VideoIdeaContent, date: Date) => void;
  selectedDate?: Date;
}

export default function SimpleGenerator({ 
  onIdeaGenerated, 
  onAddToCalendar,
  selectedDate = new Date()
}: SimpleGeneratorProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedIdea, setGeneratedIdea] = useState<VideoIdeaContent | null>(null);
  
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
  
  const [category, setCategory] = useState(categories[0].value);
  const [videoLength, setVideoLength] = useState("corto");
  
  const generateIdea = async () => {
    setIsGenerating(true);
    
    try {
      // Utilizamos la función importada para mejor tipado y manejo de errores
      const params = {
        category: category,
        subcategory: "",
        videoLength: videoLength,
        keywords: "",
        tone: "informativo",
        includeOutro: true,
        includeMidRoll: true,
        outroType: "suscripción",
        geminiApiKey: "",
      };
      
      const data = await generateVideoIdea(params);
      setGeneratedIdea(data);
      
      if (onIdeaGenerated) {
        onIdeaGenerated(data);
      }
      
      toast({
        title: "Idea generada",
        description: "Se ha generado una nueva idea para tu video",
      });
    } catch (error) {
      console.error("Error generating idea:", error);
      
      // Manejo específico para cuando se alcanza el límite diario gratuito
      if (error instanceof Error && error.message === "DAILY_LIMIT_REACHED") {
        toast({
          title: "Límite diario alcanzado",
          description: "Has alcanzado el límite diario de ideas gratuitas. Actualiza a premium para generar más ideas.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo generar la idea. Por favor verifica la configuración de la API.",
          variant: "destructive",
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };
  
  const addIdeaToCalendar = () => {
    if (!generatedIdea || !onAddToCalendar) return;
    
    onAddToCalendar(generatedIdea, selectedDate);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Generador Rápido de Ideas</CardTitle>
        <CardDescription>
          Genera ideas para videos rápidamente seleccionando una categoría
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Categoría</label>
            <Select 
              value={category} 
              onValueChange={setCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Duración del Video</label>
            <Select 
              value={videoLength} 
              onValueChange={setVideoLength}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una duración" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="corto">Corto (menos de 5 min)</SelectItem>
                <SelectItem value="medio">Medio (5-15 min)</SelectItem>
                <SelectItem value="largo">Largo (más de 15 min)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-center mt-4">
          <Button 
            onClick={generateIdea}
            disabled={isGenerating}
            className="w-full max-w-sm"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Video className="h-4 w-4 mr-2" />
                Generar Idea de Video
              </>
            )}
          </Button>
        </div>
      </CardContent>
      
      {generatedIdea && (
        <CardFooter className="flex flex-col items-start border-t pt-4">
          <h3 className="font-bold mb-2">{generatedIdea.title}</h3>
          <ul className="text-sm mb-4 space-y-1 w-full">
            {generatedIdea.outline.map((point, i) => (
              <li key={i} className="flex items-start">
                <span className="text-primary font-bold mr-2">{i + 1}.</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
          
          <div className="w-full flex justify-between mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={addIdeaToCalendar}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Añadir al {format(selectedDate, "dd/MM/yyyy")}
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}