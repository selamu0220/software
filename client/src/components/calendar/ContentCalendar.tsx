import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { PopoverContent, PopoverTrigger, Popover } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CalendarEntry, VideoIdea } from "@shared/schema";
import { format } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { cn, getMonthAndYear, getDaysInMonth, getFirstDayOfMonth, getPreviousMonth, getNextMonth, getRandomColor } from "@/lib/utils";
import { ChevronLeft, ChevronRight, CalendarPlus, Loader2, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";

interface ContentCalendarProps {
  userId: number;
}

// Form schema for adding calendar entries
const calendarEntrySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  date: z.date(),
  videoIdeaId: z.number().optional(),
});

type CalendarEntryFormValues = z.infer<typeof calendarEntrySchema>;

export default function ContentCalendar({ userId }: ContentCalendarProps) {
  const { toast } = useToast();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<CalendarEntry | null>(null);

  // Fetch calendar entries
  const { data: calendarEntries = [], isLoading: loadingEntries } = useQuery<CalendarEntry[]>({
    queryKey: ['/api/calendar'],
    staleTime: 60000, // 1 minute
  });

  // Fetch video ideas for dropdown
  const { data: videoIdeas = [], isLoading: loadingIdeas } = useQuery<VideoIdea[]>({
    queryKey: ['/api/video-ideas'],
    staleTime: 60000, // 1 minute
  });

  // Setup form for adding/editing calendar entries
  const form = useForm<CalendarEntryFormValues>({
    resolver: zodResolver(calendarEntrySchema),
    defaultValues: {
      title: "",
      date: today,
      videoIdeaId: undefined,
    },
  });

  // Reset form values when selected entry changes
  useEffect(() => {
    if (selectedEntry) {
      form.reset({
        title: selectedEntry.title,
        date: new Date(selectedEntry.date),
        videoIdeaId: selectedEntry.videoIdeaId || undefined,
      });
    } else {
      form.reset({
        title: "",
        date: selectedDate || today,
        videoIdeaId: undefined,
      });
    }
  }, [selectedEntry, selectedDate, form]);

  // Add calendar entry mutation
  const addEntryMutation = useMutation({
    mutationFn: async (data: CalendarEntryFormValues) => {
      const response = await apiRequest("POST", "/api/calendar", {
        ...data,
        date: data.date.toISOString(),
        userId,
        completed: false,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add calendar entry");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar'] });
      toast({
        title: "Success",
        description: "Calendar entry added successfully",
      });
      setCalendarDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update calendar entry mutation
  const updateEntryMutation = useMutation({
    mutationFn: async (data: { id: number, updates: Partial<CalendarEntry> }) => {
      const response = await apiRequest("PATCH", `/api/calendar/${data.id}`, data.updates);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update calendar entry");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar'] });
      toast({
        title: "Success",
        description: "Calendar entry updated successfully",
      });
      setCalendarDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete calendar entry mutation
  const deleteEntryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/calendar/${id}`, undefined);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete calendar entry");
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar'] });
      toast({
        title: "Success",
        description: "Calendar entry deleted successfully",
      });
      setCalendarDialogOpen(false);
      setSelectedEntry(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

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

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    
    // Check if there's an entry for this date
    const entry = calendarEntries?.find(e => {
      const entryDate = new Date(e.date);
      return entryDate.toDateString() === date.toDateString();
    });
    
    if (entry) {
      setSelectedEntry(entry);
    } else {
      setSelectedEntry(null);
    }
    
    setCalendarDialogOpen(true);
  };

  const onSubmit = (data: CalendarEntryFormValues) => {
    if (selectedEntry) {
      // Update existing entry
      updateEntryMutation.mutate({
        id: selectedEntry.id,
        updates: {
          ...data,
          date: data.date.toISOString(),
        }
      });
    } else {
      // Add new entry
      addEntryMutation.mutate(data);
    }
  };

  const handleDeleteEntry = () => {
    if (selectedEntry) {
      deleteEntryMutation.mutate(selectedEntry.id);
    }
  };

  // Generate calendar grid
  const generateCalendarGrid = () => {
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    
    // Previous month
    const prevMonth = getPreviousMonth(currentYear, currentMonth);
    const daysInPrevMonth = getDaysInMonth(prevMonth.year, prevMonth.month);
    
    const days = [];
    
    // Add days from previous month
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const date = new Date(prevMonth.year, prevMonth.month, day);
      days.push({ 
        day, 
        date, 
        currentMonth: false,
        entries: getEntriesForDate(date)
      });
    }
    
    // Add days from current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      days.push({ 
        day, 
        date, 
        currentMonth: true,
        entries: getEntriesForDate(date)
      });
    }
    
    // Next month
    const nextMonth = getNextMonth(currentYear, currentMonth);
    const remainingDays = 42 - days.length; // 6 rows of 7 days
    
    // Add days from next month
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(nextMonth.year, nextMonth.month, day);
      days.push({ 
        day, 
        date, 
        currentMonth: false,
        entries: getEntriesForDate(date)
      });
    }
    
    return days;
  };

  // Get calendar entries for a specific date
  const getEntriesForDate = (date: Date) => {
    if (!calendarEntries) return [];
    
    return calendarEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.toDateString() === date.toDateString();
    });
  };

  // Generate weeks for calendar grid display
  const generateCalendarWeeks = () => {
    const days = generateCalendarGrid();
    const weeks = [];
    
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    
    return weeks;
  };

  // Get video idea title by id
  const getVideoIdeaTitle = (id: number): string => {
    if (videoIdeas.length === 0) return "Loading...";
    const idea = videoIdeas.find((idea) => idea.id === id);
    return idea ? idea.title : "Unknown Video";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-slate-950 border-b border-border">
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-bold font-heading">{getMonthAndYear(new Date(currentYear, currentMonth))}</h2>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Dialog open={calendarDialogOpen} onOpenChange={setCalendarDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setSelectedDate(new Date(currentYear, currentMonth, new Date().getDate()));
                  setSelectedEntry(null);
                }}>
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Añadir Evento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {selectedEntry ? "Edit Calendar Entry" : "Add Calendar Entry"}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Video Title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="videoIdeaId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Video Idea (Optional)</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(value !== "0" ? parseInt(value) : undefined)}
                            value={field.value?.toString() || "0"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a video idea (optional)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">None</SelectItem>
                              {videoIdeas.map((idea) => (
                                <SelectItem key={idea.id} value={idea.id.toString()}>
                                  {idea.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter className="gap-2 sm:gap-0">
                      {selectedEntry && (
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={handleDeleteEntry}
                          disabled={deleteEntryMutation.isPending}
                        >
                          {deleteEntryMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                          )}
                          Delete
                        </Button>
                      )}
                      <Button
                        type="submit"
                        disabled={addEntryMutation.isPending || updateEntryMutation.isPending}
                      >
                        {(addEntryMutation.isPending || updateEntryMutation.isPending) ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        {selectedEntry ? "Update" : "Add"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 bg-slate-950 text-center text-xs leading-6 text-foreground border-b border-border">
            <div className="py-2 font-semibold">Dom</div>
            <div className="py-2 font-semibold">Lun</div>
            <div className="py-2 font-semibold">Mar</div>
            <div className="py-2 font-semibold">Mié</div>
            <div className="py-2 font-semibold">Jue</div>
            <div className="py-2 font-semibold">Vie</div>
            <div className="py-2 font-semibold">Sáb</div>
          </div>
          {loadingEntries ? (
            <div className="h-80 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="border-l border-t">
              {generateCalendarWeeks().map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7">
                  {week.map((day, dayIndex) => (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`calendar-day ${
                        !day.currentMonth ? 'calendar-day-gray' : 'calendar-day-current'
                      } ${
                        day.date.toDateString() === new Date().toDateString()
                          ? 'bg-primary/20 border border-primary'
                          : ''
                      }`}
                      onClick={() => handleDateClick(day.date)}
                    >
                      <span className={`text-sm ${!day.currentMonth ? 'text-muted-foreground' : ''}`}>
                        {day.day}
                      </span>
                      <div className="mt-1 space-y-1">
                        {day.entries.slice(0, 3).map((entry, index) => {
                          return (
                            <div
                              key={entry.id}
                              className="calendar-entry"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEntry(entry);
                                setCalendarDialogOpen(true);
                              }}
                            >
                              {entry.title}
                            </div>
                          );
                        })}
                        {day.entries.length > 3 && (
                          <div className="text-xs text-muted-foreground text-center">
                            +{day.entries.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="p-3 bg-slate-950 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Haz clic en un día para añadir una nueva idea de video a tu calendario.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
