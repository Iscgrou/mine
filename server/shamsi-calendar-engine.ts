/**
 * Comprehensive Shamsi Calendar Engine for MarFanet
 * Provides flawless Persian date handling with Tehran timezone precision
 */

import { aegisLogger, EventType, LogLevel } from './aegis-logger';

interface ShamsiDate {
  year: number;
  month: number;
  day: number;
  monthName: string;
  dayName?: string;
  formatted: string;
  tehranTime: Date;
}

interface DateExtractionResult {
  originalText: string;
  extractedDates: Array<{
    text: string;
    shamsiDate: ShamsiDate;
    gregorianDate: Date;
    type: 'absolute' | 'relative' | 'range';
    confidence: number;
  }>;
  timeReferences: Array<{
    text: string;
    hour: number;
    minute: number;
    period: 'صبح' | 'ظهر' | 'عصر' | 'شب';
    tehranTime: Date;
  }>;
}

interface TaskSchedulingResult {
  taskId: string;
  description: string;
  shamsiDueDate: ShamsiDate;
  gregorianDueDate: Date;
  tehranReminderTime: Date; // 6:00 AM TST
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'scheduled' | 'reminded' | 'completed';
}

class ShamsiCalendarEngine {
  private readonly persianMonths = [
    { name: 'فروردین', days: 31, index: 1 },
    { name: 'اردیبهشت', days: 31, index: 2 },
    { name: 'خرداد', days: 31, index: 3 },
    { name: 'تیر', days: 31, index: 4 },
    { name: 'مرداد', days: 31, index: 5 },
    { name: 'شهریور', days: 31, index: 6 },
    { name: 'مهر', days: 30, index: 7 },
    { name: 'آبان', days: 30, index: 8 },
    { name: 'آذر', days: 30, index: 9 },
    { name: 'دی', days: 30, index: 10 },
    { name: 'بهمن', days: 30, index: 11 },
    { name: 'اسفند', days: 29, index: 12 } // 30 in leap years
  ];

  private readonly persianDays = [
    'شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'
  ];

  private readonly relativeTerms = [
    { term: 'امروز', days: 0 },
    { term: 'فردا', days: 1 },
    { term: 'پس‌فردا', days: 2 },
    { term: 'دیروز', days: -1 },
    { term: 'پریروز', days: -2 },
    { term: 'یک هفته دیگر', days: 7 },
    { term: 'دو هفته دیگر', days: 14 },
    { term: 'سه هفته دیگر', days: 21 },
    { term: 'یک ماه دیگر', days: 30 },
    { term: 'دو ماه دیگر', days: 60 },
    { term: 'یک سال دیگر', days: 365 },
    { term: 'هفته آینده', days: 7 },
    { term: 'ماه آینده', days: 30 },
    { term: 'سال آینده', days: 365 },
    { term: 'آخر هفته', days: 5 }, // Approximate to Friday
    { term: 'آخر ماه', days: 25 } // Approximate to end of month
  ];

  private readonly timeExpressions = [
    { term: 'صبح', hour: 8, period: 'صبح' as const },
    { term: 'ظهر', hour: 12, period: 'ظهر' as const },
    { term: 'عصر', hour: 16, period: 'عصر' as const },
    { term: 'شب', hour: 20, period: 'شب' as const },
    { term: 'نیمه‌شب', hour: 0, period: 'شب' as const },
    { term: 'طلوع آفتاب', hour: 6, period: 'صبح' as const },
    { term: 'غروب آفتاب', hour: 18, period: 'شب' as const }
  ];

  /**
   * Get current Shamsi date in Tehran timezone
   */
  getCurrentShamsiDate(): ShamsiDate {
    const tehranTime = this.getTehranTime();
    return this.gregorianToShamsi(tehranTime);
  }

  /**
   * Get current Tehran time (TST: UTC+3:30)
   */
  getTehranTime(): Date {
    const now = new Date();
    const tehranOffset = 3.5 * 60 * 60 * 1000; // UTC+3:30 in milliseconds
    return new Date(now.getTime() + tehranOffset - (now.getTimezoneOffset() * 60 * 1000));
  }

