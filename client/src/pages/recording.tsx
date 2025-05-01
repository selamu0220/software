import { useState, useRef, useEffect } from "react";
import { User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StoredVideos from "@/components/videos/StoredVideos";
import YouTubeConnect, { YouTubeTokens } from "@/components/youtube/YouTubeConnect";
import { 
  Mic, 
  Camera, 
  Video, 
  Upload, 
  Download, 
  Share2,
  Settings,
  Copy,
  PlayCircle,
  PauseCircle,
  StopCircle,
  Loader2,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { nanoid } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface RecordingProps {
  user: User | null;
}

export default function Recording({ user }: RecordingProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [recordingType, setRecordingType] = useState<"screen" | "camera" | "both">("both");
  const [includeAudio, setIncludeAudio] = useState<boolean>(true);
  const [recordedVideos, setRecordedVideos] = useState<{id: string, name: string, url: string, date: Date}[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState<string>("");
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [availableMicrophones, setAvailableMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [countdownValue, setCountdownValue] = useState<number>(0);
  const [videoName, setVideoName] = useState<string>("");
  const [youtubeTokens, setYoutubeTokens] = useState<YouTubeTokens | undefined>();
  
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Format seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Get available devices on component mount
  useEffect(() => {
    getAvailableDevices();
  }, []);

  // Get available media devices
  const getAvailableDevices = async () => {
    try {
      // Request permissions first to ensure we get devices
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          // Stop all tracks immediately after getting permissions
          stream.getTracks().forEach(track => track.stop());
        });
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const cameras = devices.filter(device => device.kind === 'videoinput');
      const microphones = devices.filter(device => device.kind === 'audioinput');
      
      setAvailableCameras(cameras);
      setAvailableMicrophones(microphones);
      
      // Set defaults if available
      if (cameras.length > 0) {
        setSelectedCameraId(cameras[0].deviceId);
      }
      
      if (microphones.length > 0) {
        setSelectedMicrophoneId(microphones[0].deviceId);
      }
    } catch (err) {
      console.error('Error getting devices:', err);
      toast({
        title: "Error de permisos",
        description: "Por favor, concede permisos de cámara y micrófono para usar esta función.",
        variant: "destructive",
      });
    }
  };

  // Start recording countdown
  const startCountdown = () => {
    setCountdownValue(3);
    
    const countdownInterval = setInterval(() => {
      setCountdownValue(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          startRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Start recording function
  const startRecording = async () => {
    try {
      // Reset chunks and recording time
      chunksRef.current = [];
      setRecordingTime(0);
      
      let audioStream: MediaStream | null = null;
      let videoStream: MediaStream | null = null;
      let screenStream: MediaStream | null = null;
      const combinedTracks: MediaStreamTrack[] = [];
      
      // Detener cualquier stream anterior
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Get audio if needed
      if (includeAudio) {
        try {
          const audioConstraints: MediaTrackConstraints = {};
          if (selectedMicrophoneId) {
            audioConstraints.deviceId = { exact: selectedMicrophoneId };
          }
          
          audioStream = await navigator.mediaDevices.getUserMedia({ 
            audio: audioConstraints,
            video: false
          });
          
          combinedTracks.push(...audioStream.getAudioTracks());
          console.log("Audio tracks added:", audioStream.getAudioTracks().length);
        } catch (err) {
          console.error("Error accediendo al micrófono:", err);
          toast({
            title: "Error de micrófono",
            description: "No se pudo acceder al micrófono. Revisa los permisos.",
            variant: "destructive",
          });
        }
      }
      
      // Get video based on selected type
      if (recordingType === "camera" || recordingType === "both") {
        try {
          const videoConstraints: MediaTrackConstraints = {
            width: { ideal: 1280 },
            height: { ideal: 720 }
          };
          
          if (selectedCameraId) {
            videoConstraints.deviceId = { exact: selectedCameraId };
          }
          
          videoStream = await navigator.mediaDevices.getUserMedia({
            video: videoConstraints,
            audio: false
          });
          
          combinedTracks.push(...videoStream.getVideoTracks());
          console.log("Video tracks added:", videoStream.getVideoTracks().length);
          
          // Display camera in the preview
          if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = videoStream;
            await videoPreviewRef.current.play().catch(e => console.error("Error playing video:", e));
          }
        } catch (err) {
          console.error("Error accediendo a la cámara:", err);
          toast({
            title: "Error de cámara",
            description: "No se pudo acceder a la cámara. Revisa los permisos.",
            variant: "destructive",
          });
          if (recordingType === "camera") {
            throw new Error("No se pudo acceder a la cámara para grabar");
          }
        }
      }
      
      // Get screen if needed
      if (recordingType === "screen" || recordingType === "both") {
        try {
          // Pedir el permiso para compartir pantalla con configuración mejorada
          screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              cursor: "always", // Mostrar siempre el cursor
              displaySurface: "monitor" // Preferir pantalla completa
            } as any,
            audio: false
          });
          
          // Asegurarse de que obtuvimos las pistas de video
          if (screenStream.getVideoTracks().length === 0) {
            throw new Error("No se pudo obtener la pista de video de la pantalla");
          }
          
          // Añadir las pistas de video de la pantalla
          combinedTracks.push(...screenStream.getVideoTracks());
          console.log("Screen tracks added:", screenStream.getVideoTracks().length);
          
          // Cuando el usuario cancela la compartición de pantalla
          screenStream.getVideoTracks()[0].onended = () => {
            toast({
              title: "Compartición de pantalla finalizada",
              description: "Se ha detenido la grabación porque se canceló la compartición de pantalla.",
            });
            stopRecording();
          };
        } catch (err) {
          console.error("Error compartiendo pantalla:", err);
          toast({
            title: "Error al compartir pantalla",
            description: "No se pudo grabar la pantalla. El usuario canceló o no dio permisos.",
            variant: "destructive",
          });
          if (recordingType === "screen") {
            throw new Error("No se pudo acceder a la pantalla para grabar");
          }
        }
      }
      
      // Verificamos que tenemos pistas para grabar
      if (combinedTracks.length === 0) {
        toast({
          title: "Error de grabación",
          description: "No se pudieron obtener pistas de audio o video para grabar.",
          variant: "destructive",
        });
        throw new Error("No hay pistas de audio o video para grabar");
      }
      
      // Create a combined stream
      const combinedStream = new MediaStream(combinedTracks);
      streamRef.current = combinedStream;
      
      // Create MediaRecorder
      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      mediaRecorderRef.current = new MediaRecorder(combinedStream, options);
      
      // Set up event handlers
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        processRecording();
      };
      
      // Start recording
      mediaRecorderRef.current.start(1000); // Capture chunks every second
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // Update state
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      
      toast({
        title: "Grabación iniciada",
        description: "Puedes pausar o detener la grabación en cualquier momento.",
      });
      
    } catch (error: any) {
      console.error("Error starting recording:", error);
      toast({
        title: "Error al iniciar grabación",
        description: error.message || "No se pudo iniciar la grabación.",
        variant: "destructive",
      });
    }
  };

  // Pause recording
  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsPaused(true);
      
      toast({
        title: "Grabación pausada",
        description: "Puedes reanudar o detener la grabación.",
      });
    }
  };

  // Resume recording
  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setIsPaused(false);
      
      toast({
        title: "Grabación reanudada",
        description: "Continuando donde lo dejaste.",
      });
    }
  };

  // Stop recording
  const stopRecording = () => {
    // Clear the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Stop the MediaRecorder
    if (mediaRecorderRef.current && (mediaRecorderRef.current.state === "recording" || mediaRecorderRef.current.state === "paused")) {
      mediaRecorderRef.current.stop();
    }
    
    // Asegurarnos de detener TODAS las pistas y streams
    if (streamRef.current) {
      console.log("Deteniendo todas las pistas de stream...");
      streamRef.current.getTracks().forEach(track => {
        console.log(`Deteniendo pista: ${track.kind} - ${track.label || 'sin etiqueta'}`);
        track.stop();
      });
      streamRef.current = null;
    }
    
    // Buscar y detener cualquier otra cámara o pista activa
    navigator.mediaDevices.getUserMedia({ audio: false, video: false })
      .catch(() => {
        // Este error es esperado, solo queríamos usar esto para asegurarnos de detener pistas
      });
    
    // Update state
    setIsRecording(false);
    setIsPaused(false);
    
    // Si no tenemos chunks, no procesamos nada
    if (chunksRef.current.length === 0) {
      console.log("No hay chunks para procesar, la grabación fue demasiado breve o hubo un problema");
      toast({
        title: "Grabación vacía",
        description: "No se pudo completar la grabación porque no se capturaron datos.",
        variant: "destructive",
      });
    }
  };

  // Process the recorded video
  const processRecording = () => {
    setIsProcessing(true);
    console.log("Procesando grabación...");
    
    try {
      // Create a blob from the chunks
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      
      // Get size in MB for info
      const sizeMB = blob.size / (1024 * 1024);
      console.log(`Video grabado: ${sizeMB.toFixed(2)} MB`);
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Generate an ID and name for the recording
      const id = nanoid();
      const recordingName = videoName || `Grabación ${new Date().toLocaleString()}`;
      
      // Add to recorded videos
      setRecordedVideos(prev => [
        ...prev,
        {
          id,
          name: recordingName,
          url,
          date: new Date()
        }
      ]);
      
      // Notify
      toast({
        title: "Grabación completada",
        description: `El video de ${sizeMB.toFixed(2)} MB está listo para ser descargado o subido.`,
      });
      
      // Reset
      chunksRef.current = [];
      setVideoName("");
    } catch (error) {
      console.error("Error processing recording:", error);
      toast({
        title: "Error al procesar video",
        description: "No se pudo procesar la grabación. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setVideoName("");
    }
  };

  // Download recorded video
  const downloadVideo = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `${filename}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Copy video link (temporary)
  const copyVideoLink = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "Enlace copiado",
        description: "El enlace al video ha sido copiado al portapapeles.",
      });
    }).catch(err => {
      console.error("Error copying to clipboard:", err);
      toast({
        title: "Error",
        description: "No se pudo copiar el enlace al portapapeles.",
        variant: "destructive",
      });
    });
  };

  // Upload video to server
  const uploadToServer = async (videoId: string) => {
    const video = recordedVideos.find(v => v.id === videoId);
    if (!video) return;
    
    try {
      // Convert blob URL to actual blob
      const response = await fetch(video.url);
      const blob = await response.blob();
      
      console.log("Preparando archivo para subir:", blob.size, "bytes");
      
      // Create FormData
      const formData = new FormData();
      formData.append('video', blob, `${video.name}.webm`);
      formData.append('name', video.name);
      
      setIsProcessing(true);
      
      // Upload video usando la API
      console.log("Iniciando subida del video...");
      
      const result = await apiRequest(
        'POST', 
        '/api/upload-video', 
        formData, 
        true // enviamos como FormData en lugar de JSON
      );
      
      console.log("Resultado de la subida:", result);
      
      toast({
        title: "Video subido",
        description: "El video se ha subido correctamente a tu cuenta.",
      });
      
      // Remove from local list
      setRecordedVideos(prev => prev.filter(v => v.id !== videoId));
      
      // Invalidate videos cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
      
    } catch (error) {
      console.error("Error uploading video:", error);
      toast({
        title: "Error al subir",
        description: "No se pudo subir el video. Intenta de nuevo más tarde.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Publish to YouTube
  const publishToYouTube = (videoId: string) => {
    const video = recordedVideos.find(v => v.id === videoId);
    if (!video) return;
    
    if (!user) {
      toast({
        title: "Inicio de sesión requerido",
        description: "Debes iniciar sesión para publicar en YouTube.",
        variant: "destructive",
      });
      return;
    }
    
    if (!youtubeTokens) {
      toast({
        title: "Conexión requerida",
        description: "Conecta tu cuenta de YouTube primero para publicar videos.",
        variant: "destructive",
      });
      
      // Cambiar a la pestaña de YouTube
      setTimeout(() => {
        const storedTab = document.querySelector('[value="stored"]');
        if (storedTab && 'click' in storedTab) {
          (storedTab as HTMLElement).click();
        }
      }, 100);
      
      return;
    }
    
    // Crear y disparar evento personalizado para abrir el diálogo de publicación
    const publishEvent = new CustomEvent('openYouTubePublish', {
      detail: { video }
    });
    window.dispatchEvent(publishEvent);
  };
  
  // Escuchar eventos de éxito/error de la publicación en YouTube
  useEffect(() => {
    const onYouTubeUploadSuccess = (event: CustomEvent<{videoId: string, videoUrl: string}>) => {
      toast({
        title: "Publicación exitosa",
        description: (
          <div>
            Tu video ha sido publicado en YouTube. 
            <a 
              href={event.detail.videoUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="ml-2 text-blue-500 hover:underline"
            >
              Ver video
            </a>
          </div>
        ),
      });
    };
    
    const onYouTubeUploadError = (event: CustomEvent<{error: string}>) => {
      toast({
        title: "Error de publicación",
        description: event.detail.error || "No se pudo publicar el video en YouTube.",
        variant: "destructive",
      });
    };
    
    window.addEventListener('youtubeUploadSuccess', onYouTubeUploadSuccess as EventListener);
    window.addEventListener('youtubeUploadError', onYouTubeUploadError as EventListener);
    
    return () => {
      window.removeEventListener('youtubeUploadSuccess', onYouTubeUploadSuccess as EventListener);
      window.removeEventListener('youtubeUploadError', onYouTubeUploadError as EventListener);
    };
  }, [toast]);

  // Delete recorded video
  const deleteVideo = (videoId: string) => {
    const video = recordedVideos.find(v => v.id === videoId);
    if (video) {
      // Revoke object URL to free memory
      URL.revokeObjectURL(video.url);
      
      // Remove from list
      setRecordedVideos(prev => prev.filter(v => v.id !== videoId));
      
      toast({
        title: "Video eliminado",
        description: "El video ha sido eliminado de la lista.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-heading">Grabación de Video</h1>
          <p className="mt-2 text-muted-foreground">
            Graba tu pantalla, cámara o ambos mientras presentas tu contenido
          </p>
        </div>
        
        <Tabs defaultValue="record" className="w-full">
          <TabsList className="grid grid-cols-2 max-w-[400px] mx-auto mb-8">
            <TabsTrigger value="record" className="flex items-center gap-1">
              <Camera className="h-4 w-4" />
              Grabación
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-1">
              <Video className="h-4 w-4" />
              Videos Grabados
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="record" className="space-y-6">
            {/* Video Preview - Estilo Streamer con pantalla dividida */}
            <div className="rounded-lg overflow-hidden relative mb-4">
              {/* Pantalla dividida: cámara + pantalla compartida */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                {/* Vista principal (pantalla compartida o lo que se esté grabando) */}
                <div className="md:col-span-2 aspect-video bg-black/95 rounded-lg overflow-hidden relative">
                  {isRecording && recordingType !== "camera" && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center p-4 bg-black/50 rounded-lg">
                        <Mic className="h-12 w-12 mx-auto mb-2 text-primary/60" />
                        <p className="text-white/70">Compartiendo pantalla</p>
                      </div>
                    </div>
                  )}
                  
                  {!isRecording && recordingType !== "camera" && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center p-4">
                        <Video className="h-12 w-12 mx-auto mb-2 opacity-20" />
                        <p className="text-muted-foreground">La pantalla se mostrará aquí al iniciar la grabación</p>
                      </div>
                    </div>
                  )}
                  
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20">
                      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                      <div className="text-xl font-medium">Procesando video...</div>
                    </div>
                  )}
                  
                  {countdownValue > 0 && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
                      <div className="text-6xl font-bold text-primary animate-pulse">
                        {countdownValue}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Webcam (PiP - Picture in Picture) */}
                <div className="aspect-video bg-black/90 rounded-lg overflow-hidden relative border-2 border-primary/40">
                  {/* Vista de cámara */}
                  {!streamRef.current && !isRecording && (
                    <div className="text-muted-foreground text-center p-4 h-full flex flex-col items-center justify-center">
                      <Camera className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">Vista previa de cámara</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="mt-3"
                        onClick={() => {
                          navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                            .then(stream => {
                              if (videoPreviewRef.current) {
                                videoPreviewRef.current.srcObject = stream;
                                videoPreviewRef.current.play().catch(e => console.error("Error playing video:", e));
                              }
                              // No detenemos el stream para que el usuario pueda verse
                              streamRef.current = stream;
                            })
                            .catch(err => {
                              console.error("Error al obtener acceso a la cámara:", err);
                              toast({
                                title: "Error de permisos",
                                description: "Por favor, concede permisos de cámara y micrófono para usar esta función.",
                                variant: "destructive",
                              });
                            });
                        }}
                      >
                        Ver cámara
                      </Button>
                    </div>
                  )}
                  
                  <video 
                    ref={videoPreviewRef} 
                    autoPlay 
                    muted 
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              {isRecording && (
                <div className="absolute top-4 left-4 bg-red-500/90 text-white px-3 py-1 rounded-full flex items-center gap-1.5 text-sm font-medium z-10">
                  <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>
                  <span>REC</span>
                  <span>{formatTime(recordingTime)}</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Recording Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Video className="h-5 w-5" />
                    Control de Grabación
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="video-name">Nombre del video</Label>
                    <Input 
                      id="video-name" 
                      placeholder="Mi video" 
                      value={videoName} 
                      onChange={(e) => setVideoName(e.target.value)} 
                      disabled={isRecording || isProcessing}
                    />
                  </div>
                  
                  {!isRecording ? (
                    <Button 
                      className="w-full h-12 text-base font-medium"
                      onClick={startCountdown}
                      disabled={isProcessing || countdownValue > 0}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <PlayCircle className="mr-2 h-5 w-5" />
                          Iniciar Grabación
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {isPaused ? (
                        <Button 
                          onClick={resumeRecording} 
                          variant="outline"
                          className="h-10"
                        >
                          <PlayCircle className="mr-2 h-4 w-4" />
                          Reanudar
                        </Button>
                      ) : (
                        <Button 
                          onClick={pauseRecording} 
                          variant="outline"
                          className="h-10"
                        >
                          <PauseCircle className="mr-2 h-4 w-4" />
                          Pausar
                        </Button>
                      )}
                      <Button 
                        onClick={stopRecording} 
                        variant="destructive"
                        className="h-10"
                      >
                        <StopCircle className="mr-2 h-4 w-4" />
                        Detener
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="h-5 w-5" />
                    Configuración
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-3">
                    <Label>Tipo de grabación</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <Button 
                        variant={recordingType === "camera" ? "default" : "outline"} 
                        onClick={() => setRecordingType("camera")}
                        disabled={isRecording || isProcessing}
                        className="flex flex-col py-3 h-auto gap-1"
                      >
                        <Camera className="h-5 w-5" />
                        <span className="text-xs">Cámara</span>
                      </Button>
                      <Button 
                        variant={recordingType === "screen" ? "default" : "outline"} 
                        onClick={() => setRecordingType("screen")}
                        disabled={isRecording || isProcessing}
                        className="flex flex-col py-3 h-auto gap-1"
                      >
                        <span className="text-lg">🖥️</span>
                        <span className="text-xs">Pantalla</span>
                      </Button>
                      <Button 
                        variant={recordingType === "both" ? "default" : "outline"} 
                        onClick={() => setRecordingType("both")}
                        disabled={isRecording || isProcessing}
                        className="flex flex-col py-3 h-auto gap-1"
                      >
                        <span className="text-lg">🖥️+📷</span>
                        <span className="text-xs">Ambos</span>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="include-audio" 
                        checked={includeAudio} 
                        onCheckedChange={setIncludeAudio}
                        disabled={isRecording || isProcessing}
                      />
                      <Label htmlFor="include-audio">Incluir audio del micrófono</Label>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="camera-select">Cámara</Label>
                    <Select 
                      value={selectedCameraId} 
                      onValueChange={setSelectedCameraId}
                      disabled={isRecording || isProcessing || availableCameras.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cámara" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCameras.map(camera => (
                          <SelectItem key={camera.deviceId} value={camera.deviceId}>
                            {camera.label || `Cámara ${camera.deviceId.slice(0, 5)}...`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="microphone-select">Micrófono</Label>
                    <Select 
                      value={selectedMicrophoneId} 
                      onValueChange={setSelectedMicrophoneId}
                      disabled={isRecording || isProcessing || !includeAudio || availableMicrophones.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar micrófono" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMicrophones.map(mic => (
                          <SelectItem key={mic.deviceId} value={mic.deviceId}>
                            {mic.label || `Micrófono ${mic.deviceId.slice(0, 5)}...`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Local Recordings */}
            {recordedVideos.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Video className="h-5 w-5" />
                    Videos Grabados Localmente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recordedVideos.map(video => (
                      <div key={video.id} className="flex flex-col space-y-4 p-4 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="bg-black/10 p-2 rounded-full">
                              <Video className="h-6 w-6" />
                            </div>
                            <div>
                              <h4 className="font-medium text-base">{video.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {new Date(video.date).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center justify-center aspect-video bg-black/95 rounded overflow-hidden">
                            <video 
                              src={video.url} 
                              controls 
                              className="w-full h-full"
                            />
                          </div>
                          
                          <div className="flex flex-col items-start justify-center gap-3">
                            <Button 
                              onClick={() => downloadVideo(video.url, video.name)}
                              variant="outline"
                              className="w-full justify-start"
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Descargar Video
                            </Button>
                            <Button 
                              onClick={() => uploadToServer(video.id)}
                              className="w-full justify-start"
                              disabled={isProcessing || !user}
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              Subir a Mi Cuenta
                            </Button>
                            <Button 
                              onClick={() => publishToYouTube(video.id)}
                              className="w-full justify-start"
                              variant="outline"
                              disabled={isProcessing || !user}
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Publicar en YouTube
                            </Button>
                            <Button 
                              onClick={() => copyVideoLink(video.url)}
                              variant="outline"
                              className="w-full justify-start"
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copiar Enlace
                            </Button>
                            <Button 
                              onClick={() => deleteVideo(video.id)}
                              variant="destructive"
                              className="w-full justify-start"
                              disabled={isProcessing}
                            >
                              <StopCircle className="mr-2 h-4 w-4" />
                              Eliminar Video
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="videos">
            <Tabs defaultValue="uploaded" className="w-full">
              <TabsList className="grid grid-cols-2 max-w-[400px] mx-auto mb-8">
                <TabsTrigger value="uploaded">Videos Guardados</TabsTrigger>
                <TabsTrigger value="stored">YouTube</TabsTrigger>
              </TabsList>
              
              <TabsContent value="uploaded" className="space-y-6">
                {user ? (
                  <StoredVideos userId={user?.id} />
                ) : (
                  <div className="text-center py-8">
                    <h3 className="text-xl font-medium mb-2">Inicia sesión para ver tus videos</h3>
                    <p className="text-muted-foreground">
                      Necesitas iniciar sesión para ver los videos guardados en tu cuenta.
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="stored" className="space-y-6">
                <StoredVideos userId={user?.id} />
                
                {user && (
                  <div className="mt-8">
                    <h3 className="text-lg font-medium mb-4">Publicación en YouTube</h3>
                    <YouTubeConnect 
                      tokens={youtubeTokens}
                      onConnect={(tokens) => setYoutubeTokens(tokens)}
                      onDisconnect={() => setYoutubeTokens(undefined)}
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}