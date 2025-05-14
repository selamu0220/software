import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Filter,
  Tag,
  ChevronRight,
  ChevronLeft,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";

// Componente de Breadcrumb
function BlogBreadcrumb() {
  return (
    <nav className="flex mb-8" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2">
        <li className="inline-flex items-center">
          <Link href="/">
            <span className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer">
              Inicio
            </span>
          </Link>
        </li>
        <li>
          <div className="flex items-center">
            <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
            <span className="text-sm font-medium text-foreground">Blog</span>
          </div>
        </li>
      </ol>
    </nav>
  );
}

// Skeleton para cargar artículos
function BlogPostSkeleton() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-6 w-full" />
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-2">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </CardFooter>
    </Card>
  );
}

// Listado de artículos de blog
export default function BlogPage() {
  const [location, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const { user } = useAuth();
  
  // Consultar artículos
  const {
    data: posts,
    isLoading: postsLoading,
    error: postsError,
  } = useQuery({
    queryKey: ["/api/blog/posts", page, selectedCategory],
    queryFn: async () => {
      let url = `/api/blog/posts?limit=9&offset=${(page - 1) * 9}`;
      
      // Solo mostrar posts publicados si no estamos en modo admin
      if (!user) {
        url += "&published=true";
      }
      
      // Filtrar por categoría si hay una seleccionada
      if (selectedCategory) {
        url = `/api/blog/categories/${selectedCategory}/posts`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Error al cargar artículos");
      }
      return await response.json();
    },
  });
  
  // Consultar categorías
  const {
    data: categories,
    isLoading: categoriesLoading,
  } = useQuery({
    queryKey: ["/api/blog/categories"],
    queryFn: async () => {
      const response = await fetch("/api/blog/categories");
      if (!response.ok) {
        throw new Error("Error al cargar categorías");
      }
      return await response.json();
    },
  });
  
  // Manejar la selección de categoría
  const handleCategorySelect = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    setPage(1); // Resetear paginación
  };
  
  // Manejar cambio de página
  const handlePageChange = (newPage: number) => {
    if (newPage < 1) return;
    if (posts && posts.length === 0 && newPage > 1) return;
    if (posts && posts.length < 9 && newPage > page) return;
    
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  
  // Calcular total de páginas estimado
  const totalPages = posts && posts.length === 9 ? page + 1 : page;
  
  // Utilizar el título SEO del artículo si está disponible, de lo contrario, usar el título normal
  const getTitle = (post: any) => post.seoTitle || post.title;
  
  // Utilizar la descripción SEO del artículo si está disponible, de lo contrario, usar el extracto
  const getDescription = (post: any) => post.seoDescription || post.excerpt;
  
  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "d 'de' MMMM, yyyy", { locale: es });
  };
  
  // Tiempo de lectura en minutos
  const formatReadingTime = (minutes: number) => {
    return `${minutes} min de lectura`;
  };
  
  return (
    <div className="container max-w-screen-xl px-4 py-12 mx-auto">
      {/* Metadatos SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            "headline": "Blog - Red Creativa Gen",
            "description": "Artículos sobre creación de contenido para YouTube, consejos, tutoriales y tendencias en video marketing.",
            "keywords": "YouTube, creación de contenido, videos, marketing digital, tutoriales",
            "author": {
              "@type": "Organization",
              "name": "Red Creativa Gen",
              "url": window.location.origin
            },
            "publisher": {
              "@type": "Organization",
              "name": "Red Creativa Gen",
              "logo": {
                "@type": "ImageObject",
                "url": `${window.location.origin}/logo.png`
              }
            },
            "url": window.location.href,
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": window.location.href
            }
          })
        }}
      />
      
      <BlogBreadcrumb />
      
      <div className="flex flex-col space-y-8">
        {/* Encabezado del blog */}
        <div className="text-center max-w-3xl mx-auto px-4">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Blog</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Artículos y tutoriales sobre creación de contenido para YouTube, 
            tendencias, herramientas y consejos para creadores de contenido digital.
          </p>
        </div>
        
        {/* Filtros y categorías */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategorySelect(null)}
          >
            Todos
          </Button>
          
          {categoriesLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24" />
            ))
          ) : (
            categories?.map((category: any) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategorySelect(category.id)}
              >
                {category.name}
              </Button>
            ))
          )}
          
          {user && (
            <Link href="/blog/new">
              <Button variant="outline" size="sm" className="ml-auto">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo artículo
              </Button>
            </Link>
          )}
        </div>
        
        {/* Listado de artículos */}
        {postsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <BlogPostSkeleton key={i} />
            ))}
          </div>
        ) : postsError ? (
          <div className="text-center py-12">
            <p className="text-lg text-red-500">
              Error al cargar los artículos. Por favor, intenta de nuevo más tarde.
            </p>
          </div>
        ) : posts?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              No hay artículos disponibles en esta categoría.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts?.map((post: any) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <Card className="h-full flex flex-col cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {post.categories?.map((category: any) => (
                        <Badge key={category.id} variant="secondary" className="text-xs">
                          {category.name}
                        </Badge>
                      ))}
                      {post.featured && (
                        <Badge variant="default" className="ml-auto">
                          Destacado
                        </Badge>
                      )}
                      {!post.published && (
                        <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-200">
                          Borrador
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl hover:text-primary transition-colors">
                      {getTitle(post)}
                    </CardTitle>
                    <CardDescription className="text-xs flex items-center mt-2">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(post.createdAt)}
                      <span className="mx-2">•</span>
                      <Clock className="h-3 w-3 mr-1" />
                      {formatReadingTime(post.readingTime)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="relative aspect-video mb-4 overflow-hidden rounded-md">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <p className="text-muted-foreground text-sm line-clamp-3">
                      {getDescription(post)}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="link" className="p-0 h-auto text-sm">
                      Leer más <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
        
        {/* Paginación */}
        {!postsLoading && posts?.length > 0 && (
          <div className="flex justify-center mt-12">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Página anterior</span>
              </Button>
              
              <span className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={posts.length < 9}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Página siguiente</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}