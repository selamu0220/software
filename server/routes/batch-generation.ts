import { Request, Response } from "express";
import { storage } from "../storage";
import { generateVideoIdea as generateIdea, VideoIdeaContent } from "../gemini";
import { slugify, generateSlug } from "../utils/slugify";
import { InsertVideoIdea } from "@shared/schema";

// Estructura simplificada para keypoints y script completo
type KeypointsResponse = {
  keypoints: string[];
};

type FullScriptResponse = {
  fullScript: string | { [section: string]: string };
  timings?: { [section: string]: string } | string[];
};

// Interfaz para los parámetros de generación por lotes
interface BatchGenerationParams {
  timeframe: "week" | "month" | "year";
  startDate: string;
  pillars: string[];
  topics?: string[];
  category: string;
  subcategory: string;
  videoLength: string;
  videoFocus?: string;
  templateStyle?: string;
  contentTone?: string;
  timingDetail?: boolean;
  // Ahora usamos la API key configurada en el servidor
}

export async function handleBatchGeneration(req: Request, res: Response) {
  try {
    // Verificar límites para usuarios gratuitos
    const userId = req.session.userId!;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Contar ideas generadas hoy para usuarios gratuitos
    const ideasToday = await storage.countVideoIdeasByUserSince(userId, startOfDay);
    
    // Obtener usuario para verificar plan
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "Usuario no autorizado" });
    }
    
    // Verificar límites (1 idea por día para usuarios gratuitos)
    if (!user.isPremium && !user.lifetimeAccess && ideasToday >= 1) {
      return res.status(403).json({ 
        message: "Has alcanzado el límite diario de generación para usuarios gratuitos. Actualiza a premium para generar ideas ilimitadas.",
        limitReached: true
      });
    }
    
    // Extraer parámetros de la solicitud
    const {
      timeframe,
      startDate,
      pillars,
      topics,
      category,
      subcategory,
      videoLength,
      videoFocus = "engagement",
      templateStyle = "informativo",
      contentTone = "profesional",
      timingDetail = false
    } = req.body as BatchGenerationParams;
    
    // Validar que la API key del servidor está configurada
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: "Error de configuración: GEMINI_API_KEY no está configurada en el servidor" });
    }
    
    // Validar parámetros obligatorios
    if (!timeframe || !startDate || !pillars?.length || !category || !subcategory || !videoLength) {
      return res.status(400).json({ message: "Faltan parámetros obligatorios para la generación por lotes" });
    }
    
    // Determinar la cantidad de ideas a generar según el marco temporal
    let numberOfIdeas = 0;
    let dateRange: Date[] = [];
    
    const startDateObj = new Date(startDate);
    
    switch (timeframe) {
      case "week":
        numberOfIdeas = 7; // Una idea por día durante una semana
        dateRange = generateDateRange(startDateObj, 7);
        break;
      case "month":
        numberOfIdeas = 30; // Aproximadamente un mes
        dateRange = generateDateRange(startDateObj, 30);
        break;
      case "year":
        numberOfIdeas = 52; // Una idea por semana durante un año
        dateRange = generateYearlyDateRange(startDateObj);
        break;
      default:
        return res.status(400).json({ message: "Marco temporal no válido. Debe ser 'week', 'month' o 'year'" });
    }
    
    // Si es un usuario gratuito, limitamos a una sola idea independientemente del timeframe
    if (!user.isPremium && !user.lifetimeAccess) {
      numberOfIdeas = 1;
      dateRange = [startDateObj];
    }
    
    // Generar ideas en secuencia (una tras otra)
    const generatedIdeas = [];
    
    for (let i = 0; i < numberOfIdeas; i++) {
      // Seleccionar el pilar de contenido en ciclo (si hay varios)
      const pillarIndex = i % pillars.length;
      const contentPillar = pillars[pillarIndex];
      
      // Generar título con el pilar de contenido
      const titleTemplate = `${contentPillar}: `;
      
      try {
        // Primero generamos solo la idea (título y descripción) con la API key del servidor
        const ideaResponse = await generateIdea({
          category,
          subcategory,
          videoLength,
          videoFocus,
          templateStyle,
          contentTone,
          contentType: "idea",
          timingDetail: false,
          useSubcategory: true,
          titleTemplate
        });
        
        if (!ideaResponse || !ideaResponse.title) {
          console.error(`Error generando idea #${i+1}: No se obtuvo una respuesta válida`);
          continue;
        }
      
        // Extraer título de la respuesta
        const title = ideaResponse.title || `Idea para ${contentPillar} - ${new Date().toISOString().split('T')[0]}`;
        
        // Generar slug único
        const baseSlug = generateSlug(title);
        const slug = await createUniqueSlug(baseSlug);
        
        // Simular generación de puntos clave usando el outline de la idea
        const keypointsResponse: KeypointsResponse = {
          keypoints: ideaResponse.outline || []
        };
        
        // Simular generación de guion completo
        const fullScriptResponse = {
          script: {
            introduction: `Introducción para: ${title}`,
            mainContent: keypointsResponse.keypoints.map(point => `${point}: Aquí va el desarrollo de este punto clave.`),
            conclusion: `Conclusión para: ${title}`
          },
          timingMarkers: keypointsResponse.keypoints.map((_, index) => `Sección ${index + 1}: ${Math.floor(60 / keypointsResponse.keypoints.length)} segundos`)
        };
        
        // Crear estructura de contenido completa
        const videoIdeaContent = {
          title,
          outline: ideaResponse.outline || [],
          midVideoMention: ideaResponse.midVideoMention || "Recuerda suscribirte y activar notificaciones",
          endVideoMention: ideaResponse.endVideoMention || "Gracias por ver este video",
          thumbnailIdea: ideaResponse.thumbnailIdea || `Imagen de ${title}`,
          interactionQuestion: ideaResponse.interactionQuestion || "¿Qué opinas sobre este tema?",
          keypoints: keypointsResponse.keypoints || [],
          fullScript: fullScriptResponse.script || { introduction: "", mainContent: [], conclusion: "" },
          timings: timingDetail ? fullScriptResponse.timingMarkers || [] : []
        };
        
        // Guardar la idea en la base de datos
        const videoIdea: InsertVideoIdea = {
          title,
          category,
          subcategory,
          videoLength,
          content: videoIdeaContent,
          slug,
          userId: userId,
          isPublic: false
        };
        
        const savedIdea = await storage.createVideoIdea(videoIdea);
        
        // Si hay una fecha asociada, crear entrada en el calendario
        if (dateRange[i]) {
          const calendarEntry = {
            title,
            date: dateRange[i],
            userId,
            videoIdeaId: savedIdea.id,
            color: getColorForPillar(contentPillar),
            notes: `Pilar: ${contentPillar}`,
            completed: false
          };
          
          await storage.createCalendarEntry(calendarEntry);
        }
        
        generatedIdeas.push(savedIdea);
      } catch (error) {
        console.error(`Error en el proceso de generación de idea #${i+1}:`, error);
      }
    }
    
    res.json({
      success: true,
      count: generatedIdeas.length,
      ideas: generatedIdeas
    });
    
  } catch (error) {
    console.error("Error en la generación por lotes:", error);
    res.status(500).json({
      message: "Error en la generación por lotes",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// Función para generar slug a partir de un título
function generateSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Reemplaza espacios con guiones
    .replace(/[^\w\-]+/g, '')    // Elimina caracteres no alfanuméricos
    .replace(/\-\-+/g, '-')      // Reemplaza múltiples guiones con uno solo
    .substring(0, 100);          // Limita la longitud del slug
}

// Función para generar un rango de fechas consecutivas
function generateDateRange(startDate: Date, days: number): Date[] {
  const dateRange: Date[] = [];
  const currentDate = new Date(startDate);
  
  for (let i = 0; i < days; i++) {
    dateRange.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dateRange;
}

// Función para generar fechas espaciadas para calendario anual (una por semana)
function generateYearlyDateRange(startDate: Date): Date[] {
  const dateRange: Date[] = [];
  const currentDate = new Date(startDate);
  
  for (let i = 0; i < 52; i++) {
    dateRange.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 7); // Avanzar una semana
  }
  
  return dateRange;
}

// Función para generar un color basado en el pilar de contenido
function getColorForPillar(pillar: string): string {
  // Lista de colores para asignar a los pilares
  const colors = [
    "#FF5733", // Rojo anaranjado
    "#33FF57", // Verde lima
    "#3357FF", // Azul
    "#FF33A8", // Rosa
    "#33FFF6", // Turquesa
    "#F6FF33", // Amarillo
    "#A833FF", // Púrpura
    "#FF8C33", // Naranja
    "#33FFB8", // Verde menta
    "#8C33FF"  // Violeta
  ];
  
  // Generar un hash simple del pilar para asignar siempre el mismo color
  let hash = 0;
  for (let i = 0; i < pillar.length; i++) {
    hash = pillar.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Usar el hash para seleccionar un color
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

// Función para generar slug único basado en título
async function createUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  let existingIdea = await storage.getVideoIdeaBySlug(slug);
  
  while (existingIdea) {
    slug = `${baseSlug}-${counter}`;
    counter++;
    existingIdea = await storage.getVideoIdeaBySlug(slug);
  }
  
  return slug;
}