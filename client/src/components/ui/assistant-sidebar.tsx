import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, X } from "lucide-react";

export function AssistantSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar el widget de ElevenLabs solo cuando se abra el sidebar
  useEffect(() => {
    if (isOpen && !isLoaded) {
      // Recuperar el elemento existente si ya existe
      const existingWidget = document.querySelector("elevenlabs-convai");
      
      if (existingWidget) {
        const widgetContainer = document.getElementById("assistant-widget-container");
        if (widgetContainer) {
          widgetContainer.appendChild(existingWidget);
          setIsLoaded(true);
        }
      } else {
        // Crear un nuevo widget si no existe
        const widget = document.createElement("elevenlabs-convai");
        widget.setAttribute("agent-id", "6YPMrB0WviNFovX2lyjS");
        
        const widgetContainer = document.getElementById("assistant-widget-container");
        if (widgetContainer) {
          widgetContainer.appendChild(widget);
          setIsLoaded(true);
        }
      }
    }
  }, [isOpen, isLoaded]);

  return (
    <>
      {/* Botón flotante para abrir asistente */}
      {!isOpen && (
        <Button
          className="fixed bottom-4 right-4 rounded-full h-14 w-14 shadow-xl"
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
          <>
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h3 className="text-lg font-heading">Asistente Red Creativa</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div id="assistant-widget-container" className="w-full h-[calc(100%-68px)]">
              {/* El widget de ElevenLabs se insertará aquí */}
            </div>
          </>
        )}
      </div>
    </>
  );
}