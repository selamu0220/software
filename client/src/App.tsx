import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { SoundProvider } from "@/hooks/use-sound-effects";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Calendar from "@/pages/calendar";
import CalendarPage from "@/pages/calendar-page"; // Nueva página de calendario estilo Google
import Profile from "@/pages/profile";
import Subscribe from "@/pages/subscribe";
import Teleprompter from "@/pages/teleprompter";
import Recursos from "@/pages/recursos";
import RecursoDetalle from "@/pages/recurso-detalle";
import SubirRecurso from "@/pages/subir-recurso";
// Nuevas páginas de blog para SEO
import BlogPage from "@/pages/blog";
import BlogPostPage from "@/pages/blog-post";
import BlogEditorPage from "@/pages/blog-editor";
// Visor de páginas web con iframe
import WebViewer from "@/pages/web-viewer";
// Páginas de guiones de vídeo
import MisGuiones from "@/pages/mis-guiones";
import ScriptEditor from "@/pages/script-editor";
import Testimonios from "@/pages/testimonios";
import IdeaPublica from "@/pages/idea-publica";
import MisIdeas from "@/pages/mis-ideas";
// Editor manual de ideas tipo Google Docs
import IdeaManual from "@/pages/idea-manual";
// Editor simple de guiones (sin dependencia de base de datos)
import SimpleScript from "@/pages/simple-script";
// Generación por lotes y estrategia de contenido
import BatchGenerationPage from "@/pages/batch-generation-page";
import EstrategiaContenido from "@/pages/estrategia-contenido";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AssistantSidebar } from "@/components/ui/assistant-sidebar";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useEffect, useState } from "react";
import { User } from "@shared/schema";
import { apiRequest } from "./lib/queryClient";
import IntroAnimation from "@/components/animations/IntroAnimation";
// Importamos el componente de SEO para mejorar la visibilidad en buscadores
import SEOMeta from "@/components/seo/SEOMeta";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [location] = useLocation();

  // Fetch current user on app load
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/me', { credentials: 'include' });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Logout function
  const logout = async () => {
    try {
      await apiRequest('POST', '/api/logout', {});
      setUser(null);
      window.location.href = '/';
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Login function
  const login = (userData: User) => {
    setUser(userData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const showNavAndFooter = !location.startsWith('/login') && !location.startsWith('/register');

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SoundProvider>
          <TooltipProvider>
            {/* SEO Metatags - Default para toda la aplicación */}
            <SEOMeta 
              title="Red Creativa Pro - Herramientas para creadores de contenido"
              description="Potencia tu creación de contenido en YouTube con Red Creativa Pro. Genera ideas, guiones y planes de contenido mediante inteligencia artificial."
              keywords="creador de contenido, YouTube, ideas para videos, generador de guiones, AI, estrategia de contenido"
              ogImage="/images/og-image.svg"
              ogType="website"
              lang="es"
            />
            {/* Animación de introducción */}
            {showIntro && <IntroAnimation onComplete={() => setShowIntro(false)} />}
            {showNavAndFooter && <Navbar user={user} onLogout={logout} />}
            <main className="min-h-screen">
              {showNavAndFooter && location !== "/" && (
                <div className="container pt-4">
                  <Breadcrumb />
                </div>
              )}
              <Switch>
                <Route path="/" component={() => <Recursos />} />
                <Route path="/login" component={() => <Login onLogin={login} />} />
                <Route path="/register" component={() => <Register onRegister={login} />} />
                <Route path="/dashboard" component={() => <Dashboard user={user} />} />
                {/* Calendario estilo Google con generación de ideas integrada */}
                <Route path="/calendar" component={() => <CalendarPage />} />
                <Route path="/calendar-old" component={() => <Calendar user={user} />} />
                <Route path="/profile" component={() => <Profile user={user} onProfileUpdate={setUser} />} />
                <Route path="/subscribe" component={() => <Subscribe user={user} onSubscriptionUpdate={setUser} />} />
                <Route path="/teleprompter" component={() => <Teleprompter user={user} />} />
                
                {/* Nuevas rutas para la biblioteca de recursos */}
                <Route path="/recursos" component={() => <Recursos />} />
                <Route path="/recursos/subir" component={() => <SubirRecurso />} />
                <Route path="/recursos/:id" component={RecursoDetalle} />
                <Route path="/web-viewer/:id" component={WebViewer} />
                
                {/* Nuevas rutas para el blog (mejora SEO) */}
                <Route path="/blog" component={() => <BlogPage />} />
                <ProtectedRoute path="/blog/new" component={() => <BlogEditorPage />} />
                <ProtectedRoute path="/blog/edit/:id" component={() => <BlogEditorPage />} />
                <Route path="/blog/:slug" component={BlogPostPage} />
                
                {/* Rutas para la biblioteca de guiones */}
                <ProtectedRoute path="/mis-guiones" component={() => <MisGuiones />} />
                <ProtectedRoute path="/script-editor/:id?" component={ScriptEditor} />
                <Route path="/guiones" component={() => <SimpleScript />} />
                
                {/* Página de testimonios y opiniones */}
                <Route path="/testimonios" component={() => <Testimonios />} />
                
                {/* Ruta para ideas de video públicas con URLs amigables para SEO */}
                <Route path="/ideas/:slug" component={IdeaPublica} />
                
                {/* Ruta para gestionar todas las ideas del usuario */}
                <ProtectedRoute path="/mis-ideas" component={() => <MisIdeas />} />
                
                {/* Ruta para crear o editar ideas de forma manual (tipo Google Docs) */}
                <ProtectedRoute path="/idea-manual/:id?" component={() => <IdeaManual />} />
                
                {/* Ruta para generación de guiones por lotes */}
                <ProtectedRoute path="/batch-generator" component={() => <BatchGenerationPage />} />
                
                {/* Ruta para estrategia de contenido basada en personal brand thesis */}
                <ProtectedRoute path="/estrategia" component={() => <EstrategiaContenido />} />
                
                <Route component={NotFound} />
              </Switch>
            </main>
            {showNavAndFooter && <Footer />}
            {/* Sidebar del asistente que se puede abrir/cerrar */}
            <AssistantSidebar />
          </TooltipProvider>
        </SoundProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
