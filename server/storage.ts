import { 
  users, representatives, invoices, invoiceItems, payments, 
  fileImports, settings, backups, crmInteractions, crmCallPreparations, 
  crmRepresentativeProfiles, crmTasks, invoiceBatches, financialLedger,
  type User, type InsertUser, type Representative, type InsertRepresentative,
  type Invoice, type InsertInvoice, type InvoiceItem, type InsertInvoiceItem,
  type Payment, type InsertPayment, type FileImport, type InsertFileImport,
  type Setting, type InsertSetting, type Backup, type InsertBackup,
  type CrmInteraction, type InsertCrmInteraction,
  type CrmCallPreparation, type InsertCrmCallPreparation,
  type CrmRepresentativeProfile, type InsertCrmRepresentativeProfile,
  type InvoiceBatch, type InsertInvoiceBatch, type FinancialLedger, type InsertFinancialLedger
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, isNull, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Representative methods
  getRepresentatives(): Promise<Representative[]>;
  getRepresentativeById(id: number): Promise<Representative | undefined>;
  getRepresentativeByAdminUsername(adminUsername: string): Promise<Representative | undefined>;
  createRepresentative(rep: InsertRepresentative): Promise<Representative>;
  updateRepresentative(id: number, rep: Partial<InsertRepresentative>): Promise<Representative>;
  deleteRepresentative(id: number): Promise<void>;
  searchRepresentatives(query: string): Promise<Representative[]>;
  getRepresentativeBalance(id: number): Promise<number>;
  getRepresentativesWithBalance(): Promise<(Representative & { currentBalance: number })[]>;

  // Financial ledger methods
  createLedgerEntry(entry: InsertFinancialLedger): Promise<FinancialLedger>;
  getRepresentativeLedger(representativeId: number): Promise<FinancialLedger[]>;
  recordInvoiceInLedger(invoiceId: number, representativeId: number, amount: number, invoiceNumber: string): Promise<void>;
  recordPaymentInLedger(paymentId: number, representativeId: number, amount: number, paymentReference?: string): Promise<void>;

  // Invoice batch methods
  createInvoiceBatch(batch: InsertInvoiceBatch): Promise<InvoiceBatch>;
  getInvoiceBatches(): Promise<InvoiceBatch[]>;
  getInvoiceBatchById(id: number): Promise<InvoiceBatch | undefined>;
  updateInvoiceBatch(id: number, updates: Partial<InsertInvoiceBatch>): Promise<void>;

  // Invoice methods
  getInvoices(): Promise<(Invoice & { representative: Representative | null, batch: InvoiceBatch | null })[]>;
  getInvoiceById(id: number): Promise<(Invoice & { representative: Representative | null, items: InvoiceItem[], batch: InvoiceBatch | null }) | undefined>;
  getInvoicesByBatch(batchId: number): Promise<(Invoice & { representative: Representative | null })[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoiceStatus(id: number, status: string): Promise<void>;
  updateInvoiceTelegramStatus(id: number, telegramSent: boolean, sentToRepresentative: boolean): Promise<void>;
  getInvoicesByRepresentative(representativeId: number): Promise<Invoice[]>;

  // Invoice items methods
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]>;

  // Payment methods
  getPayments(): Promise<(Payment & { representative: Representative | null, invoice: Invoice | null })[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByRepresentative(representativeId: number): Promise<Payment[]>;

  // File import methods
  createFileImport(fileImport: InsertFileImport): Promise<FileImport>;
  updateFileImport(id: number, updates: Partial<InsertFileImport>): Promise<void>;
  getFileImports(): Promise<FileImport[]>;

  // Settings methods
  getSetting(key: string): Promise<Setting | undefined>;
  setSetting(setting: InsertSetting): Promise<Setting>;
  getSettings(): Promise<Setting[]>;

  // Backup methods
  createBackup(backup: InsertBackup): Promise<Backup>;
  getBackups(): Promise<Backup[]>;

  // System management
  clearAllData(): Promise<void>;

  // Stats methods
  getStats(): Promise<{
    totalReps: number;
    activeReps: number;
    monthlyInvoices: number;
    monthlyRevenue: string;
    overduePayments: number;
  }>;

  // CRM methods
  getCrmInteractions(): Promise<CrmInteraction[]>;
  getCrmInteractionById(id: number): Promise<CrmInteraction | undefined>;
  createCrmInteraction(interaction: InsertCrmInteraction): Promise<CrmInteraction>;
  getCrmCallPreparations(): Promise<CrmCallPreparation[]>;
  getCrmCallPreparationById(id: number): Promise<CrmCallPreparation | undefined>;
  createCrmCallPreparation(preparation: InsertCrmCallPreparation): Promise<CrmCallPreparation>;
  getCrmRepresentativeProfiles(): Promise<CrmRepresentativeProfile[]>;
  getCrmRepresentativeProfile(representativeId: number): Promise<CrmRepresentativeProfile | undefined>;
  createCrmRepresentativeProfile(profile: InsertCrmRepresentativeProfile): Promise<CrmRepresentativeProfile>;
  getCrmStats(): Promise<{
    totalInteractions: number;
    pendingTasks: number;
    avgSentiment: number;
    highRiskReps: number;
    monthlyInteractions: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getRepresentatives(): Promise<Representative[]> {
    return await db.select().from(representatives).orderBy(desc(representatives.createdAt));
  }

  async getRepresentativeById(id: number): Promise<Representative | undefined> {
    const [rep] = await db.select().from(representatives).where(eq(representatives.id, id));
    return rep || undefined;
  }

  async getRepresentativeByAdminUsername(adminUsername: string): Promise<Representative | undefined> {
    const [rep] = await db.select().from(representatives).where(eq(representatives.adminUsername, adminUsername));
    return rep || undefined;
  }

  async createRepresentative(rep: InsertRepresentative): Promise<Representative> {
    const [representative] = await db.insert(representatives).values({
      ...rep,
      updatedAt: new Date()
    }).returning();
    return representative;
  }

  async updateRepresentative(id: number, rep: Partial<InsertRepresentative>): Promise<Representative> {
    const [representative] = await db.update(representatives)
      .set({ ...rep, updatedAt: new Date() })
      .where(eq(representatives.id, id))
      .returning();
    return representative;
  }

  async deleteRepresentative(id: number): Promise<void> {
    await db.delete(representatives).where(eq(representatives.id, id));
  }

  async searchRepresentatives(query: string): Promise<Representative[]> {
    return await db.select().from(representatives)
      .where(
        or(
          like(representatives.fullName, `%${query}%`),
          like(representatives.adminUsername, `%${query}%`),
          like(representatives.phoneNumber, `%${query}%`)
        )
      );
  }

  // Advanced Financial Ledger System - Real-time Balance Calculations
  async getRepresentativeBalance(id: number): Promise<number> {
    const [result] = await db.select({
      balance: sql<number>`COALESCE(SUM(
        CASE 
          WHEN ${financialLedger.transactionType} = 'invoice' THEN ${financialLedger.amount}
          WHEN ${financialLedger.transactionType} = 'payment' THEN -${financialLedger.amount}
          ELSE 0
        END
      ), 0)`
    })
    .from(financialLedger)
    .where(eq(financialLedger.representativeId, id));
    
    return parseFloat(result?.balance?.toString() || '0');
  }

  async getRepresentativesWithBalance(): Promise<(Representative & { currentBalance: number })[]> {
    const representatives = await this.getRepresentatives();
    const balances = await Promise.all(
      representatives.map(async (rep) => ({
        ...rep,
        currentBalance: await this.getRepresentativeBalance(rep.id)
      }))
    );
    return balances;
  }

  // Financial Ledger Methods with Atomic Transactions
  async createLedgerEntry(entry: InsertFinancialLedger): Promise<FinancialLedger> {
    const [created] = await db.insert(financialLedger).values(entry).returning();
    return created;
  }

  async getRepresentativeLedger(representativeId: number): Promise<FinancialLedger[]> {
    return await db.select()
      .from(financialLedger)
      .where(eq(financialLedger.representativeId, representativeId))
      .orderBy(desc(financialLedger.transactionDate));
  }

  async recordInvoiceInLedger(invoiceId: number, representativeId: number, amount: number, invoiceNumber: string): Promise<void> {
    const currentBalance = await this.getRepresentativeBalance(representativeId);
    const newBalance = currentBalance + amount;
    
    await this.createLedgerEntry({
      representativeId,
      transactionType: 'invoice',
      amount: amount.toString(),
      runningBalance: newBalance.toString(),
      referenceId: invoiceId,
      referenceNumber: invoiceNumber,
      description: `فاکتور شماره ${invoiceNumber} - اشتراک V2Ray`,
      transactionDate: new Date()
    });
  }

  async recordPaymentInLedger(paymentId: number, representativeId: number, amount: number, paymentReference?: string): Promise<void> {
    const currentBalance = await this.getRepresentativeBalance(representativeId);
    const newBalance = currentBalance - amount;
    
    await this.createLedgerEntry({
      representativeId,
      transactionType: 'payment',
      amount: amount.toString(),
      runningBalance: newBalance.toString(),
      referenceId: paymentId,
      referenceNumber: paymentReference || `PAY-${paymentId}`,
      description: `پرداخت ${amount.toLocaleString()} تومان`,
      transactionDate: new Date()
    });
  }

  // Invoice batch methods
  async createInvoiceBatch(batch: InsertInvoiceBatch): Promise<InvoiceBatch> {
    const [created] = await db.insert(invoiceBatches).values(batch).returning();
    return created;
  }

  async getInvoiceBatches(): Promise<InvoiceBatch[]> {
    return await db.select().from(invoiceBatches).orderBy(desc(invoiceBatches.createdAt));
  }

  async getInvoiceBatchById(id: number): Promise<InvoiceBatch | undefined> {
    const [batch] = await db.select().from(invoiceBatches).where(eq(invoiceBatches.id, id));
    return batch || undefined;
  }

  async updateInvoiceBatch(id: number, updates: Partial<InsertInvoiceBatch>): Promise<void> {
    await db.update(invoiceBatches).set(updates).where(eq(invoiceBatches.id, id));
  }

  async getInvoices(): Promise<(Invoice & { representative: Representative | null, batch: InvoiceBatch | null })[]> {
    return await db.select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      representativeId: invoices.representativeId,
      batchId: invoices.batchId,
      totalAmount: invoices.totalAmount,
      status: invoices.status,
      dueDate: invoices.dueDate,
      paidDate: invoices.paidDate,
      invoiceData: invoices.invoiceData,
      telegramSent: invoices.telegramSent,
      sentToRepresentative: invoices.sentToRepresentative,
      createdAt: invoices.createdAt,
      representative: representatives,
      batch: invoiceBatches
    })
    .from(invoices)
    .leftJoin(representatives, eq(invoices.representativeId, representatives.id))
    .leftJoin(invoiceBatches, eq(invoices.batchId, invoiceBatches.id))
    .orderBy(desc(invoices.createdAt));
  }

  async getInvoicesByBatch(batchId: number): Promise<(Invoice & { representative: Representative | null })[]> {
    return await db.select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      representativeId: invoices.representativeId,
      batchId: invoices.batchId,
      totalAmount: invoices.totalAmount,
      status: invoices.status,
      dueDate: invoices.dueDate,
      paidDate: invoices.paidDate,
      invoiceData: invoices.invoiceData,
      telegramSent: invoices.telegramSent,
      sentToRepresentative: invoices.sentToRepresentative,
      createdAt: invoices.createdAt,
      representative: representatives
    })
    .from(invoices)
    .leftJoin(representatives, eq(invoices.representativeId, representatives.id))
    .where(eq(invoices.batchId, batchId))
    .orderBy(desc(invoices.createdAt));
  }

  async getInvoiceById(id: number): Promise<(Invoice & { representative: Representative | null, items: InvoiceItem[] }) | undefined> {
    const [invoice] = await db.select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      representativeId: invoices.representativeId,
      totalAmount: invoices.totalAmount,
      status: invoices.status,
      dueDate: invoices.dueDate,
      paidDate: invoices.paidDate,
      invoiceData: invoices.invoiceData,
      createdAt: invoices.createdAt,
      representative: representatives
    })
    .from(invoices)
    .leftJoin(representatives, eq(invoices.representativeId, representatives.id))
    .where(eq(invoices.id, id));

    if (!invoice) return undefined;

    const items = await this.getInvoiceItems(id);
    return { ...invoice, items };
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db.insert(invoices).values(invoice).returning();
    return newInvoice;
  }

  async updateInvoiceStatus(id: number, status: string): Promise<void> {
    await db.update(invoices)
      .set({ status, paidDate: status === 'paid' ? new Date() : null })
      .where(eq(invoices.id, id));
  }

  async updateInvoiceTelegramStatus(id: number, telegramSent: boolean, sentToRepresentative: boolean): Promise<void> {
    await db.update(invoices)
      .set({ telegramSent, sentToRepresentative })
      .where(eq(invoices.id, id));
  }

  async getInvoicesByRepresentative(representativeId: number): Promise<Invoice[]> {
    return await db.select().from(invoices)
      .where(eq(invoices.representativeId, representativeId))
      .orderBy(desc(invoices.createdAt));
  }

  async createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    const [invoiceItem] = await db.insert(invoiceItems).values(item).returning();
    return invoiceItem;
  }

  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    return await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  }

  async getPayments(): Promise<(Payment & { representative: Representative | null, invoice: Invoice | null })[]> {
    return await db.select({
      id: payments.id,
      invoiceId: payments.invoiceId,
      representativeId: payments.representativeId,
      amount: payments.amount,
      paymentType: payments.paymentType,
      paymentMethod: payments.paymentMethod,
      notes: payments.notes,
      createdAt: payments.createdAt,
      representative: representatives,
      invoice: invoices
    })
    .from(payments)
    .leftJoin(representatives, eq(payments.representativeId, representatives.id))
    .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
    .orderBy(desc(payments.createdAt));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async getPaymentsByRepresentative(representativeId: number): Promise<Payment[]> {
    return await db.select().from(payments)
      .where(eq(payments.representativeId, representativeId))
      .orderBy(desc(payments.createdAt));
  }

  async createFileImport(fileImport: InsertFileImport): Promise<FileImport> {
    const [newImport] = await db.insert(fileImports).values(fileImport).returning();
    return newImport;
  }

  async updateFileImport(id: number, updates: Partial<InsertFileImport>): Promise<void> {
    await db.update(fileImports).set(updates).where(eq(fileImports.id, id));
  }

  async getFileImports(): Promise<FileImport[]> {
    return await db.select().from(fileImports).orderBy(desc(fileImports.createdAt));
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting || undefined;
  }

  async setSetting(setting: InsertSetting): Promise<Setting> {
    const existing = await this.getSetting(setting.key);
    if (existing) {
      const [updated] = await db.update(settings)
        .set({ value: setting.value, updatedAt: new Date() })
        .where(eq(settings.key, setting.key))
        .returning();
      return updated;
    } else {
      const [newSetting] = await db.insert(settings).values(setting).returning();
      return newSetting;
    }
  }

  async getSettings(): Promise<Setting[]> {
    return await db.select().from(settings);
  }

  async createBackup(backup: InsertBackup): Promise<Backup> {
    const [newBackup] = await db.insert(backups).values(backup).returning();
    return newBackup;
  }

  async getBackups(): Promise<Backup[]> {
    return await db.select().from(backups).orderBy(desc(backups.createdAt));
  }

  async getStats(): Promise<{
    totalReps: number;
    activeReps: number;
    monthlyInvoices: number;
    monthlyRevenue: string;
    overduePayments: number;
  }> {
    // Get current month start and end
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Total representatives
    const [totalRepsResult] = await db.select({ count: sql<number>`count(*)` }).from(representatives);
    const totalReps = totalRepsResult.count;

    // Active representatives
    const [activeRepsResult] = await db.select({ count: sql<number>`count(*)` }).from(representatives)
      .where(eq(representatives.status, 'active'));
    const activeReps = activeRepsResult.count;

    // Monthly invoices
    const [monthlyInvoicesResult] = await db.select({ count: sql<number>`count(*)` }).from(invoices)
      .where(and(
        sql`${invoices.createdAt} >= ${monthStart}`,
        sql`${invoices.createdAt} <= ${monthEnd}`
      ));
    const monthlyInvoices = monthlyInvoicesResult.count;

    // Monthly revenue
    const [monthlyRevenueResult] = await db.select({ 
      sum: sql<string>`COALESCE(sum(${invoices.totalAmount}), 0)` 
    }).from(invoices)
      .where(and(
        sql`${invoices.createdAt} >= ${monthStart}`,
        sql`${invoices.createdAt} <= ${monthEnd}`,
        eq(invoices.status, 'paid')
      ));
    const monthlyRevenue = monthlyRevenueResult.sum || '0';

    // Overdue payments
    const [overdueResult] = await db.select({ count: sql<number>`count(*)` }).from(invoices)
      .where(and(
        eq(invoices.status, 'pending'),
        sql`${invoices.dueDate} < ${new Date()}`
      ));
    const overduePayments = overdueResult.count;

    return {
      totalReps,
      activeReps,
      monthlyInvoices,
      monthlyRevenue,
      overduePayments
    };
  }

  // CRM Methods Implementation
  async getCrmInteractions(): Promise<CrmInteraction[]> {
    return await db.select().from(crmInteractions)
      .orderBy(sql`${crmInteractions.createdAt} DESC`);
  }

  async getCrmInteractionById(id: number): Promise<CrmInteraction | undefined> {
    const [interaction] = await db.select().from(crmInteractions)
      .where(eq(crmInteractions.id, id));
    return interaction || undefined;
  }

  async createCrmInteraction(interaction: InsertCrmInteraction): Promise<CrmInteraction> {
    const [newInteraction] = await db.insert(crmInteractions)
      .values(interaction)
      .returning();
    return newInteraction;
  }

  async getCrmCallPreparations(): Promise<CrmCallPreparation[]> {
    return await db.select().from(crmCallPreparations)
      .orderBy(sql`${crmCallPreparations.createdAt} DESC`);
  }

  async getCrmCallPreparationById(id: number): Promise<CrmCallPreparation | undefined> {
    const [preparation] = await db.select().from(crmCallPreparations)
      .where(eq(crmCallPreparations.id, id));
    return preparation || undefined;
  }

  async createCrmCallPreparation(preparation: InsertCrmCallPreparation): Promise<CrmCallPreparation> {
    const [newPreparation] = await db.insert(crmCallPreparations)
      .values(preparation)
      .returning();
    return newPreparation;
  }

  async getCrmRepresentativeProfiles(): Promise<CrmRepresentativeProfile[]> {
    return await db.select().from(crmRepresentativeProfiles)
      .orderBy(sql`${crmRepresentativeProfiles.updatedAt} DESC`);
  }

  async getCrmRepresentativeProfile(representativeId: number): Promise<CrmRepresentativeProfile | undefined> {
    const [profile] = await db.select().from(crmRepresentativeProfiles)
      .where(eq(crmRepresentativeProfiles.representativeId, representativeId));
    return profile || undefined;
  }

  async createCrmRepresentativeProfile(profile: InsertCrmRepresentativeProfile): Promise<CrmRepresentativeProfile> {
    const [newProfile] = await db.insert(crmRepresentativeProfiles)
      .values(profile)
      .returning();
    return newProfile;
  }

  async getCrmStats(): Promise<{
    totalInteractions: number;
    pendingTasks: number;
    avgSentiment: number;
    highRiskReps: number;
    monthlyInteractions: number;
  }> {
    // Get current month start and end
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Total interactions
    const [totalInteractionsResult] = await db.select({ count: sql<number>`count(*)` }).from(crmInteractions);
    const totalInteractions = totalInteractionsResult.count;

    // Pending tasks
    const [pendingTasksResult] = await db.select({ count: sql<number>`count(*)` }).from(crmTasks)
      .where(eq(crmTasks.status, 'pending'));
    const pendingTasks = pendingTasksResult.count;

    // Average sentiment
    const [avgSentimentResult] = await db.select({ 
      avg: sql<number>`COALESCE(avg(${crmInteractions.sentimentScore}), 0)` 
    }).from(crmInteractions)
      .where(sql`${crmInteractions.sentimentScore} IS NOT NULL`);
    const avgSentiment = avgSentimentResult.avg;

    // High risk representatives
    const [highRiskResult] = await db.select({ count: sql<number>`count(*)` }).from(crmRepresentativeProfiles)
      .where(sql`${crmRepresentativeProfiles.riskScore} > 0.7`);
    const highRiskReps = highRiskResult.count;

    // Monthly interactions
    const [monthlyInteractionsResult] = await db.select({ count: sql<number>`count(*)` }).from(crmInteractions)
      .where(and(
        sql`${crmInteractions.createdAt} >= ${monthStart}`,
        sql`${crmInteractions.createdAt} <= ${monthEnd}`
      ));
    const monthlyInteractions = monthlyInteractionsResult.count;

    return {
      totalInteractions,
      pendingTasks,
      avgSentiment,
      highRiskReps,
      monthlyInteractions
    };
  }

  async clearAllData(): Promise<void> {
    try {
      // Delete data in order to respect foreign key constraints
      // First delete dependent records
      await db.delete(invoiceItems);
      await db.delete(payments);
      await db.delete(invoices);
      await db.delete(crmTasks);
      await db.delete(crmCallPreparations);
      await db.delete(crmInteractions);
      await db.delete(crmRepresentativeProfiles);
      await db.delete(fileImports);
      await db.delete(backups);
      
      // Then delete main records
      await db.delete(representatives);
      await db.delete(users);
      
      // Reset settings to defaults
      await db.delete(settings);
      
      console.log('All data cleared successfully');
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
