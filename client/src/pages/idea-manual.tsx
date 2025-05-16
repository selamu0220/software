import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Save,
  Loader2,
  Eye,
  Copy,
  Check,
  Share2,
  Clock,
  FileText,
  List,
  GitBranch,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type SectionType = {
  title: string;
  content: string;
  time?: string;
};

export default function IdeaManual() {
  const [match, params] = useRoute("/idea-manual/:id?");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Estado para el documento
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Tutorial");
  const [subcategory, setSubcategory] = useState("General");
  const [videoLength, setVideoLength] = useState("10-15 minutos");
  const [isPublic, setIsPublic] = useState(false);
  const [customURL, setCustomURL] = useState("");
  const [sections, setSections] = useState<SectionType[]>([
    { title: "Introducción", content: "", time: "00:00 - 01:00" },
    { title: "Desarrollo", content: "", time: "01:00 - 08:00" },
    { title: "Conclusión", content: "", time: "08:00 - 10:00" }
  ]);
  
  // Otros estados
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  
  // Referencias para guardar automáticamente
  const autoSaveTimeoutRef = useRef<number | null>(null);
  const lastSavedContentRef = useRef<string>("");
  
  // Cargar el documento si estamos editando uno existente
  useEffect(() => {
    const loadDocument = async () => {
      if (!params || !params.id || params.id === "new") {
        return;
      }
      
      setLoading(true);
      
      try {
        const response = await fetch(`/api/video-ideas/${params.id}`);
        if (!response.ok) {
          throw new Error("No se pudo cargar el documento");
        }
        
        const data = await response.json();
        
        setTitle(data.title);
        setCategory(data.category);
        setSubcategory(data.subcategory);
        setVideoLength(data.videoLength);
        setIsPublic(data.isPublic || false);
        
        if (data.slug) {
          setCustomURL(data.slug);
        }
        
        // Cargar las secciones del contenido
        if (data.content && typeof data.content === 'object') {
          if (Array.isArray(data.content.outline)) {
            // Convertir el outline a secciones
            setSections(data.content.outline.map((item: string, index: number) => ({
              title: `Punto ${index + 1}`,
              content: item,
              time: ""
            })));
          } else if (data.content.fullScript && typeof data.content.fullScript === 'object') {
            // Si hay un guión completo estructurado
            const scriptSections = Object.entries(data.content.fullScript).map(
              ([key, value]) => ({
                title: key,
                content: value as string,
                time: data.content.timings && data.content.timings[key] ? data.content.timings[key] as string : ""
              })
            );
            setSections(scriptSections);
          } else {
            // Secciones predeterminadas
            setSections([
              { title: "Introducción", content: data.content.intro || "", time: "00:00 - 01:00" },
              { title: "Desarrollo", content: data.content.outline?.join("\n\n") || "", time: "01:00 - 08:00" },
              { title: "Conclusión", content: data.content.conclusion || "", time: "08:00 - 10:00" }
            ]);
          }
        }
        
        setEditingId(parseInt(params.id));
        lastSavedContentRef.current = JSON.stringify({
          title,
          category,
          subcategory,
          videoLength,
          sections,
          isPublic,
          customURL
        });
        
      } catch (error) {
        console.error("Error al cargar el documento:", error);
        toast({
          title: "Error",
          description: "No se pudo cargar el documento",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadDocument();
  }, [params, toast]);
  
  // Función para agregar una nueva sección
  const addSection = () => {
    setSections([...sections, { title: `Sección ${sections.length + 1}`, content: "", time: "" }]);
  };
  
  // Función para eliminar una sección
  const removeSection = (index: number) => {
    if (sections.length <= 1) {
      toast({
        title: "Error",
        description: "No puedes eliminar todas las secciones",
        variant: "destructive"
      });
      return;
    }
    
    const newSections = [...sections];
    newSections.splice(index, 1);
    setSections(newSections);
  };
  
  // Función para actualizar una sección
  const updateSection = (index: number, field: keyof SectionType, value: string) => {
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], [field]: value };
    setSections(newSections);
    
    // Iniciar el auto-guardado si estamos editando un documento existente
    if (editingId !== null) {
      if (autoSaveTimeoutRef.current) {
        window.clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = window.setTimeout(() => {
        autoSave();
      }, 3000); // Auto-guardar después de 3 segundos de inactividad
    }
  };
  
  // Función para auto-guardar
  const autoSave = async () => {
    if (!editingId) return;
    
    const currentContent = JSON.stringify({
      title,
      category,
      subcategory,
      videoLength,
      sections,
      isPublic,
      customURL
    });
    
    if (currentContent === lastSavedContentRef.current) {
      return; // Evitar guardar si no hay cambios
    }
    
    try {
      const fullScript: Record<string, string> = {};
      const timings: Record<string, string> = {};
      
      sections.forEach((section) => {
        fullScript[section.title] = section.content;
        if (section.time) {
          timings[section.title] = section.time;
        }
      });
      
      const content = {
        fullScript,
        timings,
        outline: sections.map(s => s.content.split('\n')[0]), // Primera línea como resumen
        intro: sections[0]?.content || "",
        conclusion: sections[sections.length - 1]?.content || "",
      };
      
      const payload = {
        title,
        category,
        subcategory,
        videoLength,
        content,
        isPublic,
        slug: customURL || undefined
      };
      
      await apiRequest('PUT', `/api/video-ideas/${editingId}`, payload);
      lastSavedContentRef.current = currentContent;
      
      // Notificación sutil de auto-guardado
      toast({
        title: "Auto-guardado",
        description: "Cambios guardados automáticamente",
        variant: "default"
      });
      
    } catch (error) {
      console.error("Error en auto-guardado:", error);
    }
  };
  
  // Función principal para guardar manualmente
  const saveDocument = async () => {
    if (!title) {
      toast({
        title: "Error",
        description: "El título es obligatorio",
        variant: "destructive"
      });
      return;
    }
    
    setSaving(true);
    
    try {
      const fullScript: Record<string, string> = {};
      const timings: Record<string, string> = {};
      
      sections.forEach((section) => {
        fullScript[section.title] = section.content;
        if (section.time) {
          timings[section.title] = section.time;
        }
      });
      
      const content = {
        fullScript,
        timings,
        outline: sections.map(s => s.content.split('\n')[0]), // Primera línea como resumen
        intro: sections[0]?.content || "",
        conclusion: sections[sections.length - 1]?.content || "",
      };
      
      const payload = {
        title,
        category,
        subcategory,
        videoLength,
        content,
        isPublic,
        slug: customURL || undefined
      };
      
      let response;
      
      if (editingId) {
        // Actualizar documento existente
        response = await apiRequest('PUT', `/api/video-ideas/${editingId}`, payload);
      } else {
        // Crear nuevo documento
        response = await apiRequest('POST', '/api/video-ideas', payload);
      }
      
      const data = await response.json();
      
      // Actualizar caché si es necesario
      queryClient.invalidateQueries({ queryKey: ['/api/video-ideas'] });
      
      toast({
        title: "Éxito",
        description: editingId ? "Documento actualizado" : "Documento creado",
      });
      
      // Actualizar el ID de edición si es un documento nuevo
      if (!editingId) {
        setEditingId(data.id);
        navigate(`/idea-manual/${data.id}`);
      }
      
      lastSavedContentRef.current = JSON.stringify({
        title,
        category,
        subcategory,
        videoLength,
        sections,
        isPublic,
        customURL
      });
      
    } catch (error) {
      console.error("Error al guardar:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el documento",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Función para copiar todo el texto al portapapeles
  const copyToClipboard = () => {
    const fullText = sections
      .map(section => `${section.title}${section.time ? ` (${section.time})` : ''}:\n${section.content}`)
      .join('\n\n');
    
    navigator.clipboard.writeText(fullText)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
          title: "Copiado",
          description: "El texto ha sido copiado al portapapeles",
        });
      })
      .catch(err => {
        console.error("Error al copiar:", err);
        toast({
          title: "Error",
          description: "No se pudo copiar el texto",
          variant: "destructive"
        });
      });
  };
  
  // Generar URL amigable basada en el título
  const generateSlug = () => {
    if (!title) return;
    
    const slug = title
      .toLowerCase()
      .replace(/[áàäâã]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöôõ]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    setCustomURL(slug);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary mr-2" />
        <span>Cargando documento...</span>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 px-4">
      <Helmet>
        <title>{editingId ? `Editar: ${title}` : "Crear nuevo documento"} | Red Creativa Pro</title>
      </Helmet>
      
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/mis-ideas")}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Volver
          </Button>
          <h1 className="text-2xl font-bold">{editingId ? "Editar documento" : "Crear documento manualmente"}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={previewMode ? "default" : "outline"}
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-1"
          >
            <Eye className="w-4 h-4" /> {previewMode ? "Editando" : "Vista previa"}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="flex items-center gap-1"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? "Copiado" : "Copiar texto"}
          </Button>
          
          <Button 
            onClick={saveDocument} 
            disabled={saving}
            className="flex items-center gap-1"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Información básica</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Título del video</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Título del video"
                    className="mt-1"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="category">Categoría</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tutorial">Tutorial</SelectItem>
                        <SelectItem value="Review">Review</SelectItem>
                        <SelectItem value="Gameplay">Gameplay</SelectItem>
                        <SelectItem value="Vlog">Vlog</SelectItem>
                        <SelectItem value="Entrevista">Entrevista</SelectItem>
                        <SelectItem value="Informativo">Informativo</SelectItem>
                        <SelectItem value="Entretenimiento">Entretenimiento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="subcategory">Subcategoría</Label>
                    <Input
                      id="subcategory"
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                      placeholder="Subcategoría"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="videoLength">Duración</Label>
                    <Select value={videoLength} onValueChange={setVideoLength}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Duración aproximada" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Menos de 5 minutos">Menos de 5 minutos</SelectItem>
                        <SelectItem value="5-10 minutos">5-10 minutos</SelectItem>
                        <SelectItem value="10-15 minutos">10-15 minutos</SelectItem>
                        <SelectItem value="15-20 minutos">15-20 minutos</SelectItem>
                        <SelectItem value="20-30 minutos">20-30 minutos</SelectItem>
                        <SelectItem value="Más de 30 minutos">Más de 30 minutos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isPublic"
                      checked={isPublic}
                      onCheckedChange={setIsPublic}
                    />
                    <Label htmlFor="isPublic">Hacer idea pública (visible para todos)</Label>
                  </div>
                  
                  {isPublic && (
                    <div className="flex flex-col space-y-1">
                      <Label htmlFor="customURL">URL personalizada (opcional)</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="customURL"
                          value={customURL}
                          onChange={(e) => setCustomURL(e.target.value)}
                          placeholder="mi-idea-genial"
                          className="flex-1"
                        />
                        <Button variant="outline" size="sm" onClick={generateSlug}>
                          Generar
                        </Button>
                      </div>
                      {customURL && (
                        <p className="text-xs text-muted-foreground">
                          URL: https://redcreativa.pro/ideas/{customURL}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Tabs defaultValue="editor" className="mt-6">
            <TabsList className="mb-4">
              <TabsTrigger value="editor" className="flex items-center gap-1">
                <FileText className="w-4 h-4" /> Editor
              </TabsTrigger>
              <TabsTrigger value="outline" className="flex items-center gap-1">
                <List className="w-4 h-4" /> Esquema
              </TabsTrigger>
              <TabsTrigger value="timings" className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> Tiempos
              </TabsTrigger>
              <TabsTrigger value="flow" className="flex items-center gap-1">
                <GitBranch className="w-4 h-4" /> Flujo
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="editor">
              <div className="space-y-6">
                {sections.map((section, index) => (
                  <Card key={index} className={previewMode ? "bg-muted/50" : ""}>
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {!previewMode ? (
                            <Input
                              value={section.title}
                              onChange={(e) => updateSection(index, "title", e.target.value)}
                              className="max-w-[200px] font-semibold"
                            />
                          ) : (
                            <CardTitle className="text-lg">{section.title}</CardTitle>
                          )}
                          
                          {section.time && (
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                              {section.time}
                            </span>
                          )}
                        </div>
                        
                        {!previewMode && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeSection(index)}
                            className="h-8 w-8 text-destructive"
                          >
                            &times;
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {!previewMode ? (
                        <Textarea
                          value={section.content}
                          onChange={(e) => updateSection(index, "content", e.target.value)}
                          placeholder={`Escribe el contenido de la sección "${section.title}"...`}
                          rows={5}
                          className="font-mono text-sm"
                        />
                      ) : (
                        <div className="whitespace-pre-wrap">
                          {section.content}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                
                {!previewMode && (
                  <Button 
                    variant="outline" 
                    onClick={addSection}
                    className="w-full mt-2"
                  >
                    + Agregar sección
                  </Button>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="outline">
              <Card>
                <CardHeader>
                  <CardTitle>Esquema del video</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-decimal pl-5 space-y-2">
                    {sections.map((section, index) => (
                      <li key={index}>
                        <div className="font-semibold">{section.title}</div>
                        <div className="text-sm text-muted-foreground pl-2">
                          {section.content.split('\n')[0] || 'Sin contenido...'}
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="timings">
              <Card>
                <CardHeader>
                  <CardTitle>Tiempos del video</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sections.map((section, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="font-semibold min-w-[150px]">{section.title}</div>
                        <Input
                          value={section.time || ""}
                          onChange={(e) => updateSection(index, "time", e.target.value)}
                          placeholder="00:00 - 00:00"
                          className="max-w-[180px]"
                        />
                        <div className="text-sm text-muted-foreground flex-1">
                          {section.content.split('\n')[0] || 'Sin contenido...'}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="flow">
              <Card>
                <CardHeader>
                  <CardTitle>Flujo de contenido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center">
                    {sections.map((section, index) => (
                      <div key={index} className="relative">
                        <div className="border border-border rounded-lg p-4 mb-4 w-[300px] text-center">
                          <div className="font-semibold">{section.title}</div>
                          <div className="text-xs text-muted-foreground">{section.time || "Sin tiempo asignado"}</div>
                        </div>
                        {index < sections.length - 1 && (
                          <div className="h-10 w-px bg-border absolute left-1/2 -bottom-3"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Vista previa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold">{title || "Sin título"}</h2>
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md">{category}</span>
                    <span className="text-muted-foreground">{videoLength}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold">Esquema:</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {sections.map((section, index) => (
                      <li key={index}>
                        {section.title} {section.time && <span className="text-xs text-muted-foreground">({section.time})</span>}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {isPublic && (
                  <div className="rounded-md bg-muted p-3 text-sm">
                    <div className="flex items-center mb-2">
                      <Share2 className="w-4 h-4 mr-2" />
                      <span className="font-semibold">URL pública</span>
                    </div>
                    <div className="text-muted-foreground break-all">
                      https://redcreativa.pro/ideas/{customURL || "[sin-url-personalizada]"}
                    </div>
                  </div>
                )}
                
                <div className="rounded-md bg-muted p-3">
                  <h3 className="font-semibold mb-2">Vista previa del contenido:</h3>
                  <div className="text-sm text-muted-foreground">
                    {sections[0]?.content.split('\n')[0] || "Sin contenido de introducción..."}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}