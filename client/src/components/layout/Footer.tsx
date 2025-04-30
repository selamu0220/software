import { Link } from "wouter";
import { Twitter, Youtube, Instagram, Github, Heart, Code, ChevronRight } from "lucide-react";
import { ModeToggle } from "@/components/ui/mode-toggle";

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1 animate-fade-in">
            <div className="flex items-center">
              <span className="text-primary font-heading font-bold text-2xl">Red Creativa</span>
              <span className="beta-badge ml-2">BETA</span>
            </div>
            <p className="text-muted-foreground text-base">
              Generador de ideas creativas para videos de YouTube con IA. Planifica tu calendario de contenido y nunca te quedes sin inspiración.
            </p>
            <p className="flex items-center text-muted-foreground text-sm gap-2">
              <Code className="h-4 w-4" />
              <span>Código abierto para la comunidad hispanohablante</span>
            </p>
            <div className="flex space-x-6">
              <a href="https://twitter.com/redcreativa" className="text-muted-foreground hover:text-foreground transition-colors">
                <span className="sr-only">Twitter</span>
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://www.youtube.com/@redcreativa-y9d/videos" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <span className="sr-only">YouTube</span>
                <Youtube className="h-5 w-5" />
              </a>
              <a href="https://github.com/redcreativaestudio" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <span className="sr-only">GitHub</span>
                <Github className="h-5 w-5" />
              </a>
              <ModeToggle />
            </div>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">
                  Producto
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link href="/" className="text-base text-muted-foreground hover:text-foreground">
                      Generador
                    </Link>
                  </li>
                  <li>
                    <Link href="/calendar" className="text-base text-muted-foreground hover:text-foreground">
                      Calendario
                    </Link>
                  </li>
                  <li>
                    <Link href="/#comunidad" className="text-base text-muted-foreground hover:text-foreground">
                      Comunidad
                    </Link>
                  </li>
                  <li>
                    <Link href="/#pricing" className="text-base text-muted-foreground hover:text-foreground">
                      Precios
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">
                  Soporte
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <a href="#" className="text-base text-muted-foreground hover:text-foreground">
                      Centro de Ayuda
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-base text-muted-foreground hover:text-foreground">
                      Documentación
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-base text-muted-foreground hover:text-foreground">
                      Contacto
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">
                  Legal
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <a href="#" className="text-base text-muted-foreground hover:text-foreground">
                      Privacidad
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-base text-muted-foreground hover:text-foreground">
                      Términos
                    </a>
                  </li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">
                  Empresa
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <a href="#" className="text-base text-muted-foreground hover:text-foreground">
                      Acerca de
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://www.youtube.com/@redcreativa-y9d/videos" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-base text-muted-foreground hover:text-foreground flex items-center"
                    >
                      Blog
                      <ChevronRight className="ml-1 h-3 w-3" />
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-base text-muted-foreground">
              &copy; {new Date().getFullYear()} Red Creativa Script Generator. Todos los derechos reservados.
            </p>
            <p className="flex items-center mt-4 md:mt-0 text-sm text-muted-foreground">
              <span>Hecho con</span>
              <Heart className="h-4 w-4 mx-1 text-primary" />
              <span>para la comunidad hispana</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
