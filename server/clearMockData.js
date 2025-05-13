// Script para eliminar todos los recursos de muestra
// Este script se ejecuta una vez para limpiar los datos de muestra
// y permitir que solo se muestren recursos subidos por usuarios reales

import { Pool, neonConfig } from '@neondatabase/serverless';
import { WebSocket } from 'ws';

// Configuración de la base de datos
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL debe estar configurado en las variables de entorno');
}

// Configurar WebSocket para Neon
neonConfig.webSocketConstructor = WebSocket;

async function clearMockData() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('Conectando a la base de datos...');
    
    // Iniciar transacción
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      console.log('Eliminando recursos de muestra...');
      
      // Verificar si la tabla existe antes de intentar eliminar
      const checkResourcesTable = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'resources'
        );
      `);
      
      if (checkResourcesTable.rows[0].exists) {
        // Eliminar recursos
        const deleteResourcesResult = await client.query(`
          DELETE FROM resources
          WHERE user_id != (SELECT id FROM users WHERE username = 'sela_gr')
          RETURNING id
        `);
        console.log(`Eliminados ${deleteResourcesResult.rowCount} recursos de muestra`);
      } else {
        console.log('La tabla de recursos no existe todavía.');
      }
      
      // Confirmar cambios
      await client.query('COMMIT');
      console.log('Operación completada con éxito.');
      
    } catch (error) {
      // Revertir cambios en caso de error
      await client.query('ROLLBACK');
      console.error('Error al limpiar datos:', error);
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
clearMockData().catch(console.error);