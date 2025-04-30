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
 * Generates a YouTube video idea via the backend API
 */
export async function generateVideoIdea(
  params: GenerationRequest
): Promise<VideoIdeaContent> {
  const response = await apiRequest("POST", "/api/generate-idea", params);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to generate idea: ${errorText}`);
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
