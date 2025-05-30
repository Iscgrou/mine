/**
 * Vertex AI Customer Intelligence Engine
 * Advanced customer behavior prediction and churn analysis for MarFanet V2Ray platform
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

interface CustomerAnalysisData {
  customerId: number;
  interactionHistory: Array<{
    date: Date;
    type: 'call' | 'message' | 'payment' | 'support' | 'complaint';
    sentiment: 'positive' | 'neutral' | 'negative';
    content?: string;
    resolved?: boolean;
  }>;
  subscriptionHistory: Array<{
    date: Date;
    serviceType: 'unlimited' | 'limited';
    amount: number;
    duration: number;
    status: 'active' | 'expired' | 'cancelled';
  }>;
  financialMetrics: {
    totalRevenue: number;
    averageMonthlyValue: number;
    paymentReliability: number; // 0-1 score
    lastPaymentDate: Date;
  };
  demographicData: {
    region?: string;
    representativeId: number;
    accountAge: number; // in days
    preferredContactTime?: string;
  };
}

interface CustomerPrediction {
  customerId: number;
  churnRisk: {
    probability: number; // 0-1
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    keyFactors: string[];
    timeline: 'immediate' | '1-week' | '1-month' | '3-months';
  };
  recommendations: {
    actions: Array<{
      priority: 'high' | 'medium' | 'low';
      action: string;
      expectedImpact: string;
      timeframe: string;
    }>;
    nextBestOffer: {
      serviceType: 'unlimited' | 'limited';
      discount?: number;
      reasoning: string;
    };
  };
  lifetimeValuePrediction: {
    next30Days: number;
    next90Days: number;
    next12Months: number;
    confidence: number; // 0-1
  };
  engagementStrategy: {
    preferredChannel: 'call' | 'message' | 'telegram';
    optimalContactTime: string;
    communicationTone: 'formal' | 'friendly' | 'technical';
    keyTopics: string[];
  };
}

class VertexAICustomerIntelligence {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    if (!process.env.GOOGLE_AI_STUDIO_API_KEY) {
      throw new Error('GOOGLE_AI_STUDIO_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_STUDIO_API_KEY);
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.1,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    });
  }

  /**
   * Analyze customer behavior and predict churn risk
   */
  async analyzeCustomerBehavior(customerData: CustomerAnalysisData): Promise<CustomerPrediction> {
    const prompt = this.buildCustomerAnalysisPrompt(customerData);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const analysisText = response.text();
      
      return this.parseAnalysisResponse(analysisText, customerData.customerId);
    } catch (error) {
      console.error('[VERTEX AI] Customer analysis error:', error);
      throw new Error('Failed to analyze customer behavior');
    }
  }

  /**
   * Batch analyze multiple customers for proactive management
   */
  async batchAnalyzeCustomers(customersData: CustomerAnalysisData[]): Promise<CustomerPrediction[]> {
    const batchPromises = customersData.map(customerData => 
      this.analyzeCustomerBehavior(customerData)
    );
    
    try {
      return await Promise.all(batchPromises);
    } catch (error) {
      console.error('[VERTEX AI] Batch analysis error:', error);
      throw new Error('Failed to perform batch customer analysis');
    }
  }

  /**
   * Generate intervention strategies for high-risk customers
   */
  async generateInterventionStrategy(prediction: CustomerPrediction): Promise<{
    urgency: 'immediate' | 'high' | 'medium' | 'low';
    interventions: Array<{
      type: 'call' | 'offer' | 'support' | 'upgrade';
      message: string;
      timing: string;
      expectedOutcome: string;
    }>;
    escalationPath: string[];
  }> {
    const interventionPrompt = `
    بررسی وضعیت مشتری با ریسک بالای ترک سرویس:
    
    ریسک ترک: ${prediction.churnRisk.probability * 100}%
    سطح ریسک: ${prediction.churnRisk.riskLevel}
    فاکتورهای کلیدی: ${prediction.churnRisk.keyFactors.join(', ')}
    
    لطفاً یک استراتژی مداخله جامع برای حفظ این مشتری ارائه دهید که شامل:
    1. اقدامات فوری مورد نیاز
    2. پیشنهادات خاص برای سرویس‌های V2Ray
    3. زمان‌بندی تماس‌ها و پیگیری‌ها
    4. پیام‌های متناسب با فرهنگ ایرانی
    5. مسیر تصعید در صورت عدم موفقیت
    
    پاسخ را به صورت JSON با ساختار مناسب ارائه دهید.
    `;

    try {
      const result = await this.model.generateContent(interventionPrompt);
      const response = await result.response;
      const strategyText = response.text();
      
      return this.parseInterventionResponse(strategyText);
    } catch (error) {
      console.error('[VERTEX AI] Intervention strategy error:', error);
      throw new Error('Failed to generate intervention strategy');
    }
  }

  private buildCustomerAnalysisPrompt(customerData: CustomerAnalysisData): string {
    return `
    تحلیل هوش مصنوعی رفتار مشتری برای پلتفرم V2Ray MarFanet:
    
    شناسه مشتری: ${customerData.customerId}
    
    تاریخچه تعاملات:
    ${customerData.interactionHistory.map(interaction => 
      `- ${interaction.date.toLocaleDateString('fa-IR')}: ${interaction.type} (احساسات: ${interaction.sentiment})`
    ).join('\n')}
    
    تاریخچه اشتراک:
    ${customerData.subscriptionHistory.map(sub => 
      `- ${sub.date.toLocaleDateString('fa-IR')}: ${sub.serviceType} - ${sub.amount} تومان (${sub.status})`
    ).join('\n')}
    
    متریک‌های مالی:
    - درآمد کل: ${customerData.financialMetrics.totalRevenue} تومان
    - میانگین ماهانه: ${customerData.financialMetrics.averageMonthlyValue} تومان
    - قابلیت اعتماد پرداخت: ${customerData.financialMetrics.paymentReliability * 100}%
    - آخرین پرداخت: ${customerData.financialMetrics.lastPaymentDate.toLocaleDateString('fa-IR')}
    
    اطلاعات جمعیت‌شناختی:
    - منطقه: ${customerData.demographicData.region || 'نامشخص'}
    - نماینده: ${customerData.demographicData.representativeId}
    - قدمت حساب: ${customerData.demographicData.accountAge} روز
    
    لطفاً تحلیل جامعی از این مشتری ارائه دهید که شامل:
    1. احتمال ترک سرویس (0 تا 1)
    2. فاکتورهای کلیدی ریسک
    3. توصیه‌های اقدام با اولویت‌بندی
    4. پیش‌بینی ارزش دوره زندگی
    5. استراتژی بهینه تعامل
    
    پاسخ را به صورت JSON با ساختار دقیق و قابل پردازش ارائه دهید.
    در تحلیل خود بافت فرهنگی ایرانی، ویژگی‌های بازار V2Ray و الگوهای رفتاری مخصوص این صنعت را در نظر بگیرید.
    `;
  }

  private parseAnalysisResponse(analysisText: string, customerId: number): CustomerPrediction {
    try {
      // Extract JSON from response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      
      const analysis = JSON.parse(jsonMatch[0]);
      
      // Ensure proper structure and defaults
      return {
        customerId,
        churnRisk: {
          probability: analysis.churnRisk?.probability || 0.5,
          riskLevel: analysis.churnRisk?.riskLevel || 'medium',
          keyFactors: analysis.churnRisk?.keyFactors || [],
          timeline: analysis.churnRisk?.timeline || '1-month'
        },
        recommendations: {
          actions: analysis.recommendations?.actions || [],
          nextBestOffer: analysis.recommendations?.nextBestOffer || {
            serviceType: 'unlimited',
            reasoning: 'Default recommendation'
          }
        },
        lifetimeValuePrediction: {
          next30Days: analysis.lifetimeValuePrediction?.next30Days || 0,
          next90Days: analysis.lifetimeValuePrediction?.next90Days || 0,
          next12Months: analysis.lifetimeValuePrediction?.next12Months || 0,
          confidence: analysis.lifetimeValuePrediction?.confidence || 0.5
        },
        engagementStrategy: {
          preferredChannel: analysis.engagementStrategy?.preferredChannel || 'call',
          optimalContactTime: analysis.engagementStrategy?.optimalContactTime || '10:00-12:00',
          communicationTone: analysis.engagementStrategy?.communicationTone || 'friendly',
          keyTopics: analysis.engagementStrategy?.keyTopics || []
        }
      };
    } catch (error) {
      console.error('[VERTEX AI] Failed to parse analysis response:', error);
      
      // Return default prediction structure
      return {
        customerId,
        churnRisk: {
          probability: 0.5,
          riskLevel: 'medium',
          keyFactors: ['تحلیل ناموفق'],
          timeline: '1-month'
        },
        recommendations: {
          actions: [{
            priority: 'medium',
            action: 'بررسی دستی مشتری',
            expectedImpact: 'نامشخص',
            timeframe: 'این هفته'
          }],
          nextBestOffer: {
            serviceType: 'unlimited',
            reasoning: 'نیاز به بررسی دستی'
          }
        },
        lifetimeValuePrediction: {
          next30Days: 0,
          next90Days: 0,
          next12Months: 0,
          confidence: 0.1
        },
        engagementStrategy: {
          preferredChannel: 'call',
          optimalContactTime: '10:00-12:00',
          communicationTone: 'friendly',
          keyTopics: ['بررسی نیازها']
        }
      };
    }
  }

  private parseInterventionResponse(strategyText: string): any {
    try {
      const jsonMatch = strategyText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in intervention response');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('[VERTEX AI] Failed to parse intervention response:', error);
      
      return {
        urgency: 'medium',
        interventions: [{
          type: 'call',
          message: 'تماس جهت بررسی وضعیت مشتری',
          timing: 'در اسرع وقت',
          expectedOutcome: 'بررسی نیازها و حل مشکلات'
        }],
        escalationPath: ['تماس مستقیم', 'ارائه تخفیف', 'مراجعه به مدیر']
      };
    }
  }
}

export const vertexAICustomerIntelligence = new VertexAICustomerIntelligence();
export type { CustomerAnalysisData, CustomerPrediction };