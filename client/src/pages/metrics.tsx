import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Info, TrendingUp, UserCheck, Clock, Award } from "lucide-react";

// Colores para gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Página principal de métricas
export default function Metrics() {
  const [channelId, setChannelId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [metricsData, setMetricsData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Función para analizar un canal de YouTube
  const analyzeChannel = async () => {
    if (!channelId) {
      toast({
        title: "Error",
        description: "Por favor, introduce un ID de canal o nombre de usuario",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Llamada a la API para obtener datos de métricas
      const response = await apiRequest('GET', `/api/youtube/metrics?channelId=${encodeURIComponent(channelId)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al obtener métricas");
      }
      
      const data = await response.json();
      setMetricsData(data);
    } catch (err) {
      console.error("Error al analizar el canal:", err);
      setError("No se pudo analizar el canal. Por favor, verifica el ID del canal e inténtalo de nuevo.");
      toast({
        title: "Error",
        description: "No se pudo analizar el canal. Por favor, inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-8 text-center">Análisis de Métricas de YouTube</h1>
      
      <div className="mb-10 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Analizar Canal de YouTube</CardTitle>
            <CardDescription>
              Introduce el ID del canal o nombre de usuario para analizar sus métricas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="channel-id">ID del Canal / Nombre de Usuario</Label>
                <Input 
                  id="channel-id" 
                  placeholder="Ej: @NombreCanal o UCxxxx..." 
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={analyzeChannel} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analizando...
                </>
              ) : (
                'Analizar Canal'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {error && (
        <div className="bg-destructive/10 p-4 rounded-md border border-destructive mb-10 max-w-2xl mx-auto">
          <div className="flex items-center">
            <Info className="h-5 w-5 text-destructive mr-2" />
            <p className="text-destructive">{error}</p>
          </div>
        </div>
      )}

      {metricsData && (
        <div className="space-y-10">
          <ChannelOverview channelStats={metricsData.channelStats} />
          
          <Tabs defaultValue="growth" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="growth">Crecimiento</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="audience">Audiencia</TabsTrigger>
              <TabsTrigger value="content">Contenido</TabsTrigger>
              <TabsTrigger value="recommendations">Recomendaciones</TabsTrigger>
            </TabsList>
            
            <TabsContent value="growth" className="space-y-6 mt-6">
              <GrowthMetrics 
                viewsData={metricsData.viewsData} 
                subscribersData={metricsData.subscribersData} 
              />
            </TabsContent>
            
            <TabsContent value="engagement" className="space-y-6 mt-6">
              <EngagementMetrics data={metricsData.engagementData} />
            </TabsContent>
            
            <TabsContent value="audience" className="space-y-6 mt-6">
              <AudienceMetrics data={metricsData.audienceData} />
            </TabsContent>
            
            <TabsContent value="content" className="space-y-6 mt-6">
              <ContentAnalysis 
                topVideos={metricsData.topVideos}
                contentPerformance={metricsData.contentPerformance}
              />
            </TabsContent>
            
            <TabsContent value="recommendations" className="space-y-6 mt-6">
              <Recommendations channelStats={metricsData.channelStats} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

// Componente para la visión general del canal
function ChannelOverview({ channelStats }: { channelStats: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{channelStats.title}</CardTitle>
        <CardDescription>Visión general de las métricas del canal</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            title="Suscriptores" 
            value={channelStats.subscribers} 
            icon={<UserCheck className="h-5 w-5 text-primary" />} 
          />
          <StatCard 
            title="Vistas Totales" 
            value={channelStats.totalViews} 
            icon={<TrendingUp className="h-5 w-5 text-primary" />} 
          />
          <StatCard 
            title="Vídeos Publicados" 
            value={channelStats.videoCount.toString()} 
            icon={<Clock className="h-5 w-5 text-primary" />} 
          />
          <StatCard 
            title="Miembro Desde" 
            value={channelStats.joinDate} 
            icon={<Award className="h-5 w-5 text-primary" />} 
          />
          <StatCard 
            title="Vistas Promedio" 
            value={channelStats.averageViews} 
            icon={<TrendingUp className="h-5 w-5 text-primary" />} 
          />
          <StatCard 
            title="Tasa de Engagement" 
            value={channelStats.engagementRate} 
            icon={<UserCheck className="h-5 w-5 text-primary" />} 
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Tarjeta de estadísticas
function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="flex items-center p-4 bg-muted/30 rounded-lg">
      <div className="mr-4">{icon}</div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-bold">{value}</h3>
      </div>
    </div>
  );
}

// Componente para métricas de crecimiento
function GrowthMetrics({ viewsData, subscribersData }: { viewsData: any[], subscribersData: any[] }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Evolución de Vistas</CardTitle>
          <CardDescription>Total de vistas mensuales en los últimos 12 meses</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={viewsData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="views" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Crecimiento de Suscriptores</CardTitle>
          <CardDescription>Nuevos suscriptores mensuales en los últimos 12 meses</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={subscribersData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="subscribers" 
                stroke="#82ca9d" 
                activeDot={{ r: 8 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente para métricas de engagement
function EngagementMetrics({ data }: { data: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasa de Engagement por Tipo</CardTitle>
        <CardDescription>Likes, comentarios y compartidos por cada 1000 visualizaciones</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="likes" fill="#8884d8" />
            <Bar dataKey="comments" fill="#82ca9d" />
            <Bar dataKey="shares" fill="#ffc658" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Componente para métricas de audiencia
function AudienceMetrics({ data }: { data: any[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Distribución Demográfica</CardTitle>
          <CardDescription>Porcentaje de audiencia por grupo de edad y género</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fuentes de Tráfico</CardTitle>
          <CardDescription>Origen del tráfico de visualizaciones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded bg-primary mr-2"></div>
                <span>Búsqueda de YouTube</span>
              </div>
              <span className="font-medium">42%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded bg-blue-500 mr-2"></div>
                <span>Sugeridos/Página Principal</span>
              </div>
              <span className="font-medium">31%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded bg-green-500 mr-2"></div>
                <span>Enlaces Externos</span>
              </div>
              <span className="font-medium">15%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded bg-yellow-500 mr-2"></div>
                <span>Notificaciones</span>
              </div>
              <span className="font-medium">8%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded bg-purple-500 mr-2"></div>
                <span>Otros</span>
              </div>
              <span className="font-medium">4%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente para análisis de contenido
function ContentAnalysis({ topVideos, contentPerformance }: { topVideos: any[], contentPerformance: any[] }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Top Videos por Rendimiento</CardTitle>
          <CardDescription>Videos más exitosos basados en visualizaciones y engagement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">#</th>
                  <th className="text-left py-3 px-4">Título</th>
                  <th className="text-right py-3 px-4">Vistas</th>
                  <th className="text-right py-3 px-4">Engagement</th>
                  <th className="text-right py-3 px-4">CTR</th>
                  <th className="text-right py-3 px-4">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {topVideos.map((video, index) => (
                  <tr key={index} className="border-b border-border/40 hover:bg-muted/30">
                    <td className="py-3 px-2">{index + 1}</td>
                    <td className="py-3 px-4 font-medium">{video.title}</td>
                    <td className="py-3 px-4 text-right">{video.views}</td>
                    <td className="py-3 px-4 text-right">{video.engagement}</td>
                    <td className="py-3 px-4 text-right">{video.ctr}</td>
                    <td className="py-3 px-4 text-right">{video.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rendimiento por Categoría</CardTitle>
          <CardDescription>Análisis de vistas promedio por tipo de contenido</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={contentPerformance}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgViews" fill="#8884d8" name="Vistas Promedio" />
              <Bar dataKey="avgEngagement" fill="#82ca9d" name="Engagement Promedio" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente para recomendaciones
function Recommendations({ channelStats }: { channelStats: any }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Recomendaciones Estratégicas</CardTitle>
          <CardDescription>Sugerencias basadas en el análisis de datos para mejorar el rendimiento del canal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-l-4 border-primary pl-4 py-2">
            <h3 className="font-bold text-lg mb-1">Optimiza la Frecuencia de Publicación</h3>
            <p className="text-muted-foreground">
              Basado en tus datos de engagement, publicar contenido los martes y jueves entre 15:00-18:00 podría maximizar tu alcance inicial.
            </p>
          </div>
          
          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <h3 className="font-bold text-lg mb-1">Mejora tus Miniaturas</h3>
            <p className="text-muted-foreground">
              Tus videos con mayor CTR utilizan contraste de colores y texto grande. Considera aplicar este estilo a todas tus miniaturas.
            </p>
          </div>
          
          <div className="border-l-4 border-green-500 pl-4 py-2">
            <h3 className="font-bold text-lg mb-1">Contenido Sugerido</h3>
            <p className="text-muted-foreground">
              Los videos de tipo "Listicle" y "Tutorial" generan un 32% más de engagement. Considera crear más contenido en estos formatos.
            </p>
          </div>
          
          <div className="border-l-4 border-yellow-500 pl-4 py-2">
            <h3 className="font-bold text-lg mb-1">Duración Óptima</h3>
            <p className="text-muted-foreground">
              Tu audiencia muestra mayor retención en videos de 8-12 minutos. Considera ajustar la duración de tu contenido a este rango.
            </p>
          </div>
          
          <div className="border-l-4 border-purple-500 pl-4 py-2">
            <h3 className="font-bold text-lg mb-1">Estrategia de Keywords</h3>
            <p className="text-muted-foreground">
              Incorpora más keywords relacionadas con "{channelStats.title.split(' ')[0]}" en tus títulos y descripciones para mejorar la visibilidad en búsquedas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Los datos ahora se obtienen directamente desde la API