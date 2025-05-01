import { useState, useRef, useEffect } from "react";
import { User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Mic, 
  Camera, 
  Video, 
  Upload, 
  Download, 
  Share2,
  Settings,
  Copy,
  StopCircle,
  AlertCircle,
  Loader2,
  PlayCircle,
  PauseCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

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
      // Reset chunks
      chunksRef.current = [];
      
      let audioStream: MediaStream | null = null;
      let videoStream: MediaStream | null = null;
      let screenStream: MediaStream | null = null;
      const combinedTracks: MediaStreamTrack[] = [];
      
      // Get audio if needed
      if (includeAudio) {
        const audioConstraints: MediaTrackConstraints = {};
        if (selectedMicrophoneId) {
          audioConstraints.deviceId = { exact: selectedMicrophoneId };
        }
        
        audioStream = await navigator.mediaDevices.getUserMedia({ 
          audio: audioConstraints,
          video: false
        });
        
        combinedTracks.push(...audioStream.getAudioTracks());
      }
      
      // Get video based on selected type
      if (recordingType === "camera" || recordingType === "both") {
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
        
        // If only camera is selected, display it in the preview
        if (recordingType === "camera" && videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = videoStream;
          videoPreviewRef.current.play().catch(e => console.error("Error playing video:", e));
        }
      }
      
      // Get screen if needed
      if (recordingType === "screen" || recordingType === "both") {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });
        
        combinedTracks.push(...screenStream.getVideoTracks());
        
        // Add handler for when user stops sharing screen
        screenStream.getVideoTracks()[0].onended = () => {
          stopRecording();
        };
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
    
    // Stop all tracks on the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Clear the video preview
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
    
    // Update state (processRecording will be called by onstop event)
    setIsRecording(false);
    setIsPaused(false);
  };

  // Process the recorded chunks
  const processRecording = () => {
    if (chunksRef.current.length === 0) {
      toast({
        title: "Error",
        description: "No hay datos de video para procesar.",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Create a blob from the chunks
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      
      // Create object URL
      const url = URL.createObjectURL(blob);
      
      // Generate video name
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const generatedName = videoName.trim() || `grabacion-${timestamp}`;
      
      // Add to recorded videos
      const newVideo = {
        id: Date.now().toString(),
        name: generatedName,
        url: url,
        date: new Date()
      };
      
      setRecordedVideos(prev => [newVideo, ...prev]);
      
      // Reset chunks
      chunksRef.current = [];
      
      toast({
        title: "Grabación completada",
        description: "El video está listo para ser descargado o compartido.",
      });
    } catch (error) {
      console.error("Error processing recording:", error);
      toast({
        title: "Error al procesar grabación",
        description: "No se pudo procesar el video grabado.",
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
      
      // Create FormData
      const formData = new FormData();
      formData.append('video', blob, `${video.name}.webm`);
      formData.append('name', video.name);
      
      setIsProcessing(true);
      
      // Upload video
      const uploadResponse = await fetch('/api/upload-video', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Error uploading video');
      }
      
      const result = await uploadResponse.json();
      
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
            {/* Recording Preview */}
            <div className="aspect-video bg-black/95 rounded-lg overflow-hidden relative flex items-center justify-center mb-4">
              {countdownValue > 0 && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                  <div className="text-6xl font-bold text-primary animate-pulse">
                    {countdownValue}
                  </div>
                </div>
              )}
              
              {!isRecording && !isProcessing && !countdownValue && (
                <div className="text-muted-foreground text-center p-8">
                  <Camera className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p>Vista previa de cámara (disponible durante la grabación)</p>
                </div>
              )}
              
              {isProcessing && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <div className="text-xl font-medium">Procesando video...</div>
                </div>
              )}
              
              <video 
                ref={videoPreviewRef} 
                autoPlay 
                muted 
                playsInline
                className="w-full h-full object-contain"
              />
              
              {isRecording && (
                <div className="absolute top-4 left-4 bg-red-500/90 text-white px-3 py-1 rounded-full flex items-center gap-1.5 text-sm font-medium">
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
                      <Label htmlFor="include-audio">Incluir audio</Label>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="camera-select">Seleccionar cámara</Label>
                    <Select 
                      value={selectedCameraId} 
                      onValueChange={setSelectedCameraId}
                      disabled={isRecording || isProcessing || availableCameras.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una cámara" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCameras.map((camera) => (
                          <SelectItem key={camera.deviceId} value={camera.deviceId}>
                            {camera.label || `Cámara ${camera.deviceId.slice(0, 5)}...`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="mic-select">Seleccionar micrófono</Label>
                    <Select 
                      value={selectedMicrophoneId} 
                      onValueChange={setSelectedMicrophoneId}
                      disabled={isRecording || isProcessing || !includeAudio || availableMicrophones.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un micrófono" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMicrophones.map((mic) => (
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
            
            {!availableCameras.length && (
              <div className="p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 flex items-center gap-3 text-yellow-300">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p>No se detectaron cámaras. Por favor, concede permisos para usar la cámara.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="videos" className="space-y-6">
            {recordedVideos.length === 0 ? (
              <div className="p-12 text-center rounded-lg border border-border bg-muted/20">
                <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="text-lg font-medium mb-2">No hay videos grabados</h3>
                <p className="text-muted-foreground">
                  Los videos que grabes aparecerán aquí para que puedas descargarlos o compartirlos.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {recordedVideos.map(video => (
                  <Card key={video.id} className="overflow-hidden">
                    <div className="grid md:grid-cols-[300px,1fr] grid-cols-1">
                      <div className="aspect-video bg-black flex items-center justify-center overflow-hidden">
                        <video 
                          src={video.url} 
                          controls 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="p-4 flex flex-col">
                        <div className="mb-2">
                          <h3 className="text-lg font-medium truncate">{video.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {video.date.toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-auto pt-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => downloadVideo(video.url, video.name)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Descargar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => copyVideoLink(video.url)}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copiar Link
                          </Button>
                          {user && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => uploadToServer(video.id)}
                              disabled={isProcessing}
                            >
                              {isProcessing ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4 mr-1" />
                              )}
                              Subir
                            </Button>
                          )}
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => deleteVideo(video.id)}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}