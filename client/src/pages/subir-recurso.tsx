import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  AlertTriangle,
  Check,
  File,
  FileText,
  Loader2,
  MapPin,
  Plus,
  Shield,
  Tag,
  Upload,
  X,
  LucideImage,
  Info,
  Link as LinkIcon,
} from "lucide-react";

// Categorías simplificadas para el formulario
const categorias = [
  { id: 1, name: "IA", slug: "ia" },
  { id: 2, name: "Extensiones", slug: "extensiones" },
  { id: 3, name: "Software", slug: "software" },
  { id: 4, name: "Plugins", slug: "plugins" },
  { id: 5, name: "Tutoriales", slug: "tutoriales" },
  { id: 6, name: "Herramientas", slug: "herramientas" },
];

// Esquema de validación simplificado para el formulario
const formSchema = z.object({
  titulo: z.string().min(3, {
    message: "El título debe tener al menos 3 caracteres",
  }).max(100, {
    message: "El título no puede exceder los 100 caracteres",
  }),
  descripcion: z.string().min(10, {
    message: "La descripción debe tener al menos 10 caracteres",
  }).max(500, {
    message: "La descripción no puede exceder los 500 caracteres",
  }).optional(),
  categoria: z.string({
    required_error: "Por favor selecciona una categoría",
  }),
  enlaceExterno: z.string().url({
    message: "Por favor ingresa una URL válida",
  }).optional().or(z.literal("")),
  esPublico: z.boolean().default(true),
  tags: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function SubirRecursoPage() {
  const [tagsInput, setTagsInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [archivoSubido, setArchivoSubido] = useState<File | null>(null);
  const [imagen, setImagen] = useState<File | null>(null);
  const [imagenPreview, setImagenPreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Configuración del formulario con validación
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: "",
      descripcion: "",
      categoria: "",
      enlaceExterno: "",
      esPublico: true,
      tags: [],
    },
  });
  
  // Función para manejar el cambio de categoría
  const handleCategoriaChange = (value: string) => {
    form.setValue("categoria", value);
  };
  
  // Función para agregar etiquetas
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      
      const tag = tagsInput.trim();
      
      if (tag && !tags.includes(tag) && tags.length < 10) {
        const newTags = [...tags, tag];
        setTags(newTags);
        form.setValue("tags", newTags);
        setTagsInput("");
      }
    }
  };
  
  // Función para eliminar etiquetas
  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    form.setValue("tags", newTags);
  };
  
  // Función para manejar la subida de archivos
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Aquí podrías agregar validación de tamaño o tipo de archivo
      setArchivoSubido(file);
    }
  };
  
  // Función para manejar la subida de imágenes de vista previa
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagen(file);
      
      // Crear vista previa
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagenPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Función para manejar el envío del formulario
  const onSubmit = async (values: FormValues) => {
    setUploading(true);
    
    try {
      // Crear un FormData para enviar archivos
      const formData = new FormData();
      
      // Obtener el ID de la categoría seleccionada
      const categoriaSeleccionada = categorias.find(cat => cat.name === values.categoria);
      
      if (!categoriaSeleccionada) {
        throw new Error('Debes seleccionar una categoría válida');
      }
      
      // Agregar los valores del formulario
      formData.append('titulo', values.titulo);
      if (values.descripcion) formData.append('descripcion', values.descripcion);
      formData.append('categoria', categoriaSeleccionada.slug); // Usar el slug en lugar del nombre
      
      if (values.enlaceExterno) formData.append('enlaceExterno', values.enlaceExterno);
      formData.append('esPublico', values.esPublico.toString());
      
      // Agregar tags como string separado por comas
      if (values.tags && values.tags.length > 0) {
        formData.append('tags', values.tags.join(','));
      }
      
      // Agregar archivos
      if (archivoSubido) {
        formData.append('archivo', archivoSubido);
      }
      
      if (imagen) {
        formData.append('imagen', imagen);
      }
      
      // Enviar a la API
      const response = await fetch('/api/recursos/upload', {
        method: 'POST',
        body: formData,
        // No incluir Content-Type - lo establece automáticamente para multipart/form-data
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al subir el recurso');
      }
      
      const result = await response.json();
      
      toast({
        variant: "default",
        title: "¡Recurso subido con éxito!",
        description: "Tu recurso ha sido enviado y está pendiente de aprobación.",
      });
      
      // Redireccionar a la página de recursos
      setTimeout(() => setLocation("/recursos"), 1500);
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al subir el recurso",
        description: error.message || "Ha ocurrido un error. Por favor, inténtalo de nuevo.",
      });
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Subir Nuevo Recurso</h1>
          <p className="text-muted-foreground">
            Comparte tus recursos con la comunidad de creadores
          </p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Información básica</CardTitle>
                <CardDescription>
                  Proporciona los detalles principales de tu recurso
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="titulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Pack de 50 Transiciones para DaVinci Resolve" {...field} />
                      </FormControl>
                      <FormDescription>
                        Un título claro y descriptivo que explique qué es tu recurso
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="categoria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoría</FormLabel>
                        <Select
                          onValueChange={(value) => handleCategoriaChange(value)}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una categoría" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categorias.map((categoria) => (
                              <SelectItem key={categoria.id} value={categoria.name}>
                                {categoria.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="enlaceExterno"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Enlace (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://ejemplo.com/mi-recurso" {...field} />
                        </FormControl>
                        <FormDescription>
                          URL del recurso o sitio web relacionado
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="descripcion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción breve</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Breve descripción de tu recurso (máximo 500 caracteres)" 
                          {...field} 
                          rows={3}
                        />
                      </FormControl>
                      <FormDescription>
                        Esta descripción aparecerá en las tarjetas de recursos
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="contenido"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contenido detallado (opcional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descripción detallada, instrucciones de uso, características, etc." 
                          {...field} 
                          rows={8}
                        />
                      </FormControl>
                      <FormDescription>
                        Puedes usar formato HTML básico para dar estilo a tu contenido
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Archivos y enlaces</CardTitle>
                <CardDescription>
                  Sube tu recurso o proporciona un enlace externo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <FormLabel>Imagen de vista previa</FormLabel>
                  <div className="mt-2">
                    <div 
                      className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors ${imagenPreview ? 'border-primary' : 'border-border'}`}
                      onClick={() => document.getElementById('imagen-upload')?.click()}
                    >
                      {imagenPreview ? (
                        <div className="relative w-full">
                          <img 
                            src={imagenPreview} 
                            alt="Vista previa" 
                            className="mx-auto max-h-40 object-contain mb-2" 
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-0 right-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setImagen(null);
                              setImagenPreview("");
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <p className="text-sm text-center text-muted-foreground mt-2">
                            {imagen?.name} ({imagen?.size ? Math.round(imagen.size / 1024) : 0} KB)
                          </p>
                        </div>
                      ) : (
                        <>
                          <LucideImage className="h-10 w-10 text-muted-foreground mb-2" />
                          <p className="text-sm text-center text-muted-foreground">
                            Haz clic para subir una imagen de vista previa<br />
                            <span className="text-xs">PNG, JPG o GIF (máx. 2MB)</span>
                          </p>
                        </>
                      )}
                      <input
                        id="imagen-upload"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </div>
                  </div>
                  <FormDescription className="mt-2">
                    Esta imagen será la miniatura de tu recurso
                  </FormDescription>
                </div>
                
                <Separator />
                
                <div>
                  <FormLabel>Archivo del recurso (opcional si proporcionas un enlace externo)</FormLabel>
                  <div className="mt-2">
                    <div 
                      className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors ${archivoSubido ? 'border-primary' : 'border-border'}`}
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      {archivoSubido ? (
                        <div className="relative w-full">
                          <div className="flex items-center justify-center mb-2">
                            <FileText className="h-10 w-10 text-primary" />
                            <Check className="h-5 w-5 text-green-500 ml-2" />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-0 right-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setArchivoSubido(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <p className="text-sm text-center text-muted-foreground">
                            {archivoSubido.name} ({Math.round((archivoSubido.size || 0) / 1024)} KB)
                          </p>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                          <p className="text-sm text-center text-muted-foreground">
                            Haz clic para subir tu archivo<br />
                            <span className="text-xs">ZIP, RAR, PDF, etc. (máx. 100MB)</span>
                          </p>
                        </>
                      )}
                      <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </div>
                  </div>
                  <FormDescription className="mt-2 flex items-center">
                    <Info className="h-4 w-4 mr-1" /> 
                    Todos los archivos se escanean en busca de virus antes de estar disponibles
                  </FormDescription>
                </div>
                
                <Separator />
                
                <FormField
                  control={form.control}
                  name="enlaceExterno"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Enlace externo (opcional si subes un archivo)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="https://ejemplo.com/mi-recurso" {...field} className="pl-10" />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Si tu recurso está alojado en otro sitio, proporciona la URL directa
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="version"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Versión (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 1.0, 2021, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Etiquetas y opciones</CardTitle>
                <CardDescription>
                  Añade etiquetas para mejorar la visibilidad de tu recurso
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <FormLabel>Etiquetas (máximo 10)</FormLabel>
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <Input
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder="Escribe y presiona Enter para añadir etiquetas"
                      disabled={tags.length >= 10}
                    />
                  </div>
                  <FormDescription className="mt-2">
                    Añade palabras clave para ayudar a otros a encontrar tu recurso
                  </FormDescription>
                </div>
                
                <Separator />
                
                <FormField
                  control={form.control}
                  name="esPublico"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Recurso público</FormLabel>
                        <FormDescription>
                          Haz tu recurso visible para todos los usuarios
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <div className="rounded-lg bg-muted/50 p-4 text-sm">
                  <div className="flex items-center mb-2">
                    <Shield className="h-5 w-5 text-primary mr-2" />
                    <h4 className="font-medium">Políticas de contenido</h4>
                  </div>
                  <p className="text-muted-foreground">
                    Al subir cualquier recurso, confirmas que tienes los derechos necesarios sobre el contenido
                    y aceptas nuestras políticas de uso. Los recursos serán revisados antes de ser publicados.
                  </p>
                </div>
                
                <div className="flex justify-between w-full">
                  <Button type="button" variant="outline" onClick={() => setLocation("/recursos")}>
                    Cancelar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" disabled={uploading}>
                        {uploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Subiendo...
                          </>
                        ) : (
                          'Subir recurso'
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Al confirmar, tu recurso será enviado para revisión. Esto puede tardar hasta 48 horas.
                          ¿Deseas continuar?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={form.handleSubmit(onSubmit)} disabled={uploading}>
                          {uploading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Subiendo...
                            </>
                          ) : (
                            'Confirmar y subir'
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  );
}