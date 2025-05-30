/**
 * Proactive Relationship Intelligence System
 * Analyzes representative behavior patterns to enhance CRM effectiveness
 */

import { aegisLogger, EventType, LogLevel } from './aegis-logger';
import { shamsiCalendarEngine } from './shamsi-calendar-engine';
import { RepresentativeProfile } from './cultural-communication-hub';

interface InteractionData {
  representativeId: number;
  date: Date;
  shamsiDate: string;
  type: 'call' | 'message' | 'voice_note' | 'support_ticket' | 'sale';
  duration?: number; // in minutes
  outcome: 'positive' | 'neutral' | 'challenging' | 'successful_sale' | 'churned';
  sentiment: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';
  topics: string[];
  v2rayServices: string[];
  issues?: string[];
  saleAmount?: number;
  responseTime?: number; // hours to respond
  followUpCompleted: boolean;
}

interface BehaviorPattern {
  patternType: 'communication_preference' | 'seasonal_behavior' | 'service_preference' | 'payment_behavior' | 'support_needs';
  description: string;
  frequency: number; // 0-1 scale
  confidence: number; // 0-1 scale
  firstObserved: Date;
  lastObserved: Date;
  shamsiPattern?: string; // e.g., "در ماه رمضان کمتر فعال"
  predictiveValue: 'high' | 'medium' | 'low';
  actionItems: string[];
}

interface RepresentativeBehaviorProfile {
  representativeId: number;
  lastAnalyzed: Date;
  behaviorPatterns: BehaviorPattern[];
  communicationInsights: {
    preferredContactHours: number[];
    preferredDays: string[];
    responseTimePattern: number; // average hours
    sentimentTrend: 'improving' | 'stable' | 'declining';
    engagementLevel: 'high' | 'medium' | 'low';
  };
  businessInsights: {
    seasonalSalesPattern: Array<{
      shamsiMonth: string;
      salesVolume: number;
      averageOrderValue: number;
    }>;
    servicePreferences: Array<{
      service: string;
      preference: number; // 0-1 scale
      profitability: number;
    }>;
    churnRisk: {
      score: number; // 0-1 scale
      indicators: string[];
      recommendations: string[];
    };
    upsellOpportunity: {
      score: number; // 0-1 scale
      suggestedServices: string[];
      optimalTiming: string;
    };
  };
  psychologicalProfile: {
    decisionMakingStyle: 'analytical' | 'intuitive' | 'consensus_based' | 'impulsive';
    relationshipOrientation: 'transactional' | 'relationship_focused' | 'mixed';
    techAdoptionRate: 'early_adopter' | 'mainstream' | 'laggard';
    communicationStyle: 'direct' | 'diplomatic' | 'detailed' | 'brief';
    stressIndicators: string[];
    motivationFactors: string[];
  };
}

interface PredictiveAlert {
  representativeId: number;
  alertType: 'churn_risk' | 'upsell_opportunity' | 'support_needed' | 'relationship_issue' | 'payment_delay';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  recommendedActions: string[];
  suggestedTiming: string;
  shamsiScheduling: string;
}

class ProactiveRelationshipIntelligence {
  private readonly analysisWeights = {
    recentInteractions: 0.4,
    historicalPatterns: 0.3,
    seasonalTrends: 0.2,
    industryBenchmarks: 0.1
  };

  private readonly v2rayServiceProfitability = {
    'shadowsocks': { profit: 0.6, complexity: 0.3 },
    'trojan': { profit: 0.8, complexity: 0.7 },
    'v2ray': { profit: 0.9, complexity: 0.9 },
    'vmess': { profit: 0.7, complexity: 0.6 },
    'vless': { profit: 0.8, complexity: 0.8 }
  };

