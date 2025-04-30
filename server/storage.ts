import { 
  users, 
  videoIdeas, 
  calendarEntries, 
  type User, 
  type InsertUser, 
  type VideoIdea, 
  type InsertVideoIdea, 
  type CalendarEntry, 
  type InsertCalendarEntry,
  type UpdateUser
} from "@shared/schema";
import { db } from "./db";
import { eq, and, SQL, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: UpdateUser): Promise<User>;
  updateUserPremiumStatus(id: number, isPremium: boolean, lifetimeAccess?: boolean): Promise<User>;
  updateStripeCustomerId(id: number, customerId: string): Promise<User>;
  updateUserStripeInfo(id: number, info: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User>;
  
  // Video idea operations
  createVideoIdea(idea: InsertVideoIdea): Promise<VideoIdea>;
  getVideoIdea(id: number): Promise<VideoIdea | undefined>;
  getVideoIdeasByUser(userId: number): Promise<VideoIdea[]>;
  getVideoIdeasByDateRange(userId: number, startDate: Date, endDate: Date): Promise<VideoIdea[]>;
  deleteVideoIdea(id: number): Promise<boolean>;
  
  // Calendar entries operations
  createCalendarEntry(entry: InsertCalendarEntry): Promise<CalendarEntry>;
  getCalendarEntry(id: number): Promise<CalendarEntry | undefined>;
  getCalendarEntriesByUser(userId: number): Promise<CalendarEntry[]>;
  getCalendarEntriesByMonth(userId: number, year: number, month: number): Promise<CalendarEntry[]>;
  updateCalendarEntry(id: number, updates: Partial<CalendarEntry>): Promise<CalendarEntry>;
  deleteCalendarEntry(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private videoIdeas: Map<number, VideoIdea>;
  private calendarEntries: Map<number, CalendarEntry>;
  private userIdCounter: number;
  private videoIdeaIdCounter: number;
  private calendarEntryIdCounter: number;

  constructor() {
    this.users = new Map();
    this.videoIdeas = new Map();
    this.calendarEntries = new Map();
    this.userIdCounter = 1;
    this.videoIdeaIdCounter = 1;
    this.calendarEntryIdCounter = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      isPremium: false, 
      lifetimeAccess: false,
      createdAt: now,
      stripeCustomerId: null,
      stripeSubscriptionId: null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: UpdateUser): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserPremiumStatus(id: number, isPremium: boolean, lifetimeAccess = false): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    const updatedUser = { ...user, isPremium, lifetimeAccess };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateStripeCustomerId(id: number, customerId: string): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    const updatedUser = { ...user, stripeCustomerId: customerId };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserStripeInfo(id: number, info: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    const updatedUser = { 
      ...user, 
      stripeCustomerId: info.stripeCustomerId, 
      stripeSubscriptionId: info.stripeSubscriptionId,
      isPremium: true
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Video idea operations
  async createVideoIdea(idea: InsertVideoIdea): Promise<VideoIdea> {
    const id = this.videoIdeaIdCounter++;
    const now = new Date();
    const videoIdea: VideoIdea = { ...idea, id, createdAt: now };
    this.videoIdeas.set(id, videoIdea);
    return videoIdea;
  }

  async getVideoIdea(id: number): Promise<VideoIdea | undefined> {
    return this.videoIdeas.get(id);
  }

  async getVideoIdeasByUser(userId: number): Promise<VideoIdea[]> {
    return Array.from(this.videoIdeas.values()).filter(
      (idea) => idea.userId === userId,
    );
  }
  
  async getVideoIdeasByDateRange(userId: number, startDate: Date, endDate: Date): Promise<VideoIdea[]> {
    const ideas = await this.getVideoIdeasByUser(userId);
    return ideas.filter(idea => {
      const createdAt = new Date(idea.createdAt);
      return createdAt >= startDate && createdAt <= endDate;
    });
  }

  async deleteVideoIdea(id: number): Promise<boolean> {
    return this.videoIdeas.delete(id);
  }

  // Calendar entries operations
  async createCalendarEntry(entry: InsertCalendarEntry): Promise<CalendarEntry> {
    const id = this.calendarEntryIdCounter++;
    const calendarEntry: CalendarEntry = { ...entry, id };
    this.calendarEntries.set(id, calendarEntry);
    return calendarEntry;
  }

  async getCalendarEntry(id: number): Promise<CalendarEntry | undefined> {
    return this.calendarEntries.get(id);
  }

  async getCalendarEntriesByUser(userId: number): Promise<CalendarEntry[]> {
    return Array.from(this.calendarEntries.values()).filter(
      (entry) => entry.userId === userId,
    );
  }

  async getCalendarEntriesByMonth(userId: number, year: number, month: number): Promise<CalendarEntry[]> {
    const entries = await this.getCalendarEntriesByUser(userId);
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getFullYear() === year && entryDate.getMonth() === month;
    });
  }

  async updateCalendarEntry(id: number, updates: Partial<CalendarEntry>): Promise<CalendarEntry> {
    const entry = await this.getCalendarEntry(id);
    if (!entry) {
      throw new Error(`Calendar entry with id ${id} not found`);
    }
    const updatedEntry = { ...entry, ...updates };
    this.calendarEntries.set(id, updatedEntry);
    return updatedEntry;
  }

  async deleteCalendarEntry(id: number): Promise<boolean> {
    return this.calendarEntries.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      isPremium: false,
      lifetimeAccess: false,
    }).returning();
    return user;
  }

  async updateUser(id: number, updates: UpdateUser): Promise<User> {
    const [user] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    
    return user;
  }

  async updateUserPremiumStatus(id: number, isPremium: boolean, lifetimeAccess = false): Promise<User> {
    const [user] = await db.update(users)
      .set({ isPremium, lifetimeAccess })
      .where(eq(users.id, id))
      .returning();
    
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    
    return user;
  }

  async updateStripeCustomerId(id: number, customerId: string): Promise<User> {
    const [user] = await db.update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, id))
      .returning();
    
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    
    return user;
  }

  async updateUserStripeInfo(id: number, info: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User> {
    const [user] = await db.update(users)
      .set({ 
        stripeCustomerId: info.stripeCustomerId,
        stripeSubscriptionId: info.stripeSubscriptionId,
        isPremium: true
      })
      .where(eq(users.id, id))
      .returning();
    
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    
    return user;
  }

  // Video idea operations
  async createVideoIdea(idea: InsertVideoIdea): Promise<VideoIdea> {
    const [videoIdea] = await db.insert(videoIdeas)
      .values(idea)
      .returning();
    
    return videoIdea;
  }

  async getVideoIdea(id: number): Promise<VideoIdea | undefined> {
    const [videoIdea] = await db.select()
      .from(videoIdeas)
      .where(eq(videoIdeas.id, id));
    
    return videoIdea;
  }

  async getVideoIdeasByUser(userId: number): Promise<VideoIdea[]> {
    return db.select()
      .from(videoIdeas)
      .where(eq(videoIdeas.userId, userId));
  }
  
  async getVideoIdeasByDateRange(userId: number, startDate: Date, endDate: Date): Promise<VideoIdea[]> {
    return db.select()
      .from(videoIdeas)
      .where(
        and(
          eq(videoIdeas.userId, userId),
          sql`${videoIdeas.createdAt} >= ${startDate}`,
          sql`${videoIdeas.createdAt} <= ${endDate}`
        )
      );
  }

  async deleteVideoIdea(id: number): Promise<boolean> {
    const result = await db.delete(videoIdeas)
      .where(eq(videoIdeas.id, id))
      .returning({ id: videoIdeas.id });
    
    return result.length > 0;
  }

  // Calendar entries operations
  async createCalendarEntry(entry: InsertCalendarEntry): Promise<CalendarEntry> {
    const [calendarEntry] = await db.insert(calendarEntries)
      .values(entry)
      .returning();
    
    return calendarEntry;
  }

  async getCalendarEntry(id: number): Promise<CalendarEntry | undefined> {
    const [entry] = await db.select()
      .from(calendarEntries)
      .where(eq(calendarEntries.id, id));
    
    return entry;
  }

  async getCalendarEntriesByUser(userId: number): Promise<CalendarEntry[]> {
    return db.select()
      .from(calendarEntries)
      .where(eq(calendarEntries.userId, userId));
  }

  async getCalendarEntriesByMonth(userId: number, year: number, month: number): Promise<CalendarEntry[]> {
    // Create start and end dates for the month
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999); // Last day of month
    
    return db.select()
      .from(calendarEntries)
      .where(
        and(
          eq(calendarEntries.userId, userId),
          sql`${calendarEntries.date} >= ${startDate}`,
          sql`${calendarEntries.date} <= ${endDate}`
        )
      );
  }

  async updateCalendarEntry(id: number, updates: Partial<CalendarEntry>): Promise<CalendarEntry> {
    const [entry] = await db.update(calendarEntries)
      .set(updates)
      .where(eq(calendarEntries.id, id))
      .returning();
    
    if (!entry) {
      throw new Error(`Calendar entry with id ${id} not found`);
    }
    
    return entry;
  }

  async deleteCalendarEntry(id: number): Promise<boolean> {
    const result = await db.delete(calendarEntries)
      .where(eq(calendarEntries.id, id))
      .returning({ id: calendarEntries.id });
    
    return result.length > 0;
  }
}

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
