import { pgTable, text, varchar, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
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
  telegramId: text("telegram_id"), // Full URL format: https://t.me/username
  phoneNumber: text("phone_number"),
  storeName: text("store_name"),
  // Limited subscription pricing for 1-6 months (per GB in Toman)
  limitedPrice1Month: decimal("limited_price_1_month", { precision: 10, scale: 2 }).default("900"),
  limitedPrice2Month: decimal("limited_price_2_month", { precision: 10, scale: 2 }).default("900"),
  limitedPrice3Month: decimal("limited_price_3_month", { precision: 10, scale: 2 }).default("900"),
  limitedPrice4Month: decimal("limited_price_4_month", { precision: 10, scale: 2 }).default("1400"),
  limitedPrice5Month: decimal("limited_price_5_month", { precision: 10, scale: 2 }).default("1500"),
  limitedPrice6Month: decimal("limited_price_6_month", { precision: 10, scale: 2 }).default("1600"),
  // Unlimited subscription pricing by month duration (in Toman)
  unlimitedPrice1Month: decimal("unlimited_price_1_month", { precision: 10, scale: 2 }).default("40000"),
  unlimitedPrice2Month: decimal("unlimited_price_2_month", { precision: 10, scale: 2 }).default("80000"),
  unlimitedPrice3Month: decimal("unlimited_price_3_month", { precision: 10, scale: 2 }).default("120000"),
  unlimitedPrice4Month: decimal("unlimited_price_4_month", { precision: 10, scale: 2 }).default("160000"),
  unlimitedPrice5Month: decimal("unlimited_price_5_month", { precision: 10, scale: 2 }).default("200000"),
  unlimitedPrice6Month: decimal("unlimited_price_6_month", { precision: 10, scale: 2 }).default("240000"),
  status: text("status").default("active"), // active, inactive, suspended
  // Collaborator Program Fields
  sourcingType: text("sourcing_type").default("direct"), // 'direct', 'collaborator_introduced'
  collaboratorId: integer("collaborator_id").references(() => collaborators.id),
  volumeCommissionRate: decimal("volume_commission_rate", { precision: 5, scale: 2 }), // Percentage for volume subscriptions
  unlimitedCommissionRate: decimal("unlimited_commission_rate", { precision: 5, scale: 2 }), // Percentage for unlimited subscriptions
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoice System v2.0 - JSON-based with real-time processing
export const invoiceBatches = pgTable("invoice_batches", {
  id: serial("id").primaryKey(),
  batchName: text("batch_name").notNull(), // Persian date format
  uploadDate: timestamp("upload_date").defaultNow(),
  fileName: text("file_name").notNull(), // Original JSON file name
  totalInvoices: integer("total_invoices").default(0),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).default("0"),
  processingStatus: text("processing_status").default("pending"), // pending, processing, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  representativeId: integer("representative_id").references(() => representatives.id),
  batchId: integer("batch_id").references(() => invoiceBatches.id),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  baseAmount: decimal("base_amount", { precision: 15, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 15, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 15, scale: 2 }).default("0"),
  status: text("status").default("pending"), // pending, paid, overdue, cancelled
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  invoiceData: jsonb("invoice_data"), // Complete JSON structure
  autoCalculated: boolean("auto_calculated").default(true),
  priceSource: text("price_source").default("representative_rate"), // representative_rate, manual, override
  telegramSent: boolean("telegram_sent").default(false),
  sentToRepresentative: boolean("sent_to_representative").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  userId: text("user_id"),
});

export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id).notNull(),
  description: text("description").notNull(),
  serviceType: text("service_type").notNull(), // limited, unlimited
  durationMonths: integer("duration_months").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).default("1"),
  unitPrice: decimal("unit_price", { precision: 15, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 15, scale: 2 }).notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }),
  commissionAmount: decimal("commission_amount", { precision: 12, scale: 2 }),
});