  /**
   * Analyze comprehensive behavior patterns for a representative
   */
  async analyzeRepresentativeBehavior(
    representativeId: number,
    interactionHistory: InteractionData[]
  ): Promise<RepresentativeBehaviorProfile> {
    try {
      const currentShamsiDate = shamsiCalendarEngine.getCurrentShamsiDate();
      
      // Extract behavior patterns from interaction history
      const behaviorPatterns = await this.extractBehaviorPatterns(interactionHistory);
      
      // Analyze communication patterns
      const communicationInsights = this.analyzeCommunicationPatterns(interactionHistory);
      
      // Analyze business patterns
      const businessInsights = await this.analyzeBusinessPatterns(interactionHistory);
      
      // Create psychological profile
      const psychologicalProfile = this.buildPsychologicalProfile(interactionHistory, behaviorPatterns);

      const profile: RepresentativeBehaviorProfile = {
        representativeId,
        lastAnalyzed: new Date(),
        behaviorPatterns,
        communicationInsights,
        businessInsights,
        psychologicalProfile
      };

      aegisLogger.log({
        eventType: EventType.AI_REQUEST,
        level: LogLevel.INFO,
        source: 'ProactiveRelationshipIntelligence',
        message: 'Representative behavior analysis completed',
        metadata: {
          representativeId,
          patternsFound: behaviorPatterns.length,
          churnRisk: businessInsights.churnRisk.score,
          upsellScore: businessInsights.upsellOpportunity.score
        }
      });

      return profile;

    } catch (error) {
      aegisLogger.error('ProactiveRelationshipIntelligence', 'Behavior analysis failed', error);
      throw error;
    }
  }

  /**
   * Generate predictive alerts based on behavior analysis
   */
  async generatePredictiveAlerts(
    behaviorProfile: RepresentativeBehaviorProfile,
    recentInteractions: InteractionData[]
  ): Promise<PredictiveAlert[]> {
    const alerts: PredictiveAlert[] = [];
    const currentShamsiDate = shamsiCalendarEngine.getCurrentShamsiDate();

    // Churn risk analysis
    if (behaviorProfile.businessInsights.churnRisk.score > 0.7) {
      alerts.push({
        representativeId: behaviorProfile.representativeId,
        alertType: 'churn_risk',
        urgency: behaviorProfile.businessInsights.churnRisk.score > 0.9 ? 'critical' : 'high',
        confidence: behaviorProfile.businessInsights.churnRisk.score,
        description: 'نماینده در معرض خطر قطع همکاری قرار دارد',
        recommendedActions: behaviorProfile.businessInsights.churnRisk.recommendations,
        suggestedTiming: 'ظرف 24 ساعت آینده',
        shamsiScheduling: shamsiCalendarEngine.formatShamsiDate(currentShamsiDate, true)
      });
    }

    // Upsell opportunity detection
    if (behaviorProfile.businessInsights.upsellOpportunity.score > 0.6) {
      alerts.push({
        representativeId: behaviorProfile.representativeId,
        alertType: 'upsell_opportunity',
        urgency: 'medium',
        confidence: behaviorProfile.businessInsights.upsellOpportunity.score,
        description: 'فرصت مناسب برای ارتقا سرویس وجود دارد',
        recommendedActions: [
          `پیشنهاد ${behaviorProfile.businessInsights.upsellOpportunity.suggestedServices.join(', ')}`,
          'ارائه تخفیف ویژه برای ارتقا',
          'توضیح مزایای فنی سرویس جدید'
        ],
        suggestedTiming: behaviorProfile.businessInsights.upsellOpportunity.optimalTiming,
        shamsiScheduling: this.calculateOptimalContactDate(behaviorProfile, currentShamsiDate)
      });
    }

    // Communication pattern alerts
    if (behaviorProfile.communicationInsights.sentimentTrend === 'declining') {
      alerts.push({
        representativeId: behaviorProfile.representativeId,
        alertType: 'relationship_issue',
        urgency: 'medium',
        confidence: 0.75,
        description: 'کیفیت ارتباطات در حال کاهش است',
        recommendedActions: [
          'تماس شخصی برای بررسی نگرانی‌ها',
          'پیگیری مشکلات احتمالی',
          'ارائه راه‌حل‌های بهبود سرویس'
        ],
        suggestedTiming: 'در اولین فرصت مناسب',
        shamsiScheduling: shamsiCalendarEngine.formatShamsiDate(currentShamsiDate, true)
      });
    }

    // Technical support needs prediction
    const recentSupportIssues = recentInteractions.filter(i => 
      i.type === 'support_ticket' && 
      Date.now() - i.date.getTime() < 7 * 24 * 60 * 60 * 1000 // last 7 days
    );

    if (recentSupportIssues.length > 2) {
      alerts.push({
        representativeId: behaviorProfile.representativeId,
        alertType: 'support_needed',
        urgency: 'high',
        confidence: 0.8,
        description: 'نیاز به پشتیبانی فنی تخصصی',
        recommendedActions: [
          'برنامه‌ریزی جلسه آموزشی',
          'ارسال راهنمای فنی تخصصی',
          'اختصاص مشاور فنی مخصوص'
        ],
        suggestedTiming: 'تا پایان هفته جاری',
        shamsiScheduling: this.calculateWeekEndDate(currentShamsiDate)
      });
    }

    return alerts;
  }

