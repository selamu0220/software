import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, Youtube } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export interface YouTubeTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface YouTubeConnectProps {
  tokens?: YouTubeTokens;
  onConnect?: (tokens: YouTubeTokens) => void;
  onDisconnect?: () => void;
}

export default function YouTubeConnect({ tokens, onConnect, onDisconnect }: YouTubeConnectProps) {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState<boolean>(!!tokens?.accessToken);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [channelInfo, setChannelInfo] = useState<{
    name: string;
    thumbnail: string;
  } | null>(null);
  
  // Estado para el diálogo de publicación
  const [publishDialogOpen, setPublishDialogOpen] = useState<boolean>(false);
  const [videoToPublish, setVideoToPublish] = useState<{
    id: string;
    name: string;
    url: string;
  } | null>(null);
  const [publishForm, setPublishForm] = useState({
    title: "",
    description: "",
    tags: "",
    isPrivate: true
  });
  const [isUploading, setIsUploading] = useState<boolean>(false);
  
  // Verificar si los tokens están expirados
  useEffect(() => {
    if (tokens?.accessToken && tokens?.expiresAt) {
      const now = Date.now();
      if (now >= tokens.expiresAt) {
        // Tokens expirados, intentar renovar
        refreshTokens();
      } else {
        // Tokens válidos, obtener información del canal
        fetchChannelInfo();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens]);
  
  // Escuchar eventos para abrir el diálogo de publicación
  useEffect(() => {
    const handleOpenPublishDialog = (event: CustomEvent) => {
      const video = event.detail;
      if (video) {
        openPublishDialog(video);
      }
    };
    
    window.addEventListener("OPEN_YOUTUBE_PUBLISH", handleOpenPublishDialog as EventListener);
    
    return () => {
      window.removeEventListener("OPEN_YOUTUBE_PUBLISH", handleOpenPublishDialog as EventListener);
    };
  }, []);
  
  // Obtener información del canal
  const fetchChannelInfo = async () => {
    try {
      const response = await apiRequest("GET", "/api/youtube/channel");
      const data = await response.json();
      
      if (data.name && data.thumbnail) {
        setChannelInfo({
          name: data.name,
          thumbnail: data.thumbnail
        });
        setIsConnected(true);
      }
    } catch (error) {
      console.error("Error al obtener información del canal:", error);
      setIsConnected(false);
    }
  };
  
  // Refrescar tokens
  const refreshTokens = async () => {
    try {
      const response = await apiRequest("POST", "/api/youtube/refresh-token");
      const data = await response.json();
      
      if (data.accessToken && data.refreshToken) {
        onConnect?.({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresAt: data.expiresAt
        });
        fetchChannelInfo();
      }
    } catch (error) {
      console.error("Error al refrescar tokens:", error);
      setIsConnected(false);
      onDisconnect?.();
    }
  };
  
  // Iniciar el proceso de conexión
  const connectYouTube = async () => {
    setIsConnecting(true);
    
    try {
      // Obtener la URL de autorización de Google OAuth
      const response = await apiRequest("GET", "/api/youtube/auth-url");
      const data = await response.json();
      
      if (data.url) {
        // Abrir una nueva ventana para la autorización
        const width = 600;
        const height = 800;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        const authWindow = window.open(
          data.url,
          "youtube-auth",
          `width=${width},height=${height},left=${left},top=${top}`
        );
        
        // Manejar el mensaje de la ventana de autorización
        const handleMessage = (event: MessageEvent) => {
          if (event.data.type === "YOUTUBE_AUTH_SUCCESS") {
            authWindow?.close();
            
            const { accessToken, refreshToken, expiresAt } = event.data;
            onConnect?.({
              accessToken,
              refreshToken,
              expiresAt
            });
            
            setIsConnected(true);
            fetchChannelInfo();
            
            toast({
              title: "Conectado a YouTube",
              description: "Tu cuenta de YouTube ha sido conectada correctamente.",
            });
            
            window.removeEventListener("message", handleMessage);
          }
        };
        
        window.addEventListener("message", handleMessage);
      }
    } catch (error) {
      console.error("Error al conectar YouTube:", error);
      toast({
        title: "Error de conexión",
        description: "No se pudo iniciar la conexión con YouTube.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Desconectar cuenta
  const disconnectYouTube = async () => {
    try {
      await apiRequest("POST", "/api/youtube/disconnect");
      
      setIsConnected(false);
      setChannelInfo(null);
      onDisconnect?.();
      
      toast({
        title: "Desconectado de YouTube",
        description: "Tu cuenta de YouTube ha sido desconectada.",
      });
    } catch (error) {
      console.error("Error al desconectar YouTube:", error);
      toast({
        title: "Error",
        description: "No se pudo desconectar la cuenta de YouTube.",
        variant: "destructive",
      });
    }
  };
  
  // Abrir el diálogo de publicación
  const openPublishDialog = (video: { id: string; name: string; url: string }) => {
    setVideoToPublish(video);
    setPublishForm({
      title: video.name,
      description: "",
      tags: "",
      isPrivate: true
    });
    setPublishDialogOpen(true);
  };
  
  // Publicar video en YouTube
  const publishVideo = async () => {
    if (!videoToPublish) return;
    
    setIsUploading(true);
    
    try {
      // Convertir el blob URL a blob
      const response = await fetch(videoToPublish.url);
      const blob = await response.blob();
      
      // Crear FormData
      const formData = new FormData();
      formData.append('video', blob, `${videoToPublish.name}.webm`);
      formData.append('title', publishForm.title);
      formData.append('description', publishForm.description);
      formData.append('tags', publishForm.tags);
      formData.append('private', publishForm.isPrivate.toString());
      
      // Subir a YouTube
      const uploadResponse = await apiRequest(
        'POST',
        '/api/youtube/upload',
        formData,
        true // enviar como FormData en lugar de JSON
      );
      
      const uploadData = await uploadResponse.json();
      
      if (uploadData.success && uploadData.videoId) {
        toast({
          title: "Video publicado en YouTube",
          description: "Tu video ha sido publicado correctamente.",
        });
        
        setPublishDialogOpen(false);
        // Aquí podrías añadir un callback para actualizar la lista de videos publicados
      } else {
        throw new Error(uploadData.message || "No se pudo publicar el video");
      }
    } catch (error: any) {
      console.error("Error al publicar en YouTube:", error);
      toast({
        title: "Error de publicación",
        description: error.message || "No se pudo publicar el video en YouTube.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-500" />
            Conexión a YouTube
          </CardTitle>
          <CardDescription>
            Conecta tu cuenta de YouTube para publicar videos directamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isConnected && channelInfo ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {channelInfo.thumbnail && (
                  <img 
                    src={channelInfo.thumbnail} 
                    alt={channelInfo.name}
                    className="h-12 w-12 rounded-full" 
                  />
                )}
                <div>
                  <h3 className="font-medium">{channelInfo.name}</h3>
                  <p className="text-sm text-muted-foreground">Cuenta conectada</p>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={disconnectYouTube}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Desconectar cuenta
              </Button>
            </div>
          ) : (
            <Button 
              onClick={connectYouTube} 
              className="w-full"
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Youtube className="mr-2 h-4 w-4" />
                  Conectar con YouTube
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
      
      {/* Diálogo de publicación */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Publicar en YouTube</DialogTitle>
            <DialogDescription>
              Completa la información para publicar tu video en YouTube.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título del video</Label>
              <Input 
                id="title" 
                value={publishForm.title}
                onChange={(e) => setPublishForm({...publishForm, title: e.target.value})}
                disabled={isUploading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea 
                id="description" 
                rows={4}
                value={publishForm.description}
                onChange={(e) => setPublishForm({...publishForm, description: e.target.value})}
                disabled={isUploading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags">Etiquetas (separadas por comas)</Label>
              <Input 
                id="tags" 
                value={publishForm.tags}
                onChange={(e) => setPublishForm({...publishForm, tags: e.target.value})}
                disabled={isUploading}
                placeholder="tutorial, español, contenido educativo"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="private" 
                checked={publishForm.isPrivate}
                onCheckedChange={(checked) => setPublishForm({...publishForm, isPrivate: checked})}
                disabled={isUploading}
              />
              <Label htmlFor="private">Publicar como privado</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setPublishDialogOpen(false)}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={publishVideo}
              disabled={isUploading || !publishForm.title}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publicando...
                </>
              ) : (
                "Publicar en YouTube"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Exportamos función para utilizarla desde cualquier componente
export function openYouTubePublishDialog(video: { id: string; name: string; url: string }) {
  // Buscamos la instancia del componente YouTubeConnect
  const event = new CustomEvent("OPEN_YOUTUBE_PUBLISH", { detail: video });
  window.dispatchEvent(event);
}