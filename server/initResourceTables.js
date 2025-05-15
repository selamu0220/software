// Script para inicializar las tablas de recursos
require('dotenv').config();
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const { eq } = require('drizzle-orm');
const { resourceCategories, resourceSubcategories } = require('../dist/shared/schema');

// Establece la conexión con la base de datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Inicializa drizzle
const db = drizzle(pool);

// Categorías de recursos
const defaultCategories = [
  { name: 'IA', slug: 'ia', description: 'Herramientas y recursos de inteligencia artificial', iconName: 'Brain' },
  { name: 'Extensiones', slug: 'extensiones', description: 'Complementos para navegadores y aplicaciones', iconName: 'Puzzle' },
  { name: 'Software', slug: 'software', description: 'Programas y aplicaciones para creadores de contenido', iconName: 'LayoutGrid' },
  { name: 'Plugins', slug: 'plugins', description: 'Complementos para software de edición', iconName: 'PlugZap' }
];

// Subcategorías por cada categoría
const subcategoriesByCategory = {
  'ia': [
    { name: 'Generación de texto', slug: 'generacion-texto', description: 'Herramientas para crear texto con IA' },
    { name: 'Generación de imágenes', slug: 'generacion-imagenes', description: 'Herramientas para crear imágenes con IA' },
    { name: 'Asistentes virtuales', slug: 'asistentes-virtuales', description: 'Asistentes basados en IA' }
  ],
  'extensiones': [
    { name: 'Chrome', slug: 'chrome', description: 'Extensiones para Google Chrome' },
    { name: 'Firefox', slug: 'firefox', description: 'Extensiones para Mozilla Firefox' },
    { name: 'Edge', slug: 'edge', description: 'Extensiones para Microsoft Edge' }
  ],
  'software': [
    { name: 'Edición de vídeo', slug: 'edicion-video', description: 'Software para editar vídeos' },
    { name: 'Edición de audio', slug: 'edicion-audio', description: 'Software para editar audio' },
    { name: 'Diseño gráfico', slug: 'diseno-grafico', description: 'Software para diseño gráfico' }
  ],
  'plugins': [
    { name: 'Adobe Premiere', slug: 'adobe-premiere', description: 'Plugins para Adobe Premiere' },
    { name: 'Final Cut Pro', slug: 'final-cut-pro', description: 'Plugins para Final Cut Pro' },
    { name: 'DaVinci Resolve', slug: 'davinci-resolve', description: 'Plugins para DaVinci Resolve' }
  ]
};

async function initializeResourceTables() {
  console.log('Inicializando tablas de recursos...');

  try {
    // Crear tablas si no existen
    await pool.query(`
      CREATE TABLE IF NOT EXISTS resource_categories (
        id SERIAL PRIMARY KEY, 
        name TEXT NOT NULL UNIQUE, 
        slug TEXT NOT NULL UNIQUE, 
        description TEXT, 
        icon_name TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS resource_subcategories (
        id SERIAL PRIMARY KEY,
        category_id INTEGER NOT NULL REFERENCES resource_categories(id),
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS resources (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        category_id INTEGER NOT NULL REFERENCES resource_categories(id),
        subcategory_id INTEGER REFERENCES resource_subcategories(id),
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        content TEXT,
        file_path TEXT,
        image_path TEXT NOT NULL,
        external_link TEXT,
        version TEXT,
        tags TEXT[],
        download_count INTEGER DEFAULT 0,
        views_count INTEGER DEFAULT 0,
        likes_count INTEGER DEFAULT 0,
        dislikes_count INTEGER DEFAULT 0,
        is_public BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS resource_comments (
        id SERIAL PRIMARY KEY,
        resource_id INTEGER NOT NULL REFERENCES resources(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    console.log('Tablas creadas correctamente');

    // Insertar categorías por defecto
    for (const category of defaultCategories) {
      // Verificar si la categoría ya existe
      const existingCategory = await db.select().from(resourceCategories).where(eq(resourceCategories.slug, category.slug));
      
      if (existingCategory.length === 0) {
        console.log(`Insertando categoría: ${category.name}`);
        const [insertedCategory] = await db.insert(resourceCategories).values(category).returning();
        
        // Insertar subcategorías para esta categoría
        const subcategories = subcategoriesByCategory[category.slug] || [];
        for (const subcategory of subcategories) {
          console.log(`Insertando subcategoría: ${subcategory.name}`);
          await db.insert(resourceSubcategories).values({
            ...subcategory,
            categoryId: insertedCategory.id
          });
        }
      } else {
        console.log(`La categoría ${category.name} ya existe, omitiendo...`);
      }
    }

    console.log('Inicialización de tablas de recursos completada');
  } catch (error) {
    console.error('Error inicializando tablas de recursos:', error);
  } finally {
    await pool.end();
  }
}

initializeResourceTables();