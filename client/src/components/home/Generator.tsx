import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { VIDEO_CATEGORIES, VIDEO_SUBCATEGORIES, VIDEO_LENGTHS, TEMPLATE_STYLES, CONTENT_TONES } from "@/lib/utils";
import { generateVideoIdea, generateWeeklyIdeas, generateMonthlyIdeas, VideoIdeaContent } from "@/lib/openai";
import { GenerationRequest } from "@shared/schema";
import { Info, RefreshCw, Calendar, Calendar1 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { User } from "@shared/schema";

interface GeneratorProps {
  onIdeaGenerated: (idea: VideoIdeaContent) => void;
  isGenerating: boolean;
  setIsGenerating: (isGenerating: boolean) => void;
  user: User | null;
}

export default function Generator({ onIdeaGenerated, isGenerating, setIsGenerating, user }: GeneratorProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<GenerationRequest>({
    category: VIDEO_CATEGORIES[0],
    subcategory: VIDEO_SUBCATEGORIES[VIDEO_CATEGORIES[0]][0],
    videoFocus: "",
    videoLength: VIDEO_LENGTHS[0],
    templateStyle: TEMPLATE_STYLES[0],
    contentTone: CONTENT_TONES[0],
  });

  // Update subcategories when category changes
  useEffect(() => {
    if (formData.category && VIDEO_SUBCATEGORIES[formData.category]) {
      setFormData((prev) => ({
        ...prev,
        subcategory: VIDEO_SUBCATEGORIES[formData.category][0],
      }));
    }
  }, [formData.category]);

  const handleReset = () => {
    setFormData({
      category: VIDEO_CATEGORIES[0],
      subcategory: VIDEO_SUBCATEGORIES[VIDEO_CATEGORIES[0]][0],
      videoFocus: "",
      videoLength: VIDEO_LENGTHS[0],
      templateStyle: TEMPLATE_STYLES[0],
      contentTone: CONTENT_TONES[0],
    });
  };

  const handleChange = (name: keyof GenerationRequest, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setIsGenerating(true);
      
      // Validate form
      if (!formData.videoFocus) {
        toast({
          title: "Video focus required",
          description: "Please enter what your video should focus on",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }
      
      const generatedIdea = await generateVideoIdea(formData);
      onIdeaGenerated(generatedIdea);
      
      // Scroll to results
      const resultsSection = document.getElementById("results");
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: "smooth" });
      }
    } catch (error) {
      console.error("Error generating idea:", error);
      toast({
        title: "Generation failed",
        description: "Failed to generate a video idea. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section id="generator" className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase font-heading">Generator</h2>
          <p className="mt-2 text-3xl leading-8 font-bold tracking-tight text-ytdark sm:text-4xl font-heading">
            Create Engaging YouTube Video Ideas
          </p>
          <p className="mt-4 max-w-2xl text-xl text-ytgray lg:mx-auto">
            Generate one idea for free, or sign up for unlimited ideas and monthly content planning.
          </p>
        </div>

        <div className="mt-10">
          <Card>
            <CardContent className="p-0">
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <Label htmlFor="category">Channel Type</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => handleChange("category", value)}
                      disabled={isGenerating}
                    >
                      <SelectTrigger id="category" className="mt-1">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {VIDEO_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-3">
                    <Label htmlFor="subcategory">Subcategory</Label>
                    <Select
                      value={formData.subcategory}
                      onValueChange={(value) => handleChange("subcategory", value)}
                      disabled={isGenerating}
                    >
                      <SelectTrigger id="subcategory" className="mt-1">
                        <SelectValue placeholder="Select subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.category &&
                          VIDEO_SUBCATEGORIES[formData.category]?.map((subcategory) => (
                            <SelectItem key={subcategory} value={subcategory}>
                              {subcategory}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-6">
                    <Label htmlFor="video-focus">Video Focus</Label>
                    <Input
                      id="video-focus"
                      placeholder="e.g., Video Editing, AI Tools, Web Development"
                      value={formData.videoFocus}
                      onChange={(e) => handleChange("videoFocus", e.target.value)}
                      className="mt-1"
                      disabled={isGenerating}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label htmlFor="video-length">Video Length</Label>
                    <Select
                      value={formData.videoLength}
                      onValueChange={(value) => handleChange("videoLength", value)}
                      disabled={isGenerating}
                    >
                      <SelectTrigger id="video-length" className="mt-1">
                        <SelectValue placeholder="Select length" />
                      </SelectTrigger>
                      <SelectContent>
                        {VIDEO_LENGTHS.map((length) => (
                          <SelectItem key={length} value={length}>
                            {length}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-2">
                    <Label htmlFor="template-style">Template Style</Label>
                    <Select
                      value={formData.templateStyle}
                      onValueChange={(value) => handleChange("templateStyle", value)}
                      disabled={isGenerating}
                    >
                      <SelectTrigger id="template-style" className="mt-1">
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent>
                        {TEMPLATE_STYLES.map((style) => (
                          <SelectItem key={style} value={style}>
                            {style}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-2">
                    <Label htmlFor="content-tone">Content Tone</Label>
                    <Select
                      value={formData.contentTone}
                      onValueChange={(value) => handleChange("contentTone", value)}
                      disabled={isGenerating}
                    >
                      <SelectTrigger id="content-tone" className="mt-1">
                        <SelectValue placeholder="Select tone" />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTENT_TONES.map((tone) => (
                          <SelectItem key={tone} value={tone}>
                            {tone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="px-4 py-4 sm:px-6 flex justify-end space-x-3 border-t border-gray-200">
                <span className="inline-flex text-xs text-ytgray items-center mr-auto">
                  <Info className="h-3 w-3 mr-1" />
                  Generate 1 idea for free without signing up
                </span>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={isGenerating}
                >
                  Reset
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Idea"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