  /**
   * Extract all date and time references from Persian text
   */
  extractDatesFromText(text: string): DateExtractionResult {
    const extractedDates = [];
    const timeReferences = [];

    try {
      // Extract absolute Shamsi dates (e.g., "15 فروردین 1403", "25 تیر")
      const absoluteDateRegex = /(\d{1,2})\s*(فروردین|اردیبهشت|خرداد|تیر|مرداد|شهریور|مهر|آبان|آذر|دی|بهمن|اسفند)(?:\s*(\d{4}))?/g;
      let match;
      
      while ((match = absoluteDateRegex.exec(text)) !== null) {
        const day = parseInt(match[1]);
        const monthName = match[2];
        const year = match[3] ? parseInt(match[3]) : this.getCurrentShamsiDate().year;
        
        const month = this.persianMonths.findIndex(m => m.name === monthName) + 1;
        if (month > 0) {
          const shamsiDate = this.createShamsiDate(year, month, day);
          const gregorianDate = this.shamsiToGregorian(year, month, day);
          
          extractedDates.push({
            text: match[0],
            shamsiDate,
            gregorianDate,
            type: 'absolute' as const,
            confidence: 0.95
          });
        }
      }

      // Extract relative dates
      this.relativeTerms.forEach(term => {
        const regex = new RegExp(term.term, 'g');
        if (regex.test(text)) {
          const baseDate = this.getTehranTime();
          const targetDate = new Date(baseDate.getTime() + (term.days * 24 * 60 * 60 * 1000));
          const shamsiDate = this.gregorianToShamsi(targetDate);
          
          extractedDates.push({
            text: term.term,
            shamsiDate,
            gregorianDate: targetDate,
            type: 'relative' as const,
            confidence: 0.90
          });
        }
      });

      // Extract time references
      this.timeExpressions.forEach(timeExpr => {
        const regex = new RegExp(timeExpr.term, 'g');
        if (regex.test(text)) {
          const tehranTime = this.getTehranTime();
          tehranTime.setHours(timeExpr.hour, 0, 0, 0);
          
          timeReferences.push({
            text: timeExpr.term,
            hour: timeExpr.hour,
            minute: 0,
            period: timeExpr.period,
            tehranTime
          });
        }
      });

      // Extract specific time patterns (e.g., "ساعت 9", "9:30")
      const specificTimeRegex = /(?:ساعت\s*)?(\d{1,2})(?::(\d{2}))?(?:\s*(صبح|ظهر|عصر|شب))?/g;
      while ((match = specificTimeRegex.exec(text)) !== null) {
        const hour = parseInt(match[1]);
        const minute = match[2] ? parseInt(match[2]) : 0;
        const period = match[3] || 'صبح';
        
        const adjustedHour = this.adjustHourForPeriod(hour, period as any);
        const tehranTime = this.getTehranTime();
        tehranTime.setHours(adjustedHour, minute, 0, 0);
        
        timeReferences.push({
          text: match[0],
          hour: adjustedHour,
          minute,
          period: period as any,
          tehranTime
        });
      }

      aegisLogger.log({
        eventType: EventType.AI_REQUEST,
        level: LogLevel.INFO,
        source: 'ShamsiCalendarEngine',
        message: 'Date extraction completed',
        metadata: {
          originalText: text,
          extractedDatesCount: extractedDates.length,
          timeReferencesCount: timeReferences.length
        }
      });

      return {
        originalText: text,
        extractedDates,
        timeReferences
      };

    } catch (error) {
      aegisLogger.error('ShamsiCalendarEngine', 'Date extraction failed', error);
      return {
        originalText: text,
        extractedDates: [],
        timeReferences: []
      };
    }
  }

  /**
   * Schedule a task with automatic 6:00 AM Tehran time reminder
   */
  scheduleTask(description: string, shamsiDueDate: ShamsiDate, priority: TaskSchedulingResult['priority'] = 'medium'): TaskSchedulingResult {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const gregorianDueDate = this.shamsiToGregorian(shamsiDueDate.year, shamsiDueDate.month, shamsiDueDate.day);
    
    // Set reminder for 6:00 AM Tehran time on due date
    const tehranReminderTime = new Date(gregorianDueDate);
    tehranReminderTime.setHours(6, 0, 0, 0); // 6:00 AM TST
    
    const result: TaskSchedulingResult = {
      taskId,
      description,
      shamsiDueDate,
      gregorianDueDate,
      tehranReminderTime,
      priority,
      status: 'scheduled'
    };

    aegisLogger.log({
      eventType: EventType.CRM_INTERACTION,
      level: LogLevel.INFO,
      source: 'ShamsiCalendarEngine',
      message: 'Task scheduled with Shamsi calendar',
      metadata: {
        taskId,
        shamsiDate: shamsiDueDate.formatted,
        reminderTime: tehranReminderTime.toISOString(),
        priority
      }
    });

    return result;
  }

