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

export const storage = new MemStorage();
