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
            className="relative overflow-hidden border border-border rounded-lg bg-black"
            style={{ height: "60vh" }}
          >
            {/* Text Container */}
            <div 
              ref={containerRef}
              className="h-full overflow-y-auto scrollbar-hide" 
              style={{ padding: "15vh 2rem" }}
            >
              <div 
                ref={prompterRef}
                className={`text-center whitespace-pre-wrap ${isMirrored ? "scale-x-[-1]" : ""}`}
                style={{ 
                  fontSize: `${fontSize}px`,
                  lineHeight: 1.5,
                  color: textColor,
                  background: backgroundColor,
                  padding: "20vh 0" // Extra padding for smooth scrolling effect
                }}
              >
                {text || "Carga o pega tu guión aquí..."}
              </div>
            </div>
            
            {/* Center marker line */}
            <div className="absolute left-0 right-0 top-1/2 border-t-2 border-primary/30 pointer-events-none"></div>
          </div>
        </div>
        
        {/* Controls */}
        {showControls && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Script Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Play className="h-5 w-5" />
                  Control de Lectura
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setIsRunning(!isRunning)} 
                    variant={isRunning ? "destructive" : "default"}
                    className="flex-1"
                  >
                    {isRunning ? (
                      <>
                        <Pause className="mr-1 h-4 w-4" />
                        Pausar
                      </>
                    ) : (
                      <>
                        <Play className="mr-1 h-4 w-4" />
                        Iniciar
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={resetPrompter} 
                    variant="outline"
                  >
                    <RotateCcw className="mr-1 h-4 w-4" />
                    Reset
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="speed">Velocidad: {scrollSpeed}</Label>
                    <div className="flex gap-2">
                      <Button 
                        size="icon" 
                        variant="outline" 
                        onClick={() => setScrollSpeed(Math.max(scrollSpeed - 5, 1))}
                      >
                        <MoveDown className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="outline" 
                        onClick={() => setScrollSpeed(Math.min(scrollSpeed + 5, 100))}
                      >
                        <MoveUp className="h-4 w-4" />
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
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="font-size">Tamaño texto: {fontSize}px</Label>
                  <Slider 
                    id="font-size" 
                    min={24} 
                    max={120} 
                    step={2} 
                    value={[fontSize]} 
                    onValueChange={(value) => setFontSize(value[0])} 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="text-color">Color texto</Label>
                    <Input 
                      id="text-color" 
                      type="color" 
                      value={textColor} 
                      onChange={(e) => setTextColor(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bg-color">Color fondo</Label>
                    <Input 
                      id="bg-color" 
                      type="color" 
                      value={backgroundColor} 
                      onChange={(e) => setBackgroundColor(e.target.value)} 
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="mirror" 
                    checked={isMirrored} 
                    onCheckedChange={setIsMirrored}
                  />
                  <Label htmlFor="mirror">Texto espejado</Label>
                </div>
              </CardContent>
            </Card>
            
            {/* Recording Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Camera className="h-5 w-5" />
                  Control de Grabación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={toggleRecording} 
                  variant={isRecording ? "destructive" : "default"}
                  className="w-full"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {isRecording ? "Detener Grabación" : "Iniciar Grabación"}
                </Button>
                
                <div className="p-3 bg-muted rounded-md text-sm">
                  <h4 className="font-medium mb-1">Atajos de teclado:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li className="flex justify-between">
                      <span>Iniciar/Pausar:</span>
                      <span className="font-mono bg-background px-2 rounded">Espacio</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Iniciar/Detener grabación:</span>
                      <span className="font-mono bg-background px-2 rounded">{TOGGLE_RECORDING_SHORTCUT}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Aumentar velocidad:</span>
                      <span className="font-mono bg-background px-2 rounded">↑</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Disminuir velocidad:</span>
                      <span className="font-mono bg-background px-2 rounded">↓</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Mostrar/Ocultar controles:</span>
                      <span className="font-mono bg-background px-2 rounded">C</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Reiniciar:</span>
                      <span className="font-mono bg-background px-2 rounded">R</span>
                    </li>
                  </ul>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="show-controls" 
                    checked={showControls} 
                    onCheckedChange={setShowControls} 
                  />
                  <Label htmlFor="show-controls">Mostrar controles</Label>
                </div>
              </CardContent>
            </Card>
            
            {/* Script Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <SlidersHorizontal className="h-5 w-5" />
                  Gestión de Guiones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea 
                  value={text} 
                  onChange={(e) => setText(e.target.value)} 
                  placeholder="Pega tu guión aquí..."
                  className="w-full h-20 p-2 border rounded-md bg-background text-foreground border-border resize-none"
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      id="script-file"
                      type="file"
                      accept=".txt,.md,.json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => document.getElementById("script-file")?.click()}
                      className="w-full"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Subir Archivo
                    </Button>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setText("")}
                    className="w-full"
                  >
                    Limpiar
                  </Button>
                </div>
                
                {savedScripts.length > 0 && (
                  <div className="space-y-2">
                    <Label>Tus guiones guardados</Label>
                    <div className="max-h-32 overflow-y-auto pr-1 space-y-1">
                      {savedScripts.map((script) => (
                        <Button 
                          key={script.id} 
                          variant="ghost" 
                          className="w-full justify-start text-left truncate"
                          onClick={() => loadScript(script.content)}
                        >
                          <Keyboard className="mr-2 h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{script.title}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}