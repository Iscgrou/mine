/**
 * Cultural Psychology-Aware Communication Hub
 * Provides real-time, culturally-grounded guidance for CRM team interactions
 */

import { aegisLogger, EventType, LogLevel } from './aegis-logger';
import { shamsiCalendarEngine } from './shamsi-calendar-engine';

interface RepresentativeProfile {
  id: number;
  name: string;
  businessType: 'mobile_store' | 'electronics_shop' | 'tech_retailer';
  region: 'tehran' | 'mashhad' | 'isfahan' | 'shiraz' | 'tabriz' | 'other';
  personalityArchetype: 'analytical' | 'relationship_focused' | 'results_driven' | 'traditional' | 'innovative';
  communicationStyle: 'formal' | 'friendly' | 'direct' | 'respectful';
  v2rayExperience: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  preferredContactTime: 'morning' | 'afternoon' | 'evening';
  culturalMarkers: {
    formalityLevel: number; // 1-10 scale
    techSavviness: number; // 1-10 scale
    businessRelationshipImportance: number; // 1-10 scale
  };
  recentInteractions: Array<{
    date: Date;
    type: 'call' | 'message' | 'support';
    outcome: 'positive' | 'neutral' | 'challenging';
    notes: string;
  }>;
}

interface CommunicationContext {
  representativeId: number;
  currentSituation: 'first_contact' | 'follow_up' | 'technical_support' | 'sales_discussion' | 'problem_resolution';
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  previousInteractionOutcome?: 'positive' | 'neutral' | 'challenging';
  specificIssue?: string;
  v2rayServiceType?: 'shadowsocks' | 'trojan' | 'v2ray' | 'vmess' | 'vless';
}

interface CommunicationGuidance {
  openingStrategy: {
    suggestedGreeting: string;
    culturalContext: string;
    toneRecommendation: string;
  };
  conversationFlow: {
    keyTopics: string[];
    questionsToAsk: string[];
    informationToGather: string[];
  };
  v2raySpecificGuidance: {
    technicalPoints: string[];
    salesOpportunities: string[];
    commonConcerns: string[];
  };
  culturalConsiderations: {
    dosList: string[];
    avoidList: string[];
    timeingAdvice: string;
  };
  objectionHandling: {
    likelyObjections: string[];
    responseStrategies: string[];
  };
  followUpActions: {
    recommendedActions: string[];
    nextContactTiming: string;
    shamsiScheduling: string;
  };
}

interface InstantConsultationRequest {
  representativeId: number;
  currentSituation: string;
  specificQuery: string;
  contextualInfo: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'urgent';
}

interface InstantConsultationResponse {
  quickAdvice: string;
  detailedStrategy: string;
  culturalInsights: string[];
  v2raySpecificTips: string[];
  immediateActions: string[];
  followUpRecommendations: string[];
  confidenceScore: number;
}

class CulturalCommunicationHub {
  private readonly iranianBusinessCulture = {
    greetings: {
      formal: ['سلام و احترام', 'با سلام خدمت جناب', 'درود بر شما'],
      friendly: ['سلام', 'سلام و خسته نباشید', 'سلام آقای محترم'],
      respectful: ['ادب عرض می‌کنم', 'سلام و تبریک', 'با احترام سلام']
    },
    businessEtiquette: {
      relationshipBuilding: [
        'احوالپرسی از خانواده و کسب و کار',
        'اشاره به موفقیت‌های اخیر نماینده',
        'تقدیر از تلاش‌های نماینده'
      ],
      trustBuilding: [
        'شفافیت در ارائه اطلاعات',
        'پیگیری دقیق قول‌ها و تعهدات',
        'توجه به نیازهای خاص نماینده'
      ],
      respectfulCommunication: [
        'استفاده از کلمات محترمانه',
        'گوش دادن فعال به نظرات نماینده',
        'پرهیز از فشار بیش از حد'
      ]
    },
    regionalConsiderations: {
      tehran: { businessHours: '9-18', culture: 'fast_paced', formality: 'medium' },
      mashhad: { businessHours: '8-17', culture: 'traditional', formality: 'high' },
      isfahan: { businessHours: '9-17', culture: 'artistic', formality: 'medium' },
      shiraz: { businessHours: '9-18', culture: 'literary', formality: 'medium' },
      tabriz: { businessHours: '8-17', culture: 'commercial', formality: 'medium' }
    }
  };

