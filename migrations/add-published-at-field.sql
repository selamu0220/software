-- Añadir el campo publishedAt a la tabla blog_posts
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Crear índice para facilitar consultas de publicación programada
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at 
ON blog_posts(published_at);