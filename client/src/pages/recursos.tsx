import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { corregirRutaRecurso } from "@/lib/utils/resource-utils";
import SEOMeta from "@/components/seo/SEOMeta";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
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
  ChevronDown,
  Download,
  ExternalLink,
  Eye,
  Filter,
  FileCode,
  FileImage,
  FileText,
  FolderArchive,
  LayoutGrid,
  List,
  Search,
  Star,
  ThumbsUp,
  Video,
  Code,
  Film,
  Music,
  Palette,
  PenTool,
  Edit3,
  Box,
  Headphones,
  Cpu,
  Loader2,
  HelpCircle
} from "lucide-react";

// Datos de categorías de ejemplo
const categorias = [
  { id: 1, nombre: "Edición de Video", slug: "edicion-video", icono: <Film className="w-5 h-5" /> },
  { id: 2, nombre: "Diseño 3D", slug: "diseno-3d", icono: <Box className="w-5 h-5" /> },
  { id: 3, nombre: "Efectos de Sonido", slug: "efectos-sonido", icono: <Music className="w-5 h-5" /> },
  { id: 4, nombre: "Plugins y Extensiones", slug: "plugins", icono: <FileCode className="w-5 h-5" /> },
  { id: 5, nombre: "Diseño Gráfico", slug: "diseno-grafico", icono: <Palette className="w-5 h-5" /> },
  { id: 6, nombre: "Plantillas", slug: "plantillas", icono: <FileText className="w-5 h-5" /> },
  { id: 7, nombre: "Tutoriales", slug: "tutoriales", icono: <Video className="w-5 h-5" /> },
  { id: 8, nombre: "Canales de YouTube", slug: "canales-youtube", icono: <Video className="w-5 h-5" /> },
  { id: 9, nombre: "Programas", slug: "programas", icono: <Cpu className="w-5 h-5" /> },
  { id: 10, nombre: "Audio", slug: "audio", icono: <Headphones className="w-5 h-5" /> },
];

// Ejemplo de recursos destacados
const recursoDestacados = [
  {
    id: 1,
    titulo: "Pack de 50 Transiciones para DaVinci Resolve",
    descripcion: "Colección de transiciones profesionales para tus proyectos de video",
    categoria: "Edición de Video",
    autor: "Red Creativa",
    autorVerificado: true,
    imagen: "https://images.unsplash.com/photo-1536240478700-b869070f9279?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&h=300"
  },
  {
    id: 2,
    titulo: "Add-on Ultimate para Blender",
    descripcion: "Herramientas avanzadas para modelado 3D y animación en Blender",
    categoria: "Diseño 3D",
    autor: "BlenderMaster",
    autorVerificado: false,
    imagen: "https://images.unsplash.com/photo-1538307602205-80b5c2ff26ec?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&h=300"
  },
  {
    id: 3,
    titulo: "Librería de Efectos de Sonido Cinematic",
    descripcion: "Más de 200 efectos de sonido para producciones cinematográficas",
    categoria: "Efectos de Sonido",
    autor: "SoundDesigner",
    autorVerificado: true,
    imagen: "https://images.unsplash.com/photo-1558383817-1b2a4a5b49e3?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&h=300"
  },
  {
    id: 4,
    titulo: "Plugin de Corrección de Color para DaVinci",
    descripcion: "Herramienta profesional para la corrección de color en DaVinci Resolve",
    categoria: "Plugins y Extensiones",
    autor: "ColorGrading Pro",
    autorVerificado: false,
    imagen: "https://images.unsplash.com/photo-1542765826-5a42ff50f1df?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&h=300"
  },
];

