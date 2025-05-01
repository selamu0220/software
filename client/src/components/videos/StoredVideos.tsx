import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { UserVideo } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Video, 
  Trash2, 
  Download, 
  Share2, 
  Edit,
  X,
  Check,
  AlertCircle,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface StoredVideosProps {
  userId: number | undefined;
}

export const StoredVideos = ({ userId }: StoredVideosProps) => {
  const { toast } = useToast();
  const [editingVideo, setEditingVideo] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(false);

  // Fetching stored videos
  const { 
    data: videos = [], 
    isLoading, 
    error 
  } = useQuery<UserVideo[]>({
    queryKey: ['/api/videos'],
    enabled: !!userId,
    refetchOnWindowFocus: false
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (videoId: number) => {
      await apiRequest('DELETE', `/api/videos/${videoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
      toast({
        title: "Video eliminado",
        description: "El video ha sido eliminado permanentemente."
      });
    },
    onError: (error) => {
      console.error("Error deleting video:", error);
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar el video. Intenta de nuevo más tarde.",
        variant: "destructive"
      });
    }
  });

  // Update video details mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      videoId,
      updates
    }: {
      videoId: number;
      updates: { title?: string; description?: string | null; isPublic?: boolean }
    }) => {
      return await apiRequest('PATCH', `/api/videos/${videoId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
      setEditingVideo(null);
      toast({
        title: "Video actualizado",
        description: "Los detalles del video han sido actualizados correctamente."
      });
    },
    onError: (error) => {
      console.error("Error updating video:", error);
      toast({
        title: "Error al actualizar",
        description: "No se pudieron actualizar los detalles del video.",
        variant: "destructive"
      });
    }
  });

  // Start editing a video
  const startEditing = (video: UserVideo) => {
    setEditingVideo(video.id);
    setEditTitle(video.title);
    setEditDescription(video.description || "");
    setEditIsPublic(video.isPublic);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingVideo(null);
  };

  // Save edited video details
  const saveVideoDetails = (videoId: number) => {
    updateMutation.mutate({
      videoId,
      updates: {
        title: editTitle,
        description: editDescription || null,
        isPublic: editIsPublic
      }
    });
  };

  // Format file size to readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle video sharing
  const shareVideo = (video: UserVideo) => {
    if (!video.isPublic) {
      toast({
        title: "Video privado",
        description: "Debes hacer público el video antes de poder compartirlo.",
        variant: "destructive"
      });
      return;
    }
    
    // Create a shareable URL
    const shareUrl = `${window.location.origin}/api/videos/${video.id}/content`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        toast({
          title: "Enlace copiado",
          description: "El enlace del video ha sido copiado al portapapeles."
        });
      })
      .catch(err => {
        console.error("Error copying link:", err);
        toast({
          title: "Error al copiar",
          description: "No se pudo copiar el enlace. Inténtalo manualmente.",
          variant: "destructive"
        });
      });
  };

  if (!userId) {
    return (
      <div className="p-12 text-center rounded-lg border border-border bg-muted/20">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
        <h3 className="text-lg font-medium mb-2">Debes iniciar sesión</h3>
        <p className="text-muted-foreground">
          Inicia sesión para ver tus videos almacenados.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando videos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center rounded-lg border border-destructive bg-destructive/10">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
        <h3 className="text-lg font-medium mb-2">Error al cargar videos</h3>
        <p className="text-muted-foreground">
          No se pudieron cargar tus videos. Intenta recargar la página.
        </p>
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="p-12 text-center rounded-lg border border-border bg-muted/20">
        <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
        <h3 className="text-lg font-medium mb-2">No hay videos almacenados</h3>
        <p className="text-muted-foreground">
          Los videos que subas aparecerán aquí para que puedas gestionarlos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {videos.map((video: UserVideo) => (
        <Card key={video.id} className="overflow-hidden">
          {editingVideo === video.id ? (
            // Editing mode
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Editar Video</h3>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={cancelEditing}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => saveVideoDetails(video.id)}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-1" />
                    )}
                    Guardar
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="video-title">Título</Label>
                  <Input 
                    id="video-title" 
                    value={editTitle} 
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Título del video"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="video-description">Descripción</Label>
                  <Textarea 
                    id="video-description" 
                    value={editDescription} 
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Descripción opcional"
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="video-public" 
                    checked={editIsPublic}
                    onCheckedChange={setEditIsPublic}
                  />
                  <Label htmlFor="video-public">Video público</Label>
                </div>
              </div>
            </div>
          ) : (
            // Display mode
            <div className="grid md:grid-cols-[300px,1fr] grid-cols-1">
              <div className="aspect-video bg-black flex items-center justify-center overflow-hidden">
                <video 
                  src={`/api/videos/${video.id}/content`}
                  controls 
                  className="w-full h-full object-contain" 
                />
              </div>
              <div className="p-4 flex flex-col">
                <div className="mb-2">
                  <h3 className="text-lg font-medium truncate">{video.title}</h3>
                  
                  <div className="text-sm text-muted-foreground space-y-1 mt-1">
                    <p>
                      Subido: {format(new Date(video.uploadDate), "PPP", { locale: es })}
                    </p>
                    <p>Tamaño: {formatFileSize(video.fileSize)}</p>
                    <p>Estado: {video.isPublic ? "Público" : "Privado"}</p>
                  </div>
                  
                  {video.description && (
                    <p className="mt-3 text-sm">
                      {video.description}
                    </p>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 mt-auto pt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(`/api/videos/${video.id}/content`, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Descargar
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => shareVideo(video)}
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    Compartir
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => startEditing(video)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => {
                      if (confirm("¿Estás seguro que deseas eliminar este video? Esta acción no se puede deshacer.")) {
                        deleteMutation.mutate(video.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-1" />
                    )}
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default StoredVideos;