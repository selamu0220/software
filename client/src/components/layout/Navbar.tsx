import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { User } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, User as UserIcon, Calendar, LogOut, Settings, MonitorPlay, Video, BarChart3, BookOpen, Library, FileText, Star, Pencil, PenSquare, FileEdit, LightbulbIcon, Layers, Volume2, VolumeX } from "lucide-react";
import { useSoundEffects } from "@/hooks/use-sound-effects";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedText } from "@/components/ui/animated-text";

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { playSound, muted, toggleMute } = useSoundEffects();

  const navLinks = [
    { name: "Recursos", href: "/recursos" },
    { name: "Guiones", href: "/guiones" },
    { name: "Blog", href: "/blog" },
    { name: "Calendario", href: "/calendar" },
    { name: "Teleprompter", href: "/teleprompter" },
    { name: "Testimonios", href: "/testimonios" },
    { name: "Precios", href: "/#pricing" },
  ];

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <img 
                  src="/images/logo.png" 
                  alt="Red Creativa Gen Logo" 
                  className="h-9 w-auto"
                />
                <span className="text-foreground font-heading font-bold text-xl cursor-pointer">
                  Red Creativa Gen
                </span>
              </Link>
              <span className="beta-badge">BETA</span>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`${
                    location === link.href || (link.href !== "/" && location.startsWith(link.href))
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative rounded-md h-9 w-9 p-0"
              onClick={() => {
                toggleMute();
                playSound('click');
              }}
              aria-label={muted ? "Activar sonido" : "Silenciar"}
            >
              {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="relative rounded-md h-9 w-9 p-0"
                    onClick={() => playSound('click')}
                  >
                    <span className="sr-only">Open user menu</span>
                    <UserIcon className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-4 py-2">
                    <p className="text-xs text-muted-foreground">Conectado como</p>
                    <p className="text-sm font-medium truncate">{user.username}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/mis-guiones" 
                      className="flex items-center"
                      onClick={() => playSound('click')}
                      onMouseEnter={() => playSound('hover')}
                    >
                      <PenSquare className="mr-2 h-4 w-4" />
                      Generador de Guiones
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/recursos" 
                      className="flex items-center"
                      onClick={() => playSound('click')}
                      onMouseEnter={() => playSound('hover')}
                    >
                      <Library className="mr-2 h-4 w-4" />
                      Biblioteca de Recursos
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/recursos/subir" 
                      className="flex items-center"
                      onClick={() => playSound('click')}
                      onMouseEnter={() => playSound('hover')}
                    >
                      <Library className="mr-2 h-4 w-4" />
                      Subir Recurso
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/dashboard" 
                      className="flex items-center"
                      onClick={() => playSound('click')}
                      onMouseEnter={() => playSound('hover')}
                    >
                      <UserIcon className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/calendar" 
                      className="flex items-center"
                      onClick={() => playSound('click')}
                      onMouseEnter={() => playSound('hover')}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Calendario
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/estrategia-contenido" 
                      className="flex items-center"
                      onClick={() => playSound('click')}
                      onMouseEnter={() => playSound('hover')}
                    >
                      <FileEdit className="mr-2 h-4 w-4" />
                      Estrategia de Contenido
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/batch-generator" 
                      className="flex items-center"
                      onClick={() => playSound('click')}
                      onMouseEnter={() => playSound('hover')}
                    >
                      <Layers className="mr-2 h-4 w-4" />
                      Generación por Lotes
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/teleprompter" 
                      className="flex items-center"
                      onClick={() => playSound('click')}
                      onMouseEnter={() => playSound('hover')}
                    >
                      <MonitorPlay className="mr-2 h-4 w-4" />
                      Teleprompter
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link 
                      href="/metrics" 
                      className="flex items-center"
                      onClick={() => playSound('click')}
                      onMouseEnter={() => playSound('hover')}
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Métricas
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/blog" 
                      className="flex items-center"
                      onClick={() => playSound('click')}
                      onMouseEnter={() => playSound('hover')}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Blog
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/testimonios" 
                      className="flex items-center"
                      onClick={() => playSound('click')}
                      onMouseEnter={() => playSound('hover')}
                    >
                      <Star className="mr-2 h-4 w-4" />
                      Testimonios
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/profile" 
                      className="flex items-center"
                      onClick={() => playSound('click')}
                      onMouseEnter={() => playSound('hover')}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Perfil
                    </Link>
                  </DropdownMenuItem>
                  {!user.isPremium && !user.lifetimeAccess && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link
                          href="/subscribe"
                          onClick={() => playSound('success')}
                          onMouseEnter={() => playSound('hover')}
                        >
                          Actualizar a Premium
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => {
                      playSound('click');
                      onLogout();
                    }}
                    onMouseEnter={() => playSound('hover')}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-primary/50 rounded-lg blur opacity-0 group-hover:opacity-50 transition duration-500"></div>
                    <AnimatedButton 
                      variant="outline" 
                      size="sm" 
                      animation="pulse"
                      soundEffect="click"
                      className="text-sm font-medium relative z-10 border-primary/30 hover:border-primary bg-black/50 backdrop-blur-sm"
                      tooltip="Accede a tu cuenta"
                    >
                      <div className="flex items-center">
                        <UserIcon className="mr-2 h-4 w-4 text-primary" />
                        <span>Iniciar sesión</span>
                      </div>
                    </AnimatedButton>
                  </div>
                </Link>
                <Link href="/register">
                  <div className="relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 group-hover:from-primary/80 group-hover:to-primary duration-500 transition-colors"></div>
                    <AnimatedButton 
                      variant="default" 
                      size="sm"
                      animation="grow"
                      soundEffect="click" 
                      className="text-sm font-medium relative z-10 bg-transparent hover:bg-transparent"
                      tooltip="Crea una nueva cuenta"
                    >
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                      <div className="relative z-10">
                        Registrarse
                      </div>
                    </AnimatedButton>
                  </div>
                </Link>
              </div>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <Button
              variant="ghost"
              size="sm"
              className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="block h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="block h-5 w-5" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-background border-b border-border">
          <div className="pt-2 pb-3 space-y-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`${
                  location === link.href || (link.href !== "/" && location.startsWith(link.href))
                    ? "bg-secondary/50 border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:bg-secondary/20 hover:text-foreground"
                } block pl-3 pr-4 py-2 border-l-2 text-sm font-medium`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-border bg-black/20 backdrop-blur-sm">
            {user ? (
              <>
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-primary/10 rounded-full blur-sm"></div>
                    <img 
                      src="/images/logo.png" 
                      alt="Red Creativa Gen Logo" 
                      className="h-9 w-auto relative z-10"
                    />
                  </div>
                  <div className="ml-3">
                    <AnimatedText 
                      text={user.username}
                      effect="fadeIn"
                      tag="div"
                      className="text-sm font-medium text-foreground"
                    />
                    <AnimatedText 
                      text={user.email || ''}
                      effect="fadeIn"
                      delay={0.2}
                      tag="div"
                      className="text-xs text-muted-foreground"
                    />
                  </div>
                </div>
                <div className="mt-3 space-y-0.5">
                  <Link
                    href="/mis-guiones"
                    className="block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/20"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <PenSquare className="mr-2 h-4 w-4" />
                      <span>Generador de Guiones</span>
                    </div>
                  </Link>
                  <Link
                    href="/recursos"
                    className="block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/20"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <Library className="mr-2 h-4 w-4" />
                      <span>Biblioteca de Recursos</span>
                    </div>
                  </Link>
                  <Link
                    href="/recursos/subir"
                    className="block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/20"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <Library className="mr-2 h-4 w-4" />
                      <span>Subir Recurso</span>
                    </div>
                  </Link>
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/20"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/calendar"
                    className="block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/20"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>Calendario</span>
                    </div>
                  </Link>
                  <Link
                    href="/teleprompter"
                    className="block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/20"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <MonitorPlay className="mr-2 h-4 w-4" />
                      <span>Teleprompter</span>
                    </div>
                  </Link>
                  <Link
                    href="/blog"
                    className="block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/20"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      <span>Blog</span>
                    </div>
                  </Link>
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/20"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Perfil</span>
                    </div>
                  </Link>
                  {!user.isPremium && !user.lifetimeAccess && (
                    <Link
                      href="/subscribe"
                      className="block px-4 py-2 text-sm font-medium text-primary/90 hover:text-primary hover:bg-secondary/20"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Actualizar a Premium
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogout();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/20"
                  >
                    <div className="flex items-center">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Cerrar sesión</span>
                    </div>
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-3 space-y-1 p-2">
                <Link
                  href="/login"
                  className="flex items-center px-4 py-3 text-sm font-medium text-foreground border border-border hover:text-primary hover:border-primary hover:bg-secondary/10 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <UserIcon className="mr-2 h-4 w-4" />
                  Iniciar sesión
                </Link>
                <Link
                  href="/register"
                  className="flex items-center px-4 py-3 text-sm font-medium text-background bg-primary hover:bg-primary/90 rounded-md mt-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
