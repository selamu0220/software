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
  // YouTube integration
  youtubeAccessToken: text("youtube_access_token"),
  youtubeRefreshToken: text("youtube_refresh_token"),
  youtubeTokenExpiry: timestamp("youtube_token_expiry"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Video idea model
export const videoIdeas = pgTable("video_ideas", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  category: text("category").notNull(),
  subcategory: text("subcategory").notNull(),
  videoLength: text("video_length").notNull(),
  content: json("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Calendar entry model
export const calendarEntries = pgTable("calendar_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  videoIdeaId: integer("video_idea_id").references(() => videoIdeas.id),
  title: text("title").notNull(),
  date: timestamp("date").notNull(),
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
  // YouTube integration
  youtubeId: text("youtube_id"),
  youtubeUrl: text("youtube_url"),
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
  iconName: text("icon_name"),
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
  viewCount: integer("view_count").default(0).notNull(),
  downloadCount: integer("download_count").default(0).notNull(),
  likesCount: integer("likes_count").default(0).notNull(),
  dislikesCount: integer("dislikes_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Comentarios en recursos
export const resourceComments = pgTable("resource_comments", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").references(() => resources.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  rating: integer("rating"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  videoIdeas: many(videoIdeas),
  calendarEntries: many(calendarEntries),
  userVideos: many(userVideos),
  resources: many(resources),
  resourceComments: many(resourceComments),
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export const insertVideoIdeaSchema = createInsertSchema(videoIdeas).pick({
  userId: true,
  title: true,
  category: true,
  subcategory: true,
  videoLength: true,
  content: true,
});

export const insertCalendarEntrySchema = createInsertSchema(calendarEntries).pick({
  userId: true,
  videoIdeaId: true,
  title: true,
  date: true,
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
  youtubeId: true,
  youtubeUrl: true,
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
});

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
});

export const insertResourceCommentSchema = createInsertSchema(resourceComments).pick({
  resourceId: true,
  userId: true,
  content: true,
  rating: true,
});

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
