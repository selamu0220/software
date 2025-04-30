import { GenerationRequest } from "@shared/schema";
import { apiRequest } from "./queryClient";

/**
 * Type definition for the content structure returned by the OpenAI API
 */
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
 * Genera una idea de YouTube a través de la API del servidor
 */
export async function generateVideoIdea(
  params: GenerationRequest
): Promise<VideoIdeaContent> {
  const response = await apiRequest("POST", "/api/generate-idea", params);
  
  if (!response.ok) {
    // Si el usuario alcanzó el límite diario (403 con limitReached=true)
    if (response.status === 403) {
      try {
        const errorData = await response.json();
        if (errorData.limitReached) {
          throw new Error("DAILY_LIMIT_REACHED");
        }
      } catch (e) {
        if (e.message === "DAILY_LIMIT_REACHED") {
          throw e;
        }
      }
    }
    
    const errorText = await response.text();
    throw new Error(`Failed to generate idea: ${errorText}`);
  }
  
  return await response.json();
}

/**
 * Genera ideas para una semana completa (7 días)
 */
export async function generateWeeklyIdeas(
  params: GenerationRequest
): Promise<{ message: string; count: number; ideas: any[] }> {
  const response = await apiRequest("POST", "/api/generate-ideas/week", params);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to generate weekly ideas: ${errorText}`);
  }
  
  return await response.json();
}

/**
 * Genera ideas para un mes completo (requiere suscripción premium)
 */
export async function generateMonthlyIdeas(
  params: GenerationRequest
): Promise<{ message: string; count: number; ideas: any[] }> {
  const response = await apiRequest("POST", "/api/generate-ideas/month", params);
  
  if (!response.ok) {
    // Si el usuario no es premium (403)
    if (response.status === 403) {
      throw new Error("PREMIUM_REQUIRED");
    }
    
    const errorText = await response.text();
    throw new Error(`Failed to generate monthly ideas: ${errorText}`);
  }
  
  return await response.json();
}

/**
 * Sample templates for YouTube video titles
 */
export const VIDEO_TITLE_TEMPLATES = [
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
