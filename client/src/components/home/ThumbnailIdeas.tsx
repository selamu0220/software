import { Card, CardContent } from "@/components/ui/card";

export default function ThumbnailIdeas() {
  const thumbnailIdeas = [
    {
      title: "The Shocked Face",
      description: "Shows genuine surprise at the amazing tools or results you're sharing.",
      imageUrl: "https://images.unsplash.com/photo-1586511925558-a4c6376fe65f?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=337"
    },
    {
      title: "Before/After Split",
      description: "Demonstrates the transformation your video content promises.",
      imageUrl: "https://images.unsplash.com/photo-1604881988758-f76ad2f7aac1?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=337"
    },
    {
      title: "The Number Highlight",
      description: "Features a bold number (e.g., \"7 Tools\" or \"5 Steps\") to attract viewers.",
      imageUrl: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=337"
    }
  ];

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center mb-10">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase font-heading">Bonus</h2>
          <p className="mt-2 text-3xl leading-8 font-bold tracking-tight text-ytdark sm:text-4xl font-heading">
            Thumbnail Ideas
          </p>
          <p className="mt-4 max-w-2xl text-xl text-ytgray lg:mx-auto">
            High-converting thumbnail concepts to pair with your video ideas.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {thumbnailIdeas.map((idea, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-4">
                <h3 className="text-lg font-medium text-ytdark mb-2">{`"${idea.title}"`}</h3>
                <div className="aspect-video bg-gray-200 rounded-md overflow-hidden">
                  <img 
                    src={idea.imageUrl} 
                    alt={`${idea.title} thumbnail concept`} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="mt-2 text-sm text-ytgray">
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