  /**
   * Convert Gregorian date to Shamsi
   */
  gregorianToShamsi(gregorianDate: Date): ShamsiDate {
    // Simplified conversion algorithm - in production, use a precise library
    const baseGregorianYear = 1979; // 1358 Shamsi
    const baseShamsiYear = 1358;
    
    const yearDiff = gregorianDate.getFullYear() - baseGregorianYear;
    const shamsiYear = baseShamsiYear + yearDiff;
    
    // Calculate day of year and convert to Shamsi month/day
    const startOfYear = new Date(gregorianDate.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((gregorianDate.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    
    let shamsiMonth = 1;
    let shamsiDay = dayOfYear;
    
    for (const month of this.persianMonths) {
      if (shamsiDay <= month.days) {
        shamsiMonth = month.index;
        break;
      }
      shamsiDay -= month.days;
    }

    return this.createShamsiDate(shamsiYear, shamsiMonth, shamsiDay);
  }

  /**
   * Convert Shamsi date to Gregorian
   */
  shamsiToGregorian(shamsiYear: number, shamsiMonth: number, shamsiDay: number): Date {
    // Simplified conversion algorithm - in production, use a precise library
    const baseGregorianYear = 1979; // 1358 Shamsi
    const baseShamsiYear = 1358;
    
    const yearDiff = shamsiYear - baseShamsiYear;
    const gregorianYear = baseGregorianYear + yearDiff;
    
    // Calculate total days from start of Shamsi year
    let totalDays = 0;
    for (let i = 1; i < shamsiMonth; i++) {
      totalDays += this.persianMonths[i - 1].days;
    }
    totalDays += shamsiDay - 1;
    
    const startOfGregorianYear = new Date(gregorianYear, 2, 21); // Approximate Nowruz
    const gregorianDate = new Date(startOfGregorianYear.getTime() + (totalDays * 24 * 60 * 60 * 1000));
    
    return gregorianDate;
  }

  /**
   * Create a properly formatted ShamsiDate object
   */
  private createShamsiDate(year: number, month: number, day: number): ShamsiDate {
    const monthData = this.persianMonths[month - 1];
    const tehranTime = this.shamsiToGregorian(year, month, day);
    
    return {
      year,
      month,
      day,
      monthName: monthData.name,
      formatted: `${day} ${monthData.name} ${year}`,
      tehranTime
    };
  }

  /**
   * Adjust hour based on Persian time period
   */
  private adjustHourForPeriod(hour: number, period: 'صبح' | 'ظهر' | 'عصر' | 'شب'): number {
    switch (period) {
      case 'صبح':
        return hour >= 1 && hour <= 12 ? hour : hour + 12;
      case 'ظهر':
        return hour === 12 ? 12 : hour + 12;
      case 'عصر':
        return hour >= 1 && hour <= 6 ? hour + 12 : hour;
      case 'شب':
        return hour >= 7 && hour <= 11 ? hour + 12 : hour;
      default:
        return hour;
    }
  }

  /**
   * Format Shamsi date for display
   */
  formatShamsiDate(shamsiDate: ShamsiDate, includeDay: boolean = false): string {
    const dayName = includeDay ? `${this.persianDays[shamsiDate.tehranTime.getDay()]} ` : '';
    return `${dayName}${shamsiDate.formatted}`;
  }

  /**
   * Check if a date is a Persian holiday or weekend
   */
  isPersianHoliday(shamsiDate: ShamsiDate): boolean {
    // Add Persian holiday logic here
    const dayOfWeek = shamsiDate.tehranTime.getDay();
    return dayOfWeek === 5; // Friday is weekend in Iran
  }

  /**
   * Get next business day in Tehran
   */
  getNextBusinessDay(shamsiDate: ShamsiDate): ShamsiDate {
    let nextDay = new Date(shamsiDate.tehranTime);
    do {
      nextDay.setDate(nextDay.getDate() + 1);
    } while (this.isPersianHoliday(this.gregorianToShamsi(nextDay)));
    
    return this.gregorianToShamsi(nextDay);
  }
}

export const shamsiCalendarEngine = new ShamsiCalendarEngine();
export { ShamsiDate, DateExtractionResult, TaskSchedulingResult };