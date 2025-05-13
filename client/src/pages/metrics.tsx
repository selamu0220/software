import React, { useState } from 'react';
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
  const [channelName, setChannelName] = useState('Mi Canal');
  const [selectedChart, setSelectedChart] = useState('views');
  const [isLoading, setIsLoading] = useState(false);
  const [metricsData, setMetricsData] = useState<any>(generateInitialData());
  const [customizingData, setCustomizingData] = useState(false);
  const [chartType, setChartType] = useState('area');
  const { toast } = useToast();

  // Genera datos iniciales para las métricas
  function generateInitialData() {
    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    
    // Genera datos aleatorios realistas con tendencia creciente
    const viewsData = months.map((month, index) => ({
      name: month,
      views: 5000 + (index * 2000) + Math.floor(Math.random() * 5000)
    }));
    
    const subscribersData = months.map((month, index) => ({
      name: month,
      subscribers: 100 + (index * 70) + Math.floor(Math.random() * 100)
    }));

    // Datos de engagement con tendencia positiva
    const engagementData = [
      { name: 'Tutoriales', likes: 18, comments: 10, shares: 5 },
      { name: 'Vlogs', likes: 14, comments: 8, shares: 3 },
      { name: 'Reviews', likes: 22, comments: 15, shares: 7 },
      { name: 'Listas', likes: 15, comments: 6, shares: 4 },
      { name: 'Shorts', likes: 28, comments: 12, shares: 10 },
    ];

    // Datos demográficos
    const audienceData = [
      { name: '18-24', value: 25 },
      { name: '25-34', value: 35 },
      { name: '35-44', value: 20 },
      { name: '45-54', value: 12 },
      { name: '55+', value: 8 }
    ];

    // Lista de videos populares
    const topVideos = [
      { title: "Cómo editar videos profesionales", views: "45.2K", likes: "2.7K", comments: "342" },
      { title: "Tutorial avanzado de DaVinci Resolve", views: "32.1K", likes: "1.9K", comments: "278" },
      { title: "Top 10 plugins para editores", views: "28.5K", likes: "1.5K", comments: "189" },
      { title: "Tips para mejorar tus thumbnails", views: "22.3K", likes: "1.2K", comments: "156" },
      { title: "Guía de color para videos virales", views: "18.7K", likes: "980", comments: "124" }
    ];

    // Datos de rendimiento por tipo de contenido
    const contentPerformance = [
      { name: 'Tutoriales', views: 35, subscribers: 42 },
      { name: 'Vlogs', views: 22, subscribers: 18 },
      { name: 'Reviews', views: 20, subscribers: 23 },
      { name: 'Shorts', views: 18, subscribers: 12 },
      { name: 'Lives', views: 5, subscribers: 5 }
    ];

    return {
      channelStats: {
        title: channelName,
        subscribers: "12.5K",
        totalViews: "450K",
        videoCount: 48,
        joinDate: "15 Oct 2023",
        averageViews: "9.4K",
        engagementRate: "8.7%"
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
        description: "Se han generado nuevos datos de métricas para la simulación",
      });
    }, 1000);
  };

  // Función para exportar elementos como video MP4 con fondo verde (simulada)
  const exportChart = () => {
    toast({
      title: "Exportación iniciada",
      description: "Renderizando elemento con fondo verde en formato MP4...",
    });
    
    // Simulamos el tiempo de renderizado
    setTimeout(() => {
      // En una implementación real, aquí generaríamos el video con ffmpeg
      toast({
        title: "Renderizado completado",
        description: "El elemento ha sido exportado como video_elemento.mp4",
        duration: 3000,
      });
      
      // Simulamos la descarga del archivo
      setTimeout(() => {
        toast({
          title: "Descarga iniciada",
          description: "Descargando video_elemento.mp4",
          duration: 2000,
        });
      }, 500);
    }, 2500);
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
                >
                  <Download className="h-4 w-4 mr-1" />
                  Exportar MP4
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
                    <SelectItem value="area">Gráfico de Área</SelectItem>
                    <SelectItem value="line">Gráfico de Línea</SelectItem>
                    <SelectItem value="bar">Gráfico de Barras</SelectItem>
                    <SelectItem value="text">Texto/Título</SelectItem>
                    <SelectItem value="subtitle">Subtítulo</SelectItem>
                    <SelectItem value="overlay">Overlay animado</SelectItem>
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
                        <div className="relative w-full h-40 bg-[#00B140] rounded-md overflow-hidden">
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
                        <div className="p-4 flex justify-center items-center bg-[#00B140] rounded-md h-32">
                          <p className="text-white text-4xl font-bold">Vista previa del texto</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-center">Fondo verde para chroma key</p>
                      </div>
                    </div>
                  </div>
                ) : customizingData && (selectedChart === 'views' || selectedChart === 'subscribers') ? (
                  <div className="h-full flex flex-col">
                    <h3 className="text-lg font-medium mb-4">
                      Personaliza los datos de {selectedChart === 'views' ? 'visualizaciones' : 'suscriptores'}
                    </h3>
                    <div className="grid grid-cols-1 gap-6 overflow-y-auto">
                      {(selectedChart === 'views' ? metricsData.viewsData : metricsData.subscribersData).map((item: any, index: number) => (
                        <div key={index} className="flex items-center space-x-4">
                          <span className="w-10">{item.name}</span>
                          <Slider
                            defaultValue={[selectedChart === 'views' ? item.views : item.subscribers]}
                            max={selectedChart === 'views' ? 30000 : 1000}
                            step={selectedChart === 'views' ? 1000 : 50}
                            onValueCommit={(value) => updateDataPoint(index, value[0])}
                            className="flex-1"
                          />
                          <span className="w-20 text-right">
                            {selectedChart === 'views' ? item.views.toLocaleString() : item.subscribers.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Resumen del Canal</CardTitle>
          </CardHeader>
          <CardContent>
            <ChannelOverview channelStats={metricsData.channelStats} />
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Rendimiento de Contenido</CardTitle>
          </CardHeader>
          <CardContent>
            <ContentAnalysis 
              topVideos={metricsData.topVideos}
              contentPerformance={metricsData.contentPerformance} 
            />
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Crecimiento y Tendencias</CardTitle>
          </CardHeader>
          <CardContent>
            <GrowthMetrics 
              viewsData={metricsData.viewsData}
              subscribersData={metricsData.subscribersData}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Recomendaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <Recommendations channelStats={metricsData.channelStats} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ChannelOverview({ channelStats }: { channelStats: any }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <StatCard 
        title="Suscriptores" 
        value={channelStats.subscribers} 
        icon={<UserCheck className="h-4 w-4" />}
      />
      <StatCard 
        title="Visualizaciones" 
        value={channelStats.totalViews} 
        icon={<TrendingUp className="h-4 w-4" />}
      />
      <StatCard 
        title="Videos" 
        value={channelStats.videoCount.toString()} 
        icon={<BarChart2 className="h-4 w-4" />}
      />
      <StatCard 
        title="Desde" 
        value={channelStats.joinDate} 
        icon={<Clock className="h-4 w-4" />}
      />
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-secondary/50 p-3 rounded-lg flex flex-col justify-center items-center space-y-2">
      <div className="flex items-center">
        {icon}
        <span className="text-xs ml-1">{title}</span>
      </div>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  );
}

function GrowthMetrics({ viewsData, subscribersData }: { viewsData: any[], subscribersData: any[] }) {
  return (
    <Tabs defaultValue="views">
      <TabsList className="mb-4">
        <TabsTrigger value="views">Visualizaciones</TabsTrigger>
        <TabsTrigger value="subscribers">Suscriptores</TabsTrigger>
      </TabsList>
      
      <TabsContent value="views" className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={viewsData}>
            <defs>
              <linearGradient id="colorViewsGrowth" x1="0" y1="0" x2="0" y2="1">
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
            <Area type="monotone" dataKey="views" stroke="#8884d8" fill="url(#colorViewsGrowth)" />
          </AreaChart>
        </ResponsiveContainer>
      </TabsContent>
      
      <TabsContent value="subscribers" className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={subscribersData}>
            <defs>
              <linearGradient id="colorSubsGrowth" x1="0" y1="0" x2="0" y2="1">
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
            <Area type="monotone" dataKey="subscribers" stroke="#82ca9d" fill="url(#colorSubsGrowth)" />
          </AreaChart>
        </ResponsiveContainer>
      </TabsContent>
    </Tabs>
  );
}

function ContentAnalysis({ topVideos, contentPerformance }: { topVideos: any[], contentPerformance: any[] }) {
  return (
    <Tabs defaultValue="performance">
      <TabsList className="mb-4">
        <TabsTrigger value="performance">Rendimiento por tipo</TabsTrigger>
        <TabsTrigger value="videos">Videos destacados</TabsTrigger>
      </TabsList>
      
      <TabsContent value="performance" className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={contentPerformance}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="name" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#333', border: 'none' }}
              itemStyle={{ color: '#fff' }}
              formatter={(value) => [`${value}%`, '']}
            />
            <Legend />
            <Bar dataKey="views" name="% Visualizaciones" fill="#8884d8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="subscribers" name="% Suscriptores" fill="#82ca9d" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </TabsContent>
      
      <TabsContent value="videos">
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
          {topVideos.map((video, index) => (
            <div key={index} className="bg-secondary/30 p-3 rounded-lg">
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-sm">{video.title}</h4>
                <span className="text-sm font-semibold text-primary">{video.views}</span>
              </div>
              <div className="flex mt-2 text-xs text-muted-foreground">
                <span className="flex items-center mr-4">
                  <Award className="h-3 w-3 mr-1" />
                  {video.likes}
                </span>
                <span className="flex items-center">
                  <Target className="h-3 w-3 mr-1" />
                  {video.comments}
                </span>
              </div>
            </div>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}

function Recommendations({ channelStats }: { channelStats: any }) {
  const recommendations = [
    "Publica videos de tutoriales más frecuentemente, ya que generan más engagement y suscriptores.",
    "Experimenta con formatos cortos (Shorts), pues tienen un alto potencial de crecimiento.",
    "Mantén una cadencia de publicación regular de al menos 2 videos por semana.",
    "Optimiza tus títulos y miniaturas para mejorar el CTR (tasa de clics).",
    "Incluye llamados a la acción claros para aumentar la interacción y suscripciones."
  ];
  
  return (
    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
      {recommendations.map((recommendation, index) => (
        <div key={index} className="bg-secondary/30 p-3 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="h-5 w-5 rounded-full bg-indigo-600 flex items-center justify-center text-xs mt-0.5">
              {index + 1}
            </div>
            <p className="text-sm">{recommendation}</p>
          </div>
        </div>
      ))}
    </div>
  );
}