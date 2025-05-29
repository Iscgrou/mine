import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  role: text("role").default("admin"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Representatives table
export const representatives = pgTable("representatives", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  adminUsername: text("admin_username").notNull().unique(), // Key identifier from Column A
  telegramId: text("telegram_id"),
  phoneNumber: text("phone_number"),
  storeName: text("store_name"),
  // Limited subscription pricing for 1-6 months
  limitedPrice1Month: decimal("limited_price_1_month", { precision: 10, scale: 2 }),
  limitedPrice2Month: decimal("limited_price_2_month", { precision: 10, scale: 2 }),
  limitedPrice3Month: decimal("limited_price_3_month", { precision: 10, scale: 2 }),
  limitedPrice4Month: decimal("limited_price_4_month", { precision: 10, scale: 2 }),
  limitedPrice5Month: decimal("limited_price_5_month", { precision: 10, scale: 2 }),
  limitedPrice6Month: decimal("limited_price_6_month", { precision: 10, scale: 2 }),
  unlimitedMonthlyPrice: decimal("unlimited_monthly_price", { precision: 10, scale: 2 }), // For unlimited monthly
  status: text("status").default("active"), // active, inactive, suspended
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoices table
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  representativeId: integer("representative_id").references(() => representatives.id),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").default("pending"), // pending, paid, overdue, cancelled
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  invoiceData: jsonb("invoice_data"), // Store detailed invoice breakdown
  createdAt: timestamp("created_at").defaultNow(),
});

// Invoice items for detailed breakdown
export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 3 }),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }),
  subscriptionType: text("subscription_type"), // standard, unlimited
  durationMonths: integer("duration_months"),
});

