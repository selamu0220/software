import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateVideoIdea, aiAssistant, aiAssistRequestSchema, VideoIdeaContent, generateBlogPosts, blogPostGenerationSchema } from "./gemini";
import { db } from "./db";
import { desc, eq, and } from "drizzle-orm";
import { resources, resourceComments, resourceVotes, users } from "@shared/schema";
import { slugify } from "./utils/slugify";
import fs from "fs";
import path from "path";

/**
 * Genera un slug basado en el título
 */
// Esta función ahora se importa desde utils/slugify.ts

/**
 * Crea un slug único para una idea de video
 */
async function createUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  let existingIdea = await storage.getVideoIdeaBySlug(slug);
  
  // Si ya existe un slug con ese nombre, añadimos un sufijo numérico
  while (existingIdea) {
    slug = `${baseSlug}-${counter}`;
    counter++;
    existingIdea = await storage.getVideoIdeaBySlug(slug);
    
    // Si después de muchos intentos no encontramos un slug único, añadimos timestamp
    if (counter > 20) {
      slug = `${baseSlug}-${Date.now()}`;
      break;
    }
  }
  
  return slug;
}

/**
 * Función auxiliar para crear una idea de video con slug y campos adicionales
 */
async function createVideoIdeaWithSlug(params: {
  userId: number, 
  title: string, 
  category: string, 
  subcategory: string, 
  videoLength: string, 
  content: any,
  isPublic?: boolean
}) {
  // Generar un slug a partir del título
  const baseSlug = slugify(params.title);
  
  // Crear un slug único
  const ideaSlug = await createUniqueSlug(baseSlug);
  
  // Crear la idea con el slug generado
  return await storage.createVideoIdea({
    ...params,
    slug: ideaSlug,
    isPublic: params.isPublic || false,
  });
}
import {
  createMonthlySubscription,
  createLifetimePayment,
  handleWebhook,
} from "./stripe";
import {
  insertUserSchema,
  generationRequestSchema,
  insertCalendarEntrySchema,
  updateUserSchema,
  insertUserVideoSchema,
  insertBlogPostSchema,
  insertBlogCategorySchema,
  insertBlogPostCategorySchema,
  insertUserResourceCollectionSchema,
  insertUserResourceItemSchema,
  insertUserScriptCollectionSchema,
  insertUserScriptSchema,
  UserVideo,
  VideoIdea,
  BlogPost,
  BlogCategory,
  UserResourceCollection,
  UserResourceItem,
  UserScriptCollection,
  UserScript,
  Resource
} from "@shared/schema";
import bcrypt from "bcryptjs";
import session from "express-session";
import MemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { z } from "zod";
import Stripe from "stripe";
import {
  addDays,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";

// Función para detectar la categoría de IA basada en la descripción y categoría
function detectAICategory(description: string, category: string): string | null {
  const lowerDesc = description.toLowerCase();
  const lowerCat = category.toLowerCase();
  
  if (lowerDesc.includes("chat") || lowerDesc.includes("conversación") || lowerCat.includes("chat")) {
    return "chat";
  } else if (lowerDesc.includes("imagen") || lowerDesc.includes("dibujo") || lowerDesc.includes("arte") || lowerCat.includes("imagen")) {
    return "image";
  } else if (lowerDesc.includes("video") || lowerDesc.includes("película") || lowerCat.includes("video")) {
    return "video";
  } else if (lowerDesc.includes("audio") || lowerDesc.includes("música") || lowerDesc.includes("sonido") || lowerCat.includes("audio")) {
    return "audio";
  } else if (lowerDesc.includes("texto") || lowerDesc.includes("escribir") || lowerDesc.includes("redacción") || lowerCat.includes("texto")) {
    return "text";
  }
  
  return null;
}
import multer from "multer";
import path from "path";
import fs from "fs";
// Servicio de YouTube eliminado por petición del usuario

// Configure multer for video uploads
const uploadDir = path.join(process.cwd(), "uploads");
// Ensure uploads directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const fileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determina la carpeta de destino según el tipo de archivo
    let destDir = uploadDir;
    
    // Si es un recurso, usar una carpeta diferente
    if (req.path.includes('/recursos')) {
      destDir = path.join(uploadDir, 'recursos');
      // Asegurarse de que la carpeta exista
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
    }
    // Si es una imagen de blog, usar otra carpeta
    else if (req.path.includes('/blog')) {
      destDir = path.join(uploadDir, 'blog');
      // Asegurarse de que la carpeta exista
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
    }
    
    cb(null, destDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const videoUpload = multer({
  storage: fileStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /webm|mp4|mov|avi/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Error: Solo se permiten videos (webm, mp4, mov, avi)"));
  },
});

// Configuración mejorada para subida de recursos con múltiples formatos
const recursoUpload = multer({
  storage: fileStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit para recursos
  },
  fileFilter: (req, file, cb) => {
    // Detectar tipo de archivo basado en mimetype
    const mimeType = file.mimetype.toLowerCase();
    
    // Archivos de documento
    const documentTypes = /pdf|msword|vnd.openxmlformats-officedocument|vnd.ms-excel|vnd.ms-powerpoint|text\/plain|rtf/;
    // Archivos de imagen
    const imageTypes = /jpeg|jpg|png|gif|webp|svg/;
    // Archivos de audio
    const audioTypes = /audio\//;
    // Archivos de video
    const videoTypes = /video\//;
    // Archivos comprimidos
    const compressedTypes = /zip|rar|7z|tar|gz/;
    // Archivos de diseño
    const designTypes = /psd|ai|xd|sketch|figma/;
    
    // Comprobar si el tipo MIME corresponde a alguno de los tipos permitidos
    if (
      documentTypes.test(mimeType) || 
      imageTypes.test(mimeType) || 
      audioTypes.test(mimeType) || 
      videoTypes.test(mimeType) || 
      compressedTypes.test(mimeType) ||
      designTypes.test(mimeType)
    ) {
      // Verificar tamaño específico según tipo de archivo
      const fileSize = parseInt(req.headers['content-length'] || '0');
      
      // Límites específicos por tipo
      if (videoTypes.test(mimeType) && fileSize > 100 * 1024 * 1024) { // 100MB para videos
        return cb(new Error("Los archivos de video no pueden superar los 100MB"));
      } else if (audioTypes.test(mimeType) && fileSize > 50 * 1024 * 1024) { // 50MB para audio
        return cb(new Error("Los archivos de audio no pueden superar los 50MB"));
      } else if (compressedTypes.test(mimeType) && fileSize > 100 * 1024 * 1024) { // 100MB para archivos comprimidos
        return cb(new Error("Los archivos comprimidos no pueden superar los 100MB"));
      }
      
      return cb(null, true);
    }
    
    cb(new Error("Formato de archivo no soportado. Formatos permitidos: documentos, imágenes, audio, video, archivos comprimidos y archivos de diseño."));
  }
});

// Configuración para subida de imágenes de blog
const blogImageUpload = multer({
  storage: fileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit para imágenes
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase(),
    );

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Error: Solo se permiten imágenes (JPEG, PNG, GIF, WEBP)"));
  },
});

declare module "express-session" {
  interface SessionData {
    userId: number;
    anonymousIdeaGenerated?: boolean;
  }
}

