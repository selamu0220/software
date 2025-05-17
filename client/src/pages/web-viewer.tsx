import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function WebViewer() {
  const [match, params] = useRoute("/web-viewer/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [recurso, setRecurso] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

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
      window.open(recurso.externalUrl, "_blank");
    }
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
        <div className="flex justify-between items-center mb-4">
          <div>
            <Button variant="outline" onClick={() => navigate("/recursos")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a recursos
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
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
        
        <Card className="overflow-hidden border-2 border-border">
          <CardContent className="p-0">
            {recurso.externalUrl && (
              <div className="w-full" style={{ height: "calc(100vh - 180px)" }}>
                <iframe 
                  src={recurso.externalUrl}
                  className="w-full h-full border-0"
                  key={`iframe-${refreshCount}`}
                  sandbox="allow-scripts allow-same-origin allow-forms"
                  referrerPolicy="no-referrer"
                  title={recurso.title}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}