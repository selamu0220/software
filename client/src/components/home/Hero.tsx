import { Link } from "wouter";
import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface HeroProps {
  user: User | null;
}

export default function Hero({ user }: HeroProps) {
  return (
    <div className="relative overflow-hidden bg-background border-b border-border">
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 py-16 lg:py-28 w-full hero-gradient">
          <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl tracking-tight font-bold sm:text-5xl md:text-6xl font-heading">
                <span className="block mb-2">AI-Powered YouTube</span>
                <span className="block text-primary">Video Ideas Generator</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
                Generate engaging video ideas for your YouTube channel, create a content calendar, and never run out of inspiration again.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="#generator">
                  <Button size="lg" className="w-full sm:w-auto px-8">
                    Generate Ideas
                  </Button>
                </Link>
                <Link href="#pricing">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto px-8">
                    View Pricing
                  </Button>
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
