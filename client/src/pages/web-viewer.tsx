import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  ArrowLeft, 
  ExternalLink, 
  RefreshCw, 
  ZoomIn, 
  ZoomOut,
  Maximize,
  Minimize
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function WebViewer() {
  const [match, params] = useRoute("/web-viewer/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [recurso, setRecurso] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Cargar información del recurso
  useEffect(() => {
    const cargarRecurso = async () => {
      if (!params?.id) {
        setError("No se especificó un recurso para visualizar");
        setCargando(false);
        return;
      }
      
      try {
        setCargando(true);
        const response = await fetch(`/api/recursos/${params.id}`);
        if (!response.ok) {
          throw new Error("No se pudo cargar el recurso");
        }
        
        const data = await response.json();
        if (!data.enlaceExterno && data.resourceType !== "webpage") {
          throw new Error("Este recurso no es una página web visualizable");
        }
        
        // Asegurarnos de que hay una URL externa para mostrar
        if (!data.enlaceExterno) {
          throw new Error("Este recurso no tiene un enlace web para visualizar");
        }
        
        // Utilizar enlaceExterno como la URL externa
        setRecurso({
          ...data,
          externalUrl: data.enlaceExterno,
          title: data.titulo || data.title || "Visualizador Web"
        });
      } catch (error) {
        console.error("Error al cargar recurso:", error);
        setError(error instanceof Error ? error.message : "Error al cargar el recurso");
      } finally {
        setCargando(false);
      }
    };
    
    cargarRecurso();
  }, [params?.id]);

  // Función para refrescar el iframe
  const refreshIframe = () => {
    setRefreshCount(prev => prev + 1);
    toast({
      title: "Actualizando...",
      description: "Recargando el contenido de la página web",
    });
  };

  // Función para abrir en una nueva ventana
  const openExternalLink = () => {
    if (recurso?.externalUrl) {
      // Asegurarse de que la URL tenga el protocolo correcto
      const urlToOpen = recurso.externalUrl.startsWith('http') 
        ? recurso.externalUrl 
        : `https://${recurso.externalUrl}`;
      
      window.open(urlToOpen, "_blank");
    }
  };
  
  // Funciones para controlar el zoom
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 200));
    toast({
      title: `Zoom: ${Math.min(zoomLevel + 10, 200)}%`,
      description: "Aumentando el tamaño de visualización",
    });
  };
  
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 50));
    toast({
      title: `Zoom: ${Math.max(zoomLevel - 10, 50)}%`,
      description: "Reduciendo el tamaño de visualización",
    });
  };
  
  const handleZoomReset = () => {
    setZoomLevel(100);
    toast({
      title: "Zoom: 100%",
      description: "Tamaño de visualización restaurado",
    });
  };
  
  // Función para alternar modo pantalla completa
  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
    toast({
      title: isFullscreen ? "Saliendo de pantalla completa" : "Modo pantalla completa",
      description: isFullscreen ? "Volviendo a vista normal" : "Aprovecha toda la pantalla",
    });
  };

  if (cargando) {
    return (
      <div className="container py-8 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="flex items-center justify-center flex-col">
          <RefreshCw size={40} className="animate-spin mb-4 text-primary" />
          <h2 className="text-xl font-medium mb-2">Cargando contenido web...</h2>
          <p className="text-muted-foreground">Esto puede tardar unos momentos</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <div className="bg-destructive/20 p-4 rounded-md mb-4">
          <h2 className="text-xl font-medium mb-2">Error al visualizar el contenido</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <Button onClick={() => navigate("/recursos")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a recursos
        </Button>
      </div>
    );
  }

  if (!recurso) {
    return (
      <div className="container py-8">
        <div className="bg-card p-4 rounded-md mb-4">
          <h2 className="text-xl font-medium mb-2">Recurso no encontrado</h2>
          <p className="text-muted-foreground">No se pudo encontrar el recurso solicitado</p>
        </div>
        <Button onClick={() => navigate("/recursos")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a recursos
        </Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{recurso.title} | Red Creativa</title>
      </Helmet>
      
      <div className="container py-4">
        <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-between md:items-center mb-4">
          <div className="flex flex-col space-y-2">
            <Button variant="outline" onClick={() => navigate("/recursos")} className="w-fit">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a recursos
            </Button>
            
            <h1 className="text-xl font-semibold">
              {recurso.title || "Visualizador Web"}
            </h1>
            {recurso.description && (
              <p className="text-sm text-muted-foreground max-w-2xl">{recurso.description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 mr-2">
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <div className="text-sm font-medium w-14 text-center">{zoomLevel}%</div>
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleZoomReset} className="ml-1">
                <span className="text-xs">100%</span>
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize className="mr-2 h-4 w-4" /> : <Maximize className="mr-2 h-4 w-4" />}
                {isFullscreen ? "Salir" : "Pantalla completa"}
              </Button>
              
              <Button variant="outline" onClick={refreshIframe}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualizar
              </Button>
              
              <Button onClick={openExternalLink}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir en nueva ventana
              </Button>
            </div>
          </div>
        </div>
        
        <Card className={`overflow-hidden border-2 border-border ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
          <CardContent className="p-0">
            {recurso.externalUrl && (
              <div 
                className="w-full" 
                style={{ 
                  height: isFullscreen ? "100vh" : "calc(100vh - 180px)",
                  overflow: "hidden" 
                }}
              >
                <div 
                  style={{ 
                    width: `${zoomLevel}%`, 
                    height: `${zoomLevel}%`,
                    transform: `scale(${100/zoomLevel})`,
                    transformOrigin: "top left",
                    overflow: "hidden"
                  }}
                >
                  <iframe 
                    src={recurso.externalUrl.startsWith('http') 
                        ? recurso.externalUrl 
                        : `https://${recurso.externalUrl}`}
                    className="w-full h-full border-0"
                    key={`iframe-${refreshCount}`}
                    sandbox="allow-scripts allow-same-origin allow-forms"
                    referrerPolicy="no-referrer"
                    title={recurso.title}
                  />
                </div>
              </div>
            )}
          </CardContent>
          {isFullscreen && (
            <Button 
              className="absolute top-2 right-2 z-10" 
              variant="outline" 
              size="sm" 
              onClick={toggleFullscreen}
            >
              <Minimize className="h-4 w-4 mr-2" /> Salir
            </Button>
          )}
        </Card>
      </div>
    </>
  );
}