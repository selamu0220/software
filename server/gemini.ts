import { GoogleGenerativeAI } from "@google/generative-ai";
import { GenerationRequest } from "@shared/schema";
import { z } from "zod";
import { slugify } from "../client/src/lib/utils/slugify";

// Verificar si la clave API de Gemini está configurada
if (!process.env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY no está configurada. Usando generación simulada.");
}

// Esquema para las solicitudes de asistencia de IA
export const aiAssistRequestSchema = z.object({
  prompt: z.string().min(1, "Se requiere un prompt"),
  content: z.string().optional(),
  entireScript: z.boolean().default(false),
});

// Inicializar el cliente de Google Generative AI con la clave por defecto
// La clave personalizada se utilizará por solicitud
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

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
  
  // Campos adicionales para guiones completos
  fullScript?: string | { [section: string]: string };
  timings?: { [section: string]: string } | string[];
  tags?: string[];
  intro?: string;
  conclusion?: string;
};

export type BlogPostContent = {
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  readingTime: number;
  seoTitle: string;
  seoDescription: string;
  coverImage?: string;
};

// Esquema para la generación de artículos de blog
export const blogPostGenerationSchema = z.object({
  topic: z.string().default(""),
  count: z.number().min(1).max(100).default(1),
  schedulePublishing: z.boolean().optional().default(false),
});

// Temas comunes para artículos de blog sobre creación de contenido
const BLOG_TOPICS = [
  "Creación de contenido para YouTube",
  "Optimización SEO para videos",
  "Monetización de canales",
  "Edición de videos",
  "Crecimiento en redes sociales",
  "Estrategias de marketing digital",
  "YouTube Shorts vs videos largos",
  "Tendencias en contenido audiovisual",
  "Herramientas para creadores",
  "Inteligencia artificial para creadores de contenido"
];

// Genera el placeholder para imagen de portada a partir del título
function generateCoverImageUrl(title: string): string {
  const seed = encodeURIComponent(title.substring(0, 30));
  return `https://picsum.photos/seed/${seed}/1200/630`;
}

/**
 * Genera múltiples artículos de blog con IA
 */
export async function generateBlogPosts(params: z.infer<typeof blogPostGenerationSchema>): Promise<BlogPostContent[]> {
  const { topic, count } = params;
  const posts: BlogPostContent[] = [];
  
  // Si no especifica tema, seleccionar uno aleatorio
  const finalTopic = topic || BLOG_TOPICS[Math.floor(Math.random() * BLOG_TOPICS.length)];
  
  // Generar posts en paralelo
  const promises = [];
  for (let i = 0; i < count; i++) {
    // Si es más de un post, añadir un número al tema para variación
    const postTopic = count > 1 
      ? `${finalTopic} - Parte ${i + 1}`
      : finalTopic;
      
    promises.push(generateBlogPost(postTopic));
  }
  
  // Procesar en lotes de 5 para no sobrecargar la API
  const results = await Promise.all(promises);
  return results;
}

/**
 * Genera un artículo de blog con IA
 */
