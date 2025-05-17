import { apiRequest } from "@/lib/queryClient";

// Tipos de marcos temporales para la generación por lotes
export type TimeframeType = 'single' | 'week' | 'month';
// Tipos de pilares de contenido según Personal Brand Thesis
export type ContentPillarType = 'ways_of_action' | 'awareness_expansion' | 'narrative' | 'attractor' | 'nurture';
// Tipos de estrategias de generación
export type GenerationStrategyType = 'random' | 'thesis';

// Parámetros para la generación por lotes
export interface BatchGenerationParams {
  timeframe: TimeframeType;
  startDate: Date;
  contentType: 'idea' | 'keypoints' | 'fullScript';
  strategy: GenerationStrategyType;
  contentPillar?: ContentPillarType;
  // La clave API de Gemini ahora se maneja automáticamente desde el servidor
}

// Estructura para seguimiento del progreso
export interface BatchProgress {
  current: number;
  total: number;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  message?: string;
  error?: string;
}

/**
 * Obtiene un conjunto de fechas para el timeframe seleccionado
 */
export function getDatesForTimeframe(startDate: Date, timeframe: TimeframeType): Date[] {
  const dates: Date[] = [];
  const start = new Date(startDate);
  
  // Resetear la hora para asegurarnos de que estamos en el inicio del día
  start.setHours(0, 0, 0, 0);
  
  switch (timeframe) {
    case 'single':
      // Solo una fecha (la seleccionada)
      dates.push(new Date(start));
      break;
      
    case 'week':
      // Una semana completa (7 días)
      for (let i = 0; i < 7; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        dates.push(date);
      }
      break;
      
    case 'month':
      // Un mes completo (30 días, aproximadamente)
      for (let i = 0; i < 30; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        dates.push(date);
      }
      break;
  }
  
  return dates;
}

/**
 * Determina el color para el pilar de contenido seleccionado
 */
export function getColorForPillar(pillar?: ContentPillarType): string {
  switch (pillar) {
    case 'ways_of_action':
      return "#3b82f6"; // Azul
    case 'awareness_expansion':
      return "#9333ea"; // Púrpura
    case 'narrative':
      return "#d97706"; // Ámbar
    case 'attractor':
      return "#16a34a"; // Verde
    case 'nurture':
      return "#dc2626"; // Rojo
    default:
      return "#4f46e5"; // Indigo (predeterminado)
  }
}

/**
 * Genera un batch de ideas de video para las fechas seleccionadas
 */
