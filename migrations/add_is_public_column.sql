-- Añadir la columna is_public a la tabla video_ideas si no existe

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'video_ideas' AND column_name = 'is_public'
    ) THEN
        ALTER TABLE video_ideas ADD COLUMN is_public BOOLEAN DEFAULT false NOT NULL;
        RAISE NOTICE 'La columna is_public se ha añadido a la tabla video_ideas';
    ELSE
        RAISE NOTICE 'La columna is_public ya existe en la tabla video_ideas';
    END IF;
END $$;