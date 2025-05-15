import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { VideoIdea } from "@shared/schema";
import { Link } from "wouter";
import { Helmet } from "react-helmet";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Plus, 
  FileText, 
  Clock, 
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShareButton } from "@/components/video-ideas/ShareButton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
// Estos componentes ya se renderizan a nivel de App
// import Navbar from "@/components/layout/Navbar";
// import Footer from "@/components/layout/Footer";

export default function MisIdeas() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [expandedIdea, setExpandedIdea] = useState<number | null>(null);

  // Obtener las ideas del usuario
  const { data: videoIdeas, isLoading } = useQuery<VideoIdea[]>({
    queryKey: ["/api/video-ideas"],
    refetchOnWindowFocus: false,
  });

  // Formatear la fecha
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return format(date, "d 'de' MMMM, yyyy", { locale: es });
  };

  // Manejar el cambio de visibilidad de una idea
  const handleVisibilityChange = (updatedIdea: VideoIdea) => {
    queryClient.setQueryData<VideoIdea[]>(["/api/video-ideas"], (oldData) => {
      if (!oldData) return [];
      return oldData.map((idea) => 
        idea.id === updatedIdea.id ? updatedIdea : idea
      );
    });
  };

  // Filtrar y ordenar las ideas
  const filteredIdeas = videoIdeas
    ? videoIdeas
        .filter((idea) => {
          // Filtrar por término de búsqueda (título)
          const matchesSearch = idea.title
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
          
          // Filtrar por categoría si se ha seleccionado una
          const matchesCategory = 
            categoryFilter === "all" || 
            idea.category === categoryFilter;
          
          return matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
          // Ordenar por fecha de creación
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
        })
    : [];

  // Obtener categorías únicas para el filtro
  const categories = videoIdeas
    ? Array.from(new Set(videoIdeas.map((idea) => idea.category)))
    : [];

  const toggleExpanded = (id: number) => {
    setExpandedIdea(expandedIdea === id ? null : id);
  };

  return (
    <>
      <Helmet>
        <title>Mis Ideas de Video | Red Creativa Pro</title>
        <meta
          name="description"
          content="Gestiona tus ideas de videos generados con IA y compártelas con tu equipo o comunidad."
        />
      </Helmet>

      {/* El componente Navbar se renderiza a nivel de App, no lo necesitamos aquí */}

      <main className="container max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Mis Ideas de Video</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona y comparte tus ideas generadas con IA
            </p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <Link href="/">
              <Button className="flex items-center gap-2">
                <Plus size={16} />
                <span>Nueva Idea</span>
              </Button>
            </Link>
            <Link href="/calendar">
              <Button variant="outline" className="flex items-center gap-2">
                <Calendar size={16} />
                <span>Calendario</span>
              </Button>
            </Link>
          </div>
        </div>

        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle>Filtros y Búsqueda</CardTitle>
            <CardDescription>
              Encuentra rápidamente ideas específicas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="w-full md:w-48">
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <SelectValue placeholder="Categoría" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-48">
                <Select
                  value={sortOrder}
                  onValueChange={(value) => setSortOrder(value as "asc" | "desc")}
                >
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      <SelectValue placeholder="Ordenar por" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Más recientes primero</SelectItem>
                    <SelectItem value="asc">Más antiguas primero</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filteredIdeas.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex flex-col items-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No se encontraron ideas</h3>
                <p className="text-muted-foreground mb-6">
                  {videoIdeas?.length === 0
                    ? "Aún no has generado ninguna idea de video."
                    : "No hay ideas que coincidan con tus filtros de búsqueda."}
                </p>
                <Link href="/">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Generar Nueva Idea
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredIdeas.map((idea) => (
              <Card 
                key={idea.id} 
                className={`transition-all ${expandedIdea === idea.id ? 'border-primary' : ''}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{idea.title}</CardTitle>
                      <CardDescription className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline">{idea.category}</Badge>
                        <Badge variant="outline">{idea.subcategory}</Badge>
                        <Badge variant="outline">{idea.videoLength}</Badge>
                        <div className="flex items-center text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(idea.createdAt)}
                        </div>
                      </CardDescription>
                    </div>
                    <ShareButton 
                      videoIdea={idea} 
                      onVisibilityChange={handleVisibilityChange}
                    />
                  </div>
                </CardHeader>
                
                <CardContent className={`pt-0 ${expandedIdea === idea.id ? '' : 'hidden'}`}>
                  <Separator className="my-4" />
                  <div className="space-y-4">
                    {/* Contenido expandido */}
                    {typeof idea.content === 'object' && (
                      <>
                        {/* Mostrar puntos clave / esquema */}
                        {(idea.content as any).outline && (
                          <div>
                            <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider font-mono">
                              Esquema del Video
                            </h3>
                            <ul className="list-disc pl-6 space-y-1">
                              {(idea.content as any).outline.map((point: string, i: number) => (
                                <li key={i} className="text-base">{point}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          {/* Thumbnails e interacción */}
                          {(idea.content as any).thumbnailIdea && (
                            <div className="p-4 bg-muted/30 rounded-lg">
                              <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider font-mono">
                                Idea de Miniatura
                              </h3>
                              <p className="text-sm">{(idea.content as any).thumbnailIdea}</p>
                            </div>
                          )}
                          
                          {(idea.content as any).interactionQuestion && (
                            <div className="p-4 bg-muted/30 rounded-lg">
                              <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider font-mono">
                                Pregunta para Interacción
                              </h3>
                              <p className="text-sm">{(idea.content as any).interactionQuestion}</p>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between pt-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleExpanded(idea.id)}
                  >
                    {expandedIdea === idea.id ? "Ocultar" : "Ver detalles"}
                  </Button>
                  
                  <div className="flex gap-2">
                    <Link href={`/script-editor/${idea.id}`}>
                      <Button variant="secondary" size="sm">
                        Editar
                      </Button>
                    </Link>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* El Footer se renderiza a nivel de App */}
    </>
  );
}