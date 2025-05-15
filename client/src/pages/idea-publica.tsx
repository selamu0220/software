import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { VideoIdea } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet";

export default function IdeaPublica() {
  const [, params] = useRoute<{ slug: string }>("/ideas/:slug");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [idea, setIdea] = useState<VideoIdea | null>(null);

  useEffect(() => {
    const fetchIdea = async () => {
      if (!params?.slug) return;
      
      try {
        setLoading(true);
        const response = await apiRequest("GET", `/api/public/video-ideas/${params.slug}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("No se encontró la idea o no es pública");
          } else {
            setError("Error al cargar la idea");
          }
          return;
        }
        
        const data = await response.json();
        setIdea(data);
      } catch (err) {
        console.error("Error fetching public idea:", err);
        setError("Error al cargar la idea");
      } finally {
        setLoading(false);
      }
    };
    
    fetchIdea();
  }, [params?.slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !idea) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>
              {error || "No se pudo cargar la idea solicitada"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              La idea solicitada no existe o no es pública. Intenta con otra URL o contacta al propietario de la idea.
            </p>
            <Button onClick={() => window.location.href = "/"}>
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Contenido de la idea
  const content = idea.content as any;

  return (
    <>
      <Helmet>
        <title>{idea.title} | Ideas de Video | Red Creativa Pro</title>
        <meta name="description" content={`Idea para video de YouTube: ${idea.title}. Incluye estructura, puntos clave y recomendaciones para creadores.`} />
        <meta property="og:title" content={`${idea.title} | Ideas de Video`} />
        <meta property="og:description" content={`Idea para video de YouTube: ${idea.title}. Incluye estructura, puntos clave y recomendaciones para creadores.`} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${window.location.origin}/ideas/${idea.slug}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${idea.title} | Ideas de Video`} />
        <meta name="twitter:description" content={`Idea para video de YouTube: ${idea.title}. Incluye estructura, puntos clave y recomendaciones para creadores.`} />
      </Helmet>
      
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-2 mb-6">
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              {idea.category}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {idea.subcategory}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {idea.videoLength}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold">{idea.title}</h1>
          <p className="text-muted-foreground text-sm">
            Generada: {new Date(idea.createdAt).toLocaleDateString()}
          </p>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Descripción</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{content.description}</p>
          </CardContent>
        </Card>
        
        {content.keypoints && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Puntos clave</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-6 space-y-2">
                {content.keypoints.map((point: string, index: number) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        
        {content.script && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Estructura del video</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {content.script.map((section: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <h3 className="text-lg font-semibold">{section.section}</h3>
                    <p className="whitespace-pre-wrap">{section.content}</p>
                    {index < content.script.length - 1 && <Separator className="my-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {content.tags && content.tags.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Tags recomendados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {content.tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="flex justify-center mt-12">
          <Button
            variant="outline"
            onClick={() => window.location.href = "/"}
            className="mx-auto"
          >
            Explorar más ideas
          </Button>
        </div>
        
        <div className="mt-16 border-t pt-8">
          <p className="text-center text-sm text-muted-foreground">
            Generado con <a href="/" className="font-medium underline">Red Creativa Pro</a>
            <br />
            La plataforma para creadores de contenido que necesitan ideas rápidas y de calidad.
          </p>
        </div>
      </div>
    </>
  );
}