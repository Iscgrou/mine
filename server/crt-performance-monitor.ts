/**
 * AI-Powered CRT Performance Monitoring & Insights Dashboard
 * Leverages Vertex AI (Gemini) for intelligent analysis of Customer Relations Team performance
 */

import { GoogleAuth } from 'google-auth-library';
import type { Express, Request, Response } from 'express';

interface CRTMetrics {
  period: {
    startDate: string;
    endDate: string;
    shamsiStartDate: string;
    shamsiEndDate: string;
  };
  overallActivity: {
    totalInteractions: number;
    callsMade: number;
    averageCallDuration: number; // in minutes
    telegramMessages: number;
    tasksCompleted: number;
    tasksCreated: number;
  };
  interactionOutcomes: {
    successfulTroubleshooting: number;
    panelSalesPresentations: number;
    followupsScheduled: number;
    issuesResolved: number;
    escalatedIssues: number;
  };
  commonTopics: {
    topic: string;
    frequency: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  }[];
  sentimentAnalysis: {
    overallSentiment: 'positive' | 'neutral' | 'negative';
    sentimentScore: number; // -1 to 1
    satisfactionTrend: 'improving' | 'stable' | 'declining';
  };
  crtMemberPerformance?: {
    memberId: string;
    memberName: string;
    interactionsPerDay: number;
    taskCompletionRate: number;
    averageResponseTime: number; // in hours
  }[];
  anomalies: {
    type: 'spike' | 'drop' | 'unusual_pattern';
    description: string;
    severity: 'low' | 'medium' | 'high';
    detectedAt: string;
  }[];
}

interface VertexAIAnalysisRequest {
  aggregatedData: {
    interactionCounts: Record<string, number>;
    callDurations: number[];
    topicFrequencies: Record<string, number>;
    sentimentScores: number[];
    outcomeTypes: Record<string, number>;
    timeRangeData: Array<{
      date: string;
      interactions: number;
      sentiment: number;
    }>;
  };
  businessContext: {
    industry: 'V2Ray Panel Provider';
    targetMarket: 'Iranian Mobile Phone Stores';
    commonServices: string[];
    businessGoals: string[];
  };
  analysisObjectives: string[];
}

class CRTPerformanceMonitor {
  private auth: GoogleAuth;

