import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  commonTopics: {
    topic: string;
    frequency: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  }[];
  sentimentAnalysis: {
    overallSentiment: 'positive' | 'neutral' | 'negative';
    sentimentScore: number;
    satisfactionTrend: 'improving' | 'stable' | 'declining';
  };
  anomalies: {
    type: 'spike' | 'drop' | 'unusual_pattern';
    description: string;
    severity: 'low' | 'medium' | 'high';
    detectedAt: string;
  }[];
}

interface AIAnalysis {
  executiveSummary: string;
  keyPerformanceInsights: string[];
  criticalFindings: {
    strengths: string[];
    concernAreas: string[];
    emergingTrends: string[];
  };
  topicAnalysis: {
    mostDiscussedIssues: string[];
    technicalTrends: string[];
    supportEffectiveness: string;
  };
  sentimentIntelligence: {
    overallMood: string;
    satisfactionDrivers: string[];
    frustrationPoints: string[];
    improvementOpportunities: string[];
  };
  operationalRecommendations: string[];
  anomalyDetection: Array<{
    type: string;
    description: string;
    severity: string;
    recommendedAction: string;
  }>;
  predictiveInsights: {
    upcomingChallenges: string[];
    successIndicators: string[];
    riskFactors: string[];
  };
}

export default function CRTPerformance() {
  const [selectedPeriod, setSelectedPeriod] = useState('7');
  const [analysisMode, setAnalysisMode] = useState<'metrics' | 'ai'>('metrics');

  // Calculate date range based on selected period
  const getDateRange = (days: string) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(days));
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  const dateRange = getDateRange(selectedPeriod);

  // Fetch CRT performance metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery<CRTMetrics>({
    queryKey: ['/api/crt/performance', dateRange.startDate, dateRange.endDate],
    queryFn: () => 
      fetch(`/api/crt/performance?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`)
        .then(res => res.json())
  });

  // Fetch AI analysis
  const { data: aiData, isLoading: aiLoading } = useQuery<{ metrics: CRTMetrics; aiAnalysis: AIAnalysis }>({
    queryKey: ['/api/crt/ai-analysis', dateRange.startDate, dateRange.endDate],
    queryFn: () => 
      fetch(`/api/crt/ai-analysis?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`)
        .then(res => res.json()),
    enabled: analysisMode === 'ai'
  });

  const formatPersianNumber = (num: number): string => {
    return num.toLocaleString('fa-IR');
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-100';
      case 'negative': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      default: return '➡️';
    }
  };

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-muted-foreground">در حال بارگذاری تحلیل عملکرد...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">مرکز نظارت عملکرد CRT</h1>
          <p className="text-muted-foreground mt-2">تحلیل هوشمند عملکرد تیم روابط مشتریان با قدرت هوش مصنوعی</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="انتخاب دوره" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">۷ روز گذشته</SelectItem>
              <SelectItem value="14">۲ هفته گذشته</SelectItem>
              <SelectItem value="30">ماه گذشته</SelectItem>
              <SelectItem value="90">۳ ماه گذشته</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex gap-2">
            <Button 
              variant={analysisMode === 'metrics' ? 'default' : 'outline'}
              onClick={() => setAnalysisMode('metrics')}
              className="flex-1 sm:flex-none"
            >
              <i className="fas fa-chart-bar ml-2"></i>
              آمار عملکرد
            </Button>
            <Button 
              variant={analysisMode === 'ai' ? 'default' : 'outline'}
              onClick={() => setAnalysisMode('ai')}
              className="flex-1 sm:flex-none"
            >
              <i className="fas fa-brain ml-2"></i>
              تحلیل هوشمند
            </Button>
          </div>
        </div>
      </div>

      {/* Period Info */}
      {metrics && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                دوره مورد بررسی: {metrics.period.shamsiStartDate} تا {metrics.period.shamsiEndDate}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {analysisMode === 'metrics' ? (
        /* Metrics View */
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">نمای کلی</TabsTrigger>
            <TabsTrigger value="interactions">تعاملات</TabsTrigger>
            <TabsTrigger value="topics">موضوعات</TabsTrigger>
            <TabsTrigger value="sentiment">احساسات</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">کل تعاملات</CardTitle>
                  <i className="fas fa-comments text-blue-600"></i>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold persian-nums">
                    {formatPersianNumber(metrics?.overallActivity.totalInteractions || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    میانگین روزانه: {formatPersianNumber(Math.round((metrics?.overallActivity.totalInteractions || 0) / parseInt(selectedPeriod)))}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">تماس‌های انجام شده</CardTitle>
                  <i className="fas fa-phone text-green-600"></i>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold persian-nums">
                    {formatPersianNumber(metrics?.overallActivity.callsMade || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    میانگین مدت: {metrics?.overallActivity.averageCallDuration.toFixed(1)} دقیقه
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">کارهای تکمیل شده</CardTitle>
                  <i className="fas fa-check-circle text-purple-600"></i>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold persian-nums">
                    {formatPersianNumber(metrics?.overallActivity.tasksCompleted || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    از {formatPersianNumber(metrics?.overallActivity.tasksCreated || 0)} کار ایجاد شده
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">نرخ حل مشکل</CardTitle>
                  <i className="fas fa-tools text-orange-600"></i>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold persian-nums">
                    {metrics ? Math.round((metrics.interactionOutcomes.issuesResolved / metrics.overallActivity.totalInteractions) * 100) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatPersianNumber(metrics?.interactionOutcomes.issuesResolved || 0)} مشکل حل شده
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Progress Indicators */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>عملکرد تیم CRT</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">نرخ تکمیل کارها</span>
                      <span className="text-sm font-bold">
                        {metrics ? Math.round((metrics.overallActivity.tasksCompleted / metrics.overallActivity.tasksCreated) * 100) : 0}%
                      </span>
                    </div>
                    <Progress 
                      value={metrics ? (metrics.overallActivity.tasksCompleted / metrics.overallActivity.tasksCreated) * 100 : 0} 
                      className="h-2"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">رضایت مشتریان</span>
                      <span className="text-sm font-bold">
                        {metrics ? Math.round((metrics.sentimentAnalysis.sentimentScore + 1) * 50) : 0}%
                      </span>
                    </div>
                    <Progress 
                      value={metrics ? (metrics.sentimentAnalysis.sentimentScore + 1) * 50 : 0} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>وضعیت احساسات مشتریان</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <Badge className={`text-lg px-4 py-2 ${getSentimentColor(metrics?.sentimentAnalysis.overallSentiment || 'neutral')}`}>
                      {metrics?.sentimentAnalysis.overallSentiment === 'positive' ? '😊 مثبت' :
                       metrics?.sentimentAnalysis.overallSentiment === 'negative' ? '😟 منفی' : '😐 خنثی'}
                    </Badge>
                    <p className="text-2xl font-bold mt-2 persian-nums">
                      {metrics ? (metrics.sentimentAnalysis.sentimentScore * 100).toFixed(0) : 0}
                    </p>
                    <p className="text-sm text-muted-foreground">امتیاز احساسات</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="topics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>موضوعات پربحث</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.commonTopics.map((topic, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <span className="font-medium">{topic.topic}</span>
                        <div className="flex items-center mt-1 gap-2">
                          <span className="text-sm text-muted-foreground persian-nums">
                            {formatPersianNumber(topic.frequency)} بار
                          </span>
                          <span className="text-sm">
                            {getTrendIcon(topic.trend)}
                          </span>
                        </div>
                      </div>
                      <Badge variant={topic.trend === 'increasing' ? 'destructive' : topic.trend === 'decreasing' ? 'default' : 'secondary'}>
                        {topic.trend === 'increasing' ? 'افزایشی' : topic.trend === 'decreasing' ? 'کاهشی' : 'ثابت'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        /* AI Analysis View */
        <div className="space-y-6">
          {aiLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">در حال تحلیل هوشمند داده‌ها...</p>
                </div>
              </CardContent>
            </Card>
          ) : aiData?.aiAnalysis ? (
            <>
              {/* Executive Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <i className="fas fa-brain text-purple-600"></i>
                    خلاصه تحلیل هوشمند
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {aiData.aiAnalysis.executiveSummary}
                  </p>
                </CardContent>
              </Card>

              {/* Key Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>نکات کلیدی عملکرد</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {aiData.aiAnalysis.keyPerformanceInsights.map((insight, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <i className="fas fa-lightbulb text-yellow-500 mt-1"></i>
                        <p className="text-sm">{insight}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle>توصیه‌های عملیاتی</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {aiData.aiAnalysis.operationalRecommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <i className="fas fa-arrow-left text-blue-500 mt-1"></i>
                        <p className="text-sm">{rec}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <i className="fas fa-exclamation-triangle text-yellow-500 text-4xl mb-4"></i>
                  <p className="text-muted-foreground">
                    تحلیل هوشمند در دسترس نیست. لطفاً کلیدهای API مربوط به Vertex AI را پیکربندی کنید.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}