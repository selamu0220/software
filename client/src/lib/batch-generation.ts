import { apiRequest, queryClient } from "./queryClient";
import { VideoIdeaContent } from "./openai";
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

export type TimeframeType = 'single' | 'week' | 'month';
export type ContentPillarType = 'ways_of_action' | 'awareness_expansion' | 'narrative' | 'attractor' | 'nurture';
export type GenerationStrategyType = 'random' | 'thesis';

export interface BatchGenerationParams {
  timeframe: TimeframeType;
  startDate: Date;
  contentType: 'idea' | 'keypoints' | 'fullScript';
  strategy: GenerationStrategyType;
  contentPillar?: ContentPillarType;
  geminiApiKey?: string;
  openaiApiKey?: string;
  xaiApiKey?: string;
}

export interface BatchProgress {
  current: number;
  total: number;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  message?: string;
  error?: string;
}

// Contenido específico para cada pilar de Personal Brand Thesis
const pillarContentFocus = {
  ways_of_action: {
    focus: "contenido práctico y aplicable inmediatamente",
    style: "tutorial, guía paso a paso, demostración práctica",
    examples: ["Cómo hacer...", "5 pasos para...", "Guía práctica de..."]
  },
  awareness_expansion: {
    focus: "desafiar el pensamiento convencional y expandir la mentalidad",
    style: "explicativo, debate, presentación de ideas contraintuitivas",
    examples: ["Por qué [idea común] está equivocada", "La verdad sobre...", "Lo que nadie te dice sobre..."]
  },
  narrative: {
    focus: "historias personales y experiencias de vida",
    style: "storytelling, anécdotas, recuento de experiencias",
    examples: ["Mi experiencia con...", "Cómo superé...", "Lo que aprendí cuando..."]
  },
  attractor: {
    focus: "atraer nuevas personas con contenido de alto impacto",
    style: "entretenido, sorprendente, llamativo",
    examples: ["10 formas increíbles de...", "El secreto que cambiará tu...", "Esto te sorprenderá..."]
  },
  nurture: {
    focus: "construir una conexión más profunda con la audiencia",
    style: "reflexivo, transparente, detrás de cámaras",
    examples: ["Un día en mi vida...", "Lo que no te mostré...", "Pensamientos sobre..."]
  }
};

/**
 * Obtiene un conjunto de fechas para el timeframe seleccionado
 */
export function getDatesForTimeframe(startDate: Date, timeframe: TimeframeType): Date[] {
  if (timeframe === 'single') {
    return [startDate];
  } else if (timeframe === 'week') {
    const start = startOfWeek(startDate, { locale: es });
    const end = endOfWeek(startDate, { locale: es });
    return eachDayOfInterval({ start, end });
  } else if (timeframe === 'month') {
    const start = startOfMonth(startDate);
    const end = endOfMonth(startDate);
    return eachDayOfInterval({ start, end });
  }
  return [startDate];
}

/**
 * Determina el color para el pilar de contenido seleccionado
 */
export function getColorForPillar(pillar?: ContentPillarType): string {
  switch(pillar) {
    case 'ways_of_action': return '#3b82f6'; // blue
    case 'awareness_expansion': return '#9333ea'; // purple
    case 'narrative': return '#d97706'; // amber
    case 'attractor': return '#16a34a'; // green
    case 'nurture': return '#dc2626'; // red
    default: return '#4f46e5'; // indigo (default)
  }
}

/**
 * Genera un batch de ideas de video para las fechas seleccionadas
 */
export async function generateBatch(
  params: BatchGenerationParams, 
  onProgress: (progress: BatchProgress) => void
): Promise<boolean> {
  try {
    const dates = getDatesForTimeframe(params.startDate, params.timeframe);
    
    onProgress({ 
      current: 0, 
      total: dates.length, 
      status: 'generating',
      message: `Generando ${dates.length} ideas para ${params.timeframe === 'week' ? 'la semana' : 'el mes'}`
    });
    
    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      
      // Actualizar progreso
      onProgress({ 
        current: i + 1, 
        total: dates.length, 
        status: 'generating',
        message: `Generando idea ${i + 1} de ${dates.length}` 
      });
      
      // Determinar qué pilar de contenido usar para esta fecha
      // Si la estrategia es 'thesis', vamos rotando entre los pilares
      // Si es 'random', no usamos pilares específicos
      let pillarToUse: ContentPillarType | undefined = undefined;
      
      if (params.strategy === 'thesis') {
        const pillarValues: ContentPillarType[] = [
          'ways_of_action', 
          'awareness_expansion', 
          'narrative', 
          'attractor', 
          'nurture'
        ];
        
        // Asignar pilar específico o rotar entre pilares
        if (params.contentPillar) {
          pillarToUse = params.contentPillar;
        } else {
          // Rotar pilares por día de la semana (0-4 para los 5 pilares)
          pillarToUse = pillarValues[i % 5];
        }
      }
      
      // Configurar los parámetros de generación específicos para este día
      // Dependiendo del pilar, ajustamos el enfoque y el estilo
      let categoryParam = "contenido digital";
      let subcategoryParam = "YouTube";
      let videoFocusParam = "informativo";
      let contentToneParam = "profesional";
      
      if (pillarToUse) {
        const pillarInfo = pillarContentFocus[pillarToUse];
        videoFocusParam = pillarInfo.focus;
        contentToneParam = pillarInfo.style.split(',')[0];
      }
      
      // Configurar solicitud de generación
      const generationParams = {
        category: categoryParam,
        subcategory: subcategoryParam,
        videoFocus: videoFocusParam,
        videoLength: "medio", // Por defecto videos medianos
        templateStyle: "numerado", // Por defecto estilo numerado
        contentTone: contentToneParam,
        contentType: params.contentType,
        timingDetail: params.contentType === 'fullScript', // Incluir tiempos si es script completo
        useSubcategory: true,
        date: date.toISOString(),
        contentPillar: pillarToUse,
        geminiApiKey: params.geminiApiKey
      };
      
      try {
        // Realizar la solicitud de generación a la API
        const response = await apiRequest("POST", "/api/generate-idea-batch", generationParams);
        
        if (!response.ok) {
          throw new Error(`Error en generación de idea ${i + 1}: ${response.statusText}`);
        }
        
        // Esperar un tiempo entre solicitudes para no sobrecargar la API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error en generación para ${format(date, 'dd/MM/yyyy')}:`, error);
        onProgress({ 
          current: i + 1, 
          total: dates.length, 
          status: 'failed',
          error: `Error al generar idea para ${format(date, 'dd/MM/yyyy')}`
        });
        return false;
      }
    }
    
    // Invalidar consultas de calendario
    queryClient.invalidateQueries({ queryKey: ['/api/calendar'] });
    queryClient.invalidateQueries({ queryKey: ['/api/calendar/month'] });
    
    // Proceso completado con éxito
    onProgress({ 
      current: dates.length, 
      total: dates.length, 
      status: 'completed',
      message: `Se han generado ${dates.length} ideas exitosamente`
    });
    
    return true;
  } catch (error) {
    console.error("Error en proceso de generación por lotes:", error);
    onProgress({ 
      current: 0, 
      total: 0, 
      status: 'failed',
      error: `Error en el proceso de generación: ${error instanceof Error ? error.message : String(error)}`
    });
    return false;
  }
}