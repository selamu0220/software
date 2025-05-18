import { pgTable, text, serial, integer, boolean, timestamp, json, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  isPremium: boolean("is_premium").default(false).notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  lifetimeAccess: boolean("lifetime_access").default(false).notNull(),
  // YouTube integration eliminada por petición del usuario
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Video idea model
export const videoIdeas = pgTable("video_ideas", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  category: text("category").notNull(),
  subcategory: text("subcategory").notNull(),
  videoLength: text("video_length").notNull(),
  content: json("content").notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Calendar entry model
export const calendarEntries = pgTable("calendar_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  videoIdeaId: integer("video_idea_id").references(() => videoIdeas.id),
  title: text("title").notNull(),
  date: timestamp("date").notNull(),
  timeOfDay: text("time_of_day").default("12:00"), // Hora para la grabación
  completed: boolean("completed").default(false).notNull(),
  notes: text("notes"),
  color: text("color").default("#3b82f6"),
});

// User videos model
export const userVideos = pgTable("user_videos", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  fileName: text("file_name"),
  filePath: text("file_path"),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 255 }),
  duration: integer("duration"),
  thumbnailPath: text("thumbnail_path"),
  // YouTube integration eliminada por petición del usuario
  uploadDate: timestamp("upload_date").defaultNow().notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
});

// Categorías de recursos
export const resourceCategories = pgTable("resource_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  iconName: text("icon_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Subcategorías de recursos
export const resourceSubcategories = pgTable("resource_subcategories", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => resourceCategories.id).notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  // Campo iconName eliminado para coincidir con la estructura de la tabla
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Recursos
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  categoryId: integer("category_id").references(() => resourceCategories.id).notNull(),
  subcategoryId: integer("subcategory_id").references(() => resourceSubcategories.id),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  description: text("description").notNull(),
  content: text("content"),
  thumbnailUrl: text("thumbnail_url"),
  externalUrl: text("external_url"),
  downloadUrl: text("download_url"),
  fileSize: integer("file_size"),
  fileType: text("file_type"),
  version: text("version"),
  tags: text("tags").array(),
  isVerified: boolean("is_verified").default(false).notNull(),
  isPublic: boolean("is_public").default(true).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isPremium: boolean("is_premium").default(false).notNull(), // Indica si es un recurso de pago
  price: integer("price").default(0).notNull(), // Precio en céntimos (para evitar problemas con decimales)
  resourceType: text("resource_type").default("file").notNull(), // Tipo: "file", "link", "tool", "aiTool"
  aiCategory: text("ai_category"), // Categoría específica de IA: "chat", "image", "video", "audio", "text"
  voteCount: integer("vote_count").default(0).notNull(), // Número total de votos recibidos
  voteScore: integer("vote_score").default(0).notNull(), // Puntuación acumulada (la media se calcula dividiendo por voteCount)
  viewCount: integer("view_count").default(0).notNull(),
  downloadCount: integer("download_count").default(0).notNull(),
  likesCount: integer("likes_count").default(0).notNull(),
  dislikesCount: integer("dislikes_count").default(0).notNull(),
  commissionPercent: integer("commission_percent").default(50).notNull(), // Porcentaje de comisión para el creador
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Eliminamos completamente esta definición

// Comentarios en recursos
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt").notNull(),
  coverImage: text("cover_image").notNull(),
  published: boolean("published").notNull().default(false),
  publishedAt: timestamp("published_at"), // Nueva columna para fecha de publicación programada
  featured: boolean("featured").notNull().default(false),
  readingTime: integer("reading_time").notNull(),
  tags: text("tags").array().notNull(),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const blogCategories = pgTable("blog_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const blogPostCategories = pgTable("blog_post_categories", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => blogPosts.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").notNull().references(() => blogCategories.id, { onDelete: "cascade" }),
});

