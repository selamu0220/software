// Script para crear las tablas de recursos y sus relaciones
import pg from 'pg';
const { Pool } = pg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

async function createResourceTables() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not set");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  try {
    console.log("Creando tabla de recursos...");
    
    // Crear tabla resources
    await pool.query(`
      CREATE TABLE IF NOT EXISTS resources (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        category_id INTEGER NOT NULL REFERENCES resource_categories(id),
        subcategory_id INTEGER REFERENCES resource_subcategories(id),
        title TEXT NOT NULL,
        slug TEXT NOT NULL,
        description TEXT NOT NULL,
        content TEXT,
        thumbnail_url TEXT,
        external_url TEXT,
        download_url TEXT,
        file_size INTEGER,
        file_type TEXT,
        version TEXT,
        tags TEXT[],
        is_verified BOOLEAN NOT NULL DEFAULT false,
        is_public BOOLEAN NOT NULL DEFAULT true,
        is_featured BOOLEAN NOT NULL DEFAULT false,
        view_count INTEGER NOT NULL DEFAULT 0,
        download_count INTEGER NOT NULL DEFAULT 0,
        likes_count INTEGER NOT NULL DEFAULT 0,
        dislikes_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `);
    console.log("Tabla resources creada correctamente");
    
    // Crear tabla resource_comments
    console.log("Creando tabla de comentarios de recursos...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS resource_comments (
        id SERIAL PRIMARY KEY,
        resource_id INTEGER NOT NULL REFERENCES resources(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        parent_id INTEGER REFERENCES resource_comments(id),
        likes INTEGER NOT NULL DEFAULT 0,
        is_pinned BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `);
    console.log("Tabla resource_comments creada correctamente");
    
    // Crear tabla user_resource_collections
    console.log("Creando tabla de colecciones de recursos...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_resource_collections (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        description TEXT,
        is_public BOOLEAN NOT NULL DEFAULT false,
        icon TEXT,
        cover_image TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `);
    console.log("Tabla user_resource_collections creada correctamente");
    
    // Crear tabla user_resource_items
    console.log("Creando tabla de items de colecciones de recursos...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_resource_items (
        id SERIAL PRIMARY KEY,
        collection_id INTEGER NOT NULL REFERENCES user_resource_collections(id),
        resource_id INTEGER NOT NULL REFERENCES resources(id),
        order_index INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `);
    console.log("Tabla user_resource_items creada correctamente");
    
    // Crear tabla user_script_collections
    console.log("Creando tabla de colecciones de guiones...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_script_collections (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        description TEXT,
        cover_image TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `);
    console.log("Tabla user_script_collections creada correctamente");
    
    // Crear tabla user_scripts
    console.log("Creando tabla de guiones...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_scripts (
        id SERIAL PRIMARY KEY,
        collection_id INTEGER NOT NULL REFERENCES user_script_collections(id),
        video_idea_id INTEGER REFERENCES video_ideas(id),
        title TEXT NOT NULL,
        description TEXT,
        content TEXT,
        sections TEXT[],
        timings TEXT[],
        total_duration TEXT,
        version INTEGER NOT NULL DEFAULT 1,
        is_template BOOLEAN NOT NULL DEFAULT false,
        favorite BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `);
    console.log("Tabla user_scripts creada correctamente");
    
    console.log("Todas las tablas de recursos y sus relaciones han sido creadas correctamente");
    
  } catch (error) {
    console.error("Error creando tablas:", error);
  } finally {
    await pool.end();
  }
}

createResourceTables()
  .then(() => {
    console.log("Script finalizado con éxito");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error ejecutando script:", error);
    process.exit(1);
  });