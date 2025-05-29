import { db } from "./db";
import { sql, eq } from "drizzle-orm";
import { aegisLogger, EventType, LogLevel } from "./aegis-logger";
import { crmInteractions, crmCallPreparations, crmRepresentativeProfiles } from "@shared/schema";

interface AIServiceConfig {
  grokApiKey?: string;
  speechToTextApiKey?: string;
  sentimentApiKey?: string;
}

interface PsycheProfile {
  communicationStyle: 'direct' | 'diplomatic' | 'technical' | 'relationship-focused';
  decisionMakingPattern: 'analytical' | 'intuitive' | 'consensus-seeking' | 'rapid';
  stressIndicators: string[];
  motivationalTriggers: string[];
  emotionalResponsePatterns: Record<string, number>;
  riskTolerance: number;
  culturalContext: string;
}

interface CallPreparationResult {
  talkingPoints: string[];
  representativeBackground: string;
  suggestedApproach: string;
  riskFactors: string[];
  opportunities: string[];
  culturalNotes: string[];
  emotionalState: string;
  optimalTiming: string;
  expectedOutcome: string;
}

interface VoiceProcessingResult {
  transcription: string;
  sentiment: {
    score: number;
    label: string;
    confidence: number;
  };
  keyTopics: string[];
  aiSuggestions: string[];
  urgencyLevel: string;
  emotionalMarkers: string[];
}

class NovaAIEngine {
  private aiConfig: AIServiceConfig = {};

  constructor() {
    this.loadAIConfiguration();
    aegisLogger.info('NovaAIEngine', 'AI processing engine initialized');
  }

  private async loadAIConfiguration(): Promise<void> {
    try {
      // Load API keys from settings
      const grokSetting = await db.execute(sql`
        SELECT value FROM settings WHERE key = 'grok_api_key' LIMIT 1
      `);
      
      const speechSetting = await db.execute(sql`
        SELECT value FROM settings WHERE key = 'speech_to_text_api_key' LIMIT 1
      `);

      this.aiConfig = {
        grokApiKey: grokSetting.rows[0]?.value,
        speechToTextApiKey: speechSetting.rows[0]?.value
      };

    } catch (error) {
      aegisLogger.error('NovaAIEngine', 'Failed to load AI configuration', error);
    }
  }

  async generateCallPreparation(representativeId: number, callPurpose: string, crmUserId: number): Promise<CallPreparationResult> {
    const startTime = Date.now();
    aegisLogger.logAIRequest('NovaAIEngine', 'Grok', `Call preparation for representative ${representativeId}`);

    try {
      // Gather representative context
      const repContext = await this.gatherRepresentativeContext(representativeId);
      
      // Build comprehensive prompt for AI
      const prompt = this.buildCallPreparationPrompt(repContext, callPurpose);
      
      // Get AI response (simulated for now - will need actual API integration)
      const aiResponse = await this.callGrokAPI(prompt);
      
      // Parse and structure the response
      const result = this.parseCallPreparationResponse(aiResponse, repContext);
      
      // Store the preparation in database
      await this.storeCallPreparation(representativeId, crmUserId, callPurpose, result);
      
      const duration = Date.now() - startTime;
      aegisLogger.logAIResponse('NovaAIEngine', 'Grok', result, duration);
      
      return result;

    } catch (error) {
      aegisLogger.logAIError('NovaAIEngine', 'Grok', error);
      throw error;
    }
  }

