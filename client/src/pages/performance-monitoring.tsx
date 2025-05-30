import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  BarChart3,
  LineChart,
  PieChart
} from 'lucide-react';

export default function PerformanceMonitoring() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');

  // Mock data structure for performance monitoring
  const performanceData = {
    metrics: {
      responseTime: { value: 125, trend: '+5%', status: 'good' },
      throughput: { value: 1250, trend: '-2%', status: 'warning' },
      errorRate: { value: 0.5, trend: '+0.1%', status: 'good' },
      uptime: { value: 99.9, trend: '0%', status: 'excellent' }
    },
    alerts: [
      { id: 1, type: 'warning', message: 'بارگذاری بالای سرور', timestamp: '2 دقیقه پیش' },
      { id: 2, type: 'info', message: 'به‌روزرسانی سیستم انجام شد', timestamp: '15 دقیقه پیش' }
    ],
    analysis: {
      trends: {
        keyMetrics: [
          { metric: 'زمان پاسخ میانگین', trend: 'افزایش 5%', concern: 'medium' },
          { metric: 'تعداد درخواست‌ها', trend: 'کاهش 2%', concern: 'low' },
          { metric: 'میزان خطا', trend: 'افزایش 0.1%', concern: 'low' }
        ]
      }
    }
  };

  const { data: metrics = performanceData.metrics } = useQuery({
    queryKey: ['/api/performance/metrics', selectedTimeRange],
    queryFn: () => Promise.resolve(performanceData.metrics)
  });

  const { data: alerts = performanceData.alerts } = useQuery({
    queryKey: ['/api/performance/alerts'],
    queryFn: () => Promise.resolve(performanceData.alerts)
  });

  const { data: analysis = performanceData.analysis } = useQuery({
    queryKey: ['/api/performance/analysis', selectedTimeRange],
    queryFn: () => Promise.resolve(performanceData.analysis)
  });

  return (
    <div className="responsive-content space-y-6" dir="rtl">
      {/* Dynamic Header */}
      <div className="flex flex-col items-center space-y-2 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg mx-1">
        <h1 className="text-base md:text-xl font-bold text-center text-blue-900">نظارت عملکرد پیشرفته</h1>
        <p className="text-xs text-blue-600 text-center">مانیتورینگ لحظه‌ای عملکرد سیستم و تحلیل روندها</p>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2 justify-center">
        {['1h', '6h', '24h', '7d', '30d'].map((range) => (
          <Button
            key={range}
            variant={selectedTimeRange === range ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTimeRange(range)}
          >
            {range}
          </Button>
        ))}
      </div>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              زمان پاسخ (ms)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.responseTime.value}</div>
            <Badge variant={metrics.responseTime.status === 'good' ? 'default' : 'destructive'}>
              {metrics.responseTime.trend}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              تعداد درخواست
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.throughput.value}</div>
            <Badge variant={metrics.throughput.status === 'good' ? 'default' : 'secondary'}>
              {metrics.throughput.trend}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              میزان خطا (%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.errorRate.value}</div>
            <Badge variant={metrics.errorRate.status === 'good' ? 'default' : 'destructive'}>
              {metrics.errorRate.trend}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              دسترسی (%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.uptime.value}</div>
            <Badge variant="default">{metrics.uptime.trend}</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              هشدارها و اعلان‌ها
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert) => (
              <Alert key={alert.id} className={alert.type === 'warning' ? 'border-orange-200' : 'border-blue-200'}>
                <AlertDescription className="flex justify-between items-start">
                  <span>{alert.message}</span>
                  <span className="text-xs text-gray-500">{alert.timestamp}</span>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>

        {/* Trends Analysis */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              تحلیل روندها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="trends" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="trends">شاخص‌های کلیدی</TabsTrigger>
                <TabsTrigger value="charts">نمودارها</TabsTrigger>
                <TabsTrigger value="reports">گزارش‌ها</TabsTrigger>
              </TabsList>
              
              <TabsContent value="trends" className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    {analysis.trends.keyMetrics && analysis.trends.keyMetrics.length > 0 ? (
                      <div className="space-y-3">
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

              <TabsContent value="charts" className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <LineChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">نمودارهای تعاملی در حال توسعه</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reports" className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">گزارش‌های تفصیلی در حال آماده‌سازی</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}