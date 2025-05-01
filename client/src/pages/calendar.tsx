import { useEffect } from "react";
import { useLocation } from "wouter";
import { User } from "@shared/schema";
import ContentCalendar from "@/components/calendar/ContentCalendar";

interface CalendarPageProps {
  user: User | null;
}

export default function Calendar({ user }: CalendarPageProps) {
  const [, setLocation] = useLocation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (user === null) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  // If user is null, we're redirecting, don't render anything yet
  if (user === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-3xl font-bold tracking-tight">Calendario de Contenido</h1>
        <p className="text-muted-foreground mt-2 mb-8">
          Organiza y programa tu contenido para mantener una estrategia constante.
        </p>
        
        <ContentCalendar user={user} />
      </div>
    </div>
  );
}