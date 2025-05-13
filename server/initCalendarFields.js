// Script para agregar los campos notes y color a la tabla calendar_entries
import { Pool, neonConfig } from '@neondatabase/serverless';
import { WebSocket } from 'ws';

// Configuración de la base de datos
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL debe estar configurado en las variables de entorno');
}

// Configurar WebSocket para Neon
neonConfig.webSocketConstructor = WebSocket;

async function addCalendarFields() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('Conectando a la base de datos...');
    
    // Iniciar transacción
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      console.log('Verificando si las columnas existen...');
      
      // Verificar si la columna notes ya existe
      const checkNotesResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'calendar_entries' AND column_name = 'notes'
      `);
      
      // Verificar si la columna color ya existe
      const checkColorResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'calendar_entries' AND column_name = 'color'
      `);
      
      // Agregar columna notes si no existe
      if (checkNotesResult.rowCount === 0) {
        console.log('Agregando columna notes...');
        await client.query(`
          ALTER TABLE calendar_entries
          ADD COLUMN notes TEXT
        `);
        console.log('Columna notes agregada exitosamente.');
      } else {
        console.log('La columna notes ya existe.');
      }
      
      // Agregar columna color si no existe
      if (checkColorResult.rowCount === 0) {
        console.log('Agregando columna color...');
        await client.query(`
          ALTER TABLE calendar_entries
          ADD COLUMN color TEXT DEFAULT '#3b82f6'
        `);
        console.log('Columna color agregada exitosamente.');
      } else {
        console.log('La columna color ya existe.');
      }
      
      // Confirmar cambios
      await client.query('COMMIT');
      console.log('Operación completada con éxito.');
      
    } catch (error) {
      // Revertir cambios en caso de error
      await client.query('ROLLBACK');
      console.error('Error al modificar la tabla:', error);
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error de conexión:', error);
  } finally {
    await pool.end();
  }
}

// Ejecutar la función principal
addCalendarFields().catch(console.error);