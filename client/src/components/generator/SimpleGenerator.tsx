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
  
  // Categorías principales
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
    { value: "ciencia", label: "Ciencia y Conocimiento" },
    { value: "historia", label: "Historia" },
    { value: "música", label: "Música" },
    { value: "cine", label: "Cine y Series" },
    { value: "libros", label: "Literatura y Libros" },
    { value: "moda", label: "Moda y Estilo" },
    { value: "arquitectura", label: "Arquitectura y Diseño" },
    { value: "psicología", label: "Psicología" },
    { value: "filosofía", label: "Filosofía" },
    { value: "espiritualidad", label: "Espiritualidad" },
    { value: "emprendimiento", label: "Emprendimiento" },
    { value: "idiomas", label: "Idiomas y Lenguaje" },
    { value: "sostenibilidad", label: "Sostenibilidad y Medio Ambiente" },
    { value: "parentalidad", label: "Parentalidad y Familia" },
    { value: "belleza", label: "Belleza" },
    { value: "jardinería", label: "Jardinería" },
  ];

  // Subcategorías de tecnología
  const techSubcategories = [
    { value: "gadgets", label: "Gadgets y Dispositivos" },
    { value: "software", label: "Software y Apps" },
    { value: "ia", label: "Inteligencia Artificial" },
    { value: "programacion", label: "Programación" },
    { value: "seguridad", label: "Ciberseguridad" },
    { value: "gaming", label: "Gaming y E-sports" },
    { value: "hardware", label: "Hardware y PCs" },
    { value: "moviles", label: "Smartphones y Móviles" },
    { value: "redes", label: "Redes Sociales" },
    { value: "blockchain", label: "Blockchain y Cripto" },
    { value: "robotica", label: "Robótica" },
    { value: "realidad_virtual", label: "Realidad Virtual y Aumentada" },
    { value: "diseno", label: "Diseño y Creatividad Digital" },
    { value: "tutoriales", label: "Tutoriales Técnicos" },
    { value: "tendencias", label: "Tendencias Tecnológicas" },
  ];

  // Subcategorías de marketing
  const marketingSubcategories = [
    { value: "social_media", label: "Social Media Marketing" },
    { value: "seo", label: "SEO y Posicionamiento" },
    { value: "paid_ads", label: "Publicidad de Pago" },
    { value: "content", label: "Marketing de Contenidos" },
    { value: "email", label: "Email Marketing" },
    { value: "branding", label: "Branding y Marca Personal" },
    { value: "copywriting", label: "Copywriting" },
    { value: "storytelling", label: "Storytelling" },
    { value: "analytics", label: "Analítica y Datos" },
    { value: "conversiones", label: "Optimización de Conversiones" },
    { value: "tendencias", label: "Tendencias de Marketing" },
    { value: "automatizacion", label: "Automatización de Marketing" },
    { value: "videos", label: "Video Marketing" },
    { value: "voz", label: "Marketing de Voz" },
    { value: "influencers", label: "Marketing con Influencers" },
  ];

  // Estilos de contenido
  const contentStyles = [
    { value: "educativo", label: "Educativo" },
    { value: "tutorial", label: "Tutorial Paso a Paso" },
    { value: "inspiracional", label: "Inspiracional" },
    { value: "entretenimiento", label: "Entretenimiento" },
    { value: "debate", label: "Debate/Opinión" },
    { value: "storytelling", label: "Storytelling" },
    { value: "informativo", label: "Informativo/Noticias" },
    { value: "reseña", label: "Reseña/Review" },
    { value: "entrevista", label: "Entrevista" },
    { value: "reacción", label: "Reacción" },
    { value: "lista", label: "Lista Top-N" },
    { value: "challenge", label: "Desafío/Challenge" },
    { value: "detrás_escenas", label: "Detrás de Escenas" },
    { value: "misterio", label: "Misterio/Intriga" },
    { value: "caso_estudio", label: "Caso de Estudio" },
  ];

  // Tonos de contenido
  const contentTones = [
    { value: "profesional", label: "Profesional/Serio" },
    { value: "casual", label: "Casual/Conversacional" },
    { value: "humorístico", label: "Humorístico" },
    { value: "motivacional", label: "Motivacional" },
    { value: "informativo", label: "Informativo/Neutro" },
    { value: "provocativo", label: "Provocativo" },
    { value: "misterioso", label: "Misterioso" },
    { value: "nostálgico", label: "Nostálgico" },
    { value: "autoritativo", label: "Autoritativo/Experto" },
    { value: "amigable", label: "Amigable/Cercano" },
    { value: "dramático", label: "Dramático" },
    { value: "inspirador", label: "Inspirador" },
    { value: "emocional", label: "Emocional" },
    { value: "analítico", label: "Analítico" },
    { value: "reflexivo", label: "Reflexivo" },
  ];

  // Formatos de video
  const videoFormats = [
    { value: "sin_rostro", label: "Sin Mostrar Rostro" },
    { value: "facecam", label: "Con Cámara Frontal" },
    { value: "screen_recording", label: "Grabación de Pantalla" },
    { value: "animacion", label: "Animado" },
    { value: "presentacion", label: "Presentación" },
    { value: "entrevista", label: "Entrevista" },
    { value: "documental", label: "Estilo Documental" },
    { value: "vlog", label: "Vlog" },
    { value: "narrado", label: "Narrado con Voz en Off" },
    { value: "hybrid", label: "Híbrido" },
  ];

  // Hooks para todos los parámetros
  const [category, setCategory] = useState(categories[0].value);
  const [subcategory, setSubcategory] = useState("");
  const [videoLength, setVideoLength] = useState("corto");
  const [contentStyle, setContentStyle] = useState("educativo");
  const [contentTone, setContentTone] = useState("profesional");
  const [videoFormat, setVideoFormat] = useState("sin_rostro");
  const [contentType, setContentType] = useState("idea");
  const [useAdvancedOptions, setUseAdvancedOptions] = useState(false);
  const [timingDetail, setTimingDetail] = useState(false);
  const [specificTarget, setSpecificTarget] = useState("");
  
  const generateIdea = async () => {
    setIsGenerating(true);
    
    try {
      // Seleccionar subcategorías según la categoría principal
      let selectedSubcategory = subcategory;
      if (category === "tecnología" && !subcategory) {
        // Si no hay subcategoría seleccionada, usar una aleatoria
        const randomIndex = Math.floor(Math.random() * techSubcategories.length);
        selectedSubcategory = techSubcategories[randomIndex].value;
      } else if (category === "marketing" && !subcategory) {
        const randomIndex = Math.floor(Math.random() * marketingSubcategories.length);
        selectedSubcategory = marketingSubcategories[randomIndex].value;
      }
      
      // Utilizamos la función importada para mejor tipado y manejo de errores
      const params = {
        category: category,
        subcategory: selectedSubcategory,
        videoFocus: specificTarget ? `Ideas para ${specificTarget}` : `Ideas para video de ${category}`,
        videoLength: videoLength,
        templateStyle: contentStyle,
        contentTone: contentTone,
        contentType: contentType as "idea" | "keypoints" | "fullScript", // Usar tipo literal para cumplir con la interfaz
        timingDetail: timingDetail,
        useSubcategory: !!selectedSubcategory,
        videoFormat: videoFormat
      };
      
      console.log("Generando idea con parámetros:", params);
      
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
          description: "No se pudo generar la idea. Intenta nuevamente más tarde.",
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
        <div className="flex items-center space-x-2 mb-4">
          <input 
            type="checkbox" 
            id="advanced-options"
            checked={useAdvancedOptions}
            onChange={(e) => setUseAdvancedOptions(e.target.checked)}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="advanced-options" className="text-sm font-medium">
            Mostrar opciones avanzadas ({useAdvancedOptions ? '100+ opciones' : 'opciones básicas'})
          </label>
        </div>
      
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
              <SelectContent className="max-h-72">
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {(category === 'tecnología' && useAdvancedOptions) && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Subcategoría de Tecnología</label>
              <Select 
                value={subcategory} 
                onValueChange={setSubcategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Subcategoría (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin subcategoría específica</SelectItem>
                  {techSubcategories.map((subcat) => (
                    <SelectItem key={subcat.value} value={subcat.value}>
                      {subcat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {(category === 'marketing' && useAdvancedOptions) && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Subcategoría de Marketing</label>
              <Select 
                value={subcategory} 
                onValueChange={setSubcategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Subcategoría (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin subcategoría específica</SelectItem>
                  {marketingSubcategories.map((subcat) => (
                    <SelectItem key={subcat.value} value={subcat.value}>
                      {subcat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
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
                {useAdvancedOptions && (
                  <>
                    <SelectItem value="muy_corto">Muy corto (menos de 60 seg)</SelectItem>
                    <SelectItem value="shorts">Shorts/Reels (15-60 seg)</SelectItem>
                    <SelectItem value="extendido">Extendido (20-30 min)</SelectItem>
                    <SelectItem value="documental">Documental (30+ min)</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          
          {useAdvancedOptions && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Contenido</label>
                <Select 
                  value={contentType} 
                  onValueChange={setContentType as (value: string) => void}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de contenido" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="idea">Solo idea</SelectItem>
                    <SelectItem value="keypoints">Puntos clave</SelectItem>
                    <SelectItem value="fullScript">Guión completo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Estilo de Contenido</label>
                <Select 
                  value={contentStyle} 
                  onValueChange={setContentStyle}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Estilo de contenido" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {contentStyles.map((style) => (
                      <SelectItem key={style.value} value={style.value}>
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Tono de Contenido</label>
                <Select 
                  value={contentTone} 
                  onValueChange={setContentTone}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tono de contenido" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {contentTones.map((tone) => (
                      <SelectItem key={tone.value} value={tone.value}>
                        {tone.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Formato de Video</label>
                <Select 
                  value={videoFormat} 
                  onValueChange={setVideoFormat}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Formato de video" />
                  </SelectTrigger>
                  <SelectContent>
                    {videoFormats.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Audiencia Específica (opcional)</label>
                <input
                  type="text"
                  value={specificTarget}
                  onChange={(e) => setSpecificTarget(e.target.value)}
                  placeholder="Ej: emprendedores, diseñadores, estudiantes..."
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              
              <div className="col-span-2 flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="timing-detail"
                  checked={timingDetail}
                  onChange={(e) => setTimingDetail(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="timing-detail" className="text-sm font-medium">
                  Incluir tiempos específicos para cada sección del guión
                </label>
              </div>
            </>
          )}
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