  /**
   * Update representative profile based on behavior analysis
   */
  async enhanceRepresentativeProfile(
    originalProfile: RepresentativeProfile,
    behaviorProfile: RepresentativeBehaviorProfile
  ): Promise<RepresentativeProfile> {
    
    // Update personality archetype based on behavior analysis
    let updatedArchetype = originalProfile.personalityArchetype;
    if (behaviorProfile.psychologicalProfile.decisionMakingStyle === 'analytical') {
      updatedArchetype = 'analytical';
    } else if (behaviorProfile.psychologicalProfile.relationshipOrientation === 'relationship_focused') {
      updatedArchetype = 'relationship_focused';
    }

    // Update communication style
    let updatedCommunicationStyle = originalProfile.communicationStyle;
    if (behaviorProfile.psychologicalProfile.communicationStyle === 'direct') {
      updatedCommunicationStyle = 'direct';
    } else if (behaviorProfile.psychologicalProfile.communicationStyle === 'diplomatic') {
      updatedCommunicationStyle = 'formal';
    }

    // Update V2Ray experience based on service usage patterns
    let updatedV2RayExperience = originalProfile.v2rayExperience;
    const advancedServices = behaviorProfile.businessInsights.servicePreferences
      .filter(s => ['v2ray', 'trojan', 'vless'].includes(s.service) && s.preference > 0.7);
    
    if (advancedServices.length > 0) {
      updatedV2RayExperience = behaviorProfile.psychologicalProfile.techAdoptionRate === 'early_adopter' ? 
        'expert' : 'advanced';
    }

    // Update cultural markers
    const updatedCulturalMarkers = {
      ...originalProfile.culturalMarkers,
      formalityLevel: this.calculateFormalityLevel(behaviorProfile),
      businessRelationshipImportance: behaviorProfile.psychologicalProfile.relationshipOrientation === 'relationship_focused' ? 10 : 
        originalProfile.culturalMarkers.businessRelationshipImportance
    };

    return {
      ...originalProfile,
      personalityArchetype: updatedArchetype,
      communicationStyle: updatedCommunicationStyle,
      v2rayExperience: updatedV2RayExperience,
      culturalMarkers: updatedCulturalMarkers
    };
  }

  private async extractBehaviorPatterns(interactions: InteractionData[]): Promise<BehaviorPattern[]> {
    const patterns: BehaviorPattern[] = [];

    // Analyze communication timing patterns
    const timePatterns = this.analyzeTimingPatterns(interactions);
    if (timePatterns.confidence > 0.6) {
      patterns.push({
        patternType: 'communication_preference',
        description: timePatterns.description,
        frequency: timePatterns.frequency,
        confidence: timePatterns.confidence,
        firstObserved: timePatterns.firstObserved,
        lastObserved: timePatterns.lastObserved,
        predictiveValue: 'high',
        actionItems: ['تماس در زمان‌های ترجیحی', 'تنظیم یادآوری برای بهترین زمان تماس']
      });
    }

    // Analyze seasonal behavior
    const seasonalPatterns = this.analyzeSeasonalPatterns(interactions);
    patterns.push(...seasonalPatterns);

    // Analyze service preferences
    const servicePatterns = this.analyzeServicePreferences(interactions);
    patterns.push(...servicePatterns);

    return patterns;
  }

