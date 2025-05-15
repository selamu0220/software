import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Helmet } from "react-helmet";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Star, ThumbsUp, ExternalLink } from "lucide-react";

const TestimoniosPage = () => {
  const [isLoading, setIsLoading] = useState(false);

  // URL de Trustpilot para dejar una reseña
  const trustpilotReviewUrl = "https://es.trustpilot.com/evaluate/redcreativa.pro";
  
  // URL para ver todas las reseñas
  const trustpilotAllReviewsUrl = "https://es.trustpilot.com/review/redcreativa.pro";

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Helmet>
        <title>Testimonios | Red Creativa Pro</title>
        <meta name="description" content="Lee las opiniones de otros creadores y comparte tu experiencia con Red Creativa Pro." />
        <meta property="og:title" content="Testimonios | Red Creativa Pro" />
        <meta property="og:description" content="Lee las opiniones de otros creadores y comparte tu experiencia con Red Creativa Pro." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://redcreativa.pro/testimonios" />
      </Helmet>

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-2">Testimonios</h1>
        <p className="text-xl text-muted-foreground">
          Descubre lo que dicen otros creadores sobre Red Creativa Pro
        </p>
      </div>

      <div className="mb-12 bg-black/80 p-8 rounded-lg text-center">
        <h2 className="text-2xl font-bold mb-4">¿Has utilizado Red Creativa Pro?</h2>
        <p className="mb-6 text-lg">Tu opinión nos ayuda a mejorar y a que otros creadores conozcan nuestra plataforma</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            onClick={() => window.open(trustpilotReviewUrl, "_blank")}
            className="bg-[#00b67a] hover:bg-[#00a066] text-white"
          >
            <Star className="mr-2 h-5 w-5" /> Dejar una reseña en Trustpilot
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => window.open(trustpilotAllReviewsUrl, "_blank")}
          >
            <ExternalLink className="mr-2 h-5 w-5" /> Ver todas las reseñas
          </Button>
        </div>
      </div>

      <Separator className="my-8" />

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">
          Trustpilot
        </h2>
        <p className="text-muted-foreground">
          Reseñas verificadas por Trustpilot
        </p>
      </div>

      {/* Widget de Trustpilot */}
      <div className="flex justify-center mb-12">
        <div className="trustpilot-widget" 
             data-locale="es-ES" 
             data-template-id="53aa8807dec7e10d38f59f32" 
             data-businessunit-id="657f479e3c2e7be73f752c01" 
             data-style-height="150px" 
             data-style-width="100%" 
             data-theme="dark">
          <a href="https://es.trustpilot.com/review/redcreativa.pro" target="_blank" rel="noopener">
            Ver reseñas de Red Creativa Pro en Trustpilot
          </a>
        </div>
      </div>

      {/* Widget de Trustpilot - Panel más grande */}
      <div className="mb-12 w-full max-w-4xl mx-auto">
        <div className="trustpilot-widget" 
             data-locale="es-ES" 
             data-template-id="5419b6a8b0d04a076446a9ad" 
             data-businessunit-id="657f479e3c2e7be73f752c01" 
             data-style-height="500px" 
             data-style-width="100%" 
             data-theme="dark">
          <a href="https://es.trustpilot.com/review/redcreativa.pro" target="_blank" rel="noopener">
            Ver reseñas de Red Creativa Pro en Trustpilot
          </a>
        </div>
      </div>

      <div className="text-center">
        <Link href="/" className="text-primary hover:underline">
          Volver a la página principal
        </Link>
      </div>
    </div>
  );
};

export default TestimoniosPage;