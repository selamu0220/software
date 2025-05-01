import OpenAI from "openai";
import { GenerationRequest } from "@shared/schema";

if (!process.env.OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY is not set. Using mock generation.");
}

// Initialize OpenAI client
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "mock-key" 
});

// Formats for video idea generation
const IDEA_TEMPLATES = [
  "Top [Number] [Topic] That Will [Benefit]",
  "[Number] Ways to [Action] Without [Common Problem]",
  "How to [Achieve Result] in [Timeframe] (Step-by-Step)",
  "Why [Common Belief] is Wrong and What to Do Instead",
  "The Ultimate Guide to [Topic] for [Target Audience]",
  "[Number] [Topic] Secrets That Professionals Don't Share",
  "I Tried [Action/Product] for [Time Period] - Here's What Happened",
  "[Number] Mistakes to Avoid When [Action]",
  "The Truth About [Controversial Topic] (With Evidence)",
  "[Number] Best [Products/Tools] for [Goal] in [Current Year]"
];

type VideoIdeaContent = {
  title: string;
  outline: string[];
  midVideoMention: string;
  endVideoMention: string;
  thumbnailIdea: string;
  interactionQuestion: string;
  category: string;
  subcategory: string;
  videoLength: string;
  
  // Campos adicionales para diferentes tipos de contenido
  intro?: string;
  conclusion?: string;
  fullScript?: string | { [section: string]: string };
  timings?: { [section: string]: string } | string[];
};

/**
 * Generates a YouTube video idea based on user parameters
 */
export async function generateVideoIdea(params: GenerationRequest): Promise<VideoIdeaContent> {
  // If no API key, return a mock idea (only in development)
  if (!process.env.OPENAI_API_KEY) {
    return getMockVideoIdea(params);
  }

  const prompt = buildPrompt(params);

  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a YouTube video idea generator specialized in creating engaging content ideas tailored to specific niches. Your ideas should include a catchy title, an outline, and suggested mentions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    if (response.choices[0] && response.choices[0].message && response.choices[0].message.content) {
      const content = JSON.parse(response.choices[0].message.content);
      return content;
    } else {
      console.warn("Empty response from OpenAI, using mock data");
      return getMockVideoIdea(params);
    }
  } catch (error) {
    console.error("Error generating video idea:", error);
    return getMockVideoIdea(params);
  }
}