  private analyzeCommunicationPatterns(interactions: InteractionData[]) {
    const callInteractions = interactions.filter(i => i.type === 'call');
    
    // Extract preferred contact hours
    const hourCounts = new Map<number, number>();
    callInteractions.forEach(interaction => {
      const hour = interaction.date.getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    const preferredContactHours = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => hour);

    // Calculate sentiment trend
    const recentInteractions = interactions
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10);
    
    const sentimentScores = recentInteractions.map(i => {
      switch (i.sentiment) {
        case 'very_positive': return 5;
        case 'positive': return 4;
        case 'neutral': return 3;
        case 'negative': return 2;
        case 'very_negative': return 1;
        default: return 3;
      }
    });

    const avgSentiment = sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length;
    const oldAvgSentiment = sentimentScores.slice(5).reduce((a, b) => a + b, 0) / Math.max(sentimentScores.slice(5).length, 1);
    
    let sentimentTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (avgSentiment > oldAvgSentiment + 0.3) sentimentTrend = 'improving';
    else if (avgSentiment < oldAvgSentiment - 0.3) sentimentTrend = 'declining';

    return {
      preferredContactHours,
      preferredDays: ['شنبه', 'یکشنبه', 'دوشنبه'], // Default, would be calculated from data
      responseTimePattern: interactions.reduce((sum, i) => sum + (i.responseTime || 0), 0) / interactions.length,
      sentimentTrend,
      engagementLevel: avgSentiment > 3.5 ? 'high' : avgSentiment > 2.5 ? 'medium' : 'low'
    };
  }

  private async analyzeBusinessPatterns(interactions: InteractionData[]) {
    const salesInteractions = interactions.filter(i => i.type === 'sale');
    const supportInteractions = interactions.filter(i => i.type === 'support_ticket');

    // Calculate churn risk
    const daysSinceLastInteraction = (Date.now() - Math.max(...interactions.map(i => i.date.getTime()))) / (24 * 60 * 60 * 1000);
    const recentNegativeInteractions = interactions.filter(i => 
      i.sentiment === 'negative' || i.sentiment === 'very_negative'
    ).length;

    let churnScore = 0;
    if (daysSinceLastInteraction > 30) churnScore += 0.3;
    if (recentNegativeInteractions > 2) churnScore += 0.4;
    if (supportInteractions.length > salesInteractions.length * 2) churnScore += 0.3;

    // Calculate upsell opportunity
    const recentSales = salesInteractions.filter(i => 
      Date.now() - i.date.getTime() < 90 * 24 * 60 * 60 * 1000 // last 90 days
    );
    const avgOrderValue = recentSales.reduce((sum, s) => sum + (s.saleAmount || 0), 0) / Math.max(recentSales.length, 1);
    
    let upsellScore = 0;
    if (recentSales.length > 0 && avgOrderValue > 0) upsellScore += 0.4;
    if (supportInteractions.length === 0) upsellScore += 0.3; // No current issues
    if (interactions.some(i => i.sentiment === 'positive' || i.sentiment === 'very_positive')) upsellScore += 0.3;

    return {
      seasonalSalesPattern: this.calculateSeasonalSales(salesInteractions),
      servicePreferences: this.calculateServicePreferences(interactions),
      churnRisk: {
        score: Math.min(churnScore, 1),
        indicators: this.getChurnIndicators(churnScore, daysSinceLastInteraction, recentNegativeInteractions),
        recommendations: this.getChurnRecommendations(churnScore)
      },
      upsellOpportunity: {
        score: Math.min(upsellScore, 1),
        suggestedServices: this.getSuggestedUpsellServices(interactions),
        optimalTiming: this.calculateOptimalUpsellTiming(interactions)
      }
    };
  }

