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

    console.log('Tabla de categorías creada correctamente');

    // Insertar categorías directamente con SQL para evitar dependencias de Drizzle
    for (const category of defaultCategories) {
      try {
        console.log(`Intentando insertar categoría: ${category.name}`);
        
        const result = await pool.query(
          'INSERT INTO resource_categories (name, slug, description, icon_name) VALUES ($1, $2, $3, $4) ON CONFLICT (slug) DO NOTHING RETURNING id',
          [category.name, category.slug, category.description, category.iconName]
        );
        
        if (result.rows.length > 0) {
          console.log(`Categoría ${category.name} insertada correctamente con ID: ${result.rows[0].id}`);
        } else {
          console.log(`La categoría ${category.name} ya existe, omitiendo...`);
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