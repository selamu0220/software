import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateVideoIdea } from "./gemini";
import { createMonthlySubscription, createLifetimePayment, handleWebhook } from "./stripe";
import { 
  insertUserSchema, 
  generationRequestSchema, 
  insertCalendarEntrySchema,
  updateUserSchema
} from "@shared/schema";
import bcrypt from "bcryptjs";
import session from "express-session";
import MemoryStore from "memorystore";
import { z } from "zod";
import Stripe from "stripe";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create session store
  const SessionStore = MemoryStore(session);
  
  // Setup session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || "keyboard-cat",
    resave: false,
    saveUninitialized: false,
    store: new SessionStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: { 
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
    }
  }));

  // Middleware to check if user is authenticated
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Middleware to check if user is premium
  const requirePremium = async (req: Request, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user || (!user.isPremium && !user.lifetimeAccess)) {
      return res.status(403).json({ message: "Premium subscription required" });
    }
    
    next();
  };

  // Authentication APIs
  app.post("/api/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUsername = await storage.getUserByUsername(userData.username);
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
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating user" });
      }
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Set session
      req.session.userId = user.id;
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
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
      
      const updatedUser = await storage.updateUser(req.session.userId!, updates);
      
      // Return user without password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error updating user" });
      }
    }
  });

  // Video Idea Generation API
  app.post("/api/generate-idea", async (req, res) => {
    try {
      const params = generationRequestSchema.parse(req.body);
      
      // Check if this is an anonymous request (limit to 1 per session)
      if (!req.session.userId) {
        // We could implement rate limiting here for anonymous users
        // For now, we'll just generate the idea
      }
      
      const generatedIdea = await generateVideoIdea(params);
      
      // If user is logged in, save the idea
      if (req.session.userId) {
        const videoIdea = await storage.createVideoIdea({
          userId: req.session.userId,
          title: generatedIdea.title,
          category: params.category,
          subcategory: params.subcategory,
          videoLength: params.videoLength,
          content: generatedIdea
        });
      }
      
      res.json(generatedIdea);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        console.error("Error generating idea:", error);
        res.status(500).json({ message: "Error generating video idea" });
      }
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
        return res.status(403).json({ message: "Not authorized to view this idea" });
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
        return res.status(403).json({ message: "Not authorized to delete this idea" });
      }
      
      await storage.deleteVideoIdea(parseInt(req.params.id));
      res.json({ message: "Video idea deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting video idea" });
    }
  });

  // Calendar Management
  app.post("/api/calendar", requireAuth, async (req, res) => {
    try {
      const calendarData = insertCalendarEntrySchema.parse({
        ...req.body,
        userId: req.session.userId
      });
      
      const entry = await storage.createCalendarEntry(calendarData);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating calendar entry" });
      }
    }
  });

  app.get("/api/calendar", requireAuth, async (req, res) => {
    try {
      const entries = await storage.getCalendarEntriesByUser(req.session.userId!);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Error fetching calendar entries" });
    }
  });

  app.get("/api/calendar/month", requireAuth, async (req, res) => {
    try {
      const year = parseInt(req.query.year as string || new Date().getFullYear().toString());
      const month = parseInt(req.query.month as string || new Date().getMonth().toString());
      
      const entries = await storage.getCalendarEntriesByMonth(req.session.userId!, year, month);
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
        return res.status(403).json({ message: "Not authorized to update this entry" });
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
        return res.status(403).json({ message: "Not authorized to delete this entry" });
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
        user.username
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
        user.username
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
      const sig = req.headers['stripe-signature'];
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
          endpointSecret
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

  const httpServer = createServer(app);
  return httpServer;
}
