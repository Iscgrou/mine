import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

/**
 * SQLITE ADAPTATION NOTES:
 * 1) Using integer primary keys with autoIncrement for the ID columns (e.g. integer("id", { mode: "number" }).primaryKey({ autoIncrement: true })).
 * 2) Using real type instead of decimal.
 * 3) Using integer("...",{ mode: "timestamp" }) plus default(sql`CURRENT_TIMESTAMP`) for timestamps.
 * 4) Using integer("...", { mode: "boolean", falsyValue: 0, truthyValue: 1 }) for booleans.
 * 5) For columns that were arrays in PostgreSQL, storing as text. Parsing to array as needed in code.
 * 6) For columns that were jsonb, storing as text (developer can parse in code).
 * 7) For references(), referencing the integer ID columns in this file.
 */

////////////////////////////////////////////////////////////////////////////////
// USERS
////////////////////////////////////////////////////////////////////////////////
export const users = sqliteTable("users", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  role: text("role").default("admin"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`),
});

////////////////////////////////////////////////////////////////////////////////
// REPRESENTATIVES
////////////////////////////////////////////////////////////////////////////////
export const representatives = sqliteTable("representatives", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  fullName: text("full_name").notNull(),
  adminUsername: text("admin_username").notNull().unique(),
  telegramId: text("telegram_id"),
  phoneNumber: text("phone_number"),
  storeName: text("store_name"),
  // Limited subscription pricing for 1-6 months (per GB in Toman)
  limitedPrice1Month: real("limited_price_1_month").default(900),
  limitedPrice2Month: real("limited_price_2_month").default(900),
  limitedPrice3Month: real("limited_price_3_month").default(900),
  limitedPrice4Month: real("limited_price_4_month").default(1400),
  limitedPrice5Month: real("limited_price_5_month").default(1500),
  limitedPrice6Month: real("limited_price_6_month").default(1600),
  // Unlimited subscription pricing for 1-6 months
  unlimitedPrice1Month: real("unlimited_price_1_month").default(40000),
  unlimitedPrice2Month: real("unlimited_price_2_month").default(80000),
  unlimitedPrice3Month: real("unlimited_price_3_month").default(120000),
  unlimitedPrice4Month: real("unlimited_price_4_month").default(160000),
  unlimitedPrice5Month: real("unlimited_price_5_month").default(200000),
  unlimitedPrice6Month: real("unlimited_price_6_month").default(240000),
  status: text("status").default("active"),
  sourcingType: text("sourcing_type").default("direct"),
  collaboratorId: integer("collaborator_id"),
  volumeCommissionRate: real("volume_commission_rate"),
  unlimitedCommissionRate: real("unlimited_commission_rate"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`),
});

////////////////////////////////////////////////////////////////////////////////
// INVOICE BATCHES
////////////////////////////////////////////////////////////////////////////////
export const invoiceBatches = sqliteTable("invoice_batches", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  batchName: text("batch_name").notNull(),
  uploadDate: integer("upload_date", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`),
  fileName: text("file_name").notNull(),
  totalInvoices: integer("total_invoices").default(0),
  totalAmount: real("total_amount").default(0),
  processingStatus: text("processing_status").default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`),
});

////////////////////////////////////////////////////////////////////////////////
// INVOICES
////////////////////////////////////////////////////////////////////////////////
export const invoices = sqliteTable("invoices", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  invoiceNumber: text("invoice_number").notNull().unique(),
  representativeId: integer("representative_id"),
  batchId: integer("batch_id"),
  totalAmount: real("total_amount").notNull(),
  baseAmount: real("base_amount").notNull(),
  discountAmount: real("discount_amount").default(0),
  taxAmount: real("tax_amount").default(0),
  status: text("status").default("pending"),
  dueDate: integer("due_date", { mode: "timestamp" }),
  paidDate: integer("paid_date", { mode: "timestamp" }),
  // invoiceData was jsonb in pg, store as text
  invoiceData: text("invoice_data"),
  autoCalculated: integer("auto_calculated", { mode: "boolean", falsyValue: 0, truthyValue: 1 })
    .default(1),
  priceSource: text("price_source").default("representative_rate"),
  telegramSent: integer("telegram_sent", { mode: "boolean", falsyValue: 0, truthyValue: 1 })
    .default(0),
  sentToRepresentative: integer("sent_to_representative", { mode: "boolean", falsyValue: 0, truthyValue: 1 })
    .default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`),
  userId: text("user_id"),
});

////////////////////////////////////////////////////////////////////////////////
// INVOICE ITEMS
////////////////////////////////////////////////////////////////////////////////
export const invoiceItems = sqliteTable("invoice_items", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  invoiceId: integer("invoice_id").notNull(),
  description: text("description").notNull(),
  serviceType: text("service_type").notNull(),
  durationMonths: integer("duration_months").notNull(),
  quantity: real("quantity").default(1),
  unitPrice: real("unit_price").notNull(),
  totalPrice: real("total_price").notNull(),
  commissionRate: real("commission_rate"),
  commissionAmount: real("commission_amount"),
});

////////////////////////////////////////////////////////////////////////////////
// STATISTICS CACHE
////////////////////////////////////////////////////////////////////////////////
export const statisticsCache = sqliteTable("statistics_cache", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  metricKey: text("metric_key").notNull().unique(),
  metricValue: text("metric_value").notNull(),
  dataType: text("data_type").default("number"),
  calculatedAt: integer("calculated_at", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`),
  validUntil: integer("valid_until", { mode: "timestamp" }),
});