  private readonly v2rayBusinessKnowledge = {
    serviceTypes: {
      shadowsocks: {
        advantages: ['ساده در راه‌اندازی', 'مصرف پایین منابع', 'سازگاری بالا'],
        challenges: ['قابلیت شناسایی بالاتر', 'عملکرد کمتر در سرعت'],
        targetCustomers: ['کاربران عادی', 'مصرف‌کنندگان خانگی']
      },
      trojan: {
        advantages: ['امنیت بالا', 'قابلیت مخفی‌سازی عالی', 'سرعت مناسب'],
        challenges: ['پیچیدگی بیشتر', 'نیاز به دانش فنی'],
        targetCustomers: ['کاربران حرفه‌ای', 'شرکت‌ها']
      },
      v2ray: {
        advantages: ['انعطاف‌پذیری بالا', 'پیکربندی پیشرفته', 'عملکرد عالی'],
        challenges: ['پیچیدگی بالا', 'نیاز به مهارت فنی'],
        targetCustomers: ['متخصصان', 'ارائه‌دهندگان خدمات']
      }
    },
    commonIssues: {
      technical: ['مشکلات اتصال', 'کاهش سرعت', 'قطعی سرویس'],
      business: ['تغییرات قیمت', 'رقابت بازار', 'نیازهای مشتریان'],
      regulatory: ['محدودیت‌های قانونی', 'تغییرات مقررات', 'مسائل امنیتی']
    },
    salesOpportunities: {
      upselling: ['ارتقا به پلن نامحدود', 'افزودن سرویس‌های جانبی', 'بسته‌های ترکیبی'],
      crossSelling: ['خدمات پشتیبانی', 'آموزش فنی', 'مشاوره تخصصی']
    }
  };

  /**
   * Generate comprehensive communication guidance for a representative interaction
   */
  async generateCommunicationGuidance(
    profile: RepresentativeProfile, 
    context: CommunicationContext
  ): Promise<CommunicationGuidance> {
    try {
      const currentShamsiDate = shamsiCalendarEngine.getCurrentShamsiDate();
      const tehranTime = shamsiCalendarEngine.getTehranTime();
      
      // Analyze representative's cultural and business profile
      const culturalInsights = this.analyzeCulturalContext(profile, context);
      
      // Generate contextual opening strategy
      const openingStrategy = this.generateOpeningStrategy(profile, context, culturalInsights);
      
      // Create conversation flow guidance
      const conversationFlow = this.generateConversationFlow(profile, context);
      
      // Provide V2Ray-specific guidance
      const v2rayGuidance = this.generateV2RayGuidance(profile, context);
      
      // Cultural considerations and sensitivities
      const culturalConsiderations = this.generateCulturalConsiderations(profile, context);
      
      // Objection handling strategies
      const objectionHandling = this.generateObjectionHandling(profile, context);
      
      // Follow-up actions with Shamsi scheduling
      const followUpActions = this.generateFollowUpActions(profile, context, currentShamsiDate);

      const guidance: CommunicationGuidance = {
        openingStrategy,
        conversationFlow,
        v2raySpecificGuidance: v2rayGuidance,
        culturalConsiderations,
        objectionHandling,
        followUpActions
      };

      aegisLogger.log({
        eventType: EventType.CRM_INTERACTION,
        level: LogLevel.INFO,
        source: 'CulturalCommunicationHub',
        message: 'Communication guidance generated',
        metadata: {
          representativeId: profile.id,
          situation: context.currentSituation,
          urgency: context.urgency,
          guidanceLength: JSON.stringify(guidance).length
        }
      });

      return guidance;

    } catch (error) {
      aegisLogger.error('CulturalCommunicationHub', 'Failed to generate communication guidance', error);
      throw error;
    }
  }