/**
 * Builds the prompt for the OpenAI API based on user parameters
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
    timingDetail
  } = params;

  // Usa la plantilla de título seleccionada por el usuario, o selecciona una aleatoria si no se proporciona
  let selectedTemplate;
  if (titleTemplate) {
    selectedTemplate = titleTemplate;
  } else {
    const randomIndex = Math.floor(Math.random() * IDEA_TEMPLATES.length);
    selectedTemplate = IDEA_TEMPLATES[randomIndex];
  }
  
  // Base prompt que es común para todos los tipos de contenido
  let basePrompt = `
Generate a YouTube video ${contentType === "idea" ? "idea" : contentType === "keypoints" ? "keypoints outline" : "complete script"} for a channel in the ${category} niche, specifically about ${subcategory}.
The video should focus on ${videoFocus} and be approximately ${videoLength} in length.
Use a ${templateStyle} style with a ${contentTone} tone.

IMPORTANT: Use this format for the title (adapted to your idea): "${selectedTemplate}"
Make the title IMPACTFUL, use strategic UPPERCASE words for emphasis, and keep it between 6-10 words.
`;

  // Instrucciones específicas según el tipo de contenido
  let specificInstructions = "";
  
  if (contentType === "idea") {
    specificInstructions = `
Include these elements in your response as a JSON object:
1. title: An engaging, clickable title that follows the format above
2. outline: An array of 7-12 main points to cover in the video (as strings)
3. midVideoMention: A brief mention (1-2 sentences) to include mid-video about a tool, service, or product related to silence removal or video editing
4. endVideoMention: A brief outro mention (1-2 sentences) about services like video editing, web development with Framer, or free DaVinci Resolve templates
5. thumbnailIdea: A brief description of what the thumbnail could look like
6. interactionQuestion: A question to ask viewers that would encourage comments
7. category: The provided category
8. subcategory: The provided subcategory
9. videoLength: The provided video length
`;
  } else if (contentType === "keypoints") {
    specificInstructions = `
Include these elements in your response as a JSON object:
1. title: An engaging, clickable title that follows the format above
2. outline: An array of 10-15 detailed keypoints to cover in the video (as strings), each with 1-2 supporting sub-points
3. intro: A compelling introduction script (3-5 sentences) to hook viewers
4. midVideoMention: A brief mention (1-2 sentences) to include mid-video about a tool, service, or product
5. conclusion: A strong closing script (3-5 sentences) with call to action
6. thumbnailIdea: A brief description of what the thumbnail could look like
7. interactionQuestion: A question to ask viewers that would encourage comments
8. category: The provided category
9. subcategory: The provided subcategory
10. videoLength: The provided video length
${timingDetail ? "11. timings: For each outline point and section, provide suggested timestamps (e.g., '0:00 - 0:30: Introduction')" : ""}
`;
  } else if (contentType === "fullScript") {
    specificInstructions = `
Include these elements in your response as a JSON object:
1. title: An engaging, clickable title that follows the format above
2. outline: An array with a brief summary of main sections (5-7 points)
3. fullScript: The complete word-for-word script divided by sections, including:
   - Hook (initial 15 seconds to grab attention)
   - Introduction (explaining what the video will cover)
   - Main content sections (each clearly labeled)
   - Mid-roll mention for a related product/service
   - Conclusion with summary of key points
   - Call to action for likes, comments and subscriptions
4. thumbnailIdea: A brief description of what the thumbnail could look like
5. interactionQuestion: A question to ask viewers that would encourage comments
6. category: The provided category
7. subcategory: The provided subcategory
8. videoLength: The provided video length
${timingDetail ? "9. timings: For each section of the script, provide precise timestamps and durations" : ""}
`;
  }
  
  // Footer común con información sobre el canal
  const footer = `
For context, the channel can offer these services that you can subtly mention:
- Video editing for YouTube
- Website creation with Framer/Figma
- AI tools for content creation
- DaVinci Resolve templates
- A silence removal tool with various pricing tiers

Make the content specific, actionable, and likely to perform well on YouTube.
`;

  return basePrompt + specificInstructions + footer;
}

/**
 * Fallback function to get a mock video idea
 */
