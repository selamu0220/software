import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Info, Star, Crown, Calendar, Film, Loader2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "wouter";

// Preguntas frecuentes para mostrar en el asistente
const faqItems = [
  {
    question: "¿Qué puedo hacer con Red Creativa?",
    answer: "Red Creativa te ayuda a generar ideas para tus videos de YouTube. Puedes crear ideas individuales, planificar una semana completa o incluso un mes entero (con suscripción Premium)."
  },
  {
    question: "¿Cuántas ideas puedo generar?",
    answer: "En la versión gratuita puedes generar 1 idea diaria y planificar semanalmente. Con Premium tendrás generación ilimitada y planificación mensual."
  },
  {
    question: "¿Cómo funciona la planificación semanal?",
    answer: "Simplemente selecciona una categoría, subcategoría y estilo de contenido. El sistema generará 7 ideas diferentes, una para cada día de la semana."
  },
  {
    question: "¿Qué incluye la versión Premium?",
    answer: "Por solo €4.99/mes o €29.99 para acceso de por vida, obtienes generación ilimitada de ideas y planificación mensual completa."
  },
  {
    question: "¿Las ideas generadas son únicas?",
    answer: "Sí, todas las ideas son creadas mediante IA avanzada que genera contenido único para cada solicitud, adaptado a tus parámetros específicos."
  }
];

// Enlaces rápidos para mostrar en el asistente
const quickLinks = [
  { icon: <Film className="w-4 h-4 mr-2" />, text: "Generar idea", url: "/" },
  { icon: <Calendar className="w-4 h-4 mr-2" />, text: "Calendario", url: "/calendar" },
  { icon: <Crown className="w-4 h-4 mr-2" />, text: "Premium", url: "/subscribe" }
];

export function AssistantSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [view, setView] = useState<'chat' | 'faq'>('chat');
  const [isWidgetLoading, setIsWidgetLoading] = useState(true);

  // Cargar el widget de ElevenLabs solo cuando se abra el sidebar
  useEffect(() => {
    if (isOpen && !isLoaded && view === 'chat') {
      setIsWidgetLoading(true);
      
      // Recuperar el elemento existente si ya existe
      const existingWidget = document.querySelector("elevenlabs-convai");
      
      if (existingWidget) {
        const widgetContainer = document.getElementById("assistant-widget-container");
        if (widgetContainer) {
          widgetContainer.appendChild(existingWidget);
          setIsLoaded(true);
          // Dar tiempo para que se cargue el widget
          setTimeout(() => setIsWidgetLoading(false), 1500);
        }
      } else {
        // Crear un nuevo widget si no existe
        const widget = document.createElement("elevenlabs-convai");
        widget.setAttribute("agent-id", "6YPMrB0WviNFovX2lyjS");
        
        const widgetContainer = document.getElementById("assistant-widget-container");
        if (widgetContainer) {
          widgetContainer.appendChild(widget);
          setIsLoaded(true);
          // Dar tiempo para que se cargue el widget
          setTimeout(() => setIsWidgetLoading(false), 1500);
        }
      }
    }
  }, [isOpen, isLoaded, view]);

  return (
    <>
      {/* Botón flotante para abrir asistente */}
      {!isOpen && (
        <Button
          className="fixed bottom-4 right-4 rounded-full h-14 w-14 shadow-xl bg-primary"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Sidebar del asistente */}
      <div
        className={`fixed right-0 top-0 h-full bg-background border-l border-border z-50 transition-all duration-300 ease-in-out ${
          isOpen ? "w-96" : "w-0 opacity-0"
        }`}
        style={{ boxShadow: isOpen ? "-4px 0 10px rgba(0, 0, 0, 0.2)" : "none" }}
      >
        {isOpen && (
          <div className="flex flex-col h-full">
            {/* Cabecera con título y botones */}
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h3 className="text-lg font-mono font-semibold">Asistente Red Creativa</h3>
              <div className="flex items-center space-x-2">
                <Button
                  variant={view === 'faq' ? "default" : "outline"}
                  size="icon"
                  onClick={() => setView('faq')}
                  className="h-8 w-8 rounded-full"
                  title="Preguntas frecuentes"
                >
                  <Info className="h-4 w-4" />
                </Button>
                <Button
                  variant={view === 'chat' ? "default" : "outline"}
                  size="icon"
                  onClick={() => setView('chat')}
                  className="h-8 w-8 rounded-full"
                  title="Chat con asistente"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 rounded-full"
                  title="Cerrar"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Contenido principal */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {view === 'chat' ? (
                <div id="assistant-widget-container" className="w-full h-full relative">
                  {isWidgetLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background">
                      <Loader2 className="h-8 w-8 animate-spin mb-4" />
                      <p className="text-sm text-muted-foreground">Cargando asistente...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4">
                  {/* Enlaces rápidos */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold mb-3 text-muted-foreground">ENLACES RÁPIDOS</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {quickLinks.map((link, index) => (
                        <Link key={index} href={link.url} className="no-underline">
                          <Button 
                            variant="outline" 
                            className="w-full text-xs h-auto py-2 flex items-center justify-center"
                            onClick={() => setIsOpen(false)}
                          >
                            {link.icon}
                            {link.text}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  </div>
                  
                  {/* Preguntas frecuentes */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3 text-muted-foreground">PREGUNTAS FRECUENTES</h4>
                    <Accordion type="single" collapsible className="w-full">
                      {faqItems.map((faq, index) => (
                        <AccordionItem key={index} value={`faq-${index}`}>
                          <AccordionTrigger className="text-sm font-medium">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-sm text-muted-foreground">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </div>
              )}
            </div>
            
            {/* Pie de página */}
            <div className="border-t border-border p-3 bg-black/5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Beta v0.9.0</span>
                <Button variant="link" size="sm" className="p-0 h-auto">
                  <Star className="h-3 w-3 mr-1 text-yellow-500" />
                  <span className="text-xs">Puntuar</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}