// Recursos más populares
const recursosMasPopulares = [
  {
    id: 5,
    titulo: "10 Plantillas para Thumbnails de YouTube",
    descripcion: "Plantillas de alta conversión para miniaturas de YouTube",
    categoria: "Diseño Gráfico",
    autor: "ThumbnailPro",
    autorVerificado: true,
    imagen: "https://images.unsplash.com/photo-1516414447565-b14be0adf13e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&h=300"
  },
  {
    id: 6,
    titulo: "Presets de LUTs Cinematográficos",
    descripcion: "30 LUTs profesionales para dar un aspecto cinematográfico a tus videos",
    categoria: "Edición de Video",
    autor: "CineColor",
    autorVerificado: false,
    imagen: "https://images.unsplash.com/photo-1502401478532-60a602a45ead?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&h=300"
  },
  {
    id: 7,
    titulo: "Pack de Iconos para Motion Graphics",
    descripcion: "Más de 500 iconos vectoriales para animación y motion graphics",
    categoria: "Diseño Gráfico",
    autor: "IconMaster",
    autorVerificado: true,
    imagen: "https://images.unsplash.com/photo-1572044162444-ad60f128bdea?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&h=300"
  },
  {
    id: 8,
    titulo: "Los Mejores Canales de YouTube para Aprender DaVinci Resolve",
    descripcion: "Selección curada de los mejores canales para formación en DaVinci Resolve",
    categoria: "Canales de YouTube",
    autor: "Red Creativa",
    autorVerificado: true,
    imagen: "https://images.unsplash.com/photo-1550399105-c4db5fb85c18?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&h=300"
  },
];

