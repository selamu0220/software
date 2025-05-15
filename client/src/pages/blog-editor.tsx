import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Check, Loader2, Save, X, Tag } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { slugify } from "@/lib/utils/slugify";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

// Esquema de validación para el formulario de blog
const blogPostSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres").max(100, "El título es demasiado largo"),
  slug: z.string().min(5, "La URL debe tener al menos 5 caracteres").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "La URL solo puede contener letras minúsculas, números y guiones"),
  content: z.string().min(50, "El contenido debe tener al menos 50 caracteres"),
  excerpt: z.string().max(200, "El extracto no puede tener más de 200 caracteres").min(10, "El extracto debe tener al menos 10 caracteres"),
  coverImage: z.string().url("Debe ser una URL válida").default("https://via.placeholder.com/1200x630?text=Red+Creativa+Pro"),
  featuredImage: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
  seoTitle: z.string().max(60, "El título SEO no debe exceder los 60 caracteres").optional().or(z.literal("")),
  seoDescription: z.string().max(160, "La descripción SEO no debe exceder los 160 caracteres").optional().or(z.literal("")),
  categoryIds: z.array(z.number()).optional(),
  tags: z.array(z.string()).default(["edición", "vídeo", "youtube"]),
  readingTime: z.number().min(1).default(1),
});

type BlogPostFormValues = z.infer<typeof blogPostSchema>;

// Determina el tiempo de lectura aproximado en minutos
function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const wordCount = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

