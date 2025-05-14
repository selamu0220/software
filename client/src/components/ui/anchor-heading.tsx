import { Link } from "lucide-react";
import { HTMLAttributes, createElement, forwardRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Propiedades para el componente AnchorHeading
 */
interface AnchorHeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  // Nivel del encabezado (1-6)
  level: 1 | 2 | 3 | 4 | 5 | 6;
  // ID para el anclaje, si no se proporciona se genera a partir del texto
  id?: string;
  // Si se debe mostrar el icono de enlace
  showAnchor?: boolean;
}

/**
 * Componente que crea encabezados con enlaces de anclaje para facilitar
 * la navegación y mejorar el SEO
 */
export const AnchorHeading = forwardRef<HTMLHeadingElement, AnchorHeadingProps>(
  ({ level, id, showAnchor = true, className, children, ...props }, ref) => {
    // Generar un ID a partir del contenido de texto si no se proporciona
    const headingId = id || generateIdFromChildren(children);
    
    return createElement(
      `h${level}`,
      {
        id: headingId,
        ref,
        className: cn(
          "group flex items-center gap-2 scroll-mt-20",
          className
        ),
        ...props,
      },
      <>
        {children}
        {showAnchor && (
          <a
            href={`#${headingId}`}
            className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex"
            aria-label={`Enlace al apartado ${
              typeof children === "string" ? children : headingId
            }`}
            onClick={(e) => {
              e.preventDefault();
              // Actualizar la URL sin causar un salto brusco
              window.history.pushState(null, "", `#${headingId}`);
              // Desplazamiento suave
              document.getElementById(headingId)?.scrollIntoView({
                behavior: "smooth",
              });
            }}
          >
            <Link className="h-4 w-4 text-muted-foreground" />
          </a>
        )}
      </>
    );
  }
);

AnchorHeading.displayName = "AnchorHeading";

/**
 * Función auxiliar para generar un ID basado en el contenido del encabezado
 */
function generateIdFromChildren(children: React.ReactNode): string {
  // Si es una cadena simple, usarla directamente
  if (typeof children === "string") {
    return slugify(children);
  }
  
  // Intentar extraer texto de un array de elementos
  if (Array.isArray(children)) {
    const textContent = children
      .map((child) => {
        if (typeof child === "string" || typeof child === "number") {
          return child.toString();
        }
        return "";
      })
      .join("");
    
    return slugify(textContent);
  }
  
  // Fallback: generar un ID aleatorio
  return `heading-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Función para convertir un texto en un slug válido para usar como ID
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Eliminar caracteres que no sean palabras, espacios o guiones
    .replace(/[\s_-]+/g, "-") // Reemplazar espacios, guiones bajos y guiones por un solo guión
    .replace(/^-+|-+$/g, ""); // Eliminar guiones iniciales y finales
}