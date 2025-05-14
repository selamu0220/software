import { useState, useEffect } from "react";
import { Link, useRoute, useLocation } from "wouter";
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
  Tag,
  ChevronRight,
  ChevronLeft,
  Edit,
  Share2,
  FacebookIcon,
  Twitter,
  Linkedin,
  Copy,
  ArrowLeft,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function BlogPostSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-8 w-96" />
        <Skeleton className="h-6 w-64" />
      </div>
      <Skeleton className="h-[400px] w-full" />
      <div className="space-y-4">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-4/5" />
      </div>
    </div>
  );
}

// Componente de artículo de blog
export default function BlogPostPage() {
  const [match, params] = useRoute<{ slug: string }>("/blog/:slug");
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const slug = params?.slug;

  // Obtener artículo del blog
  const {
    data: post,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/blog/posts/slug", slug],
    queryFn: async () => {
      if (!slug) return null;
      const response = await fetch(`/api/blog/posts/slug/${slug}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Artículo no encontrado");
        }
        throw new Error("Error al cargar el artículo");
      }
      return await response.json();
    },
    enabled: !!slug,
  });

  // Obtener artículos relacionados (de la misma categoría)
  const { data: relatedPosts } = useQuery({
    queryKey: ["/api/blog/related", post?.id, post?.categories?.[0]?.id],
    queryFn: async () => {
      if (!post || !post.categories || post.categories.length === 0) return [];
      
      const categoryId = post.categories[0].id;
      const response = await fetch(`/api/blog/categories/${categoryId}/posts`);
      
      if (!response.ok) {
        throw new Error("Error al cargar artículos relacionados");
      }
      
      const categoryPosts = await response.json();
      // Excluir el post actual y limitar a 3 posts
      return categoryPosts
        .filter((p: any) => p.id !== post.id && p.published)
        .slice(0, 3);
    },
    enabled: !!post && !!post.categories && post.categories.length > 0,
  });

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "d 'de' MMMM, yyyy", { locale: es });
  };

  // Tiempo de lectura en minutos
  const formatReadingTime = (minutes: number) => {
    return `${minutes} min de lectura`;
  };
  
  // Compartir artículo
  const sharePost = (platform: string) => {
    const url = window.location.href;
    const title = post?.title || "Artículo en Red Creativa Gen";
    
    let shareUrl = "";
    
    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case "copy":
        navigator.clipboard.writeText(url).then(() => {
          toast({
            title: "Enlace copiado",
            description: "El enlace ha sido copiado al portapapeles",
          });
        });
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  };

  if (!match) {
    return null;
  }

  return (
    <div className="container max-w-screen-xl px-4 py-12 mx-auto">
      {/* Metadatos SEO si hay post cargado */}
      {post && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              "headline": post.seoTitle || post.title,
              "description": post.seoDescription || post.excerpt,
              "image": post.coverImage,
              "datePublished": post.createdAt,
              "dateModified": post.updatedAt,
              "author": {
                "@type": "Person",
                "name": "Autor de Red Creativa Gen"
              },
              "publisher": {
                "@type": "Organization",
                "name": "Red Creativa Gen",
                "logo": {
                  "@type": "ImageObject",
                  "url": `${window.location.origin}/logo.png`
                }
              },
              "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": window.location.href
              },
              "keywords": post.tags ? post.tags.join(", ") : "",
              "articleSection": post.categories?.map((c: any) => c.name).join(", ") || "Blog"
            })
          }}
        />
      )}

      {/* Migas de pan */}
      <Breadcrumb className="mb-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/blog">Blog</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {post && (
            <BreadcrumbItem>
              <BreadcrumbPage>{post.title}</BreadcrumbPage>
            </BreadcrumbItem>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Contenido principal */}
        <div className="lg:col-span-8">
          <Link href="/blog">
            <Button variant="ghost" size="sm" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" /> Volver al blog
            </Button>
          </Link>

          {isLoading ? (
            <BlogPostSkeleton />
          ) : error ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Error</h2>
              <p className="text-muted-foreground mb-6">
                No se pudo cargar el artículo. Por favor, intenta de nuevo más tarde.
              </p>
              <Button onClick={() => setLocation("/blog")}>Volver al blog</Button>
            </div>
          ) : post ? (
            <article className="space-y-8">
              {/* Encabezado */}
              <div>
                {/* Categorías */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.categories?.map((category: any) => (
                    <Link 
                      key={category.id} 
                      href={`/blog/category/${category.slug}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/blog?category=${category.id}`);
                      }}
                    >
                      <Badge variant="secondary">
                        {category.name}
                      </Badge>
                    </Link>
                  ))}
                  {post.featured && (
                    <Badge variant="default" className="ml-auto">
                      Destacado
                    </Badge>
                  )}
                  {!post.published && (
                    <Badge variant="outline" className="text-yellow-500 border-yellow-200">
                      Borrador
                    </Badge>
                  )}
                </div>

                {/* Título */}
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                  {post.title}
                </h1>

                {/* Metadatos */}
                <div className="flex items-center text-sm text-muted-foreground mb-8">
                  <Calendar className="h-4 w-4 mr-1" />
                  <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
                  <span className="mx-2">•</span>
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{formatReadingTime(post.readingTime)}</span>
                  
                  {/* Mostrar editar si el usuario es el autor */}
                  {user && user.id === post.userId && (
                    <>
                      <span className="mx-2">•</span>
                      <Link href={`/blog/edit/${post.id}`}>
                        <Button variant="ghost" size="sm" className="h-auto p-0">
                          <Edit className="h-4 w-4 mr-1" />
                          <span>Editar</span>
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* Imagen principal */}
              <div className="relative aspect-video overflow-hidden rounded-lg">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="object-cover w-full h-full"
                />
              </div>

              {/* Contenido */}
              <div 
                className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-p:text-muted-foreground prose-a:text-primary"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="pt-6">
                  <h3 className="text-lg font-semibold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Compartir */}
              <div className="pt-6">
                <h3 className="text-lg font-semibold mb-2">Compartir</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => sharePost("facebook")}
                  >
                    <FacebookIcon className="h-4 w-4" />
                    <span className="sr-only">Compartir en Facebook</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => sharePost("twitter")}
                  >
                    <Twitter className="h-4 w-4" />
                    <span className="sr-only">Compartir en Twitter</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => sharePost("linkedin")}
                  >
                    <Linkedin className="h-4 w-4" />
                    <span className="sr-only">Compartir en LinkedIn</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => sharePost("copy")}
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copiar enlace</span>
                  </Button>
                </div>
              </div>
            </article>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Artículo no encontrado</h2>
              <p className="text-muted-foreground mb-6">
                El artículo que buscas no existe o ha sido eliminado.
              </p>
              <Button onClick={() => setLocation("/blog")}>Volver al blog</Button>
            </div>
          )}
        </div>

        {/* Barra lateral */}
        <div className="lg:col-span-4">
          {post && (
            <>
              {/* Artículos relacionados */}
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4">Artículos relacionados</h3>
                {relatedPosts && relatedPosts.length > 0 ? (
                  <div className="space-y-4">
                    {relatedPosts.map((relatedPost: any) => (
                      <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`}>
                        <Card className="cursor-pointer hover:shadow-sm transition-shadow">
                          <div className="flex">
                            <div className="relative w-20 h-20 flex-shrink-0">
                              <img
                                src={relatedPost.coverImage}
                                alt={relatedPost.title}
                                className="object-cover w-full h-full rounded-l-md"
                              />
                            </div>
                            <div className="p-3">
                              <h4 className="font-medium text-sm mb-1 line-clamp-2">
                                {relatedPost.title}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(relatedPost.createdAt)}
                              </p>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No hay artículos relacionados disponibles.
                  </p>
                )}
              </div>

              {/* Categorías */}
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4">Categorías</h3>
                <div className="flex flex-col gap-2">
                  {post.categories?.map((category: any) => (
                    <Link 
                      key={category.id} 
                      href={`/blog?category=${category.id}`}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span className="flex items-center">
                        <ChevronRight className="h-4 w-4 mr-1" />
                        {category.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Newsletter (opcional) */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Newsletter</CardTitle>
                  <CardDescription>
                    Recibe las últimas actualizaciones y consejos de creación de contenido.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        className="w-full p-2 rounded-md border border-border"
                      />
                    </div>
                    <Button className="w-full">Suscribirse</Button>
                  </form>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}