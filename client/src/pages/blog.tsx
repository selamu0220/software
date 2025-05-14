import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { BlogPost } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock, Edit3, PenTool, Plus } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Determina el tiempo de lectura aproximado en minutos
function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const wordCount = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

export default function BlogPage() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Obtener las entradas del blog
  const { 
    data: posts, 
    isLoading: isLoadingPosts,
    error: postsError 
  } = useQuery<BlogPost[], Error>({
    queryKey: ["/api/blog/posts"],
    queryFn: async () => {
      const res = await fetch("/api/blog/posts");
      if (!res.ok) throw new Error("Error al cargar las entradas del blog");
      return res.json();
    }
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

  // Artículos filtrados por categoría (si hay categoría seleccionada)
  const filteredPosts = selectedCategory 
    ? posts?.filter(post => post.categories?.some(c => c.id === parseInt(selectedCategory)))
    : posts;

  if (postsError) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            No se pudieron cargar las entradas del blog. Por favor, inténtalo de nuevo más tarde.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* SEO metadata */}
      <div itemScope itemType="https://schema.org/Blog">
        <meta itemProp="name" content="Blog de Red Creativa Gen - Recursos para Creadores de Contenido" />
        <meta itemProp="description" content="Artículos, tutoriales y consejos para creadores de contenido en YouTube, Instagram y TikTok." />
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Blog</h1>
          <p className="text-muted-foreground mt-2">
            Artículos, tutoriales y consejos para creadores de contenido
          </p>
        </div>
        
        {user && (
          <Button
            onClick={() => navigate("/blog/new")}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Nuevo artículo
          </Button>
        )}
      </div>
      
      {/* Filtro de categorías */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          <Badge 
            variant={selectedCategory === null ? "default" : "outline"}
            className="cursor-pointer hover:bg-primary/90 transition-colors"
            onClick={() => setSelectedCategory(null)}
          >
            Todas
          </Badge>
          
          {isLoadingCategories ? (
            Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-6 w-20 rounded-full" />
            ))
          ) : (
            categories?.map((category) => (
              <Badge
                key={category.id}
                variant={selectedCategory === category.id.toString() ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/90 transition-colors"
                onClick={() => setSelectedCategory(category.id.toString())}
              >
                {category.name}
              </Badge>
            ))
          )}
        </div>
      </div>
      
      {/* Grid de artículos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {isLoadingPosts ? (
          // Skeleton loading state
          Array(6).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-4">
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-6 w-4/5" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-4 w-1/3" />
              </CardFooter>
            </Card>
          ))
        ) : filteredPosts?.length === 0 ? (
          <div className="col-span-full p-8 text-center">
            <p className="text-muted-foreground">
              No hay artículos disponibles en esta categoría.
            </p>
          </div>
        ) : (
          filteredPosts?.map((post) => (
            <Card key={post.id} className="overflow-hidden flex flex-col h-full">
              <div itemScope itemType="https://schema.org/BlogPosting">
                <meta itemProp="headline" content={post.title} />
                <meta itemProp="description" content={post.excerpt || post.title} />
                <meta itemProp="datePublished" content={new Date(post.publishedAt || post.createdAt).toISOString()} />
                {post.author && (
                  <span itemProp="author" itemScope itemType="https://schema.org/Person">
                    <meta itemProp="name" content={post.author.username} />
                  </span>
                )}
              </div>
              
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={post.author?.avatarUrl || ''} />
                    <AvatarFallback>
                      {post.author?.username.substring(0, 2).toUpperCase() || 'RC'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">
                    {post.author?.username || 'Red Creativa'}
                  </span>
                </div>
                
                <CardTitle className="line-clamp-2 text-lg">
                  <Link href={`/blog/${post.slug}`} className="hover:underline">
                    {post.title}
                  </Link>
                </CardTitle>
                
                {post.categories && post.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {post.categories.map(category => (
                      <Badge variant="secondary" key={category.id} className="text-xs">
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardHeader>
              
              <CardContent className="pb-4 flex-grow">
                <p className="line-clamp-3 text-muted-foreground text-sm">
                  {post.excerpt || (post.content && post.content.substring(0, 120) + '...')}
                </p>
              </CardContent>
              
              <CardFooter className="flex justify-between pt-0 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <CalendarIcon size={14} />
                  <span>
                    {post.publishedAt ? 
                      format(new Date(post.publishedAt), 'PP', { locale: es }) : 
                      'Borrador'}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>{calculateReadingTime(post.content || '')} min</span>
                </div>
                
                {user && post.author?.id === user.id && (
                  <Link href={`/blog/edit/${post.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit3 size={14} />
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          ))
        )}
      </div>
      
      {/* Llamada a la acción para escribir */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="flex flex-col md:flex-row items-center justify-between p-6">
          <div className="mb-4 md:mb-0">
            <h3 className="text-xl font-bold mb-2">¿Tienes conocimientos que compartir?</h3>
            <p className="text-muted-foreground">
              Comparte tus consejos y experiencias con la comunidad de creadores
            </p>
          </div>
          
          {user ? (
            <Button 
              onClick={() => navigate("/blog/new")}
              className="flex items-center gap-2"
            >
              <PenTool size={16} />
              Escribir artículo
            </Button>
          ) : (
            <Button 
              onClick={() => navigate("/login?redirect=/blog/new")}
              className="flex items-center gap-2"
            >
              <PenTool size={16} />
              Inicia sesión para escribir
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}