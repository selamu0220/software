import { Link } from "wouter";
import { User } from "@shared/schema";

interface HeroProps {
  user: User | null;
}

export default function Hero({ user }: HeroProps) {
  return (
    <div className="relative bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32 hero-gradient">
          <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
            <div className="sm:text-center lg:text-left">
              <h1 className="text-4xl tracking-tight font-bold text-ytdark sm:text-5xl md:text-6xl font-heading">
                <span className="block xl:inline">AI-Powered YouTube</span>{" "}
                <span className="block text-primary xl:inline">Video Ideas Generator</span>
              </h1>
              <p className="mt-3 text-base text-ytgray sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                Generate engaging video ideas for your YouTube channel, create a content calendar, and never run out of inspiration again.
              </p>
              <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                <div className="rounded-md shadow">
                  <Link href="#generator">
                    <a className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-red-700 md:py-4 md:text-lg md:px-10">
                      Generate Ideas
                    </a>
                  </Link>
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-3">
                  <Link href="#pricing">
                    <a className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary bg-red-100 hover:bg-red-200 md:py-4 md:text-lg md:px-10">
                      View Pricing
                    </a>
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
        <img
          className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
          src="https://images.unsplash.com/photo-1616469829581-73993eb86b02?ixlib=rb-1.2.1&auto=format&fit=crop&w=870&q=80"
          alt="YouTube content creator workspace"
        />
      </div>
    </div>
  );
}
