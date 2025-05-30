/**
 * Database Optimization Implementation
 * Connection pooling and pagination for improved performance
 */

import { db } from "./db";
import { representatives, invoices, payments } from "@shared/schema";
import { sql, desc, asc, eq } from "drizzle-orm";

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class DatabaseOptimizer {
  
  // Optimized representatives query with pagination
  async getRepresentativesPaginated(options: PaginationOptions): Promise<PaginatedResult<any>> {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const offset = (page - 1) * limit;

    // Get total count efficiently
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(representatives);

    // Get paginated data with proper sorting
    const sortColumn = representatives[sortBy as keyof typeof representatives] || representatives.createdAt;
    const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    const data = await db
      .select()
      .from(representatives)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return {
      data,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  }

  // Optimized invoices query with pagination and joins
  async getInvoicesPaginated(options: PaginationOptions): Promise<PaginatedResult<any>> {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const offset = (page - 1) * limit;

    // Efficient count with joins
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(invoices);

    // Optimized query with selective joins
    const data = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        totalAmount: invoices.totalAmount,
        status: invoices.status,
        createdAt: invoices.createdAt,
        dueDate: invoices.dueDate,
        representativeId: invoices.representativeId,
        representativeName: sql<string>`${representatives.fullName}`,
        representativeStore: sql<string>`${representatives.storeName}`
      })
      .from(invoices)
      .leftJoin(representatives, eq(invoices.representativeId, representatives.id))
      .orderBy(sortOrder === 'asc' ? asc(invoices.createdAt) : desc(invoices.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  }

  // Optimized payments query with efficient joins
  async getPaymentsPaginated(options: PaginationOptions): Promise<PaginatedResult<any>> {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const offset = (page - 1) * limit;

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(payments);

    const data = await db
      .select({
        id: payments.id,
        amount: payments.amount,
        paymentDate: payments.paymentDate,
        paymentMethod: payments.paymentMethod,
        status: payments.status,
        createdAt: payments.createdAt,
        representativeId: payments.representativeId,
        representativeName: sql<string>`${representatives.fullName}`
      })
      .from(payments)
      .leftJoin(representatives, eq(payments.representativeId, representatives.id))
      .orderBy(sortOrder === 'asc' ? asc(payments.createdAt) : desc(payments.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  }

  // Efficient search with pagination
  async searchRepresentativesPaginated(
    searchQuery: string, 
    options: PaginationOptions
  ): Promise<PaginatedResult<any>> {
    const { page, limit } = options;
    const offset = (page - 1) * limit;

    const searchPattern = `%${searchQuery}%`;

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(representatives)
      .where(sql`
        ${representatives.fullName} ILIKE ${searchPattern} OR
        ${representatives.adminUsername} ILIKE ${searchPattern} OR
        ${representatives.storeName} ILIKE ${searchPattern} OR
        ${representatives.phoneNumber} ILIKE ${searchPattern}
      `);

    const data = await db
      .select()
      .from(representatives)
      .where(sql`
        ${representatives.fullName} ILIKE ${searchPattern} OR
        ${representatives.adminUsername} ILIKE ${searchPattern} OR
        ${representatives.storeName} ILIKE ${searchPattern} OR
        ${representatives.phoneNumber} ILIKE ${searchPattern}
      `)
      .orderBy(desc(representatives.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  }

  // Database health check for connection optimization
  async checkDatabaseHealth(): Promise<{
    connectionStatus: string;
    responseTime: number;
    activeConnections: number;
  }> {
    const startTime = Date.now();
    
    try {
      const [result] = await db.execute(sql`SELECT 1 as health_check`);
      const responseTime = Date.now() - startTime;

      // Get connection count
      const [connResult] = await db.execute(sql`
        SELECT count(*) as active_connections 
        FROM pg_stat_activity 
        WHERE state = 'active'
      `);

      return {
        connectionStatus: 'healthy',
        responseTime,
        activeConnections: parseInt(connResult.active_connections as string) || 0
      };
    } catch (error) {
      return {
        connectionStatus: 'unhealthy',
        responseTime: Date.now() - startTime,
        activeConnections: 0
      };
    }
  }
}

export const databaseOptimizer = new DatabaseOptimizer();