// Persian number conversion utilities
export function convertToPersianDigits(input: string | number): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return input.toString().replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
}

export function convertToEnglishDigits(input: string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  
  let result = input;
  
  // Convert Persian digits
  persianDigits.forEach((persianDigit, index) => {
    result = result.replace(new RegExp(persianDigit, 'g'), index.toString());
  });
  
  // Convert Arabic digits
  arabicDigits.forEach((arabicDigit, index) => {
    result = result.replace(new RegExp(arabicDigit, 'g'), index.toString());
  });
  
  return result;
}

export function formatPersianNumber(number: string | number): string {
  const numStr = number.toString();
  
  // Add thousands separators
  const formatted = numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  // Convert to Persian digits
  return convertToPersianDigits(formatted);
}

export function formatCurrency(amount: string | number, currency: string = 'تومان'): string {
  return `${formatPersianNumber(amount)} ${currency}`;
}

// Persian date utilities
export function formatPersianDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(dateObj);
  } catch (error) {
    // Fallback for older browsers
    const persianDate = dateObj.toLocaleDateString('fa-IR');
    return persianDate;
  }
}

export function formatPersianDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  } catch (error) {
    // Fallback
    return `${formatPersianDate(dateObj)} ${dateObj.getHours()}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
  }
}

// Text direction utilities
export function getTextDirection(text: string): 'rtl' | 'ltr' {
  const rtlPattern = /[\u0590-\u083F]|[\u08A0-\u08FF]|[\uFB50-\uFDFF]|[\uFE70-\uFEFF]/;
  return rtlPattern.test(text) ? 'rtl' : 'ltr';
}

// Persian text utilities
export function isPersianText(text: string): boolean {
  const persianPattern = /[\u0600-\u06FF]/;
  return persianPattern.test(text);
}

// Invoice number formatting
export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  return `INV-${year}-${timestamp}`;
}

// Amount validation for Persian inputs
export function validatePersianAmount(input: string): number | null {
  const englishInput = convertToEnglishDigits(input.replace(/[,\s]/g, ''));
  const amount = parseFloat(englishInput);
  return isNaN(amount) ? null : amount;
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '۰ بایت';
  
  const k = 1024;
  const sizes = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  const size = (bytes / Math.pow(k, i)).toFixed(1);
  return `${convertToPersianDigits(size)} ${sizes[i]}`;
}

// Status text mapping
export function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    active: 'فعال',
    inactive: 'غیرفعال',
    suspended: 'معلق',
    paid: 'پرداخت شده',
    pending: 'در انتظار پرداخت',
    overdue: 'معوق',
    cancelled: 'لغو شده',
    processing: 'در حال پردازش',
    completed: 'تکمیل شده',
    failed: 'ناموفق'
  };
  
  return statusMap[status] || status;
}

// URL-safe Persian text
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u0600-\u06FF\s]+/g, '-') // Replace Persian chars and spaces with dash
    .replace(/[^\w\-]+/g, '') // Remove non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple dashes with single dash
    .replace(/^-+/, '') // Trim dashes from start
    .replace(/-+$/, ''); // Trim dashes from end
}