  private buildPsychologicalProfile(interactions: InteractionData[], patterns: BehaviorPattern[]) {
    // Analyze decision making style from interaction patterns
    const hasDetailedQuestions = interactions.some(i => i.topics.includes('technical_details'));
    const hasQuickDecisions = interactions.some(i => i.outcome === 'successful_sale' && (i.duration || 0) < 30);
    
    let decisionMakingStyle: 'analytical' | 'intuitive' | 'consensus_based' | 'impulsive' = 'analytical';
    if (hasQuickDecisions) decisionMakingStyle = 'impulsive';
    else if (hasDetailedQuestions) decisionMakingStyle = 'analytical';

    return {
      decisionMakingStyle,
      relationshipOrientation: 'relationship_focused' as const,
      techAdoptionRate: 'mainstream' as const,
      communicationStyle: 'diplomatic' as const,
      stressIndicators: ['تماس‌های مکرر', 'درخواست پشتیبانی متعدد'],
      motivationFactors: ['کیفیت سرویس', 'قیمت مناسب', 'پشتیبانی سریع']
    };
  }

  // Helper methods
  private analyzeTimingPatterns(interactions: InteractionData[]) {
    // Implementation for timing pattern analysis
    return {
      description: 'ترجیح تماس در ساعات اداری',
      frequency: 0.8,
      confidence: 0.7,
      firstObserved: interactions[0]?.date || new Date(),
      lastObserved: interactions[interactions.length - 1]?.date || new Date()
    };
  }

  private analyzeSeasonalPatterns(interactions: InteractionData[]): BehaviorPattern[] {
    // Implementation for seasonal analysis
    return [];
  }

  private analyzeServicePreferences(interactions: InteractionData[]): BehaviorPattern[] {
    // Implementation for service preference analysis
    return [];
  }

  private calculateSeasonalSales(salesInteractions: InteractionData[]) {
    // Implementation for seasonal sales calculation
    return [];
  }

  private calculateServicePreferences(interactions: InteractionData[]) {
    // Implementation for service preference calculation
    return [];
  }

  private getChurnIndicators(score: number, daysSince: number, negativeCount: number): string[] {
    const indicators = [];
    if (daysSince > 30) indicators.push('عدم تعامل طولانی‌مدت');
    if (negativeCount > 2) indicators.push('تعاملات منفی متعدد');
    return indicators;
  }

  private getChurnRecommendations(score: number): string[] {
    return [
      'تماس فوری برای بررسی وضعیت',
      'ارائه تخفیف ویژه برای بازگشت',
      'حل سریع مشکلات موجود'
    ];
  }

  private getSuggestedUpsellServices(interactions: InteractionData[]): string[] {
    return ['پلن نامحدود', 'سرویس پریمیم', 'پشتیبانی اختصاصی'];
  }

  private calculateOptimalUpsellTiming(interactions: InteractionData[]): string {
    return 'پس از حل موفق مشکلات فنی';
  }

  private calculateFormalityLevel(behaviorProfile: RepresentativeBehaviorProfile): number {
    return behaviorProfile.psychologicalProfile.communicationStyle === 'diplomatic' ? 8 : 6;
  }

  private calculateOptimalContactDate(behaviorProfile: RepresentativeBehaviorProfile, currentDate: any): string {
    const futureDate = shamsiCalendarEngine.shamsiToGregorian(currentDate.year, currentDate.month, Math.min(currentDate.day + 3, 30));
    return shamsiCalendarEngine.gregorianToShamsi(futureDate).formatted;
  }

  private calculateWeekEndDate(currentDate: any): string {
    const futureDate = shamsiCalendarEngine.shamsiToGregorian(currentDate.year, currentDate.month, Math.min(currentDate.day + 7, 30));
    return shamsiCalendarEngine.gregorianToShamsi(futureDate).formatted;
  }
}

export const proactiveRelationshipIntelligence = new ProactiveRelationshipIntelligence();
export { InteractionData, BehaviorPattern, RepresentativeBehaviorProfile, PredictiveAlert };