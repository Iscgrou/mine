// ODS file processing utilities for MarFanet
// This handles the parsing and validation of .ods files according to the business requirements

export interface RepresentativeData {
  adminUsername: string;
  fullName?: string;
  phoneNumber?: string;
  telegramId?: string;
  storeName?: string;
  pricePerGB?: number;
  unlimitedMonthlyPrice?: number;
}

export interface SubscriptionData {
  standardSubscriptions: {
    month1: number;
    month2: number;
    month3: number;
    month4: number;
    month5: number;
    month6: number;
  };
  unlimitedSubscriptions: {
    month1: number;
    month2: number;
    month3: number;
    month4: number;
    month5: number;
    month6: number;
  };
}

export interface ProcessedRow {
  representative: RepresentativeData;
  subscriptions: SubscriptionData;
  rowNumber: number;
  isValid: boolean;
  errors: string[];
}

export interface ProcessingResult {
  processedRows: ProcessedRow[];
  skippedRows: number;
  totalRows: number;
  errors: string[];
}

/**
 * Validates if a row has valid data
 */
export function validateRow(row: any[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check if admin username (Column A) exists
  if (!row[0] || typeof row[0] !== 'string' || row[0].trim() === '') {
    errors.push('نام کاربری ادمین (ستون A) الزامی است');
    return { isValid: false, errors };
  }

  // Check if there's at least some subscription data
  const hasStandardData = row.slice(7, 13).some(val => val !== null && val !== undefined && val !== '');
  const hasUnlimitedData = row.slice(19, 25).some(val => val !== null && val !== undefined && val !== '');

  if (!hasStandardData && !hasUnlimitedData) {
    errors.push('حداقل یکی از ستون‌های اشتراک باید مقدار داشته باشد');
    return { isValid: false, errors };
  }

  return { isValid: true, errors };
}

/**
 * Extracts representative data from a row
 */
export function extractRepresentativeData(row: any[]): RepresentativeData {
  return {
    adminUsername: row[0]?.toString().trim() || '',
    fullName: row[1]?.toString().trim() || '',
    phoneNumber: row[2]?.toString().trim() || '',
    telegramId: row[3]?.toString().trim() || '',
    storeName: row[4]?.toString().trim() || '',
    pricePerGB: row[5] ? parseFloat(row[5].toString()) : undefined,
    unlimitedMonthlyPrice: row[6] ? parseFloat(row[6].toString()) : undefined,
  };
}

/**
 * Extracts subscription data from a row
 */
export function extractSubscriptionData(row: any[]): SubscriptionData {
  // Standard subscriptions (Columns H-M, indices 7-12)
  const standardSubscriptions = {
    month1: parseFloat(row[7]?.toString() || '0') || 0,
    month2: parseFloat(row[8]?.toString() || '0') || 0,
    month3: parseFloat(row[9]?.toString() || '0') || 0,
    month4: parseFloat(row[10]?.toString() || '0') || 0,
    month5: parseFloat(row[11]?.toString() || '0') || 0,
    month6: parseFloat(row[12]?.toString() || '0') || 0,
  };

  // Unlimited subscriptions (Columns T-Y, indices 19-24)
  const unlimitedSubscriptions = {
    month1: parseFloat(row[19]?.toString() || '0') || 0,
    month2: parseFloat(row[20]?.toString() || '0') || 0,
    month3: parseFloat(row[21]?.toString() || '0') || 0,
    month4: parseFloat(row[22]?.toString() || '0') || 0,
    month5: parseFloat(row[23]?.toString() || '0') || 0,
    month6: parseFloat(row[24]?.toString() || '0') || 0,
  };

  return {
    standardSubscriptions,
    unlimitedSubscriptions,
  };
}

/**
 * Calculates invoice amount based on MarFanet algorithm
 */
export function calculateInvoiceAmount(
  subscriptionData: SubscriptionData,
  representativeData: RepresentativeData
): { totalAmount: number; items: any[] } {
  let totalAmount = 0;
  const items = [];

  // Part 1: Standard Subscriptions (1-6 months limited)
  if (representativeData.pricePerGB) {
    Object.entries(subscriptionData.standardSubscriptions).forEach(([key, quantity], index) => {
      if (quantity > 0) {
        const months = index + 1;
        const price = representativeData.pricePerGB! * quantity;
        totalAmount += price;
        
        items.push({
          description: `اشتراک ${months} ماهه محدود`,
          quantity: quantity,
          unitPrice: representativeData.pricePerGB,
          totalPrice: price,
          subscriptionType: 'standard',
          durationMonths: months,
        });
      }
    });
  }

  // Part 2: Unlimited Monthly Subscriptions
  if (representativeData.unlimitedMonthlyPrice) {
    Object.entries(subscriptionData.unlimitedSubscriptions).forEach(([key, quantity], index) => {
      if (quantity > 0) {
        const months = index + 1;
        const price = representativeData.unlimitedMonthlyPrice! * months * quantity;
        totalAmount += price;
        
        items.push({
          description: `اشتراک ${months} ماهه نامحدود`,
          quantity: quantity,
          unitPrice: representativeData.unlimitedMonthlyPrice * months,
          totalPrice: price,
          subscriptionType: 'unlimited',
          durationMonths: months,
        });
      }
    });
  }

  return { totalAmount, items };
}

/**
 * Processes a single row of ODS data
 */
export function processRow(row: any[], rowNumber: number): ProcessedRow {
  const validation = validateRow(row);
  
  if (!validation.isValid) {
    return {
      representative: { adminUsername: '' },
      subscriptions: {
        standardSubscriptions: {
          month1: 0, month2: 0, month3: 0, month4: 0, month5: 0, month6: 0
        },
        unlimitedSubscriptions: {
          month1: 0, month2: 0, month3: 0, month4: 0, month5: 0, month6: 0
        }
      },
      rowNumber,
      isValid: false,
      errors: validation.errors,
    };
  }

  const representative = extractRepresentativeData(row);
  const subscriptions = extractSubscriptionData(row);

  return {
    representative,
    subscriptions,
    rowNumber,
    isValid: true,
    errors: [],
  };
}

/**
 * Checks if a row is empty (for detecting two consecutive empty rows)
 */
export function isRowEmpty(row: any[]): boolean {
  if (!row || row.length === 0) return true;
  return row.every(cell => cell === null || cell === undefined || cell === '');
}

/**
 * Processes an entire ODS data array
 */
export function processOdsData(data: any[][]): ProcessingResult {
  const processedRows: ProcessedRow[] = [];
  let skippedRows = 0;
  let consecutiveEmptyRows = 0;
  const errors: string[] = [];

  // Skip header row (index 0)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    // Check for two consecutive empty rows
    if (isRowEmpty(row)) {
      consecutiveEmptyRows++;
      if (consecutiveEmptyRows >= 2) {
        break;
      }
      skippedRows++;
      continue;
    } else {
      consecutiveEmptyRows = 0;
    }

    const processedRow = processRow(row, i + 1);
    
    if (processedRow.isValid) {
      processedRows.push(processedRow);
    } else {
      skippedRows++;
      errors.push(`ردیف ${i + 1}: ${processedRow.errors.join(', ')}`);
    }
  }

  return {
    processedRows,
    skippedRows,
    totalRows: data.length - 1, // Excluding header
    errors,
  };
}

