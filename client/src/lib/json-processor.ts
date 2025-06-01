// JSON invoice data processing utilities for MarFanet
// Handles parsing and validation of JSON files according to business requirements

export interface JSONAdminData {
  admin_username: string;
  limited_1_month_volume: string;
  limited_2_month_volume: string;
  limited_3_month_volume: string;
  limited_4_month_volume: string;
  limited_5_month_volume: string;
  limited_6_month_volume: string;
  unlimited_1_month: string;
  unlimited_2_month: string;
  unlimited_3_month: string;
  unlimited_4_month: string;
  unlimited_5_month: string;
  unlimited_6_month: string;
}

export interface ProcessedAdminData {
  adminUsername: string;
  limitedVolumes: {
    month1: number;
    month2: number;
    month3: number;
    month4: number;
    month5: number;
    month6: number;
  };
  unlimitedCounts: {
    month1: number;
    month2: number;
    month3: number;
    month4: number;
    month5: number;
    month6: number;
  };
  isValid: boolean;
  errors: string[];
}

export interface JSONProcessingResult {
  processedAdmins: ProcessedAdminData[];
  totalAdmins: number;
  validAdmins: number;
  errors: string[];
}

/**
 * Validates JSON structure and required fields
 */
export function validateJSONStructure(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check if it's an array
  if (!Array.isArray(data)) {
    errors.push('فایل JSON باید آرایه‌ای از اشیاء باشد');
    return { isValid: false, errors };
  }

  // Check if array is not empty
  if (data.length === 0) {
    errors.push('فایل JSON نمی‌تواند خالی باشد');
    return { isValid: false, errors };
  }

  return { isValid: true, errors };
}

/**
 * Validates individual admin data object
 */
