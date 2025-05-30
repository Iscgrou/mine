import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Users, Phone, Clock, MessageSquare, CheckCircle, 
  Target, TrendingUp, Heart, Brain, Zap, Award, 
  BarChart3, PieChart, Activity, AlertTriangle,
  ChevronRight, ChevronDown, Filter, Download,
  Star, ThumbsUp, Lightbulb, TrendingDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CRTMetrics {
  period: {
    shamsiStartDate: string;
    shamsiEndDate: string;
  };
  performanceMetrics?: {
    totalInteractions: number;
    qualityScore: number;
    resolutionRate: number;
    averageResponseTime: number;
    customerSatisfactionIndex: number;
  };
  behavioralInsights?: {
    communicationPatterns: Array<{
      pattern: string;
      frequency: number;
      effectiveness: number;
      culturalRelevance: number;
    }>;
    emotionalIntelligence: {
      empathyScore: number;
      culturalSensitivity: number;
      adaptabilityIndex: number;
    };
  };
  technicalProficiency?: {
    v2rayExpertise: number;
    troubleshootingEfficiency: number;
    problemResolutionSpeed: number;
    technicalAccuracy: number;
  };
  businessImpact?: {
    revenueContribution: number;
    customerRetention: number;
    upsellSuccess: number;
    referralGeneration: number;
  };
  predictiveInsights?: {
    burnoutRisk: number;
    performanceTrend: 'improving' | 'stable' | 'declining';
    recommendedInterventions: string[];
    nextWeekPrediction: {
      expectedInteractions: number;
      qualityForecast: number;
      riskFactors: string[];
    };
  };
  culturalContext?: {
    shamsiDatePatterns: Array<{
      period: string;
      activityLevel: number;
      culturalSignificance: string;
    }>;
    communicationFormality: {
      averageFormalityLevel: number;
      contextualAdaptation: number;
      regionalVariations: Record<string, number>;
    };
  };
  // Legacy support
  overallActivity: {
    totalInteractions: number;
    callsMade: number;
    averageCallDuration: number;
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
  commonTopics: Array<{
    topic: string;
    frequency: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }>;
  sentimentAnalysis: {
    overallSentiment: 'positive' | 'negative' | 'neutral';
    sentimentScore: number;
    satisfactionTrend: 'improving' | 'stable' | 'declining';
  };
  anomalies: Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    detectedAt: string;
  }>;
}

const AnimatedCard: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    className={className}
  >
    <Card className="h-full bg-white/80 backdrop-blur-sm border-gray-200/50 hover:shadow-lg transition-all duration-300">
      {children}
    </Card>
  </motion.div>
);

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  subtitle?: string;
  delay?: number;
}> = ({ title, value, icon, trend, subtitle, delay = 0 }) => {
  const trendColors = {
    up: 'text-green-600 bg-green-50',
    down: 'text-red-600 bg-red-50',
    stable: 'text-blue-600 bg-blue-50'
  };

  return (
    <AnimatedCard delay={delay} className="group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900 persian-nums">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1 persian-nums">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-full ${trend ? trendColors[trend] : 'text-gray-600 bg-gray-50'} 
                         group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </AnimatedCard>
  );
};

const ScoreGauge: React.FC<{
  title: string;
  score: number;
  maxScore?: number;
  color?: string;
}> = ({ title, score, maxScore = 100, color = "blue" }) => {
  const percentage = (score / maxScore) * 100;
  const circumference = 2 * Math.PI * 40;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center p-4">
      <div className="relative w-24 h-24 mb-3">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-gray-200"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={`text-${color}-500 transition-all duration-1000 ease-out`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-gray-900 persian-nums">{Math.round(score)}</span>
        </div>
      </div>
      <h4 className="text-sm font-medium text-gray-700 text-center">{title}</h4>
    </div>
  );
};