export default function BlogEditorPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSlugEdited, setIsSlugEdited] = useState(false);
  const isEditing = Boolean(id);

  // Redirigir si no hay usuario autenticado
  useEffect(() => {
    if (!user) {
      navigate("/login?redirect=/blog/new");
    }
  }, [user, navigate]);

  // Obtener datos del post si estamos editando
  const { 
    data: post, 
    isLoading: isLoadingPost,
    error: postError 
  } = useQuery({
    queryKey: ["/api/blog/post", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await fetch(`/api/blog/posts/${id}`);
      if (!res.ok) throw new Error("Error al cargar el artículo");
      return res.json();
    },
    enabled: isEditing && !!id
  });

  // Obtener las categorías del blog
  const { 
    data: categories, 
    isLoading: isLoadingCategories 
  } = useQuery({
    queryKey: ["/api/blog/categories"],
    queryFn: async () => {
      const res = await fetch("/api/blog/categories");
      if (!res.ok) throw new Error("Error al cargar las categorías");
      return res.json();
    }
  });

  // Mutación para crear un post
  const createPostMutation = useMutation({
    mutationFn: async (data: BlogPostFormValues) => {
      const res = await apiRequest("POST", "/api/blog/posts", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog/posts"] });
      toast({
        title: "¡Artículo creado!",
        description: "Tu artículo ha sido creado correctamente.",
      });
      navigate("/blog");
    },
    onError: (error: any) => {
      toast({
        title: "Error al crear el artículo",
        description: error.message || "Ha ocurrido un error. Inténtalo de nuevo más tarde.",
        variant: "destructive",
      });
    }
  });

  // Mutación para actualizar un post
  const updatePostMutation = useMutation({
    mutationFn: async (data: BlogPostFormValues) => {
      const res = await apiRequest("PUT", `/api/blog/posts/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog/post", id] });
      toast({
        title: "¡Artículo actualizado!",
        description: "Tu artículo ha sido actualizado correctamente.",
      });
      navigate("/blog");
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar el artículo",
        description: error.message || "Ha ocurrido un error. Inténtalo de nuevo más tarde.",
        variant: "destructive",
      });
    }
  });

  // Inicializar formulario
  const form = useForm<BlogPostFormValues>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      coverImage: "https://via.placeholder.com/1200x630?text=Red+Creativa+Pro",
      featuredImage: "",
      published: false,
      featured: false,
      seoTitle: "",
      seoDescription: "",
      categoryIds: [],
      tags: ["edición", "vídeo", "youtube"],
      readingTime: 1,
    },
  });

  // Actualizar valores del formulario si estamos editando
  useEffect(() => {
    if (post && isEditing) {
      const categoryIds = post.categories ? post.categories.map(c => c.id) : [];
      
      form.reset({
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt || "",
        coverImage: post.coverImage || "https://via.placeholder.com/1200x630?text=Red+Creativa+Pro",
        featuredImage: post.featuredImage || "",
        published: post.published,
        featured: post.featured || false,
        seoTitle: post.seoTitle || "",
        seoDescription: post.seoDescription || "",
        categoryIds: categoryIds,
        tags: post.tags || ["edición", "vídeo", "youtube"],
        readingTime: post.readingTime || calculateReadingTime(post.content),
      });
      
      // Marcar el slug como editado para evitar que se sobrescriba automáticamente
      setIsSlugEdited(true);
    }
  }, [post, isEditing, form]);

  // Generar slug automático basado en el título si el usuario no lo ha editado manualmente
  const title = form.watch("title");
  
  useEffect(() => {
    if (title && !isSlugEdited) {
      const generatedSlug = slugify(title);
      form.setValue("slug", generatedSlug);
    }
  }, [title, form, isSlugEdited]);

  // Manejar cambios en el slug (marcar como editado manualmente)
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSlugEdited(true);
    form.setValue("slug", e.target.value);
  };

  // Manejar envío del formulario
  const onSubmit = async (data: BlogPostFormValues) => {
    // Calcular automáticamente el tiempo de lectura basado en el contenido
    const readingTime = calculateReadingTime(data.content);
    
    // Preparar los datos con valores actualizados
    const submissionData = {
      ...data,
      readingTime,
      excerpt: data.excerpt || data.content.substring(0, 160) + "...",
      tags: data.tags.length > 0 ? data.tags : ["edición", "vídeo", "youtube"], 
    };
    
    if (isEditing) {
      updatePostMutation.mutate(submissionData);
    } else {
      createPostMutation.mutate(submissionData);
    }
  };

  if (!user) {
    return null; // Ya hay una redirección en el useEffect
  }

  if (isEditing && isLoadingPost) {
    return (
      <div className="container py-8 flex justify-center items-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
        <span className="ml-2">Cargando artículo...</span>
      </div>
    );
  }

  if (isEditing && postError) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            No se pudo cargar el artículo para editar. Por favor, inténtalo de nuevo más tarde.
          </AlertDescription>
        </Alert>
        
        <div className="mt-4">
          <Button variant="outline" onClick={() => navigate("/blog")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al blog
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="outline" onClick={() => navigate("/blog")} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Button>
          <h1 className="text-2xl font-bold">
            {isEditing ? "Editar artículo" : "Nuevo artículo"}
          </h1>
        </div>
        
        <Button 
          onClick={form.handleSubmit(onSubmit)} 
          disabled={createPostMutation.isPending || updatePostMutation.isPending}
        >
          {createPostMutation.isPending || updatePostMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar
            </>
          )}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Contenido principal</CardTitle>
              <CardDescription>
                Escribe el contenido de tu artículo
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Escribe un título atractivo" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          El título de tu artículo (5-100 caracteres)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL amigable</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <span className="flex items-center px-3 bg-secondary rounded-l-md border border-r-0 border-input">
                              /blog/
                            </span>
                            <Input 
                              className="rounded-l-none"
                              placeholder="url-amigable" 
                              value={field.value}
                              onChange={handleSlugChange}
                              onBlur={field.onBlur}
                              name={field.name}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          La URL de tu artículo (se genera automáticamente, pero puedes personalizarla)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="excerpt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Extracto</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Escribe un breve resumen de tu artículo" 
                            {...field} 
                            rows={3}
                          />
                        </FormControl>
                        <FormDescription>
                          Un breve resumen que aparecerá en la vista previa (máximo 200 caracteres)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contenido</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Escribe el contenido completo de tu artículo..." 
                            {...field} 
                            rows={15}
                            className="font-mono"
                          />
                        </FormControl>
                        <FormDescription>
                          El contenido completo de tu artículo. Acepta formato HTML.
                          {field.value && (
                            <span className="ml-2 text-muted-foreground">
                              Tiempo de lectura estimado: {calculateReadingTime(field.value)} minutos
                            </span>
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Publicación</CardTitle>
              <CardDescription>
                Configura la visibilidad de tu artículo
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <Form {...form}>
                <FormField
                  control={form.control}
                  name="published"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Publicar</FormLabel>
                        <FormDescription>
                          Haz visible tu artículo para todos
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
                
                <FormField
                  control={form.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Destacado</FormLabel>
                        <FormDescription>
                          Mostrar en sección de destacados
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
              </Form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Categorías</CardTitle>
              <CardDescription>
                Asigna categorías a tu artículo
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Form {...form}>
                <FormField
                  control={form.control}
                  name="categoryIds"
                  render={() => (
                    <FormItem>
                      {isLoadingCategories ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : categories?.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No hay categorías disponibles
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {categories?.map((category) => (
                            <FormField
                              key={category.id}
                              control={form.control}
                              name="categoryIds"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={category.id}
                                    className="flex flex-row items-center space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(category.id)}
                                        onCheckedChange={(checked) => {
                                          const currentValue = [...(field.value || [])];
                                          if (checked) {
                                            field.onChange([...currentValue, category.id]);
                                          } else {
                                            field.onChange(currentValue.filter((id) => id !== category.id));
                                          }
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">
                                      {category.name}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>SEO</CardTitle>
              <CardDescription>
                Optimiza tu artículo para buscadores
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Form {...form}>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => {
                      const [newTag, setNewTag] = useState("");
                      
                      // Maneja la adición de etiquetas
                      const handleAddTag = () => {
                        if (newTag.trim() && !field.value.includes(newTag.trim())) {
                          const updatedTags = [...field.value, newTag.trim()];
                          field.onChange(updatedTags);
                          setNewTag("");
                        }
                      };
                      
                      // Maneja la eliminación de etiquetas
                      const handleRemoveTag = (tag: string) => {
                        const updatedTags = field.value.filter(t => t !== tag);
                        field.onChange(updatedTags);
                      };
                      
                      // Maneja el envío con Enter
                      const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      };
                      
                      return (
                        <FormItem>
                          <FormLabel>Etiquetas</FormLabel>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {field.value.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="gap-1 px-3 py-1">
                                {tag}
                                <X 
                                  size={14} 
                                  className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                                  onClick={() => handleRemoveTag(tag)}
                                />
                              </Badge>
                            ))}
                          </div>
                          <div className="flex w-full max-w-sm items-center space-x-2">
                            <Input
                              placeholder="Añadir etiqueta..."
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              onKeyDown={handleKeyDown}
                            />
                            <Button 
                              type="button" 
                              onClick={handleAddTag}
                              disabled={!newTag.trim()}
                              size="sm"
                            >
                              <Tag className="h-4 w-4 mr-1" />
                              Añadir
                            </Button>
                          </div>
                          <FormDescription>
                            Las etiquetas ayudan a clasificar y encontrar tu artículo (edición, vídeo, youtube, etc)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  
                  <FormField
                    control={form.control}
                    name="coverImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Imagen de portada</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://ejemplo.com/imagen.jpg" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          URL de la imagen de portada (1200x630px recomendado)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="featuredImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Imagen destacada (URL)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://ejemplo.com/imagen.jpg" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          URL de la imagen principal (aparecerá en listas y compartir en redes)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="seoTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título SEO</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Título para motores de búsqueda" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Título optimizado para SEO (máximo 60 caracteres)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="seoDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción SEO</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descripción para motores de búsqueda" 
                            {...field} 
                            rows={3}
                          />
                        </FormControl>
                        <FormDescription>
                          Descripción optimizada para SEO (máximo 160 caracteres)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Form>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button 
              onClick={form.handleSubmit(onSubmit)} 
              disabled={createPostMutation.isPending || updatePostMutation.isPending}
              className="w-full"
            >
              {createPostMutation.isPending || updatePostMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar artículo
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}