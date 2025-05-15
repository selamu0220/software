import { Button } from "@/components/ui/button";
import { Star, ExternalLink } from "lucide-react";

export default function TrustpilotBanner() {
  const trustpilotUrl = "https://es.trustpilot.com/review/redcreativa.pro";
  
  return (
    <div className="bg-gradient-to-r from-[#0a3740] to-[#051b20] py-12 border-y border-[#00b67a]/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <div className="flex items-center mb-4">
            {Array(5).fill(null).map((_, i) => (
              <Star key={i} className="h-8 w-8 text-[#00b67a] fill-[#00b67a]" />
            ))}
          </div>
          
          <h2 className="text-3xl font-bold mb-4 text-center">¿Qué opinan nuestros usuarios?</h2>
          
          <p className="text-lg text-center text-muted-foreground mb-8">
            Miles de creadores de contenido ya confían en Red Creativa Pro para impulsar sus canales. 
            Lee sus opiniones o comparte la tuya en Trustpilot.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              size="lg"
              onClick={() => window.open(trustpilotUrl, "_blank")}
              className="bg-[#00b67a] hover:bg-[#00a066] text-white border-none"
            >
              <Star className="mr-2 h-5 w-5 fill-white" />
              Dejar una opinión
            </Button>
            
            <Button 
              size="lg"
              variant="outline"
              onClick={() => window.open(`${trustpilotUrl}#reviews`, "_blank")}
              className="border-[#00b67a] text-[#00b67a] hover:bg-[#00b67a]/10"
            >
              <ExternalLink className="mr-2 h-5 w-5" />
              Ver todas las opiniones
            </Button>
          </div>
          
          {/* Trustpilot widget could be embedded here */}
          <div className="mt-8 w-full">
            <div className="trustpilot-widget" 
                 data-locale="es-ES" 
                 data-template-id="53aa8807dec7e10d38f59f32" 
                 data-businessunit-id="657f479e3c2e7be73f752c01" 
                 data-style-height="150px" 
                 data-style-width="100%" 
                 data-theme="dark">
              <a href={trustpilotUrl} target="_blank" rel="noopener">
                Ver reseñas de Red Creativa Pro en Trustpilot
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}