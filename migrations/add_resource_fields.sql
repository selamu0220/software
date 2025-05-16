-- Añadir nuevos campos a la tabla de recursos
ALTER TABLE resources 
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS price INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS resource_type TEXT DEFAULT 'file' NOT NULL,
ADD COLUMN IF NOT EXISTS ai_category TEXT,
ADD COLUMN IF NOT EXISTS vote_count INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS vote_score INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS commission_percent INTEGER DEFAULT 50 NOT NULL;

-- Crear tabla de votos para recursos si no existe
CREATE TABLE IF NOT EXISTS resource_votes (
  id SERIAL PRIMARY KEY,
  resource_id INTEGER NOT NULL REFERENCES resources(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  score INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Crear índice para acelerar búsquedas de votos
CREATE INDEX IF NOT EXISTS resource_votes_resource_id_idx ON resource_votes(resource_id);
CREATE INDEX IF NOT EXISTS resource_votes_user_id_idx ON resource_votes(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS resource_votes_user_resource_idx ON resource_votes(user_id, resource_id);