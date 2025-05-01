import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CalendarCheck, Lightbulb, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { User } from "@shared/schema";
import { GenerationRequest } from "@shared/schema";
import { VideoIdeaContent, MultiGenerationResponse } from "@/lib/openai";

interface WeeklyGeneratorProps {
  user: User | null;
  generationParams: GenerationRequest | null;
  onSuccess: (response: MultiGenerationResponse) => void;
}

export default function WeeklyGenerator({ 
  user, 
  generationParams,
  onSuccess
}: WeeklyGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerateWeekly = async () => {
    if (!user) {
      toast({
        title: "Necesitas iniciar sesión",
        description: "Para generar ideas para toda la semana, debes iniciar sesión",
        variant: "destructive"
      });
      return;
    }

    if (!generationParams) {
      toast({
        title: "Parámetros incompletos",
        description: "Primero completa el formulario de generación de ideas",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Aseguramos que contentType sea "fullScript" para generar guiones completos
      const paramsWithScript = {
        ...generationParams,
        contentType: "fullScript",
        timingDetail: true
      };

      const response = await apiRequest(
        "POST",
        "/api/generate-ideas/week",
        paramsWithScript
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al generar ideas semanales");
      }

      const result = await response.json();
      
      toast({
        title: "¡Plan semanal generado!",
        description: `Se generaron ${result.count} ideas para esta semana`,
      });

      onSuccess(result);
    } catch (error: any) {
      setError(error.message || "Error al generar ideas semanales");
      toast({
        title: "Error",
        description: error.message || "No se pudieron generar las ideas semanales",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!user) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            Plan Semanal de Contenido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">Registrate para crear planes semanales</h3>
            <p className="text-muted-foreground mb-4">
              Todos los usuarios registrados pueden crear un plan completo para toda la semana.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" asChild>
                <a href="/login">Iniciar Sesión</a>
              </Button>
              <Button asChild>
                <a href="/register">Crear Cuenta</a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5" />
          Plan Semanal de Contenido
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="text-center p-4">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary opacity-80" />
          <h3 className="text-lg font-medium mb-2">Genera un plan completo para toda tu semana</h3>
          <p className="text-muted-foreground mb-6">
            Crea 7 ideas para toda la semana, con guiones completos y detalles para cada día. 
            ¡Te ahorrarás horas de planificación!
          </p>
          
          <div className="flex gap-3 justify-center">
            <Button 
              onClick={handleGenerateWeekly} 
              disabled={isGenerating || !generationParams} 
              className="sm:w-auto"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Generando plan...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Plan Personalizado
                </>
              )}
            </Button>

            <Button 
              onClick={async () => {
                try {
                  // Crear parámetros rápidos para generación semanal
                  const quickParams: GenerationRequest = {
                    category: "Gaming",
                    subcategory: "Game Reviews",
                    videoFocus: "Game Reviews sin mostrar la cara",
                    videoLength: "Medium (5-10 min)",
                    templateStyle: "Listicle",
                    contentTone: "Enthusiastic",
                    titleTemplate: "CICLADO DE VIDEOS: Top [Número] Secretos que Nadie te Cuenta sobre [Tema]",
                    contentType: "fullScript",
                    timingDetail: true,
                    useSubcategory: true,
                    customChannelType: "",
                    geminiApiKey: generationParams?.geminiApiKey || "",
                  };
                  
                  // Actualizar los parámetros y ejecutar la generación
                  setIsGenerating(true);
                  setError(null);
                  
                  // Usamos la API para generar ideas semanales
                  const response = await apiRequest("POST", "/api/generate-ideas/week", quickParams);
                  
                  if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || "Error al generar ideas semanales");
                  }
                  
                  const result = await response.json();
                  
                  toast({
                    title: "¡Plan semanal generado!",
                    description: `Se generaron ${result.count} ideas para esta semana`,
                  });
                  
                  onSuccess(result);
                } catch (err: any) {
                  setError(err.message || "Error al generar ideas semanales");
                  toast({
                    title: "Error",
                    description: err.message || "No se pudieron generar las ideas semanales",
                    variant: "destructive"
                  });
                } finally {
                  setIsGenerating(false);
                }
              }}
              disabled={isGenerating} 
              className="sm:w-auto"
              size="lg"
              variant="outline"
            >
              {isGenerating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Generando...
                </>
              ) : (
                <>
                  <CalendarCheck className="mr-2 h-4 w-4" />
                  Plan Rápido (1-clic)
                </>
              )}
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground mt-4">
            Se generará un plan completo con 7 guiones para toda la semana.
            Este proceso puede tardar un minuto.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}