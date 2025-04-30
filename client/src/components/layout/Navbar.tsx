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
import { Menu, X, User as UserIcon, Calendar, LogOut, Settings, Github, Terminal, ChevronRight } from "lucide-react";
import { ModeToggle } from "@/components/ui/mode-toggle";

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Generador", href: "/" },
    { name: "Calendario", href: "/calendar" },
    { name: "Comunidad", href: "/#comunidad" },
    { name: "Precios", href: "/#pricing" },
    { name: "Blog", href: "https://www.youtube.com/@redcreativa-y9d/videos", external: true },
  ];

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-opacity-90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center animate-fade-in">
              <Link href="/">
                <span className="text-white font-heading font-bold text-2xl cursor-pointer">
                  <span className="text-primary font-extrabold">Red</span> Creativa
                </span>
              </Link>
              <span className="beta-badge ml-2 animate-pulse-glow">BETA</span>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  className={`${
                    location === link.href || (link.href !== "/" && location.startsWith(link.href))
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  {link.name}
                  {link.external && <ChevronRight className="ml-1 h-3 w-3" />}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            <a 
              href="https://github.com/redcreativaestudio" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </a>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="relative rounded-full p-1">
                    <span className="sr-only">Abrir menú usuario</span>
                    <UserIcon className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-4 py-3">
                    <p className="text-sm">Conectado como</p>
                    <p className="text-sm font-medium truncate">{user.username}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Panel de control</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/calendar">Calendario</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Perfil</Link>
                  </DropdownMenuItem>
                  {!user.isPremium && !user.lifetimeAccess && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/subscribe" className="text-primary font-medium">Mejorar a Premium</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="px-4 py-1.5 text-sm font-medium border border-transparent hover:border-border">
                    Iniciar sesión
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="px-4 py-1.5 bg-primary text-white text-sm font-medium hover:bg-primary/90 shadow-md shadow-primary/20 animate-pulse-glow">
                    Empezar gratis
                  </Button>
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center sm:hidden">
            <Button
              variant="ghost"
              className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Abrir menú</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden animate-fade-in">
          <div className="pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                className={`${
                  location === link.href
                    ? "bg-primary/10 dark:bg-primary/20 border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:bg-muted hover:border-border hover:text-foreground"
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium flex items-center`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
                {link.external && <ChevronRight className="ml-1 h-3 w-3" />}
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-border">
            {user ? (
              <>
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-foreground">{user.username}</div>
                    <div className="text-sm font-medium text-muted-foreground">{user.email}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <Terminal className="mr-2 h-5 w-5" />
                      <span>Panel de control</span>
                    </div>
                  </Link>
                  <Link
                    href="/calendar"
                    className="block px-4 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-5 w-5" />
                      <span>Calendario</span>
                    </div>
                  </Link>
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <Settings className="mr-2 h-5 w-5" />
                      <span>Perfil</span>
                    </div>
                  </Link>
                  {!user.isPremium && !user.lifetimeAccess && (
                    <Link
                      href="/subscribe"
                      className="block px-4 py-2 text-base font-medium text-primary hover:text-red-700 hover:bg-muted"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        <span className="mr-2">⭐</span>
                        <span>Mejorar a Premium</span>
                      </div>
                    </Link>
                  )}
                  <a 
                    href="https://github.com/redcreativaestudio" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block px-4 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <Github className="mr-2 h-5 w-5" />
                      <span>Código Abierto</span>
                    </div>
                  </a>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogout();
                    }}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <div className="flex items-center">
                      <LogOut className="mr-2 h-5 w-5" />
                      <span>Cerrar sesión</span>
                    </div>
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-3 space-y-1">
                <Link
                  href="/login"
                  className="block px-4 py-3 text-base font-medium text-white hover:text-foreground hover:bg-muted rounded-sm my-2 border border-border/30"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/register"
                  className="block px-4 py-3 text-base font-medium text-white bg-primary hover:bg-primary/90 rounded-sm my-2 shadow-md shadow-primary/20"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Empezar gratis
                </Link>
                <a 
                  href="https://github.com/redcreativaestudio" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block px-4 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <Github className="mr-2 h-5 w-5" />
                    <span>Código Abierto</span>
                  </div>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
