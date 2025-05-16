import { useState, useEffect } from "react";
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

// Recurso de ejemplo (simulando datos de API)
const recursoEjemplo = {
  id: 1,
  titulo: "Pack de 50 Transiciones para DaVinci Resolve",
  descripcion: "Colección completa de transiciones profesionales para tus proyectos de video. Incluye efectos de desvanecimiento, barrido, zoom, glitch, distorsión y muchos más, todos optimizados para un rendimiento óptimo en DaVinci Resolve.",
  contenido: `
  <p>Este pack incluye 50 transiciones profesionales diseñadas específicamente para DaVinci Resolve, perfectas para proyectos de todo tipo:</p>
  
  <ul>
    <li>10 transiciones de desvanecimiento avanzadas</li>
    <li>15 transiciones de movimiento dinámico</li>
    <li>8 transiciones con efectos glitch y distorsión</li>
    <li>7 transiciones basadas en formas geométricas</li>
    <li>10 transiciones de estilo cinematográfico</li>
  </ul>
  
  <p>Todas las transiciones son fáciles de usar: simplemente arrastra y suelta en tu línea de tiempo y ajusta la duración según tus necesidades.</p>
  
  <h3>Compatibilidad</h3>
  <p>DaVinci Resolve 17 o superior</p>
  
  <h3>Instrucciones de instalación</h3>
  <ol>
    <li>Descarga y descomprime el archivo</li>
    <li>Copia la carpeta "Transiciones" en la ubicación: [Documentos/BlackmagicDesign/DaVinci Resolve/Effects]</li>
    <li>Reinicia DaVinci Resolve</li>
    <li>Las transiciones aparecerán en el panel de efectos</li>
  </ol>
  `,
  categoria: "Edición de Video",
  subcategoria: "Transiciones",
  autor: {
    id: 1,
    nombre: "Red Creativa",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=RC",
    verificado: true,
    fechaRegistro: "2022-05-15"
  },
  fechaPublicacion: "2023-10-12",
  ultimaActualizacion: "2024-01-18",
  tamanoArchivo: "156 MB",
  tipo: "ZIP",
  version: "2.1",
  destacado: true,
  verificado: true,
  imagen: "https://images.unsplash.com/photo-1536240478700-b869070f9279?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1200&h=600",
  enlaceExterno: "",
  enlaceDescarga: "/descargas/pack-transiciones-davinci.zip",
  tags: ["DaVinci Resolve", "Transiciones", "Efectos", "Edición", "Video"],
  comentarios: [
    {
      id: 1,
      usuario: {
        id: 101,
        nombre: "VideoEditor",
        avatar: "https://api.dicebear.com/7.x/initials/svg?seed=VE",
        verificado: false
      },
      contenido: "Excelente pack de transiciones, me ha ahorrado muchísimo tiempo en mis proyectos. Las transiciones de tipo glitch son especialmente útiles para mis videos de estilo urbano.",
      fecha: "2024-03-15",
      valoracion: 5
    },
    {
      id: 2,
      usuario: {
        id: 102,
        nombre: "FilmMaker",
        avatar: "https://api.dicebear.com/7.x/initials/svg?seed=FM",
        verificado: true
      },
      contenido: "Me ha funcionado muy bien, aunque algunas transiciones son un poco pesadas para mi equipo. La documentación podría ser más clara sobre los requisitos de sistema.",
      fecha: "2024-02-28",
      valoracion: 4
    },
    {
      id: 3,
      usuario: {
        id: 103,
        nombre: "ContentCreator",
        avatar: "https://api.dicebear.com/7.x/initials/svg?seed=CC",
        verificado: false
      },
      contenido: "Las transiciones son muy profesionales. Hay algunas que no me terminan de convencer, pero la mayoría son geniales. Volveré a descargar futuras actualizaciones.",
      fecha: "2024-01-22",
      valoracion: 4
    }
  ]
};

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

// Página de detalle del recurso
export default function RecursoDetallePage() {
  const [match, params] = useRoute<{ id: string }>("/recursos/:id");
  const [comentario, setComentario] = useState("");
  const [valoracion, setValoracion] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [recurso, setRecurso] = useState<any>(recursoEjemplo);
  const { toast } = useToast();
  
  // Cargar el recurso real según el ID
  const recursoId = match ? parseInt(params.id) : 1;
  
  // Cargar el recurso desde la API
  useEffect(() => {
    const cargarRecurso = async () => {
      if (!recursoId) return;
      
      setCargando(true);
      try {
        const response = await fetch(`/api/recursos/${recursoId}`);
        
        if (response.ok) {
          const data = await response.json();
          setRecurso({
            ...recursoEjemplo, // Mantener estructura base para campos que puedan faltar
            ...data,
            // Asegurar que tenemos los campos necesarios para la visualización
            id: data.id,
            titulo: data.title,
            descripcion: data.description,
            categoria: data.categoryId ? `Categoría ${data.categoryId}` : "General",
            imagen: data.thumbnailUrl || recursoEjemplo.imagen,
            autor: {
              ...recursoEjemplo.autor,
              id: data.userId,
              nombre: data.userId ? `Usuario ${data.userId}` : "Anónimo"
            },
            fechaPublicacion: data.createdAt ? new Date(data.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            contenido: data.content || recursoEjemplo.contenido,
            enlaceDescarga: data.fileUrl || data.downloadUrl || recursoEjemplo.enlaceDescarga
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
  }, [recursoId, toast]);
  
  const handleEnviarComentario = () => {
    if (!comentario.trim()) return;
    
    setEnviando(true);
    
    // Simular envío
    setTimeout(() => {
      // En una implementación real, harías un POST a la API
      const nuevoComentario = {
        id: recurso.comentarios.length + 1,
        usuario: {
          id: 999,
          nombre: "Usuario",
          avatar: "https://api.dicebear.com/7.x/initials/svg?seed=US",
          verificado: false
        },
        contenido: comentario,
        fecha: new Date().toISOString().split('T')[0],
        valoracion: valoracion
      };
      
      setRecurso({
        ...recurso,
        comentarios: [nuevoComentario, ...recurso.comentarios]
      });
      
      setComentario("");
      setValoracion(0);
      setEnviando(false);
    }, 1000);
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
            "sku": `recurso-${recursoId}`,
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
            
            <div className="relative aspect-video overflow-hidden rounded-lg mb-6">
              <img 
                src={corregirRutaRecurso(recurso.imagen)} 
                alt={recurso.titulo} 
                className="object-cover w-full h-full"
              />
              {recurso.destacado && (
                <Badge className="absolute top-2 right-2 bg-primary">Destacado</Badge>
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
                <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: recurso.contenido }} />
                
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-3">Etiquetas</h3>
                  <div className="flex flex-wrap gap-2">
                    {recurso.tags.map((tag: string, index: number) => (
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
                    href={corregirRutaRecurso(recurso.enlaceDescarga)} 
                    download 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block w-full"
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
                    <Button variant="outline" className="w-full gap-2">
                      <ExternalLink className="w-4 h-4" /> Ver en sitio original
                    </Button>
                  )}
                  
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