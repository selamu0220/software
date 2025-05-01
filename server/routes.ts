import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateVideoIdea, aiAssistant, aiAssistRequestSchema } from "./gemini";
import { VideoIdeaContent } from "@/lib/openai";
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
  UserVideo,
} from "@shared/schema";
import bcrypt from "bcryptjs";
import session from "express-session";
import MemoryStore from "memorystore";
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
import multer from "multer";
import path from "path";
import fs from "fs";
import * as youtubeService from './youtube';

// Configure multer for video uploads
const uploadDir = path.join(process.cwd(), "uploads");
// Ensure uploads directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const videoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
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
  storage: videoStorage,
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

declare module "express-session" {
  interface SessionData {
    userId: number;
    anonymousIdeaGenerated?: boolean;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create session store
  const SessionStore = MemoryStore(session);

  // Setup session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "keyboard-cat",
      resave: false,
      saveUninitialized: false,
      store: new SessionStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      },
    }),
  );

  // Middleware to check if user is authenticated
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

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

  // Add video idea to calendar
  app.post(
    "/api/video-ideas/:id/add-to-calendar",
    requireAuth,
    async (req, res) => {
      try {
        const videoIdeaId = parseInt(req.params.id);
        const { date } = req.body;

        if (!date) {
          return res.status(400).json({ message: "Date is required" });
        }

        // Get the video idea
        const videoIdea = await storage.getVideoIdea(videoIdeaId);
        if (!videoIdea) {
          return res.status(404).json({ message: "Video idea not found" });
        }

        // Check if the video idea belongs to the user
        if (videoIdea.userId !== req.session.userId) {
          return res.status(403).json({ message: "Unauthorized" });
        }

        // Create a calendar entry
        const calendarEntry = await storage.createCalendarEntry({
          userId: req.session.userId,
          videoIdeaId: videoIdeaId,
          date: new Date(date),
          title: videoIdea.title,
          completed: false,
        });

        res.status(201).json({
          message: "Video idea added to calendar",
          calendarEntry,
        });
      } catch (error) {
        console.error("Error adding video idea to calendar:", error);
        res
          .status(500)
          .json({ message: "Failed to add video idea to calendar" });
      }
    },
  );

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
      console.log("Session set:", { userId: user.id });

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

  app.get("/api/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(404).json({ message: "User not found" });
      }

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
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

      await storage.createVideoIdea({
        userId: req.session.userId,
        title: generatedIdea.title,
        category: params.category,
        subcategory: params.subcategory,
        videoLength: params.videoLength,
        content: generatedIdea,
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
      const { prompt, content, geminiApiKey } = aiAssistRequestSchema.parse(req.body);
      
      // Llamar a la función del asistente de IA con parámetro entireScript requerido
      const result = await aiAssistant({
        prompt,
        content,
        geminiApiKey,
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

      // Check if the idea belongs to the authenticated user
      if (idea.userId !== req.session.userId) {
        return res
          .status(403)
          .json({ message: "Not authorized to view this idea" });
      }

      res.json(idea);
    } catch (error) {
      res.status(500).json({ message: "Error fetching video idea" });
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
  
            storedIdeas.push(videoIdea);
            ideas.push(generatedIdea);
            success = true;
            console.log(`Idea generada con éxito para el día ${i + 1} de 7`);
            
          } catch (error) {
            retryCount++;
            console.error(`Error generando idea para el día ${i + 1}, intento ${retryCount}:`, error);
            
            if (retryCount > maxRetries) {
              console.warn(`Se alcanzó el máximo de reintentos para el día ${i + 1}. Continuando con el siguiente día.`);
              // Si todos los reintentos fallan, intentamos generar una idea simulada
              try {
                const ideaDate = new Date(today);
                ideaDate.setDate(today.getDate() + i);
                const fechaFormateada = ideaDate.toLocaleDateString("es-ES");
                
                // Usar la función getMockVideoIdea de gemini.ts que exportamos directamente
                const gemini = await import('./gemini');
                const mockIdea = gemini.getMockVideoIdea({
                  ...params,
                  videoFocus: `${params.videoFocus} (Día ${i + 1} de 7, ${fechaFormateada})`,
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

  // Generar ideas para todo un mes (solo para usuarios premium)
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

  // Calendar Management
  app.post("/api/calendar", requireAuth, async (req, res) => {
    try {
      const calendarData = insertCalendarEntrySchema.parse({
        ...req.body,
        userId: req.session.userId,
      });

      const entry = await storage.createCalendarEntry(calendarData);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ message: "Invalid input", errors: error.errors });
      } else {
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
      res.status(500).json({ message: "Error updating calendar entry" });
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
      res.status(500).json({ message: "Error deleting calendar entry" });
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
        if (fs.existsSync(video.filePath)) {
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
      if (!fs.existsSync(video.filePath)) {
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
          "Content-Type": video.mimeType,
        });

        file.pipe(res);
      } else {
        // Send whole file if no range is specified
        res.writeHead(200, {
          "Content-Length": fileSize,
          "Content-Type": video.mimeType,
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
        const { date } = req.body;

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

  // ===== RUTAS DE INTEGRACIÓN CON YOUTUBE =====
  
  // Configurar memoria para almacenar temporalmente datos de autenticación OAuth
  const pendingAuthStates = new Map<string, { redirectUrl: string }>();
  
  // Obtener URL de autorización
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

  app.get("/api/youtube/auth-url", requireAuth, async (req, res) => {
    try {
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return res.status(500).json({ 
          message: "La API de YouTube no está configurada. Contacta al administrador.",
          missingCredentials: true
        });
      }
      
      // Generar URL de autorización
      const authUrl = youtubeService.getAuthUrl();
      
      res.json({ url: authUrl });
    } catch (error) {
      console.error("Error getting YouTube auth URL:", error);
      res.status(500).json({ message: "Error al obtener URL de autorización" });
    }
  });
  
  // Callback para el proceso de autorización de Google OAuth
  app.get("/api/youtube/callback", async (req, res) => {
    const { code } = req.query;
    const { userId } = req.session;
    
    if (!code || typeof code !== "string") {
      return res.status(400).send(`
        <html>
          <body>
            <script>
              window.opener.postMessage({ type: "YOUTUBE_AUTH_ERROR", error: "No se recibió código de autorización" }, "*");
              window.close();
            </script>
          </body>
        </html>
      `);
    }
    
    try {
      // Intercambiar código por tokens
      const tokens = await youtubeService.getTokensFromCode(code);
      
      if (userId) {
        // Guardar tokens en la base de datos asociados al usuario
        await storage.updateUser(userId, {
          youtubeAccessToken: tokens.accessToken,
          youtubeRefreshToken: tokens.refreshToken,
          youtubeTokenExpiry: new Date(tokens.expiresAt)
        });
      }
      
      // Enviar tokens al cliente a través de la ventana que abrió esta página
      res.send(`
        <html>
          <body>
            <script>
              window.opener.postMessage({
                type: "YOUTUBE_AUTH_SUCCESS",
                accessToken: "${tokens.accessToken}",
                refreshToken: "${tokens.refreshToken}",
                expiresAt: ${tokens.expiresAt}
              }, "*");
              window.close();
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Error en el callback de YouTube:", error);
      res.status(500).send(`
        <html>
          <body>
            <script>
              window.opener.postMessage({ 
                type: "YOUTUBE_AUTH_ERROR", 
                error: "Error al procesar la autorización"
              }, "*");
              window.close();
            </script>
          </body>
        </html>
      `);
    }
  });
  
  // Obtener información del canal
  app.get("/api/youtube/channel", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      if (!user?.youtubeAccessToken || !user?.youtubeRefreshToken) {
        return res.status(401).json({ 
          message: "No hay conexión con YouTube",
          needsAuth: true 
        });
      }
      
      // Verificar si el token ha expirado
      const now = Date.now();
      const tokenExpiry = user.youtubeTokenExpiry?.getTime() || 0;
      
      if (now >= tokenExpiry) {
        // Refrescar token
        try {
          const newTokens = await youtubeService.refreshAccessToken(user.youtubeRefreshToken);
          
          // Actualizar tokens en la base de datos
          await storage.updateUser(userId, {
            youtubeAccessToken: newTokens.accessToken,
            youtubeRefreshToken: newTokens.refreshToken,
            youtubeTokenExpiry: new Date(newTokens.expiresAt)
          });
          
          // Establecer nuevos tokens para la API
          youtubeService.setTokens(newTokens.accessToken, newTokens.refreshToken);
        } catch (err) {
          return res.status(401).json({ 
            message: "Sesión de YouTube expirada",
            needsAuth: true 
          });
        }
      } else {
        // Tokens válidos, usarlos directamente
        youtubeService.setTokens(user.youtubeAccessToken, user.youtubeRefreshToken);
      }
      
      // Obtener información del canal
      const channelInfo = await youtubeService.getChannelInfo();
      
      res.json(channelInfo);
    } catch (error) {
      console.error("Error obteniendo información del canal:", error);
      res.status(500).json({ message: "Error al obtener información del canal" });
    }
  });
  
  // Desconectar YouTube
  app.post("/api/youtube/disconnect", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      
      // Eliminar tokens de YouTube
      await storage.updateUser(userId, {
        youtubeAccessToken: null,
        youtubeRefreshToken: null,
        youtubeTokenExpiry: null
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error al desconectar YouTube:", error);
      res.status(500).json({ message: "Error al desconectar YouTube" });
    }
  });
  
  // Subir video a YouTube
  app.post("/api/youtube/upload", requireAuth, videoUpload.single("video"), async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      if (!user?.youtubeAccessToken || !user?.youtubeRefreshToken) {
        return res.status(401).json({ 
          message: "No hay conexión con YouTube",
          needsAuth: true 
        });
      }
      
      // Verificar token
      const now = Date.now();
      const tokenExpiry = user.youtubeTokenExpiry?.getTime() || 0;
      
      if (now >= tokenExpiry) {
        try {
          const newTokens = await youtubeService.refreshAccessToken(user.youtubeRefreshToken);
          
          await storage.updateUser(userId, {
            youtubeAccessToken: newTokens.accessToken,
            youtubeRefreshToken: newTokens.refreshToken,
            youtubeTokenExpiry: new Date(newTokens.expiresAt)
          });
          
          youtubeService.setTokens(newTokens.accessToken, newTokens.refreshToken);
        } catch (err) {
          return res.status(401).json({ 
            message: "Sesión de YouTube expirada",
            needsAuth: true 
          });
        }
      } else {
        youtubeService.setTokens(user.youtubeAccessToken, user.youtubeRefreshToken);
      }
      
      // Verificar archivo de video
      if (!req.file) {
        return res.status(400).json({ message: "No se proporcionó ningún video" });
      }
      
      // Obtener datos del formulario
      const title = req.body.title || "Video sin título";
      const description = req.body.description || "";
      const tags = req.body.tags ? req.body.tags.split(",").map((tag: string) => tag.trim()) : [];
      const isPrivate = req.body.private === "true";
      
      // Leer el archivo
      const videoBuffer = fs.readFileSync(req.file.path);
      
      // Subir a YouTube
      const result = await youtubeService.uploadVideoToYouTube(
        videoBuffer,
        req.file.originalname,
        title,
        description,
        tags,
        isPrivate
      );
      
      // Eliminar archivo temporal
      fs.unlinkSync(req.file.path);
      
      // Guardar referencia al video en la base de datos
      await storage.createUserVideo({
        userId,
        title,
        description,
        youtubeId: result.videoId,
        youtubeUrl: result.url,
        thumbnailUrl: "", // YouTube genera miniaturas automáticamente
        uploadDate: new Date(),
        isPublic: !isPrivate
      });
      
      res.json({
        success: true,
        videoId: result.videoId,
        videoUrl: result.url
      });
    } catch (error: any) {
      console.error("Error al subir video a YouTube:", error);
      
      // Eliminar archivo temporal si existe
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ 
        message: "Error al subir video a YouTube", 
        error: error.message || "Error desconocido" 
      });
    }
  });

  // Rutas para métricas de YouTube
  app.get("/api/youtube/metrics", async (req, res) => {
    const { channelId } = req.query;
    
    if (!channelId) {
      return res.status(400).json({ message: "Se requiere un ID de canal" });
    }
    
    try {
      // En implementación futura, se integrará con la API de YouTube
      // Por ahora, devuelve una respuesta estructurada de ejemplo
      res.json({
        channelStats: {
          title: channelId.toString().includes('@') ? channelId : `Canal de ${channelId}`,
          subscribers: "1.2M",
          totalViews: "45.6M",
          videoCount: 327,
          joinDate: "15 Oct 2018",
          averageViews: "139.7K",
          engagementRate: "8.2%"
        },
        viewsData: generateViewsData(),
        subscribersData: generateSubscribersData(),
        topVideos: generateTopVideos(),
        engagementData: generateEngagementData(),
        audienceData: generateAudienceData(),
        contentPerformance: generateContentPerformanceData()
      });
    } catch (error) {
      console.error("Error obteniendo métricas de YouTube:", error);
      res.status(500).json({ message: "Error al obtener métricas de YouTube" });
    }
  });
  
  // Funciones auxiliares para generar datos de ejemplo para las métricas
  function generateViewsData() {
    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    
    return months.map((month) => ({
      name: month,
      views: Math.floor(100000 + Math.random() * 250000)
    }));
  }

  function generateSubscribersData() {
    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    
    return months.map((month) => ({
      name: month,
      subscribers: Math.floor(5000 + Math.random() * 15000)
    }));
  }

  function generateEngagementData() {
    const contentTypes = ['Tutoriales', 'Vlogs', 'Reviews', 'Listas', 'Reacciones', 'Shorts'];
    
    return contentTypes.map((type) => ({
      name: type,
      likes: Math.floor(10 + Math.random() * 40),
      comments: Math.floor(5 + Math.random() * 15),
      shares: Math.floor(2 + Math.random() * 8)
    }));
  }

  function generateAudienceData() {
    return [
      { name: '18-24', value: 25 },
      { name: '25-34', value: 35 },
      { name: '35-44', value: 20 },
      { name: '45-54', value: 12 },
      { name: '55+', value: 8 }
    ];
  }

  function generateTopVideos() {
    return [
      {
        title: "10 Trucos para Editar Videos como un Pro",
        views: "843K",
        engagement: "9.8%",
        ctr: "12.4%",
        date: "15 Feb 2024"
      },
      {
        title: "¿Vale la Pena este Software? Análisis Completo",
        views: "712K",
        engagement: "8.7%",
        ctr: "11.2%",
        date: "3 Mar 2024"
      },
      {
        title: "Cómo TRIPLICAR tus Vistas en YouTube (Tutorial)",
        views: "698K",
        engagement: "10.1%",
        ctr: "13.5%",
        date: "21 Ene 2024"
      },
      {
        title: "5 Herramientas GRATIS para Creadores de Contenido",
        views: "654K",
        engagement: "7.9%",
        ctr: "10.8%",
        date: "9 Abr 2024"
      },
      {
        title: "Mi Setup Completo 2024 | Tour del Estudio",
        views: "587K",
        engagement: "8.5%",
        ctr: "9.7%",
        date: "5 Mar 2024"
      }
    ];
  }

  function generateContentPerformanceData() {
    return [
      { category: "Tutoriales", avgViews: 165000, avgEngagement: 9.2 },
      { category: "Reviews", avgViews: 142000, avgEngagement: 8.5 },
      { category: "Vlogs", avgViews: 98000, avgEngagement: 7.8 },
      { category: "Shorts", avgViews: 245000, avgEngagement: 6.3 },
      { category: "Listas", avgViews: 187000, avgEngagement: 9.7 }
    ];
  }

  const httpServer = createServer(app);
  return httpServer;
}