  constructor() {
    this.auth = new GoogleAuth({
      credentials: process.env.GOOGLE_AI_STUDIO_API_KEY ? {
        type: 'service_account',
        private_key: process.env.GOOGLE_AI_STUDIO_API_KEY,
      } : undefined,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
  }

  /**
   * Advanced Vertex AI Prompt Engineering for CRT Performance Analysis
   * Designed by Chronos to leverage AI for comprehensive CRT insights
   */
  private generateVertexAIPrompt(data: VertexAIAnalysisRequest): string {
    return `You are an expert CRM Operations Analyst specializing in V2Ray network services and Iranian telecommunications market dynamics. Your role is to analyze Customer Relations Team (CRT) performance for MarFanet, a leading V2Ray panel provider serving Iranian mobile phone stores.

**Business Context:**
- Industry: ${data.businessContext.industry}
- Target Market: ${data.businessContext.targetMarket}
- Core Services: V2Ray panel management, technical support, sales assistance
- Cultural Context: Persian-speaking customer base, Shamsi calendar operations
- Business Goals: Maximize representative satisfaction, optimize V2Ray service delivery, increase panel sales

**Analysis Data Period:** ${data.aggregatedData.timeRangeData.length} days of CRT interaction data

**Raw Performance Data:**
- Total Interactions: ${Object.values(data.aggregatedData.interactionCounts).reduce((a, b) => a + b, 0)}
- Interaction Types: ${JSON.stringify(data.aggregatedData.interactionCounts)}
- Average Call Duration: ${data.aggregatedData.callDurations.length > 0 ? (data.aggregatedData.callDurations.reduce((a, b) => a + b, 0) / data.aggregatedData.callDurations.length).toFixed(1) : 0} minutes
- Top Discussion Topics: ${JSON.stringify(data.aggregatedData.topicFrequencies)}
- Outcome Distribution: ${JSON.stringify(data.aggregatedData.outcomeTypes)}
- Sentiment Trend: ${data.aggregatedData.sentimentScores.length > 0 ? (data.aggregatedData.sentimentScores.reduce((a, b) => a + b, 0) / data.aggregatedData.sentimentScores.length).toFixed(2) : 'N/A'}

**Advanced Analysis Requirements:**

1. **Performance Excellence Assessment:**
   Analyze CRT effectiveness in handling V2Ray-specific challenges like connection issues, server optimization, protocol configuration, and panel feature explanations.

2. **Representative Satisfaction Intelligence:**
   Evaluate sentiment patterns and identify factors influencing representative satisfaction with MarFanet's services and support quality.

3. **Operational Optimization Insights:**
   Identify bottlenecks, peak interaction periods, common escalation patterns, and opportunities for process improvement.

4. **Market Intelligence Extraction:**
   Detect emerging trends in V2Ray usage, new technical challenges, competitive mentions, and evolving customer needs in the Iranian telecommunications landscape.

5. **Predictive Performance Indicators:**
   Forecast potential issues, identify representatives at risk of churn, and suggest proactive engagement strategies.

**Expected Output Structure:**
Please provide a comprehensive analysis in JSON format with these sections:

{
  "executiveSummary": "Brief overview of CRT performance during this period",
  "keyPerformanceInsights": [
    "Insight 1 about performance trends",
    "Insight 2 about efficiency metrics",
    "Insight 3 about representative satisfaction"
  ],
  "criticalFindings": {
    "strengths": ["List of identified strengths"],
    "concernAreas": ["List of areas needing attention"],
    "emergingTrends": ["New patterns or trends detected"]
  },
  "topicAnalysis": {
    "mostDiscussedIssues": ["Top 5 topics with frequency and business impact"],
    "technicalTrends": ["V2Ray-specific technical discussion patterns"],
    "supportEffectiveness": "Assessment of how well CRT resolves common issues"
  },
  "sentimentIntelligence": {
    "overallMood": "positive/neutral/negative with explanation",
    "satisfactionDrivers": ["Factors positively influencing representative satisfaction"],
    "frustrationPoints": ["Common sources of representative frustration"],
    "improvementOpportunities": ["Specific suggestions for enhancing representative experience"]
  },
  "operationalRecommendations": [
    "Specific actionable recommendations for CRT improvement",
    "Training suggestions based on identified gaps",
    "Process optimization opportunities"
  ],
  "anomalyDetection": [
    {
      "type": "performance_spike/drop/unusual_pattern",
      "description": "Detailed description of anomaly",
      "severity": "low/medium/high",
      "recommendedAction": "Specific action to address this anomaly"
    }
  ],
  "predictiveInsights": {
    "upcomingChallenges": ["Potential issues to watch for"],
    "successIndicators": ["Metrics that predict positive outcomes"],
    "riskFactors": ["Early warning signs for problems"]
  }
}

Focus on actionable insights that can immediately improve CRT performance and representative satisfaction. Consider the unique challenges of serving Iranian mobile stores with V2Ray technology and provide culturally-aware recommendations.`;
  }

  /**
   * Analyze CRT performance using Vertex AI (Gemini)
   */
  async analyzeCRTPerformance(metrics: CRTMetrics): Promise<any> {
    try {
      if (!process.env.GOOGLE_AI_STUDIO_API_KEY) {
        throw new Error('Vertex AI credentials not configured');
      }

      // Prepare data for Vertex AI analysis
      const analysisRequest: VertexAIAnalysisRequest = {
        aggregatedData: {
          interactionCounts: {
            'calls': metrics.overallActivity.callsMade,
            'telegram': metrics.overallActivity.telegramMessages,
            'tasks': metrics.overallActivity.tasksCompleted
          },
          callDurations: [metrics.overallActivity.averageCallDuration],
          topicFrequencies: metrics.commonTopics.reduce((acc, topic) => {
            acc[topic.topic] = topic.frequency;
            return acc;
          }, {} as Record<string, number>),
          sentimentScores: [metrics.sentimentAnalysis.sentimentScore],
          outcomeTypes: {
            'troubleshooting': metrics.interactionOutcomes.successfulTroubleshooting,
            'sales': metrics.interactionOutcomes.panelSalesPresentations,
            'followups': metrics.interactionOutcomes.followupsScheduled,
            'resolved': metrics.interactionOutcomes.issuesResolved,
            'escalated': metrics.interactionOutcomes.escalatedIssues
          },
          timeRangeData: [{
            date: metrics.period.startDate,
            interactions: metrics.overallActivity.totalInteractions,
            sentiment: metrics.sentimentAnalysis.sentimentScore
          }]
        },
        businessContext: {
          industry: 'V2Ray Panel Provider',
          targetMarket: 'Iranian Mobile Phone Stores',
          commonServices: ['V2Ray Configuration', 'Panel Management', 'Technical Support', 'Sales Assistance'],
          businessGoals: ['Maximize Representative Satisfaction', 'Optimize Service Delivery', 'Increase Sales']
        },
        analysisObjectives: [
          'Assess CRT performance effectiveness',
          'Identify representative satisfaction trends',
          'Detect operational optimization opportunities',
          'Extract market intelligence insights',
          'Provide predictive performance indicators'
        ]
      };

      const prompt = this.generateVertexAIPrompt(analysisRequest);

      // Call Vertex AI API
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GOOGLE_AI_STUDIO_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Vertex AI API error: ${response.statusText}`);
      }

      const result = await response.json();
      const analysisText = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!analysisText) {
        throw new Error('No analysis content received from Vertex AI');
      }

      // Parse JSON response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: return structured text analysis
        return {
          executiveSummary: analysisText.substring(0, 500),
          rawAnalysis: analysisText,
          analysisType: 'text_fallback'
        };
      }

    } catch (error) {
      console.error('CRT Performance Analysis Error:', error);
      throw error;
    }
  }

  /**
   * Generate mock CRT data for demonstration (to be replaced with real data)
   */
  generateMockCRTData(startDate: string, endDate: string): CRTMetrics {
    return {
      period: {
        startDate,
        endDate,
        shamsiStartDate: new Date(startDate).toLocaleDateString('fa-IR'),
        shamsiEndDate: new Date(endDate).toLocaleDateString('fa-IR')
      },
      overallActivity: {
        totalInteractions: 342,
        callsMade: 156,
        averageCallDuration: 8.5,
        telegramMessages: 186,
        tasksCompleted: 89,
        tasksCreated: 94
      },
      interactionOutcomes: {
        successfulTroubleshooting: 67,
        panelSalesPresentations: 23,
        followupsScheduled: 45,
        issuesResolved: 78,
        escalatedIssues: 12
      },
      commonTopics: [
        { topic: 'مشکلات اتصال V2Ray', frequency: 45, trend: 'increasing' },
        { topic: 'تنظیمات پنل مدیریت', frequency: 32, trend: 'stable' },
        { topic: 'سوالات تجدید اشتراک', frequency: 28, trend: 'decreasing' },
        { topic: 'مشکلات سرعت اتصال', frequency: 24, trend: 'increasing' },
        { topic: 'راهنمایی نصب نرم‌افزار', frequency: 19, trend: 'stable' }
      ],
      sentimentAnalysis: {
        overallSentiment: 'positive',
        sentimentScore: 0.73,
        satisfactionTrend: 'improving'
      },
      anomalies: [
        {
          type: 'spike',
          description: 'افزایش ۳۵٪ در تماس‌های مربوط به مشکلات اتصال در ۳ روز گذشته',
          severity: 'medium',
          detectedAt: new Date().toISOString()
        }
      ]
    };
  }
}

export function registerCRTPerformanceRoutes(app: Express) {
  const monitor = new CRTPerformanceMonitor();

  // Get CRT performance metrics
  app.get('/api/crt/performance', async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ 
          error: 'Start date and end date are required' 
        });
      }

      // Generate mock data (replace with real database queries)
      const crtMetrics = monitor.generateMockCRTData(startDate as string, endDate as string);

      res.json(crtMetrics);
    } catch (error) {
      console.error('CRT Performance API Error:', error);
      res.status(500).json({ error: 'Failed to retrieve CRT performance data' });
    }
  });

  // Get AI-powered CRT analysis
  app.get('/api/crt/ai-analysis', async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ 
          error: 'Start date and end date are required' 
        });
      }

      // Get metrics data
      const crtMetrics = monitor.generateMockCRTData(startDate as string, endDate as string);

      // Analyze with Vertex AI
      const aiAnalysis = await monitor.analyzeCRTPerformance(crtMetrics);

      res.json({
        metrics: crtMetrics,
        aiAnalysis,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('CRT AI Analysis Error:', error);
      
      if (error.message?.includes('credentials not configured')) {
        res.status(503).json({ 
          error: 'AI analysis service unavailable',
          message: 'Vertex AI credentials need to be configured'
        });
      } else {
        res.status(500).json({ 
          error: 'Failed to generate AI analysis',
          details: error.message 
        });
      }
    }
  });
}

export { CRTPerformanceMonitor };