// Payments table
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id),
  representativeId: integer("representative_id").references(() => representatives.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paymentType: text("payment_type").default("full"), // full, partial
  paymentMethod: text("payment_method"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// File imports tracking
export const fileImports = pgTable("file_imports", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  recordsProcessed: integer("records_processed").default(0),
  recordsSkipped: integer("records_skipped").default(0),
  status: text("status").default("processing"), // processing, completed, failed
  errorDetails: text("error_details"),
  createdAt: timestamp("created_at").defaultNow(),
});

// System settings
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Backup history
export const backups = pgTable("backups", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size"),
  backupType: text("backup_type").default("manual"), // manual, auto
  googleDriveFileId: text("google_drive_file_id"),
  status: text("status").default("completed"), // completed, failed
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const representativesRelations = relations(representatives, ({ many }) => ({
  invoices: many(invoices),
  payments: many(payments),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  representative: one(representatives, {
    fields: [invoices.representativeId],
    references: [representatives.id],
  }),
  items: many(invoiceItems),
  payments: many(payments),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
  representative: one(representatives, {
    fields: [payments.representativeId],
    references: [representatives.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertRepresentativeSchema = createInsertSchema(representatives).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({
  id: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertFileImportSchema = createInsertSchema(fileImports).omit({
  id: true,
  createdAt: true,
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export const insertBackupSchema = createInsertSchema(backups).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Representative = typeof representatives.$inferSelect;
export type InsertRepresentative = z.infer<typeof insertRepresentativeSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type FileImport = typeof fileImports.$inferSelect;
export type InsertFileImport = z.infer<typeof insertFileImportSchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

export type Backup = typeof backups.$inferSelect;
export type InsertBackup = z.infer<typeof insertBackupSchema>;

// CRM Module Tables - AI-Powered Customer Relations Management

// CRM Users (separate from main admin users for access control)
export const crmUsers = pgTable("crm_users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  fullName: varchar("full_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }),
  phoneNumber: varchar("phone_number", { length: 20 }),
  role: varchar("role", { length: 30 }).notNull().default("crm_agent"), // crm_agent, crm_supervisor
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// CRM Interaction Types and Categories
export const crmInteractionTypes = pgTable("crm_interaction_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  nameEn: varchar("name_en", { length: 50 }).notNull(),
  category: varchar("category", { length: 30 }).notNull(), // call, message, meeting, email
  isActive: boolean("is_active").notNull().default(true)
});

// CRM Interactions - Comprehensive logging system
export const crmInteractions = pgTable("crm_interactions", {
  id: serial("id").primaryKey(),
  representativeId: integer("representative_id").references(() => representatives.id).notNull(),
  crmUserId: integer("crm_user_id").references(() => crmUsers.id).notNull(),
  interactionTypeId: integer("interaction_type_id").references(() => crmInteractionTypes.id).notNull(),
  direction: varchar("direction", { length: 20 }).notNull(), // inbound, outbound
  subject: varchar("subject", { length: 200 }),
  summary: text("summary"), // AI-generated summary
  manualNotes: text("manual_notes"), // CRT manual notes
  outcome: varchar("outcome", { length: 100 }), // resolved, escalated, follow_up_needed, etc.
  sentimentScore: decimal("sentiment_score", { precision: 3, scale: 2 }), // AI-derived -1.00 to 1.00
  sentimentAnalysis: text("sentiment_analysis"), // AI detailed sentiment analysis
  urgencyLevel: varchar("urgency_level", { length: 20 }).default("medium"), // low, medium, high, critical
  duration: integer("duration"), // in minutes
  followUpDate: timestamp("follow_up_date"),
  aiSuggestions: text("ai_suggestions"), // JSON string of AI suggestions
  voiceNoteUrl: varchar("voice_note_url", { length: 500 }), // URL to stored voice note
  transcription: text("transcription"), // STT result
  keyTopics: text("key_topics").array(), // AI-extracted topics
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// CRM Tasks - Intelligent task management with AI assistance
export const crmTasks = pgTable("crm_tasks", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  representativeId: integer("representative_id").references(() => representatives.id),
  assignedToCrmUserId: integer("assigned_to_crm_user_id").references(() => crmUsers.id).notNull(),
  createdByCrmUserId: integer("created_by_crm_user_id").references(() => crmUsers.id).notNull(),
  relatedInteractionId: integer("related_interaction_id").references(() => crmInteractions.id),
  status: varchar("status", { length: 30 }).notNull().default("open"), // open, in_progress, completed, overdue, cancelled
  priority: varchar("priority", { length: 20 }).notNull().default("medium"), // low, medium, high, urgent
  dueDate: timestamp("due_date"),
  aiGenerated: boolean("ai_generated").notNull().default(false), // true if created by AI
  aiContext: text("ai_context"), // AI reasoning for task creation
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// CRM Call Preparation - AI-powered call briefings
export const crmCallPreparations = pgTable("crm_call_preparations", {
  id: serial("id").primaryKey(),
  representativeId: integer("representative_id").references(() => representatives.id).notNull(),
  crmUserId: integer("crm_user_id").references(() => crmUsers.id).notNull(),
  callPurpose: varchar("call_purpose", { length: 100 }).notNull(), // support, sales, follow_up, demo
  aiTalkingPoints: text("ai_talking_points"), // JSON array of suggested talking points
  communicationStyle: text("communication_style"), // AI recommendations for tone/approach
  potentialObjections: text("potential_objections"), // JSON array of potential objections & rebuttals
  opportunityInsights: text("opportunity_insights"), // AI-identified upsell/cross-sell opportunities
  historicalContext: text("historical_context"), // AI summary of recent relevant interactions
  psychologicalProfile: text("psychological_profile"), // AI-derived communication preferences
  actualCallInteractionId: integer("actual_call_interaction_id").references(() => crmInteractions.id),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// CRM Knowledge Base - For AI assistance during calls
export const crmKnowledgeBase = pgTable("crm_knowledge_base", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // technical, sales, billing, general
  tags: text("tags").array(), // for AI search and retrieval
  isActive: boolean("is_active").notNull().default(true),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// CRM AI Processing Queue - For managing AI tasks
export const crmAiProcessingQueue = pgTable("crm_ai_processing_queue", {
  id: serial("id").primaryKey(),
  taskType: varchar("task_type", { length: 50 }).notNull(), // transcription, sentiment_analysis, summarization, etc.
  inputData: text("input_data").notNull(), // JSON data for AI processing
  status: varchar("status", { length: 30 }).notNull().default("pending"), // pending, processing, completed, failed
  result: text("result"), // AI processing result
  errorMessage: text("error_message"),
  relatedEntityType: varchar("related_entity_type", { length: 30 }), // interaction, call_prep, etc.
  relatedEntityId: integer("related_entity_id"),
  processingStartedAt: timestamp("processing_started_at"),
  processingCompletedAt: timestamp("processing_completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// CRM Representative Profiles - Enhanced profiles for CRM context
export const crmRepresentativeProfiles = pgTable("crm_representative_profiles", {
  id: serial("id").primaryKey(),
  representativeId: integer("representative_id").references(() => representatives.id).notNull().unique(),
  communicationPreference: varchar("communication_preference", { length: 30 }), // call, telegram, email
  bestContactTime: varchar("best_contact_time", { length: 50 }),
  languagePreference: varchar("language_preference", { length: 20 }).default("persian"),
  personalityNotes: text("personality_notes"), // CRT observations
  aiPersonalityProfile: text("ai_personality_profile"), // AI-derived personality insights
  lastContactAttempt: timestamp("last_contact_attempt"),
  nextScheduledContact: timestamp("next_scheduled_contact"),
  totalInteractions: integer("total_interactions").default(0),
  averageSentiment: decimal("average_sentiment", { precision: 3, scale: 2 }),
  lifetimeValue: decimal("lifetime_value", { precision: 12, scale: 2 }),
  riskScore: decimal("risk_score", { precision: 3, scale: 2 }), // AI-calculated churn risk
  opportunityScore: decimal("opportunity_score", { precision: 3, scale: 2 }), // AI-calculated upsell potential
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
