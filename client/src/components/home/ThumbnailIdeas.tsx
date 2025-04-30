import { Card, CardContent } from "@/components/ui/card";

export default function ThumbnailIdeas() {
  const thumbnailIdeas = [
    {
      title: "La Cara de Asombro",
      description: "Muestra sorpresa genuina ante las herramientas o resultados increíbles que estás compartiendo.",
      imageUrl: "https://images.unsplash.com/photo-1586511925558-a4c6376fe65f?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=337"
    },
    {
      title: "Antes/Después",
      description: "Demuestra la transformación que promete tu contenido de video con un contraste visual claro.",
      imageUrl: "https://images.unsplash.com/photo-1604881988758-f76ad2f7aac1?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=337"
    },
    {
      title: "El Número Destacado",
      description: "Presenta un número en negrita (ej: \"7 Herramientas\" o \"5 Pasos\") para atraer espectadores con claridad.",
      imageUrl: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=337"
    }
  ];

  return (
    <section className="py-12 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center mb-10">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase font-heading">Bonus</h2>
          <p className="mt-2 text-3xl leading-8 font-bold tracking-tight text-foreground sm:text-4xl font-heading">
            Ideas de Thumbnails
          </p>
          <p className="mt-4 max-w-2xl text-xl text-muted-foreground lg:mx-auto">
            Conceptos de miniaturas de alto rendimiento para tus ideas de videos.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {thumbnailIdeas.map((idea, index) => (
            <Card key={index} className="overflow-hidden idea-card border border-primary/20 hover:border-primary/70 transition-all">
              <CardContent className="p-4">
                <h3 className="text-lg font-bold text-foreground mb-2 font-heading">{`"${idea.title}"`}</h3>
                <div className="aspect-video bg-black rounded-md overflow-hidden border border-border">
                  <img 
                    src={idea.imageUrl} 
                    alt={`${idea.title} thumbnail concept`} 
                    className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
                  />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {idea.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
