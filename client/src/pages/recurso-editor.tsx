import { useState, useEffect } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { Helmet } from "react-helmet";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, ArrowLeft, Trash2 } from "lucide-react";

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

export default function RecursoEditor() {
  const [match, params] = useRoute("/recurso-editor/:id?");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);
  
  const [recurso, setRecurso] = useState({
    id: 0,
    title: "",
    description: "",
    content: "",
    categoryId: "1",
    subcategoryId: null,
    externalUrl: "",
    isPublic: true
  });
  
  // Cargar categorías
  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const response = await fetch('/api/recursos/categorias');
        if (response.ok) {
          const data = await response.json();
          setCategorias(data);
        }
      } catch (error) {
        console.error("Error al cargar categorías:", error);
      }
    };
    
    cargarCategorias();
  }, []);
  
  // Cargar recurso si estamos editando
  useEffect(() => {
    const cargarRecurso = async () => {
      if (!params || !params.id || params.id === "nuevo") {
        setCargando(false);
        return;
      }
      
      setCargando(true);
      try {
        const response = await fetch(`/api/recursos/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setRecurso({
            id: data.id,
            title: data.title,
            description: data.description,
            content: data.content || "",
            categoryId: data.categoryId.toString(),
            subcategoryId: data.subcategoryId,
            externalUrl: data.externalUrl || "",
            isPublic: data.isPublic
          });
        } else {
          toast({
            title: "Error",
            description: "No se pudo cargar el recurso",
            variant: "destructive"
          });
          navigate("/recursos");
        }
      } catch (error) {
        console.error("Error al cargar recurso:", error);
        toast({
          title: "Error",
          description: "Error al cargar el recurso",
          variant: "destructive"
        });
      } finally {
        setCargando(false);
      }
    };
    
    cargarRecurso();
  }, [params, toast, navigate]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRecurso(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setRecurso(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recurso.title.trim()) {
      toast({
        title: "Error",
        description: "El título es obligatorio",
        variant: "destructive"
      });
      return;
    }
    
    setGuardando(true);
    try {
      const method = recurso.id ? 'PUT' : 'POST';
      const endpoint = recurso.id ? `/api/recursos/${recurso.id}` : '/api/recursos';
      
      const response = await apiRequest(method, endpoint, recurso);
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Éxito",
          description: recurso.id ? "Recurso actualizado correctamente" : "Recurso creado correctamente"
        });
        navigate(recurso.id ? `/recursos/${data.id}` : "/recursos");
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Error al guardar el recurso",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error al guardar:", error);
      toast({
        title: "Error",
        description: "Error al guardar el recurso",
        variant: "destructive"
      });
    } finally {
      setGuardando(false);
    }
  };
  
  const handleEliminar = async () => {
    if (!recurso.id) return;
    
    setEliminando(true);
    try {
      const response = await apiRequest('DELETE', `/api/recursos/${recurso.id}`);
      
      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Recurso eliminado correctamente"
        });
        navigate("/recursos");
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Error al eliminar el recurso",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
      toast({
        title: "Error",
        description: "Error al eliminar el recurso",
        variant: "destructive"
      });
    } finally {
      setEliminando(false);
      setConfirmDialogOpen(false);
    }
  };
  
  if (cargando) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Cargando...</span>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <Helmet>
        <title>{recurso.id ? "Editar Recurso" : "Crear Nuevo Recurso"} | Red Creativa Pro</title>
      </Helmet>
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="outline" size="sm" onClick={() => navigate("/recursos")} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Button>
          <h1 className="text-2xl font-bold">{recurso.id ? "Editar Recurso" : "Crear Nuevo Recurso"}</h1>
        </div>
        
        {recurso.id && (
          <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={eliminando}>
                <Trash2 className="h-4 w-4 mr-1" /> Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará permanentemente el recurso y no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleEliminar} disabled={eliminando}>
                  {eliminando ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
                  {eliminando ? "Eliminando..." : "Eliminar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{recurso.id ? "Editar Información" : "Información del Recurso"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block mb-2 text-sm font-medium">Título</label>
                <Input
                  id="title"
                  name="title"
                  value={recurso.title}
                  onChange={handleChange}
                  required
                  placeholder="Título del recurso"
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block mb-2 text-sm font-medium">Descripción</label>
                <Textarea
                  id="description"
                  name="description"
                  value={recurso.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Descripción del recurso"
                />
              </div>
              
              <div>
                <label htmlFor="content" className="block mb-2 text-sm font-medium">Contenido</label>
                <Textarea
                  id="content"
                  name="content"
                  value={recurso.content || ""}
                  onChange={handleChange}
                  rows={10}
                  placeholder="Contenido detallado del recurso. Puedes usar Markdown."
                  className="font-mono"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="categoryId" className="block mb-2 text-sm font-medium">Categoría</label>
                  <Select 
                    value={recurso.categoryId} 
                    onValueChange={(value) => handleSelectChange("categoryId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label htmlFor="externalUrl" className="block mb-2 text-sm font-medium">URL Externa (opcional)</label>
                  <Input
                    id="externalUrl"
                    name="externalUrl"
                    value={recurso.externalUrl || ""}
                    onChange={handleChange}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={guardando}>
                {guardando ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                {guardando ? "Guardando..." : "Guardar Recurso"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}