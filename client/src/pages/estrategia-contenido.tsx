import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BadgePlus, Save, BookOpen, Target, CircleUser, Megaphone, FileText, MessageSquare, FileEdit, EyeIcon, CheckCircle2, LightbulbIcon, CalendarDays } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ContentPillar {
  id: string;
  name: string;
  description: string;
  color: string;
  topics: string[];
}

interface ContentIdea {
  pillar: string;
  title: string;
  problem: boolean;
  notes?: string;
}

interface ContentStrategy {
  id?: number;
  audienceDescription: string;
  uniqueValueProposition: string;
  coreValues: string[];
  targetDescription: string;
  platforms: string[];
  pillars: ContentPillar[];
  contentIdeas: ContentIdea[];
}

// Valores predeterminados
const defaultStrategy: ContentStrategy = {
  audienceDescription: "",
  uniqueValueProposition: "",
  coreValues: ["", "", ""],
  targetDescription: "",
  platforms: [],
  pillars: [
    {
      id: "ways_of_action",
      name: "Formas de Acción",
      description: "Contenido práctico y aplicable inmediatamente",
      color: "#3b82f6",
      topics: ["", "", ""]
    },
    {
      id: "awareness_expansion",
      name: "Expansión de Conciencia",
      description: "Desafiar el pensamiento convencional",
      color: "#9333ea",
      topics: ["", "", ""]
    },
    {
      id: "narrative",
      name: "Narrativa Personal",
      description: "Experiencias personales y viaje",
      color: "#d97706",
      topics: ["", "", ""]
    },
    {
      id: "attractor",
      name: "Atracción",
      description: "Contenido que atrae a nuevas personas",
      color: "#16a34a",
      topics: ["", "", ""]
    },
    {
      id: "nurture",
      name: "Nutrición",
      description: "Contenido que crea conexión profunda",
      color: "#dc2626",
      topics: ["", "", ""]
    }
  ],
  contentIdeas: []
};

const socialPlatforms = [
  { id: "youtube", name: "YouTube", icon: "🎥" },
  { id: "instagram", name: "Instagram", icon: "📷" },
  { id: "tiktok", name: "TikTok", icon: "🎵" },
  { id: "linkedin", name: "LinkedIn", icon: "💼" },
  { id: "twitter", name: "Twitter/X", icon: "🐦" },
  { id: "facebook", name: "Facebook", icon: "👥" },
  { id: "twitch", name: "Twitch", icon: "🎮" },
  { id: "pinterest", name: "Pinterest", icon: "📌" },
  { id: "reddit", name: "Reddit", icon: "🤖" },
];

