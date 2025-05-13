import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import * as htmlToImage from 'html-to-image';
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, TrendingUp, UserCheck, Clock, Award, BarChart2, 
  Plus, Download, Save, Share, FileImage, Edit, EyeOff, Eye,
  Target, ArrowUp, BarChart as BarChartIcon, PieChart as PieChartIcon, LineChart as LineChartIcon
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

// Colores para gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Página de creador de gráficos y elementos para videos
export default function MetricsCreator() {
  const [channelName, setChannelName] = useState('Mi Proyecto');
  const [selectedChart, setSelectedChart] = useState('views');
  const [isLoading, setIsLoading] = useState(false);
  const [metricsData, setMetricsData] = useState<any>(generateInitialData());
  const [customizingData, setCustomizingData] = useState(false);
  const [chartType, setChartType] = useState('text'); // Comienza con texto por defecto
  const [titleText, setTitleText] = useState('Mi Título');
  const { toast } = useToast();
  
  // Referencias para los elementos visuales que vamos a exportar
  const textPreviewRef = useRef<HTMLDivElement>(null);
  const chartPreviewRef = useRef<HTMLDivElement>(null);
  const overlayPreviewRef = useRef<HTMLDivElement>(null);

  // Genera datos iniciales para las métricas
  function generateInitialData() {
    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    
    // Datos para ejemplos de gráficos (sin datos falsos de rendimiento)
    const viewsData = months.map((month) => ({
      name: month,
      views: 0 // Sin visitas falsas
    }));
    
    const subscribersData = months.map((month) => ({
      name: month,
      subscribers: 0 // Sin suscriptores falsos
    }));

    // Datos de categorías de contenido (sin métricas falsas)
    const engagementData = [
      { name: 'Tutoriales', likes: 0, comments: 0, shares: 0 },
      { name: 'Vlogs', likes: 0, comments: 0, shares: 0 },
      { name: 'Reviews', likes: 0, comments: 0, shares: 0 },
      { name: 'Listas', likes: 0, comments: 0, shares: 0 },
      { name: 'Shorts', likes: 0, comments: 0, shares: 0 },
    ];

    // Datos de grupos de edad (para ejemplos de gráficos)
    const audienceData = [
      { name: '18-24', value: 20 },
      { name: '25-34', value: 20 },
      { name: '35-44', value: 20 },
      { name: '45-54', value: 20 },
      { name: '55+', value: 20 }
    ];

    // Ejemplos de títulos de contenido (sin métricas falsas)
    const topVideos = [
      { title: "Ejemplo de título de vídeo 1", views: "0", likes: "0", comments: "0" },
      { title: "Ejemplo de título de vídeo 2", views: "0", likes: "0", comments: "0" },
      { title: "Ejemplo de título de vídeo 3", views: "0", likes: "0", comments: "0" },
      { title: "Ejemplo de título de vídeo 4", views: "0", likes: "0", comments: "0" },
      { title: "Ejemplo de título de vídeo 5", views: "0", likes: "0", comments: "0" }
    ];

    // Tipos de contenido (sin métricas falsas)
    const contentPerformance = [
      { name: 'Tutoriales', views: 0, subscribers: 0 },
      { name: 'Vlogs', views: 0, subscribers: 0 },
      { name: 'Reviews', views: 0, subscribers: 0 },
      { name: 'Shorts', views: 0, subscribers: 0 },
      { name: 'Lives', views: 0, subscribers: 0 }
    ];

    return {
      channelStats: {
        title: channelName,
        subscribers: "0",
        totalViews: "0",
        videoCount: 0,
        joinDate: "Hoy",
        averageViews: "0",
        engagementRate: "0%"
      },
      viewsData,
      subscribersData,
      engagementData,
      audienceData,
      topVideos,
      contentPerformance
    };
  }

  // Función para actualizar datos del gráfico seleccionado
  const updateDataPoint = (index: number, value: number) => {
    if (selectedChart === 'views') {
      const newData = [...metricsData.viewsData];
      newData[index] = { ...newData[index], views: value };
      setMetricsData({ ...metricsData, viewsData: newData });
    } else if (selectedChart === 'subscribers') {
      const newData = [...metricsData.subscribersData];
      newData[index] = { ...newData[index], subscribers: value };
      setMetricsData({ ...metricsData, subscribersData: newData });
    }
  };

  // Función para generar nuevos datos para simulación
  const generateNewData = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      setMetricsData(generateInitialData());
      setIsLoading(false);
      
      toast({
        title: "Datos actualizados",
        description: "Se han generado nuevos datos para la simulación",
      });
    }, 1000);
  };

  // Función para exportar elementos como imagen/video con fondo verde
  const exportChart = async () => {
    setIsLoading(true);
    toast({
      title: "Exportación iniciada",
      description: "Capturando elemento con fondo verde...",
    });
    
    let elementToExport: HTMLElement | null = null;
    let filename = 'elemento';
    
    // Determinamos qué elemento exportar según el tipo seleccionado
    if (chartType === 'text' || chartType === 'subtitle') {
      elementToExport = textPreviewRef.current;
      filename = `titulo_${titleText.replace(/\s+/g, '_').toLowerCase()}.png`;
    } else if (chartType === 'overlay') {
      elementToExport = overlayPreviewRef.current;
      filename = 'overlay_animado.png';
    } else {
      // Para gráficos estadísticos
      elementToExport = chartPreviewRef.current;
      filename = `grafico_${selectedChart}.png`;
    }
    
    if (!elementToExport) {
      toast({
        title: "Error de exportación",
        description: "No se pudo capturar el elemento. Inténtalo de nuevo.",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }
    
    try {
      // Exportamos la imagen
      const dataUrl = await htmlToImage.toPng(elementToExport, {
        backgroundColor: '#00B140', // Aseguramos fondo verde para chroma key
        quality: 1.0
      });
      
      // Creamos un elemento a para descargar la imagen
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
      
      toast({
        title: "Exportación completada",
        description: `El elemento ha sido exportado como ${filename}`,
        duration: 3000,
      });
      
      // En una implementación real, aquí convertiríamos la imagen a MP4 con ffmpeg
      // Por ahora simularemos que también exportamos un MP4
      setTimeout(() => {
        const mp4filename = filename.replace('.png', '.mp4');
        toast({
          title: "MP4 generado",
          description: `También puedes descargar el MP4: ${mp4filename}`,
          duration: 2000,
        });
        
        // Simulamos un segundo click para el MP4
        // En una implementación real, generaríamos el MP4 con un servicio backend
        setTimeout(() => {
          const mp4link = document.createElement('a');
          mp4link.download = mp4filename;
          mp4link.href = dataUrl; // En la práctica, esta sería una URL diferente
          mp4link.click();
        }, 500);
      }, 1500);
    } catch (error) {
      console.error('Error al exportar:', error);
      toast({
        title: "Error de exportación",
        description: "Ocurrió un error al exportar el elemento.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-8 text-center">Creador de Gráficos para Videos</h1>
      
      <div className="mb-8 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Crea elementos gráficos para tus videos</span>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => setCustomizingData(!customizingData)}
                >
                  {customizingData ? <Eye className="h-4 w-4 mr-1" /> : <Edit className="h-4 w-4 mr-1" />}
                  {customizingData ? "Ver" : "Editar"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={generateNewData}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                  {isLoading ? "Generando..." : "Generar Elementos"}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="h-8"
                  onClick={exportChart}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Exportando...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-1" />
                      Exportar MP4
                    </>
                  )}
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Crea gráficos, títulos y elementos con fondo verde para incluir en tus videos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="col-span-1">
                <Label htmlFor="channel-name" className="mb-2 block">Nombre del Proyecto</Label>
                <Input
                  id="channel-name"
                  placeholder="Nombre de tu proyecto o video"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="mb-4"
                />
                
                <Label className="mb-2 block">Tipo de Elemento</Label>
                <Select
                  value={chartType}
                  onValueChange={setChartType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Texto/Título</SelectItem>
                    <SelectItem value="subtitle">Subtítulo</SelectItem>
                    <SelectItem value="overlay">Overlay animado</SelectItem>
                    <SelectItem value="area">Gráfico de Área</SelectItem>
                    <SelectItem value="line">Gráfico de Línea</SelectItem>
                    <SelectItem value="bar">Gráfico de Barras</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="mt-4">
                  <Label className="mb-2 block">Estilo de Contenido</Label>
                  <div className="flex flex-col space-y-2">
                    <Button
                      variant={selectedChart === 'views' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedChart('views')}
                      className="justify-start"
                    >
                      <BarChart2 className="h-4 w-4 mr-2" />
                      Gráficos Estadísticos
                    </Button>
                    <Button
                      variant={selectedChart === 'subscribers' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedChart('subscribers')}
                      className="justify-start"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Infográficos
                    </Button>
                    <Button
                      variant={selectedChart === 'engagement' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedChart('engagement')}
                      className="justify-start"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Textos Animados
                    </Button>
                    <Button
                      variant={selectedChart === 'audience' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedChart('audience')}
                      className="justify-start"
                    >
                      <PieChartIcon className="h-4 w-4 mr-2" />
                      Lower Thirds
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="col-span-3 h-[400px]">
                {chartType === 'overlay' ? (
                  <div className="h-full flex flex-col">
                    <h3 className="text-lg font-medium mb-4">
                      Crea un overlay animado con fondo verde
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <Label htmlFor="overlay-type" className="mb-2 block">Tipo de Overlay</Label>
                        <Select defaultValue="lower-third">
                          <SelectTrigger id="overlay-type">
                            <SelectValue placeholder="Selecciona un tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lower-third">Lower Third</SelectItem>
                            <SelectItem value="corner-bug">Corner Bug/Logo</SelectItem>
                            <SelectItem value="full-frame">Full Frame</SelectItem>
                            <SelectItem value="split-screen">Split Screen</SelectItem>
                            <SelectItem value="social-media">Redes Sociales</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="overlay-text" className="mb-2 block">Texto</Label>
                        <Input
                          id="overlay-text"
                          placeholder="Nombre / Título"
                          className="mb-2"
                        />
                        <Input
                          placeholder="Subtítulo / Descripción (opcional)"
                          className="mb-4"
                        />
                      </div>
                      
                      <div>
                        <Label className="mb-2 block">Estilo</Label>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          <div className="border border-muted rounded-md p-2 cursor-pointer hover:border-primary">
                            <div className="h-12 bg-blue-500 rounded-md mb-1 flex items-end p-1">
                              <div className="text-white text-xs">Estilo 1</div>
                            </div>
                            <p className="text-xs text-center">Moderno</p>
                          </div>
                          <div className="border border-muted rounded-md p-2 cursor-pointer hover:border-primary">
                            <div className="h-12 bg-red-500 rounded-md mb-1 flex items-end p-1">
                              <div className="text-white text-xs">Estilo 2</div>
                            </div>
                            <p className="text-xs text-center">Dinámico</p>
                          </div>
                          <div className="border border-muted rounded-md p-2 cursor-pointer hover:border-primary">
                            <div className="h-12 bg-purple-500 rounded-md mb-1 flex items-end p-1">
                              <div className="text-white text-xs">Estilo 3</div>
                            </div>
                            <p className="text-xs text-center">Elegante</p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="mb-2 block">Duración</Label>
                        <div className="flex items-center space-x-4">
                          <Slider
                            defaultValue={[5]}
                            max={15}
                            step={1}
                            className="flex-1"
                          />
                          <span className="w-16 text-center">5 segs</span>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <div 
                          ref={overlayPreviewRef}
                          className="relative w-full h-40 bg-[#00B140] rounded-md overflow-hidden"
                        >
                          <div className="absolute bottom-8 left-0 w-2/3 h-16 bg-blue-600 bg-opacity-80 pl-4 flex flex-col justify-center">
                            <p className="text-white text-xl font-semibold">Nombre del Presentador</p>
                            <p className="text-white text-sm">Cargo o Descripción</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-center">Vista previa - Fondo verde para chroma key</p>
                      </div>
                    </div>
                  </div>
                ) : chartType === 'text' || chartType === 'subtitle' ? (
                  <div className="h-full flex flex-col">
                    <h3 className="text-lg font-medium mb-4">
                      {chartType === 'text' ? 'Crea un título con fondo verde' : 'Crea un subtítulo con fondo verde'}
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <Label htmlFor="text-content" className="mb-2 block">Texto</Label>
                        <Input
                          id="text-content"
                          placeholder={chartType === 'text' ? "Introduce el título..." : "Introduce el subtítulo..."}
                          className="mb-4"
                          value={titleText}
                          onChange={(e) => setTitleText(e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="font-selector" className="mb-2 block">Fuente</Label>
                        <Select defaultValue="roboto">
                          <SelectTrigger id="font-selector">
                            <SelectValue placeholder="Selecciona una fuente" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="roboto">Roboto</SelectItem>
                            <SelectItem value="montserrat">Montserrat</SelectItem>
                            <SelectItem value="openSans">Open Sans</SelectItem>
                            <SelectItem value="jetbrains">JetBrains Mono</SelectItem>
                            <SelectItem value="lato">Lato</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="mb-2 block">Tamaño de fuente</Label>
                        <Slider
                          defaultValue={[48]}
                          max={100}
                          step={2}
                          className="mb-4"
                        />
                      </div>
                      
                      <div>
                        <Label className="mb-2 block">Color</Label>
                        <div className="flex space-x-2 mb-4">
                          <div className="w-8 h-8 rounded-full bg-white border border-gray-400 cursor-pointer"></div>
                          <div className="w-8 h-8 rounded-full bg-yellow-400 cursor-pointer"></div>
                          <div className="w-8 h-8 rounded-full bg-blue-500 cursor-pointer"></div>
                          <div className="w-8 h-8 rounded-full bg-red-500 cursor-pointer"></div>
                          <div className="w-8 h-8 rounded-full bg-green-500 cursor-pointer"></div>
                          <div className="w-8 h-8 rounded-full bg-purple-500 cursor-pointer"></div>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="mb-2 block">Animación</Label>
                        <Select defaultValue="fade">
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una animación" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fade">Fade In</SelectItem>
                            <SelectItem value="slide">Slide In</SelectItem>
                            <SelectItem value="zoom">Zoom In</SelectItem>
                            <SelectItem value="bounce">Bounce</SelectItem>
                            <SelectItem value="typewriter">Typewriter</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="mt-4">
                        <div 
                          ref={textPreviewRef}
                          className="p-4 flex justify-center items-center bg-[#00B140] rounded-md h-32"
                        >
                          <p className="text-white text-4xl font-bold">{titleText || 'Vista previa del texto'}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-center">Fondo verde para chroma key</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div ref={chartPreviewRef} className="h-full">
                    {selectedChart === 'views' && (
                      <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'area' ? (
                          <AreaChart data={metricsData.viewsData}>
                            <defs>
                              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0.2}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                            <XAxis dataKey="name" stroke="#888" />
                            <YAxis stroke="#888" />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#333', border: 'none' }}
                              itemStyle={{ color: '#fff' }}
                              formatter={(value: any) => [value.toLocaleString(), 'Visualizaciones']}
                            />
                            <Area type="monotone" dataKey="views" stroke="#8884d8" fillOpacity={1} fill="url(#colorViews)" />
                          </AreaChart>
                        ) : chartType === 'line' ? (
                          <LineChart data={metricsData.viewsData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                            <XAxis dataKey="name" stroke="#888" />
                            <YAxis stroke="#888" />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#333', border: 'none' }}
                              itemStyle={{ color: '#fff' }}
                              formatter={(value: any) => [value.toLocaleString(), 'Visualizaciones']}
                            />
                            <Line type="monotone" dataKey="views" stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                          </LineChart>
                        ) : (
                          <BarChart data={metricsData.viewsData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                            <XAxis dataKey="name" stroke="#888" />
                            <YAxis stroke="#888" />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#333', border: 'none' }}
                              itemStyle={{ color: '#fff' }}
                              formatter={(value: any) => [value.toLocaleString(), 'Visualizaciones']}
                            />
                            <Bar dataKey="views" fill="#8884d8" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    )}
                    
                    {selectedChart === 'subscribers' && (
                      <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'area' ? (
                          <AreaChart data={metricsData.subscribersData}>
                            <defs>
                              <linearGradient id="colorSubs" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.2}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                            <XAxis dataKey="name" stroke="#888" />
                            <YAxis stroke="#888" />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#333', border: 'none' }}
                              itemStyle={{ color: '#fff' }}
                              formatter={(value: any) => [value.toLocaleString(), 'Suscriptores']}
                            />
                            <Area type="monotone" dataKey="subscribers" stroke="#82ca9d" fillOpacity={1} fill="url(#colorSubs)" />
                          </AreaChart>
                        ) : chartType === 'line' ? (
                          <LineChart data={metricsData.subscribersData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                            <XAxis dataKey="name" stroke="#888" />
                            <YAxis stroke="#888" />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#333', border: 'none' }}
                              itemStyle={{ color: '#fff' }}
                              formatter={(value: any) => [value.toLocaleString(), 'Suscriptores']}
                            />
                            <Line type="monotone" dataKey="subscribers" stroke="#82ca9d" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                          </LineChart>
                        ) : (
                          <BarChart data={metricsData.subscribersData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                            <XAxis dataKey="name" stroke="#888" />
                            <YAxis stroke="#888" />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#333', border: 'none' }}
                              itemStyle={{ color: '#fff' }}
                              formatter={(value: any) => [value.toLocaleString(), 'Suscriptores']}
                            />
                            <Bar dataKey="subscribers" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    )}
                    
                    {selectedChart === 'engagement' && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metricsData.engagementData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                          <XAxis dataKey="name" stroke="#888" />
                          <YAxis stroke="#888" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#333', border: 'none' }}
                            itemStyle={{ color: '#fff' }}
                          />
                          <Legend />
                          <Bar dataKey="likes" fill="#8884d8" radius={[4, 4, 0, 0]} name="Likes" />
                          <Bar dataKey="comments" fill="#82ca9d" radius={[4, 4, 0, 0]} name="Comentarios" />
                          <Bar dataKey="shares" fill="#ffc658" radius={[4, 4, 0, 0]} name="Compartidos" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    
                    {selectedChart === 'audience' && (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={metricsData.audienceData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={150}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {metricsData.audienceData.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#333', border: 'none' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value: any) => [`${value}%`, 'Audiencia']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Resumen del Proyecto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary/50 p-3 rounded-lg flex flex-col justify-center items-center space-y-2">
                <div className="flex items-center">
                  <FileImage className="h-4 w-4 mr-1" />
                  <span className="text-xs">Elementos</span>
                </div>
                <span className="text-lg font-semibold">3</span>
              </div>
              <div className="bg-secondary/50 p-3 rounded-lg flex flex-col justify-center items-center space-y-2">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span className="text-xs">Duración</span>
                </div>
                <span className="text-lg font-semibold">1:30 min</span>
              </div>
              <div className="bg-secondary/50 p-3 rounded-lg flex flex-col justify-center items-center space-y-2">
                <div className="flex items-center">
                  <BarChart2 className="h-4 w-4 mr-1" />
                  <span className="text-xs">Gráficos</span>
                </div>
                <span className="text-lg font-semibold">5</span>
              </div>
              <div className="bg-secondary/50 p-3 rounded-lg flex flex-col justify-center items-center space-y-2">
                <div className="flex items-center">
                  <Target className="h-4 w-4 mr-1" />
                  <span className="text-xs">Estilos</span>
                </div>
                <span className="text-lg font-semibold">3</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Historial de Exportaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
              <div className="bg-secondary/30 p-3 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-sm">titulo_mi_título.mp4</h4>
                    <p className="text-xs text-muted-foreground">Exportado hace 5 minutos</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="bg-secondary/30 p-3 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-sm">overlay_animado.mp4</h4>
                    <p className="text-xs text-muted-foreground">Exportado hace 10 minutos</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="bg-secondary/30 p-3 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-sm">grafico_views.mp4</h4>
                    <p className="text-xs text-muted-foreground">Exportado hace 15 minutos</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}