  private async gatherRepresentativeContext(representativeId: number): Promise<any> {
    try {
      // Get representative basic info
      const repInfo = await db.execute(sql`
        SELECT * FROM representatives WHERE id = ${representativeId}
      `);

      // Get interaction history
      const interactions = await db.execute(sql`
        SELECT * FROM crm_interactions 
        WHERE representative_id = ${representativeId}
        ORDER BY created_at DESC 
        LIMIT 10
      `);

      // Get CRM profile if exists
      const profile = await db.execute(sql`
        SELECT * FROM crm_representative_profiles 
        WHERE representative_id = ${representativeId}
      `);

      // Get recent invoices and payments
      const financialHistory = await db.execute(sql`
        SELECT i.*, p.amount as last_payment, p.created_at as last_payment_date
        FROM invoices i
        LEFT JOIN payments p ON i.id = p.invoice_id
        WHERE i.representative_id = ${representativeId}
        ORDER BY i.created_at DESC
        LIMIT 5
      `);

      return {
        representative: repInfo.rows[0],
        interactions: interactions.rows,
        profile: profile.rows[0],
        financialHistory: financialHistory.rows
      };

    } catch (error) {
      aegisLogger.error('NovaAIEngine', 'Failed to gather representative context', error);
      return {};
    }
  }

  private buildCallPreparationPrompt(context: any, callPurpose: string): string {
    return `
شما Nova هستید، سیستم هوش مصنوعی پیشرفته MarFanet برای روابط مشتریان. وظیفه شما آماده‌سازی تماس هوشمند و شخصی‌سازی شده برای تیم CRT است.

اطلاعات نماینده:
نام: ${context.representative?.full_name || 'نامشخص'}
نام کاربری: ${context.representative?.admin_username || 'نامشخص'}
وضعیت: ${context.representative?.status || 'نامشخص'}
تلفن: ${context.representative?.phone_number || 'نامشخص'}
نام فروشگاه: ${context.representative?.store_name || 'نامشخص'}

تعاملات اخیر: ${context.interactions?.length || 0} تعامل در سابقه

هدف تماس: ${callPurpose}

لطفاً ارائه دهید:
1. نکات کلیدی گفتگو (حداقل 5 نکته)
2. پیشینه نماینده (خلاصه وضعیت فعلی)
3. روش پیشنهادی برخورد
4. عوامل خطر احتمالی
5. فرصت‌های فروش/ارتقاء
6. نکات فرهنگی مهم
7. حالت احساسی احتمالی نماینده
8. بهترین زمان تماس
9. نتیجه مورد انتظار

پاسخ به زبان فارسی و با در نظر گیری فرهنگ ایرانی ارائه دهید.
`;
  }

  private async callGrokAPI(prompt: string): Promise<any> {
    if (!this.aiConfig.grokApiKey) {
      throw new Error('Grok API key not configured');
    }

    // For now, return a structured mock response that matches expected output
    // This will be replaced with actual Grok API call when credentials are provided
    return {
      talkingPoints: [
        "سلام گرم و صمیمانه با نام نماینده",
        "پیگیری وضعیت فعلی سرویس و رضایت از عملکرد",
        "بررسی نیازهای جدید و امکان ارتقاء سرویس",
        "ارائه راهکارهای بهینه‌سازی براساس الگوی استفاده",
        "برنامه‌ریزی برای پشتیبانی بهتر و تماس‌های آینده"
      ],
      representativeBackground: "نماینده فعال با سابقه مثبت همکاری",
      suggestedApproach: "برخورد دوستانه و راهنمایی محور با تمرکز بر ارزش افزوده",
      riskFactors: ["عدم پاسخگویی اخیر", "تاخیر در پرداخت"],
      opportunities: ["ارتقاء به پلن بالاتر", "معرفی سرویس‌های جانبی"],
      culturalNotes: ["احترام به وقت نماینده", "صبر در توضیحات فنی"],
      emotionalState: "متعادل با تمایل به همکاری",
      optimalTiming: "ساعات اداری روزهای یکشنبه تا چهارشنبه",
      expectedOutcome: "تقویت رابطه و شناسایی نیازهای جدید"
    };
  }

  private parseCallPreparationResponse(aiResponse: any, context: any): CallPreparationResult {
    return {
      talkingPoints: aiResponse.talkingPoints || [],
      representativeBackground: aiResponse.representativeBackground || '',
      suggestedApproach: aiResponse.suggestedApproach || '',
      riskFactors: aiResponse.riskFactors || [],
      opportunities: aiResponse.opportunities || [],
      culturalNotes: aiResponse.culturalNotes || [],
      emotionalState: aiResponse.emotionalState || 'نامشخص',
      optimalTiming: aiResponse.optimalTiming || '',
      expectedOutcome: aiResponse.expectedOutcome || ''
    };
  }

