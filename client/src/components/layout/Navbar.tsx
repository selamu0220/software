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
import { Menu, X, User as UserIcon, Calendar, LogOut, Settings, MonitorPlay, Video, BarChart3 } from "lucide-react";

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
    { name: "Teleprompter", href: "/teleprompter" },
    { name: "Grabación", href: "/recording" },
    { name: "Métricas", href: "/metrics" },
    { name: "Plantillas", href: "/#templates" },
    { name: "Precios", href: "/#pricing" },
  ];

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
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
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative rounded-md h-9 w-9 p-0">
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
                    <Link href="/dashboard" className="flex items-center">
                      <UserIcon className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/calendar" className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      Calendario
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/teleprompter" className="flex items-center">
                      <MonitorPlay className="mr-2 h-4 w-4" />
                      Teleprompter
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/recording" className="flex items-center">
                      <Video className="mr-2 h-4 w-4" />
                      Grabación
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/metrics" className="flex items-center">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Métricas
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Perfil
                    </Link>
                  </DropdownMenuItem>
                  {!user.isPremium && !user.lifetimeAccess && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/subscribe">Actualizar a Premium</Link>
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
                  <Button variant="ghost" size="sm" className="text-sm font-medium">
                    Iniciar sesión
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="default" size="sm" className="text-sm font-medium">
                    Registrarse
                  </Button>
                </Link>
              </>
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
          <div className="pt-4 pb-3 border-t border-border">
            {user ? (
              <>
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <div className="h-9 w-9 rounded-md bg-secondary/70 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-foreground" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-foreground">{user.username}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-0.5">
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
                    href="/recording"
                    className="block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/20"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <Video className="mr-2 h-4 w-4" />
                      <span>Grabación</span>
                    </div>
                  </Link>
                  <Link
                    href="/metrics"
                    className="block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/20"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      <span>Métricas</span>
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
                  className="block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/20 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="block px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/50 bg-secondary/30 rounded-md mt-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
