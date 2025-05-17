import { Request, Response } from "express";
import { generationRequestSchema } from "@shared/schema";
import { storage } from "../storage";
import { generateVideoIdea } from "../gemini";
import slugify from "slugify";

/**
 * Crea una entrada de calendario a partir de una idea de video generada
 */
export async function handleBatchGeneration(req: Request, res: Response) {
  try {
    // Verificar que el usuario está autenticado
    if (!req.session.userId) {
      return res.status(401).json({ message: "No autorizado" });
    }

    const userId = req.session.userId;
    const user = await storage.getUser(userId);

    // Validar si es usuario premium o tiene acceso ilimitado
    if (!user?.isPremium && !user?.lifetimeAccess) {
      // Verificar límite diario para usuarios gratuitos
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const ideasToday = await storage.countVideoIdeasByUserSince(userId, today);
      
      // Si está en el plan gratuito, solo puede generar 1 idea por día
      if (ideasToday >= 1) {
        return res.status(403).json({
          message: "Has alcanzado el límite diario de generación de ideas para cuentas gratuitas",
          needsPremium: true
        });
      }
    }

    // Parsear y validar los parámetros
    const params = generationRequestSchema.parse(req.body);
    const dateParam = req.body.date ? new Date(req.body.date) : new Date();
    
    // Configurar variables para el color según el tipo de contenido o pilar
    const contentPillar = req.body.contentPillar;
    let color = "#4f46e5"; // Color predeterminado (indigo)
    
    // Asignar colores según el pilar de contenido
    if (contentPillar) {
      switch (contentPillar) {
        case 'ways_of_action':
          color = "#3b82f6"; // Azul
          break;
        case 'awareness_expansion':
          color = "#9333ea"; // Púrpura
          break;
        case 'narrative':
          color = "#d97706"; // Ámbar
          break;
        case 'attractor':
          color = "#16a34a"; // Verde
          break;
        case 'nurture':
          color = "#dc2626"; // Rojo
          break;
      }
    }

    // Generar una idea de video con IA
    const videoIdea = await generateVideoIdea(params);
    
    // Crear slug para la idea de video
    const slug = slugify(videoIdea.title, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
    
    // Guardar la idea generada en la base de datos
    const savedIdea = await storage.createVideoIdea({
      userId,
      title: videoIdea.title,
      slug,
      category: params.category,
      subcategory: params.subcategory,
      videoLength: params.videoLength,
      content: videoIdea,
      isPublic: false,
    });
    
    // Crear una entrada en el calendario para esta idea
    const calendarEntry = await storage.createCalendarEntry({
      userId,
      videoIdeaId: savedIdea.id,
      title: videoIdea.title,
      date: dateParam,
      timeOfDay: "12:00", // Hora predeterminada
      completed: false,
      color,
      notes: `Idea generada automáticamente - ${params.contentType}`
    });
    
    res.status(201).json({
      idea: savedIdea,
      calendarEntry
    });
  } catch (error) {
    console.error("Error en generación por lotes:", error);
    res.status(500).json({ 
      message: "Error al generar idea por lotes", 
      error: error instanceof Error ? error.message : String(error)
    });
  }
}