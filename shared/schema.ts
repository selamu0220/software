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
});

// User videos model
export const userVideos = pgTable("user_videos", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type", { length: 255 }).notNull(),
  duration: integer("duration"),
  thumbnailPath: text("thumbnail_path"),
  uploadDate: timestamp("upload_date").defaultNow().notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  videoIdeas: many(videoIdeas),
  calendarEntries: many(calendarEntries),
  userVideos: many(userVideos),
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

// User profile update schema
export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(3).optional(),
  password: z.string().min(6).optional(),
});

export type UpdateUser = z.infer<typeof updateUserSchema>;