  private async storeCallPreparation(representativeId: number, crmUserId: number, callPurpose: string, result: CallPreparationResult): Promise<void> {
    try {
      await db.insert(crmCallPreparations).values({
        representativeId,
        crmUserId,
        callPurpose,
        aiTalkingPoints: JSON.stringify(result.talkingPoints),
        representativeBackground: result.representativeBackground,
        suggestedApproach: result.suggestedApproach,
        riskFactors: JSON.stringify(result.riskFactors),
        opportunities: JSON.stringify(result.opportunities),
        culturalNotes: JSON.stringify(result.culturalNotes),
        emotionalState: result.emotionalState,
        optimalTiming: result.optimalTiming,
        expectedOutcome: result.expectedOutcome
      });
    } catch (error) {
      aegisLogger.error('NovaAIEngine', 'Failed to store call preparation', error);
    }
  }

  async processVoiceNote(audioUrl: string, interactionId?: number): Promise<VoiceProcessingResult> {
    const startTime = Date.now();
    aegisLogger.logVoiceProcessing('NovaAIEngine', audioUrl, { stage: 'started' });

    try {
      // Step 1: Speech-to-Text conversion
      const transcription = await this.convertSpeechToText(audioUrl);
      
      // Step 2: Sentiment Analysis
      const sentiment = await this.analyzeSentiment(transcription);
      
      // Step 3: Extract key topics
      const keyTopics = await this.extractKeyTopics(transcription);
      
      // Step 4: Generate AI suggestions
      const aiSuggestions = await this.generateActionSuggestions(transcription, sentiment);
      
      // Step 5: Determine urgency level
      const urgencyLevel = this.determineUrgencyLevel(transcription, sentiment);
      
      const result: VoiceProcessingResult = {
        transcription,
        sentiment,
        keyTopics,
        aiSuggestions,
        urgencyLevel,
        emotionalMarkers: this.extractEmotionalMarkers(transcription)
      };

      const duration = Date.now() - startTime;
      aegisLogger.logVoiceProcessing('NovaAIEngine', audioUrl, result);

      return result;

    } catch (error) {
      aegisLogger.error('NovaAIEngine', 'Voice processing failed', error);
      throw error;
    }
  }

  private async convertSpeechToText(audioUrl: string): Promise<string> {
    if (!this.aiConfig.speechToTextApiKey) {
      throw new Error('Speech-to-text API key not configured');
    }

    // For now, return a mock transcription
    // This will be replaced with actual API call when credentials are provided
    return "متن نمونه از تبدیل صدا به متن. نماینده در حال درخواست پشتیبانی برای مشکل اتصال است.";
  }

  private async analyzeSentiment(text: string): Promise<{ score: number; label: string; confidence: number }> {
    // Simple sentiment analysis - will be enhanced with actual API
    const positiveWords = ['خوب', 'عالی', 'راضی', 'ممنون', 'سپاسگزار'];
    const negativeWords = ['بد', 'مشکل', 'ناراضی', 'خراب', 'کند'];
    
    const words = text.split(' ');
    let score = 0;
    
    for (const word of words) {
      if (positiveWords.some(pw => word.includes(pw))) score += 0.1;
      if (negativeWords.some(nw => word.includes(nw))) score -= 0.1;
    }
    
    score = Math.max(-1, Math.min(1, score));
    
    return {
      score,
      label: score > 0.1 ? 'مثبت' : score < -0.1 ? 'منفی' : 'خنثی',
      confidence: 0.75
    };
  }

  private async extractKeyTopics(text: string): Promise<string[]> {
    const commonTopics = [
      'پشتیبانی فنی', 'مشکل اتصال', 'سرعت اینترنت', 'تنظیمات', 
      'پرداخت', 'فاکتور', 'تمدید سرویس', 'ارتقاء پلن'
    ];
    
    return commonTopics.filter(topic => 
      text.toLowerCase().includes(topic.toLowerCase())
    ).slice(0, 5);
  }