async function generateBlogPost(topic: string): Promise<BlogPostContent> {
  if (!genAI || !process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY no está configurada. Usando generación simulada para blog post.");
    return getMockBlogPost(topic);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const prompt = buildBlogPostPrompt(topic);
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    try {
      // Intentamos parsear la respuesta como JSON
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                        text.match(/{[\s\S]*}/);
                        
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const parsedContent = JSON.parse(jsonStr);
        
        // Calculamos el tiempo de lectura basado en la longitud del contenido
        const wordCount = parsedContent.content.split(/\s+/).length;
        const readingTime = Math.max(1, Math.ceil(wordCount / 200)); // ~200 palabras por minuto
        
        return {
          ...parsedContent,
          readingTime,
          coverImage: generateCoverImageUrl(parsedContent.title),
          tags: parsedContent.tags || ["Creación de contenido"]
        };
      } else {
        // Fallback: generamos un post a partir del texto
        const lines = text.split("\n").filter(line => line.trim() !== "");
        const title = lines[0] || `Blog sobre ${topic}`;
        const content = lines.slice(1).join("\n");
        
        return {
          title,
          content,
          excerpt: content.substring(0, 150) + "...",
          tags: ["Creación de contenido", topic],
          readingTime: Math.ceil(content.split(/\s+/).length / 200),
          seoTitle: title,
          seoDescription: content.substring(0, 155),
          coverImage: generateCoverImageUrl(title)
        };
      }
    } catch (parseError) {
      console.error("Error al parsear la respuesta JSON:", parseError);
      return getMockBlogPost(topic);
    }
  } catch (error) {
    console.error("Error al generar blog post con Gemini:", error);
    return getMockBlogPost(topic);
  }
}

/**
 * Construye el prompt para la generación de un artículo de blog
 */
function buildBlogPostPrompt(topic: string): string {
  return `Genera un artículo de blog completo sobre "${topic}" enfocado en creadores de contenido y YouTubers. El artículo debe ser informativo, práctico y con un tono profesional pero cercano. 

Debe estar COMPLETAMENTE EN ESPAÑOL y debe incluir:
- Título atractivo (menos de 60 caracteres)
- Contenido de aproximadamente 800-1000 palabras con formato Markdown
- Un extracto inicial atractivo (máximo 150 caracteres)
- Sección de introducción
- 3-5 secciones de contenido principal con subtítulos
- Una conclusión
- Incluye entre 3-5 etiquetas relevantes

Formatea la respuesta como un objeto JSON con los siguientes campos:
- title: string (Título del artículo)
- content: string (Contenido completo en Markdown)
- excerpt: string (Extracto/resumen corto)
- tags: string[] (Array de etiquetas)
- seoTitle: string (Título optimizado para SEO)
- seoDescription: string (Meta descripción de máximo 155 caracteres)

Responde SOLAMENTE con el JSON, sin ningún texto adicional, dentro de bloque de código markdown con triple backtick y lenguaje json.`;
}

/**
 * Función de respaldo para obtener un artículo de blog simulado
 */
function getMockBlogPost(topic: string): BlogPostContent {
  const title = `${topic}: Guía Completa para Creadores de Contenido en 2024`;
  
  const content = `
# ${title}

## Introducción

En el dinámico mundo de la creación de contenido, mantenerse al día con las tendencias actuales es crucial para el éxito. Este artículo explora estrategias efectivas y herramientas para optimizar tu presencia en ${topic}.

## Por qué es importante ${topic}

La creación de contenido ha evolucionado significativamente en los últimos años. Con la creciente competencia, es esencial destacar mediante estrategias innovadoras y técnicas probadas que capturen la atención de tu audiencia.

## Estrategias efectivas

1. **Conoce a tu audiencia**: Investiga a fondo las preferencias y necesidades de tu público objetivo.
2. **Planifica tu contenido**: Establece un calendario editorial consistente.
3. **Optimiza para algoritmos**: Comprende cómo funcionan los algoritmos de las plataformas.
4. **Colabora con otros creadores**: Las colaboraciones amplían tu alcance.

## Herramientas recomendadas

Para maximizar tu eficiencia en ${topic}, considera utilizar estas herramientas:

- Planificadores de contenido
- Software de edición avanzada
- Herramientas de analítica
- Asistentes de IA para generación de ideas

## Tendencias actuales

El panorama de la creación de contenido está en constante evolución. Algunas tendencias que deberías considerar incluyen:

- Contenido corto y dinámico
- Autenticidad y transparencia
- Narración de historias personales
- Contenido educativo de valor

## Conclusión

Dominar ${topic} requiere una combinación de estrategia, creatividad y persistencia. Implementando los consejos de esta guía, estarás bien posicionado para destacar en el competitivo mundo de la creación de contenido.
`;

  return {
    title,
    content,
    excerpt: `Descubre estrategias efectivas y herramientas esenciales para dominar ${topic} en el competitivo mundo de la creación de contenido digital.`,
    tags: ["Creación de contenido", "Estrategias digitales", "YouTube", "Redes sociales"],
    readingTime: 5,
    seoTitle: `${title} | Red Creativa Gen`,
    seoDescription: `Aprende estrategias efectivas, herramientas y tendencias actuales para optimizar tu presencia en ${topic}. Guía completa para creadores.`,
    coverImage: generateCoverImageUrl(title)
  };
}

