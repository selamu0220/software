import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "wouter";

export function Breadcrumb() {
  const [location] = useLocation();
  
  if (location === "/") return null; // No mostrar breadcrumbs en la página de inicio
  
  const pathSegments = location.split("/").filter(Boolean);
  
  // Mapeo de URLs a nombres legibles
  const pathNames: Record<string, string> = {
    "calendar": "Calendario",
    "recursos": "Recursos",
    "teleprompter": "Teleprompter",
    "profile": "Perfil",
    "subscribe": "Suscripción",
    "recording": "Grabación",
    "metrics": "Métricas",
    "subir": "Subir Recurso"
  };
  
  return (
    <nav aria-label="Breadcrumb" className="flex items-center mb-4 text-sm">
      <ol className="flex items-center space-x-1 text-muted-foreground" itemScope itemType="https://schema.org/BreadcrumbList">
        <li className="flex items-center" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
          <Link href="/">
            <span className="flex items-center hover:text-foreground cursor-pointer" itemProp="item">
              <Home className="w-4 h-4 mr-1" />
              <span itemProp="name">Inicio</span>
            </span>
          </Link>
          <meta itemProp="position" content="1" />
        </li>
        
        {pathSegments.map((segment, index) => {
          const url = `/${pathSegments.slice(0, index + 1).join("/")}`;
          const isLast = index === pathSegments.length - 1;
          const position = index + 2; // +2 porque Inicio es 1
          
          // No mostrar IDs numéricos como parte del breadcrumb
          if (!isNaN(Number(segment))) return null;
          
          return (
            <li 
              key={segment} 
              className="flex items-center" 
              itemProp="itemListElement" 
              itemScope 
              itemType="https://schema.org/ListItem"
            >
              <ChevronRight className="w-3 h-3 mx-1" />
              {isLast ? (
                <span className="font-medium text-foreground" itemProp="name">
                  {pathNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)}
                </span>
              ) : (
                <Link href={url}>
                  <span className="hover:text-foreground cursor-pointer" itemProp="item">
                    <span itemProp="name">
                      {pathNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)}
                    </span>
                  </span>
                </Link>
              )}
              <meta itemProp="position" content={position.toString()} />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}