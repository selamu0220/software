import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { getMonthAndYear, getFirstDayOfMonth, getDaysInMonth, getNextMonth, getPreviousMonth } from "@/lib/utils";

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

interface CalendarPreviewProps {
  isLoggedIn: boolean;
  isPremium: boolean;
}

export default function CalendarPreview({ isLoggedIn, isPremium }: CalendarPreviewProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  // Datos de ejemplo para entradas del calendario
  const mockEntries = [
    { day: 2, title: "Top 5 Herramientas IA", color: "red" },
    { day: 5, title: "Tutorial de edición", color: "blue" },
    { day: 9, title: "Guía de desarrollo web", color: "green" },
    { day: 12, title: "Review de DaVinci", color: "purple" },
  ];

  const handlePreviousMonth = () => {
    const { year, month } = getPreviousMonth(currentYear, currentMonth);
    setCurrentYear(year);
    setCurrentMonth(month);
  };

  const handleNextMonth = () => {
    const { year, month } = getNextMonth(currentYear, currentMonth);
    setCurrentYear(year);
    setCurrentMonth(month);
  };

  // Generate calendar days
  const generateCalendarGrid = () => {
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    
    // Previous month
    const prevMonth = getPreviousMonth(currentYear, currentMonth);
    const daysInPrevMonth = getDaysInMonth(prevMonth.year, prevMonth.month);
    
    // Calendar rows (first two weeks)
    let days = [];
    
    // Add days from previous month
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      days.push({ day, currentMonth: false });
    }
    
    // Add days from current month
    for (let day = 1; day <= daysInMonth; day++) {
      const entry = mockEntries.find(e => e.day === day);
      days.push({ 
        day, 
        currentMonth: true,
        entry: entry ? { title: entry.title, color: entry.color } : undefined
      });
      
      // Only show two weeks
      if (days.length >= 14) break;
    }
    
    return days;
  };

  const calendarDays = generateCalendarGrid();

  return (
    <section className="py-16 bg-gradient-to-b from-slate-950 to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center mb-10">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase font-heading">Calendario de Contenido</h2>
          <p className="mt-2 text-3xl leading-8 font-bold tracking-tight sm:text-4xl font-heading">
            Planifica Todo Tu Mes
          </p>
          <p className="mt-4 max-w-2xl text-xl text-muted-foreground lg:mx-auto">
            Organiza tus ideas de videos en un calendario de contenido para mantener un ritmo constante de publicación.
          </p>
        </div>

        <Card className="bg-slate-950 border-slate-800">
          <CardHeader className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-slate-800">
            <h3 className="text-lg leading-6 font-medium font-heading">{getMonthAndYear(new Date(currentYear, currentMonth))}</h3>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 text-center text-xs leading-6 text-muted-foreground">
              {WEEKDAYS.map(day => (
                <div key={day} className="py-2">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 text-sm border-t border-l border-slate-800">
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  className={`calendar-day border-r border-b border-slate-800 ${!day.currentMonth ? 'calendar-day-gray' : ''}`}
                >
                  <span className={!day.currentMonth ? 'text-slate-500' : ''}>{day.day}</span>
                  {day.entry && (
                    <div className={`calendar-day-idea calendar-day-idea-${day.entry.color}`}>
                      {day.entry.title}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="bg-slate-900 px-4 py-4 sm:px-6 border-t border-slate-800">
            {isLoggedIn && isPremium ? (
              <Link href="/calendar">
                <Button>Ver Calendario Completo</Button>
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground">
                <Lock className="inline-block mr-1 h-4 w-4" /> 
                Calendario disponible para usuarios registrados
              </span>
            )}
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
