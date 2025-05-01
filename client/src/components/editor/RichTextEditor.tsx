import React, { useState, useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Color } from '@tiptap/extension-color';
import { Button } from '@/components/ui/button';
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Link as LinkIcon, Undo, Redo,
  Image as ImageIcon, Wand2
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

interface RichTextEditorProps {
  initialContent?: string;
  onUpdate?: (content: string) => void;
  placeholder?: string;
  onRequestAIAssistance?: (content: string) => Promise<string>;
  readOnly?: boolean;
}

export default function RichTextEditor({
  initialContent = '',
  onUpdate,
  placeholder = 'Comienza a escribir...',
  onRequestAIAssistance,
  readOnly = false
}: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState('');
  const [linkOpen, setLinkOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageOpen, setImageOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      Link.configure({
        openOnClick: true,
        linkOnPaste: true,
      }),
      Image,
      Color,
    ],
    content: initialContent,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      if (onUpdate) {
        onUpdate(editor.getHTML());
      }
    },
  });

  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent);
    }
  }, [initialContent, editor]);

  const handleAIAssist = async () => {
    if (!editor || !onRequestAIAssistance) return;
    
    setIsProcessing(true);
    try {
      const currentContent = editor.getHTML();
      const improvedContent = await onRequestAIAssistance(currentContent);
      editor.commands.setContent(improvedContent);
      setAiDialogOpen(false);
    } catch (error) {
      console.error('Error during AI assistance:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomAIPrompt = async () => {
    if (!editor || !onRequestAIAssistance || !aiPrompt) return;
    
    setIsProcessing(true);
    try {
      const currentContent = editor.getHTML();
      const improvedContent = await onRequestAIAssistance(currentContent);
      editor.commands.setContent(improvedContent);
      setAiPrompt('');
      setAiDialogOpen(false);
    } catch (error) {
      console.error('Error during AI assistance with custom prompt:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const addLink = useCallback(() => {
    if (!editor) return;
    
    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    } else {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    }
    
    setLinkUrl('');
    setLinkOpen(false);
  }, [editor, linkUrl]);

  const addImage = useCallback(() => {
    if (!editor || !imageUrl) return;
    
    editor.chain().focus().setImage({ src: imageUrl }).run();
    setImageUrl('');
    setImageOpen(false);
  }, [editor, imageUrl]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-md">
      {!readOnly && (
        <div className="p-2 border-b flex flex-wrap gap-1 bg-muted/30">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={editor.isActive('bold') ? 'bg-accent' : ''}
                >
                  <Bold className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Negrita</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={editor.isActive('italic') ? 'bg-accent' : ''}
                >
                  <Italic className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Cursiva</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  className={editor.isActive('underline') ? 'bg-accent' : ''}
                >
                  <UnderlineIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Subrayado</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  className={editor.isActive('strike') ? 'bg-accent' : ''}
                >
                  <Strikethrough className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Tachado</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <span className="w-px h-6 bg-border mx-1" />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor.chain().focus().setTextAlign('left').run()}
                  className={editor.isActive({ textAlign: 'left' }) ? 'bg-accent' : ''}
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Alinear a la izquierda</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor.chain().focus().setTextAlign('center').run()}
                  className={editor.isActive({ textAlign: 'center' }) ? 'bg-accent' : ''}
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Centrar</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor.chain().focus().setTextAlign('right').run()}
                  className={editor.isActive({ textAlign: 'right' }) ? 'bg-accent' : ''}
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Alinear a la derecha</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                  className={editor.isActive({ textAlign: 'justify' }) ? 'bg-accent' : ''}
                >
                  <AlignJustify className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Justificar</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <span className="w-px h-6 bg-border mx-1" />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  className={editor.isActive('bulletList') ? 'bg-accent' : ''}
                >
                  <List className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Lista de viñetas</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  className={editor.isActive('orderedList') ? 'bg-accent' : ''}
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Lista numerada</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <span className="w-px h-6 bg-border mx-1" />

          <Popover open={linkOpen} onOpenChange={setLinkOpen}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={editor.isActive('link') ? 'bg-accent' : ''}
                    >
                      <LinkIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>Enlace</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <PopoverContent className="w-80">
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <Label htmlFor="link-url">URL del enlace</Label>
                  <Input
                    id="link-url"
                    placeholder="https://ejemplo.com"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" onClick={addLink}>
                    Aplicar
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Popover open={imageOpen} onOpenChange={setImageOpen}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>Insertar imagen</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <PopoverContent className="w-80">
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <Label htmlFor="image-url">URL de la imagen</Label>
                  <Input
                    id="image-url"
                    placeholder="https://ejemplo.com/imagen.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" onClick={addImage}>
                    Insertar
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <span className="w-px h-6 bg-border mx-1" />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor.chain().focus().undo().run()}
                  disabled={!editor.can().undo()}
                >
                  <Undo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Deshacer</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor.chain().focus().redo().run()}
                  disabled={!editor.can().redo()}
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rehacer</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {onRequestAIAssistance && (
            <>
              <span className="w-px h-6 bg-border mx-1" />
              <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="bg-primary/10 hover:bg-primary/20">
                          <Wand2 className="h-4 w-4 text-primary" />
                        </Button>
                      </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Asistente de IA</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <DialogContent className="sm:max-w-[525px]">
                  <DialogHeader>
                    <DialogTitle>Asistente de IA</DialogTitle>
                    <DialogDescription>
                      Mejora tu contenido con ayuda de inteligencia artificial
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="ai-prompt">Instrucciones para la IA (opcional)</Label>
                        <Textarea
                          id="ai-prompt"
                          placeholder="Dile a la IA lo que quieres mejorar o modificar..."
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          className="min-h-[100px]"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mt-2">
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        className="justify-start text-left"
                        onClick={handleAIAssist}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Wand2 className="mr-2 h-4 w-4" />
                        )}
                        Mejorar mi texto automáticamente
                      </Button>
                      
                      <Button 
                        variant="default"
                        onClick={handleCustomAIPrompt}
                        disabled={isProcessing || !aiPrompt.trim()}
                      >
                        {isProcessing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Wand2 className="mr-2 h-4 w-4" />
                        )}
                        Aplicar mis instrucciones
                      </Button>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAiDialogOpen(false)}>
                      Cancelar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      )}
      
      <ScrollArea className="h-[400px] p-4">
        <EditorContent editor={editor} className="prose max-w-none dark:prose-invert" />
      </ScrollArea>
    </div>
  );
}