import { useState, useEffect } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ImagePlus, Loader2, Tags, Clock } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import slugify from "@/lib/utils/slugify";

// Esquema de validación para el formulario
const blogPostSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres").max(100, "El título no puede exceder los 100 caracteres"),
  slug: z.string().min(5, "El slug debe tener al menos 5 caracteres").max(100, "El slug no puede exceder los 100 caracteres")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "El slug solo puede contener letras minúsculas, números y guiones"),
  excerpt: z.string().min(20, "El extracto debe tener al menos 20 caracteres").max(300, "El extracto no puede exceder los 300 caracteres"),
  content: z.string().min(50, "El contenido debe tener al menos 50 caracteres"),
  coverImage: z.string().url("Ingresa una URL válida para la imagen de portada"),
  categories: z.array(z.number()).min(1, "Selecciona al menos una categoría"),
  tags: z.string().optional(),
  readingTime: z.coerce.number().min(1, "El tiempo de lectura debe ser al menos 1 minuto"),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
  seoTitle: z.string().max(70, "El título SEO no puede exceder los 70 caracteres").optional(),
  seoDescription: z.string().max(160, "La descripción SEO no puede exceder los 160 caracteres").optional(),
});

type BlogPostFormValues = z.infer<typeof blogPostSchema>;

// Función auxiliar para calcular el tiempo de lectura en minutos
function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const wordCount = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

