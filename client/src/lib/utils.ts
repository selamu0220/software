import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date to display in UI
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Format date to YYYY-MM-DD for form inputs
export function formatDateForInput(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

// Get day of month with suffix (1st, 2nd, 3rd, etc.)
export function getDayWithSuffix(date: Date): string {
  const day = date.getDate();
  const suffix = getDaySuffix(day);
  return `${day}${suffix}`;
}

function getDaySuffix(day: number): string {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

// Get month name
export function getMonthName(month: number): string {
  const date = new Date();
  date.setMonth(month);
  return date.toLocaleString('en-US', { month: 'long' });
}

// Get formatted month and year
export function getMonthAndYear(date: Date): string {
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

// Get number of days in a month
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// Get first day of month (0 = Sunday, 1 = Monday, etc.)
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

// Calculate previous month
export function getPreviousMonth(year: number, month: number): { year: number, month: number } {
  return {
    year: month === 0 ? year - 1 : year,
    month: month === 0 ? 11 : month - 1
  };
}

// Calculate next month
export function getNextMonth(year: number, month: number): { year: number, month: number } {
  return {
    year: month === 11 ? year + 1 : year,
    month: month === 11 ? 0 : month + 1
  };
}

// Generate day cells for calendar
export function generateCalendarDays(year: number, month: number): Array<{ day: number, currentMonth: boolean, date: Date }> {
  const days = [];
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);
  
  // Previous month days
  const prevMonth = getPreviousMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(prevMonth.year, prevMonth.month);
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    days.push({
      day,
      currentMonth: false,
      date: new Date(prevMonth.year, prevMonth.month, day)
    });
  }
  
  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    days.push({
      day,
      currentMonth: true,
      date: new Date(year, month, day)
    });
  }
  
  // Next month days
  const nextMonth = getNextMonth(year, month);
  const remainingDays = 42 - days.length; // 6 rows of 7 days
  for (let day = 1; day <= remainingDays; day++) {
    days.push({
      day,
      currentMonth: false,
      date: new Date(nextMonth.year, nextMonth.month, day)
    });
  }
  
  return days;
}

