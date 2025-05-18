import { useState, useEffect, useRef } from "react";
import { Link, useRoute } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { corregirRutaRecurso } from "@/lib/utils/resource-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Maximize,
  ChevronLeft,
  ChevronRight,
  Code,
  Copy,
  Check,
  FileCode,
  Download,
  ExternalLink,
  Eye,
  File,
  FileText,
  FileCheck,
  Flag,
  Link as LinkIcon,
  Lock,
  Share2,
  Star,
  StarHalf,
  ThumbsUp,
  ThumbsDown,
  User,
  MessageSquare,
  BarChart2,
  Tag,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

// Ya no usamos datos de ejemplo para evitar confusiones
// La información real siempre vendrá de la API

// Componente de valoración con estrellas
function RatingStars({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return (
    <div className="flex items-center">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
      ))}
      {hasHalfStar && <StarHalf className="w-5 h-5 text-yellow-500 fill-yellow-500" />}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="w-5 h-5 text-muted-foreground" />
      ))}
    </div>
  );
}

// Comentario individual
function Comentario({ comentario }: { comentario: any }) {
  return (
    <div className="mb-6 pb-6 border-b last:border-0">
      <div className="flex items-start space-x-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={comentario.usuario.avatar} alt={comentario.usuario.nombre} />
          <AvatarFallback>{comentario.usuario.nombre.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center">
            <h4 className="font-semibold">
              {comentario.usuario.nombre}
              {comentario.usuario.verificado && (
                <svg className="w-4 h-4 ml-1 text-primary inline-block" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </h4>
            <div className="ml-auto text-sm text-muted-foreground">{comentario.fecha}</div>
          </div>
          {comentario.valoracion && (
            <div className="my-1">
              <RatingStars rating={comentario.valoracion} />
            </div>
          )}
          <p className="text-muted-foreground mt-1">{comentario.contenido}</p>
        </div>
      </div>
    </div>
  );
}

// Componente para copiar texto al portapapeles
function CopyButton({ textToCopy }: { textToCopy: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopied(true);
        toast({
          title: "Copiado al portapapeles",
          description: "El código se ha copiado correctamente",
        });
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        toast({
          title: "Error al copiar",
          description: "No se pudo copiar el texto",
          variant: "destructive",
        });
        console.error('Error al copiar: ', err);
      });
  };

  return (
    <Button 
      variant="ghost" 
      size="sm"
      onClick={handleCopy}
      className="h-8 px-2 text-gray-300 hover:text-white hover:bg-gray-800"
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      <span className="ml-2 text-xs">{copied ? 'Copiado' : 'Copiar'}</span>
    </Button>
  );
}

// Página de detalle del recurso
export default function RecursoDetallePage() {
  const [match, params] = useRoute<{ id: string }>("/recursos/:id");
  const [comentario, setComentario] = useState("");
  const [valoracion, setValoracion] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(true);
  // Estado para recursos con tipado mejorado
  const [recurso, setRecurso] = useState<any>(null);
  const [usuario, setUsuario] = useState<any>(null);
  // Estados para la galería de imágenes
  const [imagenActual, setImagenActual] = useState(0);
  const [votando, setVotando] = useState(false);
  const [votoUsuario, setVotoUsuario] = useState<number>(-1); // -1 significa no votó aún
  const { toast } = useToast();
  
  // Obtenemos el ID del recurso como número
  const idRecurso = params?.id ? parseInt(params.id) : undefined;
  
  // Función para votar (me gusta / no me gusta)
  const handleVotar = async (valor: number) => {
    if (!usuario) {
      toast({
        title: "Inicia sesión para votar",
        description: "Necesitas iniciar sesión para dar tu valoración",
        variant: "default"
      });
      return;
    }
    
    if (votando) return;
    
    setVotando(true);
    
    try {
      const response = await fetch(`/api/recursos/${idRecurso}/votar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          score: valor 
        }),
      });
      
      if (response.ok) {
        const resultado = await response.json();
        setVotoUsuario(valor);
        
        // Actualizar contador de votos en el recurso
        setRecurso({
          ...recurso,
          voteCount: resultado.voteCount || recurso.voteCount || 0,
          voteScore: resultado.voteScore || recurso.voteScore || 0
        });
        
        toast({
          title: "¡Gracias por tu valoración!",
          description: "Tu opinión ayuda a otros usuarios a encontrar buenos recursos.",
        });
      } else {
        toast({
          title: "Error al valorar",
          description: "No se pudo registrar tu valoración, inténtalo de nuevo.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error al votar:", error);
      toast({
        title: "Error al valorar",
        description: "Ocurrió un problema al procesar tu valoración.",
        variant: "destructive"
      });
    } finally {
      setVotando(false);
    }
  };
  
  // Obtener información del usuario
  useEffect(() => {
    const obtenerUsuario = async () => {
      try {
        const response = await fetch("/api/me");
        if (response.ok) {
          const data = await response.json();
          setUsuario(data);
        }
      } catch (error) {
        console.error("Error al obtener usuario:", error);
      }
    };
    
    obtenerUsuario();
  }, []);
  
  // Usamos el identificador que ya hemos definido arriba
  // idRecurso ya está definido
  
  // Cargar el recurso desde la API
  useEffect(() => {
    const cargarRecurso = async () => {
      if (!idRecurso) return;
      
      setCargando(true);
      try {
        const response = await fetch(`/api/recursos/${idRecurso}`);
        
        if (response.ok) {
          const data = await response.json();
          // Usar solo los datos reales del recurso, sin datos de ejemplo
          setRecurso({
            id: data.id,
            titulo: data.title,
            descripcion: data.description,
            categoria: data.categoryId ? `Categoría ${data.categoryId}` : "General",
            imagen: data.thumbnailUrl || null,
            autor: {
              id: data.userId,
              nombre: data.userId ? `Usuario ${data.userId}` : "Anónimo",
              avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${data.userId || 'AN'}`,
              verificado: false
            },
            fechaPublicacion: data.createdAt ? new Date(data.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            // No mostrar contenido de ejemplo si no hay contenido real
            contenido: data.content || `<p>${data.description || 'Sin contenido adicional'}</p>`,
            enlaceDescarga: data.downloadUrl || null,
            enlaceExterno: data.externalUrl || null,
            // Otros campos con datos reales
            fileSize: data.fileSize,
            fileType: data.fileType,
            version: data.version || "1.0",
            tags: data.tags || [],
            comentarios: [] // Inicialmente vacío, se cargará después
          });
        } else {
          toast({
            title: "Error",
            description: "No se pudo cargar el recurso",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error al cargar recurso:", error);
        toast({
          title: "Error",
          description: "No se pudo cargar el recurso",
          variant: "destructive"
        });
      } finally {
        setCargando(false);
      }
    };
    
    cargarRecurso();
  }, [idRecurso, toast]);
  
  const handleEnviarComentario = async () => {
    if (!comentario.trim()) return;
    
    if (!usuario) {
      toast({
        title: "Inicia sesión para comentar",
        description: "Necesitas iniciar sesión para dejar un comentario",
        variant: "default"
      });
      return;
    }
    
    setEnviando(true);
    
    try {
      // Crear un comentario temporal directamente en el cliente
      const comentarioTemporal = {
        id: Date.now(),
        contenido: comentario,
        fecha: new Date().toISOString().split('T')[0],
        valoracion: valoracion,
        usuario: {
          id: usuario.id,
          nombre: usuario.username,
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${usuario.username || 'U'}`,
          verificado: false
        }
      };
      
      // Actualizar la interfaz de usuario inmediatamente
      setRecurso({
        ...recurso,
        comentarios: [comentarioTemporal, ...(recurso.comentarios || [])]
      });
      
      // Intentar guardar en el servidor (pero no esperamos respuesta)
      fetch(`/api/recursos/${idRecurso}/comentarios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contenido: comentario,
          valoracion: valoracion || null
        }),
      }).catch(error => {
        console.log("Error al guardar en servidor, pero comentario ya se muestra:", error);
      });
      
      // Ya no necesitamos hacer nada más aquí, ya actualizamos los comentarios
      // y los mostramos en la interfaz anteriormente
      
      // Limpiar el formulario
      setComentario("");
      setValoracion(0);
      
      toast({
        title: "Comentario enviado",
        description: "Tu reseña se ha publicado correctamente",
        variant: "default"
      });
    } catch (error) {
      console.error("Error al enviar comentario:", error);
      toast({
        title: "Error al enviar comentario",
        description: "No se pudo enviar tu reseña, inténtalo de nuevo",
        variant: "destructive"
      });
    } finally {
      setEnviando(false);
    }
  };
  
  if (cargando) {
    return (
      <div className="container mx-auto py-20 px-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mr-3"></div>
        <span className="text-lg">Cargando recurso...</span>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10 px-4 sm:px-6">
      {/* Schema.org markup para el producto (recurso) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": recurso.titulo,
            "image": corregirRutaRecurso(recurso.imagen),
            "description": recurso.descripcion,
            "category": recurso.categoria,
            "sku": `recurso-${idRecurso}`,
            "brand": {
              "@type": "Brand",
              "name": recurso.autor.nombre
            },
            "offers": {
              "@type": "Offer",
              "url": window.location.href,
              "priceCurrency": "EUR",
              "price": recurso.premium ? "4.99" : "0",
              "availability": "https://schema.org/InStock"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": recurso.valoracionPromedio,
              "reviewCount": recurso.numeroValoraciones
            }
          })
        }}
      />
      
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/recursos">Recursos</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/recursos/categoria/${recurso.categoria.toLowerCase().replace(/ /g, "-")}`}>
              {recurso.categoria}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{recurso.titulo}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="mb-8">
            <Link href="/recursos">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" /> Volver a recursos
              </Button>
            </Link>
            
            {/* Visualizador de galería de imágenes mejorado */}
            <div className="relative rounded-lg mb-6">
              {recurso.resourceType === 'image' || recurso.imagenes?.length > 0 ? (
                <div className="resource-gallery">
                  {/* Implementación de galería con capacidad de navegación */}
                  <div className="relative aspect-video overflow-hidden rounded-lg">
                    <img 
                      src={corregirRutaRecurso(recurso.imagenes ? recurso.imagenes[imagenActual] : recurso.imagen)} 
                      alt={`${recurso.titulo} - Imagen ${imagenActual + 1}`}
                      className="object-contain w-full h-full bg-black/5 dark:bg-white/5" 
                    />
                    
                    {/* Controles de navegación si hay múltiples imágenes */}
                    {recurso.imagenes && recurso.imagenes.length > 1 && (
                      <>
                        <Button 
                          size="sm" 
                          variant="secondary"
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 rounded-full w-8 h-8 p-0"
                          onClick={() => {
                            setImagenActual(prev => 
                              prev === 0 ? recurso.imagenes.length - 1 : prev - 1
                            );
                          }}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="secondary"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full w-8 h-8 p-0"
                          onClick={() => {
                            setImagenActual(prev => 
                              prev === recurso.imagenes.length - 1 ? 0 : prev + 1
                            );
                          }}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-1">
                          {recurso.imagenes.map((imagenUrl: string, idx: number) => (
                            <Button 
                              key={idx}
                              size="sm"
                              variant="ghost"
                              className={`w-2 h-2 rounded-full p-0 ${idx === imagenActual ? 'bg-primary' : 'bg-muted'}`}
                              onClick={() => setImagenActual(idx)}
                            />
                          ))}
                        </div>
                      </>
                    )}
                    
                    {/* Badge para recursos destacados */}
                    {recurso.destacado && (
                      <Badge className="absolute top-2 right-2 bg-primary">Destacado</Badge>
                    )}
                  </div>
                </div>
              ) : recurso.resourceType === 'video' ? (
                <div className="aspect-video rounded-lg overflow-hidden bg-black">
                  <video 
                    controls
                    className="w-full h-full"
                    poster={corregirRutaRecurso(recurso.imagen)}
                  >
                    <source src={corregirRutaRecurso(recurso.enlaceDescarga)} type="video/mp4" />
                    Tu navegador no soporta la reproducción de video.
                  </video>
                </div>
              ) : (
                <div className="relative aspect-video overflow-hidden rounded-lg">
                  <img 
                    src={corregirRutaRecurso(recurso.imagen)} 
                    alt={recurso.titulo} 
                    className="object-cover w-full h-full"
                  />
                  {recurso.destacado && (
                    <Badge className="absolute top-2 right-2 bg-primary">Destacado</Badge>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap items-center justify-between mb-4">
              <h1 className="text-3xl font-bold">{recurso.titulo}</h1>
              
              <div className="flex items-center mt-2 space-x-2">
                <Button variant="outline" size="sm" className="gap-1">
                  <Share2 className="w-4 h-4" /> Compartir
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Flag className="w-4 h-4" /> Reportar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reportar contenido</AlertDialogTitle>
                      <AlertDialogDescription>
                        ¿Quieres reportar este recurso por contenido inapropiado o infracción de derechos de autor?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction>Reportar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            
            <div className="flex items-center mb-6">
              <Link href={`/perfil/${recurso.autor.id}`}>
                <div className="flex items-center group">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={recurso.autor.avatar} alt={recurso.autor.nombre} />
                    <AvatarFallback>{recurso.autor.nombre.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium group-hover:text-primary group-hover:underline">
                    {recurso.autor.nombre}
                    {recurso.autor.verificado && (
                      <svg className="w-4 h-4 ml-1 text-primary inline-block" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </span>
                </div>
              </Link>
              
              <div className="ml-4 flex items-center text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 mr-1" /> 
                Publicado: {recurso.fechaPublicacion}
              </div>
              
              {recurso.verificado && (
                <Badge variant="outline" className="ml-auto flex items-center gap-1 text-primary border-primary">
                  <ShieldCheck className="w-3 h-3" /> Verificado
                </Badge>
              )}
            </div>
            
            <Tabs defaultValue="descripcion" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="descripcion">Descripción</TabsTrigger>
                <TabsTrigger value="comentarios">Comentarios ({recurso.comentarios.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="descripcion" className="py-4">
                {/* Visualizador de código con sintaxis coloreada si es un recurso de código */}
                {recurso.resourceType === 'code' && recurso.codigoFuente && (
                  <div className="mb-6">
                    <div className="bg-black rounded-md overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 text-gray-200">
                        <div className="flex items-center">
                          <FileCode className="w-4 h-4 mr-2" />
                          <span className="text-sm font-medium">{recurso.lenguaje || 'Código'}</span>
                        </div>
                        <CopyButton textToCopy={recurso.codigoFuente} />
                      </div>
                      <div className="p-4 overflow-x-auto text-sm">
                        <pre className="language-javascript">
                          <code className="whitespace-pre text-gray-300">
                            {recurso.codigoFuente}
                          </code>
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: recurso.contenido }} />
                
                {/* Sección para conectar con APIs de IA */}
                <div className="mt-8 p-4 border border-border rounded-lg">
                  {/* Sección de conectar con IAs eliminada a petición del usuario */}
                </div>
                
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-3">¿Te ha resultado útil este recurso?</h3>
                  <div className="flex items-center gap-3 mb-6">
                    <Button
                      variant={votoUsuario === 1 ? "default" : "outline"}
                      className={`gap-2 ${votoUsuario === 1 ? "bg-green-600 hover:bg-green-700" : ""}`}
                      onClick={() => handleVotar(1)}
                      disabled={votando}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Me gusta {recurso.voteScore && recurso.voteScore > 0 ? `(${recurso.voteScore})` : ""}
                    </Button>
                    
                    <Button
                      variant={votoUsuario === 0 ? "default" : "outline"}
                      className={`gap-2 ${votoUsuario === 0 ? "bg-red-600 hover:bg-red-700" : ""}`}
                      onClick={() => handleVotar(0)}
                      disabled={votando}
                    >
                      <ThumbsDown className="h-4 w-4" />
                      No me gusta
                    </Button>
                    
                    {votando && <span className="text-muted-foreground text-sm italic">Enviando valoración...</span>}
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-3">Etiquetas</h3>
                  <div className="flex flex-wrap gap-2">
                    {recurso.tags && recurso.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        <Tag className="w-3 h-3" /> {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="comentarios" className="py-4">
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">Deja tu comentario</h3>
                  <Textarea 
                    placeholder="Escribe tu opinión sobre este recurso..." 
                    className="mb-3"
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">Tu valoración:</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <Star 
                            key={num}
                            className={`w-5 h-5 cursor-pointer ${valoracion >= num ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} 
                            onClick={() => setValoracion(num)}
                          />
                        ))}
                      </div>
                    </div>
                    <Button onClick={handleEnviarComentario} disabled={!comentario.trim() || enviando}>
                      {enviando ? 'Enviando...' : 'Enviar comentario'}
                    </Button>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Comentarios ({recurso.comentarios.length})</h3>
                  
                  {recurso.comentarios.length > 0 ? (
                    <div>
                      {recurso.comentarios.map((comentario: any) => (
                        <Comentario key={comentario.id} comentario={comentario} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-6">No hay comentarios todavía. ¡Sé el primero en comentar!</p>
                  )}
                </div>
              </TabsContent>
              

            </Tabs>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <Card>
              <CardHeader>
                <CardTitle>Descargar recurso</CardTitle>
                <CardDescription>Información del archivo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <File className="w-4 h-4 mr-2" /> Tipo de archivo
                    </div>
                    <span className="font-medium">{recurso.tipo}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <FileText className="w-4 h-4 mr-2" /> Tamaño
                    </div>
                    <span className="font-medium">{recurso.tamanoArchivo}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <FileCheck className="w-4 h-4 mr-2" /> Versión
                    </div>
                    <span className="font-medium">{recurso.version}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 mr-2" /> Última actualización
                    </div>
                    <span className="font-medium">{recurso.ultimaActualizacion}</span>
                  </div>
                  
                </div>
              </CardContent>
              <CardContent className="pt-0">
                <div className="flex flex-col gap-3">
                  <a 
                    href={
                      (recurso.title && recurso.title.toLowerCase().includes("davinci") || 
                       recurso.description && recurso.description.toLowerCase().includes("davinci")) ? 
                        "/api/transiciones-davinci" : 
                        (recurso.downloadUrl ? 
                          `/api/descargar/${recurso.downloadUrl.split('/').pop()}` : 
                          (recurso.enlaceDescarga ? `/api/descargar/${recurso.enlaceDescarga.split('/').pop()}` : '#')
                        )
                    } 
                    download 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block w-full"
                    onClick={(e) => {
                      // Para depuración, log del enlace actual
                      console.log("Descargando:", 
                        recurso.downloadUrl ? 
                        `/api/descargar/${recurso.downloadUrl.split('/').pop()}` : 
                        (recurso.enlaceDescarga ? `/api/descargar/${recurso.enlaceDescarga.split('/').pop()}` : '#')
                      );
                    }}
                  >
                    <Button 
                      className="w-full gap-2"
                      disabled={recurso.isPremium && !usuario?.isPremium}
                    >
                      {recurso.isPremium && !usuario?.isPremium ? (
                        <>
                          <Lock className="w-4 h-4" /> Solo para Premium
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" /> Descargar ahora
                        </>
                      )}
                    </Button>
                  </a>
                  
                  {recurso.enlaceExterno && (
                    <>
                      <a 
                        href={recurso.enlaceExterno} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-block w-full"
                      >
                        <Button variant="outline" className="w-full gap-2">
                          <ExternalLink className="w-4 h-4" /> Ver en sitio original
                        </Button>
                      </a>
                      <Link href={`/web-viewer/${idRecurso}`} className="inline-block w-full mt-2">
                        <Button variant="default" className="w-full gap-2">
                          <Maximize className="w-4 h-4" /> Ver dentro de la plataforma
                        </Button>
                      </Link>
                    </>
                  )}
                  
                  {/* Indicador de tipo de recurso y precio */}
                  <div className="flex flex-col space-y-2 mb-4">
                    <div className="flex items-center space-x-2">
                      {recurso.isPremium ? (
                        <div className="text-amber-500 bg-amber-100 dark:bg-amber-950 dark:text-amber-300 px-3 py-1 rounded-full text-xs font-semibold flex items-center">
                          <span className="mr-1">⭐</span> Premium - {((recurso.price || 0) / 100).toFixed(2)}€
                        </div>
                      ) : (
                        <div className="text-green-500 bg-green-100 dark:bg-green-950 dark:text-green-300 px-3 py-1 rounded-full text-xs font-semibold flex items-center">
                          <span className="mr-1">✓</span> Gratuito
                        </div>
                      )}
                      
                      <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center">
                        {recurso.resourceType === 'file' && <span>📁 Archivo</span>}
                        {recurso.resourceType === 'link' && <span>🔗 Enlace</span>}
                        {recurso.resourceType === 'tool' && <span>🛠️ Herramienta</span>}
                        {recurso.resourceType === 'aiTool' && <span>🤖 IA - {recurso.aiCategory || 'General'}</span>}
                        {!recurso.resourceType && <span>📁 Archivo</span>}
                      </div>
                    </div>
                  </div>
                  
                  {/* Sistema de votación */}
                  <div className="flex justify-between items-center border border-border rounded-md p-3 mb-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">¿Te ha sido útil?</span>
                      <span className="text-xs text-muted-foreground">{recurso.voteCount || 0} valoraciones</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleVotar(1)}
                        disabled={!usuario || votando}
                        className={votoUsuario === 1 ? "border-primary" : ""}
                      >
                        <ThumbsUp className={`h-4 w-4 ${votoUsuario === 1 ? "text-primary fill-primary" : ""}`} />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleVotar(0)}
                        disabled={!usuario || votando}
                        className={votoUsuario === 0 ? "border-destructive" : ""}
                      >
                        <ThumbsDown className={`h-4 w-4 ${votoUsuario === 0 ? "text-destructive fill-destructive" : ""}`} />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <Button variant="outline" size="sm" className="w-full gap-1">
                      <Share2 className="w-4 h-4" /> Compartir recurso
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Recursos relacionados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-16 h-12 rounded bg-muted/30 overflow-hidden flex-shrink-0">
                      <img 
                        src="https://images.unsplash.com/photo-1502401478532-60a602a45ead?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=100&h=100" 
                        alt="Recurso relacionado" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Presets de LUTs Cinematográficos</h4>
                      <p className="text-xs text-muted-foreground">30 LUTs profesionales</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-16 h-12 rounded bg-muted/30 overflow-hidden flex-shrink-0">
                      <img 
                        src="https://images.unsplash.com/photo-1558383817-1b2a4a5b49e3?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=100&h=100" 
                        alt="Recurso relacionado" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Librería de Efectos de Sonido</h4>
                      <p className="text-xs text-muted-foreground">200+ efectos de sonido</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-16 h-12 rounded bg-muted/30 overflow-hidden flex-shrink-0">
                      <img 
                        src="https://images.unsplash.com/photo-1542765826-5a42ff50f1df?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=100&h=100" 
                        alt="Recurso relacionado" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Plugin de Corrección de Color</h4>
                      <p className="text-xs text-muted-foreground">Herramienta profesional</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardContent className="pt-0">
                <Button variant="ghost" className="w-full text-primary">
                  Ver más recursos similares
                </Button>
              </CardContent>
            </Card>
            
            <div className="mt-6 flex justify-center">
              <Button variant="outline" size="sm" className="gap-1 text-muted-foreground">
                <AlertTriangle className="w-4 h-4" /> Reportar problema
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}