/**
 * Enhanced Persian Voice Processing System
 * Optimized for V2Ray business context and Iranian cultural nuances
 */

import { aegisLogger, EventType, LogLevel } from './aegis-logger';

interface PersianVoiceConfig {
  languageCode: string;
  model: string;
  enableAutomaticPunctuation: boolean;
  enableWordTimeOffsets: boolean;
  speechContexts: Array<{
    phrases: string[];
    boost?: number;
  }>;
}

interface ShamsiDateExtractionResult {
  originalText: string;
  extractedDates: Array<{
    text: string;
    shamsiDate: string;
    gregorianDate: Date;
    type: 'absolute' | 'relative';
  }>;
  tasks: Array<{
    description: string;
    dueDate: Date;
    shamsiDueDate: string;
  }>;
}

interface V2RayVoiceProcessingResult {
  transcription: string;
  confidence: number;
  shamsiDateExtraction: ShamsiDateExtractionResult;
  v2rayContext: {
    serviceType: string | null;
    representativeId: string | null;
    actionItems: string[];
    businessContext: string;
  };
  culturalMarkers: {
    formalityLevel: 'formal' | 'informal' | 'respectful';
    urgencyIndicators: string[];
    relationshipContext: string;
  };
  aiSuggestions: {
    followUpActions: string[];
    communicationTone: string;
    timing: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
  };
}

class EnhancedPersianVoiceProcessor {
  private readonly v2rayTerminology = [
    // V2Ray specific terms
    'شادوساکس', 'تروجان', 'وی‌راهی', 'کانفیگ', 'پروکسی',
    'سرور', 'ساب‌سکریپشن', 'پلن نامحدود', 'پلن حجمی',
    'اتصال', 'سرعت', 'پینگ', 'لیمیت', 'ترافیک',
    
    // Business terms
    'نماینده', 'مشتری', 'فروش', 'کمیسیون', 'درآمد',
    'پرداخت', 'حساب', 'موجودی', 'تسویه', 'فاکتور',
    
    // MarFanet specific
    'MarFanet', 'مارفانت', 'سیستم', 'پنل', 'گزارش',
    'پشتیبانی', 'مدیریت', 'آمار', 'تحلیل'
  ];