function getMockVideoIdea(params: GenerationRequest): VideoIdeaContent {
  const { category, subcategory, videoLength, titleTemplate, contentType } = params;
  
  // Si hay una plantilla de título seleccionada, úsala o proporciona una por defecto
  const titleBase = titleTemplate || "Top [Número] Secretos que Nadie te Cuenta sobre [Tema]";
  const formattedTitle = titleBase
    .replace("[Número]", "7")
    .replace("[Tema]", subcategory)
    .replace("[Acción]", "crear contenido")
    .replace("[Objetivo]", "mejorar tu contenido")
    .replace("[Obstáculo]", "perder tiempo")
    .replace("[Aspecto de Vida]", "canal de YouTube")
    .replace("[Área de Vida]", "productividad")
    .replace("[Meta]", "crecimiento en YouTube")
    .replace("[Resultado]", "videos profesionales")
    .replace("[Resultado brutal]", "ediciones perfectas");
  
  const baseIdea = {
    title: formattedTitle,
    outline: [
      "Introduction to the importance of AI in content creation",
      "Tool #1: GPT-4 for script writing and idea generation",
      "Tool #2: Midjourney for thumbnail creation without design skills",
      "Tool #3: Descript for automatic transcription and editing",
      "Tool #4: RunwayML for special effects without After Effects",
      "Tool #5: Our silence remover tool for cleaner audio",
      "Tool #6: Synthesia for creating videos without showing your face",
      "Tool #7: Opus Clip for auto-generating shorts from long-form content",
      "Comparison of pricing and features",
      "How to integrate these tools into your workflow",
      "Conclusion and recommendations"
    ],
    midVideoMention: "Speaking of saving time, I've developed a silence remover tool that automatically cuts out awkward pauses in your videos. It's available with a free tier, and you can check it out in the description below.",
    endVideoMention: "If you found these tools helpful, I also offer professional video editing services, website creation with Framer, and free DaVinci Resolve templates. Check the description for more details!",
    thumbnailIdea: "Split-screen showing a stressed creator before using AI tools and a relaxed creator after, with text overlay saying '7 AI TOOLS THAT CHANGED EVERYTHING'",
    interactionQuestion: "Which of these AI tools would you be most excited to try in your content creation process? Let me know in the comments!",
    category,
    subcategory,
    videoLength
  };
  
  // Añadir campos adicionales según el tipo de contenido
  if (contentType === "keypoints") {
    return {
      ...baseIdea,
      intro: "¿Estás cansado de perder horas editando tus videos? En este video, te mostraré 7 herramientas de IA que transformarán tu proceso de creación de contenido para siempre. Estas herramientas no solo te ahorrarán tiempo, sino que también elevarán la calidad de tus videos sin necesidad de ser un experto en edición.",
      conclusion: "¡Y eso es todo! Estas 7 herramientas de IA pueden transformar completamente tu flujo de trabajo de creación de contenido. Recuerda comenzar con una o dos que mejor se adapten a tus necesidades inmediatas y luego expandirte desde allí. ¡No olvides suscribirte para más consejos de contenido y dejar un comentario sobre qué herramienta te pareció más útil!"
    };
  } else if (contentType === "fullScript") {
    return {
      ...baseIdea,
      fullScript: {
        "Hook": "¿Alguna vez te has quedado mirando un video a medio editar, preguntándote por qué te lleva tantas horas? ¿Y si te dijera que puedes reducir ese tiempo en un 70%? En este video, te revelaré 7 herramientas de IA que están revolucionando cómo los creadores producen contenido en 2024.",
        "Introducción": "Hola a todos, bienvenidos a Red Creativa Gen, donde te ayudamos a crear mejor contenido, más rápido. Hoy vamos a explorar 7 herramientas de IA que están cambiando el juego para creadores de YouTube. Estas no son herramientas experimentales - son soluciones probadas que uso a diario en mi propio canal. Vamos a ver cómo cada una puede encajar en tu flujo de trabajo y revolucionar tu contenido.",
        "Sección 1 - GPT-4": "La primera herramienta es GPT-4 para guiones e ideas. Esta IA conversacional ha mejorado enormemente en el último año. Yo la uso para generar ideas de videos, crear esquemas estructurados e incluso escribir secciones completas de guiones cuando me quedo sin inspiración. Lo mejor es que puedes darle ejemplos de tu estilo de escritura y adaptará su salida para que suene como tú...",
        "Mid-roll": "Antes de continuar con el resto de estas increíbles herramientas, quiero mencionar que he desarrollado un removedor de silencios que elimina automáticamente las pausas incómodas en tus videos. Está disponible con un nivel gratuito, y puedes revisarlo en la descripción a continuación.",
        "Conclusión": "Estas 7 herramientas de IA pueden transformar completamente tu contenido de YouTube. Comienza con una o dos que se alineen con tus mayores desafíos, e irás notando la diferencia inmediatamente. Recuerda que la IA está para potenciar tu creatividad, no para reemplazarla. Tu voz única y perspectiva sigue siendo lo que hace que tu canal sea especial.",
        "Call to action": "Si encuentras útil este tipo de contenido, asegúrate de darle like y suscribirte para más tutoriales sobre productividad para creadores. Y déjame saber en los comentarios: ¿Cuál de estas herramientas de IA estás más emocionado por probar en tu proceso de creación de contenido?"
      },
      timings: {
        "Hook": "0:00 - 0:20",
        "Introducción": "0:20 - 1:30",
        "Sección 1 - GPT-4": "1:30 - 3:00",
        "Sección 2 - Midjourney": "3:00 - 4:30",
        "Sección 3 - Descript": "4:30 - 6:00",
        "Sección 4 - RunwayML": "6:00 - 7:30",
        "Mid-roll": "7:30 - 8:00",
        "Sección 5 - Removedor de silencios": "8:00 - 9:30",
        "Sección 6 - Synthesia": "9:30 - 11:00",
        "Sección 7 - Opus Clip": "11:00 - 12:30",
        "Comparación y flujo de trabajo": "12:30 - 14:00",
        "Conclusión": "14:00 - 14:45",
        "Call to action": "14:45 - 15:00"
      }
    };
  }
  
  return baseIdea;
}