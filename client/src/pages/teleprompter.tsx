import { useState, useRef, useEffect } from "react";
import { User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  MoveUp, 
  MoveDown, 
  SlidersHorizontal,
  Upload, 
  Keyboard,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { VideoIdeaContent } from "@/lib/openai";
import { apiRequest } from "@/lib/queryClient";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedCard } from "@/components/ui/animated-card";
import { AnimatedText } from "@/components/ui/animated-text";

interface TeleprompterProps {
  user: User | null;
}

export default function Teleprompter({ user }: TeleprompterProps) {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [text, setText] = useState<string>("");
  const [scrollSpeed, setScrollSpeed] = useState<number>(50); // 1-100
  const [fontSize, setFontSize] = useState<number>(48);
  const [textColor, setTextColor] = useState<string>("#ffffff");
  const [backgroundColor, setBackgroundColor] = useState<string>("#000000");
  const [isMirrored, setIsMirrored] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [savedScripts, setSavedScripts] = useState<{id: number, title: string, content: string}[]>([]);
  
  const prompterRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll speed conversion (user-friendly 1-100 to ms between movements)
  const getActualScrollSpeed = () => {
    // Convert 1-100 to scroll interval (100ms to 10ms), lower is faster
    return 110 - scrollSpeed;
  };

  // Fetch user's saved scripts on load
  useEffect(() => {
    if (user) {
      loadSavedScripts();
    }
  }, [user]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle play/pause with spacebar
      if (e.code === "Space" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        setIsRunning(prev => !prev);
      }

      // Increase speed with up arrow
      if (e.code === "ArrowUp" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        setScrollSpeed(prev => Math.min(prev + 5, 100));
      }

      // Decrease speed with down arrow
      if (e.code === "ArrowDown" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        setScrollSpeed(prev => Math.max(prev - 5, 1));
      }

      // Toggle controls with C key
      if (e.code === "KeyC" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        setShowControls(prev => !prev);
      }

      // Reset with R key
      if (e.code === "KeyR" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        resetPrompter();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle scrolling
  useEffect(() => {
    if (isRunning) {
      const scrollInterval = getActualScrollSpeed(); // ms between scroll moves
      
      const scroll = () => {
        if (!prompterRef.current || !containerRef.current) return;
        
        const currentScroll = containerRef.current.scrollTop;
        const maxScroll = containerRef.current.scrollHeight - containerRef.current.clientHeight;
        
        // If we reached the end, stop scrolling
        if (currentScroll >= maxScroll) {
          setIsRunning(false);
          return;
        }
        
        containerRef.current.scrollTop += 1;
        
        timeoutRef.current = setTimeout(scroll, scrollInterval);
      };
      
      timeoutRef.current = setTimeout(scroll, getActualScrollSpeed());
      
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [isRunning, scrollSpeed]);

  // Load saved scripts from API
  const loadSavedScripts = async () => {
    if (!user) return;
    
    try {
      const response = await apiRequest("GET", "/api/video-ideas");
      
      if (!response.ok) {
        throw new Error("Failed to load scripts");
      }
      
      const data = await response.json();
      
      // Process scripts - extract full script content where available
      const scripts = data.map((idea: { id: number, title: string, content: any }) => {
        const content = idea.content;
        let scriptText = "";
        
        if (content.fullScript) {
          // If fullScript is an object, join all sections
          if (typeof content.fullScript === 'object') {
            scriptText = Object.values(content.fullScript).join("\n\n");
          } else {
            scriptText = content.fullScript;
          }
        } else if (content.outline) {
          // Fall back to outline
          scriptText = content.outline.join("\n\n");
        }
        
        return {
          id: idea.id,
          title: idea.title,
          content: scriptText
        };
      }).filter((script) => script.content.trim().length > 0);
      
      setSavedScripts(scripts);
    } catch (error) {
      console.error("Error loading scripts:", error);
      toast({
        title: "Error al cargar scripts",
        description: "No se pudieron cargar tus scripts guardados.",
        variant: "destructive",
      });
    }
  };

  // Load a script into the teleprompter
  const loadScript = (scriptContent: string) => {
    setText(scriptContent);
    resetPrompter();
  };

  // Reset the teleprompter to the top
  const resetPrompter = () => {
    setIsRunning(false);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  };

  // La función de grabación ha sido eliminada

  // Upload a script file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setText(content || "");
      resetPrompter();
    };
    reader.readAsText(file);
    
    // Reset the input so the same file can be uploaded again
    e.target.value = "";
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-heading">Teleprompter</h1>
          <p className="mt-2 text-muted-foreground">
            Lee tu guión mientras grabas tu video
          </p>
        </div>
        
        {/* Main Teleprompter Area */}
        <div className="mb-8">
          <div 
            className="relative overflow-hidden border border-primary/20 rounded-lg bg-black shadow-[0_0_25px_rgba(0,0,0,0.3)] shadow-primary/10"
            style={{ 
              height: "60vh",
              background: `linear-gradient(to bottom, ${backgroundColor}00, ${backgroundColor}, ${backgroundColor}, ${backgroundColor}00)`,
            }}
          >
            {/* Overlay lines effect */}
            <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,_rgba(32,32,32,0.2)_50%,_transparent_100%)_repeat] bg-[length:100%_4px] z-10 pointer-events-none opacity-30"></div>
            
            {/* Text Container */}
            <div 
              ref={containerRef}
              className="h-full overflow-y-auto scrollbar-hide relative z-20" 
              style={{ padding: "15vh 2rem" }}
            >
              <div 
                ref={prompterRef}
                className={`text-center whitespace-pre-wrap ${isMirrored ? "scale-x-[-1] transform-gpu" : ""} transition-all duration-500 ease-in-out animate-fadeIn`}
                style={{ 
                  fontSize: `${fontSize}px`,
                  lineHeight: 1.5,
                  color: textColor,
                  padding: "20vh 0", // Extra padding for smooth scrolling effect
                  textShadow: `0 0 10px ${textColor}40, 0 0 5px ${textColor}30`,
                  fontWeight: 500,
                  fontFamily: "'JetBrains Mono', monospace"
                }}
              >
                {text || "Carga o pega tu guión aquí..."}
              </div>
            </div>
            
            {/* Center marker line with glow */}
            <div className="absolute left-0 right-0 top-1/2 border-t-2 border-primary pointer-events-none z-30 shadow-[0_0_8px_rgba(255,255,255,0.4)] animate-pulse"></div>
            
            {/* Side markers */}
            <div className="absolute left-0 top-1/2 h-6 w-2 bg-primary -translate-y-1/2 animate-pulse"></div>
            <div className="absolute right-0 top-1/2 h-6 w-2 bg-primary -translate-y-1/2 animate-pulse"></div>
          </div>
        </div>
        
        {/* Controls */}
        {showControls && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Script Controls */}
            <Card className="border-primary/20 shadow-lg shadow-primary/5 backdrop-blur-sm overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0 animate-gradient-x"></div>
              <CardHeader className="bg-black/30">
                <CardTitle className="flex items-center gap-2 text-lg font-mono">
                  <Play className="h-5 w-5 text-primary animate-pulse" />
                  Control de Lectura
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-5">
                <div className="flex gap-3">
                  <Button 
                    onClick={() => setIsRunning(!isRunning)} 
                    variant={isRunning ? "destructive" : "default"}
                    className="flex-1 relative overflow-hidden group transition-all duration-300"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 group-hover:via-primary/30 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
                    {isRunning ? (
                      <>
                        <Pause className="mr-2 h-4 w-4" />
                        Pausar
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Iniciar
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={resetPrompter} 
                    variant="outline"
                    className="bg-black/30 border-primary/30 hover:bg-black/50 hover:border-primary/50 transition-all duration-300"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                </div>
                
                <div className="space-y-3 bg-black/20 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="speed" className="text-sm font-medium flex items-center">
                      <span className="mr-2">Velocidad:</span>
                      <span className="font-mono text-primary bg-black/30 px-2 py-0.5 rounded-md">{scrollSpeed}</span>
                    </Label>
                    <div className="flex gap-2">
                      <Button 
                        size="icon" 
                        variant="outline" 
                        onClick={() => setScrollSpeed(Math.max(scrollSpeed - 5, 1))}
                        className="bg-black/30 border-primary/30 h-7 w-7"
                      >
                        <MoveDown className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="outline" 
                        onClick={() => setScrollSpeed(Math.min(scrollSpeed + 5, 100))}
                        className="bg-black/30 border-primary/30 h-7 w-7"
                      >
                        <MoveUp className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <Slider 
                    id="speed" 
                    min={1} 
                    max={100} 
                    step={1} 
                    value={[scrollSpeed]} 
                    onValueChange={(value) => setScrollSpeed(value[0])} 
                    className="cursor-pointer"
                  />
                </div>
                
                <div className="space-y-2 bg-black/20 p-3 rounded-lg">
                  <Label htmlFor="font-size" className="text-sm font-medium flex items-center">
                    <span className="mr-2">Tamaño texto:</span>
                    <span className="font-mono text-primary bg-black/30 px-2 py-0.5 rounded-md">{fontSize}px</span>
                  </Label>
                  <Slider 
                    id="font-size" 
                    min={24} 
                    max={120} 
                    step={2} 
                    value={[fontSize]} 
                    onValueChange={(value) => setFontSize(value[0])} 
                    className="cursor-pointer"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 bg-black/20 p-3 rounded-lg">
                    <Label htmlFor="text-color" className="text-sm font-medium">Color texto</Label>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-md border border-primary/30" style={{ backgroundColor: textColor }}></div>
                      <Input 
                        id="text-color" 
                        type="color" 
                        value={textColor} 
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-full h-8 cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 bg-black/20 p-3 rounded-lg">
                    <Label htmlFor="bg-color" className="text-sm font-medium">Color fondo</Label>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-md border border-primary/30" style={{ backgroundColor: backgroundColor }}></div>
                      <Input 
                        id="bg-color" 
                        type="color" 
                        value={backgroundColor} 
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-full h-8 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 bg-black/20 p-3 rounded-lg">
                  <Switch 
                    id="mirror" 
                    checked={isMirrored} 
                    onCheckedChange={setIsMirrored}
                    className="data-[state=checked]:bg-primary"
                  />
                  <Label htmlFor="mirror" className="text-sm font-medium">Texto espejado (para cristal reflector)</Label>
                </div>
              </CardContent>
            </Card>
            
            {/* Keyboard Shortcuts */}
            <Card className="border-primary/20 shadow-lg shadow-primary/5 backdrop-blur-sm overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0 animate-gradient-x"></div>
              <CardHeader className="bg-black/30">
                <CardTitle className="flex items-center gap-2 text-lg font-mono">
                  <Keyboard className="h-5 w-5 text-primary" />
                  Atajos de Teclado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-5">
                <div className="p-4 bg-black/20 rounded-md text-sm relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
                  <ul className="space-y-3 relative z-10">
                    <li className="flex justify-between items-center group">
                      <span className="group-hover:text-primary transition-colors duration-300">Iniciar/Pausar:</span>
                      <span className="font-mono bg-black/40 px-3 py-1 rounded border border-primary/30 text-primary shadow-sm">Espacio</span>
                    </li>
                    <li className="flex justify-between items-center group">
                      <span className="group-hover:text-primary transition-colors duration-300">Aumentar velocidad:</span>
                      <span className="font-mono bg-black/40 px-3 py-1 rounded border border-primary/30 text-primary shadow-sm">↑</span>
                    </li>
                    <li className="flex justify-between items-center group">
                      <span className="group-hover:text-primary transition-colors duration-300">Disminuir velocidad:</span>
                      <span className="font-mono bg-black/40 px-3 py-1 rounded border border-primary/30 text-primary shadow-sm">↓</span>
                    </li>
                    <li className="flex justify-between items-center group">
                      <span className="group-hover:text-primary transition-colors duration-300">Mostrar/Ocultar controles:</span>
                      <span className="font-mono bg-black/40 px-3 py-1 rounded border border-primary/30 text-primary shadow-sm">C</span>
                    </li>
                    <li className="flex justify-between items-center group">
                      <span className="group-hover:text-primary transition-colors duration-300">Reiniciar:</span>
                      <span className="font-mono bg-black/40 px-3 py-1 rounded border border-primary/30 text-primary shadow-sm">R</span>
                    </li>
                  </ul>
                </div>
                
                <div className="flex items-center space-x-3 bg-black/20 p-3 rounded-lg">
                  <Switch 
                    id="show-controls" 
                    checked={showControls} 
                    onCheckedChange={setShowControls}
                    className="data-[state=checked]:bg-primary"
                  />
                  <Label htmlFor="show-controls" className="text-sm font-medium">Mostrar controles</Label>
                </div>
              </CardContent>
            </Card>
            
            {/* Script Management */}
            <AnimatedCard 
              className="border-primary/20 shadow-lg shadow-primary/5 backdrop-blur-sm overflow-hidden" 
              hoverEffect="glow"
              intensity="medium"
              soundEffect="hover"
              glowColor="rgba(var(--primary), 0.2)"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0 animate-gradient-x"></div>
              <CardHeader className="bg-black/30">
                <CardTitle className="flex items-center gap-2 text-lg font-mono">
                  <SlidersHorizontal className="h-5 w-5 text-primary" />
                  <AnimatedText 
                    text="Gestión de Guiones" 
                    effect="gradient"
                    gradient={{
                      from: "rgba(var(--primary), 0.8)",
                      to: "rgba(var(--foreground), 0.9)",
                      speed: "slow"
                    }}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-5">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-primary/50 rounded-lg blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
                  <div className="relative overflow-hidden rounded-md">
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/60 z-0"></div>
                    <textarea 
                      value={text} 
                      onChange={(e) => setText(e.target.value)} 
                      placeholder="Pega tu guión aquí..."
                      className="w-full h-32 p-4 bg-transparent text-foreground border border-primary/20 resize-none relative z-10 focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-300 rounded-md font-mono"
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/40 to-transparent pointer-events-none z-0"></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative overflow-hidden rounded-md group">
                    <Input
                      id="script-file"
                      type="file"
                      accept=".txt,.md,.json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <AnimatedButton 
                      variant="outline" 
                      onClick={() => document.getElementById("script-file")?.click()}
                      className="w-full bg-black/40 border-primary/30 hover:bg-black/50 hover:border-primary/50 transition-all duration-300"
                      animation="pulse"
                      soundEffect="click"
                      tooltip="Subir un archivo de guión"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>
                      <div className="relative z-10 flex items-center justify-center">
                        <Upload className="mr-2 h-4 w-4 text-primary" />
                        <span className="font-medium">Subir Archivo</span>
                      </div>
                    </AnimatedButton>
                  </div>
                  <AnimatedButton 
                    variant="outline"
                    onClick={() => {
                      setText("");
                      resetPrompter();
                    }}
                    className="w-full bg-black/40 border-primary/30 hover:bg-black/50 hover:border-primary/50 transition-all duration-300"
                    animation="bounce"
                    soundEffect="click"
                    tooltip="Limpiar el guión actual"
                  >
                    <div className="flex items-center justify-center">
                      <span className="font-medium">Limpiar</span>
                    </div>
                  </AnimatedButton>
                </div>
                
                {savedScripts.length > 0 && (
                  <div className="space-y-4 rounded-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-black/60 via-black/80 to-black/60 p-3 border-b border-primary/20">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                        <AnimatedText
                          text="Tus guiones guardados"
                          effect="typewriter"
                          tag="span"
                          className="text-primary font-mono"
                          delay={0.5}
                          duration={1}
                        />
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                      </h3>
                    </div>
                    <div className="max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-track-black/20 bg-black/20 p-3 rounded-b-lg">
                      <ul className="space-y-2">
                        {savedScripts.map((script, index) => (
                          <AnimatedCard
                            key={script.id}
                            hoverEffect="shine"
                            soundEffect="hover"
                            className="bg-black/40 border border-primary/10 rounded-md overflow-hidden"
                            delayed={true}
                            index={index}
                          >
                            <Button 
                              variant="ghost" 
                              className="w-full justify-start truncate transition-all duration-300 rounded-md p-2 h-auto"
                              onClick={() => loadScript(script.content)}
                            >
                              <Keyboard className="mr-2 h-4 w-4 flex-shrink-0 text-primary" />
                              <div className="truncate text-left">
                                <span className="font-medium">{script.title}</span>
                                <span className="text-xs block text-muted-foreground">
                                  {script.content.substring(0, 30)}...
                                </span>
                              </div>
                            </Button>
                          </AnimatedCard>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </AnimatedCard>
          </div>
        )}
      </div>
    </div>
  );
}