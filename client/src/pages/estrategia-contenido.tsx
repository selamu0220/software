import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Save, CheckCircle2, ClipboardCheck, BookOpenCheck } from "lucide-react";
import { ContentStrategy } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";

// Tipo para los componentes de cada sección
type SectionProps = {
  strategy: ContentStrategy | null;
  onChange: (field: string, value: any) => void;
  onSave: () => Promise<void>;
  saving: boolean;
};

const EstrategiaContenido = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("fundamentos");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [strategy, setStrategy] = useState<ContentStrategy | null>(null);

  // Cargar estrategia existente o crear una nueva
  const loadStrategy = async () => {
    try {
      setLoading(true);
      const response = await apiRequest("GET", "/api/content-strategy");
      
      if (response.ok) {
        const data = await response.json();
        setStrategy(data);
      } else {
        // Si no existe, creamos una estructura vacía
        setStrategy({
          id: 0,
          userId: user?.id || 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          
          // Sección 1: Fundamentos
          adviceTopics: "",
          naturalSkills: "",
          introduction: "",
          uniqueValue: "",
          uniqueExperiences: "",
          problemsSolved: "",
          passionTopics: "",
          coreValues: "",
          guidingPrinciples: "",
          unconventionalBelief: "",
          targetAudience: "",
          audienceProblem: "",
          audienceBenefit: "",
          valueStatement: "",
          
          // Sección 2: Micro Personal Brand
          audiencePlatforms: "",
          selectedPlatform: "",
          platformReason: "",
          idealCustomerAge: "",
          idealCustomerIncome: "",
          idealCustomerJob: "",
          idealCustomerProblems: "",
          idealCustomerGoals: "",
          idealCustomerSearches: "",
          contentStrategies: "",
          
          // Sección 3: Estrategia de Contenido
          audienceProblems: "",
          contentTopics: "",
          
          // Pilares de contenido
          pillarActionContent: "",
          pillarAwarenessContent: "",
          pillarNarrativeContent: "",
          pillarAttractorContent: "",
          pillarNurtureContent: "",
          
          // Problem Farming
          problemOriented1: "",
          solutionOriented1: "",
          problemOriented2: "",
          solutionOriented2: "",
          problemOriented3: "",
          solutionOriented3: "",
          
          // Model & Dream Lists
          modelList: "",
          dreamList: "",
          
          // Calendario de contenido
          contentCalendar: "",
          firstContentOutline: "",
          
          // Sección 4: Monetización
          monetizationReadiness: "",
          monetizationObstacles: "",
          monetizationExpertise: "",
          problemToSolve: "",
          solutionDifferentiation: "",
          transformation: "",
          
          // Sección 5: Automatización y Escalabilidad
          systemWork: "",
          coachingPhases: "",
          phaseDetails: "",
          leadMagnets: "",
          callToAction: "",
          qualifyingQuestion: "",
          communityType: "",
          communityValue: "",
          communityRules: "",
          communityEngagement: "",
          
          // Plan de acción
          shortTermPriorities: "",
          monthlyPriorities: "",
          quarterlyGoals: ""
        });
      }
    } catch (error) {
      console.error("Error cargando estrategia:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar tu estrategia de contenido",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Guardar la estrategia
  const saveStrategy = async () => {
    if (!strategy) return;
    
    try {
      setSaving(true);
      const method = strategy.id ? "PATCH" : "POST";
      const endpoint = strategy.id ? `/api/content-strategy/${strategy.id}` : "/api/content-strategy";
      
      const response = await apiRequest(method, endpoint, strategy);
      
      if (response.ok) {
        const data = await response.json();
        setStrategy(data);
        toast({
          title: "Guardado",
          description: "Tu estrategia de contenido ha sido guardada correctamente",
          variant: "success"
        });
      } else {
        throw new Error("Error al guardar");
      }
    } catch (error) {
      console.error("Error guardando estrategia:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar tu estrategia de contenido",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Manejar cambios en los campos
  const handleChange = (field: string, value: any) => {
    if (!strategy) return;
    
    setStrategy(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: value
      };
    });
  };

  // Sección 1: Fundamentos
  const Fundamentos: React.FC<SectionProps> = ({ strategy, onChange, onSave, saving }) => {
    if (!strategy) return null;
    
    return (
      <div className="space-y-8">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Fundamentos de tu Marca Personal</CardTitle>
              <CardDescription>
                En esta sección identificarás los cimientos de tu marca personal, basados en tus experiencias, habilidades y perspectivas únicas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Ejercicio 1: Descubre tu marca personal existente</h3>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="adviceTopics">¿Sobre qué 3 temas la gente te pide consejo?</Label>
                    <Textarea 
                      id="adviceTopics"
                      value={strategy.adviceTopics || ''}
                      onChange={(e) => onChange('adviceTopics', e.target.value)}
                      placeholder="Ej: Marketing digital, Fotografía, Educación financiera..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="naturalSkills">¿Qué habilidades te resultan naturales y podrían ser valiosas para otros?</Label>
                    <Textarea 
                      id="naturalSkills"
                      value={strategy.naturalSkills || ''}
                      onChange={(e) => onChange('naturalSkills', e.target.value)}
                      placeholder="Ej: Explicar conceptos complejos de forma sencilla, editar vídeos eficientemente..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="introduction">Si alguien tuviera que presentarte en una frase, ¿qué dirían?</Label>
                    <Textarea 
                      id="introduction"
                      value={strategy.introduction || ''}
                      onChange={(e) => onChange('introduction', e.target.value)}
                      placeholder="Ej: Es el experto que ayuda a creadores de contenido a monetizar su pasión sin necesidad de millones de seguidores"
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Ejercicio 2: Define tu valor único</h3>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="uniqueValue">¿Qué conocimientos o habilidades dominas que otros encuentran difíciles?</Label>
                    <Textarea 
                      id="uniqueValue"
                      value={strategy.uniqueValue || ''}
                      onChange={(e) => onChange('uniqueValue', e.target.value)}
                      placeholder="Ej: Crear contenido viral en TikTok, optimizar procesos empresariales..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="uniqueExperiences">¿Qué experiencias te han dado una perspectiva única en tu campo?</Label>
                    <Textarea 
                      id="uniqueExperiences"
                      value={strategy.uniqueExperiences || ''}
                      onChange={(e) => onChange('uniqueExperiences', e.target.value)}
                      placeholder="Ej: Haber trabajado en grandes corporaciones y después emprender..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="problemsSolved">¿Qué problemas has resuelto para ti o para otros que podrías ayudar a superar?</Label>
                    <Textarea 
                      id="problemsSolved"
                      value={strategy.problemsSolved || ''}
                      onChange={(e) => onChange('problemsSolved', e.target.value)}
                      placeholder="Ej: Aumentar las ventas mediante estrategias de marketing digital..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="passionTopics">¿De qué podrías hablar todo el día sin aburrirte?</Label>
                    <Textarea 
                      id="passionTopics"
                      value={strategy.passionTopics || ''}
                      onChange={(e) => onChange('passionTopics', e.target.value)}
                      placeholder="Ej: Estrategias de creación de contenido, desarrollo personal..."
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Ejercicio 3: Identifica tus valores centrales y creencias</h3>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="coreValues">¿Qué defiendes?</Label>
                    <Textarea 
                      id="coreValues"
                      value={strategy.coreValues || ''}
                      onChange={(e) => onChange('coreValues', e.target.value)}
                      placeholder="Ej: La honestidad y transparencia en el marketing digital..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="guidingPrinciples">Enumera 3-5 principios que guían tu trabajo</Label>
                    <Textarea 
                      id="guidingPrinciples"
                      value={strategy.guidingPrinciples || ''}
                      onChange={(e) => onChange('guidingPrinciples', e.target.value)}
                      placeholder="Ej: 1. Siempre aportar valor real, 2. Claridad sobre complejidad..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="unconventionalBelief">¿Cuál es una creencia que tienes sobre tu campo que va contra la sabiduría convencional?</Label>
                    <Textarea 
                      id="unconventionalBelief"
                      value={strategy.unconventionalBelief || ''}
                      onChange={(e) => onChange('unconventionalBelief', e.target.value)}
                      placeholder="Ej: No necesitas millones de seguidores para monetizar tu contenido..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Ejercicio 4: Define tu audiencia objetivo</h3>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="targetAudience">¿A quién quieres ayudar específicamente? (Sé lo más detallado posible)</Label>
                    <Textarea 
                      id="targetAudience"
                      value={strategy.targetAudience || ''}
                      onChange={(e) => onChange('targetAudience', e.target.value)}
                      placeholder="Ej: Profesionales entre 25-35 años que quieren iniciar un negocio online..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="audienceProblem">¿Qué problema específico tienen que puedes resolver?</Label>
                    <Textarea 
                      id="audienceProblem"
                      value={strategy.audienceProblem || ''}
                      onChange={(e) => onChange('audienceProblem', e.target.value)}
                      placeholder="Ej: No saben cómo crear contenido que genere ventas..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="audienceBenefit">¿Cómo mejorará su vida/negocio después de que les ayudes?</Label>
                    <Textarea 
                      id="audienceBenefit"
                      value={strategy.audienceBenefit || ''}
                      onChange={(e) => onChange('audienceBenefit', e.target.value)}
                      placeholder="Ej: Podrán generar ingresos consistentes con su contenido..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Ejercicio 5: Tu declaración de valor único</h3>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="valueStatement">Completa la frase: "Yo ayudo a _______ (audiencia específica) a _______ (lograr un resultado específico) a través de _______ (tu enfoque único)."</Label>
                    <Textarea 
                      id="valueStatement"
                      value={strategy.valueStatement || ''}
                      onChange={(e) => onChange('valueStatement', e.target.value)}
                      placeholder="Ej: Yo ayudo a creadores de contenido a monetizar su pasión a través de estrategias de marketing orientadas a la conversión."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={onSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // Sección 2: Micro Personal Brand
  const MicroPersonalBrand: React.FC<SectionProps> = ({ strategy, onChange, onSave, saving }) => {
    if (!strategy) return null;
    
    return (
      <div className="space-y-8">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Micro Personal Brand</CardTitle>
              <CardDescription>
                Este concepto se centra en dirigirte a una audiencia específica con necesidades específicas: calidad sobre cantidad. En esta sección, identificarás dónde pasa tiempo tu audiencia ideal y cómo posicionarte como la solución a sus problemas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Ejercicio 1: Selección de plataforma</h3>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="audiencePlatforms">Enumera 5 lugares donde tu cliente ideal ya pasa tiempo online u offline</Label>
                    <Textarea 
                      id="audiencePlatforms"
                      value={strategy.audiencePlatforms || ''}
                      onChange={(e) => onChange('audiencePlatforms', e.target.value)}
                      placeholder="Ej: 1. Instagram, 2. YouTube, 3. Grupos de Facebook sobre marketing..."
                      className="mt-1"
                      rows={5}
                    />
                  </div>

                  <div>
                    <Label htmlFor="selectedPlatform">Basado en tus fortalezas y audiencia objetivo, ¿en qué plataforma te enfocarás primero?</Label>
                    <select 
                      id="selectedPlatform"
                      value={strategy.selectedPlatform || ''}
                      onChange={(e) => onChange('selectedPlatform', e.target.value)}
                      className="w-full p-2 mt-1 border rounded-md"
                    >
                      <option value="">Selecciona una plataforma</option>
                      <option value="YouTube">YouTube</option>
                      <option value="Instagram">Instagram</option>
                      <option value="TikTok">TikTok</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Twitter">Twitter</option>
                      <option value="Facebook">Facebook</option>
                      <option value="Podcast">Podcast</option>
                      <option value="Blog">Blog</option>
                      <option value="Otra">Otra</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="platformReason">¿Por qué esta plataforma es la mejor opción para ti y tu audiencia?</Label>
                    <Textarea 
                      id="platformReason"
                      value={strategy.platformReason || ''}
                      onChange={(e) => onChange('platformReason', e.target.value)}
                      placeholder="Ej: YouTube permite explicar conceptos complejos de forma visual, y mi audiencia busca tutoriales detallados..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Ejercicio 2: Define tu cliente perfecto</h3>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="idealCustomerAge">Rango de edad</Label>
                      <Input 
                        id="idealCustomerAge"
                        value={strategy.idealCustomerAge || ''}
                        onChange={(e) => onChange('idealCustomerAge', e.target.value)}
                        placeholder="Ej: 25-40 años"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="idealCustomerIncome">Nivel de ingresos</Label>
                      <Input 
                        id="idealCustomerIncome"
                        value={strategy.idealCustomerIncome || ''}
                        onChange={(e) => onChange('idealCustomerIncome', e.target.value)}
                        placeholder="Ej: 30.000-60.000€ anuales"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="idealCustomerJob">Título/posición laboral</Label>
                    <Input 
                      id="idealCustomerJob"
                      value={strategy.idealCustomerJob || ''}
                      onChange={(e) => onChange('idealCustomerJob', e.target.value)}
                      placeholder="Ej: Emprendedores, Profesionales de marketing, Freelancers..."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="idealCustomerProblems">Problemas que enfrentan</Label>
                    <Textarea 
                      id="idealCustomerProblems"
                      value={strategy.idealCustomerProblems || ''}
                      onChange={(e) => onChange('idealCustomerProblems', e.target.value)}
                      placeholder="Ej: No saben cómo escalar su negocio, Tienen dificultades para atraer clientes..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="idealCustomerGoals">Objetivos que tienen</Label>
                    <Textarea 
                      id="idealCustomerGoals"
                      value={strategy.idealCustomerGoals || ''}
                      onChange={(e) => onChange('idealCustomerGoals', e.target.value)}
                      placeholder="Ej: Aumentar sus ingresos, Trabajar menos horas, Expandir su negocio..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="idealCustomerSearches">Lo que buscan en internet</Label>
                    <Textarea 
                      id="idealCustomerSearches"
                      value={strategy.idealCustomerSearches || ''}
                      onChange={(e) => onChange('idealCustomerSearches', e.target.value)}
                      placeholder="Ej: 'Cómo conseguir más clientes', 'Estrategias de marketing para pequeños negocios'..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="contentStrategies">¿Cómo te asegurarás de que tu contenido atraiga a esta audiencia específica?</Label>
                    <Textarea 
                      id="contentStrategies"
                      value={strategy.contentStrategies || ''}
                      onChange={(e) => onChange('contentStrategies', e.target.value)}
                      placeholder="Ej: Hablaré de sus problemas específicos, utilizaré su lenguaje y jerga profesional..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={onSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // Sección 3: Estrategia de Contenido
  const EstrategiaContenidoTab: React.FC<SectionProps> = ({ strategy, onChange, onSave, saving }) => {
    if (!strategy) return null;
    
    return (
      <div className="space-y-8">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Estrategia de Contenido</CardTitle>
              <CardDescription>
                Tu estrategia de contenido es el puente entre tu experiencia y tu audiencia. Estos ejercicios te ayudarán a crear contenido que no solo atraiga atención sino que estratégicamente mueva a las personas a convertirse en clientes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Ejercicio 1: Enfoque de contenido</h3>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="audienceProblems">Enumera 5 problemas específicos que enfrenta tu audiencia</Label>
                    <Textarea 
                      id="audienceProblems"
                      value={strategy.audienceProblems || ''}
                      onChange={(e) => onChange('audienceProblems', e.target.value)}
                      placeholder="Ej: 1. No saben cómo monetizar su audiencia, 2. Tienen dificultades para crear contenido constante..."
                      className="mt-1"
                      rows={5}
                    />
                  </div>

                  <div>
                    <Label htmlFor="contentTopics">Enumera 5 temas específicos en los que te centrarás con tu contenido para atraer a esta audiencia</Label>
                    <Textarea 
                      id="contentTopics"
                      value={strategy.contentTopics || ''}
                      onChange={(e) => onChange('contentTopics', e.target.value)}
                      placeholder="Ej: 1. Estrategias de monetización para creadores, 2. Sistemas para crear contenido eficientemente..."
                      className="mt-1"
                      rows={5}
                    />
                  </div>
                </div>
              </div>

              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Ejercicio 2: Define tus pilares de contenido</h3>
                <p className="text-sm text-muted-foreground">
                  Los pilares de contenido son los temas centrales de tu estrategia, cada uno sirviendo a un propósito diferente en el viaje de tu audiencia. Para cada pilar, enumera 3-5 ideas de contenido específicas.
                </p>
                
                <div className="space-y-5 mt-4">
                  <div>
                    <h4 className="font-medium mb-2">Pilar 1: Formas de acción (contenido práctico y accionable)</h4>
                    <Textarea 
                      id="pillarActionContent"
                      value={strategy.pillarActionContent || ''}
                      onChange={(e) => onChange('pillarActionContent', e.target.value)}
                      placeholder="Ej: 1. Tutorial paso a paso para configurar una automatización de email marketing, 2. Cómo escribir textos de redes sociales que conviertan (con plantillas)..."
                      className="mt-1"
                      rows={5}
                    />
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Pilar 2: Expansión de conciencia (desafiar el pensamiento convencional)</h4>
                    <Textarea 
                      id="pillarAwarenessContent"
                      value={strategy.pillarAwarenessContent || ''}
                      onChange={(e) => onChange('pillarAwarenessContent', e.target.value)}
                      placeholder="Ej: 1. Por qué los eventos de networking son una pérdida de tiempo para la mayoría de emprendedores, 2. La razón contraintuitiva por la que la mayoría de marcas personales no logran monetizar..."
                      className="mt-1"
                      rows={5}
                    />
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Pilar 3: Narrativa (experiencias personales y trayectoria)</h4>
                    <Textarea 
                      id="pillarNarrativeContent"
                      value={strategy.pillarNarrativeContent || ''}
                      onChange={(e) => onChange('pillarNarrativeContent', e.target.value)}
                      placeholder="Ej: 1. Cómo pasé del burnout corporativo a construir una marca de seis cifras en 12 meses, 2. El mayor error que cometí al fijar precios para mis servicios (y cómo lo arreglé)..."
                      className="mt-1"
                      rows={5}
                    />
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Pilar 4: Atractor (contenido que atrae nuevas personas a tu nicho)</h4>
                    <Textarea 
                      id="pillarAttractorContent"
                      value={strategy.pillarAttractorContent || ''}
                      onChange={(e) => onChange('pillarAttractorContent', e.target.value)}
                      placeholder="Ej: 1. 10 trabajos secundarios que puedes comenzar sin experiencia, 2. Cómo ganar tus primeros 1.000€ en línea sin dejar tu trabajo..."
                      className="mt-1"
                      rows={5}
                    />
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Pilar 5: Nutrición (contenido que construye una conexión más profunda)</h4>
                    <Textarea 
                      id="pillarNurtureContent"
                      value={strategy.pillarNurtureContent || ''}
                      onChange={(e) => onChange('pillarNurtureContent', e.target.value)}
                      placeholder="Ej: 1. Un vistazo tras bastidores de cómo planifico mi estrategia de contenido, 2. Mi rutina matutina que duplicó mi productividad..."
                      className="mt-1"
                      rows={5}
                    />
                  </div>
                </div>
              </div>

              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Ejercicio 3: Problem Farming</h3>
                <p className="text-sm text-muted-foreground">
                  Para cada problema que enfrenta tu audiencia, crea títulos orientados tanto al problema como a la solución.
                </p>
                
                <div className="space-y-5 mt-4">
                  <div>
                    <h4 className="font-medium mb-2">Problema #1</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <Label htmlFor="problemOriented1">Orientado al problema</Label>
                        <Input 
                          id="problemOriented1"
                          value={strategy.problemOriented1 || ''}
                          onChange={(e) => onChange('problemOriented1', e.target.value)}
                          placeholder='Ej: "Por qué el 82% de las agencias de marketing fracasan en su primer año"'
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="solutionOriented1">Orientado a la solución</Label>
                        <Input 
                          id="solutionOriented1"
                          value={strategy.solutionOriented1 || ''}
                          onChange={(e) => onChange('solutionOriented1', e.target.value)}
                          placeholder='Ej: "El sistema de adquisición de clientes de 3 pasos que mantiene mi agencia con agenda completa"'
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Problema #2</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <Label htmlFor="problemOriented2">Orientado al problema</Label>
                        <Input 
                          id="problemOriented2"
                          value={strategy.problemOriented2 || ''}
                          onChange={(e) => onChange('problemOriented2', e.target.value)}
                          placeholder='Ej: "La trampa de contenido que está agotando a la mayoría de creadores"'
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="solutionOriented2">Orientado a la solución</Label>
                        <Input 
                          id="solutionOriented2"
                          value={strategy.solutionOriented2 || ''}
                          onChange={(e) => onChange('solutionOriented2', e.target.value)}
                          placeholder='Ej: "El método de 2 horas semanales que utilizo para crear contenido sin agotarme"'
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Problema #3</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <Label htmlFor="problemOriented3">Orientado al problema</Label>
                        <Input 
                          id="problemOriented3"
                          value={strategy.problemOriented3 || ''}
                          onChange={(e) => onChange('problemOriented3', e.target.value)}
                          placeholder='Ej: "El error de precios que está saboteando tu crecimiento empresarial"'
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="solutionOriented3">Orientado a la solución</Label>
                        <Input 
                          id="solutionOriented3"
                          value={strategy.solutionOriented3 || ''}
                          onChange={(e) => onChange('solutionOriented3', e.target.value)}
                          placeholder='Ej: "La fórmula de fijación de precios que triplicó mis ingresos en 90 días"'
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Ejercicio 4: Crea tus listas Model & Dream</h3>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="modelList">Lista Model 10: Creadores con estilo similar pero contenido diferente (nombra 10)</Label>
                    <Textarea 
                      id="modelList"
                      value={strategy.modelList || ''}
                      onChange={(e) => onChange('modelList', e.target.value)}
                      placeholder="Lista de 10 creadores cuyo estilo te gustaría emular, aunque su contenido sea diferente al tuyo"
                      className="mt-1"
                      rows={10}
                    />
                  </div>

                  <div>
                    <Label htmlFor="dreamList">Lista Dream 10: Las principales marcas personales en tu industria (nombra 10)</Label>
                    <Textarea 
                      id="dreamList"
                      value={strategy.dreamList || ''}
                      onChange={(e) => onChange('dreamList', e.target.value)}
                      placeholder="Lista de 10 marcas personales líderes en tu industria"
                      className="mt-1"
                      rows={10}
                    />
                  </div>
                </div>
              </div>

              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Ejercicio 5: Calendario de contenido</h3>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="contentCalendar">Planifica tus primeras 4 semanas de contenido (2 piezas por semana)</Label>
                    <Textarea 
                      id="contentCalendar"
                      value={strategy.contentCalendar || ''}
                      onChange={(e) => onChange('contentCalendar', e.target.value)}
                      placeholder="Semana 1: - Contenido 1: Título / tema - Contenido 2: Título / tema..."
                      className="mt-1"
                      rows={12}
                    />
                  </div>
                </div>
              </div>

              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Ejercicio 6: Esquema de tu primer contenido</h3>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="firstContentOutline">Para tu primera pieza de contenido, detalla el esquema completo</Label>
                    <Textarea 
                      id="firstContentOutline"
                      value={strategy.firstContentOutline || ''}
                      onChange={(e) => onChange('firstContentOutline', e.target.value)}
                      placeholder="Título: \n\nHook (primeros 30 segundos): \n\nPuntos principales: \n1. \n2. \n3. \n\nHistorias/Ejemplos a incluir: \n\nLlamada a la acción:"
                      className="mt-1"
                      rows={15}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={onSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // Sección 4: Monetización
  const Monetizacion: React.FC<SectionProps> = ({ strategy, onChange, onSave, saving }) => {
    if (!strategy) return null;
    
    return (
      <div className="space-y-8">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Monetización</CardTitle>
              <CardDescription>
                Esta sección se centra en convertir a tu audiencia en clientes. Lo clave aquí es que no necesitas una audiencia masiva para generar ingresos significativos, solo los seguidores adecuados. Estos ejercicios te ayudarán a crear una oferta que resuelva un problema específico para tu audiencia.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Ejercicio 1: Autoevaluación</h3>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="monetizationReadiness">En una escala del 1 al 10, ¿qué tan listo estás para monetizar tu marca personal y por qué?</Label>
                    <Textarea 
                      id="monetizationReadiness"
                      value={strategy.monetizationReadiness || ''}
                      onChange={(e) => onChange('monetizationReadiness', e.target.value)}
                      placeholder="Ej: 7/10. Me siento confiado en mis habilidades y conozco el problema que puedo resolver, pero todavía necesito validar mi nicho con más interacciones."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="monetizationObstacles">¿Cuál crees que es tu mayor obstáculo para monetizar tu marca personal?</Label>
                    <Textarea 
                      id="monetizationObstacles"
                      value={strategy.monetizationObstacles || ''}
                      onChange={(e) => onChange('monetizationObstacles', e.target.value)}
                      placeholder="Ej: Mi principal obstáculo es encontrar tiempo para crear contenido consistente mientras trabajo en mi empleo actual."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="monetizationExpertise">¿Qué interés, experiencia o habilidad única aprovecharás que la gente estaría dispuesta a pagarte?</Label>
                    <Textarea 
                      id="monetizationExpertise"
                      value={strategy.monetizationExpertise || ''}
                      onChange={(e) => onChange('monetizationExpertise', e.target.value)}
                      placeholder="Ej: Mi experiencia en simplificar sistemas complejos de marketing para pequeños negocios y obtener resultados rápidos con presupuestos limitados."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Ejercicio 2: Tu valor</h3>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="problemToSolve">¿Qué problema mencionado anteriormente resolverás para tus clientes?</Label>
                    <Textarea 
                      id="problemToSolve"
                      value={strategy.problemToSolve || ''}
                      onChange={(e) => onChange('problemToSolve', e.target.value)}
                      placeholder="Ej: La incapacidad para generar ventas consistentes a través de su contenido, lo que resulta en ingresos inestables."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="solutionDifferentiation">¿Cómo difiere tu solución de lo que ya está disponible?</Label>
                    <Textarea 
                      id="solutionDifferentiation"
                      value={strategy.solutionDifferentiation || ''}
                      onChange={(e) => onChange('solutionDifferentiation', e.target.value)}
                      placeholder="Ej: Mi método se enfoca en crear menos contenido pero más estratégico, en lugar de abrumar a los creadores con calendarios imposibles de mantener."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="transformation">¿Qué transformación puedes ayudar a las personas a lograr?</Label>
                    <Textarea 
                      id="transformation"
                      value={strategy.transformation || ''}
                      onChange={(e) => onChange('transformation', e.target.value)}
                      placeholder="Ej: Convertirse en creadores de contenido con ingresos previsibles y crecientes, sin sacrificar su estilo de vida ni trabajar 24/7."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={onSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // Sección 5: Automatización y escalabilidad
  const Automatizacion: React.FC<SectionProps> = ({ strategy, onChange, onSave, saving }) => {
    if (!strategy) return null;
    
    return (
      <div className="space-y-8">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Automatización y Escalabilidad</CardTitle>
              <CardDescription>
                Una vez que hayas validado tu oferta a través del trabajo uno a uno, puedes comenzar a sistematizar y escalar. Esta sección te ayuda a hacer la transición de intercambiar tiempo por dinero a construir sistemas que te permitan ayudar a más personas mientras requieres menos de tu tiempo directo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Ejercicio 1: Plan de desarrollo de producto</h3>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="systemWork">¿Qué trabajo individual estás haciendo actualmente que podría sistematizarse?</Label>
                    <Textarea 
                      id="systemWork"
                      value={strategy.systemWork || ''}
                      onChange={(e) => onChange('systemWork', e.target.value)}
                      placeholder="Ej: Las sesiones de coaching iniciales donde explico los mismos conceptos básicos a cada nuevo cliente."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="coachingPhases">Divide tu proceso de coaching actual en 5 fases:</Label>
                    <Textarea 
                      id="coachingPhases"
                      value={strategy.coachingPhases || ''}
                      onChange={(e) => onChange('coachingPhases', e.target.value)}
                      placeholder="1. Diagnóstico inicial y establecimiento de objetivos\n2. Elaboración de estrategia personalizada\n3. Implementación y primeros ajustes\n4. Optimización basada en resultados\n5. Escalabilidad y automatización"
                      className="mt-1"
                      rows={7}
                    />
                  </div>

                  <div>
                    <Label htmlFor="phaseDetails">Para cada fase, ¿qué temas/lecciones específicas incluirías?</Label>
                    <Textarea 
                      id="phaseDetails"
                      value={strategy.phaseDetails || ''}
                      onChange={(e) => onChange('phaseDetails', e.target.value)}
                      placeholder="Fase 1:\n• Evaluación de la situación actual\n• Identificación de fortalezas y debilidades\n• Definición de KPIs y métricas de éxito\n• Establecimiento de objetivos SMART\n\nFase 2:\n..."
                      className="mt-1"
                      rows={15}
                    />
                  </div>
                </div>
              </div>

              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Ejercicio 2: Automatización de captación de leads</h3>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="leadMagnets">¿Qué recursos podrías crear para atraer leads cualificados?</Label>
                    <Textarea 
                      id="leadMagnets"
                      value={strategy.leadMagnets || ''}
                      onChange={(e) => onChange('leadMagnets', e.target.value)}
                      placeholder="Ej: Un checklist de 'Los 7 elementos que debe tener tu contenido para generar ventas', una mini-clase gratuita sobre 'Cómo crear tu primer funnel de ventas con contenido'..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="callToAction">¿Qué llamada a la acción usarás en tu contenido? (ej. "Envíame DM 'Blueprint' para...")</Label>
                    <Textarea 
                      id="callToAction"
                      value={strategy.callToAction || ''}
                      onChange={(e) => onChange('callToAction', e.target.value)}
                      placeholder="Ej: 'Envíame DM con la palabra ESTRATEGIA para recibir mi guía gratuita sobre cómo convertir tu contenido en clientes'"
                      className="mt-1"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="qualifyingQuestion">¿Qué pregunta calificadora harás después de que reciban tu recurso?</Label>
                    <Textarea 
                      id="qualifyingQuestion"
                      value={strategy.qualifyingQuestion || ''}
                      onChange={(e) => onChange('qualifyingQuestion', e.target.value)}
                      placeholder="Ej: '¿Cuál es tu mayor desafío actualmente para monetizar tu contenido?'"
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Ejercicio 3: Construyendo comunidad</h3>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="communityType">¿Qué tipo de comunidad construirás? (Grupo de Facebook, Discord, Telegram, etc.)</Label>
                    <Input 
                      id="communityType"
                      value={strategy.communityType || ''}
                      onChange={(e) => onChange('communityType', e.target.value)}
                      placeholder="Ej: Grupo privado de Discord para estudiantes y clientes"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="communityValue">¿Qué valor obtendrán los miembros al formar parte de esta comunidad?</Label>
                    <Textarea 
                      id="communityValue"
                      value={strategy.communityValue || ''}
                      onChange={(e) => onChange('communityValue', e.target.value)}
                      placeholder="Ej: Acceso a sesiones de preguntas y respuestas semanales, revisiones de contenido, networking con otros creadores, recursos exclusivos..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="communityRules">¿Qué reglas o directrices comunitarias establecerías?</Label>
                    <Textarea 
                      id="communityRules"
                      value={strategy.communityRules || ''}
                      onChange={(e) => onChange('communityRules', e.target.value)}
                      placeholder="1. No autopromoción sin permiso\n2. Respeto mutuo y apoyo constructivo\n3. Participación activa y aportación de valor"
                      className="mt-1"
                      rows={5}
                    />
                  </div>

                  <div>
                    <Label htmlFor="communityEngagement">¿Con qué frecuencia interactuarías con la comunidad y de qué manera?</Label>
                    <Textarea 
                      id="communityEngagement"
                      value={strategy.communityEngagement || ''}
                      onChange={(e) => onChange('communityEngagement', e.target.value)}
                      placeholder="Ej: Sesiones semanales en vivo de 1 hora, respuestas a preguntas diarias durante 30 minutos, compartir recursos exclusivos dos veces por semana..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={onSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // Plan de acción
  const PlanAccion: React.FC<SectionProps> = ({ strategy, onChange, onSave, saving }) => {
    if (!strategy) return null;
    
    return (
      <div className="space-y-8">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Plan de Acción</CardTitle>
              <CardDescription>
                Ahora que has completado los ejercicios, es hora de crear un plan de acción concreto. Esta sección te ayudará a priorizar tus próximos pasos para implementar tu estrategia de marca personal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Prioridades a corto y medio plazo</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="shortTermPriorities">Top 3 prioridades para los próximos 7 días:</Label>
                    <Textarea 
                      id="shortTermPriorities"
                      value={strategy.shortTermPriorities || ''}
                      onChange={(e) => onChange('shortTermPriorities', e.target.value)}
                      placeholder="1. Crear mi primera pieza de contenido basada en el esquema del ejercicio 6\n2. Configurar mi perfil en la plataforma principal seleccionada\n3. Desarrollar mi primer lead magnet para captar leads"
                      className="mt-1"
                      rows={5}
                    />
                  </div>

                  <div>
                    <Label htmlFor="monthlyPriorities">Top 3 prioridades para los próximos 30 días:</Label>
                    <Textarea 
                      id="monthlyPriorities"
                      value={strategy.monthlyPriorities || ''}
                      onChange={(e) => onChange('monthlyPriorities', e.target.value)}
                      placeholder="1. Publicar 8 piezas de contenido (2 por semana)\n2. Conseguir mis primeros 10 suscriptores/seguidores comprometidos\n3. Validar mi oferta con 3 llamadas de descubrimiento gratuitas"
                      className="mt-1"
                      rows={5}
                    />
                  </div>

                  <div>
                    <Label htmlFor="quarterlyGoals">Top 3 objetivos para los próximos 90 días:</Label>
                    <Textarea 
                      id="quarterlyGoals"
                      value={strategy.quarterlyGoals || ''}
                      onChange={(e) => onChange('quarterlyGoals', e.target.value)}
                      placeholder="1. Alcanzar 100 seguidores/suscriptores comprometidos\n2. Conseguir mis primeros 3 clientes de pago\n3. Crear un sistema para la producción consistente de contenido"
                      className="mt-1"
                      rows={5}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={onSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Estrategia de Contenido</h1>
        <p className="text-muted-foreground mt-2">
          Basado en Personal Brand Thesis, este plan te ayudará a construir una marca personal rentable que atraiga a la audiencia adecuada y convierta seguidores en clientes.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Cargando tu estrategia...</span>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-250px)]">
          <Tabs defaultValue="fundamentos" className="w-full" onValueChange={setActiveTab} value={activeTab}>
            <div className="flex justify-center mb-6">
              <TabsList className="grid w-full max-w-4xl grid-cols-6">
                <TabsTrigger value="fundamentos" className="text-xs sm:text-sm">
                  1. Fundamentos
                </TabsTrigger>
                <TabsTrigger value="micro-brand" className="text-xs sm:text-sm">
                  2. Micro Brand
                </TabsTrigger>
                <TabsTrigger value="estrategia" className="text-xs sm:text-sm">
                  3. Contenido
                </TabsTrigger>
                <TabsTrigger value="monetizacion" className="text-xs sm:text-sm">
                  4. Monetización
                </TabsTrigger>
                <TabsTrigger value="automatizacion" className="text-xs sm:text-sm">
                  5. Automatización
                </TabsTrigger>
                <TabsTrigger value="plan" className="text-xs sm:text-sm">
                  Plan de Acción
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="fundamentos">
              <Fundamentos strategy={strategy} onChange={handleChange} onSave={saveStrategy} saving={saving} />
            </TabsContent>
            
            <TabsContent value="micro-brand">
              <MicroPersonalBrand strategy={strategy} onChange={handleChange} onSave={saveStrategy} saving={saving} />
            </TabsContent>
            
            <TabsContent value="estrategia">
              <EstrategiaContenidoTab strategy={strategy} onChange={handleChange} onSave={saveStrategy} saving={saving} />
            </TabsContent>
            
            <TabsContent value="monetizacion">
              <Monetizacion strategy={strategy} onChange={handleChange} onSave={saveStrategy} saving={saving} />
            </TabsContent>
            
            <TabsContent value="automatizacion">
              <Automatizacion strategy={strategy} onChange={handleChange} onSave={saveStrategy} saving={saving} />
            </TabsContent>
            
            <TabsContent value="plan">
              <PlanAccion strategy={strategy} onChange={handleChange} onSave={saveStrategy} saving={saving} />
            </TabsContent>
          </Tabs>
        </ScrollArea>
      )}

      <div className="mt-8 flex justify-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => {
            const currentIndex = ["fundamentos", "micro-brand", "estrategia", "monetizacion", "automatizacion", "plan"].indexOf(activeTab);
            if (currentIndex > 0) {
              setActiveTab(["fundamentos", "micro-brand", "estrategia", "monetizacion", "automatizacion", "plan"][currentIndex - 1]);
            }
          }}
          disabled={activeTab === "fundamentos"}
        >
          Sección anterior
        </Button>
        
        <Button 
          onClick={() => {
            const currentIndex = ["fundamentos", "micro-brand", "estrategia", "monetizacion", "automatizacion", "plan"].indexOf(activeTab);
            if (currentIndex < 5) {
              setActiveTab(["fundamentos", "micro-brand", "estrategia", "monetizacion", "automatizacion", "plan"][currentIndex + 1]);
            }
          }}
          disabled={activeTab === "plan"}
        >
          Siguiente sección
        </Button>
      </div>
    </div>
  );
};

export default EstrategiaContenido;