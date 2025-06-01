import { 
  users, representatives, fileImports, settings, backups, crmInteractions, crmCallPreparations, 
  crmRepresentativeProfiles, crmTasks, financialLedger,
  collaborators, commissionRecords, collaboratorPayouts,
  type User, type InsertUser, type Representative, type InsertRepresentative,
  type FileImport, type InsertFileImport,
  type Setting, type InsertSetting, type Backup, type InsertBackup,
  type CrmInteraction, type InsertCrmInteraction,
  type CrmCallPreparation, type InsertCrmCallPreparation,
  type CrmRepresentativeProfile, type InsertCrmRepresentativeProfile,
  type FinancialLedger, type InsertFinancialLedger,
  type Collaborator, type InsertCollaborator, type CommissionRecord, type InsertCommissionRecord,
  type CollaboratorPayout, type InsertCollaboratorPayout
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

  // Collaborator Program Methods
  getCollaborators(): Promise<Collaborator[]>;
  getCollaboratorById(id: number): Promise<Collaborator | undefined>;
  createCollaborator(collaborator: InsertCollaborator): Promise<Collaborator>;
  updateCollaborator(id: number, updates: Partial<InsertCollaborator>): Promise<Collaborator>;
  deleteCollaborator(id: number): Promise<void>;

  // Commission Methods
  getCommissionRecords(): Promise<(CommissionRecord & { collaborator: Collaborator | null, representative: Representative | null })[]>;
  createCommissionRecord(record: InsertCommissionRecord): Promise<CommissionRecord>;
  getCommissionRecordsByCollaborator(collaboratorId: number): Promise<CommissionRecord[]>;

  // Payout Methods
  getCollaboratorPayouts(): Promise<(CollaboratorPayout & { collaborator: Collaborator | null })[]>;
  createCollaboratorPayout(payout: InsertCollaboratorPayout): Promise<CollaboratorPayout>;
  getPayoutsByCollaborator(collaboratorId: number): Promise<CollaboratorPayout[]>;

  // CRM Methods
  getCrmInteractions(): Promise<CrmInteraction[]>;
  createCrmInteraction(interaction: InsertCrmInteraction): Promise<CrmInteraction>;
  getCrmCallPreparations(): Promise<CrmCallPreparation[]>;
  createCrmCallPreparation(preparation: InsertCrmCallPreparation): Promise<CrmCallPreparation>;
  getCrmRepresentativeProfiles(): Promise<CrmRepresentativeProfile[]>;
  createCrmRepresentativeProfile(profile: InsertCrmRepresentativeProfile): Promise<CrmRepresentativeProfile>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Representative methods
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
    const [created] = await db
      .insert(representatives)
      .values(rep)
      .returning();
    return created;
  }

  async updateRepresentative(id: number, rep: Partial<InsertRepresentative>): Promise<Representative> {
    const [updated] = await db
      .update(representatives)
      .set({ ...rep, updatedAt: new Date() })
      .where(eq(representatives.id, id))
      .returning();
    return updated;
  }

  async deleteRepresentative(id: number): Promise<void> {
    await db.delete(representatives).where(eq(representatives.id, id));
  }

  async searchRepresentatives(query: string): Promise<Representative[]> {
    return await db
      .select()
      .from(representatives)
      .where(
        or(
          like(representatives.fullName, `%${query}%`),
          like(representatives.adminUsername, `%${query}%`),
          like(representatives.phoneNumber, `%${query}%`),
          like(representatives.storeName, `%${query}%`)
        )
      )
      .orderBy(desc(representatives.createdAt));
  }

  async getRepresentativeBalance(id: number): Promise<number> {
    const ledgerEntries = await this.getRepresentativeLedger(id);
    return ledgerEntries.length > 0 ? 
      Number(ledgerEntries[ledgerEntries.length - 1].runningBalance) : 0;
  }

  async getRepresentativesWithBalance(): Promise<(Representative & { currentBalance: number })[]> {
    const reps = await this.getRepresentatives();
    const repsWithBalance = await Promise.all(
      reps.map(async (rep) => ({
        ...rep,
        currentBalance: await this.getRepresentativeBalance(rep.id)
      }))
    );
    return repsWithBalance;
  }

  // Financial ledger methods
  async createLedgerEntry(entry: InsertFinancialLedger): Promise<FinancialLedger> {
    const [created] = await db
      .insert(financialLedger)
      .values(entry)
      .returning();
    return created;
  }

  async getRepresentativeLedger(representativeId: number): Promise<FinancialLedger[]> {
    return await db
      .select()
      .from(financialLedger)
      .where(eq(financialLedger.representativeId, representativeId))
      .orderBy(financialLedger.transactionDate);
  }

  // File import methods
  async createFileImport(fileImport: InsertFileImport): Promise<FileImport> {
    const [created] = await db
      .insert(fileImports)
      .values(fileImport)
      .returning();
    return created;
  }

  async updateFileImport(id: number, updates: Partial<InsertFileImport>): Promise<void> {
    await db
      .update(fileImports)
      .set(updates)
      .where(eq(fileImports.id, id));
  }

  async getFileImports(): Promise<FileImport[]> {
    return await db.select().from(fileImports).orderBy(desc(fileImports.createdAt));
  }

  // Settings methods
  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting || undefined;
  }

  async setSetting(setting: InsertSetting): Promise<Setting> {
    const existing = await this.getSetting(setting.key);
    if (existing) {
      const [updated] = await db
        .update(settings)
        .set({ value: setting.value, updatedAt: new Date() })
        .where(eq(settings.key, setting.key))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(settings)
        .values(setting)
        .returning();
      return created;
    }
  }

  async getSettings(): Promise<Setting[]> {
    return await db.select().from(settings).orderBy(settings.key);
  }

  // Backup methods
  async createBackup(backup: InsertBackup): Promise<Backup> {
    const [created] = await db
      .insert(backups)
      .values(backup)
      .returning();
    return created;
  }

  async getBackups(): Promise<Backup[]> {
    return await db.select().from(backups).orderBy(desc(backups.createdAt));
  }

  // Collaborator Program Methods
  async getCollaborators(): Promise<Collaborator[]> {
    return await db.select().from(collaborators).orderBy(desc(collaborators.createdAt));
  }

  async getCollaboratorById(id: number): Promise<Collaborator | undefined> {
    const [collaborator] = await db.select().from(collaborators).where(eq(collaborators.id, id));
    return collaborator || undefined;
  }

  async createCollaborator(collaborator: InsertCollaborator): Promise<Collaborator> {
    const [created] = await db
      .insert(collaborators)
      .values(collaborator)
      .returning();
    return created;
  }

  async updateCollaborator(id: number, updates: Partial<InsertCollaborator>): Promise<Collaborator> {
    const [updated] = await db
      .update(collaborators)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(collaborators.id, id))
      .returning();
    return updated;
  }

  async deleteCollaborator(id: number): Promise<void> {
    await db.delete(collaborators).where(eq(collaborators.id, id));
  }

  // Commission Methods
  async getCommissionRecords(): Promise<(CommissionRecord & { collaborator: Collaborator | null, representative: Representative | null })[]> {
    return await db.select({
      id: commissionRecords.id,
      collaboratorId: commissionRecords.collaboratorId,
      representativeId: commissionRecords.representativeId,
      commissionAmount: commissionRecords.commissionAmount,
      commissionRate: commissionRecords.commissionRate,
      calculationPeriod: commissionRecords.calculationPeriod,
      notes: commissionRecords.notes,
      createdAt: commissionRecords.createdAt,
      collaborator: collaborators,
      representative: representatives
    })
    .from(commissionRecords)
    .leftJoin(collaborators, eq(commissionRecords.collaboratorId, collaborators.id))
    .leftJoin(representatives, eq(commissionRecords.representativeId, representatives.id))
    .orderBy(desc(commissionRecords.createdAt));
  }

  async createCommissionRecord(record: InsertCommissionRecord): Promise<CommissionRecord> {
    const [created] = await db
      .insert(commissionRecords)
      .values(record)
      .returning();
    return created;
  }

  async getCommissionRecordsByCollaborator(collaboratorId: number): Promise<CommissionRecord[]> {
    return await db
      .select()
      .from(commissionRecords)
      .where(eq(commissionRecords.collaboratorId, collaboratorId))
      .orderBy(desc(commissionRecords.createdAt));
  }

  // Payout Methods
  async getCollaboratorPayouts(): Promise<(CollaboratorPayout & { collaborator: Collaborator | null })[]> {
    return await db.select({
      id: collaboratorPayouts.id,
      collaboratorId: collaboratorPayouts.collaboratorId,
      amount: collaboratorPayouts.amount,
      payoutMethod: collaboratorPayouts.payoutMethod,
      bankDetails: collaboratorPayouts.bankDetails,
      adminUserId: collaboratorPayouts.adminUserId,
      notes: collaboratorPayouts.notes,
      status: collaboratorPayouts.status,
      processedAt: collaboratorPayouts.processedAt,
      createdAt: collaboratorPayouts.createdAt,
      collaborator: collaborators
    })
    .from(collaboratorPayouts)
    .leftJoin(collaborators, eq(collaboratorPayouts.collaboratorId, collaborators.id))
    .orderBy(desc(collaboratorPayouts.createdAt));
  }

  async createCollaboratorPayout(payout: InsertCollaboratorPayout): Promise<CollaboratorPayout> {
    const [created] = await db
      .insert(collaboratorPayouts)
      .values(payout)
      .returning();
    return created;
  }

  async getPayoutsByCollaborator(collaboratorId: number): Promise<CollaboratorPayout[]> {
    return await db
      .select()
      .from(collaboratorPayouts)
      .where(eq(collaboratorPayouts.collaboratorId, collaboratorId))
      .orderBy(desc(collaboratorPayouts.createdAt));
  }

  // CRM Methods
  async getCrmInteractions(): Promise<CrmInteraction[]> {
    return await db.select().from(crmInteractions).orderBy(desc(crmInteractions.createdAt));
  }

  async createCrmInteraction(interaction: InsertCrmInteraction): Promise<CrmInteraction> {
    const [created] = await db
      .insert(crmInteractions)
      .values(interaction)
      .returning();
    return created;
  }

  async getCrmCallPreparations(): Promise<CrmCallPreparation[]> {
    return await db.select().from(crmCallPreparations).orderBy(desc(crmCallPreparations.createdAt));
  }

  async createCrmCallPreparation(preparation: InsertCrmCallPreparation): Promise<CrmCallPreparation> {
    const [created] = await db
      .insert(crmCallPreparations)
      .values(preparation)
      .returning();
    return created;
  }

  async getCrmRepresentativeProfiles(): Promise<CrmRepresentativeProfile[]> {
    return await db.select().from(crmRepresentativeProfiles).orderBy(desc(crmRepresentativeProfiles.createdAt));
  }

  async createCrmRepresentativeProfile(profile: InsertCrmRepresentativeProfile): Promise<CrmRepresentativeProfile> {
    const [created] = await db
      .insert(crmRepresentativeProfiles)
      .values(profile)
      .returning();
    return created;
  }
}

export const storage = new DatabaseStorage();