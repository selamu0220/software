import { Request, Response } from "express";
import { storage } from "../storage";
import { generateFullScript, generateIdea, generateKeypoints } from "../utils/generator";
import { createSlug } from "../utils/slugify";
import { InsertVideoIdea } from "@shared/schema";

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
  geminiApiKey: string;
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
    if (user.plan !== "premium" && ideasToday >= 1) {
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
      timingDetail = false,
      geminiApiKey
    } = req.body as BatchGenerationParams;
    
    // Validar parámetros obligatorios
    if (!timeframe || !startDate || !pillars?.length || !category || !subcategory || !videoLength || !geminiApiKey) {
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
    if (user.plan !== "premium") {
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
        // Primero generamos solo la idea (título y descripción)
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
          titleTemplate,
          geminiApiKey
        });
        
        if (ideaResponse.error) {
          console.error(`Error generando idea #${i+1}:`, ideaResponse.error);
          continue;
        }
        
        // Extraer título de la respuesta
        const title = ideaResponse.title || `Idea para ${contentPillar} - ${new Date().toISOString().split('T')[0]}`;
        
        // Generar slug único
        const baseSlug = createSlug(title);
        const slug = await createUniqueSlug(baseSlug);
        
        // Generar puntos clave para esta idea
        const keypointsResponse = await generateKeypoints({
          category,
          subcategory,
          videoLength,
          videoFocus,
          templateStyle,
          contentTone,
          contentType: "keypoints",
          timingDetail: false,
          useSubcategory: true,
          ideaTitle: title,
          geminiApiKey
        });
        
        // Generar guion completo para esta idea
        const fullScriptResponse = await generateFullScript({
          category,
          subcategory,
          videoLength,
          videoFocus,
          templateStyle,
          contentTone,
          contentType: "fullScript",
          timingDetail,
          useSubcategory: true,
          ideaTitle: title,
          keypoints: keypointsResponse.keypoints,
          geminiApiKey
        });
        
        // Crear estructura de contenido completa
        const videoIdeaContent = {
          title,
          description: ideaResponse.description || "",
          keypoints: keypointsResponse.keypoints || [],
          fullScript: fullScriptResponse.script || { introduction: "", mainContent: [], conclusion: "" },
          timingMarkers: timingDetail ? fullScriptResponse.timingMarkers || [] : []
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