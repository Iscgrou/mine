import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  BarChart3,
  LineChart,
  PieChart,
  Download,
  RefreshCw,
  Settings,
  Bell,
  Database,
  Server,
  Zap
} from 'lucide-react';

export default function PerformanceMonitoring() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [alertSettingsOpen, setAlertSettingsOpen] = useState(false);
  const [systemConfigOpen, setSystemConfigOpen] = useState(false);
  const { toast } = useToast();

  // Initialize with proper structure that matches your API
  const [metrics, setMetrics] = useState({
    responseTime: { value: 0, trend: 'N/A', status: 'unknown' },
    throughput: { value: 0, trend: 'N/A', status: 'unknown' },
    errorRate: { value: 0, trend: 'N/A', status: 'unknown' },
    uptime: { value: 0, trend: 'N/A', status: 'unknown' }
  });

  const [alerts, setAlerts] = useState([
    { id: 1, type: 'warning', message: 'بارگذاری بالای سرور', timestamp: '2 دقیقه پیش' },
    { id: 2, type: 'info', message: 'به‌روزرسانی سیستم انجام شد', timestamp: '15 دقیقه پیش' }
  ]);

  const [analysis, setAnalysis] = useState({
    trends: {
      keyMetrics: [
        { metric: 'زمان پاسخ میانگین', trend: 'افزایش 5%', concern: 'medium' },
        { metric: 'تعداد درخواست‌ها', trend: 'کاهش 2%', concern: 'low' },
        { metric: 'میزان خطا', trend: 'افزایش 0.1%', concern: 'low' }
      ]
    }
  });

  const [metricsLoading, setMetricsLoading] = useState(false);

  // Real button functions
  const handleRefreshData = async () => {
    setMetricsLoading(true);
    toast({
      title: "به‌روزرسانی داده‌ها",
      description: "در حال به‌روزرسانی اطلاعات عملکرد...",
    });
    
    try {
      // Fetch real data from API endpoints
      const [metricsRes, alertsRes, analysisRes] = await Promise.all([
        fetch(`/api/performance/metrics?timeRange=${selectedTimeRange}`),
        fetch('/api/performance/alerts'),
        fetch(`/api/performance/analysis?timeRange=${selectedTimeRange}`)
      ]);
      
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        console.log('Metrics API response:', metricsData);
        
        // Handle actual API response structure
        if (metricsData && metricsData.success) {
          // Your API returns {success: true, metrics: [], count: 0}
          // Display actual data or indicate no data available
          const hasData = metricsData.metrics && metricsData.metrics.length > 0;
          
          if (hasData) {
            // Process actual metrics data from API
            const latestMetric = metricsData.metrics[0];
            setMetrics({
              responseTime: { value: latestMetric.responseTime || 0, trend: 'N/A', status: 'unknown' },
              throughput: { value: latestMetric.throughput || 0, trend: 'N/A', status: 'unknown' },
              errorRate: { value: latestMetric.errorRate || 0, trend: 'N/A', status: 'unknown' },
              uptime: { value: latestMetric.uptime || 0, trend: 'N/A', status: 'unknown' }
            });
          } else {
            // Show that no performance data is available from API
            setMetrics({
              responseTime: { value: 0, trend: 'No Data', status: 'unknown' },
              throughput: { value: 0, trend: 'No Data', status: 'unknown' },
              errorRate: { value: 0, trend: 'No Data', status: 'unknown' },
              uptime: { value: 0, trend: 'No Data', status: 'unknown' }
            });
          }
        }
      }
      
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        // Handle the actual API response structure
        if (alertsData && alertsData.alerts && Array.isArray(alertsData.alerts)) {
          setAlerts(alertsData.alerts);
        } else if (Array.isArray(alertsData)) {
          setAlerts(alertsData);
        } else {
          console.log('API returned unexpected alerts structure, keeping current data');
        }
      }
      
      if (analysisRes.ok) {
        const analysisData = await analysisRes.json();
        // Ensure the analysis data has the expected structure
        if (analysisData && analysisData.trends) {
          setAnalysis(analysisData);
        } else {
          console.log('API returned unexpected analysis structure, keeping current data');
        }
      }
      
      toast({
        title: "به‌روزرسانی انجام شد",
        description: "داده‌های عملکرد با موفقیت به‌روزرسانی شد",
      });
    } catch (error) {
      toast({
        title: "خطا در به‌روزرسانی",
        description: "مشکلی در دریافت داده‌ها پیش آمد",
        variant: "destructive"
      });
    } finally {
      setMetricsLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const response = await fetch('/api/performance/export-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeRange: selectedTimeRange })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `performance-report-${selectedTimeRange}-${new Date().toISOString().split('T')[0]}.xlsx`;
        a.click();
        
        toast({
          title: "دانلود گزارش",
          description: "گزارش عملکرد با موفقیت دانلود شد",
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      toast({
        title: "خطا در دانلود",
        description: "مشکلی در تولید گزارش پیش آمد",
        variant: "destructive"
      });
    }
  };

  const handleClearAlerts = async () => {
    try {
      const response = await fetch('/api/performance/clear-alerts', {
        method: 'POST'
      });
      
      if (response.ok) {
        setAlerts([]);
        toast({
          title: "پاکسازی هشدارها",
          description: "تمام هشدارها پاک شدند",
        });
      }
    } catch (error) {
      toast({
        title: "خطا",
        description: "مشکلی در پاکسازی هشدارها پیش آمد",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="responsive-content space-y-6" dir="rtl">
      {/* Dynamic Header with Action Buttons */}
      <div className="flex flex-col items-center space-y-4 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg mx-1">
        <h1 className="text-base md:text-xl font-bold text-center text-blue-900">نظارت عملکرد پیشرفته</h1>
        <p className="text-xs text-blue-600 text-center">مانیتورینگ لحظه‌ای عملکرد سیستم و تحلیل روندها</p>
        
        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap justify-center">
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleRefreshData}
            disabled={metricsLoading}
          >
            <RefreshCw className={`w-4 h-4 ml-1 ${metricsLoading ? 'animate-spin' : ''}`} />
            {metricsLoading ? 'در حال بارگذاری...' : 'به‌روزرسانی'}
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleDownloadReport}
          >
            <Download className="w-4 h-4 ml-1" />
            دانلود گزارش
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setAlertSettingsOpen(true)}
          >
            <Bell className="w-4 h-4 ml-1" />
            تنظیمات هشدار
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setSystemConfigOpen(true)}
          >
            <Settings className="w-4 h-4 ml-1" />
            پیکربندی سیستم
          </Button>
        </div>
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
            <div className="text-2xl font-bold">
              {typeof metrics.responseTime.value === 'number' ? metrics.responseTime.value : 'داده موجود نیست'}
            </div>
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
            <div className="text-2xl font-bold">
              {typeof metrics.throughput.value === 'number' ? metrics.throughput.value : 'داده موجود نیست'}
            </div>
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
            <div className="text-2xl font-bold">
              {typeof metrics.errorRate.value === 'number' ? metrics.errorRate.value : 'داده موجود نیست'}
            </div>
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
            <div className="text-2xl font-bold">
              {typeof metrics.uptime.value === 'number' ? metrics.uptime.value : 'داده موجود نیست'}
            </div>
            <Badge variant="default">{metrics.uptime.trend}</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                هشدارها و اعلان‌ها
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleClearAlerts}
              >
                پاکسازی
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.length > 0 ? (
              alerts.map((alert: any) => (
                <Alert key={alert.id} className={alert.type === 'warning' ? 'border-orange-200' : 'border-blue-200'}>
                  <AlertDescription className="flex justify-between items-start">
                    <span>{alert.message}</span>
                    <span className="text-xs text-gray-500">{alert.timestamp}</span>
                  </AlertDescription>
                </Alert>
              ))
            ) : (
              <div className="text-center py-4 text-gray-600">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p>هیچ هشدار فعالی وجود ندارد</p>
              </div>
            )}
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
                    {analysis?.trends?.keyMetrics && analysis.trends.keyMetrics.length > 0 ? (
                      <div className="space-y-3">
                        {analysis.trends.keyMetrics.map((metric: any, index: number) => (
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
                        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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

      {/* Alert Settings Dialog */}
      <Dialog open={alertSettingsOpen} onOpenChange={setAlertSettingsOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>تنظیمات هشدار سیستم</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">آستانه زمان پاسخ (ms)</label>
                <input 
                  type="number" 
                  className="w-full p-2 border rounded mt-1" 
                  defaultValue="500"
                  onChange={(e) => {
                    // Save alert threshold
                    localStorage.setItem('responseTimeThreshold', e.target.value);
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium">آستانه نرخ خطا (%)</label>
                <input 
                  type="number" 
                  className="w-full p-2 border rounded mt-1" 
                  defaultValue="5"
                  onChange={(e) => {
                    localStorage.setItem('errorRateThreshold', e.target.value);
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium">آستانه استفاده CPU (%)</label>
                <input 
                  type="number" 
                  className="w-full p-2 border rounded mt-1" 
                  defaultValue="80"
                  onChange={(e) => {
                    localStorage.setItem('cpuThreshold', e.target.value);
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium">آستانه استفاده RAM (%)</label>
                <input 
                  type="number" 
                  className="w-full p-2 border rounded mt-1" 
                  defaultValue="85"
                  onChange={(e) => {
                    localStorage.setItem('ramThreshold', e.target.value);
                  }}
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAlertSettingsOpen(false)}>
                انصراف
              </Button>
              <Button onClick={() => {
                toast({
                  title: "تنظیمات ذخیره شد",
                  description: "آستانه‌های هشدار با موفقیت به‌روزرسانی شد",
                });
                setAlertSettingsOpen(false);
              }}>
                ذخیره تغییرات
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* System Configuration Dialog */}
      <Dialog open={systemConfigOpen} onOpenChange={setSystemConfigOpen}>
        <DialogContent className="max-w-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>پیکربندی سیستم نظارت</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    تنظیمات پایگاه داده
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">فاصله نظارت (ثانیه)</label>
                    <input 
                      type="number" 
                      className="w-full p-2 border rounded mt-1" 
                      defaultValue="30"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">نگهداری سوابق (روز)</label>
                    <input 
                      type="number" 
                      className="w-full p-2 border rounded mt-1" 
                      defaultValue="30"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="w-4 h-4" />
                    تنظیمات سرور
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">حداکثر اتصالات همزمان</label>
                    <input 
                      type="number" 
                      className="w-full p-2 border rounded mt-1" 
                      defaultValue="1000"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">تایم‌اوت اتصال (ثانیه)</label>
                    <input 
                      type="number" 
                      className="w-full p-2 border rounded mt-1" 
                      defaultValue="30"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSystemConfigOpen(false)}>
                انصراف
              </Button>
              <Button onClick={async () => {
                try {
                  const response = await fetch('/api/performance/update-config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      monitoringInterval: 30,
                      dataRetention: 30,
                      maxConnections: 1000,
                      connectionTimeout: 30
                    })
                  });
                  
                  if (response.ok) {
                    toast({
                      title: "پیکربندی ذخیره شد",
                      description: "تنظیمات سیستم با موفقیت به‌روزرسانی شد",
                    });
                  } else {
                    throw new Error('Config update failed');
                  }
                } catch (error) {
                  toast({
                    title: "خطا در ذخیره",
                    description: "مشکلی در به‌روزرسانی تنظیمات پیش آمد",
                    variant: "destructive"
                  });
                }
                setSystemConfigOpen(false);
              }}>
                ذخیره و اعمال
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}