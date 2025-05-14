-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  cover_image TEXT NOT NULL,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  reading_time INTEGER NOT NULL,
  tags TEXT[] NOT NULL,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create blog_categories table
CREATE TABLE IF NOT EXISTS blog_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create blog_post_categories table
CREATE TABLE IF NOT EXISTS blog_post_categories (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES blog_categories(id) ON DELETE CASCADE
);