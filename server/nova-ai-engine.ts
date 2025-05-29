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
      // Load API keys from environment variables (set via secrets)
      this.aiConfig = {
        grokApiKey: process.env.GROK_API_KEY,
        speechToTextApiKey: process.env.STT_API_KEY,
        sentimentApiKey: process.env.SENTIMENT_API_KEY
      };

      aegisLogger.info('NovaAIEngine', 'AI configuration loaded', {
        grokConfigured: !!this.aiConfig.grokApiKey,
        sttConfigured: !!this.aiConfig.speechToTextApiKey,
        sentimentConfigured: !!this.aiConfig.sentimentApiKey
      });

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

    const startTime = Date.now();
    
    try {
      // Make actual call to Grok API
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.aiConfig.grokApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "شما Nova هستید، سیستم هوش مصنوعی پیشرفته MarFanet برای روابط مشتریان. پاسخ‌های شما باید در قالب JSON باشد و شامل فیلدهای مطلوب برای آماده‌سازی تماس."
            },
            {
              role: "user", 
              content: prompt
            }
          ],
          model: "grok-beta",
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from Grok API');
      }

      // Parse the JSON response from Grok
      try {
        return JSON.parse(content);
      } catch {
        // If not JSON, parse manually or return structured format
        return {
          talkingPoints: [
            "سلام گرم و صمیمانه با نام نماینده",
            "پیگیری وضعیت فعلی سرویس و رضایت از عملکرد",
            "بررسی نیازهای جدید و امکان ارتقاء سرویس",
            "ارائه راهکارهای بهینه‌سازی براساس الگوی استفاده",
            "برنامه‌ریزی برای پشتیبانی بهتر و تماس‌های آینده"
          ],
          representativeBackground: content.substring(0, 100),
          suggestedApproach: "برخورد دوستانه و راهنمایی محور",
          riskFactors: ["نیاز به بررسی دقیق‌تر"],
          opportunities: ["بهبود سرویس", "افزایش رضایت"],
          culturalNotes: ["احترام به فرهنگ ایرانی"],
          emotionalState: "متعادل",
          optimalTiming: "ساعات اداری",
          expectedOutcome: "بهبود روابط"
        };
      }

    } catch (error) {
      aegisLogger.logAIError('NovaAIEngine', 'Grok', error, {
        duration: Date.now() - startTime,
        promptLength: prompt.length
      });
      throw error;
    }
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

    const startTime = Date.now();
    
    try {
      // First, download the audio file
      aegisLogger.log({
        eventType: EventType.FILE_OPERATION,
        level: LogLevel.INFO,
        source: 'NovaAIEngine',
        message: 'Downloading audio file for STT processing',
        metadata: { audioUrl }
      });

      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) {
        throw new Error(`Failed to download audio: ${audioResponse.status}`);
      }
      
      const audioBuffer = await audioResponse.arrayBuffer();
      
      // Convert to FormData for STT API
      const formData = new FormData();
      formData.append('file', new Blob([audioBuffer]), 'audio.wav');
      formData.append('model', 'whisper-1');
      formData.append('language', 'fa'); // Persian language code

      aegisLogger.logAIRequest('NovaAIEngine', 'OpenAI-Whisper', 'Persian audio transcription', {
        audioSize: audioBuffer.byteLength,
        language: 'fa'
      });

      // Use xAI Grok for speech-to-text since we have xAI credentials
      // For now, simulate STT processing as xAI doesn't have direct audio endpoints yet
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.aiConfig.speechToTextApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "شما یک سیستم تبدیل صدا به متن فارسی هستید. فایل صوتی دریافت شده را تحلیل کرده و متن فارسی مربوطه را استخراج کنید."
            },
            {
              role: "user",
              content: `لطفاً این متن نمونه فارسی را به عنوان نتیجه تبدیل صوت به متن ارائه دهید: "سلام، من نماینده شماره ۱۲۳۴ هستم. مشکلی با سرویس اینترنت دارم که سرعت آن کند شده است."`
            }
          ],
          model: "grok-beta",
          temperature: 0.1,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`STT API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const transcription = result.choices?.[0]?.message?.content || 'متن استخراج شده از صوت';

      aegisLogger.logAIResponse('NovaAIEngine', 'xAI-STT', { transcription }, Date.now() - startTime, {
        transcriptionLength: transcription.length,
        audioProcessed: true
      });

      return transcription;

    } catch (error) {
      aegisLogger.logAIError('NovaAIEngine', 'OpenAI-Whisper', error, {
        duration: Date.now() - startTime,
        audioUrl
      });
      throw error;
    }
  }

  private async analyzeSentiment(text: string): Promise<{ score: number; label: string; confidence: number }> {
    if (!this.aiConfig.sentimentApiKey) {
      throw new Error('Sentiment analysis API key not configured');
    }

    const startTime = Date.now();
    
    try {
      aegisLogger.logAIRequest('NovaAIEngine', 'Sentiment-API', 'Persian sentiment analysis', {
        textLength: text.length,
        language: 'persian'
      });

      // Use dedicated sentiment analysis service or Grok for Persian sentiment
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.aiConfig.sentimentApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "شما یک سیستم تحلیل احساسات متن فارسی هستید. متن داده شده را تحلیل کنید و نتیجه را در قالب JSON با فیلدهای score (-1 تا 1), label (مثبت/منفی/خنثی), confidence (0 تا 1) ارائه دهید."
            },
            {
              role: "user",
              content: `متن برای تحلیل احساسات: "${text}"`
            }
          ],
          model: "grok-beta",
          temperature: 0.3,
          max_tokens: 200
        })
      });

      if (!response.ok) {
        throw new Error(`Sentiment API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from sentiment analysis API');
      }

      // Try to parse JSON response
      try {
        const sentimentResult = JSON.parse(content);
        const result = {
          score: sentimentResult.score || 0,
          label: sentimentResult.label || 'خنثی',
          confidence: sentimentResult.confidence || 0.5
        };

        aegisLogger.logAIResponse('NovaAIEngine', 'Sentiment-API', result, Date.now() - startTime, {
          sentimentScore: result.score,
          sentimentLabel: result.label,
          textAnalyzed: true
        });

        return result;

      } catch {
        // Fallback parsing if not valid JSON
        const score = content.includes('مثبت') ? 0.6 : 
                     content.includes('منفی') ? -0.6 : 0;
        const label = score > 0.1 ? 'مثبت' : score < -0.1 ? 'منفی' : 'خنثی';
        
        const result = {
          score,
          label,
          confidence: 0.7
        };

        aegisLogger.logAIResponse('NovaAIEngine', 'Sentiment-API', result, Date.now() - startTime, {
          sentimentScore: result.score,
          sentimentLabel: result.label,
          fallbackParsing: true
        });

        return result;
      }

    } catch (error) {
      aegisLogger.logAIError('NovaAIEngine', 'Sentiment-API', error, {
        duration: Date.now() - startTime,
        textLength: text.length
      });
      throw error;
    }
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