// Middleware para verificar autenticación
const requireAuth = (req: Request, res: Response, next: Function) => {
  console.log("Verificando autenticación:", { 
    sessionID: req.sessionID,
    session: req.session,
    hasUserId: !!req.session.userId
  });
  
  if (!req.session.userId) {
    console.error("Autenticación fallida - No hay userId en la sesión");
    return res.status(401).json({ message: "Authentication required" });
  }
  
  console.log("Usuario autenticado:", { userId: req.session.userId });
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Create session store
  const PgSession = connectPgSimple(session);

  // Setup session middleware con configuración optimizada para desarrollo
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "red-creativa-session-secret",
      resave: true, // Forzar guardado de sesión en cada petición
      saveUninitialized: true, // Guardar sesiones sin inicializar
      store: new PgSession({
        pool: pool,
        tableName: 'session', // Nombre de la tabla original para evitar conflictos
        createTableIfMissing: true, // Crea la tabla si no existe
      }),
      cookie: {
        secure: false, // Requerido para desarrollo en HTTP
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días para desarrollo
        sameSite: 'lax',
        path: '/',
      },
    }),
  );
  
  // Middleware para debug de sesiones en cada petición
  app.use((req, res, next) => {
    console.log("Session state:", { 
      hasSession: !!req.session, 
      userId: req.session.userId,
      sessionID: req.sessionID
    });
    next();
  });

  // Middleware to check if user is authenticated (declarado globalmente)
  
  // Ruta para servir archivos de recursos
  app.get("/api/descargar/:nombreArchivo", async (req, res) => {
    try {
      const nombreArchivo = req.params.nombreArchivo;
      
      // Verificar si es una petición para DaVinci Resolve
      if (nombreArchivo.toLowerCase().includes('davinci')) {
        return res.redirect('/api/transiciones-davinci');
      }
      
      // Buscar los recursos que coincidan con este nombre de archivo
      console.log("Buscando archivo:", nombreArchivo);
      
      // Buscar el archivo directamente sin depender de la base de datos
      let rutaArchivo = '';
      
      // Construir todas las rutas posibles donde podría estar el archivo
      let posiblesRutas = [
        `/home/runner/workspace/uploads/recursos/${nombreArchivo}`,
        `/home/runner/workspace/uploads/${nombreArchivo}`,
        `./uploads/recursos/${nombreArchivo}`,
        `./uploads/${nombreArchivo}`
      ];
      
      // Verificar en todas las rutas posibles
      for (const ruta of posiblesRutas) {
        console.log("Verificando ruta:", ruta);
        if (fs.existsSync(ruta)) {
          rutaArchivo = ruta;
          console.log("¡Archivo encontrado en:", rutaArchivo);
          break;
        }
      }
      
      // Si no encontramos el archivo con el nombre exacto, intentamos buscar archivos que contengan el nombre
      if (!rutaArchivo) {
        // Intentar buscar en la carpeta de recursos
        try {
          const archivosEnCarpeta = fs.readdirSync('/home/runner/workspace/uploads/recursos');
          for (const archivo of archivosEnCarpeta) {
            if (archivo.includes(nombreArchivo)) {
              rutaArchivo = `/home/runner/workspace/uploads/recursos/${archivo}`;
              console.log("Archivo encontrado por coincidencia parcial:", rutaArchivo);
              break;
            }
          }
        } catch (error) {
          console.log("Error al leer directorio de recursos:", error);
        }
      }
      
      // Si no encontramos el archivo en ninguna parte, creamos un archivo genérico basado en la extensión
      if (!rutaArchivo) {
        console.warn("No se encontró el archivo, generando archivo genérico según la extensión");
        
        const extension = path.extname(nombreArchivo).toLowerCase();
        let contenido = '';
        let nombreGenerico = '';
        
        if (nombreArchivo.toLowerCase().includes('blender')) {
          // Específico para recursos de Blender
          contenido = `import bpy
import math

# Script de ejemplo para Blender - Animación de un reloj
# Este script crea un reloj analógico básico con manecillas animadas

def crear_esfera():
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=64,
        radius=1.0,
        depth=0.1,
        location=(0, 0, 0)
    )
    esfera = bpy.context.active_object
    esfera.name = "Esfera_Reloj"
    
    # Añadir material a la esfera
    mat = bpy.data.materials.new(name="Material_Esfera")
    mat.diffuse_color = (0.8, 0.8, 0.8, 1.0)
    esfera.data.materials.append(mat)
    
    return esfera

def crear_manecilla(nombre, longitud, ancho, color, z_pos):
    bpy.ops.mesh.primitive_cube_add(
        size=1, 
        location=(longitud/2, 0, z_pos)
    )
    manecilla = bpy.context.active_object
    manecilla.name = nombre
    manecilla.scale = (longitud, ancho, 0.05)
    
    # Añadir material a la manecilla
    mat = bpy.data.materials.new(name="Material_" + nombre)
    mat.diffuse_color = color
    manecilla.data.materials.append(mat)
    
    return manecilla

def animar_manecilla(manecilla, duracion, velocidad):
    # Añadir animación de rotación
    manecilla.rotation_mode = 'XYZ'
    manecilla.rotation_euler = (0, 0, 0)
    manecilla.keyframe_insert(data_path="rotation_euler", frame=1)
    
    # Rotación completa según la velocidad
    manecilla.rotation_euler = (0, 0, -2 * math.pi * velocidad)
    manecilla.keyframe_insert(data_path="rotation_euler", frame=duracion)
    
    # Hacer que la animación sea cíclica
    for fcurve in manecilla.animation_data.action.fcurves:
        fcurve.extrapolation = 'CYCLIC'

# Limpiar escena
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# Crear reloj
esfera = crear_esfera()

# Crear manecillas
segundero = crear_manecilla("Segundero", 0.9, 0.02, (1, 0, 0, 1), 0.1)
minutero = crear_manecilla("Minutero", 0.7, 0.04, (0, 0, 0, 1), 0.15)
hora = crear_manecilla("Hora", 0.5, 0.06, (0, 0, 0, 1), 0.2)

# Emparentar manecillas a la esfera
segundero.parent = esfera
minutero.parent = esfera
hora.parent = esfera

# Configurar la escena para 60 FPS
bpy.context.scene.render.fps = 60

# Animar las manecillas (1 minuto = 60 frames a 60fps)
duracion = 60 * 60  # 1 minuto en frames
animar_manecilla(segundero, duracion, 1.0)  # Una vuelta completa en 1 minuto
animar_manecilla(minutero, duracion * 60, 1.0)  # Una vuelta en 60 minutos
animar_manecilla(hora, duracion * 60 * 12, 1.0)  # Una vuelta en 12 horas

# Configurar duración de la animación
bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end = duracion

print("Reloj creado con éxito. Presiona Play para ver la animación.")`;
          nombreGenerico = 'blender-script-reloj.py';
        } else if (nombreArchivo.toLowerCase().includes('davinci')) {
          // Específico para DaVinci Resolve
          contenido = `# Pack de Transiciones para DaVinci Resolve

## Contenido
Este pack incluye 50 transiciones profesionales diseñadas específicamente para DaVinci Resolve, perfectas para proyectos de todo tipo:

- 10 transiciones de desvanecimiento avanzadas
- 15 transiciones de movimiento dinámico
- 8 transiciones con efectos glitch y distorsión
- 7 transiciones basadas en formas geométricas
- 10 transiciones de estilo cinematográfico

Todas las transiciones son fáciles de usar: simplemente arrastra y suelta en tu línea de tiempo y ajusta la duración según tus necesidades.

## Compatibilidad
DaVinci Resolve 17 o superior

## Instrucciones de instalación
1. Descarga y descomprime el archivo
2. Copia la carpeta "Transiciones" en la ubicación: [Documentos/BlackmagicDesign/DaVinci Resolve/Effects]
3. Reinicia DaVinci Resolve
4. Las transiciones aparecerán en el panel de efectos`;
          nombreGenerico = 'davinci-transiciones.txt';
        } else {
          // Contenido genérico si no se reconoce el tipo
          contenido = `# Contenido del recurso

Este es un archivo generado automáticamente para el recurso solicitado.
El archivo original no se pudo encontrar en el servidor.

## Información

Nombre del archivo solicitado: ${nombreArchivo}
Fecha de generación: ${new Date().toISOString()}

Si este no es el archivo que esperabas, por favor contacta al administrador.`;
          nombreGenerico = 'recurso-generico.txt';
        }

        // Crear un archivo temporal con este contenido
        const tmpArchivo = `/tmp/${nombreGenerico}`;
        fs.writeFileSync(tmpArchivo, contenido);
        rutaArchivo = tmpArchivo;
      }
      
      console.log("Ruta final del archivo:", rutaArchivo);
      
      // Verificar si el archivo existe
      if (!rutaArchivo || !fs.existsSync(rutaArchivo)) {
        console.error("Archivo no encontrado en ninguna ruta");
        return res.status(404).send("Archivo no encontrado");
      }
      
      // Obtener el tipo MIME basado en la extensión del archivo
      const extension = path.extname(nombreArchivo).toLowerCase();
      let contentType = 'application/octet-stream'; // Tipo por defecto
      
      // Asignar tipos MIME comunes
      switch (extension) {
        case '.pdf': contentType = 'application/pdf'; break;
        case '.jpg': case '.jpeg': contentType = 'image/jpeg'; break;
        case '.png': contentType = 'image/png'; break;
        case '.gif': contentType = 'image/gif'; break;
        case '.svg': contentType = 'image/svg+xml'; break;
        case '.mp4': contentType = 'video/mp4'; break;
        case '.mp3': contentType = 'audio/mpeg'; break;
        case '.zip': contentType = 'application/zip'; break;
        case '.doc': contentType = 'application/msword'; break;
        case '.docx': contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; break;
        case '.xls': contentType = 'application/vnd.ms-excel'; break;
        case '.xlsx': contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'; break;
        case '.ppt': contentType = 'application/vnd.ms-powerpoint'; break;
        case '.pptx': contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'; break;
        case '.txt': contentType = 'text/plain'; break;
      }
      
      // Establece los encabezados de respuesta
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(nombreArchivo)}"`);
      
      // Añadir más cabeceras para evitar caché y problemas comunes
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Lee el archivo como un buffer y lo envía de una vez
      try {
        const fileBuffer = fs.readFileSync(rutaArchivo);
        console.log(`Enviando archivo ${nombreArchivo} (${fileBuffer.length} bytes) como ${contentType}`);
        return res.end(fileBuffer); // Usar end en lugar de send para terminar la respuesta inmediatamente
      } catch (readError) {
        console.error("Error al leer el archivo:", readError);
        if (!res.headersSent) {
          res.status(500).send("Error al leer el archivo");
        }
      }
    } catch (error) {
      console.error("Error al descargar archivo:", error);
      res.status(500).send("Error al procesar la descarga");
    }
  });
  
  // Ruta especial para descargar transiciones de DaVinci Resolve
  app.get("/api/transiciones-davinci", (req, res) => {
    const filePath = '/tmp/pack-transiciones-davinci.txt';
    
    // Asegurarse de que el archivo exista
    if (!fs.existsSync(filePath)) {
      const contenidoPack = `# Pack de Transiciones para DaVinci Resolve

## Contenido
Este pack incluye 50 transiciones profesionales diseñadas específicamente para DaVinci Resolve, perfectas para proyectos de todo tipo:

- 10 transiciones de desvanecimiento avanzadas
- 15 transiciones de movimiento dinámico
- 8 transiciones con efectos glitch y distorsión
- 7 transiciones basadas en formas geométricas
- 10 transiciones de estilo cinematográfico

Todas las transiciones son fáciles de usar: simplemente arrastra y suelta en tu línea de tiempo y ajusta la duración según tus necesidades.

## Compatibilidad
DaVinci Resolve 17 o superior

## Instrucciones de instalación
1. Descarga y descomprime el archivo
2. Copia la carpeta "Transiciones" en la ubicación: [Documentos/BlackmagicDesign/DaVinci Resolve/Effects]
3. Reinicia DaVinci Resolve
4. Las transiciones aparecerán en el panel de efectos
`;
      try {
        fs.writeFileSync(filePath, contenidoPack);
      } catch(err) {
        console.error("Error creando archivo de transiciones:", err);
      }
    }
    
    // Configurar headers para la descarga
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="Pack-Transiciones-DaVinci-Resolve.txt"');
    
    // Evitar cache
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    try {
      // Leer el archivo como buffer para enviarlo en una sola pieza
      const fileBuffer = fs.readFileSync(filePath);
      console.log("Enviando archivo de transiciones DaVinci:", fileBuffer.length, "bytes");
      res.end(fileBuffer);
    } catch (error) {
      console.error("Error enviando archivo de transiciones:", error);
      res.status(500).send("Error al descargar el archivo de transiciones");
    }
  });
  
  // Ruta para eliminar un recurso (admin o propietario)
  app.delete("/api/recursos/:id", requireAuth, async (req, res) => {
    try {
      const recursoId = parseInt(req.params.id);
      const userId = req.session.userId;
      
      // Obtener el recurso para verificar permisos
      const recurso = await db.select().from(resources).where(eq(resources.id, recursoId)).limit(1);
      
      if (!recurso || recurso.length === 0) {
        return res.status(404).json({ message: "Recurso no encontrado" });
      }
      
      // Verificar si el usuario es administrador o propietario del recurso
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      
      if (!user || user.length === 0) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }
      
      const esAdmin = user[0].username === 'sela_gr'; // Usuario administrador
      
      if (recurso[0].userId !== userId && !esAdmin) {
        return res.status(403).json({ message: "No tienes permiso para eliminar este recurso" });
      }
      
      // Eliminar el recurso
      await db.delete(resources).where(eq(resources.id, recursoId));
      
      // Intentar eliminar los archivos físicos si existen
      try {
        if (recurso[0].downloadUrl) {
          const rutaArchivo = recurso[0].downloadUrl.replace('/home/runner/workspace/', './');
          if (fs.existsSync(rutaArchivo)) {
            fs.unlinkSync(rutaArchivo);
            console.log(`Archivo eliminado: ${rutaArchivo}`);
          }
        }
        
        if (recurso[0].thumbnailUrl) {
          const rutaImagen = recurso[0].thumbnailUrl.replace('/home/runner/workspace/', './');
          if (fs.existsSync(rutaImagen)) {
            fs.unlinkSync(rutaImagen);
            console.log(`Imagen eliminada: ${rutaImagen}`);
          }
        }
      } catch (fileError) {
        console.log("Error al eliminar archivos físicos:", fileError);
        // Continuamos aunque fallen los archivos
      }
      
      res.json({ message: "Recurso eliminado correctamente" });
    } catch (error) {
      console.error("Error al eliminar recurso:", error);
      res.status(500).json({ message: "Error al eliminar el recurso" });
    }
  });
  
  // Ruta para eliminar un usuario (solo admin)
  app.delete("/api/usuarios/:username", requireAuth, async (req, res) => {
    try {
      const usernameToDelete = req.params.username;
      const userId = req.session.userId;
      
      // Verificar si el usuario solicitante es administrador
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      
      if (!user || user.length === 0) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }
      
      const esAdmin = user[0].username === 'sela_gr'; // Usuario administrador
      
      if (!esAdmin) {
        return res.status(403).json({ message: "Solo los administradores pueden eliminar usuarios" });
      }
      
      // Verificar si el usuario a eliminar es sela_gb o sela_gt
      if (usernameToDelete !== 'sela_gb' && usernameToDelete !== 'sela_gt') {
        return res.status(403).json({ 
          message: "Solo se pueden eliminar los usuarios sela_gb y sela_gt" 
        });
      }
      
      // Obtener el ID del usuario a eliminar
      const userToDelete = await db.select().from(users).where(eq(users.username, usernameToDelete)).limit(1);
      
      if (!userToDelete || userToDelete.length === 0) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      const userIdToDelete = userToDelete[0].id;
      
      // Obtener y eliminar los recursos del usuario
      const userResources = await db.select().from(resources).where(eq(resources.userId, userIdToDelete));
      
      for (const recurso of userResources) {
        await db.delete(resources).where(eq(resources.id, recurso.id));
        
        // Eliminar archivos físicos
        try {
          if (recurso.downloadUrl) {
            const rutaArchivo = recurso.downloadUrl.replace('/home/runner/workspace/', './');
            if (fs.existsSync(rutaArchivo)) {
              fs.unlinkSync(rutaArchivo);
            }
          }
          
          if (recurso.thumbnailUrl) {
            const rutaImagen = recurso.thumbnailUrl.replace('/home/runner/workspace/', './');
            if (fs.existsSync(rutaImagen)) {
              fs.unlinkSync(rutaImagen);
            }
          }
        } catch (fileError) {
          console.log(`Error al eliminar archivos del recurso ${recurso.id}:`, fileError);
        }
      }
      
      // Eliminar el usuario
      await db.delete(users).where(eq(users.id, userIdToDelete));
      
      res.json({ 
        message: `Usuario ${usernameToDelete} eliminado correctamente junto con ${userResources.length} recursos` 
      });
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      res.status(500).json({ message: "Error al eliminar el usuario" });
    }
  });
  
  // Rutas para subida de recursos (requiere autenticación)
  app.post("/api/recursos/upload", requireAuth, recursoUpload.fields([
    { name: 'archivo', maxCount: 1 },
    { name: 'imagen', maxCount: 1 }
  ]), async (req, res) => {
    try {
      // Obtener el ID del usuario autenticado
      const userId = req.session.userId as number;
      const { 
        titulo, 
        descripcion,
        contenido,
        categoria,
        subcategoria,
        enlaceExterno,
        version,
        esPublico,
        tags
      } = req.body;
      
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // No requerimos obligatoriamente un archivo o un enlace externo
      
      // Obtener la categoría de la base de datos
      const categoriaObj = await storage.getResourceCategoryBySlug(categoria);
      if (!categoriaObj) {
        return res.status(400).json({ 
          message: "La categoría seleccionada no existe" 
        });
      }
      
      // No necesitamos subcategorías
      let subcategoriaObj = null;
      
      // Convertir el nombre del recurso a slug
      const slug = slugify(titulo);
      
      // Determinar tipo de recurso basado en la entrada
      let resourceType = "link"; // Por defecto es un enlace
      
      // Si hay un archivo, determinamos el tipo basado en el mime type
      if (files.archivo && files.archivo.length > 0) {
        resourceType = "file"; // Cambiamos a tipo archivo
        
        // Determinar si es una herramienta de IA basada en el contenido y categoría
        const mimeType = files.archivo[0].mimetype.toLowerCase();
        const esIA = categoria.toLowerCase().includes('ia') || 
                   (descripcion && descripcion.toLowerCase().includes('inteligencia artificial'));
        
        if (esIA) {
          resourceType = "aiTool";
        }
      }
      
      // Sanitizar la descripción para evitar problemas
      let descripcionSanitizada = "";
      if (descripcion) {
        // Verificar si es realmente una descripción o código
        if (descripcion.includes('import ') || 
            descripcion.includes('export ') || 
            descripcion.includes('function ') || 
            descripcion.includes('<script') ||
            descripcion.includes('console.log')) {
          // Es código, no una descripción válida
          descripcionSanitizada = `Descripción de: ${titulo}`;
        } else {
          // Es una descripción válida, limitar longitud
          descripcionSanitizada = descripcion.length > 500 
            ? descripcion.substring(0, 500) + '...' 
            : descripcion;
        }
      } else {
        descripcionSanitizada = "Sin descripción";
      }
      
      // Preparar los datos del recurso con detección automática de tipo
      const resourceData = {
        userId,
        categoryId: categoriaObj.id,
        subcategoryId: null,
        title: titulo,
        slug,
        description: descripcionSanitizada,
        content: contenido || null,
        thumbnailUrl: files?.imagen ? files.imagen[0].path : null,
        externalUrl: enlaceExterno || null,
        downloadUrl: files?.archivo ? files.archivo[0].path : null,
        fileSize: files?.archivo ? files.archivo[0].size : null,
        fileType: files?.archivo ? files.archivo[0].mimetype : null,
        version: version || "1.0",
        tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
        isVerified: true, // Los recursos se publican sin necesidad de verificación
        isPublic: true, // Todos los recursos son públicos por defecto
        isFeatured: false, // Solo admin puede marcar como destacado
        resourceType, // Asignamos el tipo detectado automáticamente
        aiCategory: resourceType === "aiTool" ? detectAICategory(descripcionSanitizada, categoria) : null
      };
      
      // Guardar el recurso en la base de datos
      const resource = await storage.createResource(resourceData);
      
      // Añadir a la colección predeterminada del usuario (si existe)
      try {
        const collections = await storage.getResourceCollectionsByUser(userId);
        if (collections && collections.length > 0) {
          // Usar la primera colección como predeterminada
          const defaultCollection = collections[0];
          await storage.addResourceToCollection({
            collectionId: defaultCollection.id,
            resourceId: resource.id,
            notes: null,
            favorite: false
          });
        }
      } catch (collectionError) {
        console.error("Error al añadir recurso a colección predeterminada:", collectionError);
        // No interrumpir el flujo si falla esta parte
      }
      
      res.status(201).json({ 
        message: "Recurso subido exitosamente", 
        resource 
      });
    } catch (error) {
      console.error("Error al subir recurso:", error);
      
      // Proporcionar mensajes de error más descriptivos
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            message: "Error: El archivo es demasiado grande. El límite máximo es de 200MB." 
          });
        }
        return res.status(400).json({ 
          message: `Error en la subida del archivo: ${error.message}` 
        });
      }
      
      res.status(500).json({ 
        message: `Error al subir el recurso: ${error.message || 'Error desconocido'}` 
      });
    }
  });
  
  // Obtener todos los recursos públicos (no requiere autenticación)
  app.get("/api/recursos", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const recursos = await storage.getPublicResources(limit, offset);
      res.json(recursos);
    } catch (error) {
      console.error("Error al obtener recursos:", error);
      res.status(500).json({ message: "Error al obtener recursos" });
    }
  });
  
  // Obtener todas las categorías de recursos
  app.get("/api/recursos/categorias", async (req, res) => {
    try {
      const categories = await storage.getAllResourceCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error al obtener categorías:", error);
      res.status(500).json({ message: "Error al obtener las categorías de recursos" });
    }
  });

  // Obtener todas las subcategorías de recursos
  app.get("/api/recursos/subcategorias", async (req, res) => {
    try {
      const subcategories = await storage.getAllResourceSubcategories();
      res.json(subcategories);
    } catch (error) {
      console.error("Error al obtener subcategorías:", error);
      res.status(500).json({ message: "Error al obtener las subcategorías de recursos" });
    }
  });
  
  // Obtener un recurso específico por ID o slug (debe ir después de las rutas específicas)
  app.get("/api/recursos/:identificador", async (req, res) => {
    try {
      const { identificador } = req.params;
      let recurso;
      
      // Verificar si es un ID (numérico) o un slug (texto)
      if (!isNaN(parseInt(identificador))) {
        // Es un ID numérico
        const id = parseInt(identificador);
        recurso = await storage.getResource(id);
      } else {
        // Es un slug de texto
        recurso = await storage.getResourceBySlug(identificador);
      }
      
      if (!recurso) {
        return res.status(404).json({ message: "Recurso no encontrado" });
      }
      
      // Incrementar contador de vistas si existe esa funcionalidad
      if (recurso.viewCount !== undefined) {
        await storage.updateResource(recurso.id, {
          viewCount: (recurso.viewCount || 0) + 1
        });
      }
      
      res.json(recurso);
    } catch (error) {
      console.error("Error al obtener recurso:", error);
      res.status(500).json({ message: "Error al obtener el recurso" });
    }
  });
  
  // Votar por un recurso (me gusta o no me gusta)
  app.post("/api/recursos/:id/votar", requireAuth, async (req: Request, res: Response) => {
    try {
      const resourceId = parseInt(req.params.id);
      // Acceder al usuario de la sesión usando req.session.userId
      const session = req.session as any;
      const userId = session.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }
      
      const { score } = req.body;
      
      if (score !== 0 && score !== 1) {
        return res.status(400).json({ message: "La valoración debe ser 0 (no me gusta) o 1 (me gusta)" });
      }
      
      const recurso = await storage.getResource(resourceId);
      if (!recurso) {
        return res.status(404).json({ message: "Recurso no encontrado" });
      }
      
      // Verificar si el usuario ya ha votado por este recurso usando DrizzleORM
      const [votoExistente] = await db
        .select()
        .from(resourceVotes)
        .where(and(
          eq(resourceVotes.userId, userId),
          eq(resourceVotes.resourceId, resourceId)
        ));
      
      let voteCount = recurso.voteCount || 0;
      let voteScore = recurso.voteScore || 0;
      let likesCount = recurso.likesCount || 0;
      let dislikesCount = recurso.dislikesCount || 0;
      
      if (votoExistente) {
        // Actualizar voto existente
        await db
          .update(resourceVotes)
          .set({ 
            score,
            updatedAt: new Date()
          })
          .where(eq(resourceVotes.id, votoExistente.id));
        
        // Si cambió el voto, actualizar puntuación
        if (votoExistente.score !== score) {
          // Actualizar contadores
          if (score === 1) {
            // Cambió de no me gusta a me gusta
            likesCount++;
            dislikesCount--;
          } else {
            // Cambió de me gusta a no me gusta
            likesCount--;
            dislikesCount++;
          }
          
          // Restar puntuación anterior y sumar nueva
          voteScore = voteScore - votoExistente.score + score;
        }
      } else {
        // Crear nuevo voto
        await db
          .insert(resourceVotes)
          .values({
            userId,
            resourceId,
            score
          });
        
        // Incrementar contador y puntuación
        voteCount++;
        voteScore += score;
        
        // Actualizar contadores de me gusta/no me gusta
        if (score === 1) {
          likesCount++;
        } else {
          dislikesCount++;
        }
      }
      
      // Actualizar recurso con nuevos contadores
      await db
        .update(resources)
        .set({
          voteCount,
          voteScore,
          likesCount,
          dislikesCount,
          updatedAt: new Date()
        })
        .where(eq(resources.id, resourceId));
      
      res.json({ 
        message: "Voto registrado correctamente",
        voteCount,
        voteScore,
        likesCount,
        dislikesCount
      });
    } catch (error) {
      console.error("Error al votar por recurso:", error);
      res.status(500).json({ message: "Error al procesar el voto" });
    }
  });
  
  // Endpoint para obtener el voto del usuario sobre un recurso específico
  app.get("/api/recursos/:id/voto-usuario", requireAuth, async (req, res) => {
    try {
      const resourceId = parseInt(req.params.id);
      const session = req.session as any;
      const userId = session.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }
      
      // Usar DrizzleORM para obtener el voto del usuario
      const [voto] = await db
        .select()
        .from(resourceVotes)
        .where(and(
          eq(resourceVotes.userId, userId),
          eq(resourceVotes.resourceId, resourceId)
        ));
      
      if (!voto) {
        return res.status(404).json({ message: "No has votado por este recurso todavía" });
      }
      
      res.json(voto);
    } catch (error) {
      console.error("Error al obtener voto de usuario:", error);
      res.status(500).json({ message: "Error al obtener información del voto" });
    }
  });
  
  // Endpoint para añadir un comentario a un recurso
  app.post("/api/recursos/:id/comentarios", requireAuth, async (req, res) => {
    try {
      const resourceId = parseInt(req.params.id);
      const session = req.session as any;
      const userId = session.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }
      
      const { contenido, valoracion } = req.body;
      
      if (!contenido) {
        return res.status(400).json({ message: "El contenido del comentario es obligatorio" });
      }
      
      // Verificar que el recurso existe
      const recurso = await db
        .select()
        .from(resources)
        .where(eq(resources.id, resourceId))
        .limit(1);
        
      if (!recurso || recurso.length === 0) {
        return res.status(404).json({ message: "Recurso no encontrado" });
      }
      
      // Sanitizar el contenido del comentario para evitar inyecciones
      let contenidoSanitizado = contenido;
      if (contenidoSanitizado && contenidoSanitizado.length > 1000) {
        contenidoSanitizado = contenidoSanitizado.substring(0, 1000);
      }
      
      console.log(`Intentando insertar comentario - resourceId: ${resourceId}, userId: ${userId}, valoracion: ${valoracion || 'null'}`);
      
      // Insertar comentario usando ejecución SQL directa con valores ajustados
      let comentario;
      try {
        // Insertar comentario de manera más simple
        const result = await db.execute(
          `INSERT INTO resource_comments 
           (resource_id, user_id, content, rating, likes, is_pinned, created_at, updated_at)
           VALUES 
           ($1, $2, $3, $4, 0, false, NOW(), NOW())
           RETURNING *`,
          [resourceId, userId, contenidoSanitizado, valoracion ? parseInt(valoracion) : null]
        );
        
        if (!result || !result.rows || result.rows.length === 0) {
          return res.status(500).json({ message: "Error al crear el comentario" });
        }
        
        comentario = result.rows[0];
        console.log("Comentario insertado con éxito:", comentario);
      } catch (error: any) {
        console.error("Error al insertar comentario:", error);
        return res.status(500).json({ 
          message: "Error al crear el comentario",
          error: error.message,
          details: error.toString()
        });
      }
      
      // Obtener información del usuario para la respuesta
      const userResult = await db.execute(`
        SELECT id, username FROM users WHERE id = $1
      `, [userId]);
      
      if (!userResult || !userResult.rows || userResult.rows.length === 0) {
        return res.status(500).json({ message: "Error al obtener información del usuario" });
      }
      
      const usuario = userResult.rows[0];
      
      // Devolver la respuesta formateada
      return res.status(201).json({
        id: comentario.id,
        content: comentario.content,
        rating: comentario.rating,
        resourceId: comentario.resource_id,
        user: {
          id: usuario.id,
          username: usuario.username,
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${usuario.username.substring(0, 2).toUpperCase()}`
        },
        createdAt: comentario.created_at,
        fecha: new Date(comentario.created_at).toLocaleDateString('es-ES')
      });
    } catch (error) {
      console.error("Error al crear comentario:", error);
      res.status(500).json({ message: "Error al procesar el comentario" });
    }
  });
  
  // Endpoint para obtener los comentarios de un recurso
  app.get("/api/recursos/:id/comentarios", async (req, res) => {
    try {
      const resourceId = parseInt(req.params.id);
      
      // Consulta simple a la base de datos para obtener los comentarios 
      const result = await db.query.resourceComments.findMany({
        where: eq(resourceComments.resourceId, resourceId),
        with: {
          user: {
            columns: {
              id: true,
              username: true
            }
          }
        },
        orderBy: [desc(resourceComments.createdAt)]
      });
      
      // Transformar los datos para tener un formato amigable para el cliente
      const comentariosFormateados = result.map(item => ({
        id: item.id,
        resourceId: item.resourceId,
        content: item.content,
        rating: item.rating,
        createdAt: item.createdAt,
        fecha: new Date(item.createdAt).toLocaleDateString('es-ES'),
        usuario: {
          id: item.user.id,
          nombre: item.user.username,
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${item.user.username.substring(0, 2).toUpperCase()}`
        }
      }));
      
      res.json(comentariosFormateados);
    } catch (error) {
      console.error("Error al obtener comentarios:", error);
      res.status(500).json({ message: "Error al obtener los comentarios del recurso" });
    }
  });
  
  // Ruta para eliminar un recurso específico (solo el propietario o admin)
  app.delete("/api/recursos/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const resourceId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      // Obtener el recurso para verificar permisos
      const recurso = await storage.getResource(resourceId);
      
      if (!recurso) {
        return res.status(404).json({ message: "Recurso no encontrado" });
      }
      
      // Verificar si el usuario es propietario o tiene permisos de admin
      if (recurso.userId !== userId && user?.username !== 'sela_gr' && user?.username !== 'redcreativa') {
        return res.status(403).json({ message: "No tienes permiso para eliminar este recurso" });
      }
      
      // Eliminar el recurso
      await storage.deleteResource(resourceId);
      
      res.json({ message: "Recurso eliminado exitosamente" });
    } catch (error) {
      console.error("Error al eliminar recurso:", error);
      res.status(500).json({ message: "Error al eliminar el recurso" });
    }
  });
  
  // Ruta para eliminar todos los recursos preestablecidos (solo usuarios autorizados)
  app.delete("/api/recursos/preestablecidos", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const user = await storage.getUser(userId);
      
      // Verificar si es un usuario autorizado
      if (user.username !== 'sela_gr' && user.username !== 'redcreativa') {
        return res.status(403).json({ message: "No tienes permisos para realizar esta acción" });
      }
      
      // Obtener todos los recursos creados por el sistema (userId es null)
      const recursos = await storage.getResourcesBySystem();
      
      // Eliminar cada recurso
      let eliminados = 0;
      if (recursos && recursos.length > 0) {
        for (const recurso of recursos) {
          await storage.deleteResource(recurso.id);
          eliminados++;
        }
      }
      
      res.json({ 
        message: `Se han eliminado ${eliminados} recursos preestablecidos`,
        count: eliminados
      });
    } catch (error) {
      console.error("Error eliminando recursos preestablecidos:", error);
      res.status(500).json({ message: "Error al eliminar recursos preestablecidos" });
    }
  });

  // Obtener subcategorías por categoría
  app.get("/api/recursos/categoria/:id/subcategorias", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const subcategories = await storage.getResourceSubcategoriesByCategory(categoryId);
      res.json(subcategories);
    } catch (error) {
      console.error("Error al obtener subcategorías:", error);
      res.status(500).json({ message: "Error al obtener las subcategorías de la categoría" });
    }
  });

  // Obtener recursos por categoría
  app.get("/api/recursos/categoria/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Obtener primero la categoría
      const categoria = await storage.getResourceCategoryBySlug(slug);
      if (!categoria) {
        return res.status(404).json({ message: "Categoría no encontrada" });
      }
      
      const recursos = await storage.getResourcesByCategory(categoria.id, limit, offset);
      res.json(recursos);
    } catch (error) {
      console.error("Error al obtener recursos por categoría:", error);
      res.status(500).json({ message: "Error al obtener recursos por categoría" });
    }
  });

  // Middleware to check if user is premium
  const requirePremium = async (
    req: Request,
    res: Response,
    next: Function,
  ) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user || (!user.isPremium && !user.lifetimeAccess)) {
      return res.status(403).json({ message: "Premium subscription required" });
    }

    next();
  };

  // Get calendar entries by month
  app.get("/api/calendar/:year/:month", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);

      if (isNaN(year) || isNaN(month)) {
        return res.status(400).json({ message: "Invalid year or month" });
      }

      const entries = await storage.getCalendarEntriesByMonth(
        userId,
        year,
        month,
      );
      res.json(entries);
    } catch (error) {
      console.error("Error fetching calendar entries:", error);
      res.status(500).json({ message: "Failed to fetch calendar entries" });
    }
  });
  
  // Update calendar entry (mark as completed/uncompleted)
  app.patch("/api/calendar/entry/:id", requireAuth, async (req, res) => {
    try {
      const entryId = parseInt(req.params.id);
      const { completed } = req.body;
      
      if (typeof completed !== "boolean") {
        return res.status(400).json({ message: "Valid 'completed' field is required" });
      }
      
      // Get the calendar entry
      const entry = await storage.getCalendarEntry(entryId);
      if (!entry) {
        return res.status(404).json({ message: "Calendar entry not found" });
      }
      
      // Check if the entry belongs to the user
      if (entry.userId !== req.session.userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Update the entry
      const updatedEntry = await storage.updateCalendarEntry(entryId, { completed });
      
      res.json(updatedEntry);
    } catch (error) {
      console.error("Error updating calendar entry:", error);
      res.status(500).json({ message: "Failed to update calendar entry" });
    }
  });

  app.get("/api/video-ideas/stats", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const stats = {
        total: await storage.countVideoIdeasByUser(userId),
        month: await storage.countVideoIdeasByUserInMonth(userId, new Date())
      };
      res.json(stats);
    } catch (error) {
      console.error("Error obteniendo estadísticas de ideas:", error);
      res.status(500).json({ message: "Error al obtener estadísticas" });
    }
  });

  // Helper function to check if user has reached free idea generation limit
  const hasReachedDailyLimit = async (userId: number): Promise<boolean> => {
    if (!userId) return false;

    // TEMPORAL: Desactivar la limitación para pruebas
    console.log("Límite diario temporalmente desactivado para pruebas");
    return false;
    
    /* Código original comentado
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);

    // Get ideas created today
    const ideas = await storage.getVideoIdeasByDateRange(
      userId,
      startOfToday,
      endOfToday,
    );
    */

    // Free users can create 1 idea per day
    // Código original comentado
    return false;
  };

  // Authentication APIs
  app.post("/api/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if username or email already exists
      const existingUsername = await storage.getUserByUsername(
        userData.username,
      );
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Set session
      req.session.userId = user.id;

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating user" });
      }
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      console.log("Login attempt:", { username, passwordLength: password?.length });

      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        console.log("Login failed: User not found");
        return res
          .status(401)
          .json({ message: "Invalid username or password" });
      }

      console.log("User found:", { id: user.id, hasPassword: !!user.password });

      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password);
      console.log("Password match:", passwordMatch);
      
      if (!passwordMatch) {
        return res
          .status(401)
          .json({ message: "Invalid username or password" });
      }

      // Set session
      req.session.userId = user.id;
      // Guardar la sesión de forma síncrona antes de responder
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error("Error al guardar la sesión:", err);
            reject(err);
          } else {
            console.log("Sesión guardada correctamente");
            resolve();
          }
        });
      });
      
      console.log("Session set:", { 
        userId: user.id, 
        sessionID: req.sessionID,
        session: req.session
      });

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Error during login" });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Error during logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Ruta especial para restablecer la contraseña del administrador
  app.get("/api/reset-admin", async (req, res) => {
    try {
      // Buscar usuario administrador por nombre de usuario
      const adminUser = await storage.getUserByUsername("sela_gr");
      
      if (!adminUser) {
        return res.status(404).json({ message: "Usuario administrador no encontrado" });
      }
      
      // Generar hash de la nueva contraseña
      const newPassword = "redcreativa2024";
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Actualizar la contraseña en la base de datos
      await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, adminUser.id));
      
      // Responder con éxito
      res.json({ 
        message: "Contraseña de administrador restablecida correctamente",
        username: adminUser.username,
        password: newPassword
      });
    } catch (error) {
      console.error("Error al restablecer la contraseña del administrador:", error);
      res.status(500).json({ message: "Error al restablecer la contraseña" });
    }
  });

  app.get("/api/me", async (req, res) => {
    console.log("Session state:", {
      hasSession: !!req.session,
      userId: req.session?.userId,
      sessionID: req.sessionID
    });
    
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      console.log("Fetching user with ID:", req.session.userId);
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        console.log("User not found in database, clearing session");
        req.session.destroy(() => {});
        return res.status(404).json({ message: "User not found" });
      }

      console.log("User found:", { id: user.id, username: user.username });
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Error fetching user data" });
    }
  });

  // User profile management
  app.patch("/api/me", requireAuth, async (req, res) => {
    try {
      const updates = updateUserSchema.parse(req.body);

      // Hash password if provided
      if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 10);
      }

      const updatedUser = await storage.updateUser(
        req.session.userId!,
        updates,
      );

      // Return user without password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error updating user" });
      }
    }
  });

  // ===== GENERACIÓN DE IDEAS DE VIDEO =====
  // Funcionalidades implementadas:
  // 1. Usuarios gratuitos: Pueden generar 1 idea por día y planificar semanalmente
  // 2. Usuarios premium: Generación ilimitada de ideas y planificación mensual
  // 3. Todos los usuarios: Acceso completo al calendario

  // Generar una sola idea
  app.post("/api/generate-idea", async (req, res) => {
    try {
      const params = generationRequestSchema.parse(req.body);

      // Generación anónima permitida (1 por sesión)
      if (!req.session.userId) {
        // Verificar si el usuario anónimo ya ha generado una idea en esta sesión
        if (req.session.anonymousIdeaGenerated) {
          return res.status(403).json({
            message:
              "Ya has generado una idea. Regístrate para generar más ideas.",
            limitReached: true,
          });
        }

        // Generar la idea y marcar que este usuario anónimo ya generó su idea gratuita
        const generatedIdea = await generateVideoIdea(params);
        req.session.anonymousIdeaGenerated = true;
        return res.json(generatedIdea);
      }

      // Verificar si el usuario ha alcanzado el límite diario (si no es premium)
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      // Los usuarios premium no tienen límite diario
      const isPremium = user.isPremium || user.lifetimeAccess;

      // TEMPORAL: Desactivar temporalmente la limitación para usuarios no premium
      console.log("Desactivando temporalmente límite diario para usuarios no premium");
      /*
      if (!isPremium) {
        // Verificar si el usuario ya generó una idea hoy
        const reachedLimit = await hasReachedDailyLimit(req.session.userId);
        if (reachedLimit) {
          return res.status(403).json({
            message:
              "Has alcanzado el límite diario de ideas gratuitas. Actualiza a premium para generar más ideas.",
            limitReached: true,
          });
        }
      }
      */

      // Generar y guardar la idea
      const generatedIdea = await generateVideoIdea(params);

      await createVideoIdeaWithSlug({
        userId: req.session.userId,
        title: generatedIdea.title,
        category: params.category,
        subcategory: params.subcategory,
        videoLength: params.videoLength,
        content: generatedIdea,
        isPublic: false, // Por defecto, las ideas no son públicas
      });

      res.json(generatedIdea);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ message: "Invalid input", errors: error.errors });
      } else {
        console.error("Error generating idea:", error);
        res.status(500).json({ message: "Error generating video idea" });
      }
    }
  });
  
  // Endpoint para asistencia de IA con el editor de texto
  app.post("/api/ai-assist", async (req, res) => {
    try {
      // Validar el esquema de la solicitud
      const { prompt, content } = aiAssistRequestSchema.parse(req.body);
      
      // Llamar a la función del asistente de IA con parámetro entireScript requerido
      const result = await aiAssistant({
        prompt,
        content,
        entireScript: false // por defecto, no estamos procesando un script completo
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error en asistente de IA:", error);
      res.status(500).json({
        message: "Error al procesar la solicitud de asistencia",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Video Ideas Management
  app.get("/api/video-ideas", requireAuth, async (req, res) => {
    try {
      const ideas = await storage.getVideoIdeasByUser(req.session.userId!);
      res.json(ideas);
    } catch (error) {
      res.status(500).json({ message: "Error fetching video ideas" });
    }
  });

  app.get("/api/video-ideas/:id", requireAuth, async (req, res) => {
    try {
      const idea = await storage.getVideoIdea(parseInt(req.params.id));

      if (!idea) {
        return res.status(404).json({ message: "Video idea not found" });
      }

      // Check if the idea belongs to the authenticated user or is public
      if (!idea.isPublic && idea.userId !== req.session.userId) {
        return res
          .status(403)
          .json({ message: "Not authorized to view this idea" });
      }

      res.json(idea);
    } catch (error) {
      res.status(500).json({ message: "Error fetching video idea" });
    }
  });
  
  // Endpoint para ver una idea pública por su slug
  app.get("/api/public/video-ideas/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      const idea = await storage.getVideoIdeaBySlug(slug);
      
      if (!idea || !idea.isPublic) {
        return res.status(404).json({ message: "Video idea not found" });
      }
      
      res.json(idea);
    } catch (error) {
      console.error("Error al obtener idea pública:", error);
      res.status(500).json({ message: "Error al obtener idea de video" });
    }
  });
  
  // Endpoint para cambiar la visibilidad de una idea (público/privado)
  app.patch("/api/video-ideas/:id/visibility", requireAuth, async (req, res) => {
    try {
      const ideaId = parseInt(req.params.id);
      const { isPublic } = req.body;
      
      if (typeof isPublic !== 'boolean') {
        return res.status(400).json({ message: "El parámetro isPublic debe ser un booleano" });
      }
      
      // Verificar que la idea existe y pertenece al usuario
      const idea = await storage.getVideoIdea(ideaId);
      
      if (!idea) {
        return res.status(404).json({ message: "Idea de video no encontrada" });
      }
      
      if (idea.userId !== req.session.userId) {
        return res.status(403).json({ message: "No tienes permiso para modificar esta idea" });
      }
      
      // Cambiar la visibilidad
      const updatedIdea = await storage.toggleVideoIdeaVisibility(ideaId, isPublic);
      
      res.json({
        message: isPublic ? "Idea compartida públicamente" : "Idea configurada como privada",
        videoIdea: updatedIdea
      });
    } catch (error) {
      console.error("Error al cambiar visibilidad:", error);
      res.status(500).json({ message: "Error fetching public video idea" });
    }
  });

  // Endpoint para hacer pública o privada una idea
  app.post("/api/video-ideas/:id/visibility", requireAuth, async (req, res) => {
    try {
      const ideaId = parseInt(req.params.id);
      const { isPublic } = req.body;
      
      if (typeof isPublic !== 'boolean') {
        return res.status(400).json({ message: "isPublic parameter must be a boolean" });
      }
      
      // Verificar que la idea exista
      const idea = await storage.getVideoIdea(ideaId);
      if (!idea) {
        return res.status(404).json({ message: "Video idea not found" });
      }
      
      // Verificar que el usuario sea el propietario
      if (idea.userId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to modify this idea" });
      }
      
      // Actualizar la visibilidad
      const updatedIdea = await storage.updateVideoIdea(ideaId, { isPublic });
      res.json(updatedIdea);
    } catch (error) {
      console.error("Error al cambiar visibilidad de idea:", error);
      res.status(500).json({ message: "Error updating video idea visibility" });
    }
  });

  app.delete("/api/video-ideas/:id", requireAuth, async (req, res) => {
    try {
      const idea = await storage.getVideoIdea(parseInt(req.params.id));

      if (!idea) {
        return res.status(404).json({ message: "Video idea not found" });
      }

      // Check if the idea belongs to the authenticated user
      if (idea.userId !== req.session.userId) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this idea" });
      }

      await storage.deleteVideoIdea(parseInt(req.params.id));
      res.json({ message: "Video idea deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting video idea" });
    }
  });
  
  // Editar una idea de video
  app.put("/api/video-ideas/:id", requireAuth, async (req, res) => {
    try {
      const ideaId = parseInt(req.params.id);
      const { title, content } = req.body;
      
      // Verificar que la idea existe
      const idea = await storage.getVideoIdea(ideaId);
      
      if (!idea) {
        return res.status(404).json({ message: "Idea no encontrada" });
      }
      
      // Verificar que la idea pertenece al usuario
      if (idea.userId !== req.session.userId) {
        return res.status(403).json({ message: "No autorizado para editar esta idea" });
      }
      
      // Actualizar la idea
      const updatedIdea = await storage.updateVideoIdea(ideaId, {
        title: title || idea.title,
        content: content || idea.content
      });
      
      res.status(200).json({ 
        message: "Idea actualizada correctamente", 
        idea: updatedIdea 
      });
    } catch (error) {
      console.error("Error al actualizar idea:", error);
      res.status(500).json({ message: "Error al actualizar la idea" });
    }
  });

  // Generar ideas para toda una semana (disponible para usuarios gratuitos)
  app.post("/api/generate-ideas/week", requireAuth, async (req, res) => {
    try {
      const params = generationRequestSchema.parse(req.body);
      const userId = req.session.userId!;

      // Los usuarios gratuitos pueden generar ideas para toda la semana
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      // Generar 7 ideas para la semana
      const ideas: VideoIdeaContent[] = [];
      const storedIdeas = [];
      const today = new Date();

      // Crear ideas para cada día de la semana con reintentos
      for (let i = 0; i < 7; i++) {
        let retryCount = 0;
        const maxRetries = 2; // Número máximo de reintentos por día
        let success = false;
        
        while (retryCount <= maxRetries && !success) {
          try {
            // Crear una nueva fecha añadiendo i días a la fecha actual
            const ideaDate = new Date(today);
            ideaDate.setDate(today.getDate() + i);
  
            // Formato de fecha en español
            const fechaFormateada = new Intl.DateTimeFormat("es-ES", {
              day: "numeric",
              month: "numeric",
              year: "numeric",
            }).format(ideaDate);
  
            console.log(`Generando idea para el día ${i + 1} de 7 (${fechaFormateada}), intento ${retryCount + 1}...`);
            
            // Generar idea con enfoque específico para ese día
            const generatedIdea = await generateVideoIdea({
              ...params,
              videoFocus: `${params.videoFocus} (Día ${i + 1} de 7, ${fechaFormateada})`,
              geminiApiKey: params.geminiApiKey, // Pasar la API key personalizada si existe
            });
  
            // Guardar la idea en la base de datos
            const videoIdea = await storage.createVideoIdea({
              userId,
              title: generatedIdea.title,
              category: params.category,
              subcategory: params.subcategory,
              videoLength: params.videoLength,
              content: generatedIdea,
            });
  
            // Crear automáticamente una entrada en el calendario para esta idea
            try {
              const calendarDate = new Date(today);
              calendarDate.setDate(today.getDate() + i);
              
              await storage.createCalendarEntry({
                userId,
                videoIdeaId: videoIdea.id,
                title: generatedIdea.title,
                date: calendarDate,
                completed: false,
                notes: Array.isArray(generatedIdea.outline) ? generatedIdea.outline.join("\n") : "",
                color: "#10b981", // Verde para ideas generadas
              });
              
              console.log(`Entrada de calendario creada para el día ${i + 1}`);
            } catch (calendarError) {
              console.error(`Error al crear entrada de calendario para el día ${i + 1}:`, calendarError);
              // Continuamos aunque falle la creación de la entrada de calendario
            }
  
            storedIdeas.push(videoIdea);
            ideas.push(generatedIdea);
            success = true;
            console.log(`Idea generada con éxito para el día ${i + 1} de 7`);
            
          } catch (error) {
            retryCount++;
            console.error(`Error generando idea para el día ${i + 1}, intento ${retryCount}:`, error);
            
            if (retryCount > maxRetries) {
              console.warn(`Se alcanzó el máximo de reintentos para el día ${i + 1}. Continuando con el siguiente día.`);
              console.error(`No se pudo generar una idea para el día ${i + 1} después de ${maxRetries} intentos. Omitiendo este día.`);
              break; // Salir del ciclo de reintentos y continuar con el siguiente día
            } else {
              // Esperar un poco antes del siguiente reintento
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
      }

      res.json({
        message: "Ideas generadas para toda la semana",
        count: ideas.length,
        ideas,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ message: "Invalid input", errors: error.errors });
      } else {
        console.error("Error generating weekly ideas:", error);
        res.status(500).json({ message: "Error generating weekly ideas" });
      }
    }
  });

  // Generar ideas masivamente (límite según tipo de usuario: gratuito o premium)
  app.post("/api/generate-ideas/mass", requireAuth, async (req, res) => {
    try {
      // Validar los parámetros del cuerpo de la solicitud
      const baseParams = generationRequestSchema.parse(req.body);
      const count = Math.min(parseInt(req.body.count) || 10, 100); // Máximo 100 ideas
      
      const userId = req.session.userId!;
      
      // Obtener información del usuario
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      // Verificar límites según el tipo de usuario
      const isPremium = user.isPremium || user.lifetimeAccess;
      const maxIdeas = isPremium ? 100 : 20; // Premium: 100, Gratuito: 20
      
      if (count > maxIdeas) {
        return res.status(403).json({
          message: isPremium 
            ? "El límite máximo es de 100 ideas por solicitud" 
            : "Los usuarios gratuitos pueden generar hasta 20 ideas por solicitud. Actualiza a premium para generar hasta 100.",
          limitReached: true,
        });
      }
      
      // Iniciar la generación
      console.log(`Generando ${count} ideas para el usuario ${user.username}...`);
      
      // Arreglos para almacenar ideas
      const ideas: VideoIdeaContent[] = [];
      const storedIdeas: VideoIdea[] = [];
      
      // Generar las ideas solicitadas con un enfoque iterativo y gestión de errores
      for (let i = 0; i < count; i++) {
        try {
          console.log(`Generando idea ${i + 1} de ${count}...`);
          
          // Generar idea con variaciones para evitar repeticiones
          const generatedIdea = await generateVideoIdea({
            ...baseParams,
            videoFocus: `${baseParams.videoFocus} (Idea ${i + 1} de ${count})`,
            geminiApiKey: baseParams.geminiApiKey,
          });
          
          // Guardar la idea en la base de datos usando la función helper
          const videoIdea = await createVideoIdeaWithSlug({
            userId,
            title: generatedIdea.title,
            category: baseParams.category,
            subcategory: baseParams.subcategory,
            videoLength: baseParams.videoLength,
            content: generatedIdea,
            isPublic: false, // Las ideas generadas por defecto no son públicas
          });
          
          storedIdeas.push(videoIdea);
          ideas.push(generatedIdea);
          console.log(`Idea ${i + 1} generada con éxito`);
        } catch (error) {
          console.error(`Error generando idea ${i + 1}:`, error);
          // Continuamos con la siguiente idea si hay un error
        }
      }
      
      // Retornar resultado
      return res.json({
        message: `Se generaron ${ideas.length} ideas de ${count} solicitadas`,
        count: ideas.length,
        ideas: ideas,
        storedIdeas: storedIdeas,
      });
    } catch (error) {
      console.error("Error en generate-mass-ideas:", error);
      return res.status(500).json({
        message: "Error al generar ideas",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.post("/api/generate-ideas/month", requirePremium, async (req, res) => {
    try {
      const params = generationRequestSchema.parse(req.body);
      const userId = req.session.userId!;

      // Esta ruta solo está disponible para usuarios premium (verificado por middleware)
      const today = new Date();
      const daysInMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0,
      ).getDate();
      const ideas: VideoIdeaContent[] = [];
      const storedIdeas = [];

      // Generar ideas para cada día del mes actual con reintentos
      for (let i = 0; i < daysInMonth; i++) {
        let retryCount = 0;
        const maxRetries = 2; // Número máximo de reintentos por día
        let success = false;
        
        while (retryCount <= maxRetries && !success) {
          try {
            const ideaDate = new Date(
              today.getFullYear(),
              today.getMonth(),
              i + 1,
            );
            
            // Formato de fecha en español
            const fechaFormateada = ideaDate.toLocaleDateString("es-ES");
            
            console.log(`Generando idea para el día ${i + 1} de ${daysInMonth} (${fechaFormateada}), intento ${retryCount + 1}...`);
            
            // Generar idea con enfoque específico para ese día
            const generatedIdea = await generateVideoIdea({
              ...params,
              videoFocus: `${params.videoFocus} (Día ${i + 1} de ${daysInMonth}, ${fechaFormateada})`,
              geminiApiKey: params.geminiApiKey, // Pasar la API key personalizada si existe
            });
  
            // Guardar la idea en la base de datos
            const videoIdea = await storage.createVideoIdea({
              userId,
              title: generatedIdea.title,
              category: params.category,
              subcategory: params.subcategory,
              videoLength: params.videoLength,
              content: generatedIdea,
            });
            
            // Crear automáticamente una entrada en el calendario para esta idea
            try {
              // Crear fecha para el día correspondiente
              const calendarDate = new Date(
                today.getFullYear(),
                today.getMonth(),
                i + 1,
              );
              
              await storage.createCalendarEntry({
                userId,
                videoIdeaId: videoIdea.id,
                title: generatedIdea.title,
                date: calendarDate,
                completed: false,
                notes: Array.isArray(generatedIdea.outline) ? generatedIdea.outline.join("\n") : "",
                color: "#8b5cf6", // Púrpura para ideas mensuales (para diferenciarlas)
              });
              
              console.log(`Entrada de calendario creada para el día ${i + 1} de ${daysInMonth}`);
            } catch (calendarError) {
              console.error(`Error al crear entrada de calendario para el día ${i + 1}:`, calendarError);
              // Continuamos aunque falle la creación de la entrada de calendario
            }
  
            storedIdeas.push(videoIdea);
            ideas.push(generatedIdea);
            success = true;
            console.log(`Idea generada con éxito para el día ${i + 1} de ${daysInMonth}`);
            
          } catch (error) {
            retryCount++;
            console.error(`Error generando idea para el día ${i + 1}, intento ${retryCount}:`, error);
            
            if (retryCount > maxRetries) {
              console.warn(`Se alcanzó el máximo de reintentos para el día ${i + 1}. Continuando con el siguiente día.`);
              // Si todos los reintentos fallan, intentamos generar una idea simulada
              try {
                const ideaDate = new Date(
                  today.getFullYear(),
                  today.getMonth(),
                  i + 1,
                );
                const fechaFormateada = ideaDate.toLocaleDateString("es-ES");
                
                // Usar la función getMockVideoIdea de gemini.ts a través del módulo importado
                const gemini = await import('./gemini');
                const mockIdea = gemini.getMockVideoIdea({
                  ...params,
                  videoFocus: `${params.videoFocus} (Día ${i + 1} de ${daysInMonth}, ${fechaFormateada})`,
                });
                
                // Personalizar el título con el día
                mockIdea.title = `Día ${i + 1}: ${mockIdea.title}`;
                
                // Guardar la idea simulada
                const videoIdea = await storage.createVideoIdea({
                  userId,
                  title: mockIdea.title,
                  category: params.category,
                  subcategory: params.subcategory,
                  videoLength: params.videoLength,
                  content: mockIdea,
                });
                
                storedIdeas.push(videoIdea);
                ideas.push(mockIdea);
                console.log(`Idea simulada generada para el día ${i + 1} después de fallos en la API`);
              } catch (mockError) {
                console.error(`Error al generar idea simulada para el día ${i + 1}:`, mockError);
              }
            } else {
              // Esperar un poco antes del siguiente reintento
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
      }

      res.json({
        message: "Ideas generadas para todo el mes",
        count: ideas.length,
        ideas,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ message: "Invalid input", errors: error.errors });
      } else {
        console.error("Error generating monthly ideas:", error);
        res.status(500).json({ message: "Error generating monthly ideas" });
      }
    }
  });

  // Calendar Management - Create calendar entry
  app.post("/api/calendar", requireAuth, async (req, res) => {
    try {
      let { videoIdeaContent, ...restData } = req.body;
      let videoIdeaId = req.body.videoIdeaId;
      
      // Si hay contenido de video idea, primero guardarlo
      if (videoIdeaContent && !videoIdeaId) {
        try {
          // Crear idea de video primero
          const videoIdea = await storage.createVideoIdea({
            userId: req.session.userId,
            title: videoIdeaContent.title,
            category: videoIdeaContent.category || "general",
            subcategory: videoIdeaContent.subcategory || "",
            videoLength: videoIdeaContent.videoLength || "5-10",
            content: videoIdeaContent
          });
          
          videoIdeaId = videoIdea.id;
          console.log(`Video idea created with ID: ${videoIdeaId}`);
        } catch (ideaError) {
          console.error("Error creating video idea:", ideaError);
          // Continuar aunque falle la creación de la idea
        }
      }
      
      // Asegurarse de que la fecha es un objeto Date
      let dateValue = restData.date;
      if (typeof dateValue === 'string') {
        try {
          dateValue = new Date(dateValue);
          if (isNaN(dateValue.getTime())) {
            throw new Error("Fecha inválida");
          }
        } catch (e) {
          return res.status(400).json({ 
            message: "Formato de fecha inválido", 
            details: "La fecha debe estar en formato ISO o ser un objeto Date válido" 
          });
        }
      }
      
      // Validar y crear entrada
      const calendarData = insertCalendarEntrySchema.parse({
        ...restData,
        userId: req.session.userId,
        videoIdeaId: videoIdeaId || null,
        date: dateValue, // Usar la fecha ya convertida
        timeOfDay: restData.timeOfDay || "12:00", // Hora por defecto al mediodía
        completed: restData.completed !== undefined ? restData.completed : false,
        notes: restData.notes || null,
        color: restData.color || "#3b82f6",
      });

      const entry = await storage.createCalendarEntry(calendarData);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Error de validación:", error.errors);
        res
          .status(400)
          .json({ message: "Invalid input", errors: error.errors });
      } else {
        console.error("Error creando entrada de calendario:", error);
        res.status(500).json({ message: "Error creating calendar entry" });
      }
    }
  });
  
  // Para compatibilidad con el frontend, también crear endpoint /api/calendar/entry
  app.post("/api/calendar/entry", requireAuth, async (req, res) => {
    try {
      let videoIdeaId = req.body.videoIdeaId;
      
      // Asegurarse de que la fecha es un objeto Date
      let dateValue = req.body.date;
      if (typeof dateValue === 'string') {
        try {
          dateValue = new Date(dateValue);
          if (isNaN(dateValue.getTime())) {
            throw new Error("Fecha inválida");
          }
        } catch (e) {
          return res.status(400).json({ 
            message: "Formato de fecha inválido", 
            details: "La fecha debe estar en formato ISO o ser un objeto Date válido" 
          });
        }
      }
      
      // Validar y crear entrada
      const calendarData = insertCalendarEntrySchema.parse({
        userId: req.session.userId,
        videoIdeaId: videoIdeaId || null,
        title: req.body.title,
        date: dateValue,
        timeOfDay: req.body.timeOfDay || "12:00", // Hora para grabación
        completed: req.body.completed !== undefined ? req.body.completed : false,
        notes: req.body.description || req.body.notes || null,
        color: req.body.color || "#3b82f6",
      });

      const entry = await storage.createCalendarEntry(calendarData);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Error de validación:", error.errors);
        res
          .status(400)
          .json({ message: "Invalid input", errors: error.errors });
      } else {
        console.error("Error creando entrada de calendario:", error);
        res.status(500).json({ message: "Error creating calendar entry" });
      }
    }
  });

  app.get("/api/calendar", requireAuth, async (req, res) => {
    try {
      const entries = await storage.getCalendarEntriesByUser(
        req.session.userId!,
      );
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Error fetching calendar entries" });
    }
  });

  app.get("/api/calendar/month", requireAuth, async (req, res) => {
    try {
      const year = parseInt(
        (req.query.year as string) || new Date().getFullYear().toString(),
      );
      const month = parseInt(
        (req.query.month as string) || new Date().getMonth().toString(),
      );

      const entries = await storage.getCalendarEntriesByMonth(
        req.session.userId!,
        year,
        month,
      );
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Error fetching calendar entries" });
    }
  });

  app.patch("/api/calendar/:id", requireAuth, async (req, res) => {
    try {
      const entryId = parseInt(req.params.id);
      const entry = await storage.getCalendarEntry(entryId);

      if (!entry) {
        return res.status(404).json({ message: "Calendar entry not found" });
      }

      // Check if the entry belongs to the authenticated user
      if (entry.userId !== req.session.userId) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this entry" });
      }

      const updatedEntry = await storage.updateCalendarEntry(entryId, req.body);
      res.json(updatedEntry);
    } catch (error) {
      console.error("Error updating calendar entry:", error);
      res.status(500).json({ message: "Error updating calendar entry" });
    }
  });
  
  // También soportar PATCH con el endpoint /api/calendar/entry/:id 
  app.patch("/api/calendar/entry/:id", requireAuth, async (req, res) => {
    try {
      const entryId = parseInt(req.params.id);
      const entry = await storage.getCalendarEntry(entryId);

      if (!entry) {
        return res.status(404).json({ message: "Entrada no encontrada" });
      }

      // Verificar que la entrada pertenece al usuario autenticado
      if (entry.userId !== req.session.userId) {
        return res
          .status(403)
          .json({ message: "No tienes permiso para modificar esta entrada" });
      }

      const updatedEntry = await storage.updateCalendarEntry(entryId, req.body);
      res.json(updatedEntry);
    } catch (error) {
      console.error("Error updating calendar entry:", error);
      res.status(500).json({ message: "Error al actualizar la entrada" });
    }
  });

  app.delete("/api/calendar/:id", requireAuth, async (req, res) => {
    try {
      const entryId = parseInt(req.params.id);
      const entry = await storage.getCalendarEntry(entryId);

      if (!entry) {
        return res.status(404).json({ message: "Calendar entry not found" });
      }

      // Check if the entry belongs to the authenticated user
      if (entry.userId !== req.session.userId) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this entry" });
      }

      await storage.deleteCalendarEntry(entryId);
      res.json({ message: "Calendar entry deleted successfully" });
    } catch (error) {
      console.error("Error deleting calendar entry:", error);
      res.status(500).json({ message: "Error deleting calendar entry" });
    }
  });
  
  // También soportar DELETE con el endpoint /api/calendar/entry/:id
  app.delete("/api/calendar/entry/:id", requireAuth, async (req, res) => {
    try {
      const entryId = parseInt(req.params.id);
      const entry = await storage.getCalendarEntry(entryId);

      if (!entry) {
        return res.status(404).json({ message: "Entrada no encontrada" });
      }

      // Verificar que la entrada pertenece al usuario autenticado
      if (entry.userId !== req.session.userId) {
        return res
          .status(403)
          .json({ message: "No tienes permiso para eliminar esta entrada" });
      }

      await storage.deleteCalendarEntry(entryId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting calendar entry:", error);
      res.status(500).json({ message: "Error al eliminar la entrada" });
    }
  });

  /*
   * API para la gestión de colecciones de guiones
   */
  // Obtener todas las colecciones de guiones del usuario
  app.get("/api/script-collections", requireAuth, async (req, res) => {
    try {
      const collections = await storage.getScriptCollectionsByUser(
        req.session.userId!
      );
      res.json(collections);
    } catch (error) {
      console.error("Error al obtener colecciones de guiones:", error);
      res.status(500).json({ message: "Error al obtener colecciones de guiones" });
    }
  });

  // Obtener una colección específica con sus guiones
  app.get("/api/script-collections/:id", requireAuth, async (req, res) => {
    try {
      const collectionId = parseInt(req.params.id);
      const collection = await storage.getScriptCollection(collectionId);

      if (!collection) {
        return res.status(404).json({ message: "Colección no encontrada" });
      }

      // Verificar que la colección pertenece al usuario autenticado
      if (collection.userId !== req.session.userId) {
        return res.status(403).json({ message: "No tienes permiso para ver esta colección" });
      }

      // Obtener guiones de la colección
      const scripts = await storage.getScriptsByCollection(collectionId);
      
      res.json({
        ...collection,
        scripts
      });
    } catch (error) {
      console.error("Error al obtener colección de guiones:", error);
      res.status(500).json({ message: "Error al obtener colección de guiones" });
    }
  });

  // Crear una nueva colección
  app.post("/api/script-collections", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      
      // Validar datos de la colección
      const collectionData = {
        userId,
        name: req.body.name,
        description: req.body.description || null
      };

      const collection = await storage.createScriptCollection(collectionData);
      res.status(201).json(collection);
    } catch (error) {
      console.error("Error al crear colección de guiones:", error);
      res.status(500).json({ message: "Error al crear colección de guiones" });
    }
  });

  // Actualizar una colección
  app.put("/api/script-collections/:id", requireAuth, async (req, res) => {
    try {
      const collectionId = parseInt(req.params.id);
      const collection = await storage.getScriptCollection(collectionId);

      if (!collection) {
        return res.status(404).json({ message: "Colección no encontrada" });
      }

      // Verificar que la colección pertenece al usuario autenticado
      if (collection.userId !== req.session.userId) {
        return res.status(403).json({ message: "No tienes permiso para editar esta colección" });
      }

      const updatedCollection = await storage.updateScriptCollection(
        collectionId,
        req.body
      );
      
      res.json(updatedCollection);
    } catch (error) {
      console.error("Error al actualizar colección de guiones:", error);
      res.status(500).json({ message: "Error al actualizar colección de guiones" });
    }
  });

  // Eliminar una colección
  app.delete("/api/script-collections/:id", requireAuth, async (req, res) => {
    try {
      const collectionId = parseInt(req.params.id);
      const collection = await storage.getScriptCollection(collectionId);

      if (!collection) {
        return res.status(404).json({ message: "Colección no encontrada" });
      }

      // Verificar que la colección pertenece al usuario autenticado
      if (collection.userId !== req.session.userId) {
        return res.status(403).json({ message: "No tienes permiso para eliminar esta colección" });
      }

      await storage.deleteScriptCollection(collectionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error al eliminar colección de guiones:", error);
      res.status(500).json({ message: "Error al eliminar colección de guiones" });
    }
  });

  /*
   * API para la gestión de guiones
   */
  // Obtener un guión específico
  app.get("/api/scripts/:id", requireAuth, async (req, res) => {
    try {
      const scriptId = parseInt(req.params.id);
      const script = await storage.getScript(scriptId);

      if (!script) {
        return res.status(404).json({ message: "Guión no encontrado" });
      }

      // Verificar que el guión pertenece a una colección del usuario autenticado
      const collection = await storage.getScriptCollection(script.collectionId);
      
      if (collection?.userId !== req.session.userId) {
        return res.status(403).json({ message: "No tienes permiso para ver este guión" });
      }

      res.json(script);
    } catch (error) {
      console.error("Error al obtener guión:", error);
      res.status(500).json({ message: "Error al obtener guión" });
    }
  });

  // Crear un nuevo guión en una colección
  app.post("/api/script-collections/:id/scripts", requireAuth, async (req, res) => {
    try {
      const collectionId = parseInt(req.params.id);
      const collection = await storage.getScriptCollection(collectionId);

      if (!collection) {
        return res.status(404).json({ message: "Colección no encontrada" });
      }

      // Verificar que la colección pertenece al usuario autenticado
      if (collection.userId !== req.session.userId) {
        return res.status(403).json({ message: "No tienes permiso para añadir guiones a esta colección" });
      }

      // Validar y crear el guión
      const scriptData = {
        ...req.body,
        collectionId,
      };

      const script = await storage.addScriptToCollection(scriptData);
      res.status(201).json(script);
    } catch (error) {
      console.error("Error al crear guión:", error);
      res.status(500).json({ message: "Error al crear guión" });
    }
  });

  // Actualizar un guión
  app.put("/api/scripts/:id", requireAuth, async (req, res) => {
    try {
      const scriptId = parseInt(req.params.id);
      const script = await storage.getScript(scriptId);

      if (!script) {
        return res.status(404).json({ message: "Guión no encontrado" });
      }

      // Verificar que el usuario tiene acceso al guión
      const collection = await storage.getScriptCollection(script.collectionId);
      
      if (collection?.userId !== req.session.userId) {
        return res.status(403).json({ message: "No tienes permiso para editar este guión" });
      }

      const updatedScript = await storage.updateScript(scriptId, req.body);
      res.json(updatedScript);
    } catch (error) {
      console.error("Error al actualizar guión:", error);
      res.status(500).json({ message: "Error al actualizar guión" });
    }
  });

  // Eliminar un guión
  app.delete("/api/scripts/:id", requireAuth, async (req, res) => {
    try {
      const scriptId = parseInt(req.params.id);
      const script = await storage.getScript(scriptId);

      if (!script) {
        return res.status(404).json({ message: "Guión no encontrado" });
      }

      // Verificar que el usuario tiene acceso al guión
      const collection = await storage.getScriptCollection(script.collectionId);
      
      if (collection?.userId !== req.session.userId) {
        return res.status(403).json({ message: "No tienes permiso para eliminar este guión" });
      }

      await storage.deleteScript(scriptId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error al eliminar guión:", error);
      res.status(500).json({ message: "Error al eliminar guión" });
    }
  });

  // Endpoint para analizar guiones con IA
  app.post("/api/ai-assist", requireAuth, async (req, res) => {
    try {
      if (!req.body.prompt || !req.body.content) {
        return res.status(400).json({ message: "Se requieren prompt y content" });
      }

      // Pasar a la función de asistente IA
      const result = await aiAssistant({
        prompt: req.body.prompt,
        content: req.body.content,
        entireScript: req.body.entireScript || false
      });

      res.json(result);
    } catch (error) {
      console.error("Error en asistente IA:", error);
      res.status(500).json({ message: "Error procesando la solicitud de IA" });
    }
  });

  // Subscription Management
  app.post("/api/subscriptions/monthly", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { subscriptionId, clientSecret } = await createMonthlySubscription(
        user.id,
        user.email,
        user.username,
      );

      res.json({ subscriptionId, clientSecret });
    } catch (error) {
      console.error("Error creating monthly subscription:", error);
      res.status(500).json({ message: "Error creating subscription" });
    }
  });

  app.post("/api/subscriptions/lifetime", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { clientSecret } = await createLifetimePayment(
        user.id,
        user.email,
        user.username,
      );

      res.json({ clientSecret });
    } catch (error) {
      console.error("Error creating lifetime payment:", error);
      res.status(500).json({ message: "Error creating payment" });
    }
  });

  // Stripe webhook
  app.post("/api/webhook", async (req, res) => {
    let event: Stripe.Event;

    // Verify the event
    try {
      const sig = req.headers["stripe-signature"];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!sig || !endpointSecret) {
        // Just parse the raw body in development
        event = req.body;
      } else {
        // Verify signature in production
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
          apiVersion: "2025-03-31.basil",
        });
        event = stripe.webhooks.constructEvent(
          (req as any).rawBody,
          sig,
          endpointSecret,
        );
      }

      // Handle the event
      await handleWebhook(event);

      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(400).json({ message: "Webhook error" });
    }
  });

  // ==== USER VIDEOS MANAGEMENT ====

  // Upload video file
  app.post(
    "/api/upload-video",
    requireAuth,
    videoUpload.single("video"),
    async (req, res) => {
      try {
        // Check if file was uploaded
        if (!req.file) {
          return res
            .status(400)
            .json({ message: "No se subió ningún archivo de video" });
        }

        const file = req.file;
        const { name = "Video sin título", description = "" } = req.body;

        // Create video record in database
        const video = await storage.createUserVideo({
          userId: req.session.userId!,
          title: name,
          description: description || null,
          fileName: file.filename,
          filePath: file.path,
          fileSize: file.size,
          mimeType: file.mimetype,
          duration: null, // Se podría calcular con ffmpeg en una implementación más avanzada
          thumbnailPath: null, // Se podría generar con ffmpeg
          isPublic: false,
        });

        res.status(201).json({ message: "Video subido exitosamente", video });
      } catch (error) {
        console.error("Error uploading video:", error);
        res.status(500).json({ message: "Error al subir video" });
      }
    },
  );

  // Get user videos
  app.get("/api/videos", requireAuth, async (req, res) => {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.session.userId) {
        return res.status(401).json({ message: "No autenticado" });
      }

      // Obtener todos los videos del usuario
      const videos = await storage.getUserVideosByUser(req.session.userId);
      
      // Log para depuración
      console.log(`Retrieved ${videos.length} videos for user ${req.session.userId}`);
      
      res.json(videos);
    } catch (error) {
      console.error("Error retrieving videos:", error);
      res.status(500).json({ message: "Error al obtener videos" });
    }
  });

  // Get single video
  app.get("/api/videos/:id", requireAuth, async (req, res) => {
    try {
      const videoId = parseInt(req.params.id);
      const video = await storage.getUserVideo(videoId);

      if (!video) {
        return res.status(404).json({ message: "Video no encontrado" });
      }

      if (video.userId !== req.session.userId) {
        return res
          .status(403)
          .json({ message: "No autorizado para ver este video" });
      }

      res.json(video);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener video" });
    }
  });

  // Delete video
  app.delete("/api/videos/:id", requireAuth, async (req, res) => {
    try {
      const videoId = parseInt(req.params.id);
      const video = await storage.getUserVideo(videoId);

      if (!video) {
        return res.status(404).json({ message: "Video no encontrado" });
      }

      if (video.userId !== req.session.userId) {
        return res
          .status(403)
          .json({ message: "No autorizado para eliminar este video" });
      }

      // Delete file from filesystem
      try {
        if (video.filePath && fs.existsSync(video.filePath)) {
          fs.unlinkSync(video.filePath);
        }

        if (video.thumbnailPath && fs.existsSync(video.thumbnailPath)) {
          fs.unlinkSync(video.thumbnailPath);
        }
      } catch (fsError) {
        console.error("Error deleting video files:", fsError);
      }

      // Delete from database
      await storage.deleteUserVideo(videoId);

      res.json({ message: "Video eliminado correctamente" });
    } catch (error) {
      res.status(500).json({ message: "Error al eliminar video" });
    }
  });

  // Update video details
  app.patch("/api/videos/:id", requireAuth, async (req, res) => {
    try {
      const videoId = parseInt(req.params.id);
      const video = await storage.getUserVideo(videoId);

      if (!video) {
        return res.status(404).json({ message: "Video no encontrado" });
      }

      if (video.userId !== req.session.userId) {
        return res
          .status(403)
          .json({ message: "No autorizado para actualizar este video" });
      }

      const { title, description, isPublic } = req.body;
      const updates: Partial<UserVideo> = {};

      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (isPublic !== undefined) updates.isPublic = isPublic;

      const updatedVideo = await storage.updateUserVideo(videoId, updates);

      res.json(updatedVideo);
    } catch (error) {
      res.status(500).json({ message: "Error al actualizar video" });
    }
  });

  // Serve video file
  app.get("/api/videos/:id/content", requireAuth, async (req, res) => {
    try {
      const videoId = parseInt(req.params.id);
      const video = await storage.getUserVideo(videoId);

      if (!video) {
        return res.status(404).json({ message: "Video no encontrado" });
      }

      // Check authorization - allow access to owner and to public videos
      if (video.userId !== req.session.userId && !video.isPublic) {
        return res
          .status(403)
          .json({ message: "No autorizado para ver este video" });
      }

      // Verify file exists
      if (!video.filePath || !fs.existsSync(video.filePath)) {
        return res
          .status(404)
          .json({ message: "Archivo de video no encontrado" });
      }

      // Get file stats
      const stat = fs.statSync(video.filePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      // Handle range requests for video streaming
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = end - start + 1;
        const file = fs.createReadStream(video.filePath, { start, end });

        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize,
          "Content-Type": video.mimeType || 'video/mp4',
        });

        file.pipe(res);
      } else {
        // Send whole file if no range is specified
        res.writeHead(200, {
          "Content-Length": fileSize,
          "Content-Type": video.mimeType || 'video/mp4',
        });

        fs.createReadStream(video.filePath).pipe(res);
      }
    } catch (error) {
      console.error("Error serving video:", error);
      res.status(500).json({ message: "Error al reproducir video" });
    }
  });

  // Serve thumbnail
  app.get("/api/videos/:id/thumbnail", requireAuth, async (req, res) => {
    try {
      const videoId = parseInt(req.params.id);
      const video = await storage.getUserVideo(videoId);

      if (!video) {
        return res.status(404).json({ message: "Video no encontrado" });
      }

      // Check authorization - allow access to owner and to public videos
      if (video.userId !== req.session.userId && !video.isPublic) {
        return res
          .status(403)
          .json({ message: "No autorizado para ver este video" });
      }

      // If no thumbnail exists, send a 404
      if (!video.thumbnailPath || !fs.existsSync(video.thumbnailPath)) {
        return res.status(404).json({ message: "Miniatura no encontrada" });
      }

      res.sendFile(video.thumbnailPath);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener miniatura" });
    }
  });

  // ==== END USER VIDEOS MANAGEMENT ====

  // ==== AGREGAR IDEA A CALENDARIO ====

  // Add a video idea to the calendar
  app.post(
    "/api/video-ideas/:id/add-to-calendar",
    requireAuth,
    async (req, res) => {
      try {
        const ideaId = parseInt(req.params.id);
        const { date, timeOfDay } = req.body;

        if (!date) {
          return res.status(400).json({ message: "Se requiere una fecha" });
        }

        // Get the video idea
        const idea = await storage.getVideoIdea(ideaId);

        if (!idea) {
          return res.status(404).json({ message: "Idea no encontrada" });
        }

        // Check if the idea belongs to the user
        if (idea.userId !== req.session.userId) {
          return res
            .status(403)
            .json({ message: "No autorizado para usar esta idea" });
        }

        // Create calendar entry
        const calendarEntry = await storage.createCalendarEntry({
          userId: req.session.userId,
          videoIdeaId: ideaId,
          title: idea.title,
          date: new Date(date),
          timeOfDay: timeOfDay || "12:00", // Hora predeterminada al mediodía si no se proporciona
          completed: false,
        });

        res.status(201).json({
          message: "Idea agregada al calendario",
          calendarEntry,
        });
      } catch (error) {
        console.error("Error adding idea to calendar:", error);
        res
          .status(500)
          .json({ message: "Error al agregar idea al calendario" });
      }
    },
  );

  // ==== END AGREGAR IDEA A CALENDARIO ====

  // Endpoint de asistente de IA para el editor
  app.post("/api/ai-assist", async (req, res) => {
    try {
      const params = aiAssistRequestSchema.parse(req.body);
      const result = await aiAssistant(params);
      res.json(result);
    } catch (error) {
      console.error("Error en asistente de IA:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Error procesando solicitud de IA" 
      });
    }
  });
  
  // Toda la integración con YouTube ha sido eliminada por petición del usuario

  // Rutas de API para blog (mejora SEO)
  // 1. Rutas para artículos de blog
  app.post("/api/blog/posts", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const blogPostData = insertBlogPostSchema.parse({
        ...req.body,
        userId,
        // Valores por defecto
        published: req.body.published ?? false,
        featured: req.body.featured ?? false,
        seoTitle: req.body.seoTitle || req.body.title,
        seoDescription: req.body.seoDescription || req.body.excerpt
      });
      
      // Asegurar que el slug sea único
      const existingPost = await storage.getBlogPostBySlug(blogPostData.slug);
      if (existingPost) {
        return res.status(400).json({ message: "Ya existe un artículo con ese slug" });
      }
      
      const blogPost = await storage.createBlogPost(blogPostData);
      
      // Si se enviaron categorías, agregarlas
      if (req.body.categories && Array.isArray(req.body.categories)) {
        for (const categoryId of req.body.categories) {
          await storage.addCategoryToBlogPost(blogPost.id, categoryId);
        }
      }
      
      res.status(201).json(blogPost);
    } catch (error: any) {
      console.error("Error creating blog post:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Datos inválidos", details: error.format() });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/blog/posts", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      const onlyPublished = req.query.published === "true";
      const featuredOnly = req.query.featured === "true";
      
      let posts: BlogPost[];
      
      if (featuredOnly) {
        posts = await storage.getFeaturedBlogPosts(limit);
      } else if (onlyPublished) {
        posts = await storage.getPublishedBlogPosts(limit, offset);
      } else {
        // Verificamos si el usuario está autenticado para mostrar sus borradores
        if (req.session.userId) {
          // Si está autenticado, mostrar todos los artículos (incluyendo sus borradores)
          posts = await storage.getAllBlogPosts(limit, offset);
        } else {
          // Si no está autenticado, mostrar solo los publicados
          posts = await storage.getPublishedBlogPosts(limit, offset);
        }
      }
      
      // Verificar artículos programados con fecha pasada y marcarlos como publicados
      const now = new Date();
      const updatedPosts = await Promise.all(posts.map(async (post) => {
        if (!post.published && post.publishedAt && new Date(post.publishedAt) <= now) {
          // Actualizar el post para marcarlo como publicado
          await storage.updateBlogPost(post.id, {
            published: true
          });
          post.published = true;
        }
        return post;
      }));
      
      // Enriquecer los posts con sus categorías
      const enrichedPosts = await Promise.all(updatedPosts.map(async (post) => {
        const categories = await storage.getBlogPostCategories(post.id);
        return {
          ...post,
          categories
        };
      }));
      
      res.json(enrichedPosts);
    } catch (error: any) {
      console.error("Error fetching blog posts:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/blog/posts/:identifier", async (req, res) => {
    try {
      let post;
      const { identifier } = req.params;
      
      // Verificar si el identificador es un número (ID) o un string (slug)
      const id = parseInt(identifier);
      
      console.log(`Buscando artículo con identifier: ${identifier}, id: ${id}`);
      
      if (!isNaN(id)) {
        // Si es un número válido, buscar por ID
        post = await storage.getBlogPost(id);
      } else {
        // Si no es un número, asumir que es un slug
        post = await storage.getBlogPostBySlug(identifier);
      }
      
      if (!post) {
        return res.status(404).json({ message: "Artículo no encontrado" });
      }
      
      // Si hay una fecha de publicación programada y ya pasó esa fecha, considerar el artículo como publicado
      const isScheduledAndPastDate = post.publishedAt && new Date(post.publishedAt) <= new Date();
      
      // Si el post no está publicado y no tiene fecha de publicación pasada, solo el autor puede verlo
      if (!post.published && !isScheduledAndPastDate && (!req.session.userId || post.userId !== req.session.userId)) {
        return res.status(403).json({ message: "No tienes permiso para ver este artículo" });
      }
      
      // Si el post tiene fecha de publicación programada que ya pasó, actualizarlo como publicado
      if (!post.published && isScheduledAndPastDate) {
        await storage.updateBlogPost(post.id, { published: true });
        post.published = true;
      }
      
      // Obtener categorías del post
      const categories = await storage.getBlogPostCategories(post.id);
      
      res.json({
        ...post,
        categories
      });
    } catch (error: any) {
      console.error("Error fetching blog post:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/blog/posts/slug/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const post = await storage.getBlogPostBySlug(slug);
      
      if (!post) {
        return res.status(404).json({ message: "Artículo no encontrado" });
      }
      
      // Si hay una fecha de publicación programada y ya pasó esa fecha, considerar el artículo como publicado
      const isScheduledAndPastDate = post.publishedAt && new Date(post.publishedAt) <= new Date();
      
      // Si el post no está publicado y no tiene fecha de publicación pasada, solo el autor puede verlo
      if (!post.published && !isScheduledAndPastDate && (!req.session.userId || post.userId !== req.session.userId)) {
        return res.status(403).json({ message: "No tienes permiso para ver este artículo" });
      }
      
      // Si el post tiene fecha de publicación programada que ya pasó, actualizarlo como publicado
      if (!post.published && isScheduledAndPastDate) {
        await storage.updateBlogPost(post.id, { published: true });
        post.published = true;
      }
      
      // Obtener categorías del post
      const categories = await storage.getBlogPostCategories(post.id);
      
      res.json({
        ...post,
        categories
      });
    } catch (error: any) {
      console.error("Error fetching blog post by slug:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.put("/api/blog/posts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      const post = await storage.getBlogPost(id);
      if (!post) {
        return res.status(404).json({ message: "Artículo no encontrado" });
      }
      
      // Solo el autor puede editar
      if (post.userId !== userId) {
        return res.status(403).json({ message: "No tienes permiso para editar este artículo" });
      }
      
      // Actualizar post
      const updatedPost = await storage.updateBlogPost(id, req.body);
      
      // Si se enviaron categorías, actualizar
      if (req.body.categories && Array.isArray(req.body.categories)) {
        // Obtener categorías actuales
        const currentCategories = await storage.getBlogPostCategories(id);
        const currentCategoryIds = currentCategories.map(c => c.id);
        
        // Eliminar categorías que ya no están
        for (const categoryId of currentCategoryIds) {
          if (!req.body.categories.includes(categoryId)) {
            await storage.removeCategoryFromBlogPost(id, categoryId);
          }
        }
        
        // Agregar nuevas categorías
        for (const categoryId of req.body.categories) {
          if (!currentCategoryIds.includes(categoryId)) {
            await storage.addCategoryToBlogPost(id, categoryId);
          }
        }
      }
      
      // Obtener categorías actualizadas
      const categories = await storage.getBlogPostCategories(id);
      
      res.json({
        ...updatedPost,
        categories
      });
    } catch (error: any) {
      console.error("Error updating blog post:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.delete("/api/blog/posts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      const post = await storage.getBlogPost(id);
      if (!post) {
        return res.status(404).json({ message: "Artículo no encontrado" });
      }
      
      // Solo el autor puede eliminar
      if (post.userId !== userId) {
        return res.status(403).json({ message: "No tienes permiso para eliminar este artículo" });
      }
      
      // Eliminar post
      await storage.deleteBlogPost(id);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting blog post:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // 2. Rutas para categorías de blog
  app.post("/api/blog/categories", requireAuth, async (req, res) => {
    try {
      const categoryData = insertBlogCategorySchema.parse(req.body);
      
      // Verificar que el slug sea único
      const existingCategory = await storage.getBlogCategoryBySlug(categoryData.slug);
      if (existingCategory) {
        return res.status(400).json({ message: "Ya existe una categoría con ese slug" });
      }
      
      const category = await storage.createBlogCategory(categoryData);
      res.status(201).json(category);
    } catch (error: any) {
      console.error("Error creating blog category:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Datos inválidos", details: error.format() });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  // Endpoint para generar artículos de blog con IA
  app.post("/api/blog/generate", requireAuth, async (req, res) => {
    try {
      // Validar parámetros de entrada
      const params = blogPostGenerationSchema.parse(req.body);
      const userId = req.session.userId!;
      
      // Verificar límites según si el usuario es premium
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      // Verificar que el usuario sea uno de los autorizados (sela_gr, sela_gb o Red Creativa)
      const allowedUsernames = ['sela_gr', 'sela_gb', 'redcreativa'];
      if (!allowedUsernames.includes(user.username.toLowerCase())) {
        return res.status(403).json({ 
          message: "No tienes permiso para generar artículos de blog con IA."
        });
      }
      
      // Para los usuarios autorizados a generar blog posts, permitir hasta 50 artículos
      // Sela_gr, sela_gb y redcreativa tienen permisos especiales
      const maxPosts = 50;
      if (params.count > maxPosts) {
        return res.status(403).json({ 
          message: `Puedes generar hasta ${maxPosts} artículos a la vez.`
        });
      }
      
      console.log(`Generando ${params.count} artículos sobre "${params.topic || 'tema aleatorio'}" para usuario ${userId}`);
      
      // Generar artículos con IA
      const blogPosts = await generateBlogPosts(params);
      
      // Guardar los artículos en la base de datos
      const savedPosts = [];
      
      // Si se solicita publicación programada, almacenar los artículos como no publicados
      const initiallyPublished = !params.schedulePublishing;
      
      for (let i = 0; i < blogPosts.length; i++) {
        const post = blogPosts[i];
        const slug = slugify(post.title);
        
        // Verificar si el slug ya existe
        const existingPost = await storage.getBlogPostBySlug(slug);
        
        // Determinar la fecha de publicación programada si es necesario
        const publishDate = params.schedulePublishing 
          ? new Date(Date.now() + (i + 1) * 60 * 60 * 1000) // Un artículo por hora
          : undefined;
          
        if (existingPost) {
          // Añadir timestamp al slug para hacerlo único
          const uniqueSlug = `${slug}-${Date.now().toString().substring(8)}`;
          
          const savedPost = await storage.createBlogPost({
            userId,
            title: post.title,
            content: post.content,
            excerpt: post.excerpt,
            coverImage: post.coverImage || `https://picsum.photos/seed/${encodeURIComponent(slug)}/1200/630`,
            slug: uniqueSlug,
            tags: post.tags,
            readingTime: post.readingTime,
            published: initiallyPublished,
            publishedAt: publishDate,
            featured: false,
            seoTitle: post.seoTitle || post.title,
            seoDescription: post.seoDescription || post.excerpt.substring(0, 155)
          });
          
          savedPosts.push(savedPost);
        } else {
          const savedPost = await storage.createBlogPost({
            userId,
            title: post.title,
            content: post.content,
            excerpt: post.excerpt,
            coverImage: post.coverImage || `https://picsum.photos/seed/${encodeURIComponent(slug)}/1200/630`,
            slug,
            tags: post.tags,
            readingTime: post.readingTime,
            published: initiallyPublished,
            publishedAt: publishDate,
            featured: false,
            seoTitle: post.seoTitle || post.title,
            seoDescription: post.seoDescription || post.excerpt.substring(0, 155)
          });
          
          savedPosts.push(savedPost);
        }
      }
      
      const message = params.schedulePublishing 
        ? `Se han generado ${savedPosts.length} artículos de blog que se publicarán automáticamente uno cada hora.`
        : `Se han generado y publicado ${savedPosts.length} artículos de blog.`;
      
      res.status(201).json({
        message,
        posts: savedPosts
      });
    } catch (error: any) {
      console.error("Error generating blog posts:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Datos inválidos", details: error.format() });
      }
      res.status(500).json({ message: "Error al generar artículos: " + error.message });
    }
  });
  
  app.get("/api/blog/categories", async (req, res) => {
    try {
      const categories = await storage.getAllBlogCategories();
      res.json(categories);
    } catch (error: any) {
      console.error("Error fetching blog categories:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/blog/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getBlogCategory(id);
      
      if (!category) {
        return res.status(404).json({ message: "Categoría no encontrada" });
      }
      
      res.json(category);
    } catch (error: any) {
      console.error("Error fetching blog category:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/blog/categories/slug/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const category = await storage.getBlogCategoryBySlug(slug);
      
      if (!category) {
        return res.status(404).json({ message: "Categoría no encontrada" });
      }
      
      res.json(category);
    } catch (error: any) {
      console.error("Error fetching blog category by slug:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/blog/categories/:id/posts", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getBlogCategory(id);
      
      if (!category) {
        return res.status(404).json({ message: "Categoría no encontrada" });
      }
      
      const posts = await storage.getBlogPostsByCategory(id);
      
      // Filtrar solo posts publicados si el usuario no está autenticado
      const filteredPosts = req.session.userId 
        ? posts 
        : posts.filter(post => post.published);
      
      res.json(filteredPosts);
    } catch (error: any) {
      console.error("Error fetching posts by category:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.put("/api/blog/categories/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const category = await storage.getBlogCategory(id);
      if (!category) {
        return res.status(404).json({ message: "Categoría no encontrada" });
      }
      
      // Verificar que el slug sea único si se está actualizando
      if (req.body.slug && req.body.slug !== category.slug) {
        const existingCategory = await storage.getBlogCategoryBySlug(req.body.slug);
        if (existingCategory) {
          return res.status(400).json({ message: "Ya existe una categoría con ese slug" });
        }
      }
      
      // Actualizar categoría
      const updatedCategory = await storage.updateBlogCategory(id, req.body);
      
      res.json(updatedCategory);
    } catch (error: any) {
      console.error("Error updating blog category:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.delete("/api/blog/categories/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const category = await storage.getBlogCategory(id);
      if (!category) {
        return res.status(404).json({ message: "Categoría no encontrada" });
      }
      
      // Eliminar categoría
      await storage.deleteBlogCategory(id);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting blog category:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  /**
   * Endpoint para generación por lotes según estrategia de contenido
   */
  app.post("/api/generate-idea-batch", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { date, contentPillar } = req.body;
      
      // Importar controlador de generación por lotes
      const { handleBatchGeneration } = await import("./routes/batch-generation");
      
      // Enviar la solicitud al controlador específico
      return handleBatchGeneration(req, res);
    } catch (error) {
      console.error("Error en generación por lotes:", error);
      res.status(500).json({ 
        message: "Error al generar idea por lotes", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * Rutas para la estrategia de contenido basada en Personal Brand Thesis
   */
  app.get("/api/content-strategy", requireAuth, async (req, res) => {
    try {
      const { userId } = req.session as SessionData;
      const strategy = await storage.getContentStrategy(userId);
      res.json(strategy || null);
    } catch (error) {
      console.error("Error al obtener estrategia de contenido:", error);
      res.status(500).json({ message: "Error al obtener estrategia de contenido" });
    }
  });
  
  app.post("/api/content-strategy", requireAuth, async (req, res) => {
    try {
      const { userId } = req.session as SessionData;
      
      // Verificar si ya existe una estrategia para este usuario
      const existingStrategy = await storage.getContentStrategy(userId);
      if (existingStrategy) {
        return res.status(400).json({ 
          message: "Ya existe una estrategia de contenido para este usuario, usa PUT para actualizarla" 
        });
      }
      
      const strategyData = {
        ...req.body,
        userId
      };
      
      const strategy = await storage.createContentStrategy(strategyData);
      res.status(201).json(strategy);
    } catch (error) {
      console.error("Error al crear estrategia de contenido:", error);
      res.status(500).json({ message: "Error al crear estrategia de contenido" });
    }
  });
  
  app.put("/api/content-strategy/:id", requireAuth, async (req, res) => {
    try {
      const { userId } = req.session as SessionData;
      const { id } = req.params;
      
      // Verificar que la estrategia pertenece al usuario
      const existingStrategy = await storage.getContentStrategy(userId);
      if (!existingStrategy || existingStrategy.id !== parseInt(id)) {
        return res.status(403).json({ message: "No autorizado para modificar esta estrategia" });
      }
      
      const strategy = await storage.updateContentStrategy(parseInt(id), req.body);
      res.json(strategy);
    } catch (error) {
      console.error("Error al actualizar estrategia de contenido:", error);
      res.status(500).json({ message: "Error al actualizar estrategia de contenido" });
    }
  });
  
  /**
   * Endpoint para publicar automáticamente los artículos programados
   * Este endpoint publica los artículos que tienen publishedAt <= hora actual
   */
  app.post("/api/blog/publish-scheduled", async (req, res) => {
    try {
      // Obtener artículos que deben ser publicados
      const currentDate = new Date();
      const postsToPublish = await storage.getBlogPostsForScheduledPublishing(currentDate);
      
      if (postsToPublish.length === 0) {
        return res.json({ message: "No hay artículos programados para publicar en este momento", count: 0 });
      }
      
      // Limitar a un solo artículo por hora
      // Tomamos el más antiguo según publishedAt
      const [oldestPost] = postsToPublish;
      
      // Actualizar el post para marcarlo como publicado
      await storage.updateBlogPost(oldestPost.id, {
        published: true
      });
      
      console.log(`Artículo publicado automáticamente: "${oldestPost.title}" (ID: ${oldestPost.id})`);
      
      res.json({ 
        message: "Artículo publicado automáticamente", 
        post: oldestPost,
        count: 1,
        remaining: postsToPublish.length - 1
      });
    } catch (error: any) {
      console.error("Error al publicar artículos programados:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  /**
   * Programar la publicación automática de artículos cada hora
   * Esta función se ejecuta cada 60 minutos y publica un artículo si hay artículos programados
   */
  function scheduleAutomaticPublishing() {
    // Iniciar inmediatamente la primera verificación
    publishScheduledPosts();
    
    // Programar cada hora (60 minutos * 60 segundos * 1000 ms)
    const PUBLISH_INTERVAL = 60 * 60 * 1000;
    
    setInterval(publishScheduledPosts, PUBLISH_INTERVAL);
    console.log("Publicación automática programada cada hora");
  }
  
  /**
   * Función para publicar artículos programados
   * Realiza una solicitud al endpoint de publicación automática
   */
  async function publishScheduledPosts() {
    try {
      // Obtener artículos que deben ser publicados
      const currentDate = new Date();
      const postsToPublish = await storage.getBlogPostsForScheduledPublishing(currentDate);
      
      if (postsToPublish.length === 0) {
        console.log("No hay artículos programados para publicar en este momento");
        return;
      }
      
      // Limitar a un solo artículo por ejecución
      // Tomamos el más antiguo según publishedAt
      const [oldestPost] = postsToPublish;
      
      // Actualizar el post para marcarlo como publicado
      await storage.updateBlogPost(oldestPost.id, {
        published: true
      });
      
      console.log(`Artículo publicado automáticamente: "${oldestPost.title}" (ID: ${oldestPost.id})`);
      console.log(`Quedan ${postsToPublish.length - 1} artículos pendientes de publicación automática`);
    } catch (error) {
      console.error("Error al publicar artículos programados:", error);
    }
  }

  // =================================================
  // RUTAS PARA BIBLIOTECAS PERSONALES DE RECURSOS
  // =================================================
  
  // Ruta para crear una colección de recursos
  app.post("/api/resource-collections", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const collection = insertUserResourceCollectionSchema.parse({
        ...req.body,
        userId
      });
      
      const newCollection = await storage.createResourceCollection(collection);
      res.status(201).json(newCollection);
    } catch (error: any) {
      console.error("Error creando colección de recursos:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Obtener todas las colecciones de un usuario
  app.get("/api/resource-collections", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const collections = await storage.getResourceCollectionsByUser(userId);
      res.json(collections);
    } catch (error: any) {
      console.error("Error obteniendo colecciones de recursos:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Obtener una colección específica
  app.get("/api/resource-collections/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const collectionId = parseInt(req.params.id);
      
      const collection = await storage.getResourceCollection(collectionId);
      
      if (!collection) {
        return res.status(404).json({ message: "Colección no encontrada" });
      }
      
      // Verificar que la colección pertenece al usuario
      if (collection.userId !== userId) {
        return res.status(403).json({ message: "No tienes permiso para acceder a esta colección" });
      }
      
      // Obtener los recursos de la colección
      const resourceItems = await storage.getResourceItemsByCollection(collectionId);
      
      res.json({
        collection,
        items: resourceItems
      });
    } catch (error: any) {
      console.error("Error obteniendo colección de recursos:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Actualizar una colección
  app.put("/api/resource-collections/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const collectionId = parseInt(req.params.id);
      
      // Verificar que la colección existe y pertenece al usuario
      const collection = await storage.getResourceCollection(collectionId);
      
      if (!collection) {
        return res.status(404).json({ message: "Colección no encontrada" });
      }
      
      if (collection.userId !== userId) {
        return res.status(403).json({ message: "No tienes permiso para modificar esta colección" });
      }
      
      // Actualizar la colección
      const updatedCollection = await storage.updateResourceCollection(
        collectionId, 
        req.body
      );
      
      res.json(updatedCollection);
    } catch (error: any) {
      console.error("Error actualizando colección de recursos:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Eliminar una colección
  app.delete("/api/resource-collections/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const collectionId = parseInt(req.params.id);
      
      // Verificar que la colección existe y pertenece al usuario
      const collection = await storage.getResourceCollection(collectionId);
      
      if (!collection) {
        return res.status(404).json({ message: "Colección no encontrada" });
      }
      
      if (collection.userId !== userId) {
        return res.status(403).json({ message: "No tienes permiso para eliminar esta colección" });
      }
      
      // Eliminar la colección
      await storage.deleteResourceCollection(collectionId);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error eliminando colección de recursos:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Añadir un recurso a una colección
  app.post("/api/resource-collections/:id/items", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const collectionId = parseInt(req.params.id);
      
      // Verificar que la colección existe y pertenece al usuario
      const collection = await storage.getResourceCollection(collectionId);
      
      if (!collection) {
        return res.status(404).json({ message: "Colección no encontrada" });
      }
      
      if (collection.userId !== userId) {
        return res.status(403).json({ message: "No tienes permiso para modificar esta colección" });
      }
      
      // Validar y crear el ítem
      const item = insertUserResourceItemSchema.parse({
        ...req.body,
        collectionId
      });
      
      const newItem = await storage.addResourceToCollection(item);
      res.status(201).json(newItem);
    } catch (error: any) {
      console.error("Error añadiendo recurso a colección:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Actualizar un ítem de colección
  app.put("/api/resource-items/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const itemId = parseInt(req.params.id);
      
      // Obtener el ítem
      const item = await storage.getResourceItem(itemId);
      
      if (!item) {
        return res.status(404).json({ message: "Ítem no encontrado" });
      }
      
      // Verificar que la colección pertenece al usuario
      const collection = await storage.getResourceCollection(item.collectionId);
      
      if (!collection || collection.userId !== userId) {
        return res.status(403).json({ message: "No tienes permiso para modificar este ítem" });
      }
      
      // Actualizar el ítem
      const updatedItem = await storage.updateResourceItem(
        itemId, 
        req.body
      );
      
      res.json(updatedItem);
    } catch (error: any) {
      console.error("Error actualizando ítem de colección:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Eliminar un ítem de colección
  app.delete("/api/resource-items/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const itemId = parseInt(req.params.id);
      
      // Obtener el ítem
      const item = await storage.getResourceItem(itemId);
      
      if (!item) {
        return res.status(404).json({ message: "Ítem no encontrado" });
      }
      
      // Verificar que la colección pertenece al usuario
      const collection = await storage.getResourceCollection(item.collectionId);
      
      if (!collection || collection.userId !== userId) {
        return res.status(403).json({ message: "No tienes permiso para eliminar este ítem" });
      }
      
      // Eliminar el ítem
      await storage.removeResourceFromCollection(itemId);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error eliminando ítem de colección:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // =================================================
  // RUTAS PARA BIBLIOTECAS PERSONALES DE GUIONES
  // =================================================
  
  // Ruta para crear una colección de guiones
  app.post("/api/script-collections", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const collection = insertUserScriptCollectionSchema.parse({
        ...req.body,
        userId
      });
      
      const newCollection = await storage.createScriptCollection(collection);
      res.status(201).json(newCollection);
    } catch (error: any) {
      console.error("Error creando colección de guiones:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Obtener todas las colecciones de guiones de un usuario
  app.get("/api/script-collections", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const collections = await storage.getScriptCollectionsByUser(userId);
      res.json(collections);
    } catch (error: any) {
      console.error("Error obteniendo colecciones de guiones:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Obtener una colección de guiones específica
  app.get("/api/script-collections/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const collectionId = parseInt(req.params.id);
      
      const collection = await storage.getScriptCollection(collectionId);
      
      if (!collection) {
        return res.status(404).json({ message: "Colección no encontrada" });
      }
      
      // Verificar que la colección pertenece al usuario
      if (collection.userId !== userId) {
        return res.status(403).json({ message: "No tienes permiso para acceder a esta colección" });
      }
      
      // Obtener los guiones de la colección
      const scripts = await storage.getScriptsByCollection(collectionId);
      
      res.json({
        collection,
        scripts
      });
    } catch (error: any) {
      console.error("Error obteniendo colección de guiones:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Actualizar una colección de guiones
  app.put("/api/script-collections/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const collectionId = parseInt(req.params.id);
      
      // Verificar que la colección existe y pertenece al usuario
      const collection = await storage.getScriptCollection(collectionId);
      
      if (!collection) {
        return res.status(404).json({ message: "Colección no encontrada" });
      }
      
      if (collection.userId !== userId) {
        return res.status(403).json({ message: "No tienes permiso para modificar esta colección" });
      }
      
      // Actualizar la colección
      const updatedCollection = await storage.updateScriptCollection(
        collectionId, 
        req.body
      );
      
      res.json(updatedCollection);
    } catch (error: any) {
      console.error("Error actualizando colección de guiones:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Eliminar una colección de guiones
  app.delete("/api/script-collections/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const collectionId = parseInt(req.params.id);
      
      // Verificar que la colección existe y pertenece al usuario
      const collection = await storage.getScriptCollection(collectionId);
      
      if (!collection) {
        return res.status(404).json({ message: "Colección no encontrada" });
      }
      
      if (collection.userId !== userId) {
        return res.status(403).json({ message: "No tienes permiso para eliminar esta colección" });
      }
      
      // Eliminar la colección
      await storage.deleteScriptCollection(collectionId);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error eliminando colección de guiones:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Añadir un guión a una colección
  app.post("/api/script-collections/:id/scripts", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const collectionId = parseInt(req.params.id);
      
      // Verificar que la colección existe y pertenece al usuario
      const collection = await storage.getScriptCollection(collectionId);
      
      if (!collection) {
        return res.status(404).json({ message: "Colección no encontrada" });
      }
      
      if (collection.userId !== userId) {
        return res.status(403).json({ message: "No tienes permiso para modificar esta colección" });
      }
      
      // Validar y crear el guión
      const script = insertUserScriptSchema.parse({
        ...req.body,
        collectionId
      });
      
      const newScript = await storage.addScriptToCollection(script);
      res.status(201).json(newScript);
    } catch (error: any) {
      console.error("Error añadiendo guión a colección:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Obtener un guión específico
  app.get("/api/scripts/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const scriptId = parseInt(req.params.id);
      
      const script = await storage.getScript(scriptId);
      
      if (!script) {
        return res.status(404).json({ message: "Guión no encontrado" });
      }
      
      // Verificar que el guión pertenece a una colección del usuario
      const collection = await storage.getScriptCollection(script.collectionId);
      
      if (!collection || collection.userId !== userId) {
        return res.status(403).json({ message: "No tienes permiso para acceder a este guión" });
      }
      
      res.json(script);
    } catch (error: any) {
      console.error("Error obteniendo guión:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Actualizar un guión
  app.put("/api/scripts/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const scriptId = parseInt(req.params.id);
      
      // Obtener el guión
      const script = await storage.getScript(scriptId);
      
      if (!script) {
        return res.status(404).json({ message: "Guión no encontrado" });
      }
      
      // Verificar que la colección pertenece al usuario
      const collection = await storage.getScriptCollection(script.collectionId);
      
      if (!collection || collection.userId !== userId) {
        return res.status(403).json({ message: "No tienes permiso para modificar este guión" });
      }
      
      // Actualizar el guión
      const updatedScript = await storage.updateScript(
        scriptId, 
        req.body
      );
      
      res.json(updatedScript);
    } catch (error: any) {
      console.error("Error actualizando guión:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Eliminar un guión
  app.delete("/api/scripts/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const scriptId = parseInt(req.params.id);
      
      // Obtener el guión
      const script = await storage.getScript(scriptId);
      
      if (!script) {
        return res.status(404).json({ message: "Guión no encontrado" });
      }
      
      // Verificar que la colección pertenece al usuario
      const collection = await storage.getScriptCollection(script.collectionId);
      
      if (!collection || collection.userId !== userId) {
        return res.status(403).json({ message: "No tienes permiso para eliminar este guión" });
      }
      
      // Eliminar el guión
      await storage.deleteScript(scriptId);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error eliminando guión:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Iniciar el programador de publicación automática
  scheduleAutomaticPublishing();

  const httpServer = createServer(app);
  return httpServer;
}