/**
 * Genera una idea de video de YouTube basada en parámetros del usuario
 */
export async function generateVideoIdea(params: GenerationRequest): Promise<VideoIdeaContent> {
  // Usar exclusivamente la API key del servidor
  const apiKey = process.env.GEMINI_API_KEY;
  
  // Si no hay clave API disponible, usar datos simulados
  if (!apiKey) {
    console.error("No hay API key de Gemini disponible en el servidor. Usando datos simulados.");
    return getMockVideoIdea(params);
  }

  // Construir el prompt para la generación
  const prompt = buildPrompt(params);
  console.log("Iniciando generación de idea con Gemini...");

  // Configurar reintentos
  const maxRetries = 2;
  let retryCount = 0;
  let lastError: any = null;

  while (retryCount <= maxRetries) {
    try {
      console.log(`Intento ${retryCount + 1}/${maxRetries + 1} de generación con Gemini...`);
      
      // Inicializar cliente con la API key correspondiente
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // Obtener el modelo de texto Gemini más avanzado disponible
      // Usar gemini-pro como respaldo si gemini-1.5-pro no funciona
      const modelName = retryCount === 0 ? "gemini-1.5-pro" : "gemini-pro";
      console.log(`Usando modelo: ${modelName}`);
      
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        }
      });

      // Generar la respuesta con formato específico
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              { text: "Eres un generador de ideas de videos de YouTube especializado en crear ideas de contenido atractivas. Devuelve ÚNICAMENTE un objeto JSON con los siguientes campos obligatorios: title (string), outline (array de strings), midVideoMention (string), endVideoMention (string), thumbnailIdea (string), interactionQuestion (string), category (string), subcategory (string), videoLength (string). Asegúrate de que outline sea un array de strings y no un string." },
              { text: prompt }
            ]
          }
        ]
      });

      const response = result.response;
      const textContent = response.text();
      
      console.log(`Contenido recibido de Gemini (${textContent.length} caracteres)`);
      
      // Extraer el JSON de la respuesta
      let jsonString = textContent;
      const jsonBlockMatch = textContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonBlockMatch && jsonBlockMatch[1]) {
        jsonString = jsonBlockMatch[1];
      }

      try {
        // Intentar analizar el JSON
        const content = JSON.parse(jsonString);
        
        // Validar que el contenido tenga la estructura esperada
        if (!content.title || !content.outline || !Array.isArray(content.outline)) {
          console.warn("Respuesta de Gemini incompleta o incorrecta. Estructura incorrecta:", content);
          
          // Si outline no es un array, convertirlo en uno
          if (content.outline && !Array.isArray(content.outline)) {
            if (typeof content.outline === 'string') {
              content.outline = content.outline.split('\n\n').filter(item => item.trim() !== '');
              console.log("Se ha convertido outline de string a array:", content.outline);
            }
          }
          
          // Si sigue sin ser un array, crear uno básico
          if (!Array.isArray(content.outline)) {
            content.outline = ["Punto 1 del esquema", "Punto 2 del esquema", "Punto 3 del esquema"];
          }
        }
        
        console.log("Idea generada exitosamente:", content.title);
        return content as VideoIdeaContent;
      } catch (parseError) {
        console.error("Error al analizar JSON desde Gemini:", parseError);
        retryCount++;
        lastError = parseError;
        
        // Esperar antes del siguiente intento (tiempo exponencial)
        if (retryCount <= maxRetries) {
          const waitTime = Math.pow(2, retryCount) * 1000;
          console.log(`Esperando ${waitTime}ms antes del siguiente intento...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    } catch (error) {
      console.error("Error al generar idea de video con Gemini:", error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log("Mensaje de error completo:", errorMessage);
      
      retryCount++;
      lastError = error;
      
      // Esperar antes del siguiente intento (a menos que sea el último)
      if (retryCount <= maxRetries) {
        const waitTime = Math.pow(2, retryCount) * 1000;
        console.log(`Esperando ${waitTime}ms antes del siguiente intento...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  // Si todos los intentos fallaron, propagar el error
  console.error(`Fallaron todos los intentos (${maxRetries + 1}) de generación con Gemini`);
  throw new Error("No se pudo generar la idea de video después de múltiples intentos");
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
    contentTone,
    titleTemplate,
    contentType,
    fullScript
  } = params;

  // Usa la plantilla de título seleccionada por el usuario, o selecciona una aleatoria si no se proporciona
  let selectedTemplate;
  if (titleTemplate) {
    selectedTemplate = titleTemplate;
  } else {
    const randomIndex = Math.floor(Math.random() * IDEA_TEMPLATES.length);
    selectedTemplate = IDEA_TEMPLATES[randomIndex];
  }

  // Base común para todos los tipos de contenido
  let basePrompt = `
Genera una idea de video profesional para YouTube dirigida a empresas SaaS y negocios que quieren crear anuncios atractivos sin mostrar la cara. 
El tema está en el nicho de ${category}, específicamente sobre ${subcategory || category}.
El video debe tener aproximadamente ${videoLength} de duración.

IMPORTANTE: Usa este formato para el título (adaptado a tu idea): "${selectedTemplate}"
Haz que el título sea IMPACTANTE, use MAYÚSCULAS estratégicamente, y tenga entre 6-10 palabras.

La idea debe incluir estos servicios que ofrezco:
- Edición de video para anuncios de YouTube 
- Herramientas gratuitas (con y sin IA)
- Creación de páginas web o funnels con Framer/Figma + Stripe
- Herramienta específica de "cortador de silencios" para videos (con planes de 10€/mes o 50€/vitalicio)
- Plantillas gratuitas de DaVinci Resolve con videos preeditados
`;

  // Elementos comunes del JSON de respuesta
  let jsonStructure = `
Incluye estos elementos BÁSICOS en tu respuesta como un objeto JSON:
1. title: Un título llamativo siguiendo el formato proporcionado, resaltando ALGUNAS palabras en MAYÚSCULAS para énfasis visual
2. outline: Un array de 7-10 puntos concretos para cubrir en el video (como strings)
3. midVideoMention: Una mención breve (5-10 segundos) destacando mi herramienta de "cortador de silencios"
4. endVideoMention: Una mención rápida (10-15 segundos) que resuma TODOS mis servicios
5. thumbnailIdea: Una miniatura impactante que muestre el beneficio principal
6. interactionQuestion: Una pregunta para fomentar comentarios
7. category: "${category}"
8. subcategory: "${subcategory || ""}"
9. videoLength: "${videoLength}"
`;

  // Si se solicita un guión completo, añadir instrucciones adicionales
  if (contentType === "fullScript" || fullScript) {
    basePrompt += `
Estoy solicitando un GUIÓN COMPLETO para este video, no solo una idea. El guión debe ser detallado y listo para grabar.

ESTRUCTURA DEL GUIÓN:
- Introducción: Un gancho inicial poderoso y presentación del problema (30-45 segundos)
- Desarrollo principal: Cada punto del esquema con detalles y ejemplos (60-90 segundos cada punto)
- Mención media: Debe incluir la promoción de mi cortador de silencios
- Conclusión: Resumen y llamada a la acción (45-60 segundos)
- Mención final: Todos mis servicios mencionados claramente
`;

    jsonStructure += `
10. tags: Un array de 5-7 etiquetas relevantes para YouTube
11. fullScript: Un objeto JSON con las secciones del guión completo, donde cada clave es el nombre de la sección y el valor es el texto completo para esa sección. Debe incluir al menos:
   - "Introducción"
   - Secciones para cada punto del esquema (como "Punto 1", "Punto 2", etc.)
   - "Conclusión"
   - "CTA" (llamada a la acción)
`;
  }

  // Advertencias comunes
  let warnings = `
EVITAR ABSOLUTAMENTE:
- Mencionar SEO o estrategias de marketing
- Incluir tácticas complejas o técnicas avanzadas
- Usar ejemplos abstractos; ser muy CONCRETO y PRÁCTICO
- Olvidar mencionar los servicios de edición de video, web con Framer, cortador de silencios y plantillas

Enfócate en mostrar herramientas "increíbles" y FÁCILES de usar. El contenido debe ser PRÁCTICO, DIRECTO y ÚTIL.
Responde ÚNICAMENTE con JSON válido, sin texto adicional.
`;

  return basePrompt + jsonStructure + warnings;
}

/**
 * Función de respaldo para obtener una idea de video simulada
 * Exportada para poder ser usada como alternativa cuando falla la API
 */
export function getMockVideoIdea(params: GenerationRequest): VideoIdeaContent {
  const { category, subcategory, videoLength, titleTemplate, contentType, fullScript } = params;
  
  // Si hay una plantilla de título seleccionada, úsala o proporciona una por defecto
  const titleBase = titleTemplate || "Top [Número] Secretos que Nadie te Cuenta sobre [Tema]";
  const formattedTitle = titleBase
    .replace("[Número]", "7")
    .replace("[Tema]", "EDICIÓN de Video")
    .replace("[Acción]", "mejorar tus videos")
    .replace("[Objetivo]", "crear mejores videos")
    .replace("[Obstáculo]", "perder tiempo")
    .replace("[Aspecto de Vida]", "contenido")
    .replace("[Área de Vida]", "canal de YouTube")
    .replace("[Meta]", "crecimiento en YouTube")
    .replace("[Resultado]", "videos profesionales")
    .replace("[Resultado brutal]", "ediciones perfectas");
  
  const outline = [
    "Presentación del problema: Demasiado tiempo editando videos",
    "Secreto #1: Configuración de atajos de teclado personalizados para DaVinci Resolve",
    "Secreto #2: Uso de plantillas pre-editadas para acelerar la producción",
    "Secreto #3: Técnica del 'corte duro' para dinamizar cualquier video",
    "Secreto #4: Herramientas de eliminación automática de silencios",
    "Secreto #5: Técnicas avanzadas de recorte y composición para anuncios sin rostro",
    "Secreto #6: Configuración de presets personalizados para exportación rápida",
    "Secreto #7: Automatización del proceso de edición usando scripts y macros",
    "Demostración de resultados: Antes vs Después"
  ];
  
  // Resultado base para todos los tipos de contenido
  const baseResult: VideoIdeaContent = {
    title: formattedTitle,
    outline,
    midVideoMention: "Hablando de ahorrar tiempo... he desarrollado un cortador de silencios increíblemente potente que puede reducir el tiempo de edición hasta en un 70%. Con planes desde solo 10€ al mes o 50€ para acceso de por vida, es la herramienta perfecta para creadores y empresas.",
    endVideoMention: "Si quieres mejorar tu contenido, ofrezco servicios profesionales de edición de video para anuncios, creación de sitios web con Framer y Figma, mi herramienta de cortador de silencios, y plantillas gratuitas de DaVinci Resolve. Toda la información está en la descripción del video.",
    thumbnailIdea: "Imagen dividida mostrando 'ANTES' (persona estresada frente a una línea de tiempo desordenada) y 'DESPUÉS' (persona relajada con línea de tiempo optimizada), con texto grande que dice '7 SECRETOS DE EDICIÓN' y una flecha roja señalando el resultado final pulido.",
    interactionQuestion: "¿Cuál de estos secretos de edición te ha sorprendido más? ¿Hay alguna técnica que ya utilices en tus videos?",
    category,
    subcategory,
    videoLength
  };
  
  // Si se solicita un guión completo, añadir los campos adicionales
  if (contentType === "fullScript" || fullScript) {
    // Añadir etiquetas
    baseResult.tags = ["edición de video", "tutoriales", "productividad", "DaVinci Resolve", "YouTube", "creación de contenido", "automatización"];
    
    // Añadir guión completo estructurado por secciones
    baseResult.fullScript = {
      "Introducción": "¡Hola creadores de contenido! Hoy vamos a resolver uno de los mayores problemas que enfrentamos: el tiempo excesivo que pasamos editando videos. Si te has encontrado pasando horas y horas frente a tu software de edición, este video va a cambiar completamente tu flujo de trabajo. Voy a revelarte 7 secretos de edición que los profesionales no comparten y que pueden reducir tu tiempo de edición hasta en un 70%.",
      
      "Secreto #1": "El primer secreto que quiero compartirte es la configuración de atajos de teclado personalizados en DaVinci Resolve. La mayoría de los creadores usan los atajos predeterminados, pero personalizar los tuyos puede ahorrarte horas de trabajo. Aquí te muestro cómo configurar los 5 atajos más útiles: para cortar clips (Alt+C), para dividir audio y video (Alt+L), para insertar transiciones (Alt+T), para aplicar corrección de color rápida (Alt+G) y para exportar con presets (Alt+E).",
      
      "Secreto #2": "El segundo secreto es el uso de plantillas pre-editadas. Muchos editores profesionales tienen una biblioteca de secuencias ya preparadas que simplemente adaptan para cada nuevo proyecto. Te enseñaré cómo crear tus propias plantillas para intros, outros, transiciones, y llamadas a la acción que puedes reutilizar en todos tus videos. Y lo mejor: ¡tengo plantillas gratuitas de DaVinci Resolve disponibles en mi web!",
      
      "Secreto #3": "El tercer secreto es la técnica del 'corte duro'. Es sorprendente lo efectiva que puede ser esta técnica para mantener la atención del espectador. Te mostraré exactamente cómo y cuándo implementarla para que tus videos sean dinámicos y profesionales sin necesidad de efectos complicados.",
      
      "Secreto #4": "El cuarto secreto, y quizás el más poderoso, es el uso de herramientas de eliminación automática de silencios. Estas herramientas pueden reducir drásticamente el tiempo de edición al detectar y eliminar automáticamente las pausas y silencios en tu grabación.",
      
      "Mención media": "Hablando de eliminar silencios... he desarrollado mi propia herramienta de eliminación de silencios que es increíblemente eficiente. Con planes desde solo 10€ al mes o un acceso vitalicio por 50€, esta herramienta puede procesar videos de una hora en menos de 5 minutos. Si estás interesado, encontrarás el enlace en la descripción del video.",
      
      "Secreto #5": "El quinto secreto son las técnicas avanzadas de recorte y composición para anuncios sin rostro. Te mostraré cómo crear anuncios efectivos utilizando motion graphics, imágenes stock y capturas de pantalla sin necesidad de aparecer frente a la cámara. Esta técnica es perfecta para empresas SaaS y negocios digitales.",
      
      "Secreto #6": "El sexto secreto es la configuración de presets personalizados para exportación rápida. Muchos creadores pierden tiempo configurando los ajustes de exportación cada vez. Te enseñaré cómo crear presets específicos para YouTube, Instagram, y otros canales que puedes utilizar con un solo clic.",
      
      "Secreto #7": "El séptimo y último secreto es la automatización del proceso de edición usando scripts y macros. Esta técnica avanzada pero accesible puede realizar tareas repetitivas automáticamente. Te mostraré tres ejemplos prácticos que puedes implementar hoy mismo.",
      
      "Demostración": "Ahora, vamos a ver estos secretos en acción. Aquí tengo un video que normalmente tomaría 3 horas editar. Observa cómo aplicando estas técnicas, puedo completarlo en menos de 45 minutos manteniendo la misma calidad o incluso mejorándola.",
      
      "Conclusión": "Como has visto, estos 7 secretos pueden transformar completamente tu proceso de edición de video. Al implementar estas técnicas, no solo ahorrarás horas de trabajo, sino que también mejorarás la calidad de tus contenidos. Recuerda que la edición eficiente te permite crear más contenido y enfocarte en lo que realmente importa: contar historias impactantes.",
      
      "CTA": "Si este video te ha resultado útil, no olvides suscribirte al canal y activar las notificaciones para más consejos de edición y creación de contenido. ¿Qué secreto te ha parecido más útil? Déjame saber en los comentarios y comparte tus propios trucos de edición. ¡Nos vemos en el próximo video!"
    };
    
    // Añadir timings estimados para cada sección
    baseResult.timings = {
      "Introducción": "00:00 - 00:45",
      "Secreto #1": "00:45 - 02:15",
      "Secreto #2": "02:15 - 03:45",
      "Secreto #3": "03:45 - 05:00",
      "Secreto #4": "05:00 - 06:15",
      "Mención media": "06:15 - 06:45",
      "Secreto #5": "06:45 - 08:15",
      "Secreto #6": "08:15 - 09:30",
      "Secreto #7": "09:30 - 11:00",
      "Demostración": "11:00 - 12:30",
      "Conclusión": "12:30 - 13:15",
      "CTA": "13:15 - 14:00"
    };
  }
  
  return baseResult;
}

/**
 * Asistente de IA para generar o mejorar contenido basado en un prompt
 */
export async function aiAssistant(params: z.infer<typeof aiAssistRequestSchema>): Promise<{ content: string }> {
  const { prompt, content, entireScript } = params;
  
  // Usar exclusivamente la API key del servidor
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("No se ha configurado la API key de Gemini en el servidor");
  }

  try {
    // Inicializar cliente de Gemini con la clave del servidor
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Construir el prompt contextual dependiendo del escenario
    let systemPrompt: string;
    let userPrompt: string;
    
    if (entireScript && content) {
      // Mejorar el script completo
      systemPrompt = "Eres un asistente de redacción profesional especializado en guiones para videos de YouTube. Tu tarea es reformular, mejorar o regenerar el contenido de scripts según las instrucciones proporcionadas. Mantén el formato HTML del documento.";
      userPrompt = `INSTRUCCIONES: ${prompt}\n\nCONTENIDO ORIGINAL:\n${content}\n\nGenera una versión mejorada manteniendo la estructura HTML pero mejorando el texto según las instrucciones.`;
    } else {
      // Mejorar solo un fragmento o generar nuevo contenido
      systemPrompt = "Eres un asistente de redacción profesional especializado en contenido para creadores de video digital. Ayudas a mejorar textos, generar ideas, y reformular contenido para hacerlo más atractivo y profesional.";
      userPrompt = prompt;
    }
    
    // Generar respuesta
    const result = await model.generateContent({
      contents: [
        { role: "system", parts: [{ text: systemPrompt }] },
        { role: "user", parts: [{ text: userPrompt }] }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    });
    
    return { content: result.response.text() };
    
  } catch (error: any) {
    console.error("Error en asistente de IA:", error);
    throw new Error(`Error al generar contenido con IA: ${error.message || "Error desconocido"}`);
  }
}