export const resourceComments = pgTable("resource_comments", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").references(() => resources.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  rating: integer("rating"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Votos para recursos
export const resourceVotes = pgTable("resource_votes", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").references(() => resources.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  score: integer("score").notNull(), // 0 = No me gusta, 1 = Me gusta
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define relations
// Biblioteca personal de recursos
export const userResourceCollections = pgTable("user_resource_collections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userResourceItems = pgTable("user_resource_items", {
  id: serial("id").primaryKey(),
  collectionId: integer("collection_id").references(() => userResourceCollections.id).notNull(),
  resourceId: integer("resource_id").references(() => resources.id).notNull(),
  notes: text("notes"),
  favorite: boolean("favorite").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Biblioteca personal de guiones
export const userScriptCollections = pgTable("user_script_collections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userScripts = pgTable("user_scripts", {
  id: serial("id").primaryKey(),
  collectionId: integer("collection_id").references(() => userScriptCollections.id).notNull(),
  videoIdeaId: integer("video_idea_id").references(() => videoIdeas.id),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  description: text("description"),
  content: text("content").notNull(),
  sections: json("sections"), // Aquí almacenamos las secciones del guión
  category: text("category"),
  subcategory: text("subcategory"),
  tags: text("tags").array(),
  timings: json("timings"),
  totalDuration: text("total_duration"),
  version: integer("version").default(1).notNull(),
  isTemplate: boolean("is_template").default(false).notNull(),
  favorite: boolean("favorite").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  videoIdeas: many(videoIdeas),
  calendarEntries: many(calendarEntries),
  userVideos: many(userVideos),
  resources: many(resources),
  resourceComments: many(resourceComments),
  resourceCollections: many(userResourceCollections),
  scriptCollections: many(userScriptCollections),
  contentStrategyWorkbook: one(contentStrategiesWorkbook, {
    fields: [users.id],
    references: [contentStrategiesWorkbook.userId],
  }),
}));

export const videoIdeasRelations = relations(videoIdeas, ({ one, many }) => ({
  user: one(users, {
    fields: [videoIdeas.userId],
    references: [users.id],
  }),
  calendarEntries: many(calendarEntries),
}));

export const calendarEntriesRelations = relations(calendarEntries, ({ one }) => ({
  user: one(users, {
    fields: [calendarEntries.userId],
    references: [users.id],
  }),
  videoIdea: one(videoIdeas, {
    fields: [calendarEntries.videoIdeaId],
    references: [videoIdeas.id],
  }),
}));

export const userVideosRelations = relations(userVideos, ({ one }) => ({
  user: one(users, {
    fields: [userVideos.userId],
    references: [users.id],
  }),
}));

export const resourceCategoriesRelations = relations(resourceCategories, ({ many }) => ({
  subcategories: many(resourceSubcategories),
  resources: many(resources),
}));

export const resourceSubcategoriesRelations = relations(resourceSubcategories, ({ one, many }) => ({
  category: one(resourceCategories, {
    fields: [resourceSubcategories.categoryId],
    references: [resourceCategories.id],
  }),
  resources: many(resources),
}));

export const resourcesRelations = relations(resources, ({ one, many }) => ({
  user: one(users, {
    fields: [resources.userId],
    references: [users.id],
  }),
  category: one(resourceCategories, {
    fields: [resources.categoryId],
    references: [resourceCategories.id],
  }),
  subcategory: one(resourceSubcategories, {
    fields: [resources.subcategoryId],
    references: [resourceSubcategories.id],
  }),
  comments: many(resourceComments),
}));

export const resourceCommentsRelations = relations(resourceComments, ({ one }) => ({
  resource: one(resources, {
    fields: [resourceComments.resourceId],
    references: [resources.id],
  }),
  user: one(users, {
    fields: [resourceComments.userId],
    references: [users.id],
  }),
}));

export const blogPostsRelations = relations(blogPosts, ({ one, many }) => ({
  user: one(users, {
    fields: [blogPosts.userId],
    references: [users.id],
  }),
  categories: many(blogPostCategories),
}));

export const blogCategoriesRelations = relations(blogCategories, ({ many }) => ({
  posts: many(blogPostCategories),
}));



export const blogPostCategoriesRelations = relations(blogPostCategories, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogPostCategories.postId],
    references: [blogPosts.id],
  }),
  category: one(blogCategories, {
    fields: [blogPostCategories.categoryId],
    references: [blogCategories.id],
  }),
}));

// Relaciones para las colecciones de recursos personales
export const userResourceCollectionsRelations = relations(userResourceCollections, ({ one, many }) => ({
  user: one(users, {
    fields: [userResourceCollections.userId],
    references: [users.id],
  }),
  items: many(userResourceItems),
}));

export const userResourceItemsRelations = relations(userResourceItems, ({ one }) => ({
  collection: one(userResourceCollections, {
    fields: [userResourceItems.collectionId],
    references: [userResourceCollections.id],
  }),
  resource: one(resources, {
    fields: [userResourceItems.resourceId],
    references: [resources.id],
  }),
}));