/**
 * Generates an invoice number
 */
export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  return `INV-${year}-${timestamp}`;
}

/**
 * Validates representative pricing data
 */
export function validateRepresentativePricing(representative: RepresentativeData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!representative.pricePerGB && !representative.unlimitedMonthlyPrice) {
    errors.push('حداقل یکی از قیمت‌ها (هر گیگابایت یا ماهانه نامحدود) باید تعریف شده باشد');
  }

  if (representative.pricePerGB && (representative.pricePerGB <= 0)) {
    errors.push('قیمت هر گیگابایت باید مثبت باشد');
  }

  if (representative.unlimitedMonthlyPrice && (representative.unlimitedMonthlyPrice <= 0)) {
    errors.push('قیمت ماهانه نامحدود باید مثبت باشد');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Creates a summary of processed data
 */
export function createProcessingSummary(result: ProcessingResult): string {
  const successfulRows = result.processedRows.length;
  const totalInvoices = result.processedRows.filter(row => {
    // Count rows that would generate invoices (have subscription data)
    const hasStandardData = Object.values(row.subscriptions.standardSubscriptions).some(val => val > 0);
    const hasUnlimitedData = Object.values(row.subscriptions.unlimitedSubscriptions).some(val => val > 0);
    return hasStandardData || hasUnlimitedData;
  }).length;

  return `پردازش کامل شد:
- تعداد ردیف‌های پردازش شده: ${successfulRows}
- تعداد ردیف‌های رد شده: ${result.skippedRows}
- تعداد فاکتورهای قابل ایجاد: ${totalInvoices}
- تعداد خطاها: ${result.errors.length}`;
}
