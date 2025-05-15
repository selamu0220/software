// Script para inicializar las tablas de recursos
import pkg from 'pg';
const { Pool } = pkg;
import { eq } from 'drizzle-orm';

// Establece la conexión con la base de datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Acceder a la variable de entorno DATABASE_URL directamente
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Existe' : 'No existe');

// Categorías de recursos predefinidas para la inserción directa
const defaultCategories = [
  { name: 'IA', slug: 'ia', description: 'Herramientas y recursos de inteligencia artificial', iconName: 'Brain' },
  { name: 'Extensiones', slug: 'extensiones', description: 'Complementos para navegadores y aplicaciones', iconName: 'Puzzle' },
  { name: 'Software', slug: 'software', description: 'Programas y aplicaciones para creadores de contenido', iconName: 'LayoutGrid' },
  { name: 'Plugins', slug: 'plugins', description: 'Complementos para software de edición', iconName: 'PlugZap' }
];

// Subcategorías predefinidas por categoría
const defaultSubcategories = {
  'ia': [
    { name: 'Generadores de texto', slug: 'generadores-texto', description: 'Herramientas para generar texto con IA' },
    { name: 'Generadores de imágenes', slug: 'generadores-imagenes', description: 'Herramientas para crear imágenes con IA' },
    { name: 'Edición de video', slug: 'edicion-video-ia', description: 'IA para edición y procesamiento de video' },
    { name: 'Transcripción', slug: 'transcripcion', description: 'Convertir audio a texto mediante IA' }
  ],
  'extensiones': [
    { name: 'Chrome', slug: 'chrome', description: 'Extensiones para Google Chrome' },
    { name: 'Firefox', slug: 'firefox', description: 'Complementos para Mozilla Firefox' },
    { name: 'Edge', slug: 'edge', description: 'Extensiones para Microsoft Edge' },
    { name: 'Safari', slug: 'safari', description: 'Extensiones para Safari' }
  ],
  'software': [
    { name: 'Edición de video', slug: 'edicion-video', description: 'Software para editar videos' },
    { name: 'Diseño gráfico', slug: 'diseno-grafico', description: 'Programas para diseño y gráficos' },
    { name: 'Audio', slug: 'audio', description: 'Software para grabación y edición de audio' },
    { name: 'Streaming', slug: 'streaming', description: 'Programas para transmisiones en vivo' }
  ],
  'plugins': [
    { name: 'Adobe Premiere', slug: 'premiere', description: 'Plugins para Adobe Premiere Pro' },
    { name: 'After Effects', slug: 'after-effects', description: 'Plugins para Adobe After Effects' },
    { name: 'DaVinci Resolve', slug: 'davinci-resolve', description: 'Plugins para DaVinci Resolve' },
    { name: 'Final Cut Pro', slug: 'final-cut', description: 'Plugins para Final Cut Pro' }
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
    `);
    
    // Crear tabla de subcategorías si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS resource_subcategories (
        id SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES resource_categories(id) NOT NULL,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        description TEXT,
        icon_name TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        UNIQUE(category_id, slug)
      );
    `);

    console.log('Tablas de categorías y subcategorías creadas correctamente');

    // Insertar categorías directamente con SQL para evitar dependencias de Drizzle
    for (const category of defaultCategories) {
      try {
        console.log(`Intentando insertar categoría: ${category.name}`);
        
        const result = await pool.query(
          'INSERT INTO resource_categories (name, slug, description, icon_name) VALUES ($1, $2, $3, $4) ON CONFLICT (slug) DO NOTHING RETURNING id',
          [category.name, category.slug, category.description, category.iconName]
        );
        
        let categoryId;
        
        if (result.rows.length > 0) {
          categoryId = result.rows[0].id;
          console.log(`Categoría ${category.name} insertada correctamente con ID: ${categoryId}`);
        } else {
          // Si la categoría ya existe, obtener su ID
          const existingCategory = await pool.query(
            'SELECT id FROM resource_categories WHERE slug = $1',
            [category.slug]
          );
          
          if (existingCategory.rows.length > 0) {
            categoryId = existingCategory.rows[0].id;
            console.log(`Categoría ${category.name} ya existe con ID: ${categoryId}`);
          } else {
            console.error(`No se pudo obtener el ID para la categoría ${category.name}`);
            continue; // Saltarse las subcategorías si no se puede obtener el ID
          }
        }
        
        // Insertar subcategorías para esta categoría
        if (defaultSubcategories[category.slug] && categoryId) {
          for (const subcategory of defaultSubcategories[category.slug]) {
            try {
              console.log(`Intentando insertar subcategoría: ${subcategory.name} para categoría ${category.name}`);
              
              const subResult = await pool.query(
                'INSERT INTO resource_subcategories (category_id, name, slug, description) VALUES ($1, $2, $3, $4) ON CONFLICT (category_id, slug) DO NOTHING RETURNING id',
                [categoryId, subcategory.name, subcategory.slug, subcategory.description]
              );
              
              if (subResult.rows.length > 0) {
                console.log(`Subcategoría ${subcategory.name} insertada correctamente con ID: ${subResult.rows[0].id}`);
              } else {
                console.log(`Subcategoría ${subcategory.name} ya existe para categoría ${category.name}, omitiendo...`);
              }
            } catch (error) {
              console.error(`Error al insertar subcategoría ${subcategory.name}:`, error);
            }
          }
        }
      } catch (error) {
        console.error(`Error al insertar categoría ${category.name}:`, error);
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