// Componente de tarjeta de recurso
function RecursoCard({ recurso }: { recurso: any }) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <div className="aspect-video relative overflow-hidden bg-muted">
        {recurso.imagen ? (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <img 
              src={corregirRutaRecurso(recurso.imagen)} 
              alt={recurso.titulo} 
              className="object-cover w-full h-full"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                // Usar una solución más simple para evitar problemas con innerHTML
                const placeholderDiv = document.createElement('div');
                placeholderDiv.className = "w-full h-full flex items-center justify-center bg-muted";
                placeholderDiv.innerHTML = `
                  <div class="text-muted-foreground flex flex-col items-center">
                    <div class="w-10 h-10 mb-2 opacity-50 flex items-center justify-center">📄</div>
                    <span class="text-xs">${recurso.titulo}</span>
                  </div>
                `;
                if (e.currentTarget.parentElement) {
                  e.currentTarget.parentElement.appendChild(placeholderDiv);
                }
              }}
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <div className="text-muted-foreground flex flex-col items-center">
              <div className="w-10 h-10 mb-2 opacity-50 flex items-center justify-center">📄</div>
              <span className="text-xs">{recurso.titulo}</span>
            </div>
          </div>
        )}
        <Badge className="absolute top-2 right-2 bg-primary">{recurso.categoria}</Badge>
      </div>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-lg leading-tight line-clamp-2">{recurso.titulo}</CardTitle>
        <div className="flex items-center mt-1 text-sm text-muted-foreground">
          <span className="flex items-center">
            {recurso.autor}
            {recurso.autorVerificado && (
              <svg className="w-4 h-4 ml-1 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <CardDescription className="line-clamp-2 text-sm">{recurso.descripcion}</CardDescription>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-end items-center text-sm">
        <Link href={`/recursos/${recurso.id}`}>
          <Button variant="outline" size="sm">Ver Detalles</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

// Componente para las categorías
function CategoriaCard({ categoria }: { categoria: any }) {
  return (
    <Link href={`/recursos/categoria/${categoria.slug}`}>
      <Card className="overflow-hidden transition-all hover:shadow-md hover:border-primary/70 cursor-pointer h-full">
        <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            {categoria.icono}
          </div>
          <CardTitle className="text-lg">{categoria.nombre}</CardTitle>
        </CardContent>
      </Card>
    </Link>
  );
}

// Página principal de recursos
export default function RecursosPage() {
  const [vistaActual, setVistaActual] = useState<'grid' | 'list'>('grid');
  const [filtroActivo, setFiltroActivo] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoriaActual, setCategoriaActual] = useState<string>("todos");
  const [location] = useLocation();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [eliminandoRecursos, setEliminandoRecursos] = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [recursosReales, setRecursosReales] = useState<any[]>([]);
  const [todosLosRecursos, setTodosLosRecursos] = useState<any[]>([]);
  const [cargandoRecursos, setCargandoRecursos] = useState(false);
  
  // Función para corregir las rutas de imágenes y archivos
  const corregirRutaRecurso = (ruta: string | null): string => {
    if (!ruta) return '/placeholder-image.jpg';
    
    // Si la ruta incluye /uploads/ pero comienza con /home/runner/workspace/
    if (ruta.includes('/uploads/') && ruta.startsWith('/home/runner/workspace/')) {
      return '/uploads/' + ruta.split('/uploads/')[1];
    }
    
    // Si es una URL externa, la dejamos igual
    if (ruta.startsWith('http')) {
      return ruta;
    }
    
    // Para cualquier otro caso
    return ruta;
  };
  const { toast } = useToast();
  
  // Obtener información del usuario actual
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/me');
        if (response.ok) {
          const userData = await response.json();
          setCurrentUser(userData);
        }
      } catch (error) {
        console.error("Error al obtener datos del usuario:", error);
      }
    };
    
    fetchCurrentUser();
  }, []);
  
  // Cargar los recursos reales desde el servidor
  useEffect(() => {
    const fetchRecursos = async () => {
      setCargandoRecursos(true);
      try {
        const response = await fetch('/api/recursos');
        if (response.ok) {
          const data = await response.json();
          setRecursosReales(data);
          setTodosLosRecursos(data); // Guardar una copia para poder restaurar después de filtrados
          console.log("Recursos cargados:", data);
        } else {
          console.error("Error al cargar recursos:", response.statusText);
        }
      } catch (error) {
        console.error("Error al cargar recursos:", error);
      } finally {
        setCargandoRecursos(false);
      }
    };
    
    fetchRecursos();
  }, []);

  // Determinar SEO información basada en la URL y filtros
  const getSeoInfo = () => {
    // Si estamos en edición de video
    if (location.includes("edicion-video") || categoriaActual === "edicion-video") {
      return {
        title: "Recursos para Edición de Video | Plugins, Efectos y Herramientas | Red Creativa Pro",
        description: "Biblioteca completa con los mejores recursos para edición de video: plugins, efectos, transiciones, LUTs y herramientas para mejorar tus producciones audiovisuales.",
        keywords: "recursos edición de video, plugins edición, efectos de video, herramientas edición, LUTs profesionales, transiciones video, Red Creativa Pro",
        schema: {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Recursos para Edición de Video",
          "description": "Biblioteca de recursos profesionales para edición de video: plugins, efectos, transiciones y herramientas.",
          "url": "https://redcreativa.pro/recursos",
          "isPartOf": {
            "@type": "WebSite",
            "name": "Red Creativa Pro",
            "url": "https://redcreativa.pro/"
          },
          "about": {
            "@type": "Thing",
            "name": "Edición de Video",
          }
        }
      };
    }
    
    // Para todas las demás categorías o la página principal de recursos
    return {
      title: "Biblioteca de Recursos Creativos | Red Creativa Pro",
      description: "Explora nuestra biblioteca de recursos para creadores: plugins, efectos, herramientas de edición, recursos gráficos, sonidos y más para mejorar tu contenido audiovisual.",
      keywords: "recursos creativos, biblioteca edición, herramientas creatividad, plugins, efectos, recursos diseño, Red Creativa Pro",
      schema: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Biblioteca de Recursos Creativos",
        "description": "Colección de recursos para creadores de contenido y profesionales audiovisuales.",
        "url": "https://redcreativa.pro/recursos",
        "isPartOf": {
          "@type": "WebSite",
          "name": "Red Creativa Pro",
          "url": "https://redcreativa.pro/"
        }
      }
    };
  };
  
  const seoInfo = getSeoInfo();

  // Función para manejar la eliminación de recursos preestablecidos
  const handleEliminarRecursosPreestablecidos = async () => {
    if (!currentUser || (currentUser.username !== 'sela_gr' && currentUser.username !== 'redcreativa')) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para realizar esta acción",
        variant: "destructive"
      });
      return;
    }
    
    setEliminandoRecursos(true);
    try {
      const response = await apiRequest('DELETE', '/api/recursos/preestablecidos');
      const data = await response.json();
      
      toast({
        title: "Operación completada",
        description: data.message,
        variant: "default"
      });
      
      // Cerrar el diálogo
      setAlertDialogOpen(false);
    } catch (error) {
      console.error("Error al eliminar recursos:", error);
      toast({
        title: "Error",
        description: "Ha ocurrido un error al eliminar los recursos preestablecidos",
        variant: "destructive"
      });
    } finally {
      setEliminandoRecursos(false);
    }
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setBuscando(true);
      
      // Filtrar los recursos basados en la consulta
      const resultados = todosLosRecursos.filter(recurso => 
        recurso.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        recurso.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (recurso.tags && recurso.tags.some((tag: string) => 
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        ))
      );
      
      // Actualizar la lista de recursos mostrados
      setRecursosReales(resultados);
      setFiltroActivo(true);
      
      // Desactivar el indicador de búsqueda
      setTimeout(() => {
        setBuscando(false);
      }, 1000);
    } else {
      // Si la búsqueda está vacía, mostrar todos los recursos
      setRecursosReales(todosLosRecursos);
      setFiltroActivo(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6">
      <SEOMeta
        title={seoInfo.title}
        description={seoInfo.description}
        keywords={seoInfo.keywords}
        canonicalUrl="https://redcreativa.pro/recursos"
        ogUrl="https://redcreativa.pro/recursos"
        lang="es"
        schema={seoInfo.schema}
      />
      
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Biblioteca de Recursos</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Explora los mejores recursos para creadores de contenido: plantillas, efectos, tutoriales y mucho más
        </p>
        

        
        {/* Buscador */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mt-6 relative">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar recursos..."
              className="pl-10 pr-20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button 
              type="submit" 
              className="absolute right-1 top-1 bottom-1 px-4"
              disabled={buscando}
            >
              {buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
            </Button>
          </div>
        </form>
      </div>
      
      {/* Pestañas principales */}
      <Tabs defaultValue="destacados" className="w-full">
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="destacados">Destacados</TabsTrigger>
            <TabsTrigger value="populares">Más Populares</TabsTrigger>
            <TabsTrigger value="recientes">Recientes</TabsTrigger>
            <TabsTrigger value="categorias">Categorías</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Filter className="w-4 h-4" /> Filtrar
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Star className="w-4 h-4 mr-2" /> Mejor valorados
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="w-4 h-4 mr-2" /> Más descargados
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Eye className="w-4 h-4 mr-2" /> Más vistos
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <FileImage className="w-4 h-4 mr-2" /> Plantillas
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileCode className="w-4 h-4 mr-2" /> Plugins
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FolderArchive className="w-4 h-4 mr-2" /> Packs
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ExternalLink className="w-4 h-4 mr-2" /> Enlaces externos
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="flex items-center border rounded-md overflow-hidden">
              <Button 
                variant={vistaActual === 'grid' ? "default" : "ghost"} 
                size="sm" 
                className="rounded-none px-2"
                onClick={() => setVistaActual('grid')}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button 
                variant={vistaActual === 'list' ? "default" : "ghost"} 
                size="sm" 
                className="rounded-none px-2"
                onClick={() => setVistaActual('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Contenido de las pestañas */}
        <TabsContent value="destacados" className="mt-6">
          {cargandoRecursos ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
              <p>Cargando recursos destacados...</p>
            </div>
          ) : recursosReales.length === 0 ? (
            <div className="text-center py-10 border border-dashed rounded-lg">
              <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">No hay recursos disponibles</h3>
              <p className="text-muted-foreground mt-1">
                Aún no se han subido recursos o no hay recursos que coincidan con tu búsqueda.
              </p>
              {currentUser && (
                <Button asChild className="mt-4">
                  <Link href="/subir-recurso">Subir un recurso</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recursosReales.filter(r => r.isFeatured).length > 0 ? 
                recursosReales.filter(r => r.isFeatured).map((recurso) => (
                  <RecursoCard 
                    key={recurso.id} 
                    recurso={{
                      id: recurso.id,
                      titulo: recurso.title,
                      descripcion: recurso.description,
                      categoria: recurso.categoryId.toString(),
                      autor: "Usuario " + recurso.userId,
                      autorVerificado: recurso.isVerified,
                      imagen: recurso.thumbnailUrl || '/placeholder-image.jpg'
                    }} 
                  />
                )) : 
                recursosReales.slice(0, 4).map((recurso) => (
                  <RecursoCard 
                    key={recurso.id} 
                    recurso={{
                      id: recurso.id,
                      titulo: recurso.title,
                      descripcion: recurso.description,
                      categoria: recurso.categoryId.toString(),
                      autor: "Usuario " + recurso.userId,
                      autorVerificado: recurso.isVerified,
                      imagen: recurso.thumbnailUrl || '/placeholder-image.jpg'
                    }} 
                  />
                ))
              }
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="populares" className="mt-6">
          {cargandoRecursos ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
              <p>Cargando recursos populares...</p>
            </div>
          ) : recursosReales.length === 0 ? (
            <div className="text-center py-10 border border-dashed rounded-lg">
              <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">No hay recursos disponibles</h3>
              <p className="text-muted-foreground mt-1">
                Aún no se han subido recursos o no hay recursos que coincidan con tu búsqueda.
              </p>
              {currentUser && (
                <Button asChild className="mt-4">
                  <Link href="/subir-recurso">Subir un recurso</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recursosReales
                .sort((a, b) => (b.viewCount + b.downloadCount) - (a.viewCount + a.downloadCount))
                .slice(0, 8)
                .map((recurso) => (
                  <RecursoCard 
                    key={recurso.id} 
                    recurso={{
                      id: recurso.id,
                      titulo: recurso.title,
                      descripcion: recurso.description,
                      categoria: recurso.categoryId.toString(),
                      autor: "Usuario " + recurso.userId,
                      autorVerificado: recurso.isVerified,
                      imagen: recurso.thumbnailUrl || '/placeholder-image.jpg'
                    }} 
                  />
                ))
              }
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="recientes" className="mt-6">
          {cargandoRecursos ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
              <p>Cargando recursos recientes...</p>
            </div>
          ) : recursosReales.length === 0 ? (
            <div className="text-center py-10 border border-dashed rounded-lg">
              <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">No hay recursos disponibles</h3>
              <p className="text-muted-foreground mt-1">
                Aún no se han subido recursos o no hay recursos que coincidan con tu búsqueda.
              </p>
              {currentUser && (
                <Button asChild className="mt-4">
                  <Link href="/subir-recurso">Subir un recurso</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recursosReales
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((recurso) => (
                  <RecursoCard 
                    key={recurso.id} 
                    recurso={{
                      id: recurso.id,
                      titulo: recurso.title,
                      descripcion: recurso.description,
                      categoria: recurso.categoryId.toString(),
                      autor: "Usuario " + recurso.userId,
                      autorVerificado: recurso.isVerified,
                      imagen: recurso.thumbnailUrl || '/placeholder-image.jpg'
                    }} 
                  />
                ))
              }
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="categorias" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {categorias.map((categoria) => (
              <CategoriaCard key={categoria.id} categoria={categoria} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Sección de subir recursos */}
      <div className="mt-16 border-t pt-10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">¿Tienes recursos para compartir?</h2>
          <p className="text-muted-foreground mb-6">
            Comparte tus mejores plantillas, plugins, efectos o tutoriales con la comunidad de creadores
          </p>
          <Link href="/recursos/subir">
            <Button size="lg" className="gap-2">
              <PenTool className="w-5 h-5" /> Subir Recurso
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}