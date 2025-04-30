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
  "Top [Número] Secretos que Nadie te Cuenta sobre [Tema]",
  "[Número] Herramientas de [Tema] que REVOLUCIONARÁN tu Trabajo",
  "Lo que NADIE te dice sobre [Tema] (y cambiará tu forma de trabajar)",
  "[Número] Trucos GENIALES en [Tema] que te Ahorrarán HORAS",
  "Haz Esto Durante [Tiempo Corto] y TRANSFORMA tus [Resultado]",
  "[Número] Errores FATALES en [Tema] que Estás Cometiendo SIN SABERLO",
  "[Número] Métodos POCO CONOCIDOS para [Resultado brutal]",
  "Cómo Pasar de [Nivel Básico] a [Nivel Pro] en [Tema] (sin volverte loco)",
  "Las [Número] Herramientas de IA que DEBES Conocer para [Acción]",
  "DESCUBRE los [Número] SECRETOS que los PROFESIONALES de [Tema] no comparten",
  "[Número] Ideas CREATIVAS para [Objetivo] que NADIE está usando",
  "¿Estás Estancado en [Tema]? Estos [Número] TRUCOS te SALVARÁN",
  "Así es como los MEJORES logran [Resultado] en la MITAD de tiempo",
  "[Número] Tendencias en [Tema] que DOMINARÁN este [Año]",
  "PRUEBA estos [Número] HACKS de [Tema] y verás resultados INMEDIATOS"
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

  // Selecciona aleatoriamente un template de los disponibles
  const randomIndex = Math.floor(Math.random() * IDEA_TEMPLATES.length);
  const randomTemplate = IDEA_TEMPLATES[randomIndex];

  return `
Genera una idea de video profesional para YouTube dirigida a empresas SaaS y negocios que quieren crear anuncios atractivos sin mostrar la cara. 
El tema está en el nicho de ${category}, específicamente sobre ${subcategory}.
El video debe centrarse en ${videoFocus}, tener aproximadamente ${videoLength} de duración, y usar un estilo ${templateStyle} con un tono ${contentTone}.

IMPORTANTE: Usa este formato para el título (adaptado a tu idea): "${randomTemplate}"
Haz que el título sea IMPACTANTE, use MAYÚSCULAS estratégicamente, y tenga entre 6-10 palabras.

La idea debe incluir estos servicios que ofrezco:
- Edición de video para anuncios de YouTube 
- Herramientas gratuitas (con y sin IA)
- Creación de páginas web o funnels con Framer/Figma + Stripe
- Herramienta específica de "cortador de silencios" para videos (con planes de 10€/mes o 50€/mes con acceso vitalicio)
- Plantillas gratuitas de DaVinci Resolve con videos preeditados

Incluye estos elementos EXACTOS en tu respuesta como un objeto JSON:
1. title: Un título llamativo siguiendo el formato proporcionado, resaltando ALGUNAS palabras en MAYÚSCULAS para énfasis visual
2. outline: Un array de 7-10 puntos concretos para cubrir en el video (como strings)
3. midVideoMention: Una mención breve (5-10 segundos) destacando mi herramienta de "cortador de silencios"
4. endVideoMention: Una mención rápida (10-15 segundos) que resuma TODOS mis servicios (edición de video, web, cortador de silencios, plantillas)
5. thumbnailIdea: Una miniatura impactante que muestre el beneficio principal, con texto grande y legible
6. interactionQuestion: Una pregunta para fomentar comentarios como "¿Qué te ha parecido esta herramienta?", "¿La usarías?", "¿Qué opinas?"
7. category: La categoría proporcionada
8. subcategory: La subcategoría proporcionada
9. videoLength: La duración de video proporcionada

EVITAR ABSOLUTAMENTE:
- Mencionar SEO o estrategias de marketing
- Incluir tácticas complejas o técnicas avanzadas
- Usar ejemplos abstractos; ser muy CONCRETO y PRÁCTICO
- Olvidar mencionar los servicios de edición de video, web con Framer, cortador de silencios y plantillas

Enfócate en mostrar herramientas "increíbles" y FÁCILES de usar. El contenido debe ser PRÁCTICO, DIRECTO y ÚTIL.
Responde ÚNICAMENTE con JSON válido, sin texto adicional.
`;
}

/**
 * Función de respaldo para obtener una idea de video simulada
 */
function getMockVideoIdea(params: GenerationRequest): VideoIdeaContent {
  const { category, subcategory, videoLength } = params;
  
  return {
    title: `7 SECRETOS de EDICIÓN de Video que NADIE te CUENTA`,
    outline: [
      "Presentación del problema: Demasiado tiempo editando videos",
      "Secreto #1: Configuración de atajos de teclado personalizados para DaVinci Resolve",
      "Secreto #2: Uso de plantillas pre-editadas para acelerar la producción",
      "Secreto #3: Técnica del 'corte duro' para dinamizar cualquier video",
      "Secreto #4: Herramientas de eliminación automática de silencios",
      "Secreto #5: Técnicas avanzadas de recorte y composición para anuncios sin rostro",
      "Secreto #6: Configuración de presets personalizados para exportación rápida",
      "Secreto #7: Automatización del proceso de edición usando scripts y macros",
      "Demostración de resultados: Antes vs Después"
    ],
    midVideoMention: "Hablando de ahorrar tiempo... he desarrollado un cortador de silencios increíblemente potente que puede reducir el tiempo de edición hasta en un 70%. Con planes desde solo 10€ al mes o 50€ para acceso de por vida, es la herramienta perfecta para creadores y empresas.",
    endVideoMention: "Si quieres mejorar tu contenido, ofrezco servicios profesionales de edición de video para anuncios, creación de sitios web con Framer y Figma, mi herramienta de cortador de silencios, y plantillas gratuitas de DaVinci Resolve. Toda la información está en la descripción del video.",
    thumbnailIdea: "Imagen dividida mostrando 'ANTES' (persona estresada frente a una línea de tiempo desordenada) y 'DESPUÉS' (persona relajada con línea de tiempo optimizada), con texto grande que dice '7 SECRETOS DE EDICIÓN' y una flecha roja señalando el resultado final pulido.",
    interactionQuestion: "¿Cuál de estos secretos de edición te ha sorprendido más? ¿Hay alguna técnica que ya utilices en tus videos?",
    category,
    subcategory,
    videoLength
  };
}