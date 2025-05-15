// Script para aplicar las tablas de recursos
import * as dotenv from 'dotenv';
dotenv.config();

// Importar y ejecutar la inicialización de tablas de recursos
import { initializeResourceTables } from './server/initResourceTables.js';

// Ejecutar la inicialización
initializeResourceTables();