import { useState } from "react";
import { User } from "@shared/schema";
import { VideoIdeaContent } from "@/lib/openai";
import Hero from "@/components/home/Hero";
import Generator from "@/components/home/Generator";
import GeneratedIdeas from "@/components/home/GeneratedIdeas";
import CalendarPreview from "@/components/home/CalendarPreview";
import Templates from "@/components/home/Templates";
import ThumbnailIdeas from "@/components/home/ThumbnailIdeas";
import Pricing from "@/components/home/Pricing";

interface HomeProps {
  user: User | null;
}

export default function Home({ user }: HomeProps) {
  const [generatedIdea, setGeneratedIdea] = useState<VideoIdeaContent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleIdeaGenerated = (idea: VideoIdeaContent) => {
    setGeneratedIdea(idea);
  };

  const regenerateIdea = () => {
    // This would trigger the generator again
    setIsGenerating(true);
    // In a real app, we'd call the API again here
    // For now, we'll just simulate a delay
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div>
      <Hero user={user} />
      
      <Generator 
        onIdeaGenerated={handleIdeaGenerated} 
        isGenerating={isGenerating}
        setIsGenerating={setIsGenerating}
        user={user}
      />
      
      {generatedIdea && (
        <GeneratedIdeas 
          generatedIdea={generatedIdea} 
          user={user} 
          regenerateIdea={regenerateIdea}
          isGenerating={isGenerating}
        />
      )}
      
      <CalendarPreview 
        isLoggedIn={!!user} 
        isPremium={!!(user?.isPremium || user?.lifetimeAccess)} 
      />
      
      <Templates />
      
      <ThumbnailIdeas />
      
      <Pricing user={user} />
    </div>
  );
}
