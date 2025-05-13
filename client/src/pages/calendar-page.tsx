import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import GoogleStyleCalendar from "@/components/calendar/GoogleStyleCalendar";
import { Loader2 } from "lucide-react";
import { User } from "@shared/schema";

export default function CalendarPage() {
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  useEffect(() => {
    document.title = "Calendario de Contenido | Red Creativa Gen";
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-xl font-bold mb-4">Error al cargar datos</h2>
        <p className="text-muted-foreground mb-6">
          No se pudieron cargar los datos del usuario. Por favor, intenta de nuevo.
        </p>
      </div>
    );
  }

  return <GoogleStyleCalendar user={user as User | null} />;
}