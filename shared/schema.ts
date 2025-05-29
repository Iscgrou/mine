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