export default function CRTPerformance() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('7d');
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'predictive'>('overview');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['performance']));

  const getDateRange = (period: string) => {
    const end = new Date();
    const start = new Date();
    
    switch (period) {
      case '24h':
        start.setDate(start.getDate() - 1);
        break;
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      case '90d':
        start.setDate(start.getDate() - 90);
        break;
      default:
        start.setDate(start.getDate() - 7);
    }
    
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };

  const dateRange = getDateRange(selectedPeriod);

  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['/api/crt/performance', dateRange.startDate, dateRange.endDate],
    queryFn: () => 
      fetch(`/api/crt/performance?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`)
        .then(res => {
          if (!res.ok) throw new Error('خطا در دریافت داده‌ها');
          return res.json();
        }) as Promise<CRTMetrics>,
    retry: 2
  });

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="max-w-7xl mx-auto ml-[10%]">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">در حال تحلیل عملکرد CRT...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 p-6">
        <div className="max-w-7xl mx-auto ml-[10%]">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-900 mb-2">خطا در بارگذاری داده‌ها</h3>
              <p className="text-red-700">لطفاً دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600">داده‌ای یافت نشد.</p>
          </div>
        </div>
      </div>
    );
  }

  const completionRate = metrics.overallActivity.tasksCreated > 0 ? 
    (metrics.overallActivity.tasksCompleted / metrics.overallActivity.tasksCreated * 100) : 0;
  const resolutionRate = metrics.overallActivity.totalInteractions > 0 ? 
    (metrics.interactionOutcomes.issuesResolved / metrics.overallActivity.totalInteractions * 100) : 0;
  const satisfactionScore = (metrics.sentimentAnalysis.sentimentScore + 1) * 50;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto ml-[10%]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                مانیتورینگ عملکرد CRT
              </h1>
              <p className="text-gray-600">
                تحلیل هوشمند فناوری روابط مشتری با قدرت Vertex AI
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">۲۴ ساعت اخیر</SelectItem>
                  <SelectItem value="7d">۷ روز اخیر</SelectItem>
                  <SelectItem value="30d">۳۰ روز اخیر</SelectItem>
                  <SelectItem value="90d">۹۰ روز اخیر</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">نمای کلی</SelectItem>
                  <SelectItem value="detailed">جزئیات کامل</SelectItem>
                  <SelectItem value="predictive">تحلیل پیش‌بینانه</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 ml-2" />
                دانلود گزارش
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Period Info */}
        <AnimatedCard delay={0.1} className="mb-8 text-center">
          <CardContent className="p-4">
            <p className="text-gray-700">
              <span className="font-semibold">دوره مورد بررسی:</span>
              <span className="mx-2 persian-nums">{metrics.period.shamsiStartDate}</span>
              <span className="text-gray-400">تا</span>
              <span className="mx-2 persian-nums">{metrics.period.shamsiEndDate}</span>
            </p>
          </CardContent>
        </AnimatedCard>

        {/* Core Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="کل تعاملات"
            value={metrics.overallActivity.totalInteractions}
            icon={<Users className="w-6 h-6" />}
            delay={0.2}
          />
          <MetricCard
            title="نرخ حل مسائل"
            value={`${Math.round(resolutionRate)}%`}
            icon={<CheckCircle className="w-6 h-6" />}
            trend={resolutionRate > 85 ? 'up' : resolutionRate < 70 ? 'down' : 'stable'}
            delay={0.25}
          />
          <MetricCard
            title="امتیاز کیفیت"
            value={metrics.performanceMetrics?.qualityScore || Math.round(satisfactionScore)}
            icon={<Award className="w-6 h-6" />}
            trend={satisfactionScore > 75 ? 'up' : satisfactionScore < 50 ? 'down' : 'stable'}
            delay={0.3}
          />
          <MetricCard
            title="زمان پاسخ میانگین"
            value={`${metrics.overallActivity.averageCallDuration} دقیقه`}
            icon={<Clock className="w-6 h-6" />}
            delay={0.35}
          />
        </div>

        {/* Detailed Analysis Sections */}
        <div className="space-y-6">
          {/* Performance Analysis */}
          <AnimatedCard delay={0.4}>
            <CardHeader 
              className="cursor-pointer"
              onClick={() => toggleSection('performance')}
            >
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                  تحلیل عملکرد تفصیلی
                </div>
                {expandedSections.has('performance') ? 
                  <ChevronDown className="w-5 h-5" /> : 
                  <ChevronRight className="w-5 h-5" />
                }
              </CardTitle>
            </CardHeader>
            
            <AnimatePresence>
              {expandedSections.has('performance') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-800">معیارهای اصلی</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">تماس‌های انجام شده</span>
                            <span className="font-medium persian-nums">{metrics.overallActivity.callsMade}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">پیام‌های تلگرام</span>
                            <span className="font-medium persian-nums">{metrics.overallActivity.telegramMessages}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">کارهای تکمیل شده</span>
                            <span className="font-medium persian-nums">{metrics.overallActivity.tasksCompleted}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">پیگیری‌های برنامه‌ریزی شده</span>
                            <span className="font-medium persian-nums">{metrics.interactionOutcomes.followupsScheduled}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-800">نتایج تعاملات</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">عیب‌یابی موفق</span>
                            <span className="font-medium persian-nums">{metrics.interactionOutcomes.successfulTroubleshooting}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">ارائه پنل فروش</span>
                            <span className="font-medium persian-nums">{metrics.interactionOutcomes.panelSalesPresentations}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">مسائل ارجاع داده شده</span>
                            <span className="font-medium persian-nums">{metrics.interactionOutcomes.escalatedIssues}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-4">امتیازات کلیدی</h4>
                        <div className="space-y-4">
                          <ScoreGauge 
                            title="نرخ تکمیل" 
                            score={completionRate} 
                            color="green"
                          />
                          <ScoreGauge 
                            title="رضایت مشتری" 
                            score={satisfactionScore} 
                            color="blue"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </AnimatedCard>

          {/* AI Insights */}
          {metrics.performanceMetrics && (
            <AnimatedCard delay={0.5}>
              <CardHeader 
                className="cursor-pointer"
                onClick={() => toggleSection('ai-insights')}
              >
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Brain className="w-6 h-6 text-purple-600" />
                    تحلیل‌های هوشمند Vertex AI
                  </div>
                  {expandedSections.has('ai-insights') ? 
                    <ChevronDown className="w-5 h-5" /> : 
                    <ChevronRight className="w-5 h-5" />
                  }
                </CardTitle>
              </CardHeader>
              
              <AnimatePresence>
                {expandedSections.has('ai-insights') && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CardContent>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Technical Proficiency */}
                        {metrics.technicalProficiency && (
                          <div>
                            <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                              <Zap className="w-5 h-5 text-yellow-600" />
                              تخصص فنی
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              <ScoreGauge 
                                title="تخصص V2Ray" 
                                score={metrics.technicalProficiency.v2rayExpertise} 
                                color="indigo"
                              />
                              <ScoreGauge 
                                title="کارایی عیب‌یابی" 
                                score={metrics.technicalProficiency.troubleshootingEfficiency} 
                                color="green"
                              />
                              <ScoreGauge 
                                title="سرعت حل مسئله" 
                                score={metrics.technicalProficiency.problemResolutionSpeed} 
                                color="blue"
                              />
                              <ScoreGauge 
                                title="دقت فنی" 
                                score={metrics.technicalProficiency.technicalAccuracy} 
                                color="purple"
                              />
                            </div>
                          </div>
                        )}

                        {/* Business Impact */}
                        {metrics.businessImpact && (
                          <div>
                            <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                              <TrendingUp className="w-5 h-5 text-green-600" />
                              تأثیر تجاری
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              <ScoreGauge 
                                title="مشارکت درآمد" 
                                score={metrics.businessImpact.revenueContribution} 
                                color="green"
                              />
                              <ScoreGauge 
                                title="حفظ مشتری" 
                                score={metrics.businessImpact.customerRetention} 
                                color="blue"
                              />
                              <ScoreGauge 
                                title="موفقیت فروش متقابل" 
                                score={metrics.businessImpact.upsellSuccess} 
                                color="yellow"
                              />
                              <ScoreGauge 
                                title="تولید ارجاع" 
                                score={metrics.businessImpact.referralGeneration} 
                                color="purple"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </AnimatedCard>
          )}

          {/* Communication Patterns */}
          {metrics.behavioralInsights && (
            <AnimatedCard delay={0.6}>
              <CardHeader 
                className="cursor-pointer"
                onClick={() => toggleSection('communication')}
              >
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-6 h-6 text-green-600" />
                    الگوهای ارتباطی
                  </div>
                  {expandedSections.has('communication') ? 
                    <ChevronDown className="w-5 h-5" /> : 
                    <ChevronRight className="w-5 h-5" />
                  }
                </CardTitle>
              </CardHeader>
              
              <AnimatePresence>
                {expandedSections.has('communication') && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CardContent>
                      <div className="space-y-6">
                        {metrics.behavioralInsights.communicationPatterns.map((pattern, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-medium text-gray-800">{pattern.pattern}</h5>
                              <Badge variant="secondary" className="persian-nums">
                                {pattern.frequency} مورد
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">میزان اثربخشی</span>
                                <span className="persian-nums">{pattern.effectiveness}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                                  style={{ width: `${pattern.effectiveness}%` }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">ارتباط فرهنگی</span>
                                <span className="persian-nums">{pattern.culturalRelevance}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                                  style={{ width: `${pattern.culturalRelevance}%` }}
                                />
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </AnimatedCard>
          )}

          {/* Predictive Insights */}
          {metrics.predictiveInsights && (
            <AnimatedCard delay={0.7}>
              <CardHeader 
                className="cursor-pointer"
                onClick={() => toggleSection('predictive')}
              >
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Activity className="w-6 h-6 text-orange-600" />
                    تحلیل پیش‌بینانه
                  </div>
                  {expandedSections.has('predictive') ? 
                    <ChevronDown className="w-5 h-5" /> : 
                    <ChevronRight className="w-5 h-5" />
                  }
                </CardTitle>
              </CardHeader>
              
              <AnimatePresence>
                {expandedSections.has('predictive') && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CardContent>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-4">وضعیت فعلی</h4>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="text-gray-700">ریسک فرسودگی شغلی</span>
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${
                                  metrics.predictiveInsights.burnoutRisk < 30 ? 'bg-green-500' :
                                  metrics.predictiveInsights.burnoutRisk < 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`} />
                                <span className="persian-nums">{metrics.predictiveInsights.burnoutRisk}%</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="text-gray-700">روند عملکرد</span>
                              <div className="flex items-center gap-2">
                                {metrics.predictiveInsights.performanceTrend === 'improving' && 
                                  <TrendingUp className="w-4 h-4 text-green-500" />}
                                {metrics.predictiveInsights.performanceTrend === 'declining' && 
                                  <TrendingDown className="w-4 h-4 text-red-500" />}
                                {metrics.predictiveInsights.performanceTrend === 'stable' && 
                                  <Activity className="w-4 h-4 text-blue-500" />}
                                <span className="text-sm">
                                  {metrics.predictiveInsights.performanceTrend === 'improving' && 'رو به بهبود'}
                                  {metrics.predictiveInsights.performanceTrend === 'declining' && 'رو به افول'}
                                  {metrics.predictiveInsights.performanceTrend === 'stable' && 'پایدار'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-4">پیش‌بینی هفته آینده</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">تعاملات مورد انتظار</span>
                              <span className="font-medium persian-nums">
                                {metrics.predictiveInsights.nextWeekPrediction.expectedInteractions}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">پیش‌بینی کیفیت</span>
                              <span className="font-medium persian-nums">
                                {metrics.predictiveInsights.nextWeekPrediction.qualityForecast}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {metrics.predictiveInsights.recommendedInterventions.length > 0 && (
                        <div className="mt-6">
                          <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 text-yellow-600" />
                            توصیه‌های بهبود
                          </h4>
                          <div className="space-y-2">
                            {metrics.predictiveInsights.recommendedInterventions.map((intervention, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg"
                              >
                                <ThumbsUp className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                <span className="text-sm text-gray-700">{intervention}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </AnimatedCard>
          )}

          {/* Common Topics */}
          {metrics.commonTopics.length > 0 && (
            <AnimatedCard delay={0.8}>
              <CardHeader 
                className="cursor-pointer"
                onClick={() => toggleSection('topics')}
              >
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <PieChart className="w-6 h-6 text-indigo-600" />
                    موضوعات پربحث
                  </div>
                  {expandedSections.has('topics') ? 
                    <ChevronDown className="w-5 h-5" /> : 
                    <ChevronRight className="w-5 h-5" />
                  }
                </CardTitle>
              </CardHeader>
              
              <AnimatePresence>
                {expandedSections.has('topics') && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CardContent>
                      <div className="space-y-4">
                        {metrics.commonTopics.map((topic, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg hover:shadow-md transition-all duration-300"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-medium text-gray-800">{topic.topic}</h5>
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">
                                  {topic.trend === 'increasing' ? '📈' : 
                                   topic.trend === 'decreasing' ? '📉' : '➡️'}
                                </span>
                                <Badge variant="outline" className="persian-nums">
                                  {topic.frequency} مورد
                                </Badge>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <motion.div
                                className={`h-3 rounded-full ${
                                  topic.trend === 'increasing' ? 'bg-gradient-to-r from-red-400 to-red-500' :
                                  topic.trend === 'decreasing' ? 'bg-gradient-to-r from-green-400 to-green-500' :
                                  'bg-gradient-to-r from-blue-400 to-blue-500'
                                }`}
                                initial={{ width: 0 }}
                                animate={{ 
                                  width: `${Math.min((topic.frequency / (metrics.commonTopics[0]?.frequency || 1)) * 100, 100)}%` 
                                }}
                                transition={{ duration: 1.5, delay: 0.5 + index * 0.1 }}
                              />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </AnimatedCard>
          )}
        </div>
      </div>
    </div>
  );
}