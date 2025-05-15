import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  FolderPlus, 
  FolderOpen, 
  Plus, 
  Search, 
  Clock, 
  Edit, 
  Copy, 
  Trash, 
  MoreVertical,
  ArrowLeft,
  Loader2,
  Calendar,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

// Tipos
interface Script {
  id: number;
  title: string;
  subtitle?: string;
  description?: string;
  tags: string[];
  category?: string;
  sections: Array<{
    id: string;
    title: string;
    content: string;
    type: string;
    duration?: string;
  }>;
  template?: boolean;
  createdAt: Date;
  updatedAt: Date;
  collectionId: number;
  totalDuration?: string;
}

interface ScriptCollection {
  id: number;
  name: string;
  description: string | null;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  icon?: string;
  color?: string;
  isPublic?: boolean;
  isDefault?: boolean;
  scriptsCount?: number;
  scripts?: Script[];
}

const MisGuiones = () => {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Estados
  const [collections, setCollections] = useState<ScriptCollection[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showCreateCollectionDialog, setShowCreateCollectionDialog] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [collectionToDelete, setCollectionToDelete] = useState<number | null>(null);
  
  // Consulta para obtener las colecciones de guiones
  const { data: collectionsData, isLoading: loadingCollections, refetch: refetchCollections } = useQuery({
    queryKey: ['/api/script-collections'],
    enabled: !!user,
  });
  
  // Mutación para crear una colección
  const createCollectionMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const res = await apiRequest('POST', '/api/script-collections', data);
      
      if (!res.ok) {
        throw new Error("Error al crear la colección");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      setShowCreateCollectionDialog(false);
      setNewCollectionName("");
      setNewCollectionDescription("");
      
      toast({
        title: "Colección creada",
        description: "La colección de guiones se ha creado correctamente",
      });
      
      // Actualizar datos
      refetchCollections();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo crear la colección: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Mutación para eliminar una colección
  const deleteCollectionMutation = useMutation({
    mutationFn: async (collectionId: number) => {
      const res = await apiRequest('DELETE', `/api/script-collections/${collectionId}`);
      
      if (!res.ok) {
        throw new Error("Error al eliminar la colección");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      setCollectionToDelete(null);
      
      toast({
        title: "Colección eliminada",
        description: "La colección se ha eliminado correctamente",
      });
      
      // Actualizar datos
      refetchCollections();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo eliminar la colección: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Actualizar colecciones cuando cambian los datos
  useEffect(() => {
    if (collectionsData) {
      setCollections(collectionsData);
    }
  }, [collectionsData]);
  
  // Crear una nueva colección
  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la colección es obligatorio",
        variant: "destructive",
      });
      return;
    }
    
    createCollectionMutation.mutate({
      name: newCollectionName,
      description: newCollectionDescription
    });
  };
  
  // Eliminar una colección
  const handleDeleteCollection = (collectionId: number) => {
    setCollectionToDelete(collectionId);
  };
  
  const confirmDeleteCollection = () => {
    if (collectionToDelete !== null) {
      deleteCollectionMutation.mutate(collectionToDelete);
    }
  };
  
  // Función para crear un nuevo guión
  const createNewScript = () => {
    navigate("/script-editor");
  };
  
  // Función para editar un guión existente
  const editScript = (scriptId: number) => {
    navigate(`/script-editor/${scriptId}`);
  };
  
  // Función para añadir guión al calendario
  const addScriptToCalendar = async (script: Script) => {
    try {
      // Calcular la fecha para este guión (hoy)
      const today = new Date();
      const formattedDate = today.toISOString();
      
      // Crear una entrada en el calendario
      const response = await apiRequest('POST', '/api/calendar/entry', {
        title: script.title,
        date: formattedDate,
        notes: script.description || `Guión: ${script.title}`,
        color: "#4f46e5" // Indigo
      });
      
      if (!response.ok) {
        throw new Error('Error al añadir al calendario');
      }
      
      toast({
        title: "Añadido al calendario",
        description: `"${script.title}" ha sido añadido al calendario para hoy`,
      });
      
      // Invalidar consultas relacionadas
      queryClient.invalidateQueries({ queryKey: ['/api/calendar'] });
    } catch (error) {
      console.error('Error adding to calendar:', error);
      toast({
        title: 'Error',
        description: 'No se pudo añadir al calendario',
        variant: 'destructive',
      });
    }
  };
  
  // Función para duplicar un guión
  const duplicateScript = async (script: Script) => {
    try {
      // Crear una copia del guión
      const duplicatedScript = {
        ...script,
        title: `${script.title} (Copia)`,
        id: undefined // Eliminar el ID para que se cree uno nuevo
      };
      
      const response = await apiRequest(
        'POST', 
        `/api/script-collections/${script.collectionId}/scripts`, 
        duplicatedScript
      );
      
      if (!response.ok) {
        throw new Error('Error al duplicar el guión');
      }
      
      toast({
        title: "Guión duplicado",
        description: `Se ha creado una copia de "${script.title}"`,
      });
      
      // Actualizar datos
      refetchCollections();
    } catch (error) {
      console.error('Error duplicating script:', error);
      toast({
        title: 'Error',
        description: 'No se pudo duplicar el guión',
        variant: 'destructive',
      });
    }
  };
  
  // Función para eliminar un guión
  const deleteScript = async (scriptId: number) => {
    // Confirmar eliminación
    if (!window.confirm("¿Estás seguro de que quieres eliminar este guión?")) {
      return;
    }
    
    try {
      const response = await apiRequest('DELETE', `/api/scripts/${scriptId}`);
      
      if (!response.ok) {
        throw new Error('Error al eliminar el guión');
      }
      
      toast({
        title: "Guión eliminado",
        description: "El guión ha sido eliminado correctamente",
      });
      
      // Actualizar datos
      refetchCollections();
    } catch (error) {
      console.error('Error deleting script:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el guión',
        variant: 'destructive',
      });
    }
  };
  
  // Filtrar colecciones y guiones según búsqueda y pestaña activa
  const filteredCollections = collections
    .filter(collection => {
      if (searchQuery) {
        const matchesCollection = collection.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesScripts = collection.scripts?.some(script => 
          script.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return matchesCollection || matchesScripts;
      }
      return true;
    })
    .map(collection => {
      // Filtrar scripts dentro de la colección
      const filteredScripts = collection.scripts?.filter(script => {
        const matchesSearch = searchQuery ? 
          script.title.toLowerCase().includes(searchQuery.toLowerCase()) : 
          true;
        
        const matchesTab = activeTab === "all" ? 
          true : 
          (activeTab === "templates" ? script.template : !script.template);
        
        return matchesSearch && matchesTab;
      });
      
      return {
        ...collection,
        scripts: filteredScripts
      };
    })
    .filter(collection => !searchQuery || (collection.scripts && collection.scripts.length > 0));
  
  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <h1 className="text-2xl font-bold">Mis Guiones</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar guiones..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button onClick={() => setShowCreateCollectionDialog(true)}>
            <FolderPlus className="h-4 w-4 mr-2" />
            Nueva Colección
          </Button>
          
          <Button variant="default" onClick={createNewScript}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Guión
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="scripts">Guiones</TabsTrigger>
          <TabsTrigger value="templates">Plantillas</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-6">
          {loadingCollections ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredCollections.length > 0 ? (
            filteredCollections.map(collection => (
              <div key={collection.id} className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">{collection.name}</h2>
                    {collection.description && (
                      <span className="text-sm text-muted-foreground">
                        — {collection.description}
                      </span>
                    )}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDeleteCollection(collection.id)}>
                        <Trash className="h-4 w-4 mr-2" />
                        Eliminar colección
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {collection.scripts && collection.scripts.length > 0 ? (
                    collection.scripts.map(script => (
                      <Card key={script.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{script.title}</CardTitle>
                          <CardDescription>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              {/* Mostrar duración total si existe, sino, usar fecha de actualización */}
                              {script.totalDuration ? 
                                `Duración: ${script.totalDuration}` : 
                                `Actualizado: ${new Date(script.updatedAt).toLocaleDateString()}`
                              }
                            </div>
                          </CardDescription>
                        </CardHeader>
                        
                        <CardContent>
                          {script.tags && script.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {script.tags.map((tag, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          <div className="text-sm text-muted-foreground">
                            {script.sections && (
                              <p>{script.sections.length} {script.sections.length === 1 ? 'sección' : 'secciones'}</p>
                            )}
                          </div>
                        </CardContent>
                        
                        <CardFooter className="flex justify-between bg-muted/50 pt-2">
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8"
                              title="Editar guión"
                              onClick={() => editScript(script.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8"
                              title="Añadir al calendario"
                              onClick={() => addScriptToCalendar(script)}
                            >
                              <Calendar className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => duplicateScript(script)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => deleteScript(script.id)}
                                className="text-red-500"
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </CardFooter>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mb-4" />
                      <p>No hay guiones en esta colección</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => {
                          // Crear un nuevo guión en esta colección
                          navigate(`/script-editor?collection=${collection.id}`);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Crear nuevo guión
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-16 w-16 mb-6" />
              {searchQuery ? (
                <>
                  <p className="text-lg">No se encontraron resultados para "{searchQuery}"</p>
                  <p className="text-sm mt-2">Intenta con otra búsqueda o crea un nuevo guión</p>
                </>
              ) : (
                <>
                  <p className="text-lg">No tienes guiones todavía</p>
                  <p className="text-sm mt-2">Crea tu primer guión o una colección para organizarlos</p>
                </>
              )}
              <div className="flex gap-4 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateCollectionDialog(true)}
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Nueva colección
                </Button>
                <Button onClick={createNewScript}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo guión
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Diálogo para crear colección */}
      <Dialog open={showCreateCollectionDialog} onOpenChange={setShowCreateCollectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear nueva colección</DialogTitle>
            <DialogDescription>
              Crea una colección para organizar tus guiones
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="collection-name" className="text-sm font-medium">
                Nombre
              </label>
              <Input
                id="collection-name"
                placeholder="Nombre de la colección"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="collection-description" className="text-sm font-medium">
                Descripción (opcional)
              </label>
              <Input
                id="collection-description"
                placeholder="Descripción breve"
                value={newCollectionDescription}
                onChange={(e) => setNewCollectionDescription(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateCollectionDialog(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateCollection}
              disabled={createCollectionMutation.isPending}
            >
              {createCollectionMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Crear colección
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para confirmar eliminación de colección */}
      <Dialog 
        open={collectionToDelete !== null} 
        onOpenChange={(open) => !open && setCollectionToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar colección</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar esta colección? Esta acción eliminará todos los guiones contenidos en ella y no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCollectionToDelete(null)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDeleteCollection}
              disabled={deleteCollectionMutation.isPending}
            >
              {deleteCollectionMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MisGuiones;