////////////////////////////////////////////////////////////////////////////////
// FILE IMPORTS
////////////////////////////////////////////////////////////////////////////////
export const fileImports = sqliteTable("file_imports", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  fileName: text("file_name").notNull(),
  recordsProcessed: integer("records_processed").default(0),
  recordsSkipped: integer("records_skipped").default(0),
  status: text("status").default("processing"),
  errorDetails: text("error_details"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`),
});

////////////////////////////////////////////////////////////////////////////////
// FINANCIAL LEDGER
////////////////////////////////////////////////////////////////////////////////
export const financialLedger = sqliteTable("financial_ledger", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  representativeId: integer("representative_id").notNull(),
  transactionDate: integer("transaction_date", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  transactionType: text("transaction_type").notNull(),
  amount: real("amount").notNull(),
  runningBalance: real("running_balance").notNull(),
  referenceId: integer("reference_id"),
  referenceNumber: text("reference_number"),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`),
});

////////////////////////////////////////////////////////////////////////////////
// COLLABORATORS
////////////////////////////////////////////////////////////////////////////////
export const collaborators = sqliteTable("collaborators", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  collaboratorName: text("collaborator_name").notNull(),
  uniqueCollaboratorId: text("unique_collaborator_id").notNull().unique(),
  phoneNumber: text("phone_number"),
  telegramId: text("telegram_id"),
  email: text("email"),
  bankAccountDetails: text("bank_account_details"),
  currentAccumulatedEarnings: real("current_accumulated_earnings").default(0),
  totalEarningsToDate: real("total_earnings_to_date").default(0),
  totalPayoutsToDate: real("total_payouts_to_date").default(0),
  status: text("status").default("active"),
  commissionPercentage: real("commission_percentage").default(10.0),
  dateJoined: integer("date_joined", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`),
});

////////////////////////////////////////////////////////////////////////////////
// COMMISSION RECORDS
////////////////////////////////////////////////////////////////////////////////
export const commissionRecords = sqliteTable("commission_records", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  collaboratorId: integer("collaborator_id").notNull(),
  representativeId: integer("representative_id").notNull(),
  invoiceId: integer("invoice_id"),
  batchId: integer("batch_id"),
  transactionDate: integer("transaction_date", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  revenueType: text("revenue_type").notNull(),
  baseRevenueAmount: real("base_revenue_amount").notNull(),
  commissionRate: real("commission_rate").notNull(),
  commissionAmount: real("commission_amount").notNull(),
  calculationMethod: text("calculation_method").default("automatic"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`),
});

////////////////////////////////////////////////////////////////////////////////
// COLLABORATOR PAYOUTS
////////////////////////////////////////////////////////////////////////////////
export const collaboratorPayouts = sqliteTable("collaborator_payouts", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  collaboratorId: integer("collaborator_id").notNull(),
  payoutAmount: real("payout_amount").notNull(),
  payoutDate: integer("payout_date", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  adminUserId: integer("admin_user_id"),
  paymentMethod: text("payment_method"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`),
});

////////////////////////////////////////////////////////////////////////////////
// SETTINGS
////////////////////////////////////////////////////////////////////////////////
export const settings = sqliteTable("settings", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value"),
  description: text("description"),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`),
});

