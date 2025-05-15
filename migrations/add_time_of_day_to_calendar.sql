-- Añadir columna time_of_day a la tabla calendar_entries
ALTER TABLE calendar_entries ADD COLUMN IF NOT EXISTS time_of_day TEXT DEFAULT '12:00';