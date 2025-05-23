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
  resourceCategories,
  resourceSubcategories,
  resourceComments,
  contentStrategies,
  contentStrategyConfigs,
  contentStrategyTemplates,
  strategyGeneratedContent,
  contentStrategiesWorkbook,
  type User, 
  type InsertUser, 
  type VideoIdea, 
  type InsertVideoIdea, 
  type UpdateVideoIdea,
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
  type Resource,
  type ResourceCategory,
  type InsertResourceCategory,
  type ResourceSubcategory,
  type InsertResourceSubcategory,
  type ContentStrategy,
  type InsertContentStrategy,
  type ContentStrategyConfig,
  type InsertContentStrategyConfig,
  type ContentStrategyTemplate,
  type InsertContentStrategyTemplate,
  type StrategyGeneratedContent,
  type InsertStrategyGeneratedContent,
  type ContentStrategyWorkbook
} from "@shared/schema";
import { db } from "./db";
import { eq, and, SQL, sql, desc, asc, isNotNull, lte, gt, gte, count } from "drizzle-orm";

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
  
  // Estrategias de contenido - Sistema nuevo
  getContentStrategy(id: number): Promise<ContentStrategy | undefined>;
  getContentStrategyByUser(userId: number): Promise<ContentStrategy[]>;
  getPublicContentStrategies(): Promise<ContentStrategy[]>;
  createContentStrategy(strategy: InsertContentStrategy): Promise<ContentStrategy>;
  updateContentStrategy(id: number, strategy: Partial<ContentStrategy>): Promise<ContentStrategy | undefined>;
  deleteContentStrategy(id: number): Promise<boolean>;
  
  // Configuración de estrategias
  getContentStrategyConfig(strategyId: number): Promise<ContentStrategyConfig | undefined>;
  createContentStrategyConfig(config: InsertContentStrategyConfig): Promise<ContentStrategyConfig>;
  updateContentStrategyConfig(id: number, config: Partial<ContentStrategyConfig>): Promise<ContentStrategyConfig | undefined>;
  
  // Plantillas de estrategias
  getContentStrategyTemplates(strategyId: number): Promise<ContentStrategyTemplate[]>;
  getContentStrategyTemplatesByDay(strategyId: number, dayOfWeek: number): Promise<ContentStrategyTemplate[]>;
  createContentStrategyTemplate(template: InsertContentStrategyTemplate): Promise<ContentStrategyTemplate>;
  updateContentStrategyTemplate(id: number, template: Partial<ContentStrategyTemplate>): Promise<ContentStrategyTemplate | undefined>;
  deleteContentStrategyTemplate(id: number): Promise<boolean>;
  
  // Contenido generado con estrategias
  createStrategyGeneratedContent(content: InsertStrategyGeneratedContent): Promise<StrategyGeneratedContent>;
  getStrategyGeneratedContent(id: number): Promise<StrategyGeneratedContent | undefined>;
  getStrategyGeneratedContentByUser(userId: number): Promise<StrategyGeneratedContent[]>;
  getStrategyGeneratedContentByStrategy(strategyId: number): Promise<StrategyGeneratedContent[]>;
  updateStrategyGeneratedContent(id: number, content: Partial<StrategyGeneratedContent>): Promise<StrategyGeneratedContent | undefined>;
  deleteStrategyGeneratedContent(id: number): Promise<boolean>;
  
  // Sistema de votación para recursos
  getUserVote(userId: number, resourceId: number): Promise<any>;
  createResourceVote(vote: { userId: number; resourceId: number; score: number }): Promise<any>;
  updateResourceVote(id: number, voteData: Partial<any>): Promise<any>;
  
  // Sistema de comentarios para recursos
  getResourceComments(resourceId: number): Promise<any[]>;
  createResourceComment(comment: { resourceId: number; userId: number; content: string; rating: number | null }): Promise<any>;
  
  // Video idea operations
  createVideoIdea(idea: InsertVideoIdea): Promise<VideoIdea>;
  getVideoIdea(id: number): Promise<VideoIdea | undefined>;
  getVideoIdeaBySlug(slug: string): Promise<VideoIdea | undefined>;
  getVideoIdeasByUser(userId: number): Promise<VideoIdea[]>;
  getVideoIdeasByDateRange(userId: number, startDate: Date, endDate: Date): Promise<VideoIdea[]>;
  updateVideoIdea(id: number, updates: UpdateVideoIdea): Promise<VideoIdea>;
  countVideoIdeasByUser(userId: number): Promise<number>;
  countVideoIdeasByUserInMonth(userId: number, date: Date): Promise<number>;
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
  getResourcesBySystem(): Promise<any[]>;
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

  async updateVideoIdea(id: number, updates: UpdateVideoIdea): Promise<VideoIdea> {
    const videoIdea = this.videoIdeas.get(id);
    if (!videoIdea) {
      throw new Error(`Video idea with id ${id} not found`);
    }
    
    const updatedIdea = {
      ...videoIdea,
      ...(updates.title ? { title: updates.title } : {}),
      ...(updates.content ? { content: updates.content } : {})
    };
    
    this.videoIdeas.set(id, updatedIdea);
    return updatedIdea;
  }
  
  async countVideoIdeasByUser(userId: number): Promise<number> {
    return Array.from(this.videoIdeas.values()).filter(
      (idea) => idea.userId === userId
    ).length;
  }
  
  async countVideoIdeasByUserInMonth(userId: number, date: Date): Promise<number> {
    const year = date.getFullYear();
    const month = date.getMonth();
    return Array.from(this.videoIdeas.values()).filter(
      (idea) => {
        if (idea.userId !== userId) return false;
        const createdAt = new Date(idea.createdAt);
        return createdAt.getFullYear() === year && createdAt.getMonth() === month;
      }
    ).length;
  }
  
  async countVideoIdeasByUserSince(userId: number, date: Date): Promise<number> {
    const startDate = new Date(date); // Clonamos la fecha para no modificar la original
    return Array.from(this.videoIdeas.values()).filter(
      (idea) => {
        if (idea.userId !== userId) return false;
        const createdAt = new Date(idea.createdAt);
        return createdAt >= startDate;
      }
    ).length;
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
  // Operaciones para estrategia de contenido
  async getContentStrategy(userId: number): Promise<ContentStrategy | undefined> {
    const [strategy] = await db
      .select()
      .from(contentStrategiesWorkbook)
      .where(eq(contentStrategiesWorkbook.userId, userId));
    
    return strategy;
  }

  async createContentStrategy(strategy: ContentStrategyInsert): Promise<ContentStrategy> {
    const [newStrategy] = await db
      .insert(contentStrategiesWorkbook)
      .values(strategy)
      .returning();
    
    return newStrategy;
  }

  async updateContentStrategy(id: number, strategy: Partial<ContentStrategy>): Promise<ContentStrategy | undefined> {
    const [updatedStrategy] = await db
      .update(contentStrategiesWorkbook)
      .set({
        ...strategy,
        updatedAt: new Date()
      })
      .where(eq(contentStrategiesWorkbook.id, id))
      .returning();
    
    return updatedStrategy;
  }
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  // Resource operations
  async getAllResourceCategories(): Promise<ResourceCategory[]> {
    return await db.select().from(resourceCategories);
  }

  async getAllResourceSubcategories(): Promise<ResourceSubcategory[]> {
    return await db.select().from(resourceSubcategories);
  }

  async getResourceSubcategoriesByCategory(categoryId: number): Promise<ResourceSubcategory[]> {
    return await db
      .select()
      .from(resourceSubcategories)
      .where(eq(resourceSubcategories.categoryId, categoryId));
  }

  async getResourceCategoryBySlug(slug: string): Promise<ResourceCategory | undefined> {
    const [category] = await db
      .select()
      .from(resourceCategories)
      .where(eq(resourceCategories.slug, slug));
    return category;
  }

  async getResourceSubcategoryBySlug(slug: string): Promise<ResourceSubcategory | undefined> {
    const [subcategory] = await db
      .select()
      .from(resourceSubcategories)
      .where(eq(resourceSubcategories.slug, slug));
    return subcategory;
  }

  async createResource(resourceData: any): Promise<Resource> {
    try {
      const [result] = await db.insert(resources).values(resourceData).returning();
      return result;
    } catch (error) {
      console.error("Error al crear recurso:", error);
      throw error;
    }
  }

  async getResource(id: number): Promise<Resource | undefined> {
    try {
      const [result] = await db.select()
        .from(resources)
        .where(eq(resources.id, id));
      return result;
    } catch (error) {
      console.error("Error al obtener recurso:", error);
      return undefined;
    }
  }

  async getResourceBySlug(slug: string): Promise<Resource | undefined> {
    try {
      const [result] = await db.select()
        .from(resources)
        .where(eq(resources.slug, slug));
      return result;
    } catch (error) {
      console.error("Error al obtener recurso por slug:", error);
      return undefined;
    }
  }

  async getAllResources(limit: number = 20, offset: number = 0): Promise<Resource[]> {
    try {
      return await db.select()
        .from(resources)
        .orderBy(desc(resources.createdAt))
        .limit(limit)
        .offset(offset);
    } catch (error) {
      console.error("Error al obtener todos los recursos:", error);
      return [];
    }
  }
  
  async getResourcesBySystem(): Promise<Resource[]> {
    try {
      return await db
        .select()
        .from(resources)
        .where(sql`${resources.userId} IS NULL`)
        .orderBy(desc(resources.createdAt));
    } catch (error) {
      console.error("Error getting system resources:", error);
      return [];
    }
  }
  
  async deleteResource(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(resources)
        .where(eq(resources.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting resource:", error);
      return false;
    }
  }

  async getPublicResources(limit: number = 20, offset: number = 0): Promise<Resource[]> {
    try {
      return await db.select()
        .from(resources)
        .where(eq(resources.isPublic, true))
        .orderBy(desc(resources.createdAt))
        .limit(limit)
        .offset(offset);
    } catch (error) {
      console.error("Error al obtener recursos públicos:", error);
      return [];
    }
  }

  async getFeaturedResources(limit: number = 6): Promise<Resource[]> {
    try {
      return await db.select()
        .from(resources)
        .where(and(
          eq(resources.isPublic, true),
          eq(resources.isFeatured, true)
        ))
        .orderBy(desc(resources.createdAt))
        .limit(limit);
    } catch (error) {
      console.error("Error al obtener recursos destacados:", error);
      return [];
    }
  }

  async getResourcesByUser(userId: number): Promise<Resource[]> {
    try {
      return await db.select()
        .from(resources)
        .where(eq(resources.userId, userId))
        .orderBy(desc(resources.createdAt));
    } catch (error) {
      console.error("Error al obtener recursos del usuario:", error);
      return [];
    }
  }

  async getResourcesByCategory(categoryId: number, limit: number = 20, offset: number = 0): Promise<Resource[]> {
    try {
      return await db.select()
        .from(resources)
        .where(eq(resources.categoryId, categoryId))
        .orderBy(desc(resources.createdAt))
        .limit(limit)
        .offset(offset);
    } catch (error) {
      console.error("Error al obtener recursos por categoría:", error);
      return [];
    }
  }

  async getResourcesBySubcategory(subcategoryId: number, limit: number = 20, offset: number = 0): Promise<Resource[]> {
    try {
      return await db.select()
        .from(resources)
        .where(eq(resources.subcategoryId, subcategoryId))
        .orderBy(desc(resources.createdAt))
        .limit(limit)
        .offset(offset);
    } catch (error) {
      console.error("Error al obtener recursos por subcategoría:", error);
      return [];
    }
  }

  async updateResource(id: number, updates: Partial<Resource>): Promise<Resource> {
    try {
      const [updated] = await db.update(resources)
        .set(updates)
        .where(eq(resources.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error al actualizar recurso:", error);
      throw error;
    }
  }

  async deleteResource(id: number): Promise<boolean> {
    try {
      const result = await db.delete(resources)
        .where(eq(resources.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error al eliminar recurso:", error);
      return false;
    }
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
    // Aseguramos que haya un slug y sea generado a partir del título si no existe
    if (!idea.slug) {
      // Importamos la función de slugify desde el archivo de utilidades
      const { slugify } = require('./utils/slugify');
      const slug = slugify(idea.title);
      idea = { ...idea, slug };
    }
    
    // Asegurar que isPublic tenga un valor por defecto
    if (idea.isPublic === undefined) {
      idea = { ...idea, isPublic: false };
    }
    
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
  
  async getVideoIdeaBySlug(slug: string): Promise<VideoIdea | undefined> {
    const [videoIdea] = await db.select()
      .from(videoIdeas)
      .where(eq(videoIdeas.slug, slug));
    
    return videoIdea;
  }
  
  async toggleVideoIdeaVisibility(id: number, isPublic: boolean): Promise<VideoIdea> {
    const [updatedIdea] = await db.update(videoIdeas)
      .set({ isPublic })
      .where(eq(videoIdeas.id, id))
      .returning();
    
    if (!updatedIdea) {
      throw new Error(`Video idea with id ${id} not found`);
    }
    
    return updatedIdea;
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

  async updateVideoIdea(id: number, updates: UpdateVideoIdea): Promise<VideoIdea> {
    const [videoIdea] = await db.update(videoIdeas)
      .set(updates)
      .where(eq(videoIdeas.id, id))
      .returning();
    
    return videoIdea;
  }
  
  async countVideoIdeasByUser(userId: number): Promise<number> {
    const result = await db.select({ count: count() })
      .from(videoIdeas)
      .where(eq(videoIdeas.userId, userId));
    
    return result[0].count || 0;
  }
  
  async countVideoIdeasByUserInMonth(userId: number, date: Date): Promise<number> {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const result = await db.select({ count: count() })
      .from(videoIdeas)
      .where(
        and(
          eq(videoIdeas.userId, userId),
          gte(videoIdeas.createdAt, startOfMonth),
          lte(videoIdeas.createdAt, endOfMonth)
        )
      );
    
    return result[0].count || 0;
  }
  
  async countVideoIdeasByUserSince(userId: number, date: Date): Promise<number> {
    try {
      const result = await db.select({ count: count() })
        .from(videoIdeas)
        .where(
          and(
            eq(videoIdeas.userId, userId),
            gte(videoIdeas.createdAt, date)
          )
        );
      
      return result[0].count || 0;
    } catch (error) {
      console.error("Error contando ideas de video desde fecha:", error);
      return 0;
    }
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
    // SOLUCIÓN DEFINITIVA: Debido a los problemas persistentes con las fechas en PostgreSQL,
    // vamos a obtener TODAS las entradas del usuario y luego filtrar en JavaScript
    // utilizando el formato ISO para evitar problemas de zona horaria
    console.log(`Buscando entradas para usuario ${userId} en ${month}/${year}`);
    
    // Obtener todas las entradas del usuario
    const allEntries = await db.select()
      .from(calendarEntries)
      .where(eq(calendarEntries.userId, userId));
    
    console.log(`Total de entradas para el usuario ${userId}: ${allEntries.length}`);
    
    // Filtrar por mes y año en JavaScript para evitar problemas con PostgreSQL
    const filtered = allEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      const entryMonth = entryDate.getMonth() + 1; // base 1 (1-12)
      const entryYear = entryDate.getFullYear();
      
      return entryMonth === month && entryYear === year;
    });
    
    console.log(`Entradas filtradas para ${month}/${year}: ${filtered.length}`);
    
    if (filtered.length > 0) {
      console.log("Primera entrada filtrada:", {
        id: filtered[0].id,
        title: filtered[0].title,
        date: new Date(filtered[0].date).toISOString()
      });
    }
    
    return filtered;
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

  // Métodos para gestionar colecciones de recursos
  async createResourceCollection(collection: InsertUserResourceCollection): Promise<UserResourceCollection> {
    try {
      const [result] = await db.insert(userResourceCollections).values(collection).returning();
      return result;
    } catch (error) {
      console.error("Error creando colección de recursos:", error);
      throw error;
    }
  }
  
  async getResourceCollectionsByUser(userId: number): Promise<UserResourceCollection[]> {
    try {
      return await db.select()
        .from(userResourceCollections)
        .where(eq(userResourceCollections.userId, userId))
        .orderBy(asc(userResourceCollections.name));
    } catch (error) {
      console.error("Error obteniendo colecciones de recursos:", error);
      return [];
    }
  }
  
  async getResourceCollection(id: number): Promise<UserResourceCollection | undefined> {
    try {
      const [result] = await db.select()
        .from(userResourceCollections)
        .where(eq(userResourceCollections.id, id));
      return result;
    } catch (error) {
      console.error("Error obteniendo colección de recursos:", error);
      return undefined;
    }
  }
  
  async updateResourceCollection(
    id: number, 
    data: Partial<InsertUserResourceCollection>
  ): Promise<UserResourceCollection> {
    try {
      const [result] = await db.update(userResourceCollections)
        .set(data)
        .where(eq(userResourceCollections.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error("Error actualizando colección de recursos:", error);
      throw error;
    }
  }
  
  async deleteResourceCollection(id: number): Promise<boolean> {
    try {
      // Primero eliminamos todos los items de la colección
      await db.delete(userResourceItems)
        .where(eq(userResourceItems.collectionId, id));
      
      // Luego eliminamos la colección
      const result = await db.delete(userResourceCollections)
        .where(eq(userResourceCollections.id, id));
      
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error eliminando colección de recursos:", error);
      return false;
    }
  }
  
  // Métodos para gestionar elementos de colecciones de recursos
  async addResourceToCollection(item: InsertUserResourceItem): Promise<UserResourceItem> {
    try {
      const [result] = await db.insert(userResourceItems).values(item).returning();
      return result;
    } catch (error) {
      console.error("Error añadiendo recurso a colección:", error);
      throw error;
    }
  }
  
  async getResourceItemsByCollection(collectionId: number): Promise<(UserResourceItem & { resource: Resource })[]> {
    try {
      return await db.select({
        ...userResourceItems,
        resource: resources
      })
      .from(userResourceItems)
      .innerJoin(resources, eq(userResourceItems.resourceId, resources.id))
      .where(eq(userResourceItems.collectionId, collectionId))
      .orderBy(asc(resources.title));
    } catch (error) {
      console.error("Error obteniendo recursos de colección:", error);
      return [];
    }
  }
  
  async getResourceItem(id: number): Promise<UserResourceItem | undefined> {
    try {
      const [result] = await db.select()
        .from(userResourceItems)
        .where(eq(userResourceItems.id, id));
      return result;
    } catch (error) {
      console.error("Error obteniendo item de colección:", error);
      return undefined;
    }
  }
  
  async updateResourceItem(
    id: number, 
    data: Partial<InsertUserResourceItem>
  ): Promise<UserResourceItem> {
    try {
      const [result] = await db.update(userResourceItems)
        .set(data)
        .where(eq(userResourceItems.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error("Error actualizando item de colección:", error);
      throw error;
    }
  }
  
  async removeResourceFromCollection(id: number): Promise<boolean> {
    try {
      const result = await db.delete(userResourceItems)
        .where(eq(userResourceItems.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error eliminando recurso de colección:", error);
      return false;
    }
  }
  
  // Métodos para gestionar colecciones de guiones
  async createScriptCollection(collection: InsertUserScriptCollection): Promise<UserScriptCollection> {
    try {
      const [result] = await db.insert(userScriptCollections).values(collection).returning();
      return result;
    } catch (error) {
      console.error("Error creando colección de guiones:", error);
      throw error;
    }
  }
  
  async getScriptCollectionsByUser(userId: number): Promise<UserScriptCollection[]> {
    try {
      return await db.select()
        .from(userScriptCollections)
        .where(eq(userScriptCollections.userId, userId))
        .orderBy(asc(userScriptCollections.name));
    } catch (error) {
      console.error("Error obteniendo colecciones de guiones:", error);
      return [];
    }
  }
  
  async getScriptCollection(id: number): Promise<UserScriptCollection | undefined> {
    try {
      const [result] = await db.select()
        .from(userScriptCollections)
        .where(eq(userScriptCollections.id, id));
      return result;
    } catch (error) {
      console.error("Error obteniendo colección de guiones:", error);
      return undefined;
    }
  }
  
  async updateScriptCollection(
    id: number, 
    data: Partial<InsertUserScriptCollection>
  ): Promise<UserScriptCollection> {
    try {
      const [result] = await db.update(userScriptCollections)
        .set(data)
        .where(eq(userScriptCollections.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error("Error actualizando colección de guiones:", error);
      throw error;
    }
  }
  
  async deleteScriptCollection(id: number): Promise<boolean> {
    try {
      // Primero eliminamos todos los guiones de la colección
      await db.delete(userScripts)
        .where(eq(userScripts.collectionId, id));
      
      // Luego eliminamos la colección
      const result = await db.delete(userScriptCollections)
        .where(eq(userScriptCollections.id, id));
      
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error eliminando colección de guiones:", error);
      return false;
    }
  }
  
  // Métodos para gestionar guiones en colecciones
  async addScriptToCollection(script: InsertUserScript): Promise<UserScript> {
    try {
      const [result] = await db.insert(userScripts).values(script).returning();
      return result;
    } catch (error) {
      console.error("Error añadiendo guión a colección:", error);
      throw error;
    }
  }
  
  async getScriptsByCollection(collectionId: number): Promise<UserScript[]> {
    try {
      return await db.select()
        .from(userScripts)
        .where(eq(userScripts.collectionId, collectionId))
        .orderBy(asc(userScripts.title));
    } catch (error) {
      console.error("Error obteniendo guiones de colección:", error);
      return [];
    }
  }
  
  async getScript(id: number): Promise<UserScript | undefined> {
    try {
      const [result] = await db.select()
        .from(userScripts)
        .where(eq(userScripts.id, id));
      return result;
    } catch (error) {
      console.error("Error obteniendo guión:", error);
      return undefined;
    }
  }
  
  async updateScript(
    id: number, 
    data: Partial<InsertUserScript>
  ): Promise<UserScript> {
    try {
      const [result] = await db.update(userScripts)
        .set(data)
        .where(eq(userScripts.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error("Error actualizando guión:", error);
      throw error;
    }
  }
  
  async deleteScript(id: number): Promise<boolean> {
    try {
      const result = await db.delete(userScripts)
        .where(eq(userScripts.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error eliminando guión:", error);
      return false;
    }
  }

  // Obtener comentarios de un recurso
  async getResourceComments(resourceId: number): Promise<any[]> {
    try {
      // Usamos una consulta SQL directa para tener más control
      const query = `
        SELECT rc.*, u.username 
        FROM resource_comments rc
        LEFT JOIN users u ON rc.user_id = u.id
        WHERE rc.resource_id = $1
        ORDER BY rc.created_at DESC
      `;
      
      const result = await pool.query(query, [resourceId]);
      
      return result.rows;
    } catch (error) {
      console.error("Error obteniendo comentarios del recurso:", error);
      return [];
    }
  }
  
  // ===============================================================
  // Métodos para sistema de estrategias de contenido
  // ===============================================================

  // 1. Operaciones básicas para estrategias de contenido
  async getContentStrategy(id: number): Promise<ContentStrategy | undefined> {
    try {
      const [strategy] = await db.select()
        .from(contentStrategies)
        .where(eq(contentStrategies.id, id));
      return strategy;
    } catch (error) {
      console.error('Error al obtener estrategia de contenido:', error);
      throw new Error('Error al obtener estrategia de contenido');
    }
  }

  async getContentStrategyByUser(userId: number): Promise<ContentStrategy[]> {
    try {
      return db.select()
        .from(contentStrategies)
        .where(eq(contentStrategies.userId, userId));
    } catch (error) {
      console.error('Error al obtener estrategias del usuario:', error);
      throw new Error('Error al obtener estrategias del usuario');
    }
  }

  async getPublicContentStrategies(): Promise<ContentStrategy[]> {
    try {
      return db.select()
        .from(contentStrategies)
        .where(eq(contentStrategies.isPublic, true));
    } catch (error) {
      console.error('Error al obtener estrategias públicas:', error);
      throw new Error('Error al obtener estrategias públicas');
    }
  }

  async createContentStrategy(strategy: InsertContentStrategy): Promise<ContentStrategy> {
    try {
      const [newStrategy] = await db.insert(contentStrategies)
        .values(strategy)
        .returning();
      return newStrategy;
    } catch (error) {
      console.error('Error al crear estrategia de contenido:', error);
      throw new Error('Error al crear estrategia de contenido');
    }
  }

  async updateContentStrategy(id: number, strategy: Partial<ContentStrategy>): Promise<ContentStrategy | undefined> {
    try {
      const [updatedStrategy] = await db.update(contentStrategies)
        .set(strategy)
        .where(eq(contentStrategies.id, id))
        .returning();
      return updatedStrategy;
    } catch (error) {
      console.error('Error al actualizar estrategia de contenido:', error);
      throw new Error('Error al actualizar estrategia de contenido');
    }
  }

  async deleteContentStrategy(id: number): Promise<boolean> {
    try {
      await db.delete(contentStrategies)
        .where(eq(contentStrategies.id, id));
      return true;
    } catch (error) {
      console.error('Error al eliminar estrategia de contenido:', error);
      throw new Error('Error al eliminar estrategia de contenido');
    }
  }

  // 2. Operaciones para configuración de estrategias
  async getContentStrategyConfig(strategyId: number): Promise<ContentStrategyConfig | undefined> {
    try {
      const [config] = await db.select()
        .from(contentStrategyConfigs)
        .where(eq(contentStrategyConfigs.strategyId, strategyId));
      return config;
    } catch (error) {
      console.error('Error al obtener configuración de estrategia:', error);
      throw new Error('Error al obtener configuración de estrategia');
    }
  }

  async createContentStrategyConfig(config: InsertContentStrategyConfig): Promise<ContentStrategyConfig> {
    try {
      const [newConfig] = await db.insert(contentStrategyConfigs)
        .values(config)
        .returning();
      return newConfig;
    } catch (error) {
      console.error('Error al crear configuración de estrategia:', error);
      throw new Error('Error al crear configuración de estrategia');
    }
  }

  async updateContentStrategyConfig(id: number, config: Partial<ContentStrategyConfig>): Promise<ContentStrategyConfig | undefined> {
    try {
      const [updatedConfig] = await db.update(contentStrategyConfigs)
        .set(config)
        .where(eq(contentStrategyConfigs.id, id))
        .returning();
      return updatedConfig;
    } catch (error) {
      console.error('Error al actualizar configuración de estrategia:', error);
      throw new Error('Error al actualizar configuración de estrategia');
    }
  }

  // 3. Operaciones para plantillas de estrategias
  async getContentStrategyTemplates(strategyId: number): Promise<ContentStrategyTemplate[]> {
    try {
      return db.select()
        .from(contentStrategyTemplates)
        .where(eq(contentStrategyTemplates.strategyId, strategyId));
    } catch (error) {
      console.error('Error al obtener plantillas de estrategia:', error);
      throw new Error('Error al obtener plantillas de estrategia');
    }
  }

  async getContentStrategyTemplatesByDay(strategyId: number, dayOfWeek: number): Promise<ContentStrategyTemplate[]> {
    try {
      return db.select()
        .from(contentStrategyTemplates)
        .where(and(
          eq(contentStrategyTemplates.strategyId, strategyId),
          eq(contentStrategyTemplates.dayOfWeek, dayOfWeek)
        ));
    } catch (error) {
      console.error('Error al obtener plantillas por día:', error);
      throw new Error('Error al obtener plantillas por día');
    }
  }

  async createContentStrategyTemplate(template: InsertContentStrategyTemplate): Promise<ContentStrategyTemplate> {
    try {
      const [newTemplate] = await db.insert(contentStrategyTemplates)
        .values(template)
        .returning();
      return newTemplate;
    } catch (error) {
      console.error('Error al crear plantilla de estrategia:', error);
      throw new Error('Error al crear plantilla de estrategia');
    }
  }

  async updateContentStrategyTemplate(id: number, template: Partial<ContentStrategyTemplate>): Promise<ContentStrategyTemplate | undefined> {
    try {
      const [updatedTemplate] = await db.update(contentStrategyTemplates)
        .set(template)
        .where(eq(contentStrategyTemplates.id, id))
        .returning();
      return updatedTemplate;
    } catch (error) {
      console.error('Error al actualizar plantilla de estrategia:', error);
      throw new Error('Error al actualizar plantilla de estrategia');
    }
  }

  async deleteContentStrategyTemplate(id: number): Promise<boolean> {
    try {
      await db.delete(contentStrategyTemplates)
        .where(eq(contentStrategyTemplates.id, id));
      return true;
    } catch (error) {
      console.error('Error al eliminar plantilla de estrategia:', error);
      throw new Error('Error al eliminar plantilla de estrategia');
    }
  }

  // 4. Operaciones para contenido generado con estrategias
  async createStrategyGeneratedContent(content: InsertStrategyGeneratedContent): Promise<StrategyGeneratedContent> {
    try {
      const [newContent] = await db.insert(strategyGeneratedContent)
        .values(content)
        .returning();
      return newContent;
    } catch (error) {
      console.error('Error al crear contenido generado:', error);
      throw new Error('Error al crear contenido generado');
    }
  }

  async getStrategyGeneratedContent(id: number): Promise<StrategyGeneratedContent | undefined> {
    try {
      const [content] = await db.select()
        .from(strategyGeneratedContent)
        .where(eq(strategyGeneratedContent.id, id));
      return content;
    } catch (error) {
      console.error('Error al obtener contenido generado:', error);
      throw new Error('Error al obtener contenido generado');
    }
  }

  async getStrategyGeneratedContentByUser(userId: number): Promise<StrategyGeneratedContent[]> {
    try {
      return db.select()
        .from(strategyGeneratedContent)
        .where(eq(strategyGeneratedContent.userId, userId));
    } catch (error) {
      console.error('Error al obtener contenido generado del usuario:', error);
      throw new Error('Error al obtener contenido generado del usuario');
    }
  }

  async getStrategyGeneratedContentByStrategy(strategyId: number): Promise<StrategyGeneratedContent[]> {
    try {
      return db.select()
        .from(strategyGeneratedContent)
        .where(eq(strategyGeneratedContent.strategyId, strategyId));
    } catch (error) {
      console.error('Error al obtener contenido generado por estrategia:', error);
      throw new Error('Error al obtener contenido generado por estrategia');
    }
  }

  async updateStrategyGeneratedContent(id: number, content: Partial<StrategyGeneratedContent>): Promise<StrategyGeneratedContent | undefined> {
    try {
      const [updatedContent] = await db.update(strategyGeneratedContent)
        .set(content)
        .where(eq(strategyGeneratedContent.id, id))
        .returning();
      return updatedContent;
    } catch (error) {
      console.error('Error al actualizar contenido generado:', error);
      throw new Error('Error al actualizar contenido generado');
    }
  }

  async deleteStrategyGeneratedContent(id: number): Promise<boolean> {
    try {
      await db.delete(strategyGeneratedContent)
        .where(eq(strategyGeneratedContent.id, id));
      return true;
    } catch (error) {
      console.error('Error al eliminar contenido generado:', error);
      throw new Error('Error al eliminar contenido generado');
    }
  }
}

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