// Relaciones para las colecciones de guiones personales
export const userScriptCollectionsRelations = relations(userScriptCollections, ({ one, many }) => ({
  user: one(users, {
    fields: [userScriptCollections.userId],
    references: [users.id],
  }),
  scripts: many(userScripts),
}));

export const userScriptsRelations = relations(userScripts, ({ one }) => ({
  collection: one(userScriptCollections, {
    fields: [userScripts.collectionId],
    references: [userScriptCollections.id],
  }),
  videoIdea: one(videoIdeas, {
    fields: [userScripts.videoIdeaId],
    references: [videoIdeas.id],
  }),
}));



// Update schemas
// Ver definición completa en la parte superior

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export const insertVideoIdeaSchema = createInsertSchema(videoIdeas).pick({
  userId: true,
  title: true,
  slug: true,
  category: true,
  subcategory: true,
  videoLength: true,
  content: true,
  isPublic: true,
});

export const insertCalendarEntrySchema = createInsertSchema(calendarEntries).pick({
  userId: true,
  videoIdeaId: true,
  title: true,
  date: true,
  timeOfDay: true,
  completed: true,
  notes: true,
  color: true,
});

export const insertUserVideoSchema = createInsertSchema(userVideos).pick({
  userId: true,
  title: true,
  description: true,
  fileName: true,
  filePath: true,
  fileSize: true,
  mimeType: true,
  duration: true,
  thumbnailPath: true,
  isPublic: true,
});

// Generation schema - for requesting idea generation
export const generationRequestSchema = z.object({
  category: z.string(),
  subcategory: z.string(),
  videoFocus: z.string(),
  videoLength: z.string(),
  templateStyle: z.string(),
  contentTone: z.string(),
  titleTemplate: z.string().optional(),
  contentType: z.enum(["idea", "keypoints", "fullScript"]).default("idea"),
  timingDetail: z.boolean().default(false),
  customChannelType: z.string().optional(),
  useSubcategory: z.boolean().default(true),
  geminiApiKey: z.string().optional(),
  fullScript: z.boolean().optional(), // Indica si debe generar un guión completo
  model: z.string().optional(), // Permite especificar el modelo de IA a usar
  fromTemplates: z.boolean().optional(), // Si debe generar desde plantillas existentes
});

// Eliminado debido a la duplicación