  private readonly persianMonths = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];

  private readonly relativeDateTerms = [
    'فردا', 'پس‌فردا', 'یک هفته دیگر', 'دو هفته دیگر',
    'یک ماه دیگر', 'هفته آینده', 'ماه آینده', 'سال آینده'
  ];

  private getOptimizedConfig(): PersianVoiceConfig {
    return {
      languageCode: 'fa-IR',
      model: 'latest_long',
      enableAutomaticPunctuation: true,
      enableWordTimeOffsets: true,
      speechContexts: [
        {
          phrases: this.v2rayTerminology,
          boost: 20 // High boost for V2Ray terms
        },
        {
          phrases: this.persianMonths,
          boost: 15 // Medium boost for date recognition
        },
        {
          phrases: this.relativeDateTerms,
          boost: 15
        }
      ]
    };
  }

  async processVoiceNote(audioData: string | ArrayBuffer): Promise<V2RayVoiceProcessingResult> {
    const startTime = Date.now();
    
    try {
      // Step 1: Convert speech to text with optimized Persian configuration
      const transcription = await this.optimizedSpeechToText(audioData);
      
      // Step 2: Extract Shamsi dates and tasks
      const shamsiExtraction = await this.extractShamsiDatesAndTasks(transcription.text);
      
      // Step 3: Analyze V2Ray business context
      const v2rayContext = await this.analyzeV2RayContext(transcription.text);
      
      // Step 4: Detect cultural markers
      const culturalMarkers = this.analyzeCulturalMarkers(transcription.text);
      
      // Step 5: Generate culturally-aware AI suggestions
      const aiSuggestions = await this.generateCulturallyAwareAISuggestions(
        transcription.text, 
        v2rayContext, 
        culturalMarkers
      );

      const result: V2RayVoiceProcessingResult = {
        transcription: transcription.text,
        confidence: transcription.confidence,
        shamsiDateExtraction: shamsiExtraction,
        v2rayContext,
        culturalMarkers,
        aiSuggestions
      };

      const duration = Date.now() - startTime;
      aegisLogger.logVoiceProcessing('EnhancedPersianVoiceProcessor', 'voice_note', result, {
        processingDuration: duration,
        confidenceScore: transcription.confidence
      });

      return result;

    } catch (error) {
      aegisLogger.logAIError('EnhancedPersianVoiceProcessor', 'Google-STT-Vertex', error);
      throw error;
    }
  }

  private async optimizedSpeechToText(audioData: string | ArrayBuffer): Promise<{text: string, confidence: number}> {
    const config = this.getOptimizedConfig();
    const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
    
    if (!apiKey) {
      throw new Error('Google AI Studio API key required for Persian voice processing');
    }

    // Convert audio data to base64 if needed
    const audioContent = typeof audioData === 'string' ? audioData : 
      Buffer.from(audioData).toString('base64');

    const requestBody = {
      config,
      audio: { content: audioContent }
    };

    const response = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Speech-to-Text API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.results || result.results.length === 0) {
      return { text: '', confidence: 0 };
    }

    const transcript = result.results[0].alternatives[0];
    return {
      text: transcript.transcript || '',
      confidence: transcript.confidence || 0
    };
  }

  private async extractShamsiDatesAndTasks(text: string): Promise<ShamsiDateExtractionResult> {
    const extractedDates: Array<{
      text: string;
      shamsiDate: string;
      gregorianDate: Date;
      type: 'absolute' | 'relative';
    }> = [];
    const tasks: Array<{
      description: string;
      dueDate: Date;
      shamsiDueDate: string;
    }> = [];

    // Extract absolute Shamsi dates (e.g., "15 فروردین")
    const shamsiDateRegex = /(\d{1,2})\s*(فروردین|اردیبهشت|خرداد|تیر|مرداد|شهریور|مهر|آبان|آذر|دی|بهمن|اسفند)/g;
    let match;
    
    while ((match = shamsiDateRegex.exec(text)) !== null) {
      const day = parseInt(match[1]);
      const month = match[2];
      const monthIndex = this.persianMonths.indexOf(month);
      
      if (monthIndex !== -1) {
        // Calculate Gregorian date (simplified conversion)
        const currentYear = new Date().getFullYear();
        const gregorianDate = this.shamsiToGregorian(currentYear, monthIndex + 1, day);
        
        extractedDates.push({
          text: match[0],
          shamsiDate: `${day} ${month}`,
          gregorianDate,
          type: 'absolute' as const
        });
      }
    }

    // Extract relative dates
    this.relativeDateTerms.forEach(term => {
      if (text.includes(term)) {
        const gregorianDate = this.calculateRelativeDate(term);
        extractedDates.push({
          text: term,
          shamsiDate: this.gregorianToShamsi(gregorianDate),
          gregorianDate,
          type: 'relative' as const
        });
      }
    });

    // Extract tasks with dates
    const taskIndicators = ['باید', 'لازمه', 'قراره', 'می‌خوام', 'برنامه'];
    const sentences = text.split(/[.!?؟]/);
    
    sentences.forEach(sentence => {
      const hasTaskIndicator = taskIndicators.some(indicator => sentence.includes(indicator));
      const associatedDate = extractedDates.find(date => 
        sentence.includes(date.text) || 
        Math.abs(sentence.indexOf(date.text) - text.indexOf(sentence)) < 100
      );
      
      if (hasTaskIndicator && associatedDate) {
        tasks.push({
          description: sentence.trim(),
          dueDate: associatedDate.gregorianDate,
          shamsiDueDate: associatedDate.shamsiDate
        });
      }
    });

    return {
      originalText: text,
      extractedDates,
      tasks
    };
  }

  private async analyzeV2RayContext(text: string): Promise<V2RayVoiceProcessingResult['v2rayContext']> {
    const v2rayTermsFound = this.v2rayTerminology.filter(term => text.includes(term));
    
    let serviceType = null;
    if (text.includes('شادوساکس') || text.includes('shadowsocks')) serviceType = 'Shadowsocks';
    if (text.includes('تروجان') || text.includes('trojan')) serviceType = 'Trojan';
    if (text.includes('وی‌راهی') || text.includes('v2ray')) serviceType = 'V2Ray';

    // Extract representative ID from context
    const repIdMatch = text.match(/نماینده\s*(\d+)|کد\s*(\d+)/);
    const representativeId = repIdMatch ? (repIdMatch[1] || repIdMatch[2]) : null;

    // Identify action items
    const actionItems = [];
    if (text.includes('تماس')) actionItems.push('تماس با نماینده');
    if (text.includes('فاکتور') || text.includes('صورتحساب')) actionItems.push('ارسال فاکتور');
    if (text.includes('پشتیبانی')) actionItems.push('ارائه پشتیبانی فنی');
    if (text.includes('تمدید')) actionItems.push('تمدید سرویس');

    const businessContext = v2rayTermsFound.length > 0 ? 'V2Ray Business Discussion' : 'General Business Communication';

    return {
      serviceType,
      representativeId,
      actionItems,
      businessContext
    };
  }

  private analyzeCulturalMarkers(text: string): V2RayVoiceProcessingResult['culturalMarkers'] {
    // Detect formality level
    let formalityLevel: 'formal' | 'informal' | 'respectful' = 'informal';
    if (text.includes('جناب') || text.includes('سرkar') || text.includes('محترم')) {
      formalityLevel = 'respectful';
    } else if (text.includes('شما') || text.includes('لطفاً')) {
      formalityLevel = 'formal';
    }

    // Detect urgency indicators
    const urgencyIndicators = [];
    if (text.includes('فوری') || text.includes('سریع')) urgencyIndicators.push('فوری');
    if (text.includes('مهم') || text.includes('ضروری')) urgencyIndicators.push('اولویت بالا');
    if (text.includes('دیر شده') || text.includes('عجله')) urgencyIndicators.push('تأخیر موجود');

    // Detect relationship context
    let relationshipContext = 'Professional';
    if (text.includes('دوست') || text.includes('رفیق')) relationshipContext = 'Friendly';
    if (text.includes('استاد') || text.includes('آقای') || text.includes('خانم')) relationshipContext = 'Respectful Professional';

    return {
      formalityLevel,
      urgencyIndicators,
      relationshipContext
    };
  }

  private async generateCulturallyAwareAISuggestions(
    text: string, 
    context: V2RayVoiceProcessingResult['v2rayContext'],
    cultural: V2RayVoiceProcessingResult['culturalMarkers']
  ): Promise<V2RayVoiceProcessingResult['aiSuggestions']> {
    
    const followUpActions = [];
    let communicationTone = 'Professional';
    let timing = 'Normal business hours';
    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';

    // Generate culturally appropriate follow-up actions
    if (context.serviceType) {
      followUpActions.push(`بررسی وضعیت ${context.serviceType} نماینده`);
    }
    
    if (context.representativeId) {
      followUpActions.push(`مراجعه به پرونده نماینده ${context.representativeId}`);
    }

    // Adjust communication tone based on cultural markers
    if (cultural.formalityLevel === 'respectful') {
      communicationTone = 'Respectful and formal';
    } else if (cultural.formalityLevel === 'informal') {
      communicationTone = 'Friendly but professional';
    }

    // Determine timing based on Iranian business culture
    const currentHour = new Date().getHours();
    if (currentHour >= 8 && currentHour <= 12) {
      timing = 'Morning (optimal for business calls in Iran)';
    } else if (currentHour >= 14 && currentHour <= 18) {
      timing = 'Afternoon (good for follow-up calls)';
    } else {
      timing = 'Outside business hours - schedule for next business day';
    }

    // Set priority based on urgency indicators
    if (cultural.urgencyIndicators.includes('فوری')) {
      priority = 'urgent';
      timing = 'Immediate response required';
    } else if (cultural.urgencyIndicators.length > 0) {
      priority = 'high';
    }

    return {
      followUpActions,
      communicationTone,
      timing,
      priority
    };
  }

  // Helper methods for date conversion
  private shamsiToGregorian(shamsiYear: number, shamsiMonth: number, shamsiDay: number): Date {
    // Simplified conversion - in production, use a proper Persian calendar library
    const baseGregorianYear = shamsiYear + 621;
    return new Date(baseGregorianYear, shamsiMonth - 1, shamsiDay);
  }

  private gregorianToShamsi(date: Date): string {
    // Simplified conversion - in production, use a proper Persian calendar library
    const shamsiYear = date.getFullYear() - 621;
    const shamsiMonth = this.persianMonths[date.getMonth()];
    return `${date.getDate()} ${shamsiMonth} ${shamsiYear}`;
  }

  private calculateRelativeDate(relativeTerm: string): Date {
    const now = new Date();
    const result = new Date(now);

    switch (relativeTerm) {
      case 'فردا':
        result.setDate(now.getDate() + 1);
        break;
      case 'پس‌فردا':
        result.setDate(now.getDate() + 2);
        break;
      case 'یک هفته دیگر':
        result.setDate(now.getDate() + 7);
        break;
      case 'دو هفته دیگر':
        result.setDate(now.getDate() + 14);
        break;
      case 'یک ماه دیگر':
        result.setMonth(now.getMonth() + 1);
        break;
      default:
        result.setDate(now.getDate() + 1);
    }

    return result;
  }
}

export const enhancedPersianVoiceProcessor = new EnhancedPersianVoiceProcessor();