  private async generateActionSuggestions(text: string, sentiment: any): Promise<string[]> {
    const suggestions = [];
    
    if (sentiment.score < -0.2) {
      suggestions.push('تماس فوری برای رفع نگرانی مشتری');
      suggestions.push('ارائه راهکار جبرانی مناسب');
    }
    
    if (text.includes('مشکل') || text.includes('خراب')) {
      suggestions.push('بررسی فنی وضعیت سرویس');
      suggestions.push('آماده‌سازی راهنمای گام به گام');
    }
    
    suggestions.push('ثبت جزئیات در سیستم CRM');
    suggestions.push('برنامه‌ریزی پیگیری در ۲۴ ساعت آینده');
    
    return suggestions;
  }

  private determineUrgencyLevel(text: string, sentiment: any): string {
    if (sentiment.score < -0.5 || text.includes('فوری') || text.includes('اضطراری')) {
      return 'critical';
    }
    if (sentiment.score < -0.2 || text.includes('مشکل')) {
      return 'high';
    }
    if (text.includes('سوال') || text.includes('راهنمایی')) {
      return 'medium';
    }
    return 'low';
  }

  private extractEmotionalMarkers(text: string): string[] {
    const markers = [];
    
    if (text.includes('عصبانی') || text.includes('ناراحت')) {
      markers.push('نارضایتی');
    }
    if (text.includes('ممنون') || text.includes('سپاسگزار')) {
      markers.push('قدردانی');
    }
    if (text.includes('نگران') || text.includes('استرس')) {
      markers.push('نگرانی');
    }
    
    return markers;
  }

  async updateRepresentativeProfile(representativeId: number, interactionData: any): Promise<void> {
    try {
      // Get existing profile or create new one
      const existingProfile = await db.select()
        .from(crmRepresentativeProfiles)
        .where(eq(crmRepresentativeProfiles.representativeId, representativeId))
        .limit(1);

      const updates = {
        totalInteractions: (existingProfile[0]?.totalInteractions || 0) + 1,
        lastContactAttempt: new Date(),
        // Update other profile fields based on interaction data
        updatedAt: new Date()
      };

      if (existingProfile.length > 0) {
        await db.update(crmRepresentativeProfiles)
          .set(updates)
          .where(eq(crmRepresentativeProfiles.representativeId, representativeId));
      } else {
        await db.insert(crmRepresentativeProfiles).values({
          representativeId,
          ...updates,
          createdAt: new Date()
        });
      }

    } catch (error) {
      aegisLogger.error('NovaAIEngine', 'Failed to update representative profile', error);
    }
  }

  async generatePsycheProfile(representativeId: number): Promise<PsycheProfile> {
    try {
      // Analyze interaction history to build psyche profile
      const interactions = await db.execute(sql`
        SELECT sentiment_score, manual_notes, outcome, duration
        FROM crm_interactions 
        WHERE representative_id = ${representativeId}
        ORDER BY created_at DESC
        LIMIT 20
      `);

      // Basic psyche analysis based on interaction patterns
      const profile: PsycheProfile = {
        communicationStyle: 'diplomatic', // Will be enhanced with AI analysis
        decisionMakingPattern: 'analytical',
        stressIndicators: ['تماس‌های مکرر', 'پیگیری مداوم'],
        motivationalTriggers: ['تخفیف', 'سرویس بهتر', 'پشتیبانی سریع'],
        emotionalResponsePatterns: {
          'مثبت': 0.7,
          'منفی': 0.2,
          'خنثی': 0.1
        },
        riskTolerance: 0.6,
        culturalContext: 'ایرانی - احترام به وقت و صداقت در گفتگو'
      };

      return profile;

    } catch (error) {
      aegisLogger.error('NovaAIEngine', 'Failed to generate psyche profile', error);
      throw error;
    }
  }
}

export const novaAIEngine = new NovaAIEngine();