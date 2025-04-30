import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configurar websockets para Neon DB
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL debe estar configurado. ¿Olvidaste aprovisionar una base de datos?",
  );
}

// Crear pool de conexiones
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Crear cliente Drizzle con el esquema
export const db = drizzle({ client: pool, schema });