export function validateAdminData(adminData: any, index: number): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const requiredFields = [
    'admin_username',
    'limited_1_month_volume', 'limited_2_month_volume', 'limited_3_month_volume',
    'limited_4_month_volume', 'limited_5_month_volume', 'limited_6_month_volume',
    'unlimited_1_month', 'unlimited_2_month', 'unlimited_3_month',
    'unlimited_4_month', 'unlimited_5_month', 'unlimited_6_month'
  ];

  // Check if it's an object
  if (typeof adminData !== 'object' || adminData === null) {
    errors.push(`آیتم ${index + 1}: باید شیء معتبر باشد`);
    return { isValid: false, errors };
  }

  // Check required fields
  for (const field of requiredFields) {
    if (!(field in adminData)) {
      errors.push(`آیتم ${index + 1}: فیلد "${field}" الزامی است`);
    }
  }

  // Validate admin_username
  if (adminData.admin_username && (typeof adminData.admin_username !== 'string' || adminData.admin_username.trim() === '')) {
    errors.push(`آیتم ${index + 1}: نام کاربری ادمین نمی‌تواند خالی باشد`);
  }

  // Validate volume fields (should be parseable as float)
  const volumeFields = [
    'limited_1_month_volume', 'limited_2_month_volume', 'limited_3_month_volume',
    'limited_4_month_volume', 'limited_5_month_volume', 'limited_6_month_volume'
  ];

  for (const field of volumeFields) {
    if (adminData[field] !== undefined) {
      const value = parseFloat(adminData[field]);
      if (isNaN(value) || value < 0) {
        errors.push(`آیتم ${index + 1}: "${field}" باید عدد مثبت معتبر باشد`);
      }
    }
  }

  // Validate count fields (should be parseable as integer)
  const countFields = [
    'unlimited_1_month', 'unlimited_2_month', 'unlimited_3_month',
    'unlimited_4_month', 'unlimited_5_month', 'unlimited_6_month'
  ];

  for (const field of countFields) {
    if (adminData[field] !== undefined) {
      const value = parseInt(adminData[field]);
      if (isNaN(value) || value < 0) {
        errors.push(`آیتم ${index + 1}: "${field}" باید عدد صحیح مثبت معتبر باشد`);
      }
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Processes individual admin data
 */
export function processAdminData(adminData: JSONAdminData, index: number): ProcessedAdminData {
  const validation = validateAdminData(adminData, index);

  if (!validation.isValid) {
    return {
      adminUsername: adminData.admin_username || '',
      limitedVolumes: {
        month1: 0, month2: 0, month3: 0, month4: 0, month5: 0, month6: 0
      },
      unlimitedCounts: {
        month1: 0, month2: 0, month3: 0, month4: 0, month5: 0, month6: 0
      },
      isValid: false,
      errors: validation.errors
    };
  }

  return {
    adminUsername: adminData.admin_username.trim(),
    limitedVolumes: {
      month1: parseFloat(adminData.limited_1_month_volume) || 0,
      month2: parseFloat(adminData.limited_2_month_volume) || 0,
      month3: parseFloat(adminData.limited_3_month_volume) || 0,
      month4: parseFloat(adminData.limited_4_month_volume) || 0,
      month5: parseFloat(adminData.limited_5_month_volume) || 0,
      month6: parseFloat(adminData.limited_6_month_volume) || 0,
    },
    unlimitedCounts: {
      month1: parseInt(adminData.unlimited_1_month) || 0,
      month2: parseInt(adminData.unlimited_2_month) || 0,
      month3: parseInt(adminData.unlimited_3_month) || 0,
      month4: parseInt(adminData.unlimited_4_month) || 0,
      month5: parseInt(adminData.unlimited_5_month) || 0,
      month6: parseInt(adminData.unlimited_6_month) || 0,
    },
    isValid: true,
    errors: []
  };
}

/**
 * Processes entire JSON data array
 */
export function processJSONData(data: any): JSONProcessingResult {
  const structureValidation = validateJSONStructure(data);
  
  if (!structureValidation.isValid) {
    return {
      processedAdmins: [],
      totalAdmins: 0,
      validAdmins: 0,
      errors: structureValidation.errors
    };
  }

  const processedAdmins: ProcessedAdminData[] = [];
  const globalErrors: string[] = [];
  let validAdmins = 0;

  data.forEach((adminData: any, index: number) => {
    const processed = processAdminData(adminData, index);
    processedAdmins.push(processed);
    
    if (processed.isValid) {
      validAdmins++;
    } else {
      globalErrors.push(...processed.errors);
    }
  });

  return {
    processedAdmins,
    totalAdmins: data.length,
    validAdmins,
    errors: globalErrors
  };
}

/**
 * Calculates invoice total for processed admin data using representative pricing
 */
export function calculateInvoiceTotal(
  processedAdmin: ProcessedAdminData,
  representativePricing: {
    pricePerGB?: number;
    unlimitedMonthlyPrice?: number;
  }
): { totalAmount: number; items: any[] } {
  let totalAmount = 0;
  const items: any[] = [];

  const { limitedVolumes, unlimitedCounts } = processedAdmin;
  const { pricePerGB = 0, unlimitedMonthlyPrice = 0 } = representativePricing;

  // Calculate limited subscription costs (volume-based with specific rates per duration)
  const limitedRates = {
    1: parseFloat(representativePricing.limitedPrice1Month || '3000'),
    2: parseFloat(representativePricing.limitedPrice2Month || '1800'),
    3: parseFloat(representativePricing.limitedPrice3Month || '1200'),
    4: parseFloat(representativePricing.limitedPrice4Month || '900'),
    5: parseFloat(representativePricing.limitedPrice5Month || '720'),
    6: parseFloat(representativePricing.limitedPrice6Month || '600'),
  };

  Object.entries(limitedVolumes).forEach(([monthKey, volume]) => {
    if (volume > 0) {
      const months = parseInt(monthKey.replace('month', ''));
      const ratePerGB = limitedRates[months as keyof typeof limitedRates] || 0;
      const totalPrice = ratePerGB * volume;
      totalAmount += totalPrice;

      items.push({
        description: `اشتراک ${months} ماهه محدود (${volume} گیگابایت)`,
        quantity: volume.toString(),
        unitPrice: ratePerGB.toString(),
        totalPrice: totalPrice.toString(),
        subscriptionType: 'limited',
        durationMonths: months,
      });
    }
  });

  // Calculate unlimited subscription costs (count-based)
  if (unlimitedMonthlyPrice > 0) {
    Object.entries(unlimitedCounts).forEach(([monthKey, count]) => {
      if (count > 0) {
        const months = parseInt(monthKey.replace('month', ''));
        const unitPrice = unlimitedMonthlyPrice * months;
        const totalPrice = unitPrice * count;
        totalAmount += totalPrice;

        items.push({
          description: `اشتراک ${months} ماهه نامحدود`,
          quantity: count.toString(),
          unitPrice: unitPrice.toString(),
          totalPrice: totalPrice.toString(),
          subscriptionType: 'unlimited',
          durationMonths: months,
        });
      }
    });
  }

  return { totalAmount, items };
}