import { useEffect, useState } from "react";
import { Link } from "lucide-react";

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  contentSelector?: string;
  className?: string;
  title?: string;
  maxDepth?: number;
}

/**
 * Componente que genera una tabla de contenidos automáticamente 
 * basada en los encabezados de la página
 */
export function TableOfContents({
  contentSelector = "main",
  className = "",
  title = "Contenido",
  maxDepth = 3
}: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  // Función para extraer el texto limpio de un elemento
  const extractText = (element: Element): string => {
    return element.textContent?.trim() || "";
  };

  // Función para generar un ID basado en el texto si no existe
  const generateId = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
  };

  // Función para asegurar que todos los encabezados tengan IDs
  const ensureIds = (elements: Element[]): void => {
    elements.forEach((el) => {
      if (!el.id) {
        el.id = generateId(extractText(el));
      }
    });
  };

  // Función para detectar la sección visible actualmente
  const detectActiveHeading = () => {
    const container = document.querySelector(contentSelector);
    if (!container) return;

    const headings = Array.from(
      container.querySelectorAll("h2, h3, h4, h5, h6")
    ).filter(el => el.id);

    if (headings.length === 0) return;

    // Obtener la posición de scroll
    const scrollY = window.scrollY;
    
    // Encontrar el encabezado visible actual (el último que está por encima del scroll)
    let activeHeading = headings[0];
    
    for (const heading of headings) {
      // Ajustar el offset para detectar mejor cuándo un encabezado está activo
      const offset = 100; // px from top
      if (heading.getBoundingClientRect().top <= offset) {
        activeHeading = heading;
      } else {
        break;
      }
    }

    setActiveId(activeHeading.id);
  };

  // Extraer los encabezados del contenido
  useEffect(() => {
    const container = document.querySelector(contentSelector);
    if (!container) return;

    // Seleccionar todos los encabezados h2 a h6 según la profundidad máxima
    const headingSelectors = Array.from(
      { length: Math.min(maxDepth, 5) },
      (_, i) => `h${i + 2}`
    ).join(", ");

    const elements = Array.from(container.querySelectorAll(headingSelectors));
    
    // Asegurar que todos los encabezados tengan IDs
    ensureIds(elements);

    // Convertir los elementos a objetos TOCItem
    const items: TOCItem[] = elements.map((el) => {
      const level = parseInt(el.tagName.substring(1), 10) - 1;
      return {
        id: el.id,
        text: extractText(el),
        level: level
      };
    });

    setHeadings(items);

    // Configurar la detección del encabezado activo
    window.addEventListener("scroll", detectActiveHeading, { passive: true });
    detectActiveHeading();

    return () => {
      window.removeEventListener("scroll", detectActiveHeading);
    };
  }, [contentSelector, maxDepth]);

  // No mostrar la tabla de contenidos si no hay encabezados
  if (headings.length === 0) {
    return null;
  }

  return (
    <nav
      className={`toc rounded-lg border border-border p-4 my-6 ${className}`}
      aria-labelledby="toc-title"
    >
      <div className="flex items-center mb-3">
        <Link className="w-4 h-4 mr-2 text-muted-foreground" aria-hidden="true" />
        <h2 id="toc-title" className="text-lg font-medium">
          {title}
        </h2>
      </div>
      
      <ul className="space-y-1 text-sm">
        {headings.map((item) => (
          <li
            key={item.id}
            className="line-clamp-1"
            style={{ marginLeft: `${(item.level - 1) * 16}px` }}
          >
            <a
              href={`#${item.id}`}
              className={`block py-1 hover:text-primary transition-colors ${
                activeId === item.id
                  ? "text-primary font-medium"
                  : "text-muted-foreground"
              }`}
              onClick={(e) => {
                e.preventDefault();
                const element = document.getElementById(item.id);
                if (element) {
                  // Desplazamiento suave a la sección
                  element.scrollIntoView({ behavior: "smooth" });
                  // Actualizar la URL con el hash pero sin saltos bruscos
                  history.pushState(null, "", `#${item.id}`);
                  setActiveId(item.id);
                }
              }}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}