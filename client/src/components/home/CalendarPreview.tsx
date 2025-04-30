import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { getMonthAndYear, getFirstDayOfMonth, getDaysInMonth, getNextMonth, getPreviousMonth } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface CalendarPreviewProps {
  isLoggedIn: boolean;
  isPremium: boolean;
}

export default function CalendarPreview({ isLoggedIn, isPremium }: CalendarPreviewProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  // Mock data for calendar entries
  const mockEntries = [
    { day: 2, title: "Top 5 AI Tools", color: "red" },
    { day: 5, title: "Editing Tutorial", color: "blue" },
    { day: 9, title: "Web Dev Guide", color: "green" },
    { day: 12, title: "DaVinci Review", color: "purple" },
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
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center mb-10">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase font-heading">Content Calendar</h2>
          <p className="mt-2 text-3xl leading-8 font-bold tracking-tight text-ytdark sm:text-4xl font-heading">
            Plan Your Entire Month
          </p>
          <p className="mt-4 max-w-2xl text-xl text-ytgray lg:mx-auto">
            Organize your video ideas into a content calendar to maintain a consistent posting schedule.
          </p>
        </div>

        <Card>
          <CardHeader className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-ytdark">{getMonthAndYear(new Date(currentYear, currentMonth))}</h3>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="border-t border-gray-200 p-0">
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 text-center text-xs leading-6 text-ytgray">
              {WEEKDAYS.map(day => (
                <div key={day} className="py-2">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 text-sm border-t border-l">
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  className={`calendar-day ${!day.currentMonth ? 'calendar-day-gray' : ''}`}
                >
                  <span className={!day.currentMonth ? 'text-gray-400' : ''}>{day.day}</span>
                  {day.entry && (
                    <div className={`calendar-day-idea calendar-day-idea-${day.entry.color}`}>
                      {day.entry.title}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 px-4 py-4 sm:px-6 border-t border-gray-200">
            {isLoggedIn && isPremium ? (
              <Link href="/calendar">
                <Button>View Full Calendar</Button>
              </Link>
            ) : (
              <span className="text-sm text-ytgray">
                <Lock className="inline-block mr-1 h-4 w-4" /> 
                Calendar feature available to registered users
              </span>
            )}
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