// Real-time Statistics Engine
export const statisticsCache = pgTable("statistics_cache", {
  id: serial("id").primaryKey(),
  metricKey: text("metric_key").notNull().unique(),
  metricValue: text("metric_value").notNull(),
  dataType: text("data_type").default("number"), // number, currency, percentage, count
  calculatedAt: timestamp("calculated_at").defaultNow(),
  validUntil: timestamp("valid_until"),
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

// Financial ledger for representative transactions
export const financialLedger = pgTable("financial_ledger", {
  id: serial("id").primaryKey(),
  representativeId: integer("representative_id").references(() => representatives.id).notNull(),
  transactionDate: timestamp("transaction_date").defaultNow().notNull(),
  transactionType: text("transaction_type").notNull(), // 'invoice', 'payment'
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  runningBalance: decimal("running_balance", { precision: 12, scale: 2 }).notNull(),
  referenceId: integer("reference_id"), // Invoice ID or Payment ID
  referenceNumber: text("reference_number"), // Invoice Number or Payment Reference
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Collaborators (Affiliate/Partner Program)
export const collaborators = pgTable("collaborators", {
  id: serial("id").primaryKey(),
  collaboratorName: text("collaborator_name").notNull(),
  uniqueCollaboratorId: text("unique_collaborator_id").notNull().unique(),
  phoneNumber: text("phone_number"),
  telegramId: text("telegram_id"),
  email: text("email"),
  bankAccountDetails: text("bank_account_details"), // Encrypted storage
  currentAccumulatedEarnings: decimal("current_accumulated_earnings", { precision: 12, scale: 2 }).default("0"),
  totalEarningsToDate: decimal("total_earnings_to_date", { precision: 12, scale: 2 }).default("0"),
  totalPayoutsToDate: decimal("total_payouts_to_date", { precision: 12, scale: 2 }).default("0"),
  status: text("status").default("active"), // active, inactive, pending_approval
  commissionPercentage: decimal("commission_percentage", { precision: 5, scale: 2 }).default("10.00"), // Commission percentage for this collaborator
  dateJoined: timestamp("date_joined").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Commission Records for detailed tracking - Enhanced for invoice integration
export const commissionRecords = pgTable("commission_records", {
  id: serial("id").primaryKey(),
  collaboratorId: integer("collaborator_id").references(() => collaborators.id).notNull(),
  representativeId: integer("representative_id").references(() => representatives.id).notNull(),
  invoiceId: integer("invoice_id").references(() => invoices.id),
  batchId: integer("batch_id").references(() => invoiceBatches.id),
  transactionDate: timestamp("transaction_date").defaultNow().notNull(),
  revenueType: text("revenue_type").notNull(), // 'volume', 'unlimited'
  baseRevenueAmount: decimal("base_revenue_amount", { precision: 12, scale: 2 }).notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(),
  commissionAmount: decimal("commission_amount", { precision: 12, scale: 2 }).notNull(),
  calculationMethod: text("calculation_method").default("automatic"), // automatic, manual, override
  createdAt: timestamp("created_at").defaultNow(),
});

// Collaborator Payouts tracking
export const collaboratorPayouts = pgTable("collaborator_payouts", {
  id: serial("id").primaryKey(),
  collaboratorId: integer("collaborator_id").references(() => collaborators.id).notNull(),
  payoutAmount: decimal("payout_amount", { precision: 12, scale: 2 }).notNull(),
  payoutDate: timestamp("payout_date").defaultNow().notNull(),
  adminUserId: integer("admin_user_id").references(() => users.id),
  paymentMethod: text("payment_method"),
  notes: text("notes"),
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

// Relations - Enhanced for Invoice Integration
export const collaboratorsRelations = relations(collaborators, ({ many }) => ({
  representatives: many(representatives),
  commissionRecords: many(commissionRecords),
  payouts: many(collaboratorPayouts),
}));

export const representativesRelations = relations(representatives, ({ many, one }) => ({
  invoices: many(invoices),
  ledgerEntries: many(financialLedger),
  collaborator: one(collaborators, {
    fields: [representatives.collaboratorId],
    references: [collaborators.id],
  }),
  commissionRecords: many(commissionRecords),
}));

export const invoiceBatchesRelations = relations(invoiceBatches, ({ many }) => ({
  invoices: many(invoices),
  commissionRecords: many(commissionRecords),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  representative: one(representatives, {
    fields: [invoices.representativeId],
    references: [representatives.id],
  }),
  batch: one(invoiceBatches, {
    fields: [invoices.batchId],
    references: [invoiceBatches.id],
  }),
  items: many(invoiceItems),
  commissionRecords: many(commissionRecords),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

export const commissionRecordsRelations = relations(commissionRecords, ({ one }) => ({
  collaborator: one(collaborators, {
    fields: [commissionRecords.collaboratorId],
    references: [collaborators.id],
  }),
  representative: one(representatives, {
    fields: [commissionRecords.representativeId],
    references: [representatives.id],
  }),
  invoice: one(invoices, {
    fields: [commissionRecords.invoiceId],
    references: [invoices.id],
  }),
  batch: one(invoiceBatches, {
    fields: [commissionRecords.batchId],
    references: [invoiceBatches.id],
  }),
}));

export const collaboratorPayoutsRelations = relations(collaboratorPayouts, ({ one }) => ({
  collaborator: one(collaborators, {
    fields: [collaboratorPayouts.collaboratorId],
    references: [collaborators.id],
  }),
  adminUser: one(users, {
    fields: [collaboratorPayouts.adminUserId],
    references: [users.id],
  }),
}));

export const financialLedgerRelations = relations(financialLedger, ({ one }) => ({
  representative: one(representatives, {
    fields: [financialLedger.representativeId],
    references: [representatives.id],
  }),
}));

// Clean slate - invoice relations removed as requested

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

// Invoice System v2.0 Schemas
export const insertInvoiceBatchSchema = createInsertSchema(invoiceBatches).omit({
  id: true,
  createdAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({
  id: true,
});

export const insertStatisticsCacheSchema = createInsertSchema(statisticsCache).omit({
  id: true,
  calculatedAt: true,
});

// Collaborator schemas moved below to avoid duplicates

export const insertFileImportSchema = createInsertSchema(fileImports).omit({
  id: true,
  createdAt: true,
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export const insertFinancialLedgerSchema = createInsertSchema(financialLedger).omit({
  id: true,
  createdAt: true,
});

export const insertCollaboratorSchema = createInsertSchema(collaborators).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommissionRecordSchema = createInsertSchema(commissionRecords).omit({
  id: true,
  createdAt: true,
});

export const insertCollaboratorPayoutSchema = createInsertSchema(collaboratorPayouts).omit({
  id: true,
  createdAt: true,
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

// Invoice System v2.0 Types
export type InvoiceBatch = typeof invoiceBatches.$inferSelect;
export type InsertInvoiceBatch = z.infer<typeof insertInvoiceBatchSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;

export type StatisticsCache = typeof statisticsCache.$inferSelect;
export type InsertStatisticsCache = z.infer<typeof insertStatisticsCacheSchema>;

export type FileImport = typeof fileImports.$inferSelect;
export type InsertFileImport = z.infer<typeof insertFileImportSchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

export type FinancialLedger = typeof financialLedger.$inferSelect;
export type InsertFinancialLedger = z.infer<typeof insertFinancialLedgerSchema>;

export type Collaborator = typeof collaborators.$inferSelect;
export type InsertCollaborator = z.infer<typeof insertCollaboratorSchema>;

export type CommissionRecord = typeof commissionRecords.$inferSelect;
export type InsertCommissionRecord = z.infer<typeof insertCommissionRecordSchema>;

export type CollaboratorPayout = typeof collaboratorPayouts.$inferSelect;
export type InsertCollaboratorPayout = z.infer<typeof insertCollaboratorPayoutSchema>;

export type Backup = typeof backups.$inferSelect;
export type InsertBackup = z.infer<typeof insertBackupSchema>;

// CRM Users - Team members who use the CRM system
export const crmUsers = pgTable("crm_users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  fullName: varchar("full_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  role: varchar("role", { length: 30 }).notNull().default("agent"), // agent, supervisor, manager
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// CRM Interaction Types - Categories for different types of interactions
export const crmInteractionTypes = pgTable("crm_interaction_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#6B7280"), // hex color
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull()
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
  voiceNoteUrl: text("voice_note_url"), // URL to stored voice recording
  transcription: text("transcription"), // Speech-to-text result
  keyTopics: text("key_topics").array(), // AI-extracted topics
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// CRM Tasks - Follow-up tasks and reminders
export const crmTasks = pgTable("crm_tasks", {
  id: serial("id").primaryKey(),
  representativeId: integer("representative_id").references(() => representatives.id).notNull(),
  crmUserId: integer("crm_user_id").references(() => crmUsers.id).notNull(),
  interactionId: integer("interaction_id").references(() => crmInteractions.id),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high, urgent
  status: varchar("status", { length: 30 }).default("pending"), // pending, in_progress, completed, cancelled
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  aiGenerated: boolean("ai_generated").default(false), // true if task was AI-suggested
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// CRM Call Preparations - AI-powered call planning
export const crmCallPreparations = pgTable("crm_call_preparations", {
  id: serial("id").primaryKey(),
  representativeId: integer("representative_id").references(() => representatives.id).notNull(),
  crmUserId: integer("crm_user_id").references(() => crmUsers.id).notNull(),
  callPurpose: varchar("call_purpose", { length: 100 }).notNull(),
  aiTalkingPoints: text("ai_talking_points"), // JSON array of AI-generated points
  representativeBackground: text("representative_background"), // AI-compiled summary
  lastInteractionSummary: text("last_interaction_summary"),
  suggestedApproach: text("suggested_approach"), // AI recommendation
  riskFactors: text("risk_factors"), // AI-identified potential issues
  opportunities: text("opportunities"), // AI-identified upsell/cross-sell opportunities
  culturalNotes: text("cultural_notes"), // AI cultural sensitivity suggestions
  emotionalState: varchar("emotional_state", { length: 50 }), // AI-inferred current state
  optimalTiming: text("optimal_timing"), // AI suggestion for best contact time
  expectedOutcome: varchar("expected_outcome", { length: 100 }),
  actualCallInteractionId: integer("actual_call_interaction_id").references(() => crmInteractions.id),
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

// Define relationships
export const crmUsersRelations = relations(crmUsers, ({ many }) => ({
  interactions: many(crmInteractions),
  tasks: many(crmTasks),
  callPreparations: many(crmCallPreparations)
}));

export const crmInteractionTypesRelations = relations(crmInteractionTypes, ({ many }) => ({
  interactions: many(crmInteractions)
}));

export const crmInteractionsRelations = relations(crmInteractions, ({ one, many }) => ({
  representative: one(representatives, {
    fields: [crmInteractions.representativeId],
    references: [representatives.id]
  }),
  crmUser: one(crmUsers, {
    fields: [crmInteractions.crmUserId],
    references: [crmUsers.id]
  }),
  interactionType: one(crmInteractionTypes, {
    fields: [crmInteractions.interactionTypeId],
    references: [crmInteractionTypes.id]
  }),
  tasks: many(crmTasks),
  callPreparations: many(crmCallPreparations)
}));

export const crmTasksRelations = relations(crmTasks, ({ one }) => ({
  representative: one(representatives, {
    fields: [crmTasks.representativeId],
    references: [representatives.id]
  }),
  crmUser: one(crmUsers, {
    fields: [crmTasks.crmUserId],
    references: [crmUsers.id]
  }),
  interaction: one(crmInteractions, {
    fields: [crmTasks.interactionId],
    references: [crmInteractions.id]
  })
}));

export const crmCallPreparationsRelations = relations(crmCallPreparations, ({ one }) => ({
  representative: one(representatives, {
    fields: [crmCallPreparations.representativeId],
    references: [representatives.id]
  }),
  crmUser: one(crmUsers, {
    fields: [crmCallPreparations.crmUserId],
    references: [crmUsers.id]
  }),
  actualCallInteraction: one(crmInteractions, {
    fields: [crmCallPreparations.actualCallInteractionId],
    references: [crmInteractions.id]
  })
}));

export const crmRepresentativeProfilesRelations = relations(crmRepresentativeProfiles, ({ one }) => ({
  representative: one(representatives, {
    fields: [crmRepresentativeProfiles.representativeId],
    references: [representatives.id]
  })
}));

// Insert schemas for CRM tables
export const insertCrmUserSchema = createInsertSchema(crmUsers).omit({
  id: true,
  createdAt: true
});

export const insertCrmInteractionTypeSchema = createInsertSchema(crmInteractionTypes).omit({
  id: true,
  createdAt: true
});

export const insertCrmInteractionSchema = createInsertSchema(crmInteractions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCrmTaskSchema = createInsertSchema(crmTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCrmCallPreparationSchema = createInsertSchema(crmCallPreparations).omit({
  id: true,
  createdAt: true
});

export const insertCrmRepresentativeProfileSchema = createInsertSchema(crmRepresentativeProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCrmKnowledgeBaseSchema = createInsertSchema(crmKnowledgeBase).omit({
  id: true,
  createdAt: true,
  lastUpdated: true
});

export const insertCrmAiProcessingQueueSchema = createInsertSchema(crmAiProcessingQueue).omit({
  id: true,
  createdAt: true
});

// Type exports for CRM tables
export type CrmUser = typeof crmUsers.$inferSelect;
export type InsertCrmUser = z.infer<typeof insertCrmUserSchema>;

export type CrmInteractionType = typeof crmInteractionTypes.$inferSelect;
export type InsertCrmInteractionType = z.infer<typeof insertCrmInteractionTypeSchema>;

export type CrmInteraction = typeof crmInteractions.$inferSelect;
export type InsertCrmInteraction = z.infer<typeof insertCrmInteractionSchema>;

export type CrmTask = typeof crmTasks.$inferSelect;
export type InsertCrmTask = z.infer<typeof insertCrmTaskSchema>;

export type CrmCallPreparation = typeof crmCallPreparations.$inferSelect;
export type InsertCrmCallPreparation = z.infer<typeof insertCrmCallPreparationSchema>;

export type CrmRepresentativeProfile = typeof crmRepresentativeProfiles.$inferSelect;
export type InsertCrmRepresentativeProfile = z.infer<typeof insertCrmRepresentativeProfileSchema>;

export type CrmKnowledgeBase = typeof crmKnowledgeBase.$inferSelect;
export type InsertCrmKnowledgeBase = z.infer<typeof insertCrmKnowledgeBaseSchema>;

export type CrmAiProcessingQueue = typeof crmAiProcessingQueue.$inferSelect;
export type InsertCrmAiProcessingQueue = z.infer<typeof insertCrmAiProcessingQueueSchema>;

