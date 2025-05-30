import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

interface PerformanceMetrics {
  timestamp: Date;
  cpuUsage: number;
  memoryUsage: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
  activeConnections: number;
  databaseQueryTime: number;
  cacheHitRate: number;
}

interface SystemAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  type: 'performance' | 'security' | 'business' | 'infrastructure';
  title: string;
  description: string;
  recommendation: string;
  predictedImpact: string;
  timeToResolve: string;
  timestamp: Date;
}

interface PerformancePrediction {
  nextHour: {
    expectedLoad: number;
    riskLevel: 'low' | 'medium' | 'high';
    recommendations: string[];
  };
  next24Hours: {
    peakTimes: Array<{ time: string; expectedLoad: number }>;
    potentialBottlenecks: string[];
    optimizationSuggestions: string[];
  };
  trends: {
    performanceDirection: 'improving' | 'stable' | 'degrading';
    keyMetrics: Array<{ metric: string; trend: string; concern: string }>;
  };
}

export default function PerformanceMonitoringPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch performance metrics
  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/performance/metrics'],
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds
  });

  // Fetch active alerts
  const { data: alertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ['/api/performance/alerts'],
    refetchInterval: autoRefresh ? 60000 : false, // Refresh every minute
  });

  // Fetch performance analysis
  const { data: analysisData, isLoading: analysisLoading } = useQuery({
    queryKey: ['/api/performance/analysis'],
    refetchInterval: autoRefresh ? 300000 : false, // Refresh every 5 minutes
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'emergency': return 'bg-red-600 text-white';
      case 'critical': return 'bg-red-500 text-white';
      case 'warning': return 'bg-yellow-500 text-white';
      case 'info': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getMetricColor = (value: number, thresholds: {good: number, warning: number}) => {
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const currentMetrics = metricsData?.metrics?.[metricsData.metrics.length - 1] as PerformanceMetrics;
  const alerts = alertsData?.alerts as SystemAlert[] || [];
  const analysis = analysisData?.analysis as PerformancePrediction;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              مرکز نظارت عملکرد پیشرفته
            </h1>
            <p className="text-gray-600">
              نظارت هوشمند و پیش‌بینی مشکلات سیستم با قدرت Vertex AI
            </p>
          </div>
          <div className="flex space-x-reverse space-x-4">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <i className={`fas ${autoRefresh ? 'fa-pause' : 'fa-play'} ml-2`}></i>
              {autoRefresh ? 'توقف بروزرسانی' : 'شروع بروزرسانی'}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview">نمای کلی</TabsTrigger>
            <TabsTrigger value="alerts">هشدارها</TabsTrigger>
            <TabsTrigger value="analysis">تحلیل AI</TabsTrigger>
            <TabsTrigger value="trends">روندها</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Current Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">استفاده CPU</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">
                    <span className={getMetricColor(currentMetrics?.cpuUsage || 0, {good: 50, warning: 80})}>
                      {currentMetrics?.cpuUsage?.toFixed(1) || '0'}%
                    </span>
                  </div>
                  <Progress value={currentMetrics?.cpuUsage || 0} className="h-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">استفاده حافظه</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">
                    <span className={getMetricColor(currentMetrics?.memoryUsage || 0, {good: 60, warning: 85})}>
                      {currentMetrics?.memoryUsage?.toFixed(1) || '0'}%
                    </span>
                  </div>
                  <Progress value={currentMetrics?.memoryUsage || 0} className="h-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">زمان پاسخ</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">
                    <span className={getMetricColor(currentMetrics?.responseTime || 0, {good: 500, warning: 1500})}>
                      {currentMetrics?.responseTime?.toFixed(0) || '0'}ms
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    پردازش درخواست‌ها
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">اتصالات فعال</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">
                    {currentMetrics?.activeConnections || '0'}
                  </div>
                  <div className="text-xs text-gray-600">
                    کاربران متصل
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>وضعیت دیتابیس</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>زمان اجرای کوئری:</span>
                      <span className={getMetricColor(currentMetrics?.databaseQueryTime || 0, {good: 100, warning: 500})}>
                        {currentMetrics?.databaseQueryTime?.toFixed(0) || '0'}ms
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>نرخ موفقیت Cache:</span>
                      <span className="text-green-600">
                        {currentMetrics?.cacheHitRate?.toFixed(1) || '0'}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>نرخ خطا:</span>
                      <span className={getMetricColor(currentMetrics?.errorRate || 0, {good: 1, warning: 5})}>
                        {currentMetrics?.errorRate?.toFixed(2) || '0'}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>آمار شبکه</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>درخواست در ثانیه:</span>
                      <span className="text-blue-600">
                        {currentMetrics?.throughput || '0'} req/s
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>اتصالات همزمان:</span>
                      <span className="text-blue-600">
                        {currentMetrics?.activeConnections || '0'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>آخرین بروزرسانی:</span>
                      <span className="text-gray-600 text-sm">
                        {currentMetrics?.timestamp ? new Date(currentMetrics.timestamp).toLocaleString('fa-IR') : 'نامشخص'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>هشدارهای فعال سیستم</CardTitle>
                <CardDescription>
                  نظارت لحظه‌ای بر وضعیت سیستم و هشدارهای هوشمند
                </CardDescription>
              </CardHeader>
              <CardContent>
                {alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-check-circle text-green-500 text-4xl mb-4"></i>
                    <p className="text-gray-600">هیچ هشدار فعالی وجود ندارد</p>
                    <p className="text-sm text-gray-500">سیستم در حالت عادی عمل می‌کند</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {alerts.map((alert) => (
                      <div key={alert.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-reverse space-x-3">
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            <h4 className="font-medium">{alert.title}</h4>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(alert.timestamp).toLocaleString('fa-IR')}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-3">{alert.description}</p>
                        <div className="bg-blue-50 p-3 rounded-md mb-3">
                          <h5 className="font-medium text-blue-800 mb-1">توصیه راه‌حل:</h5>
                          <p className="text-blue-700 text-sm">{alert.recommendation}</p>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>تأثیر پیش‌بینی شده: {alert.predictedImpact}</span>
                          <span>زمان حل: {alert.timeToResolve}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            {analysis && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>پیش‌بینی بار سیستم</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3">ساعت آینده</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>بار مورد انتظار:</span>
                            <span className="font-medium">{analysis.nextHour.expectedLoad}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>سطح ریسک:</span>
                            <Badge variant={analysis.nextHour.riskLevel === 'high' ? 'destructive' : 
                              analysis.nextHour.riskLevel === 'medium' ? 'secondary' : 'default'}>
                              {analysis.nextHour.riskLevel}
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-4">
                          <h5 className="font-medium mb-2">توصیه‌های فوری:</h5>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {analysis.nextHour.recommendations.map((rec, index) => (
                              <li key={index} className="flex items-start">
                                <i className="fas fa-arrow-left text-blue-500 mt-1 ml-2 text-xs"></i>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-3">24 ساعت آینده</h4>
                        <div className="space-y-3">
                          <div>
                            <h5 className="text-sm font-medium mb-2">زمان‌های پیک:</h5>
                            {analysis.next24Hours.peakTimes.map((peak, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{peak.time}</span>
                                <span>{peak.expectedLoad}%</span>
                              </div>
                            ))}
                          </div>
                          
                          <div>
                            <h5 className="text-sm font-medium mb-2">نقاط گلوگاه احتمالی:</h5>
                            {analysis.next24Hours.potentialBottlenecks.map((bottleneck, index) => (
                              <Badge key={index} variant="outline" className="ml-1 mb-1">
                                {bottleneck}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>تحلیل روند عملکرد</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center space-x-reverse space-x-2 mb-4">
                          <span>جهت کلی عملکرد:</span>
                          <Badge variant={analysis.trends.performanceDirection === 'improving' ? 'default' :
                            analysis.trends.performanceDirection === 'stable' ? 'secondary' : 'destructive'}>
                            {analysis.trends.performanceDirection}
                          </Badge>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-medium mb-3">پیشنهادات بهینه‌سازی:</h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {analysis.next24Hours.optimizationSuggestions.map((suggestion, index) => (
                            <li key={index} className="flex items-start">
                              <i className="fas fa-lightbulb text-yellow-500 mt-1 ml-2 text-xs"></i>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>تحلیل متریک‌های کلیدی</CardTitle>
              </CardHeader>
              <CardContent>
                {analysis?.trends?.keyMetrics ? (
                  <div className="space-y-4">
                    {analysis.trends.keyMetrics.map((metric, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded">
                        <span className="font-medium">{metric.metric}</span>
                        <div className="flex items-center space-x-reverse space-x-2">
                          <Badge variant="outline">{metric.trend}</Badge>
                          <Badge variant={metric.concern === 'low' ? 'default' : 
                            metric.concern === 'medium' ? 'secondary' : 'destructive'}>
                            {metric.concern}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="fas fa-chart-line text-gray-400 text-4xl mb-4"></i>
                    <p className="text-gray-600">در حال جمع‌آوری داده‌های روند...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}