////////////////////////////////////////////////////////////////////////////////
// BACKUPS
////////////////////////////////////////////////////////////////////////////////
export const backups = sqliteTable("backups", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size"),
  backupType: text("backup_type").default("manual"),
  googleDriveFileId: text("google_drive_file_id"),
  status: text("status").default("completed"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`),
});

////////////////////////////////////////////////////////////////////////////////
// CRM USERS (TEAM MEMBERS)
////////////////////////////////////////////////////////////////////////////////
export const crmUsers = sqliteTable("crm_users", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").default("agent"),
  isActive: integer("is_active", { mode: "boolean", falsyValue: 0, truthyValue: 1 })
    .default(1),
  lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

////////////////////////////////////////////////////////////////////////////////
// CRM INTERACTION TYPES
////////////////////////////////////////////////////////////////////////////////
export const crmInteractionTypes = sqliteTable("crm_interaction_types", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  description: text("description"),
  color: text("color").default("#6B7280"),
  isActive: integer("is_active", { mode: "boolean", falsyValue: 0, truthyValue: 1 })
    .default(1),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

////////////////////////////////////////////////////////////////////////////////
// CRM INTERACTIONS
////////////////////////////////////////////////////////////////////////////////
export const crmInteractions = sqliteTable("crm_interactions", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  representativeId: integer("representative_id").notNull(),
  crmUserId: integer("crm_user_id").notNull(),
  interactionTypeId: integer("interaction_type_id").notNull(),
  direction: text("direction").notNull(),
  subject: text("subject"),
  summary: text("summary"),
  manualNotes: text("manual_notes"),
  outcome: text("outcome"),
  sentimentScore: real("sentiment_score"),
  sentimentAnalysis: text("sentiment_analysis"),
  urgencyLevel: text("urgency_level").default("medium"),
  duration: integer("duration"),
  followUpDate: integer("follow_up_date", { mode: "timestamp" }),
  aiSuggestions: text("ai_suggestions"),
  voiceNoteUrl: text("voice_note_url"),
  transcription: text("transcription"),
  // keyTopics: text("key_topics").??? storing arrays as text
  keyTopics: text("key_topics"), // developer can parse string -> array
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

////////////////////////////////////////////////////////////////////////////////
// CRM TASKS
////////////////////////////////////////////////////////////////////////////////
export const crmTasks = sqliteTable("crm_tasks", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  representativeId: integer("representative_id").notNull(),
  crmUserId: integer("crm_user_id").notNull(),
  interactionId: integer("interaction_id"),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").default("medium"),
  status: text("status").default("pending"),
  dueDate: integer("due_date", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  aiGenerated: integer("ai_generated", { mode: "boolean", falsyValue: 0, truthyValue: 1 })
    .default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

////////////////////////////////////////////////////////////////////////////////
// CRM CALL PREPARATIONS
////////////////////////////////////////////////////////////////////////////////
export const crmCallPreparations = sqliteTable("crm_call_preparations", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  representativeId: integer("representative_id").notNull(),
  crmUserId: integer("crm_user_id").notNull(),
  callPurpose: text("call_purpose").notNull(),
  aiTalkingPoints: text("ai_talking_points"), // store JSON as text
  representativeBackground: text("representative_background"),
  lastInteractionSummary: text("last_interaction_summary"),
  suggestedApproach: text("suggested_approach"),
  riskFactors: text("risk_factors"),
  opportunities: text("opportunities"),
  culturalNotes: text("cultural_notes"),
  emotionalState: text("emotional_state"),
  optimalTiming: text("optimal_timing"),
  expectedOutcome: text("expected_outcome"),
  actualCallInteractionId: integer("actual_call_interaction_id"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

////////////////////////////////////////////////////////////////////////////////
// CRM REPRESENTATIVE PROFILES
////////////////////////////////////////////////////////////////////////////////
export const crmRepresentativeProfiles = sqliteTable("crm_representative_profiles", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  representativeId: integer("representative_id").notNull().unique(),
  communicationPreference: text("communication_preference"),
  bestContactTime: text("best_contact_time"),
  languagePreference: text("language_preference").default("persian"),
  personalityNotes: text("personality_notes"),
  aiPersonalityProfile: text("ai_personality_profile"),
  lastContactAttempt: integer("last_contact_attempt", { mode: "timestamp" }),
  nextScheduledContact: integer("next_scheduled_contact", { mode: "timestamp" }),
  totalInteractions: integer("total_interactions").default(0),
  averageSentiment: real("average_sentiment"),
  lifetimeValue: real("lifetime_value"),
  riskScore: real("risk_score"),
  opportunityScore: real("opportunity_score"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

////////////////////////////////////////////////////////////////////////////////
// CRM KNOWLEDGE BASE
////////////////////////////////////////////////////////////////////////////////
export const crmKnowledgeBase = sqliteTable("crm_knowledge_base", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  // tags: text("tags").array() => use text for storing an array
  tags: text("tags"),
  isActive: integer("is_active", { mode: "boolean", falsyValue: 0, truthyValue: 1 })
    .default(1),
  lastUpdated: integer("last_updated", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

////////////////////////////////////////////////////////////////////////////////
// CRM AI PROCESSING QUEUE
////////////////////////////////////////////////////////////////////////////////
export const crmAiProcessingQueue = sqliteTable("crm_ai_processing_queue", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  taskType: text("task_type").notNull(),
  inputData: text("input_data").notNull(),
  status: text("status").default("pending"),
  result: text("result"),
  errorMessage: text("error_message"),
  relatedEntityType: text("related_entity_type"),
  relatedEntityId: integer("related_entity_id"),
  processingStartedAt: integer("processing_started_at", { mode: "timestamp" }),
  processingCompletedAt: integer("processing_completed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

////////////////////////////////////////////////////////////////////////////////
// RELATIONS (where possible)
////////////////////////////////////////////////////////////////////////////////
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

export const crmUsersRelations = relations(crmUsers, ({ many }) => ({
  interactions: many(crmInteractions),
  tasks: many(crmTasks),
  callPreparations: many(crmCallPreparations),
}));

export const crmInteractionTypesRelations = relations(crmInteractionTypes, ({ many }) => ({
  interactions: many(crmInteractions),
}));

export const crmInteractionsRelations = relations(crmInteractions, ({ one, many }) => ({
  representative: one(representatives, {
    fields: [crmInteractions.representativeId],
    references: [representatives.id],
  }),
  crmUser: one(crmUsers, {
    fields: [crmInteractions.crmUserId],
    references: [crmUsers.id],
  }),
  interactionType: one(crmInteractionTypes, {
    fields: [crmInteractions.interactionTypeId],
    references: [crmInteractionTypes.id],
  }),
  tasks: many(crmTasks),
  callPreparations: many(crmCallPreparations),
}));

export const crmTasksRelations = relations(crmTasks, ({ one }) => ({
  representative: one(representatives, {
    fields: [crmTasks.representativeId],
    references: [representatives.id],
  }),
  crmUser: one(crmUsers, {
    fields: [crmTasks.crmUserId],
    references: [crmUsers.id],
  }),
  interaction: one(crmInteractions, {
    fields: [crmTasks.interactionId],
    references: [crmInteractions.id],
  }),
}));

export const crmCallPreparationsRelations = relations(crmCallPreparations, ({ one }) => ({
  representative: one(representatives, {
    fields: [crmCallPreparations.representativeId],
    references: [representatives.id],
  }),
  crmUser: one(crmUsers, {
    fields: [crmCallPreparations.crmUserId],
    references: [crmUsers.id],
  }),
  actualCallInteraction: one(crmInteractions, {
    fields: [crmCallPreparations.actualCallInteractionId],
    references: [crmInteractions.id],
  }),
}));

export const crmRepresentativeProfilesRelations = relations(crmRepresentativeProfiles, ({ one }) => ({
  representative: one(representatives, {
    fields: [crmRepresentativeProfiles.representativeId],
    references: [representatives.id],
  }),
}));

////////////////////////////////////////////////////////////////////////////////
// ZOD SCHEMAS (Insert Schemas)
////////////////////////////////////////////////////////////////////////////////
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export const insertRepresentativeSchema = createInsertSchema(representatives).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type Representative = typeof representatives.$inferSelect;
export type InsertRepresentative = z.infer<typeof insertRepresentativeSchema>;

export const insertInvoiceBatchSchema = createInsertSchema(invoiceBatches).omit({
  id: true,
  createdAt: true,
});
export type InvoiceBatch = typeof invoiceBatches.$inferSelect;
export type InsertInvoiceBatch = z.infer<typeof insertInvoiceBatchSchema>;

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({
  id: true,
});
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;

export const insertStatisticsCacheSchema = createInsertSchema(statisticsCache).omit({
  id: true,
  calculatedAt: true,
});
export type StatisticsCache = typeof statisticsCache.$inferSelect;
export type InsertStatisticsCache = z.infer<typeof insertStatisticsCacheSchema>;

export const insertFileImportSchema = createInsertSchema(fileImports).omit({
  id: true,
  createdAt: true,
});
export type FileImport = typeof fileImports.$inferSelect;
export type InsertFileImport = z.infer<typeof insertFileImportSchema>;

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});
export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

export const insertFinancialLedgerSchema = createInsertSchema(financialLedger).omit({
  id: true,
  createdAt: true,
});
export type FinancialLedger = typeof financialLedger.$inferSelect;
export type InsertFinancialLedger = z.infer<typeof insertFinancialLedgerSchema>;

export const insertCollaboratorSchema = createInsertSchema(collaborators).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type Collaborator = typeof collaborators.$inferSelect;