export default function EstrategiaContenidoPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [strategy, setStrategy] = useState<ContentStrategy>(defaultStrategy);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newIdea, setNewIdea] = useState<ContentIdea>({
    pillar: "ways_of_action",
    title: "",
    problem: true,
    notes: ""
  });
  const [showNewIdeaDialog, setShowNewIdeaDialog] = useState(false);

  useEffect(() => {
    if (user) {
      loadStrategy();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadStrategy = async () => {
    setLoading(true);
    try {
      const response = await apiRequest("GET", "/api/content-strategy");
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setStrategy(data);
        }
      }
    } catch (error) {
      console.error("Error al cargar la estrategia:", error);
      toast({
        title: "Error al cargar",
        description: "No se pudo cargar tu estrategia de contenido",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveStrategy = async () => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para guardar tu estrategia",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const response = await apiRequest(
        strategy.id ? "PUT" : "POST",
        "/api/content-strategy",
        strategy
      );

      if (!response.ok) {
        throw new Error("Error al guardar");
      }

      const savedStrategy = await response.json();
      setStrategy(savedStrategy);

      toast({
        title: "Guardado exitoso",
        description: "Tu estrategia de contenido ha sido guardada",
      });
    } catch (error) {
      console.error("Error al guardar la estrategia:", error);
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar tu estrategia de contenido",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updateCoreValue = (index: number, value: string) => {
    const updatedValues = [...strategy.coreValues];
    updatedValues[index] = value;
    setStrategy({ ...strategy, coreValues: updatedValues });
  };

  const updatePillarTopic = (pillarId: string, topicIndex: number, value: string) => {
    const updatedPillars = strategy.pillars.map(pillar => {
      if (pillar.id === pillarId) {
        const updatedTopics = [...pillar.topics];
        updatedTopics[topicIndex] = value;
        return { ...pillar, topics: updatedTopics };
      }
      return pillar;
    });
    setStrategy({ ...strategy, pillars: updatedPillars });
  };

  const addContentIdea = () => {
    if (!newIdea.title.trim()) {
      toast({
        title: "Título requerido",
        description: "Ingresa un título para tu idea de contenido",
        variant: "destructive"
      });
      return;
    }

    const updatedIdeas = [...strategy.contentIdeas, { ...newIdea }];
    setStrategy({ ...strategy, contentIdeas: updatedIdeas });
    setNewIdea({
      pillar: "ways_of_action",
      title: "",
      problem: true,
      notes: ""
    });
    setShowNewIdeaDialog(false);
  };

  const removeContentIdea = (index: number) => {
    const updatedIdeas = [...strategy.contentIdeas];
    updatedIdeas.splice(index, 1);
    setStrategy({ ...strategy, contentIdeas: updatedIdeas });
  };

  const togglePlatform = (platformId: string) => {
    const platforms = [...strategy.platforms];
    if (platforms.includes(platformId)) {
      const index = platforms.indexOf(platformId);
      platforms.splice(index, 1);
    } else {
      platforms.push(platformId);
    }
    setStrategy({ ...strategy, platforms });
  };

  const getPillarById = (id: string): ContentPillar | undefined => {
    return strategy.pillars.find(p => p.id === id);
  };

  if (loading) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Estrategia de Contenido</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileEdit className="h-7 w-7" />
          Estrategia de Contenido
        </h1>
        <Button onClick={saveStrategy} disabled={saving} className="gap-2">
          {saving ? (
            <>
              <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Guardar Estrategia
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <Tabs defaultValue="fundamentos" className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="fundamentos">Fundamentos</TabsTrigger>
              <TabsTrigger value="audiencia">Audiencia</TabsTrigger>
              <TabsTrigger value="pilares">Pilares de Contenido</TabsTrigger>
              <TabsTrigger value="ideas">Ideas de Contenido</TabsTrigger>
            </TabsList>

            <TabsContent value="fundamentos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Valores Fundamentales
                  </CardTitle>
                  <CardDescription>
                    Define los valores fundamentales que guiarán tu marca personal y tu contenido
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="value-statement">¿Qué defiendes? (Tu declaración de valor)</Label>
                    <Textarea
                      id="value-statement"
                      placeholder="Escribe lo que defiendes y qué te hace único"
                      value={strategy.uniqueValueProposition}
                      onChange={(e) => setStrategy({ ...strategy, uniqueValueProposition: e.target.value })}
                      className="min-h-[80px]"
                    />
                  </div>
                  
                  <div>
                    <Label className="mb-2 block">Principios que guían tu trabajo (3-5)</Label>
                    <div className="space-y-2">
                      {strategy.coreValues.map((value, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground min-w-[20px]">{idx + 1}.</span>
                          <Input
                            placeholder={`Principio ${idx + 1}`}
                            value={value}
                            onChange={(e) => updateCoreValue(idx, e.target.value)}
                          />
                        </div>
                      ))}
                      {strategy.coreValues.length < 5 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => setStrategy({ ...strategy, coreValues: [...strategy.coreValues, ""] })}
                        >
                          <BadgePlus className="h-4 w-4 mr-2" />
                          Añadir Principio
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audiencia" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Audiencia Objetivo
                  </CardTitle>
                  <CardDescription>
                    Define claramente a quién deseas ayudar con tu contenido
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="audience-description">¿A quién específicamente quieres ayudar?</Label>
                    <Textarea
                      id="audience-description"
                      placeholder="Describe a tu audiencia ideal de manera detallada (edad, intereses, problemas que enfrentan)"
                      value={strategy.audienceDescription}
                      onChange={(e) => setStrategy({ ...strategy, audienceDescription: e.target.value })}
                      className="min-h-[80px]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="target-description">¿Qué transformación específica les ayudas a conseguir?</Label>
                    <Textarea
                      id="target-description"
                      placeholder="¿Qué problema específico resuelves? ¿Cómo mejorará su vida después de consumir tu contenido?"
                      value={strategy.targetDescription}
                      onChange={(e) => setStrategy({ ...strategy, targetDescription: e.target.value })}
                      className="min-h-[80px]"
                    />
                  </div>
                  
                  <div className="mt-4">
                    <Label className="mb-3 block">Plataformas donde se encuentra tu audiencia</Label>
                    <div className="flex flex-wrap gap-2">
                      {socialPlatforms.map(platform => (
                        <Button
                          key={platform.id}
                          variant={strategy.platforms.includes(platform.id) ? "default" : "outline"}
                          size="sm"
                          onClick={() => togglePlatform(platform.id)}
                          className="gap-1"
                        >
                          <span>{platform.icon}</span>
                          {platform.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pilares" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5" />
                    Pilares de Contenido
                  </CardTitle>
                  <CardDescription>
                    Define los temas principales que formarán la estructura de tu estrategia de contenido
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {strategy.pillars.map((pillar) => (
                      <AccordionItem key={pillar.id} value={pillar.id}>
                        <AccordionTrigger>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: pillar.color }}></div>
                            <span>{pillar.name}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pl-6 space-y-4 pt-2">
                            <p className="text-sm text-muted-foreground">{pillar.description}</p>
                            
                            <div className="space-y-2">
                              <Label>Ideas para este pilar (3-5 temas específicos)</Label>
                              {pillar.topics.map((topic, idx) => (
                                <div key={`${pillar.id}-topic-${idx}`} className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground min-w-[20px]">{idx + 1}.</span>
                                  <Input
                                    placeholder={`Tema ${idx + 1} para ${pillar.name}`}
                                    value={topic}
                                    onChange={(e) => updatePillarTopic(pillar.id, idx, e.target.value)}
                                  />
                                </div>
                              ))}
                              {pillar.topics.length < 5 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-2"
                                  onClick={() => {
                                    const updatedPillars = strategy.pillars.map(p => {
                                      if (p.id === pillar.id) {
                                        return { ...p, topics: [...p.topics, ""] };
                                      }
                                      return p;
                                    });
                                    setStrategy({ ...strategy, pillars: updatedPillars });
                                  }}
                                >
                                  <BadgePlus className="h-4 w-4 mr-2" />
                                  Añadir Tema
                                </Button>
                              )}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ideas" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <LightbulbIcon className="h-5 w-5" />
                      Ideas de Contenido
                    </CardTitle>
                    <CardDescription>
                      Cultiva ideas específicas basadas en tus pilares de contenido
                    </CardDescription>
                  </div>
                  <Dialog open={showNewIdeaDialog} onOpenChange={setShowNewIdeaDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <BadgePlus className="h-4 w-4 mr-2" />
                        Nueva Idea
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Añadir Nueva Idea de Contenido</DialogTitle>
                        <DialogDescription>
                          Registra tu idea para desarrollarla más tarde en tu calendario
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="idea-pillar">Pilar de Contenido</Label>
                          <Select
                            value={newIdea.pillar}
                            onValueChange={(value) => setNewIdea({ ...newIdea, pillar: value })}
                          >
                            <SelectTrigger id="idea-pillar">
                              <SelectValue placeholder="Selecciona un pilar" />
                            </SelectTrigger>
                            <SelectContent>
                              {strategy.pillars.map((pillar) => (
                                <SelectItem key={pillar.id} value={pillar.id}>
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pillar.color }}></div>
                                    <span>{pillar.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="idea-title">Título / Tema</Label>
                          <Input
                            id="idea-title"
                            placeholder="Ej: 5 Estrategias para Aumentar tu Audiencia en YouTube"
                            value={newIdea.title}
                            onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="idea-approach">Enfoque</Label>
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="problem-oriented"
                                checked={newIdea.problem}
                                onChange={() => setNewIdea({ ...newIdea, problem: true })}
                                className="form-radio h-4 w-4"
                              />
                              <Label htmlFor="problem-oriented" className="cursor-pointer">Orientado al problema</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="solution-oriented"
                                checked={!newIdea.problem}
                                onChange={() => setNewIdea({ ...newIdea, problem: false })}
                                className="form-radio h-4 w-4"
                              />
                              <Label htmlFor="solution-oriented" className="cursor-pointer">Orientado a la solución</Label>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="idea-notes">Notas adicionales</Label>
                          <Textarea
                            id="idea-notes"
                            placeholder="Detalles, puntos clave o recursos para esta idea"
                            value={newIdea.notes || ""}
                            onChange={(e) => setNewIdea({ ...newIdea, notes: e.target.value })}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowNewIdeaDialog(false)}>Cancelar</Button>
                        <Button onClick={addContentIdea}>Añadir Idea</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {strategy.contentIdeas.length === 0 ? (
                    <div className="text-center py-8 border border-dashed rounded-lg">
                      <LightbulbIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Aún no has añadido ideas de contenido</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setShowNewIdeaDialog(true)}
                      >
                        Añadir tu primera idea
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {strategy.contentIdeas.map((idea, index) => {
                        const pillar = getPillarById(idea.pillar);
                        return (
                          <div 
                            key={index}
                            className="p-3 border rounded-lg flex items-start space-x-3 group hover:border-primary transition-colors"
                          >
                            <div className="w-4 h-4 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: pillar?.color || "#cbd5e1" }}></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-muted-foreground">{pillar?.name || "Pilar desconocido"}</span>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-foreground">
                                    {idea.problem ? "Problema" : "Solución"}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
                                  onClick={() => removeContentIdea(index)}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </Button>
                              </div>
                              <h4 className="font-medium mt-1">{idea.title}</h4>
                              {idea.notes && <p className="text-sm text-muted-foreground mt-1">{idea.notes}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="xl:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <EyeIcon className="h-5 w-5" />
                Resumen de Estrategia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium flex items-center gap-1">
                  <CircleUser className="h-4 w-4" />
                  Audiencia
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {strategy.audienceDescription || "No has definido tu audiencia objetivo"}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  Propuesta de valor
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {strategy.uniqueValueProposition || "No has definido tu propuesta de valor"}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Valores principales
                </h3>
                {strategy.coreValues.filter(v => v.trim()).length > 0 ? (
                  <ul className="mt-1 space-y-1">
                    {strategy.coreValues.filter(v => v.trim()).map((value, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-center gap-1">
                        <span className="text-xs bg-primary/10 text-primary px-1 rounded">#{idx+1}</span>
                        {value}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">No has definido tus valores principales</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  Plataformas
                </h3>
                {strategy.platforms.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {strategy.platforms.map(platformId => {
                      const platform = socialPlatforms.find(p => p.id === platformId);
                      return platform && (
                        <div key={platformId} className="text-xs px-2 py-1 bg-secondary rounded-full flex items-center gap-1">
                          <span>{platform.icon}</span>
                          <span>{platform.name}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">No has seleccionado plataformas</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  Ideas generadas
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {strategy.contentIdeas.length} {strategy.contentIdeas.length === 1 ? "idea" : "ideas"} de contenido registradas
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Métricas de Completitud</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs">Fundamentos</span>
                  <span className="text-xs font-medium">
                    {strategy.uniqueValueProposition && strategy.coreValues.filter(v => v.trim()).length > 0 ? "100%" : "0%"}
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-1.5">
                  <div 
                    className="bg-primary h-1.5 rounded-full" 
                    style={{ width: strategy.uniqueValueProposition && strategy.coreValues.filter(v => v.trim()).length > 0 ? "100%" : "0%" }} 
                  ></div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs">Audiencia</span>
                  <span className="text-xs font-medium">
                    {strategy.audienceDescription && strategy.targetDescription ? "100%" : strategy.audienceDescription || strategy.targetDescription ? "50%" : "0%"}
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-1.5">
                  <div 
                    className="bg-primary h-1.5 rounded-full" 
                    style={{ width: strategy.audienceDescription && strategy.targetDescription ? "100%" : strategy.audienceDescription || strategy.targetDescription ? "50%" : "0%" }} 
                  ></div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs">Pilares de Contenido</span>
                  <span className="text-xs font-medium">
                    {Math.min(100, Math.round((strategy.pillars.reduce((acc, pillar) => acc + pillar.topics.filter(t => t.trim()).length, 0) / 15) * 100))}%
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-1.5">
                  <div 
                    className="bg-primary h-1.5 rounded-full" 
                    style={{ width: `${Math.min(100, Math.round((strategy.pillars.reduce((acc, pillar) => acc + pillar.topics.filter(t => t.trim()).length, 0) / 15) * 100))}%` }} 
                  ></div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs">Ideas de Contenido</span>
                  <span className="text-xs font-medium">
                    {Math.min(100, strategy.contentIdeas.length * 10)}%
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-1.5">
                  <div 
                    className="bg-primary h-1.5 rounded-full" 
                    style={{ width: `${Math.min(100, strategy.contentIdeas.length * 10)}%` }} 
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}