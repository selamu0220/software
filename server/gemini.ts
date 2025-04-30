import { GoogleGenerativeAI } from "@google/generative-ai";
import { GenerationRequest } from "@shared/schema";

// Verificar si la clave API de Gemini está configurada
if (!process.env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY no está configurada. Usando generación simulada.");
}

// Inicializar el cliente de Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "mock-key");

// Formatos para la generación de ideas de videos
const IDEA_TEMPLATES = [
  "Top [Número] [Tema] Que [Beneficio]",
  "[Número] Formas de [Acción] Sin [Problema Común]",
  "Cómo [Lograr Resultado] en [Tiempo] (Paso a Paso)",
  "Por qué [Creencia Común] es Incorrecta y Qué Hacer En Su Lugar",
  "La Guía Definitiva de [Tema] para [Audiencia Objetivo]",
  "[Número] Secretos de [Tema] Que Los Profesionales No Comparten",
  "Probé [Acción/Producto] Durante [Período] - Esto Es Lo Que Pasó",
  "[Número] Errores a Evitar Al [Acción]",
  "La Verdad Sobre [Tema Controversial] (Con Evidencia)",
  "[Número] Mejores [Productos/Herramientas] para [Meta] en [Año Actual]"
];

export type VideoIdeaContent = {
  title: string;
  outline: string[];
  midVideoMention: string;
  endVideoMention: string;
  thumbnailIdea: string;
  interactionQuestion: string;
  category: string;
  subcategory: string;
  videoLength: string;
};

/**
 * Genera una idea de video de YouTube basada en parámetros del usuario
 */
export async function generateVideoIdea(params: GenerationRequest): Promise<VideoIdeaContent> {
  // Si no hay clave API, devuelve una idea simulada (solo en desarrollo)
  if (!process.env.GEMINI_API_KEY) {
    return getMockVideoIdea(params);
  }

  const prompt = buildPrompt(params);

  try {
    // Obtener el modelo de texto Gemini más avanzado disponible
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Generar la respuesta
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: "Eres un generador de ideas de videos de YouTube especializado en crear ideas de contenido atractivas adaptadas a nichos específicos. Tus ideas deben incluir un título llamativo, un esquema y menciones sugeridas. Responde usando JSON." },
            { text: prompt }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      }
    });

    const response = result.response;
    const textContent = response.text();
    
    // Extraer el JSON de la respuesta de texto
    const jsonMatch = textContent.match(/```json\n([\s\S]*?)\n```/) || 
                      textContent.match(/{[\s\S]*}/) || 
                      [null, textContent];

    const jsonString = jsonMatch[1] || textContent;
    
    try {
      // Intentar analizar el JSON
      const content = JSON.parse(jsonString);
      return content;
    } catch (parseError) {
      console.error("Error al analizar JSON desde Gemini:", parseError);
      console.log("Respuesta de Gemini:", textContent);
      return getMockVideoIdea(params);
    }
  } catch (error) {
    console.error("Error al generar idea de video con Gemini:", error);
    return getMockVideoIdea(params);
  }
}

/**
 * Construye el prompt para la API de Gemini basado en parámetros del usuario
 */
function buildPrompt(params: GenerationRequest): string {
  const {
    category,
    subcategory,
    videoFocus,
    videoLength,
    templateStyle,
    contentTone
  } = params;

  return `
Genera una idea de video de YouTube para un canal en el nicho de ${category}, específicamente sobre ${subcategory}.
El video debe centrarse en ${videoFocus} y tener aproximadamente ${videoLength} de duración.
Usa un estilo ${templateStyle} con un tono ${contentTone}.

Incluye estos elementos en tu respuesta como un objeto JSON:
1. title: Un título atractivo que siga las mejores prácticas de YouTube
2. outline: Un array de 7-12 puntos principales para cubrir en el video (como strings)
3. midVideoMention: Una breve mención (1-2 oraciones) para incluir a mitad del video sobre una herramienta, servicio o producto relacionado con la eliminación de silencios o edición de video
4. endVideoMention: Una breve mención final (1-2 oraciones) sobre servicios como edición de video, desarrollo web con Framer, o plantillas gratuitas de DaVinci Resolve
5. thumbnailIdea: Una breve descripción de cómo podría ser la miniatura
6. interactionQuestion: Una pregunta para los espectadores que fomente comentarios
7. category: La categoría proporcionada
8. subcategory: La subcategoría proporcionada
9. videoLength: La duración de video proporcionada

Para contexto, el canal puede ofrecer estos servicios que puedes mencionar sutilmente:
- Edición de video para YouTube
- Creación de sitios web con Framer/Figma
- Herramientas de IA para creación de contenido
- Plantillas de DaVinci Resolve
- Una herramienta de eliminación de silencios con varios niveles de precios

Haz que la idea sea específica, práctica y con probabilidades de funcionar bien en YouTube.
Responde ÚNICAMENTE con JSON válido, sin texto adicional.
`;
}

/**
 * Función de respaldo para obtener una idea de video simulada
 */
function getMockVideoIdea(params: GenerationRequest): VideoIdeaContent {
  const { category, subcategory, videoLength } = params;
  
  return {
    title: `Top 7 Herramientas de IA Que Transformarán Tu Flujo de Trabajo en ${subcategory} en 2023`,
    outline: [
      "Introducción a la importancia de la IA en la creación de contenido",
      "Herramienta #1: GPT-4 para escritura de guiones y generación de ideas",
      "Herramienta #2: Midjourney para creación de miniaturas sin habilidades de diseño",
      "Herramienta #3: Descript para transcripción y edición automática",
      "Herramienta #4: RunwayML para efectos especiales sin After Effects",
      "Herramienta #5: Nuestra herramienta de eliminación de silencios para audio más limpio",
      "Herramienta #6: Synthesia para crear videos sin mostrar tu cara",
      "Herramienta #7: Opus Clip para generar automáticamente shorts a partir de contenido largo",
      "Comparación de precios y características",
      "Cómo integrar estas herramientas en tu flujo de trabajo",
      "Conclusión y recomendaciones"
    ],
    midVideoMention: "Hablando de ahorrar tiempo, he desarrollado una herramienta de eliminación de silencios que corta automáticamente las pausas incómodas en tus videos. Está disponible con un nivel gratuito, y puedes consultarla en la descripción a continuación.",
    endVideoMention: "Si estas herramientas te resultaron útiles, también ofrezco servicios profesionales de edición de video, creación de sitios web con Framer y plantillas gratuitas de DaVinci Resolve. ¡Consulta la descripción para más detalles!",
    thumbnailIdea: "Pantalla dividida que muestra a un creador estresado antes de usar herramientas de IA y un creador relajado después, con texto superpuesto que dice '7 HERRAMIENTAS DE IA QUE LO CAMBIARON TODO'",
    interactionQuestion: "¿Cuál de estas herramientas de IA estarías más emocionado de probar en tu proceso de creación de contenido? ¡Házmelo saber en los comentarios!",
    category,
    subcategory,
    videoLength
  };
}