// Format price from cents to currency format
export function formatPrice(cents: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

// Get a random color for calendar entries
export const CALENDAR_COLORS = ['red', 'blue', 'green', 'purple', 'yellow', 'indigo', 'pink'];

export function getRandomColor(): string {
  return CALENDAR_COLORS[Math.floor(Math.random() * CALENDAR_COLORS.length)];
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Video category options for select
export const VIDEO_CATEGORIES = [
  "Gaming",
  "Technology",
  "Lifestyle",
  "Education",
  "Entertainment",
  "Business",
  "Health & Fitness",
  "Travel",
  "Food",
  "DIY & Crafts",
  "Music",
  "Fashion & Beauty",
  "Sports",
  "Science",
  "Art"
];

// Subcategory options mapped by category
export const VIDEO_SUBCATEGORIES: Record<string, string[]> = {
  "Gaming": [
    "Game Reviews",
    "Let's Plays",
    "Gaming Tips & Tricks",
    "Esports",
    "Game Development",
    "Gaming News"
  ],
  "Technology": [
    "Software Reviews",
    "Hardware Reviews",
    "AI Tools",
    "Programming Tutorials",
    "Tech News",
    "Gadget Reviews"
  ],
  "Lifestyle": [
    "Daily Vlogs",
    "Minimalism",
    "Productivity",
    "Home Decor",
    "Life Hacks",
    "Self-Improvement"
  ],
  "Education": [
    "Online Courses",
    "Language Learning",
    "Science Experiments",
    "Math Tutorials",
    "History Lessons",
    "Educational Facts"
  ],
  "Entertainment": [
    "Comedy Sketches",
    "Movie Reviews",
    "Celebrity News",
    "Reaction Videos",
    "Pranks",
    "Web Series"
  ],
  "Business": [
    "Entrepreneurship",
    "Marketing Strategies",
    "Startup Tips",
    "E-commerce",
    "Personal Finance",
    "Business Case Studies"
  ],
  "Health & Fitness": [
    "Workout Routines",
    "Meal Prep",
    "Weight Loss Tips",
    "Yoga & Meditation",
    "Fitness Challenges",
    "Nutrition Advice"
  ],
  "Travel": [
    "Travel Vlogs",
    "Destination Guides",
    "Budget Travel",
    "Solo Travel",
    "Adventure Travel",
    "Travel Tips"
  ],
  "Food": [
    "Recipes",
    "Restaurant Reviews",
    "Cooking Techniques",
    "Food Challenges",
    "Cuisine Explorations",
    "Baking"
  ],
  "DIY & Crafts": [
    "DIY Projects",
    "Crafting Tutorials",
    "Home Improvement",
    "Upcycling",
    "Art Supplies Reviews",
    "Woodworking"
  ]
};

// Video length options
export const VIDEO_LENGTHS = [
  "Short (1-3 min)",
  "Medium (5-10 min)",
  "Long (10-20 min)",
  "Extended (20-60 min)"
];

// Template style options
export const TEMPLATE_STYLES = [
  "Listicle",
  "How-To Guide",
  "Review",
  "Tutorial",
  "Commentary",
  "Comparison",
  "Story/Narrative",
  "News/Update"
];

// Content tone options
export const CONTENT_TONES = [
  "Professional",
  "Casual",
  "Humorous",
  "Educational",
  "Enthusiastic",
  "Serious",
  "Inspirational"
];

// Plantillas de títulos personalizados
export const VIDEO_TITLE_TEMPLATES = [
  "Top [Número] Secretos que Nadie te Cuenta sobre [Tema]",
  "10 Mejores Maneras de [Acción] sin [Obstáculo]",
  "[Número] Tips para [Objetivo] como Profesional",
  "Top [Número] Errores que Debes Evitar en [Tema]",
  "10 Trucos Geniales para [Acción] que Cambiarán tu [Aspecto de Vida]",
  "[Número] Cosas que Debes Saber Antes de [Acción/Tema]",
  "Top [Número] Ideas Creativas para [Objetivo]",
  "[Número] Hábitos que te Harán Mejor en [Tema]",
  "Top [Número] Tendencias en [Tema] que Debes Conocer",
  "[Número] Razones por las que [Acción/Tema] está arruinando tu vida (y cómo arreglarlo)",
  "¿Quieres [Resultado]? Aquí tienes [Número] pasos que realmente funcionan",
  "[Número] Secretos que usan los expertos en [Tema] (y tú no)",
  "[Número] Cosas que JAMÁS deberías hacer si quieres [Objetivo]",
  "[Número] Trucos psicológicos para [Acción] sin darte cuenta",
  "Lo que NADIE te dice sobre [Tema] (y deberías saber YA)",
  "[Número] Métodos poco conocidos para [Resultado brutal]",
  "[Número] Señales de que lo estás haciendo MAL en [Tema]",
  "[Número] Estrategias ridículamente fáciles para [Acción]",
  "[Número] Cambios pequeños que transformarán tu [Área de Vida]",
  "[Número] errores que estás cometiendo sin saberlo en [Tema]",
  "Si haces esto, estás saboteando tu [Meta]. Haz esto en su lugar",
  "[Número] Hacks que solo los pros usan para [Acción]",
  "La guía DEFINITIVA para [Acción/Tema] en [Año]",
  "[Número] formas de [Acción] en menos de [X minutos]",
  "¿Vale la pena [Acción]? Esto es lo que descubrí (spoiler: flipas)",
  "[Número] mitos sobre [Tema] que están jodiéndote la vida",
  "[Número] verdades incómodas sobre [Tema] que necesitas oír",
  "[Número] Cosas que Desearía Haber Sabido Antes de Empezar en [Tema]",
  "Haz Esto Durante [Tiempo Corto] y Verás Cambios Brutales en [Resultado]",
  "¿Estás Estancado en [Tema]? Prueba Estos [Número] Cambios Urgentes"
];
