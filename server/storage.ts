import { 
  users, 
  videoIdeas, 
  calendarEntries,
  userVideos,
  blogPosts,
  blogCategories,
  blogPostCategories,
  userResourceCollections,
  userResourceItems,
  userScriptCollections,
  userScripts,
  resources,
  type User, 
  type InsertUser, 
  type VideoIdea, 
  type InsertVideoIdea, 
  type CalendarEntry, 
  type InsertCalendarEntry,
  type UserVideo,
  type InsertUserVideo,
  type UpdateUser,
  type BlogPost,
  type InsertBlogPost,
  type BlogCategory,
  type InsertBlogCategory,
  type BlogPostCategory,
  type InsertBlogPostCategory,
  type UserResourceCollection,
  type InsertUserResourceCollection,
  type UserResourceItem,
  type InsertUserResourceItem,
  type UserScriptCollection,
  type InsertUserScriptCollection,
  type UserScript,
  type InsertUserScript,
  type Resource
} from "@shared/schema";
import { db } from "./db";
import { eq, and, SQL, sql, desc, asc, isNotNull, lte, gt, gte } from "drizzle-orm";

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
  
  // Biblioteca personal de recursos - Operaciones
  createResourceCollection(collection: InsertUserResourceCollection): Promise<UserResourceCollection>;
  getResourceCollectionsByUser(userId: number): Promise<UserResourceCollection[]>;
  getResourceCollection(id: number): Promise<UserResourceCollection | undefined>;
  updateResourceCollection(id: number, data: Partial<InsertUserResourceCollection>): Promise<UserResourceCollection>;
  deleteResourceCollection(id: number): Promise<boolean>;
  
  // Operaciones para elementos de colecciones de recursos
  addResourceToCollection(item: InsertUserResourceItem): Promise<UserResourceItem>;
  getResourceItemsByCollection(collectionId: number): Promise<(UserResourceItem & { resource: Resource })[]>;
  getResourceItem(id: number): Promise<UserResourceItem | undefined>;
  updateResourceItem(id: number, data: Partial<InsertUserResourceItem>): Promise<UserResourceItem>;
  removeResourceFromCollection(id: number): Promise<boolean>;
  
  // Biblioteca personal de guiones - Operaciones
  createScriptCollection(collection: InsertUserScriptCollection): Promise<UserScriptCollection>;
  getScriptCollectionsByUser(userId: number): Promise<UserScriptCollection[]>;
  getScriptCollection(id: number): Promise<UserScriptCollection | undefined>;
  updateScriptCollection(id: number, data: Partial<InsertUserScriptCollection>): Promise<UserScriptCollection>;
  deleteScriptCollection(id: number): Promise<boolean>;
  
  // Operaciones para guiones en colecciones
  addScriptToCollection(script: InsertUserScript): Promise<UserScript>;
  getScriptsByCollection(collectionId: number): Promise<UserScript[]>;
  getScript(id: number): Promise<UserScript | undefined>;
  updateScript(id: number, data: Partial<InsertUserScript>): Promise<UserScript>;
  deleteScript(id: number): Promise<boolean>;
  getCalendarEntriesByMonth(userId: number, year: number, month: number): Promise<CalendarEntry[]>;
  updateCalendarEntry(id: number, updates: Partial<CalendarEntry>): Promise<CalendarEntry>;
  deleteCalendarEntry(id: number): Promise<boolean>;
  
  // User videos operations
  createUserVideo(video: InsertUserVideo): Promise<UserVideo>;
  getUserVideo(id: number): Promise<UserVideo | undefined>;
  getUserVideosByUser(userId: number): Promise<UserVideo[]>;
  deleteUserVideo(id: number): Promise<boolean>;
  updateUserVideo(id: number, updates: Partial<UserVideo>): Promise<UserVideo>;
  
  // Blog operations
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  getBlogPost(id: number): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  getAllBlogPosts(limit?: number, offset?: number): Promise<BlogPost[]>;
  getPublishedBlogPosts(limit?: number, offset?: number): Promise<BlogPost[]>;
  getFeaturedBlogPosts(limit?: number): Promise<BlogPost[]>;
  getBlogPostsByUser(userId: number): Promise<BlogPost[]>;
  updateBlogPost(id: number, updates: Partial<BlogPost>): Promise<BlogPost>;
  deleteBlogPost(id: number): Promise<boolean>;
  
  // Blog category operations
  createBlogCategory(category: InsertBlogCategory): Promise<BlogCategory>;
  getBlogCategory(id: number): Promise<BlogCategory | undefined>;
  getBlogCategoryBySlug(slug: string): Promise<BlogCategory | undefined>;
  getAllBlogCategories(): Promise<BlogCategory[]>;
  updateBlogCategory(id: number, updates: Partial<BlogCategory>): Promise<BlogCategory>;
  deleteBlogCategory(id: number): Promise<boolean>;
  
  // Blog post-category relationship operations
  addCategoryToBlogPost(postId: number, categoryId: number): Promise<BlogPostCategory>;
  removeCategoryFromBlogPost(postId: number, categoryId: number): Promise<boolean>;
  getBlogPostCategories(postId: number): Promise<BlogCategory[]>;
  getBlogPostsByCategory(categoryId: number): Promise<BlogPost[]>;
  getBlogPostsForScheduledPublishing(currentDate: Date): Promise<BlogPost[]>;
  
  // Resource operations
  getResourceCategoryBySlug(slug: string): Promise<any | undefined>;
  getResourceSubcategoryBySlug(slug: string): Promise<any | undefined>;
  createResource(resourceData: any): Promise<any>;
  getResource(id: number): Promise<any | undefined>;
  getResourceBySlug(slug: string): Promise<any | undefined>;
  getAllResources(limit?: number, offset?: number): Promise<any[]>;
  getPublicResources(limit?: number, offset?: number): Promise<any[]>;
  getFeaturedResources(limit?: number): Promise<any[]>;
  getResourcesByUser(userId: number): Promise<any[]>;
  getResourcesByCategory(categoryId: number, limit?: number, offset?: number): Promise<any[]>;
  getResourcesBySubcategory(subcategoryId: number, limit?: number, offset?: number): Promise<any[]>;
  updateResource(id: number, updates: any): Promise<any>;
  deleteResource(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private videoIdeas: Map<number, VideoIdea>;
  private calendarEntries: Map<number, CalendarEntry>;
  private userVideos: Map<number, UserVideo>;
  private blogPosts: Map<number, BlogPost>;
  private blogCategories: Map<number, BlogCategory>;
  private blogPostCategories: Map<number, BlogPostCategory>;
  private userIdCounter: number;
  private videoIdeaIdCounter: number;
  private calendarEntryIdCounter: number;
  private userVideoIdCounter: number;
  private blogPostIdCounter: number;
  private blogCategoryIdCounter: number;
  private blogPostCategoryIdCounter: number;

  constructor() {
    this.users = new Map();
    this.videoIdeas = new Map();
    this.calendarEntries = new Map();
    this.userVideos = new Map();
    this.blogPosts = new Map();
    this.blogCategories = new Map();
    this.blogPostCategories = new Map();
    this.userIdCounter = 1;
    this.videoIdeaIdCounter = 1;
    this.calendarEntryIdCounter = 1;
    this.userVideoIdCounter = 1;
    this.blogPostIdCounter = 1;
    this.blogCategoryIdCounter = 1;
    this.blogPostCategoryIdCounter = 1;
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
    // Ensure userId is always defined as required by VideoIdea type
    const videoIdea: VideoIdea = { 
      ...idea, 
      id, 
      createdAt: now,
      userId: idea.userId || null 
    };
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
    // Ensure optional fields are properly set for CalendarEntry type
    const calendarEntry: CalendarEntry = { 
      ...entry, 
      id,
      videoIdeaId: entry.videoIdeaId || null,
      completed: entry.completed ?? false
    };
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
  
  // User videos operations
  async createUserVideo(video: InsertUserVideo): Promise<UserVideo> {
    const id = this.userVideoIdCounter++;
    const now = new Date();
    // Ensure optional fields are properly set for UserVideo type
    const userVideo: UserVideo = { 
      ...video, 
      id, 
      uploadDate: now,
      description: video.description || null,
      duration: video.duration || null,
      thumbnailPath: video.thumbnailPath || null,
      isPublic: video.isPublic ?? false
    };
    this.userVideos.set(id, userVideo);
    return userVideo;
  }

  async getUserVideo(id: number): Promise<UserVideo | undefined> {
    return this.userVideos.get(id);
  }

  async getUserVideosByUser(userId: number): Promise<UserVideo[]> {
    return Array.from(this.userVideos.values()).filter(
      (video) => video.userId === userId,
    );
  }

  async deleteUserVideo(id: number): Promise<boolean> {
    return this.userVideos.delete(id);
  }

  async updateUserVideo(id: number, updates: Partial<UserVideo>): Promise<UserVideo> {
    const video = await this.getUserVideo(id);
    if (!video) {
      throw new Error(`User video with id ${id} not found`);
    }
    const updatedVideo = { ...video, ...updates };
    this.userVideos.set(id, updatedVideo);
    return updatedVideo;
  }

  // Blog post operations
  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const id = this.blogPostIdCounter++;
    const now = new Date();
    
    const blogPost: BlogPost = {
      id,
      ...post,
      createdAt: now,
      updatedAt: now
    };
    
    this.blogPosts.set(id, blogPost);
    return blogPost;
  }
  
  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    return this.blogPosts.get(id);
  }
  
  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    return Array.from(this.blogPosts.values()).find(post => post.slug === slug);
  }
  
  async getAllBlogPosts(limit = 10, offset = 0): Promise<BlogPost[]> {
    return Array.from(this.blogPosts.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }
  
  async getPublishedBlogPosts(limit = 10, offset = 0): Promise<BlogPost[]> {
    return Array.from(this.blogPosts.values())
      .filter(post => post.published)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }
  
  async getFeaturedBlogPosts(limit = 3): Promise<BlogPost[]> {
    return Array.from(this.blogPosts.values())
      .filter(post => post.published && post.featured)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
  
  async getBlogPostsByUser(userId: number): Promise<BlogPost[]> {
    return Array.from(this.blogPosts.values())
      .filter(post => post.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async updateBlogPost(id: number, updates: Partial<BlogPost>): Promise<BlogPost> {
    const post = await this.getBlogPost(id);
    if (!post) {
      throw new Error(`Blog post with id ${id} not found`);
    }
    
    const updatedPost = { 
      ...post, 
      ...updates,
      updatedAt: new Date() 
    };
    
    this.blogPosts.set(id, updatedPost);
    return updatedPost;
  }
  
  async deleteBlogPost(id: number): Promise<boolean> {
    return this.blogPosts.delete(id);
  }
  
  // Blog category operations
  async createBlogCategory(category: InsertBlogCategory): Promise<BlogCategory> {
    const id = this.blogCategoryIdCounter++;
    const now = new Date();
    
    const blogCategory: BlogCategory = {
      id,
      ...category,
      createdAt: now
    };
    
    this.blogCategories.set(id, blogCategory);
    return blogCategory;
  }
  
  async getBlogCategory(id: number): Promise<BlogCategory | undefined> {
    return this.blogCategories.get(id);
  }
  
  async getBlogCategoryBySlug(slug: string): Promise<BlogCategory | undefined> {
    return Array.from(this.blogCategories.values()).find(category => category.slug === slug);
  }
  
  async getAllBlogCategories(): Promise<BlogCategory[]> {
    return Array.from(this.blogCategories.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  
  async updateBlogCategory(id: number, updates: Partial<BlogCategory>): Promise<BlogCategory> {
    const category = await this.getBlogCategory(id);
    if (!category) {
      throw new Error(`Blog category with id ${id} not found`);
    }
    
    const updatedCategory = { ...category, ...updates };
    this.blogCategories.set(id, updatedCategory);
    return updatedCategory;
  }
  
  async deleteBlogCategory(id: number): Promise<boolean> {
    return this.blogCategories.delete(id);
  }
  
  // Blog post-category relationship operations
  async addCategoryToBlogPost(postId: number, categoryId: number): Promise<BlogPostCategory> {
    const post = await this.getBlogPost(postId);
    if (!post) {
      throw new Error(`Blog post with id ${postId} not found`);
    }
    
    const category = await this.getBlogCategory(categoryId);
    if (!category) {
      throw new Error(`Blog category with id ${categoryId} not found`);
    }
    
    const id = this.blogPostCategoryIdCounter++;
    const postCategory: BlogPostCategory = {
      id,
      postId,
      categoryId
    };
    
    this.blogPostCategories.set(id, postCategory);
    return postCategory;
  }
  
  async removeCategoryFromBlogPost(postId: number, categoryId: number): Promise<boolean> {
    const postCategory = Array.from(this.blogPostCategories.values())
      .find(pc => pc.postId === postId && pc.categoryId === categoryId);
      
    if (!postCategory) {
      return false;
    }
    
    return this.blogPostCategories.delete(postCategory.id);
  }
  
  async getBlogPostCategories(postId: number): Promise<BlogCategory[]> {
    const postCategoryIds = Array.from(this.blogPostCategories.values())
      .filter(pc => pc.postId === postId)
      .map(pc => pc.categoryId);
      
    return postCategoryIds.map(id => this.blogCategories.get(id)!)
      .filter(Boolean);
  }
  
  async getBlogPostsByCategory(categoryId: number): Promise<BlogPost[]> {
    const categoryPostIds = Array.from(this.blogPostCategories.values())
      .filter(pc => pc.categoryId === categoryId)
      .map(pc => pc.postId);
      
    return categoryPostIds.map(id => this.blogPosts.get(id)!)
      .filter(Boolean)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  /**
   * Busca los artículos que deben ser publicados automáticamente
   * Encuentra artículos donde published=false y publishedAt <= fecha actual
   */
  async getBlogPostsForScheduledPublishing(currentDate: Date): Promise<BlogPost[]> {
    return Array.from(this.blogPosts.values())
      .filter(post => {
        return !post.published && 
               post.publishedAt && 
               post.publishedAt <= currentDate;
      })
      .sort((a, b) => a.publishedAt.getTime() - b.publishedAt.getTime());
  }

  // Resource operations
  private resourceCategories = new Map<number, any>();
  private resourceSubcategories = new Map<number, any>();
  private resources = new Map<number, any>();
  private resourceComments = new Map<number, any>();
  private resourceCategoryIdCounter = 1;
  private resourceSubcategoryIdCounter = 1;
  private resourceIdCounter = 1;
  private resourceCommentIdCounter = 1;

  async getResourceCategoryBySlug(slug: string): Promise<any | undefined> {
    return Array.from(this.resourceCategories.values()).find(
      (category) => category.slug === slug,
    );
  }

  async getResourceSubcategoryBySlug(slug: string): Promise<any | undefined> {
    return Array.from(this.resourceSubcategories.values()).find(
      (subcategory) => subcategory.slug === slug,
    );
  }

  async createResource(resourceData: any): Promise<any> {
    const id = this.resourceIdCounter++;
    const now = new Date();
    
    const resource = {
      id,
      ...resourceData,
      createdAt: now,
      updatedAt: now,
      viewCount: 0,
      downloadCount: 0,
      likesCount: 0,
      dislikesCount: 0,
    };
    
    this.resources.set(id, resource);
    return resource;
  }

  async getResource(id: number): Promise<any | undefined> {
    return this.resources.get(id);
  }

  async getResourceBySlug(slug: string): Promise<any | undefined> {
    return Array.from(this.resources.values()).find(
      (resource) => resource.slug === slug,
    );
  }

  async getAllResources(limit = 10, offset = 0): Promise<any[]> {
    return Array.from(this.resources.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }

  async getPublicResources(limit = 10, offset = 0): Promise<any[]> {
    return Array.from(this.resources.values())
      .filter((resource) => resource.isPublic)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }

  async getFeaturedResources(limit = 5): Promise<any[]> {
    return Array.from(this.resources.values())
      .filter((resource) => resource.isPublic && resource.isFeatured)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getResourcesByUser(userId: number): Promise<any[]> {
    return Array.from(this.resources.values())
      .filter((resource) => resource.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getResourcesByCategory(categoryId: number, limit = 10, offset = 0): Promise<any[]> {
    return Array.from(this.resources.values())
      .filter((resource) => resource.categoryId === categoryId && resource.isPublic)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }

  async getResourcesBySubcategory(subcategoryId: number, limit = 10, offset = 0): Promise<any[]> {
    return Array.from(this.resources.values())
      .filter((resource) => resource.subcategoryId === subcategoryId && resource.isPublic)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }

  async updateResource(id: number, updates: any): Promise<any> {
    const resource = await this.getResource(id);
    if (!resource) {
      throw new Error(`Resource with id ${id} not found`);
    }
    
    const updatedResource = { 
      ...resource, 
      ...updates,
      updatedAt: new Date() 
    };
    
    this.resources.set(id, updatedResource);
    return updatedResource;
  }

  async deleteResource(id: number): Promise<boolean> {
    return this.resources.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  // Recurso operaciones - implementación temporal, usar tablas reales en producción
  async getResourceCategoryBySlug(slug: string): Promise<any | undefined> {
    // Implementación temporal para categorías de recursos
    const categories = [
      { id: 1, name: 'IA', slug: 'ia', description: 'Herramientas de inteligencia artificial' },
      { id: 2, name: 'Plugins', slug: 'plugins', description: 'Plugins para diferentes plataformas' },
      { id: 3, name: 'Software', slug: 'software', description: 'Software para creadores' },
      { id: 4, name: 'Extensiones', slug: 'extensiones', description: 'Extensiones para navegadores' }
    ];
    return categories.find(c => c.slug === slug);
  }

  async getResourceSubcategoryBySlug(slug: string): Promise<any | undefined> {
    // Implementación temporal para subcategorías
    const subcategories = [
      { id: 1, categoryId: 1, name: 'Generación de texto', slug: 'generacion-texto' },
      { id: 2, categoryId: 1, name: 'Generación de imágenes', slug: 'generacion-imagenes' },
      { id: 3, categoryId: 2, name: 'Plugins para Premiere', slug: 'plugins-premiere' },
      { id: 4, categoryId: 2, name: 'Plugins para After Effects', slug: 'plugins-after-effects' },
      { id: 5, categoryId: 3, name: 'Editores de video', slug: 'editores-video' },
      { id: 6, categoryId: 3, name: 'Teleprompters', slug: 'teleprompters' },
      { id: 7, categoryId: 4, name: 'Extensiones para Chrome', slug: 'extensiones-chrome' },
      { id: 8, categoryId: 4, name: 'Extensiones para Firefox', slug: 'extensiones-firefox' }
    ];
    return subcategories.find(s => s.slug === slug);
  }

  async createResource(resourceData: any): Promise<any> {
    // Implementación temporal, debe usar tablas reales en producción
    const resourceWithId = {
      ...resourceData,
      id: Date.now(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return resourceWithId;
  }

  async getResource(id: number): Promise<any | undefined> {
    // Implementación temporal
    return undefined;
  }

  async getResourceBySlug(slug: string): Promise<any | undefined> {
    // Implementación temporal
    return undefined;
  }

  async getAllResources(limit?: number, offset?: number): Promise<any[]> {
    // Implementación temporal
    return [];
  }

  async getPublicResources(limit?: number, offset?: number): Promise<any[]> {
    // Implementación temporal
    return [];
  }

  async getFeaturedResources(limit?: number): Promise<any[]> {
    // Implementación temporal
    return [];
  }

  async getResourcesByUser(userId: number): Promise<any[]> {
    // Implementación temporal
    return [];
  }

  async getResourcesByCategory(categoryId: number, limit?: number, offset?: number): Promise<any[]> {
    // Implementación temporal
    return [];
  }

  async getResourcesBySubcategory(subcategoryId: number, limit?: number, offset?: number): Promise<any[]> {
    // Implementación temporal
    return [];
  }

  async updateResource(id: number, updates: any): Promise<any> {
    // Implementación temporal
    return { id, ...updates };
  }

  async deleteResource(id: number): Promise<boolean> {
    // Implementación temporal
    return true;
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
  
  // User videos operations
  async createUserVideo(video: InsertUserVideo): Promise<UserVideo> {
    const [userVideo] = await db.insert(userVideos)
      .values(video)
      .returning();
    
    return userVideo;
  }

  async getUserVideo(id: number): Promise<UserVideo | undefined> {
    const [video] = await db.select()
      .from(userVideos)
      .where(eq(userVideos.id, id));
    
    return video;
  }

  async getUserVideosByUser(userId: number): Promise<UserVideo[]> {
    return db.select()
      .from(userVideos)
      .where(eq(userVideos.userId, userId));
  }

  async deleteUserVideo(id: number): Promise<boolean> {
    const result = await db.delete(userVideos)
      .where(eq(userVideos.id, id))
      .returning({ id: userVideos.id });
    
    return result.length > 0;
  }

  async updateUserVideo(id: number, updates: Partial<UserVideo>): Promise<UserVideo> {
    const [video] = await db.update(userVideos)
      .set(updates)
      .where(eq(userVideos.id, id))
      .returning();
    
    if (!video) {
      throw new Error(`User video with id ${id} not found`);
    }
    
    return video;
  }

  // Blog posts methods
  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const [blogPost] = await db
      .insert(blogPosts)
      .values(post)
      .returning();
    
    return blogPost;
  }

  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    const [blogPost] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, id));
    
    return blogPost;
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [blogPost] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug));
    
    return blogPost;
  }

  async getAllBlogPosts(limit = 10, offset = 0): Promise<BlogPost[]> {
    return await db
      .select()
      .from(blogPosts)
      .orderBy(desc(blogPosts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getPublishedBlogPosts(limit = 10, offset = 0): Promise<BlogPost[]> {
    return await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.published, true))
      .orderBy(desc(blogPosts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getFeaturedBlogPosts(limit = 3): Promise<BlogPost[]> {
    return await db
      .select()
      .from(blogPosts)
      .where(and(
        eq(blogPosts.published, true),
        eq(blogPosts.featured, true)
      ))
      .orderBy(desc(blogPosts.createdAt))
      .limit(limit);
  }

  async getBlogPostsByUser(userId: number): Promise<BlogPost[]> {
    return await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.userId, userId))
      .orderBy(desc(blogPosts.createdAt));
  }

  async updateBlogPost(id: number, updates: Partial<BlogPost>): Promise<BlogPost> {
    const [blogPost] = await db
      .update(blogPosts)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(blogPosts.id, id))
      .returning();
    
    if (!blogPost) {
      throw new Error(`Blog post with id ${id} not found`);
    }
    
    return blogPost;
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    const result = await db
      .delete(blogPosts)
      .where(eq(blogPosts.id, id))
      .returning({ id: blogPosts.id });
    
    return result.length > 0;
  }

  // Blog categories methods
  async createBlogCategory(category: InsertBlogCategory): Promise<BlogCategory> {
    const [blogCategory] = await db
      .insert(blogCategories)
      .values(category)
      .returning();
    
    return blogCategory;
  }

  async getBlogCategory(id: number): Promise<BlogCategory | undefined> {
    const [blogCategory] = await db
      .select()
      .from(blogCategories)
      .where(eq(blogCategories.id, id));
    
    return blogCategory;
  }

  async getBlogCategoryBySlug(slug: string): Promise<BlogCategory | undefined> {
    const [blogCategory] = await db
      .select()
      .from(blogCategories)
      .where(eq(blogCategories.slug, slug));
    
    return blogCategory;
  }

  async getAllBlogCategories(): Promise<BlogCategory[]> {
    return await db
      .select()
      .from(blogCategories)
      .orderBy(asc(blogCategories.name));
  }

  async updateBlogCategory(id: number, updates: Partial<BlogCategory>): Promise<BlogCategory> {
    const [blogCategory] = await db
      .update(blogCategories)
      .set(updates)
      .where(eq(blogCategories.id, id))
      .returning();
    
    if (!blogCategory) {
      throw new Error(`Blog category with id ${id} not found`);
    }
    
    return blogCategory;
  }

  async deleteBlogCategory(id: number): Promise<boolean> {
    const result = await db
      .delete(blogCategories)
      .where(eq(blogCategories.id, id))
      .returning({ id: blogCategories.id });
    
    return result.length > 0;
  }

  // Blog post-category relationship methods
  async addCategoryToBlogPost(postId: number, categoryId: number): Promise<BlogPostCategory> {
    const [postCategory] = await db
      .insert(blogPostCategories)
      .values({
        postId,
        categoryId
      })
      .returning();
    
    return postCategory;
  }

  async removeCategoryFromBlogPost(postId: number, categoryId: number): Promise<boolean> {
    const result = await db
      .delete(blogPostCategories)
      .where(and(
        eq(blogPostCategories.postId, postId),
        eq(blogPostCategories.categoryId, categoryId)
      ))
      .returning({ id: blogPostCategories.id });
    
    return result.length > 0;
  }

  async getBlogPostCategories(postId: number): Promise<BlogCategory[]> {
    const postCategories = await db
      .select({
        category: blogCategories
      })
      .from(blogPostCategories)
      .innerJoin(blogCategories, eq(blogPostCategories.categoryId, blogCategories.id))
      .where(eq(blogPostCategories.postId, postId));
    
    return postCategories.map(row => row.category);
  }

  async getBlogPostsByCategory(categoryId: number): Promise<BlogPost[]> {
    const postsByCategory = await db
      .select({
        post: blogPosts
      })
      .from(blogPostCategories)
      .innerJoin(blogPosts, eq(blogPostCategories.postId, blogPosts.id))
      .where(eq(blogPostCategories.categoryId, categoryId))
      .orderBy(desc(blogPosts.createdAt));
    
    return postsByCategory.map(row => row.post);
  }
  
  /**
   * Busca los artículos que deben ser publicados automáticamente
   * Encuentra artículos donde published=false y publishedAt <= fecha actual
   */
  async getBlogPostsForScheduledPublishing(currentDate: Date): Promise<BlogPost[]> {
    try {
      const result = await db.select().from(blogPosts).where(
        and(
          eq(blogPosts.published, false),
          isNotNull(blogPosts.publishedAt),
          lte(blogPosts.publishedAt, currentDate)
        )
      );
      
      return result;
    } catch (error) {
      console.error("Error fetching blog posts for scheduled publishing:", error);
      return [];
    }
  }
}

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
