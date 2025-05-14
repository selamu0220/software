import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { BlogPost, BlogCategory } from "@shared/schema";
import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CalendarIcon, 
  Clock, 
  ArrowLeft, 
  Edit3, 
  Share,
  Facebook, 
  Twitter,
  Linkedin,
  Link as LinkIcon,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";

// Determina el tiempo de lectura aproximado en minutos
function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const wordCount = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

function BlogPostSkeleton() {
  return (
    <div className="container py-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <Skeleton className="h-8 w-48 mb-2" />
      </div>
      
      <div className="mb-8">
        <Skeleton className="h-12 w-full mb-4" />
        <div className="flex items-center gap-4 mb-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-64 w-full rounded-md mb-4" />
        <Skeleton className="h-32 w-full rounded-md" />
      </div>
    </div>
  );
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  
  const { 
    data: post, 
    isLoading,
    error 
  } = useQuery<BlogPost & { categories: BlogCategory[] }, Error>({
    queryKey: ["/api/blog/post", slug],
    queryFn: async () => {
      const res = await fetch(`/api/blog/posts/${slug}`);
      if (!res.ok) throw new Error("Error al cargar el artículo");
      return res.json();
    }
  });

  // Actualizar el título de la página
  useEffect(() => {
    if (post?.title) {
      document.title = `${post.title} | Red Creativa Gen`;
    }
    return () => {
      document.title = 'Red Creativa Gen';
    };
  }, [post?.title]);

  // Compartir en redes sociales
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = post?.title || 'Artículo en Red Creativa Gen';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({
      title: "Enlace copiado",
      description: "Se ha copiado el enlace al portapapeles",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return <BlogPostSkeleton />;
  }

  if (error || !post) {
    return (
      <div className="container py-8 max-w-3xl mx-auto">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            No se pudo cargar el artículo. Por favor, inténtalo de nuevo más tarde.
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
    <div className="container py-8 max-w-4xl mx-auto">
      {/* SEO metadata */}
      <div itemScope itemType="https://schema.org/BlogPosting">
        <meta itemProp="headline" content={post.title} />
        <meta itemProp="description" content={post.excerpt || post.title} />
        <meta itemProp="datePublished" content={new Date(post.publishedAt || post.createdAt).toISOString()} />
        {post.updatedAt && (
          <meta itemProp="dateModified" content={new Date(post.updatedAt).toISOString()} />
        )}
        {post.author && (
          <div itemProp="author" itemScope itemType="https://schema.org/Person">
            <meta itemProp="name" content={post.author.username} />
          </div>
        )}
        <div itemProp="publisher" itemScope itemType="https://schema.org/Organization">
          <meta itemProp="name" content="Red Creativa Gen" />
          <meta itemProp="logo" content="/logo.png" />
        </div>
      </div>
      
      <div className="mb-6 flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate("/blog")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al blog
        </Button>
        
        <div className="flex gap-2">
          {user && post.author?.id === user.id && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/blog/edit/${post.id}`)}
            >
              <Edit3 className="mr-2 h-4 w-4" /> Editar
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Share className="mr-2 h-4 w-4" /> Compartir
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, '_blank')}
                className="cursor-pointer"
              >
                <Facebook className="mr-2 h-4 w-4" /> Facebook
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => window.open(`https://twitter.com/intent/tweet?url=${shareUrl}&text=${encodeURIComponent(shareTitle)}`, '_blank')}
                className="cursor-pointer"
              >
                <Twitter className="mr-2 h-4 w-4" /> Twitter
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`, '_blank')}
                className="cursor-pointer"
              >
                <Linkedin className="mr-2 h-4 w-4" /> LinkedIn
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleCopyLink}
                className="cursor-pointer"
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                {copied ? "¡Copiado!" : "Copiar enlace"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <article className="prose prose-sm md:prose-base lg:prose-lg dark:prose-invert max-w-none">
        <header className="not-prose mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>
          
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author?.avatarUrl || ''} />
              <AvatarFallback>
                {post.author?.username.substring(0, 2).toUpperCase() || 'RC'}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <div className="font-medium">{post.author?.username || 'Red Creativa'}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <CalendarIcon size={14} />
                  {post.publishedAt ? 
                    format(new Date(post.publishedAt), 'PPP', { locale: es }) : 
                    'Borrador'}
                </span>
                
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {calculateReadingTime(post.content || '')} min de lectura
                </span>
              </div>
            </div>
          </div>
          
          {post.categories && post.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.categories.map(category => (
                <Link key={category.id} href={`/blog?category=${category.id}`}>
                  <Badge variant="secondary" className="hover:bg-secondary/80 cursor-pointer">
                    {category.name}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
          
          {post.featuredImage && (
            <div className="mb-6 rounded-lg overflow-hidden aspect-video">
              <img 
                src={post.featuredImage} 
                alt={post.title} 
                className="w-full h-full object-cover"
                itemProp="image"
              />
            </div>
          )}
          
          {post.excerpt && (
            <div className="mb-6 text-lg text-muted-foreground italic border-l-4 border-primary/20 pl-4">
              {post.excerpt}
            </div>
          )}
        </header>
        
        {/* Contenido del artículo */}
        <div 
          dangerouslySetInnerHTML={{ __html: post.content }} 
          className="mb-10"
          itemProp="articleBody"
        />
        
        {/* Tarjeta de autor */}
        {post.author && (
          <Card className="my-8 bg-secondary/10 not-prose">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={post.author.avatarUrl || ''} />
                  <AvatarFallback>
                    {post.author.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h3 className="text-xl font-bold mb-1">Sobre {post.author.username}</h3>
                  <p className="text-muted-foreground">
                    {post.author.bio || 'Creador de contenido en Red Creativa Gen'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Artículos relacionados */}
        {/* Implementar en el futuro: sugerencias basadas en categorías */}
      </article>
    </div>
  );
}