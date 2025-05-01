import React, { useCallback, useState, useEffect } from 'react';
import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Color from '@tiptap/extension-color';
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Type,
  Heading1,
  Heading2,
  Heading3,
  Undo2,
  Redo2,
  FileText,
  MoveHorizontal,
  LucideSparkles,
  Upload,
  Save,
  Calendar,
  RefreshCcw
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { VideoIdeaContent } from "@/lib/openai";
import { Switch } from "@/components/ui/switch";

interface RichTextEditorProps {
  initialContent?: string;
  placeholder?: string;
  onChange?: (html: string) => void;
  onSave?: (html: string, title: string) => void;
  onAddToCalendar?: (content: VideoIdeaContent) => void;
  readOnly?: boolean;
  videoIdea?: VideoIdeaContent | null;
  geminiApiKey?: string;
}

export const RichTextEditor = ({
  initialContent = '',
  placeholder = 'Empieza a escribir tu contenido...',
  onChange,
  onSave,
  onAddToCalendar,
  readOnly = false,
  videoIdea = null,
  geminiApiKey = ''
}: RichTextEditorProps) => {
  const [title, setTitle] = useState('');
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiOption, setAiOption] = useState('improve');
  const [aiSelectedContent, setAiSelectedContent] = useState('');
  const [updateEntireScript, setUpdateEntireScript] = useState(false);
  const { toast } = useToast();

  // Inicializar el editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
      }),
      Link.configure({
        openOnClick: true,
        linkOnPaste: true,
      }),
      Image.configure({
        allowBase64: true,
      }),
      Color,
    ],
    content: initialContent,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
  });

  // Establecer título y contenido desde idea de video si está disponible
  useEffect(() => {
    if (videoIdea && editor) {
      setTitle(videoIdea.title || '');
      
      // Preparar contenido estructurado con el guión
      let content = '';
      if (videoIdea.fullScript) {
        if (typeof videoIdea.fullScript === 'string') {
          content = videoIdea.fullScript;
        } else {
          // Si el guión está estructurado por secciones
          content = Object.entries(videoIdea.fullScript).map(([section, text]) => {
            return `<h2>${section}</h2><p>${text}</p>`;
          }).join('');
        }
      } else {
        // Formato basado en puntos del esquema
        content = `<h1>${videoIdea.title}</h1>
          <h2>Esquema del video:</h2>
          <ul>
            ${videoIdea.outline.map(point => `<li>${point}</li>`).join('')}
          </ul>
          <h2>Mención a mitad del video:</h2>
          <p>${videoIdea.midVideoMention}</p>
          <h2>Mención al final del video:</h2>
          <p>${videoIdea.endVideoMention}</p>
          <h2>Idea de miniatura:</h2>
          <p>${videoIdea.thumbnailIdea}</p>
          <h2>Pregunta para interacción:</h2>
          <p>${videoIdea.interactionQuestion}</p>`;
      }
      
      editor.commands.setContent(content);
    }
  }, [videoIdea, editor]);

  // Manejar la recuperación de contenido seleccionado para AI
  const getSelectedText = useCallback(() => {
    if (!editor) return '';
    const { from, to } = editor.state.selection;
    return editor.state.doc.textBetween(from, to, ' ');
  }, [editor]);

  // Abrir diálogo AI con el texto seleccionado
  const openAiDialog = useCallback(() => {
    const selectedText = getSelectedText();
    setAiSelectedContent(selectedText);
    setShowAiDialog(true);
  }, [getSelectedText]);

  // Añadir enlace
  const addLink = useCallback(() => {
    if (!editor) return;
    
    if (linkUrl) {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: linkUrl, target: '_blank' })
        .run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .unsetLink()
        .run();
    }
    
    setShowLinkDialog(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  // Añadir imagen
  const addImage = useCallback(() => {
    if (!editor || !imageUrl) return;
    
    editor
      .chain()
      .focus()
      .setImage({ src: imageUrl, alt: 'Imagen insertada' })
      .run();
    
    setShowImageDialog(false);
    setImageUrl('');
  }, [editor, imageUrl]);

  // Generar contenido con IA
  const generateAiContent = useCallback(async () => {
    if (!aiPrompt && !aiSelectedContent) {
      toast({
        title: "Necesitas un prompt",
        description: "Por favor escribe un prompt o selecciona texto para mejorar",
        variant: "destructive"
      });
      return;
    }
    
    setIsAiLoading(true);
    setAiResponse('');
    
    try {
      // Preparar el prompt basado en la opción seleccionada
      let finalPrompt = '';
      
      switch (aiOption) {
        case 'improve':
          finalPrompt = `Mejora el siguiente texto, haciéndolo más atractivo y profesional: ${aiSelectedContent || aiPrompt}`;
          break;
        case 'expand':
          finalPrompt = `Expande el siguiente texto con más detalles y ejemplos: ${aiSelectedContent || aiPrompt}`;
          break;
        case 'shorten':
          finalPrompt = `Resume el siguiente texto manteniendo sus puntos principales: ${aiSelectedContent || aiPrompt}`;
          break;
        case 'rewrite':
          finalPrompt = `Reescribe el siguiente texto con un estilo más persuasivo: ${aiSelectedContent || aiPrompt}`;
          break;
        case 'custom':
          finalPrompt = aiPrompt;
          break;
        default:
          finalPrompt = aiPrompt;
      }
      
      // Realizar petición a la API
      const response = await apiRequest("POST", "/api/ai-assist", { 
        prompt: finalPrompt,
        entireScript: updateEntireScript,
        content: editor?.getHTML() || '',
        geminiApiKey: geminiApiKey,
      });
      
      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      const result = await response.json();
      setAiResponse(result.content);
      
      // Si es una actualización completa, actualizar todo el contenido
      if (updateEntireScript && editor) {
        editor.commands.setContent(result.content);
        setShowAiDialog(false);
        toast({
          title: "Guión actualizado",
          description: "El guión completo ha sido actualizado con IA",
        });
      }
      
    } catch (error) {
      console.error('Error generando contenido con IA:', error);
      toast({
        title: "Error de IA",
        description: error instanceof Error ? error.message : "Hubo un error al generar el contenido",
        variant: "destructive"
      });
    } finally {
      setIsAiLoading(false);
    }
  }, [aiPrompt, aiSelectedContent, aiOption, updateEntireScript, editor, geminiApiKey, toast]);

  // Insertar respuesta de IA
  const insertAiResponse = useCallback(() => {
    if (!editor || !aiResponse) return;
    
    if (aiSelectedContent) {
      // Reemplazar texto seleccionado
      editor.commands.deleteSelection();
    }
    
    editor
      .chain()
      .focus()
      .insertContent(aiResponse)
      .run();
    
    setShowAiDialog(false);
    setAiPrompt('');
    setAiResponse('');
    setAiSelectedContent('');
  }, [editor, aiResponse, aiSelectedContent]);

  // Guardar contenido
  const handleSave = useCallback(() => {
    if (!editor || !onSave) return;
    
    if (!title.trim()) {
      toast({
        title: "Título requerido",
        description: "Por favor añade un título a tu contenido",
        variant: "destructive"
      });
      return;
    }
    
    const html = editor.getHTML();
    onSave(html, title);
  }, [editor, onSave, title, toast]);

  // Añadir al calendario
  const handleAddToCalendar = useCallback(() => {
    if (!videoIdea || !onAddToCalendar) return;
    
    onAddToCalendar(videoIdea);
    
    toast({
      title: "Añadido al calendario",
      description: "El contenido ha sido añadido a tu calendario",
    });
  }, [videoIdea, onAddToCalendar, toast]);

  // Subir imagen desde archivo
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string' && editor) {
        editor
          .chain()
          .focus()
          .setImage({ src: reader.result, alt: file.name })
          .run();
      }
    };
    reader.readAsDataURL(file);
    
    // Limpiar el input
    e.target.value = '';
  }, [editor]);

  if (!editor) {
    return <div>Cargando editor...</div>;
  }

  return (
    <div className="relative border rounded-md shadow-sm">
      {/* Barra de título */}
      <div className="flex items-center p-2 border-b bg-muted/30">
        <div className="flex-1">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título del contenido"
            className="border-none bg-transparent text-lg font-medium"
            disabled={readOnly}
          />
        </div>
        <div className="flex space-x-2">
          {videoIdea && onAddToCalendar && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddToCalendar}
              title="Añadir al calendario"
            >
              <Calendar className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Calendario</span>
            </Button>
          )}
          {onSave && (
            <Button
              size="sm"
              onClick={handleSave}
              title="Guardar contenido"
            >
              <Save className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Guardar</span>
            </Button>
          )}
        </div>
      </div>
      
      {/* Barra de herramientas */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/20">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'bg-muted' : ''}
            title="Negrita"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'bg-muted' : ''}
            title="Cursiva"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive('underline') ? 'bg-muted' : ''}
            title="Subrayado"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={editor.isActive({ textAlign: 'left' }) ? 'bg-muted' : ''}
            title="Alinear a la izquierda"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={editor.isActive({ textAlign: 'center' }) ? 'bg-muted' : ''}
            title="Centrar"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={editor.isActive({ textAlign: 'right' }) ? 'bg-muted' : ''}
            title="Alinear a la derecha"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}
            title="Título 1"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}
            title="Título 2"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={editor.isActive('heading', { level: 3 }) ? 'bg-muted' : ''}
            title="Título 3"
          >
            <Heading3 className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={editor.isActive('paragraph') ? 'bg-muted' : ''}
            title="Párrafo"
          >
            <Type className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'bg-muted' : ''}
            title="Lista de viñetas"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'bg-muted' : ''}
            title="Lista numerada"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setShowLinkDialog(true)}
            className={editor.isActive('link') ? 'bg-muted' : ''}
            title="Insertar enlace"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                title="Insertar imagen"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image-url">URL de imagen</Label>
                  <div className="flex gap-2">
                    <Input
                      id="image-url"
                      placeholder="https://ejemplo.com/imagen.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                    <Button 
                      onClick={addImage}
                      size="sm"
                    >
                      Insertar
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image-upload">O sube un archivo</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Deshacer"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Rehacer"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
          
          {/* Botón de asistencia de IA */}
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            variant="ghost"
            onClick={openAiDialog}
            className="ml-auto"
            title="Asistente de IA"
          >
            <LucideSparkles className="h-4 w-4 mr-1 text-primary" />
            <span className="hidden sm:inline">Asistente IA</span>
          </Button>
        </div>
      )}
      
      {/* Editor de contenido */}
      <div className="p-4 min-h-[300px] max-h-[600px] overflow-y-auto prose prose-sm dark:prose-invert prose-headings:my-2 prose-p:my-2 prose-ul:my-2 prose-li:my-1 max-w-none">
        <EditorContent editor={editor} />
      </div>
      
      {/* BubbleMenu para selección de texto */}
      {!readOnly && editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div className="flex items-center gap-1 p-1 rounded-md shadow-lg bg-background border">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive('bold') ? 'bg-muted' : ''}
            >
              <Bold className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive('italic') ? 'bg-muted' : ''}
            >
              <Italic className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={editor.isActive('underline') ? 'bg-muted' : ''}
            >
              <UnderlineIcon className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowLinkDialog(true)}
              className={editor.isActive('link') ? 'bg-muted' : ''}
            >
              <LinkIcon className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={openAiDialog}
            >
              <LucideSparkles className="h-3 w-3 text-primary" />
            </Button>
          </div>
        </BubbleMenu>
      )}
      
      {/* Diálogo para enlaces */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insertar enlace</DialogTitle>
            <DialogDescription>
              Ingresa la URL donde deseas enlazar
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">
                URL
              </Label>
              <Input
                id="link"
                placeholder="https://ejemplo.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button type="button" variant="secondary" onClick={() => setShowLinkDialog(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={addLink}>
              Insertar enlace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para asistente de IA */}
      <Dialog open={showAiDialog} onOpenChange={setShowAiDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Asistente de IA</DialogTitle>
            <DialogDescription>
              Utiliza la IA para mejorar o generar contenido
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="improve" className="w-full" onValueChange={(value) => setAiOption(value as 'improve' | 'expand' | 'shorten' | 'rewrite' | 'custom')}>
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="improve">Mejorar</TabsTrigger>
              <TabsTrigger value="expand">Expandir</TabsTrigger>
              <TabsTrigger value="shorten">Resumir</TabsTrigger>
              <TabsTrigger value="rewrite">Reescribir</TabsTrigger>
              <TabsTrigger value="custom">Personalizado</TabsTrigger>
            </TabsList>
            
            <div className="mb-4">
              {aiSelectedContent && (
                <Card className="mb-4">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium">Texto seleccionado:</h4>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setAiSelectedContent('')}
                        className="h-7 px-2"
                      >
                        <RefreshCcw className="h-3 w-3 mr-1" />
                        <span className="text-xs">Limpiar</span>
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground max-h-[100px] overflow-y-auto border border-border/50 rounded p-2 bg-muted/10">
                      {aiSelectedContent || "No hay texto seleccionado"}
                    </p>
                  </CardContent>
                </Card>
              )}
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Instrucciones para la IA</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="entire-script"
                        checked={updateEntireScript}
                        onCheckedChange={setUpdateEntireScript}
                      />
                      <Label htmlFor="entire-script" className="text-xs">
                        Actualizar guión completo
                      </Label>
                    </div>
                  </div>
                  <Textarea
                    placeholder={aiOption === 'custom' 
                      ? "Escribe tus instrucciones personalizadas para la IA..." 
                      : "Añade detalles adicionales para esta operación (opcional)..."}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-center mb-4">
              <Button 
                onClick={generateAiContent} 
                disabled={isAiLoading} 
                className="w-full sm:w-auto"
              >
                {isAiLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Generando...
                  </>
                ) : (
                  <>
                    <LucideSparkles className="mr-2 h-4 w-4" />
                    Generar con IA
                  </>
                )}
              </Button>
            </div>
            
            {aiResponse && (
              <div className="space-y-4">
                <Label>Resultado:</Label>
                <div className="border rounded-md p-3 bg-muted/10 max-h-[200px] overflow-y-auto">
                  <div dangerouslySetInnerHTML={{ __html: aiResponse }} />
                </div>
                
                {!updateEntireScript && (
                  <div className="flex justify-end">
                    <Button onClick={insertAiResponse}>
                      Insertar en el editor
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAiDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RichTextEditor;