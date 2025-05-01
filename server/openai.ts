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
    titleTemplate
  } = params;

  // Usa la plantilla de título seleccionada por el usuario, o selecciona una aleatoria si no se proporciona
  let selectedTemplate;
  if (titleTemplate) {
    selectedTemplate = titleTemplate;
  } else {
    const randomIndex = Math.floor(Math.random() * IDEA_TEMPLATES.length);
    selectedTemplate = IDEA_TEMPLATES[randomIndex];
  }

  return `
Generate a YouTube video idea for a channel in the ${category} niche, specifically about ${subcategory}.
The video should focus on ${videoFocus} and be approximately ${videoLength} in length.
Use a ${templateStyle} style with a ${contentTone} tone.

IMPORTANT: Use this format for the title (adapted to your idea): "${selectedTemplate}"
Make the title IMPACTFUL, use strategic UPPERCASE words for emphasis, and keep it between 6-10 words.

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

For context, the channel can offer these services that you can subtly mention:
- Video editing for YouTube
- Website creation with Framer/Figma
- AI tools for content creation
- DaVinci Resolve templates
- A silence removal tool with various pricing tiers

Make the idea specific, actionable, and likely to perform well on YouTube.
`;
}

/**
 * Fallback function to get a mock video idea
 */
function getMockVideoIdea(params: GenerationRequest): VideoIdeaContent {
  const { category, subcategory, videoLength, titleTemplate } = params;
  
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
  
  return {
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
}