// Esta definición reemplaza la anterior de contentStrategies
// Sistema flexible de estrategias de contenido
export const contentStrategies = pgTable("content_strategies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  authorName: text("author_name").notNull(), // Ej: "Iman Ghadzi", "Personal", etc.
  isPublic: boolean("is_public").default(false).notNull(), // Si es visible para otros usuarios
  isVerified: boolean("is_verified").default(false).notNull(), // Si es verificada por administradores
  templateType: text("template_type").notNull(), // "personal_brand", "youtube", "tiktok", etc.
  thumbnailUrl: text("thumbnail_url"), // Imagen de la estrategia
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Configuración específica de cada estrategia
export const contentStrategyConfigs = pgTable("content_strategy_configs", {
  id: serial("id").primaryKey(),
  strategyId: integer("strategy_id").references(() => contentStrategies.id).notNull(),
  
  // Métricas y objetivos
  currentFollowers: integer("current_followers"), // Número actual de seguidores
  followerGoal: integer("follower_goal"), // Meta de seguidores
  targetDate: timestamp("target_date"), // Fecha objetivo para alcanzar metas
  dailyContentGoal: integer("daily_content_goal").default(1), // Cuántos contenidos por día
  
  // Plataformas principales
  mainPlatform: text("main_platform"), // YouTube, TikTok, IG, etc.
  secondaryPlatforms: text("secondary_platforms").array(), // Otras plataformas
  
  // Audiencia
  targetAudience: text("target_audience").notNull(), // Descripción de la audiencia objetivo
  audienceAge: text("audience_age"), // Rango de edad "18-24", "25-34", etc.
  audienceInterests: text("audience_interests").array(), // Intereses principales
  audienceProblems: text("audience_problems").array(), // Problemas que resuelve
  
  // Pilares de contenido (estructura flexible para diferentes estrategias)
  contentPillars: json("content_pillars"), // Pilares de contenido en formato JSON
  
  // Datos adicionales específicos
  additionalSettings: json("additional_settings"), // Campo JSON para configuraciones específicas
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Plantillas de la estrategia para cada día de la semana
export const contentStrategyTemplates = pgTable("content_strategy_templates", {
  id: serial("id").primaryKey(),
  strategyId: integer("strategy_id").references(() => contentStrategies.id).notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (domingo-sábado)
  contentType: text("content_type").notNull(), // "video", "post", "stories", etc.
  contentPillar: text("content_pillar"), // Pilar al que pertenece
  title: text("title").notNull(),
  description: text("description").notNull(),
  template: text("template").notNull(), // Plantilla con variables que se pueden reemplazar
  exampleContent: text("example_content"), // Ejemplo de contenido usando esta plantilla
  bestPractices: text("best_practices"), // Consejos para usar esta plantilla
  isRequired: boolean("is_required").default(false).notNull(), // Si es obligatorio este día
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Contenido generado según la estrategia
export const strategyGeneratedContent = pgTable("strategy_generated_content", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  strategyId: integer("strategy_id").references(() => contentStrategies.id).notNull(),
  templateId: integer("template_id").references(() => contentStrategyTemplates.id),
  title: text("title").notNull(),
  contentType: text("content_type").notNull(), // "video", "post", "stories", etc.
  content: text("content").notNull(),
  scheduledDate: timestamp("scheduled_date"), // Fecha programada para publicar
  isPublished: boolean("is_published").default(false).notNull(),
  calendarEntryId: integer("calendar_entry_id").references(() => calendarEntries.id), // Vinculación con calendario
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Para compatibilidad con el código existente, mantenemos esta tabla pero la reemplazamos
export const contentStrategiesWorkbook = pgTable("content_strategies_workbook", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  strategyId: integer("strategy_id").references(() => contentStrategies.id), // Vinculación con nueva estrategia
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  
  // Campos básicos para mantener compatibilidad
  targetAudience: text("target_audience"),
  contentTopics: text("content_topics"),
  contentCalendar: text("content_calendar"),
  
  // Campos adicionales que se migrarán a la nueva estructura
  migratedToNewSystem: boolean("migrated_to_new_system").default(false),
});

// Quitamos estas definiciones para evitar conflictos
// estas serán reemplazadas por las definiciones basadas en contentStrategiesWorkbook

// Esquemas de inserción para recursos
export const insertResourceCategorySchema = createInsertSchema(resourceCategories).pick({
  name: true,
  slug: true,
  description: true,
  iconName: true,
});

export const insertResourceSubcategorySchema = createInsertSchema(resourceSubcategories).pick({
  categoryId: true,
  name: true,
  slug: true,
  description: true,
  iconName: true,
});

export const insertResourceSchema = createInsertSchema(resources).pick({
  userId: true,
  categoryId: true,
  subcategoryId: true,
  title: true,
  slug: true,
  description: true,
  content: true,
  thumbnailUrl: true,
  externalUrl: true,
  downloadUrl: true,
  fileSize: true,
  fileType: true,
  version: true,
  tags: true,
  isVerified: true,
  isPublic: true,
  isFeatured: true,
  isPremium: true,
  price: true,
  resourceType: true,
  aiCategory: true,
  commissionPercent: true,
});

export const insertResourceCommentSchema = createInsertSchema(resourceComments).pick({
  resourceId: true,
  userId: true,
  content: true,
  rating: true,
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).pick({
  userId: true,
  title: true,
  slug: true,
  content: true,
  excerpt: true,
  coverImage: true,
  published: true,
  publishedAt: true,
  featured: true,
  readingTime: true,
  tags: true,
  seoTitle: true,
  seoDescription: true,
});

export const insertBlogCategorySchema = createInsertSchema(blogCategories).pick({
  name: true,
  slug: true,
  description: true,
});

export const insertBlogPostCategorySchema = createInsertSchema(blogPostCategories).pick({
  postId: true,
  categoryId: true,
});

// Esquemas para bibliotecas personales
export const insertUserResourceCollectionSchema = createInsertSchema(userResourceCollections).pick({
  userId: true,
  name: true,
  description: true,
});

export const insertUserResourceItemSchema = createInsertSchema(userResourceItems).pick({
  collectionId: true,
  resourceId: true,
  notes: true,
  favorite: true,
});

export const insertUserScriptCollectionSchema = createInsertSchema(userScriptCollections).pick({
  userId: true,
  name: true,
  description: true,
});

export const insertUserScriptSchema = createInsertSchema(userScripts).pick({
  collectionId: true,
  videoIdeaId: true,
  title: true,
  subtitle: true,
  description: true,
  content: true,
  sections: true,
  category: true,
  subcategory: true,
  tags: true,
  timings: true,
  totalDuration: true,
  version: true,
  isTemplate: true,
  favorite: true,
});

// Definición única de tipo para actualizar ideas de video
export type UpdateVideoIdea = {
  title?: string;
  content?: any;
  slug?: string;
  isPublic?: boolean;
  category?: string;
  subcategory?: string;
  videoLength?: string;
}

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertVideoIdea = z.infer<typeof insertVideoIdeaSchema>;
export type VideoIdea = typeof videoIdeas.$inferSelect;
export type InsertCalendarEntry = z.infer<typeof insertCalendarEntrySchema>;
export type CalendarEntry = typeof calendarEntries.$inferSelect;
export type InsertUserVideo = z.infer<typeof insertUserVideoSchema>;
export type UserVideo = typeof userVideos.$inferSelect;
export type GenerationRequest = z.infer<typeof generationRequestSchema>;
export type InsertResourceCategory = z.infer<typeof insertResourceCategorySchema>;
export type ResourceCategory = typeof resourceCategories.$inferSelect;
export type InsertResourceSubcategory = z.infer<typeof insertResourceSubcategorySchema>;
export type ResourceSubcategory = typeof resourceSubcategories.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Resource = typeof resources.$inferSelect;
export type InsertResourceComment = z.infer<typeof insertResourceCommentSchema>;
export type ResourceComment = typeof resourceComments.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogCategory = z.infer<typeof insertBlogCategorySchema>;
export type BlogCategory = typeof blogCategories.$inferSelect;
export type InsertBlogPostCategory = z.infer<typeof insertBlogPostCategorySchema>;
export type BlogPostCategory = typeof blogPostCategories.$inferSelect;

// Tipos para bibliotecas personales
export type InsertUserResourceCollection = z.infer<typeof insertUserResourceCollectionSchema>;
export type UserResourceCollection = typeof userResourceCollections.$inferSelect;
export type InsertUserResourceItem = z.infer<typeof insertUserResourceItemSchema>;
export type UserResourceItem = typeof userResourceItems.$inferSelect;
export type InsertUserScriptCollection = z.infer<typeof insertUserScriptCollectionSchema>;
export type UserScriptCollection = typeof userScriptCollections.$inferSelect;
export type InsertUserScript = z.infer<typeof insertUserScriptSchema>;
export type UserScript = typeof userScripts.$inferSelect;

// User profile update schema
export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(3).optional(),
  password: z.string().min(6).optional(),
  // YouTube integration
  youtubeAccessToken: z.string().nullable().optional(),
  youtubeRefreshToken: z.string().nullable().optional(),
  youtubeTokenExpiry: z.date().nullable().optional(),
});

export type UpdateUser = z.infer<typeof updateUserSchema>;

// Relaciones para la estrategia de contenido
export const contentStrategiesWorkbookRelations = relations(contentStrategiesWorkbook, ({ one }) => ({
  user: one(users, {
    fields: [contentStrategiesWorkbook.userId],
    references: [users.id],
  }),
}));

// Tipos para la estrategia de contenido
// Esquemas de inserción para las nuevas tablas
export const insertContentStrategySchema = createInsertSchema(contentStrategies).pick({
  userId: true,
  name: true,
  description: true,
  authorName: true,
  isPublic: true,
  templateType: true,
  thumbnailUrl: true,
});

export const insertContentStrategyConfigSchema = createInsertSchema(contentStrategyConfigs).pick({
  strategyId: true,
  currentFollowers: true,
  followerGoal: true,
  targetDate: true,
  dailyContentGoal: true,
  mainPlatform: true,
  secondaryPlatforms: true,
  targetAudience: true,
  audienceAge: true,
  audienceInterests: true,
  audienceProblems: true,
  contentPillars: true,
  additionalSettings: true,
});

export const insertContentStrategyTemplateSchema = createInsertSchema(contentStrategyTemplates).pick({
  strategyId: true,
  dayOfWeek: true,
  contentType: true,
  contentPillar: true,
  title: true,
  description: true,
  template: true,
  exampleContent: true,
  bestPractices: true,
  isRequired: true,
});

export const insertStrategyGeneratedContentSchema = createInsertSchema(strategyGeneratedContent).pick({
  userId: true,
  strategyId: true,
  templateId: true,
  title: true,
  contentType: true,
  content: true,
  scheduledDate: true,
  isPublished: true,
  calendarEntryId: true,
});
export type ContentStrategyInsert = z.infer<typeof insertContentStrategySchema>;
export type ContentStrategy = typeof contentStrategiesWorkbook.$inferSelect;