export async function generateBatch(
  params: BatchGenerationParams, 
  onProgress: (progress: BatchProgress) => void
): Promise<boolean> {
  const dates = getDatesForTimeframe(params.startDate, params.timeframe);
  let success = true;
  let currentItem = 0;
  
  // Notificar inicio
  onProgress({
    current: currentItem,
    total: dates.length,
    status: 'generating',
    message: 'Iniciando generación por lotes...'
  });
  
  // Determinar el patrón de pilares si se usa la estrategia thesis
  let pillarPattern: ContentPillarType[] = [];
  if (params.strategy === 'thesis' && !params.contentPillar) {
    // Si no se especifica un pilar específico, rotar entre los 5 pilares
    pillarPattern = [
      'ways_of_action',
      'awareness_expansion',
      'narrative',
      'attractor',
      'nurture'
    ];
  }
  
  // Iterar sobre cada fecha y generar el contenido
  for (let i = 0; i < dates.length; i++) {
    try {
      // Determinar el pilar para esta fecha si estamos usando thesis
      let pillar: ContentPillarType | undefined = undefined;
      
      if (params.strategy === 'thesis') {
        if (params.contentPillar) {
          // Si se especificó un pilar fijo, usarlo
          pillar = params.contentPillar;
        } else {
          // Rotar entre los pilares según el patrón
          pillar = pillarPattern[i % pillarPattern.length];
        }
      }
      
      // Actualizar progreso con el pilar actual
      onProgress({
        current: currentItem,
        total: dates.length,
        status: 'generating',
        message: `Generando idea ${i + 1} de ${dates.length}${pillar ? ` (${getPillarName(pillar)})` : ''}`
      });
      
      // Construir la solicitud de generación según los parámetros
      const requestBody = {
        date: dates[i].toISOString(),
        contentPillar: pillar,
        category: getCategoryForPillar(pillar),
        subcategory: pillar ? getSubcategoryForPillar(pillar) : "",
        videoFocus: pillar ? getFocusForPillar(pillar) : "motivacional",
        videoLength: "medio",
        templateStyle: "educativo",
        contentTone: pillar ? getToneForPillar(pillar) : "profesional",
        contentType: params.contentType,
        timingDetail: params.contentType === 'fullScript',
        useSubcategory: !!pillar
      };
      
      // Hacer la solicitud a la API
      const response = await apiRequest("POST", "/api/generate-idea-batch", requestBody);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al generar la idea');
      }
      
      // Incrementar contador de éxito
      currentItem++;
      
      // Notificar progreso
      onProgress({
        current: currentItem,
        total: dates.length,
        status: 'generating',
        message: `Completado ${currentItem} de ${dates.length}`
      });
      
      // Pequeña pausa para evitar saturar la API (1 segundo)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error("Error generando idea para fecha", dates[i], error);
      success = false;
      
      // Notificar error pero continuar con las siguientes
      onProgress({
        current: currentItem,
        total: dates.length,
        status: 'generating',
        message: `Error en idea ${i + 1}, continuando con las siguientes`,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      
      // Pausa más larga en caso de error (3 segundos)
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // Notificar finalización
  onProgress({
    current: currentItem,
    total: dates.length,
    status: success ? 'completed' : 'failed',
    message: success 
      ? `Generación completada: ${currentItem} ideas creadas.`
      : `Generación completada con errores: ${currentItem} de ${dates.length} ideas creadas.`
  });
  
  return success;
}

/**
 * Obtiene el nombre del pilar en español
 */
function getPillarName(pillar: ContentPillarType): string {
  switch (pillar) {
    case 'ways_of_action':
      return "Ways of Action (Práctico)";
    case 'awareness_expansion':
      return "Awareness Expansion (Educativo)";
    case 'narrative':
      return "Narrative (Historias)";
    case 'attractor':
      return "Attractor (Viral)";
    case 'nurture':
      return "Nurture (Conexión)";
    default:
      return pillar;
  }
}

/**
 * Obtiene una categoría apropiada según el pilar de contenido
 */
function getCategoryForPillar(pillar?: ContentPillarType): string {
  switch (pillar) {
    case 'ways_of_action':
      return "Tutorial";
    case 'awareness_expansion':
      return "Educativo";
    case 'narrative':
      return "Storytelling";
    case 'attractor':
      return "Viral";
    case 'nurture':
      return "Conexión";
    default:
      return "Desarrollo Personal";
  }
}

/**
 * Obtiene una subcategoría apropiada según el pilar de contenido
 */
function getSubcategoryForPillar(pillar: ContentPillarType): string {
  switch (pillar) {
    case 'ways_of_action':
      return "Guía paso a paso";
    case 'awareness_expansion':
      return "Conceptos clave";
    case 'narrative':
      return "Experiencia personal";
    case 'attractor':
      return "Entretenimiento";
    case 'nurture':
      return "Reflexión";
    default:
      return "General";
  }
}

/**
 * Obtiene un enfoque apropiado según el pilar de contenido
 */
function getFocusForPillar(pillar: ContentPillarType): string {
  switch (pillar) {
    case 'ways_of_action':
      return "instructivo";
    case 'awareness_expansion':
      return "educativo";
    case 'narrative':
      return "narrativo";
    case 'attractor':
      return "entretenimiento";
    case 'nurture':
      return "reflexivo";
    default:
      return "motivacional";
  }
}

/**
 * Obtiene un tono apropiado según el pilar de contenido
 */
function getToneForPillar(pillar: ContentPillarType): string {
  switch (pillar) {
    case 'ways_of_action':
      return "práctico";
    case 'awareness_expansion':
      return "educativo";
    case 'narrative':
      return "narrativo";
    case 'attractor':
      return "energético";
    case 'nurture':
      return "conversacional";
    default:
      return "profesional";
  }
}