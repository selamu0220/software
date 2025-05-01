import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SiYoutube } from "react-icons/si";
import { LoaderCircle, Check, X, Upload } from "lucide-react";

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

interface ChannelInfo {
  id: string;
  title: string;
  customUrl?: string;
  thumbnailUrl?: string;
  subscriberCount?: number;
  videoCount?: number;
}

export default function YouTubeConnect({ tokens, onConnect, onDisconnect }: YouTubeConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchChannelInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest("GET", "/api/youtube/channel");
      
      if (response.ok) {
        const data = await response.json();
        setChannelInfo(data);
      } else {
        const error = await response.json();
        if (error.needsAuth) {
          // Token expirado o no válido, borrar estado
          setChannelInfo(null);
          if (onDisconnect) onDisconnect();
        }
      }
    } catch (error) {
      console.error("Error fetching channel info:", error);
      setChannelInfo(null);
    } finally {
      setIsLoading(false);
    }
  }, [onDisconnect]);

  useEffect(() => {
    if (tokens?.accessToken) {
      fetchChannelInfo();
    }
  }, [tokens, fetchChannelInfo]);

  const connectYouTube = async () => {
    try {
      setIsConnecting(true);
      
      // 1. Obtener URL de autorización del servidor
      const authUrlResponse = await apiRequest("GET", "/api/youtube/auth-url");
      
      if (!authUrlResponse.ok) {
        const error = await authUrlResponse.json();
        if (error.missingCredentials) {
          toast({
            title: "Configuración incompleta",
            description: "La API de YouTube no está configurada. Contacta al administrador.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: "No se pudo iniciar el proceso de autenticación",
            variant: "destructive"
          });
        }
        return;
      }
      
      const { url } = await authUrlResponse.json();
      
      // 2. Abrir ventana de autorización de Google
      const authWindow = window.open(url, "youtube-auth", "width=800,height=600");
      
      if (!authWindow) {
        toast({
          title: "Error",
          description: "Por favor, permite las ventanas emergentes para continuar",
          variant: "destructive"
        });
        return;
      }
      
      // 3. Escuchar mensaje de la ventana de callback
      const handleMessage = (event: MessageEvent) => {
        // Verificar que el mensaje sea de nuestra ventana de callback
        if (!event.data || !event.data.type) return;
        
        if (event.data.type === "YOUTUBE_AUTH_SUCCESS") {
          // Autenticación exitosa, guardar tokens
          const tokens: YouTubeTokens = {
            accessToken: event.data.accessToken,
            refreshToken: event.data.refreshToken,
            expiresAt: event.data.expiresAt
          };
          
          if (onConnect) onConnect(tokens);
          
          // Obtener información del canal
          fetchChannelInfo();
          
          toast({
            title: "Conectado con éxito",
            description: "Ahora puedes subir videos directamente a YouTube",
            variant: "default"
          });
          
          // Limpiar listener
          window.removeEventListener("message", handleMessage);
        } else if (event.data.type === "YOUTUBE_AUTH_ERROR") {
          toast({
            title: "Error al conectar",
            description: event.data.error || "No se pudo completar la autenticación",
            variant: "destructive"
          });
          
          // Limpiar listener
          window.removeEventListener("message", handleMessage);
        }
      };
      
      window.addEventListener("message", handleMessage);
    } catch (error) {
      console.error("Error connecting to YouTube:", error);
      toast({
        title: "Error",
        description: "No se pudo conectar con YouTube",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };
  
  const disconnectYouTube = async () => {
    try {
      setIsDisconnecting(true);
      
      const response = await apiRequest("POST", "/api/youtube/disconnect");
      
      if (response.ok) {
        setChannelInfo(null);
        if (onDisconnect) onDisconnect();
        
        toast({
          title: "Desconectado",
          description: "Tu cuenta de YouTube ha sido desconectada",
          variant: "default"
        });
      } else {
        throw new Error("Failed to disconnect");
      }
    } catch (error) {
      console.error("Error disconnecting YouTube:", error);
      toast({
        title: "Error",
        description: "No se pudo desconectar de YouTube",
        variant: "destructive"
      });
    } finally {
      setIsDisconnecting(false);
    }
  };
  
  const handleOpenPublishDialog = (event: CustomEvent<{ video: { id: string; name: string; url: string } }>) => {
    const video = event.detail.video;
    openYouTubePublishDialog(video);
  };
  
  useEffect(() => {
    // Escuchar eventos personalizados para abrir el diálogo de publicación
    window.addEventListener('openYouTubePublish' as any, handleOpenPublishDialog as any);
    
    return () => {
      window.removeEventListener('openYouTubePublish' as any, handleOpenPublishDialog as any);
    };
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SiYoutube className="w-6 h-6 text-red-600" />
          Integración con YouTube
        </CardTitle>
        <CardDescription>
          Conecta tu cuenta para subir videos directamente a YouTube
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <LoaderCircle className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : channelInfo ? (
          <div className="flex items-center gap-4">
            {channelInfo.thumbnailUrl && (
              <img 
                src={channelInfo.thumbnailUrl} 
                alt={channelInfo.title} 
                className="w-16 h-16 rounded-full object-cover"
              />
            )}
            <div>
              <h3 className="font-medium text-lg">{channelInfo.title}</h3>
              {channelInfo.customUrl && (
                <p className="text-sm text-muted-foreground">@{channelInfo.customUrl}</p>
              )}
              <div className="flex gap-4 mt-1">
                <span className="text-xs text-muted-foreground">
                  {channelInfo.subscriberCount !== undefined 
                    ? `${formatNumber(channelInfo.subscriberCount)} suscriptores` 
                    : 'Suscriptores ocultos'}
                </span>
                {channelInfo.videoCount !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    {channelInfo.videoCount} videos
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-muted-foreground mb-4">
              No estás conectado a YouTube. Conecta tu cuenta para subir videos directamente desde la aplicación.
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end">
        {channelInfo ? (
          <Button 
            variant="destructive" 
            onClick={disconnectYouTube}
            disabled={isDisconnecting}
          >
            {isDisconnecting ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Desconectando...
              </>
            ) : (
              <>
                <X className="mr-2 h-4 w-4" />
                Desconectar
              </>
            )}
          </Button>
        ) : (
          <Button 
            onClick={connectYouTube}
            disabled={isConnecting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isConnecting ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <SiYoutube className="mr-2 h-4 w-4" />
                Conectar con YouTube
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// Utilidad para formatear números grandes
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Función para abrir el diálogo de publicación de YouTube
export function openYouTubePublishDialog(video: { id: string; name: string; url: string }) {
  // Crear elemento modal
  const modalId = 'youtube-publish-modal';
  let modalElement = document.getElementById(modalId);
  
  if (!modalElement) {
    modalElement = document.createElement('div');
    modalElement.id = modalId;
    document.body.appendChild(modalElement);
  }
  
  // Renderizar contenido
  modalElement.innerHTML = `
    <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div class="bg-background rounded-lg shadow-lg max-w-md w-full p-6">
        <h2 class="text-xl font-bold mb-4">Publicar en YouTube</h2>
        <p class="mb-4">Completa los detalles para publicar tu video en YouTube</p>
        
        <form id="youtube-upload-form">
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1">Título</label>
            <input type="text" id="yt-title" required 
              class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2" 
              value="${video.name || ''}" />
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1">Descripción</label>
            <textarea id="yt-description" rows="3" 
              class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
              placeholder="Describe tu video..."></textarea>
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1">Etiquetas (separadas por comas)</label>
            <input type="text" id="yt-tags" 
              class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2" />
          </div>
          
          <div class="mb-4 flex items-center">
            <input type="checkbox" id="yt-private" class="mr-2" checked />
            <label for="yt-private">Publicar como privado</label>
          </div>
          
          <div class="flex justify-end gap-2">
            <button type="button" id="yt-cancel" 
              class="px-4 py-2 border rounded-md">
              Cancelar
            </button>
            <button type="submit" id="yt-submit" 
              class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center">
              <Upload class="w-4 h-4 mr-2" />
              Publicar
            </button>
          </div>
        </form>
        
        <div id="yt-upload-progress" class="hidden mt-4">
          <p>Subiendo video...</p>
          <div class="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div id="yt-progress-bar" class="bg-red-600 h-2.5 rounded-full" style="width: 0%"></div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Añadir event listeners
  document.getElementById('yt-cancel')?.addEventListener('click', () => {
    document.body.removeChild(modalElement!);
  });
  
  document.getElementById('youtube-upload-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const titleInput = document.getElementById('yt-title') as HTMLInputElement;
    const descriptionInput = document.getElementById('yt-description') as HTMLTextAreaElement;
    const tagsInput = document.getElementById('yt-tags') as HTMLInputElement;
    const privateInput = document.getElementById('yt-private') as HTMLInputElement;
    
    const formElement = document.getElementById('youtube-upload-form') as HTMLFormElement;
    const progressElement = document.getElementById('yt-upload-progress') as HTMLDivElement;
    const progressBarElement = document.getElementById('yt-progress-bar') as HTMLDivElement;
    
    try {
      // Ocultar formulario y mostrar progreso
      formElement.classList.add('hidden');
      progressElement.classList.remove('hidden');
      
      // Crear FormData
      const formData = new FormData();
      
      // Conseguir el archivo de video desde la URL
      const response = await fetch(video.url);
      const blob = await response.blob();
      
      // Añadir archivo y metadatos
      formData.append('video', blob, video.name);
      formData.append('title', titleInput.value);
      formData.append('description', descriptionInput.value);
      formData.append('tags', tagsInput.value);
      formData.append('private', privateInput.checked.toString());
      
      // Simular actualización de progreso
      const progressInterval = setInterval(() => {
        const currentWidth = parseInt(progressBarElement.style.width || '0');
        if (currentWidth < 90) {
          progressBarElement.style.width = (currentWidth + 5) + '%';
        }
      }, 500);
      
      // Enviar al servidor
      const uploadResponse = await fetch('/api/youtube/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      clearInterval(progressInterval);
      progressBarElement.style.width = '100%';
      
      if (uploadResponse.ok) {
        const result = await uploadResponse.json();
        
        // Mostrar toast de éxito (usando el event bus para comunicarse)
        const successEvent = new CustomEvent('youtubeUploadSuccess', {
          detail: {
            videoId: result.videoId,
            videoUrl: result.videoUrl
          }
        });
        window.dispatchEvent(successEvent);
        
        // Cerrar modal después de 1 segundo
        setTimeout(() => {
          if (document.body.contains(modalElement!)) {
            document.body.removeChild(modalElement!);
          }
        }, 1000);
      } else {
        const error = await uploadResponse.json();
        throw new Error(error.message || 'Error al subir video');
      }
    } catch (error) {
      console.error('Error uploading to YouTube:', error);
      
      // Disparar evento de error
      const errorEvent = new CustomEvent('youtubeUploadError', {
        detail: { error: error instanceof Error ? error.message : 'Error desconocido' }
      });
      window.dispatchEvent(errorEvent);
      
      // Cerrar modal
      if (document.body.contains(modalElement!)) {
        document.body.removeChild(modalElement!);
      }
    }
  });
}