// Componente para crear/editar artículos de blog
export default function BlogEditorPage() {
  const [matchNew] = useRoute("/blog/new");
  const [matchEdit, params] = useRoute<{ id: string }>("/blog/edit/:id");
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  
  const isEditing = matchEdit && params?.id;
  const postId = isEditing ? parseInt(params.id) : null;

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!user) {
      setLocation("/auth");
    }
  }, [user, setLocation]);

  // Consultar categorías disponibles
  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ["/api/blog/categories"],
    queryFn: async () => {
      const response = await fetch("/api/blog/categories");
      if (!response.ok) {
        throw new Error("Error al cargar categorías");
      }
      return await response.json();
    },
  });

  // Si está editando, cargar datos del post
  const { data: postData, isLoading: loadingPost } = useQuery({
    queryKey: ["/api/blog/posts", postId],
    queryFn: async () => {
      if (!postId) return null;
      const response = await fetch(`/api/blog/posts/${postId}`);
      if (!response.ok) {
        throw new Error("Error al cargar el artículo");
      }
      return await response.json();
    },
    enabled: !!postId,
  });

  // Inicializar formulario
  const form = useForm<BlogPostFormValues>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      coverImage: "",
      categories: [],
      tags: "",
      readingTime: 3,
      published: false,
      featured: false,
      seoTitle: "",
      seoDescription: "",
    },
  });

  // Actualizar formulario cuando se cargan los datos del post
  useEffect(() => {
    if (postData) {
      form.reset({
        title: postData.title,
        slug: postData.slug,
        excerpt: postData.excerpt,
        content: postData.content,
        coverImage: postData.coverImage,
        categories: postData.categories?.map((c: any) => c.id) || [],
        tags: postData.tags?.join(", ") || "",
        readingTime: postData.readingTime,
        published: postData.published,
        featured: postData.featured,
        seoTitle: postData.seoTitle || "",
        seoDescription: postData.seoDescription || "",
      });
      setSelectedCategories(postData.categories?.map((c: any) => c.id) || []);
    }
  }, [postData, form]);

  // Generar slug automáticamente al cambiar el título
  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      if (name === "title" && values.title) {
        const generatedSlug = slugify(values.title);
        form.setValue("slug", generatedSlug);
      }
      
      // Actualizar tiempo de lectura cuando cambia el contenido
      if (name === "content" && values.content) {
        const readingTime = calculateReadingTime(values.content);
        form.setValue("readingTime", readingTime);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  // Mutación para crear un nuevo post
  const createMutation = useMutation({
    mutationFn: async (data: BlogPostFormValues) => {
      const response = await apiRequest("POST", "/api/blog/posts", {
        ...data,
        tags: data.tags ? data.tags.split(",").map(tag => tag.trim()) : [],
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Artículo creado",
        description: "El artículo ha sido creado exitosamente",
      });
      setLocation("/blog");
      // Invalidar consultas para actualizar la lista de posts
      queryClient.invalidateQueries({ queryKey: ["/api/blog/posts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear el artículo",
        variant: "destructive",
      });
    },
  });

  // Mutación para actualizar un post existente
  const updateMutation = useMutation({
    mutationFn: async (data: BlogPostFormValues) => {
      if (!postId) throw new Error("ID del post no disponible");
      
      const response = await apiRequest("PUT", `/api/blog/posts/${postId}`, {
        ...data,
        tags: data.tags ? data.tags.split(",").map(tag => tag.trim()) : [],
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Artículo actualizado",
        description: "El artículo ha sido actualizado exitosamente",
      });
      setLocation("/blog");
      // Invalidar consultas para actualizar la lista de posts
      queryClient.invalidateQueries({ queryKey: ["/api/blog/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog/posts", postId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el artículo",
        variant: "destructive",
      });
    },
  });

  // Manejar envío del formulario
  const onSubmit = async (data: BlogPostFormValues) => {
    setIsSubmitting(true);
    
    try {
      if (isEditing) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar selección de categorías
  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        const newCategories = prev.filter(id => id !== categoryId);
        form.setValue("categories", newCategories);
        return newCategories;
      } else {
        const newCategories = [...prev, categoryId];
        form.setValue("categories", newCategories);
        return newCategories;
      }
    });
  };

  if (loadingPost && isEditing) {
    return (
      <div className="container max-w-3xl px-4 py-12 mx-auto">
        <div className="space-y-8">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl px-4 py-12 mx-auto">
      <Link href="/blog">
        <Button variant="ghost" size="sm" className="mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver al blog
        </Button>
      </Link>

      <h1 className="text-3xl font-bold mb-8">
        {isEditing ? "Editar artículo" : "Crear nuevo artículo"}
      </h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Columna principal */}
            <div className="md:col-span-2 space-y-8">
              {/* Título */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Título del artículo"
                        {...field}
                        className="text-lg"
                      />
                    </FormControl>
                    <FormDescription>
                      Un título claro y atractivo para tu artículo.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Slug */}
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="slug-del-articulo"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      La URL amigable del artículo. Se genera automáticamente a partir del título, pero puedes modificarlo.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Extracto */}
              <FormField
                control={form.control}
                name="excerpt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Extracto</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Breve descripción del artículo..."
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      Un breve resumen del artículo que aparecerá en las listas y en los resultados de búsqueda.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contenido */}
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contenido</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Contenido del artículo..."
                        {...field}
                        rows={15}
                        className="font-mono text-sm"
                      />
                    </FormControl>
                    <FormDescription>
                      El contenido principal del artículo. Puedes usar HTML para dar formato.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* URL de la imagen de portada */}
              <FormField
                control={form.control}
                name="coverImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL de la imagen de portada</FormLabel>
                    <FormControl>
                      <div className="flex space-x-2">
                        <Input
                          placeholder="https://ejemplo.com/imagen.jpg"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            // Modal para seleccionar una imagen (implementar en el futuro)
                            toast({
                              title: "Selector de imágenes",
                              description: "Esta función estará disponible próximamente",
                            });
                          }}
                        >
                          <ImagePlus className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      URL de la imagen principal del artículo.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tags */}
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <div className="flex space-x-2">
                        <Input
                          placeholder="seo, marketing, videos"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            // Modal para seleccionar tags (implementar en el futuro)
                            toast({
                              title: "Selector de tags",
                              description: "Esta función estará disponible próximamente",
                            });
                          }}
                        >
                          <Tags className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Palabras clave separadas por comas.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Columna de configuración */}
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Publicación</CardTitle>
                  <CardDescription>
                    Configurar opciones de publicación
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Categorías */}
                  <div>
                    <FormLabel className="block mb-2">Categorías</FormLabel>
                    {loadingCategories ? (
                      <div className="space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {categories?.map((category: any) => (
                          <div key={category.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`category-${category.id}`}
                              checked={selectedCategories.includes(category.id)}
                              onCheckedChange={() => handleCategorySelect(category.id)}
                            />
                            <label
                              htmlFor={`category-${category.id}`}
                              className="text-sm cursor-pointer"
                            >
                              {category.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                    {form.formState.errors.categories && (
                      <p className="text-sm text-destructive mt-2">
                        {form.formState.errors.categories.message}
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* Tiempo de lectura */}
                  <FormField
                    control={form.control}
                    name="readingTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          Tiempo de lectura (minutos)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={60}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  {/* Publicado */}
                  <FormField
                    control={form.control}
                    name="published"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel>Publicado</FormLabel>
                          <FormDescription>
                            Marcar como publicado para hacerlo visible al público.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Destacado */}
                  <FormField
                    control={form.control}
                    name="featured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel>Destacado</FormLabel>
                          <FormDescription>
                            Mostrar este artículo en secciones destacadas.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* SEO */}
              <Card>
                <CardHeader>
                  <CardTitle>SEO</CardTitle>
                  <CardDescription>
                    Optimización para motores de búsqueda
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Título SEO */}
                  <FormField
                    control={form.control}
                    name="seoTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título SEO</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Título para SEO"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value?.length || 0}/70 caracteres
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Descripción SEO */}
                  <FormField
                    control={form.control}
                    name="seoDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción SEO</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descripción para SEO"
                            {...field}
                            rows={3}
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value?.length || 0}/160 caracteres
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Botones de acción */}
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/blog")}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-[120px]"
                >
                  {isSubmitting && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {isEditing ? "Actualizar" : "Publicar"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}