import { Link } from "wouter";

type RelatedContentItem = {
  title: string;
  path: string;
  description?: string;
  category?: string;
};

interface RelatedContentProps {
  title?: string;
  items: RelatedContentItem[];
  variant?: "card" | "list" | "compact";
}

/**
 * Componente que muestra enlaces a contenido relacionado para mejorar el interlinking
 * Uso: <RelatedContent items={[{title: "Título", path: "/ruta"}]} />
 */
export function RelatedContent({
  title = "Contenido relacionado",
  items,
  variant = "list"
}: RelatedContentProps) {
  if (!items.length) return null;
  
  return (
    <section className="my-8 border border-border rounded-lg p-5 bg-secondary/5" aria-labelledby="related-content-title">
      <h2 id="related-content-title" className="text-xl font-semibold mb-4">{title}</h2>
      
      {variant === "card" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item, index) => (
            <div key={index} className="border border-border rounded-lg p-4 hover:bg-secondary/10 transition-colors">
              <Link href={item.path}>
                <div className="block cursor-pointer">
                  <h3 className="text-lg font-medium hover:text-primary transition-colors">{item.title}</h3>
                  {item.description && (
                    <p className="text-muted-foreground mt-2 text-sm">{item.description}</p>
                  )}
                  {item.category && (
                    <span className="inline-block px-2 py-1 bg-secondary/20 text-xs rounded mt-2">{item.category}</span>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
      
      {variant === "list" && (
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li key={index} className="border-b border-border pb-3 last:border-0">
              <Link href={item.path}>
                <div className="block hover:bg-secondary/5 p-2 -mx-2 rounded transition-colors cursor-pointer">
                  <h3 className="font-medium hover:text-primary transition-colors">{item.title}</h3>
                  {item.description && (
                    <p className="text-muted-foreground mt-1 text-sm">{item.description}</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      
      {variant === "compact" && (
        <ul className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <li key={index}>
              <Link href={item.path}>
                <span className="inline-block px-3 py-1 text-sm border border-border rounded-full hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">
                  {item.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}