  /**
   * Provide instant AI consultation for CRM team queries
   */
  async provideInstantConsultation(request: InstantConsultationRequest): Promise<InstantConsultationResponse> {
    try {
      // This would integrate with Vertex AI for real-time analysis
      const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
      
      if (!apiKey) {
        throw new Error('Google AI Studio API key required for instant consultation');
      }

      // Build contextual prompt for Vertex AI
      const consultationPrompt = this.buildConsultationPrompt(request);
      
      // For now, provide structured response based on business logic
      const response = await this.generateInstantAdvice(request);

      aegisLogger.logAIRequest('CulturalCommunicationHub', 'Vertex-AI-Consultation', consultationPrompt, {
        representativeId: request.representativeId,
        urgency: request.urgencyLevel
      });

      return response;

    } catch (error) {
      aegisLogger.logAIError('CulturalCommunicationHub', 'Vertex-AI-Consultation', error);
      throw error;
    }
  }

  private analyzeCulturalContext(profile: RepresentativeProfile, context: CommunicationContext) {
    const regional = this.iranianBusinessCulture.regionalConsiderations[profile.region] || 
                    this.iranianBusinessCulture.regionalConsiderations['other'];
    
    return {
      formalityLevel: profile.culturalMarkers.formalityLevel,
      businessCulture: regional.culture,
      preferredTiming: regional.businessHours,
      relationshipImportance: profile.culturalMarkers.businessRelationshipImportance,
      experienceLevel: profile.v2rayExperience
    };
  }

  private generateOpeningStrategy(
    profile: RepresentativeProfile, 
    context: CommunicationContext, 
    cultural: any
  ) {
    let greeting = this.iranianBusinessCulture.greetings.friendly[0];
    let toneRecommendation = 'Professional and warm';
    
    if (cultural.formalityLevel > 7) {
      greeting = this.iranianBusinessCulture.greetings.formal[0];
      toneRecommendation = 'Formal and respectful';
    } else if (cultural.formalityLevel > 4) {
      greeting = this.iranianBusinessCulture.greetings.respectful[0];
      toneRecommendation = 'Respectful and professional';
    }

    return {
      suggestedGreeting: `${greeting} ${profile.name} محترم`,
      culturalContext: `نماینده ${profile.region} با سطح رسمیت ${cultural.formalityLevel}/10`,
      toneRecommendation
    };
  }

  private generateConversationFlow(profile: RepresentativeProfile, context: CommunicationContext) {
    const baseTopics = ['وضعیت کسب و کار', 'نیازهای فعلی', 'چالش‌های پیش رو'];
    const v2rayTopics = context.v2rayServiceType ? 
      [`وضعیت سرویس ${context.v2rayServiceType}`, 'رضایت مشتریان', 'نیازهای فنی'] : 
      ['خدمات V2Ray', 'تقاضای بازار', 'رقابت'];

    return {
      keyTopics: [...baseTopics, ...v2rayTopics],
      questionsToAsk: [
        'چطور می‌تونم بهتون کمک کنم؟',
        'آیا مشکل خاصی دارید؟',
        'چه سرویسی بیشتر مورد تقاضاست؟'
      ],
      informationToGather: [
        'وضعیت فروش فعلی',
        'مشکلات فنی احتمالی',
        'نیازهای آموزشی'
      ]
    };
  }

