import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ExternalLink, Youtube, LogOut, Upload, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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
  const { toast } = useToast();
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [videoData, setVideoData] = useState<{
    video: {id: string, name: string, url: string},
    title: string,
    description: string,
    tags: string,
    isPublic: boolean
  } | null>(null);

  // Obtener información del canal cuando tenemos tokens
  useEffect(() => {
    if (tokens) {
      fetchChannelInfo();
    } else {
      setChannelInfo(null);
    }
  }, [tokens]);

  // Escuchar eventos para abrir el diálogo de publicación
  useEffect(() => {
    const handleOpenPublish = (event: CustomEvent<{video: {id: string, name: string, url: string}}>) => {
      setVideoData({
        video: event.detail.video,
        title: event.detail.video.name,
        description: '',
        tags: '',
        isPublic: true
      });
    };

    window.addEventListener('openYouTubePublish', handleOpenPublish as EventListener);
    
    return () => {
      window.removeEventListener('openYouTubePublish', handleOpenPublish as EventListener);
    };
  }, []);

  // Obtener información del canal de YouTube
  const fetchChannelInfo = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('GET', '/api/youtube/channel-info');
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setChannelInfo(data);
    } catch (error: any) {
      console.error('Error obteniendo información del canal:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo obtener la información del canal de YouTube.',
        variant: 'destructive',
      });
      
      // Si hay un error de token, desconectar
      if (error.message?.includes('token') || error.message?.includes('auth')) {
        handleDisconnect();
      }
    } finally {
      setLoading(false);
    }
  };

  // Iniciar proceso de autenticación
  const handleConnect = () => {
    // Crear una ventana para el flujo de OAuth
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const authWindow = window.open(
      '/api/youtube/auth',
      'YouTube Auth',
      `width=${width},height=${height},left=${left},top=${top}`
    );
    
    if (!authWindow) {
      toast({
        title: 'Error',
        description: 'Por favor, permite ventanas emergentes para continuar con la autenticación.',
        variant: 'destructive',
      });
      return;
    }
    
    // Escuchar mensajes de la ventana de autenticación
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      try {
        const data = event.data;
        
        if (data.type === 'youtube-auth-success') {
          const tokens: YouTubeTokens = {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            expiresAt: data.expiresAt
          };
          
          if (onConnect) {
            onConnect(tokens);
          }
          
          toast({
            title: 'Conectado a YouTube',
            description: 'Tu cuenta de YouTube ha sido conectada exitosamente.',
          });
          
          authWindow.close();
        } else if (data.type === 'youtube-auth-error') {
          toast({
            title: 'Error de autenticación',
            description: data.error || 'No se pudo conectar con YouTube.',
            variant: 'destructive',
          });
          
          authWindow.close();
        }
      } catch (error) {
        console.error('Error procesando mensaje:', error);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // Comprobar si la ventana se cierra
    const checkClosed = setInterval(() => {
      if (authWindow.closed) {
        window.removeEventListener('message', handleMessage);
        clearInterval(checkClosed);
      }
    }, 500);
  };

  // Desconectar de YouTube
  const handleDisconnect = async () => {
    try {
      await apiRequest('POST', '/api/youtube/revoke');
      
      if (onDisconnect) {
        onDisconnect();
      }
      
      toast({
        title: 'Desconectado',
        description: 'Tu cuenta de YouTube ha sido desconectada.',
      });
    } catch (error: any) {
      console.error('Error al desconectar:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo desconectar la cuenta de YouTube.',
        variant: 'destructive',
      });
    }
  };

  // Publicar un video en YouTube
  const handlePublishVideo = async () => {
    if (!videoData || !videoData.video) return;
    
    try {
      setPublishing(true);
      
      // Fetch the video as a blob
      const response = await fetch(videoData.video.url);
      const videoBlob = await response.blob();
      
      // Create FormData with video and metadata
      const formData = new FormData();
      formData.append('video', videoBlob, `${videoData.video.name}.webm`);
      formData.append('title', videoData.title);
      formData.append('description', videoData.description);
      formData.append('tags', videoData.tags);
      formData.append('isPublic', videoData.isPublic ? 'true' : 'false');
      
      // Upload to YouTube
      const result = await apiRequest('POST', '/api/youtube/upload', formData, true);
      const data = await result.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Dispatch success event
      const successEvent = new CustomEvent('youtubeUploadSuccess', {
        detail: {
          videoId: data.videoId,
          videoUrl: data.videoUrl
        }
      });
      window.dispatchEvent(successEvent);
      
      // Reset form
      setVideoData(null);
    } catch (error: any) {
      console.error('Error al publicar en YouTube:', error);
      
      // Dispatch error event
      const errorEvent = new CustomEvent('youtubeUploadError', {
        detail: {
          error: error.message || 'Error al publicar el video en YouTube.'
        }
      });
      window.dispatchEvent(errorEvent);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-600" />
            Integración con YouTube
          </CardTitle>
          <CardDescription>
            Conecta tu cuenta de YouTube para publicar videos directamente desde la plataforma
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : channelInfo ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {channelInfo.thumbnailUrl && (
                  <img 
                    src={channelInfo.thumbnailUrl} 
                    alt={channelInfo.title} 
                    className="h-16 w-16 rounded-full"
                  />
                )}
                <div>
                  <h3 className="font-medium text-lg">{channelInfo.title}</h3>
                  {channelInfo.customUrl && (
                    <a 
                      href={`https://youtube.com/${channelInfo.customUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:underline flex items-center gap-1"
                    >
                      {channelInfo.customUrl}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 my-4">
                <div className="bg-card/60 p-3 rounded-md">
                  <p className="text-sm text-muted-foreground">Suscriptores</p>
                  <p className="text-lg font-medium">
                    {formatNumber(channelInfo.subscriberCount || 0)}
                  </p>
                </div>
                <div className="bg-card/60 p-3 rounded-md">
                  <p className="text-sm text-muted-foreground">Videos</p>
                  <p className="text-lg font-medium">
                    {formatNumber(channelInfo.videoCount || 0)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 space-y-6">
              <div className="text-center">
                <p className="text-muted-foreground mb-6">
                  Conecta tu cuenta de YouTube para publicar videos directamente desde la plataforma.
                </p>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Instrucciones para la configuración:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Ve a la <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google Cloud Console</a></li>
                  <li>Crea un nuevo proyecto</li>
                  <li>Habilita la API de YouTube Data v3</li>
                  <li>Crea credenciales OAuth para una aplicación web</li>
                  <li>Añade como URL de redirección: <code className="bg-muted px-1 py-0.5 rounded text-xs">{window.location.origin}/api/youtube/callback</code></li>
                  <li>Configura las credenciales de API en los ajustes de tu aplicación</li>
                </ol>
              </div>
              
              <div className="flex justify-center">
                <Button 
                  onClick={handleConnect} 
                  className="gap-2"
                >
                  <Youtube className="h-4 w-4" />
                  Conectar con YouTube
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-2">
                (Requiere configuración previa de credenciales de Google API)
              </p>
            </div>
          )}
        </CardContent>
        
        {channelInfo && (
          <CardFooter className="flex justify-end border-t pt-4">
            <Button variant="outline" onClick={handleDisconnect} className="gap-2">
              <LogOut className="h-4 w-4" />
              Desconectar
            </Button>
          </CardFooter>
        )}
      </Card>
      
      {/* Diálogo para publicar en YouTube */}
      {videoData && (
        <Dialog open={!!videoData} onOpenChange={(open) => !open && setVideoData(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Publicar en YouTube</DialogTitle>
              <DialogDescription>
                Completa la información para publicar tu video en YouTube
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título del video</Label>
                <Input 
                  id="title" 
                  value={videoData.title}
                  onChange={(e) => setVideoData({...videoData, title: e.target.value})}
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {videoData.title.length}/100
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea 
                  id="description" 
                  rows={4}
                  value={videoData.description}
                  onChange={(e) => setVideoData({...videoData, description: e.target.value})}
                  maxLength={5000}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {videoData.description.length}/5000
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tags">Etiquetas (separadas por comas)</Label>
                <Input 
                  id="tags" 
                  value={videoData.tags}
                  onChange={(e) => setVideoData({...videoData, tags: e.target.value})}
                  placeholder="creativo, tutorial, idea"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={videoData.isPublic}
                  onChange={(e) => setVideoData({...videoData, isPublic: e.target.checked})}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isPublic">Hacer público inmediatamente</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setVideoData(null)}
                disabled={publishing}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handlePublishVideo} 
                disabled={!videoData.title || publishing}
                className="gap-2"
              >
                {publishing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Publicar video
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Formatear números grandes (ej: 1500 -> 1.5K)
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  } else {
    return num.toString();
  }
}