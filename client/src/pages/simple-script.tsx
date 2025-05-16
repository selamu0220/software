import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Copy, Download, PlayCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SimpleScript() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [title, setTitle] = useState("Mi Guión");
  const [sections, setSections] = useState([
    {
      id: "intro",
      title: "Introducción",
      content: "Bienvenidos a mi canal. En este video vamos a hablar sobre...",
      duration: "00:30"
    },
    {
      id: "main1",
      title: "Punto Principal 1",
      content: "El primer punto importante que quiero abordar es...",
      duration: "01:30"
    },
    {
      id: "main2",
      title: "Punto Principal 2",
      content: "En segundo lugar, es importante destacar que...",
      duration: "01:30"
    },
    {
      id: "conclusion",
      title: "Conclusión",
      content: "Para terminar, me gustaría enfatizar que... Si te gustó el video, no olvides suscribirte y darle like.",
      duration: "01:00"
    }
  ]);
  const [activeTab, setActiveTab] = useState("edit");
  const [activeSection, setActiveSection] = useState("intro");

  // Función para actualizar el contenido de una sección
  const updateSectionContent = (id: string, content: string) => {
    setSections(sections.map(section => 
      section.id === id ? { ...section, content } : section
    ));
  };

  // Función para actualizar el título de una sección
  const updateSectionTitle = (id: string, title: string) => {
    setSections(sections.map(section => 
      section.id === id ? { ...section, title } : section
    ));
  };

  // Función para actualizar la duración de una sección
  const updateSectionDuration = (id: string, duration: string) => {
    setSections(sections.map(section => 
      section.id === id ? { ...section, duration } : section
    ));
  };

  // Función para añadir una nueva sección
  const addSection = () => {
    const newSection = {
      id: `section-${Date.now()}`,
      title: "Nueva Sección",
      content: "",
      duration: "01:00"
    };
    
    setSections([...sections, newSection]);
    setActiveSection(newSection.id);
  };

  // Función para eliminar una sección
  const deleteSection = (id: string) => {
    if (sections.length <= 1) {
      toast({
        title: "Error",
        description: "Debe haber al menos una sección en el guión",
        variant: "destructive"
      });
      return;
    }
    
    const newSections = sections.filter(section => section.id !== id);
    setSections(newSections);
    
    // Si eliminamos la sección activa, seleccionamos otra
    if (activeSection === id) {
      setActiveSection(newSections[0].id);
    }
  };

  // Función para copiar todo el guión
  const copyScript = () => {
    const scriptText = sections
      .map(section => `${section.title.toUpperCase()} (${section.duration}):\n${section.content}\n\n`)
      .join("");
    
    navigator.clipboard.writeText(scriptText)
      .then(() => {
        toast({
          title: "Guión copiado",
          description: "El guión ha sido copiado al portapapeles"
        });
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "No se pudo copiar el guión",
          variant: "destructive"
        });
      });
  };

  // Función para descargar el guión como archivo de texto
  const downloadScript = () => {
    const scriptText = sections
      .map(section => `${section.title.toUpperCase()} (${section.duration}):\n${section.content}\n\n`)
      .join("");
    
    const blob = new Blob([scriptText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Calcular la duración total del guión
  const totalDuration = sections.reduce((total, section) => {
    const [minutes, seconds] = section.duration.split(":").map(Number);
    return total + (minutes * 60) + seconds;
  }, 0);
  
  const formattedTotalDuration = `${Math.floor(totalDuration / 60)}:${(totalDuration % 60).toString().padStart(2, "0")}`;

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="text-2xl font-bold mb-1"
              placeholder="Título del guión"
            />
            
            <div className="text-sm text-muted-foreground">
              Duración total estimada: {formattedTotalDuration}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={copyScript}>
            <Copy className="h-4 w-4 mr-2" />
            Copiar
          </Button>
          <Button variant="outline" onClick={downloadScript}>
            <Download className="h-4 w-4 mr-2" />
            Descargar
          </Button>
          <Button variant="default" onClick={() => setActiveTab("teleprompter")}>
            <PlayCircle className="h-4 w-4 mr-2" />
            Teleprompter
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="edit" value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="edit">Editar</TabsTrigger>
          <TabsTrigger value="preview">Vista Previa</TabsTrigger>
          <TabsTrigger value="teleprompter">Teleprompter</TabsTrigger>
        </TabsList>
        
        <TabsContent value="edit" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Lista de secciones */}
            <div className="space-y-2">
              {sections.map(section => (
                <div
                  key={section.id}
                  className={`p-2 rounded-md cursor-pointer ${
                    activeSection === section.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <div className="font-medium line-clamp-1">{section.title}</div>
                  <div className="text-xs opacity-80">{section.duration}</div>
                </div>
              ))}
              
              <Button variant="outline" className="w-full" onClick={addSection}>
                + Añadir Sección
              </Button>
            </div>
            
            {/* Editor de sección activa */}
            <div className="md:col-span-3 space-y-4">
              {sections.map(section => (
                section.id === activeSection && (
                  <div key={section.id} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-3">
                        <label htmlFor="section-title" className="block text-sm font-medium mb-1">
                          Título de la sección
                        </label>
                        <Input
                          id="section-title"
                          value={section.title}
                          onChange={e => updateSectionTitle(section.id, e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label htmlFor="section-duration" className="block text-sm font-medium mb-1">
                          Duración (MM:SS)
                        </label>
                        <Input
                          id="section-duration"
                          value={section.duration}
                          onChange={e => updateSectionDuration(section.id, e.target.value)}
                          placeholder="00:00"
                          className="w-full"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="section-content" className="block text-sm font-medium mb-1">
                        Contenido
                      </label>
                      <Textarea
                        id="section-content"
                        value={section.content}
                        onChange={e => updateSectionContent(section.id, e.target.value)}
                        className="min-h-[200px] font-mono text-sm"
                        placeholder="Escribe el contenido de esta sección..."
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteSection(section.id)}
                      >
                        Eliminar Sección
                      </Button>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {sections.map(section => (
                <div key={section.id} className="border-b border-border pb-4 last:border-0">
                  <h3 className="font-semibold flex items-center justify-between">
                    {section.title}
                    <span className="text-sm text-muted-foreground">{section.duration}</span>
                  </h3>
                  <p className="whitespace-pre-wrap mt-2">{section.content}</p>
                </div>
              ))}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Duración total: {formattedTotalDuration}
              </div>
              <Button variant="outline" onClick={copyScript}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar Guión
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="teleprompter">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Teleprompter - {title}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  Duración: {formattedTotalDuration}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="teleprompter-container border border-border rounded-md p-8 bg-black text-white font-mono text-2xl leading-relaxed min-h-[400px] overflow-y-auto">
                {sections.map((section, index) => (
                  <div key={section.id} className="mb-8">
                    <div className="text-primary mb-4">{section.title.toUpperCase()} ({section.duration})</div>
                    <div className="whitespace-pre-wrap">{section.content}</div>
                    {index < sections.length - 1 && (
                      <div className="border-t border-border my-6 pt-2 text-muted-foreground text-sm">
                        Siguiente sección: {sections[index + 1].title}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Este modo está diseñado para ser leído mientras grabas. Ajusta el texto y tamaño según tus necesidades.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          Los cambios realizados en este guión no se guardarán en la base de datos.
          Asegúrate de copiar o descargar tu guión cuando termines.
        </p>
      </div>
    </div>
  );
}