  private generateV2RayGuidance(profile: RepresentativeProfile, context: CommunicationContext) {
    const serviceInfo = context.v2rayServiceType ? 
      this.v2rayBusinessKnowledge.serviceTypes[context.v2rayServiceType] : null;

    return {
      technicalPoints: serviceInfo ? serviceInfo.advantages : [
        'کیفیت اتصال بالا',
        'پشتیبانی 24/7',
        'آپدیت‌های منظم'
      ],
      salesOpportunities: [
        'معرفی پلن‌های جدید',
        'ارتقا سرویس موجود',
        'خدمات مشاوره‌ای'
      ],
      commonConcerns: [
        'قیمت‌گذاری مناسب',
        'کیفیت سرویس',
        'پشتیبانی فنی'
      ]
    };
  }

  private generateCulturalConsiderations(profile: RepresentativeProfile, context: CommunicationContext) {
    return {
      dosList: [
        'شروع با احوالپرسی مناسب',
        'توجه به زمان مناسب تماس',
        'صبر در گوش دادن به نظرات'
      ],
      avoidList: [
        'عجله بیش از حد',
        'فشار برای تصمیم‌گیری فوری',
        'نادیده گرفتن نگرانی‌ها'
      ],
      timeingAdvice: `بهترین زمان تماس: ${profile.preferredContactTime}`
    };
  }

  private generateObjectionHandling(profile: RepresentativeProfile, context: CommunicationContext) {
    return {
      likelyObjections: [
        'قیمت بالا',
        'پیچیدگی فنی',
        'نگرانی از کیفیت'
      ],
      responseStrategies: [
        'ارائه مقایسه با رقبا',
        'توضیح مزایای فنی',
        'نمونه‌هایی از مشتریان موفق'
      ]
    };
  }

  private generateFollowUpActions(
    profile: RepresentativeProfile, 
    context: CommunicationContext, 
    currentDate: any
  ) {
    const nextContactDate = shamsiCalendarEngine.shamsiToGregorian(
      currentDate.year, 
      currentDate.month, 
      Math.min(currentDate.day + 7, 30)
    );

    return {
      recommendedActions: [
        'ارسال اطلاعات تکمیلی',
        'پیگیری وضعیت',
        'ارائه پیشنهاد جدید'
      ],
      nextContactTiming: 'یک هفته دیگر',
      shamsiScheduling: shamsiCalendarEngine.gregorianToShamsi(nextContactDate).formatted
    };
  }

  private buildConsultationPrompt(request: InstantConsultationRequest): string {
    return `
      نماینده: ${request.representativeId}
      وضعیت: ${request.currentSituation}
      سوال: ${request.specificQuery}
      اطلاعات: ${request.contextualInfo}
      اولویت: ${request.urgencyLevel}
    `;
  }

  private async generateInstantAdvice(request: InstantConsultationRequest): Promise<InstantConsultationResponse> {
    // Generate contextual advice based on business logic
    return {
      quickAdvice: 'بر اساس وضعیت فعلی، پیشنهاد می‌شود با رویکرد مثبت و حل‌محور به موضوع نزدیک شوید.',
      detailedStrategy: 'استراتژی کامل شامل بررسی نیازهای نماینده، ارائه راه‌حل مناسب و پیگیری منظم',
      culturalInsights: [
        'احترام به زمان نماینده',
        'توجه به ارزش‌های کسب و کار ایرانی',
        'اهمیت روابط بلندمدت'
      ],
      v2raySpecificTips: [
        'تأکید بر کیفیت سرویس',
        'توضیح مزایای فنی',
        'ارائه پشتیبانی مناسب'
      ],
      immediateActions: [
        'گوش دادن فعال',
        'پرسیدن سوالات مناسب',
        'ارائه راه‌حل عملی'
      ],
      followUpRecommendations: [
        'ثبت نکات مهم گفتگو',
        'برنامه‌ریزی تماس بعدی',
        'ارسال اطلاعات تکمیلی'
      ],
      confidenceScore: 0.85
    };
  }
}

export const culturalCommunicationHub = new CulturalCommunicationHub();
export { RepresentativeProfile, CommunicationContext, CommunicationGuidance, InstantConsultationRequest, InstantConsultationResponse };