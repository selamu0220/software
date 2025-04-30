import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { User } from "@shared/schema";

interface PricingProps {
  user: User | null;
}

export default function Pricing({ user }: PricingProps) {
  const isAuthenticated = !!user;
  const isPremium = user?.isPremium || user?.lifetimeAccess;

  return (
    <section id="pricing" className="py-16 bg-gradient-to-b from-black to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center mb-10">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase font-heading">Precios</h2>
          <p className="mt-2 text-3xl leading-8 font-bold tracking-tight sm:text-4xl font-heading">
            Precios Simples y Transparentes
          </p>
          <p className="mt-4 max-w-2xl text-xl text-muted-foreground lg:mx-auto">
            Gratis durante la Beta, con opciones asequibles al lanzamiento oficial.
          </p>
        </div>

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto">
          {/* Free Tier */}
          <Card className="bg-slate-950 rounded-lg shadow-sm divide-y divide-gray-800 pricing-card">
            <div className="p-6">
              <h2 className="text-xl leading-6 font-medium font-heading">Beta Gratis</h2>
              <p className="mt-4 text-sm text-muted-foreground">¡Acceso completo durante nuestro periodo beta!</p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold">€0</span>
                <span className="text-base font-medium text-muted-foreground">/mes</span>
              </p>
              {!isAuthenticated ? (
                <Link href="/register">
                  <Button className="mt-8 block w-full">Registrarse Gratis</Button>
                </Link>
              ) : (
                <Button className="mt-8 block w-full" disabled>
                  {isPremium ? "Plan Actual" : "Ya Registrado"}
                </Button>
              )}
            </div>
            <div className="pt-6 pb-8 px-6">
              <h3 className="text-xs font-medium text-muted-foreground tracking-wide uppercase">Incluye</h3>
              <ul className="mt-6 space-y-4">
                <li className="flex space-x-3">
                  <Check className="flex-shrink-0 h-5 w-5 text-primary" />
                  <span className="text-sm">Genera hasta 30 ideas/mes</span>
                </li>
                <li className="flex space-x-3">
                  <Check className="flex-shrink-0 h-5 w-5 text-primary" />
                  <span className="text-sm">Calendario de contenido básico</span>
                </li>
                <li className="flex space-x-3">
                  <Check className="flex-shrink-0 h-5 w-5 text-primary" />
                  <span className="text-sm">Guarda y exporta ideas</span>
                </li>
                <li className="flex space-x-3">
                  <Check className="flex-shrink-0 h-5 w-5 text-primary" />
                  <span className="text-sm">Acceso a todas las plantillas</span>
                </li>
              </ul>
            </div>
          </Card>

          {/* Premium Tier */}
          <Card className={`bg-slate-950 rounded-lg shadow-sm divide-y divide-gray-800 pricing-card ${isPremium ? '' : 'pricing-highlight'}`}>
            <div className="p-6">
              <h2 className="text-xl leading-6 font-medium font-heading">
                Premium 
                {!isPremium && <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full ml-2">PRÓXIMAMENTE</span>}
              </h2>
              <p className="mt-4 text-sm text-muted-foreground">Todo lo que necesitas para crecer seriamente en YouTube.</p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold">€4.99</span>
                <span className="text-base font-medium text-muted-foreground">/mes</span>
              </p>
              <p className="mt-4 text-sm text-muted-foreground">O <span className="font-bold">€29.99</span> acceso de por vida</p>
              
              {!isAuthenticated ? (
                <Link href="/register">
                  <Button className="mt-8 block w-full">Regístrate Primero</Button>
                </Link>
              ) : isPremium ? (
                <Button className="mt-8 block w-full" disabled>
                  Plan Actual
                </Button>
              ) : (
                <Link href="/subscribe">
                  <Button className="mt-8 block w-full">Mejorar Ahora</Button>
                </Link>
              )}
            </div>
            <div className="pt-6 pb-8 px-6">
              <h3 className="text-xs font-medium text-muted-foreground tracking-wide uppercase">Incluye</h3>
              <ul className="mt-6 space-y-4">
                <li className="flex space-x-3">
                  <Check className="flex-shrink-0 h-5 w-5 text-primary" />
                  <span className="text-sm">Generación de ideas <span className="font-semibold">ilimitada</span></span>
                </li>
                <li className="flex space-x-3">
                  <Check className="flex-shrink-0 h-5 w-5 text-primary" />
                  <span className="text-sm">Calendario de contenido avanzado</span>
                </li>
                <li className="flex space-x-3">
                  <Check className="flex-shrink-0 h-5 w-5 text-primary" />
                  <span className="text-sm">Sugerencias de miniaturas</span>
                </li>
                <li className="flex space-x-3">
                  <Check className="flex-shrink-0 h-5 w-5 text-primary" />
                  <span className="text-sm">Generador de esquemas de guión</span>
                </li>
                <li className="flex space-x-3">
                  <Check className="flex-shrink-0 h-5 w-5 text-primary" />
                  <span className="text-sm">Soporte prioritario</span>
                </li>
                <li className="flex space-x-3">
                  <Check className="flex-shrink-0 h-5 w-5 text-primary" />
                  <span className="text-sm">Todas las funciones futuras</span>
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
