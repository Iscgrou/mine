import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, Clock, Cpu, Database, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface HealthMetrics {
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  responseTime: number;
  errorRate: number;
  activeConnections: number;
  databaseConnections: number;
}

interface SystemStatus {
  status: 'healthy' | 'warning' | 'critical';
  score: number;
  issues: Array<{
    type: string;
    severity: string;
    description: string;
    suggestedAction: string;
  }>;
  recommendations: string[];
  trends: Array<{
    metric: string;
    direction: string;
    changePercent: number;
    timeframe: string;
  }>;
}

interface AIPerformance {
  averageResponseTime: number;
  successRate: number;
  qualityScore: number;
  commonIssues: string[];
}

export default function AegisDashboard() {
  const { data: systemStatus, isLoading: statusLoading } = useQuery<SystemStatus>({
    queryKey: ['/api/aegis/health'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery<HealthMetrics[]>({
    queryKey: ['/api/aegis/metrics'],
    refetchInterval: 30000,
  });

  const { data: aiPerformance, isLoading: aiLoading } = useQuery<AIPerformance>({
    queryKey: ['/api/aegis/ai-performance'],
    refetchInterval: 60000, // Refresh every minute
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const latestMetrics = metrics && metrics.length > 0 ? metrics[metrics.length - 1] : null;

  if (statusLoading || metricsLoading || aiLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">پروژه ایجیس - داشبورد نظارت</h1>
          <p className="text-muted-foreground">سیستم نظارت هوشمند و تحلیل عملکرد</p>
        </div>
        {systemStatus && (
          <div className="flex items-center gap-2">
            {getStatusIcon(systemStatus.status)}
            <span className={`font-medium ${getStatusColor(systemStatus.status)}`}>
              {systemStatus.status === 'healthy' ? 'سالم' : 
               systemStatus.status === 'warning' ? 'هشدار' : 'بحرانی'}
            </span>
          </div>
        )}
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">امتیاز سیستم</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStatus?.score || 0}</div>
            <Progress value={systemStatus?.score || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">استفاده از CPU</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestMetrics?.cpuUsage.toFixed(1) || '0'}%</div>
            <Progress value={latestMetrics?.cpuUsage || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">استفاده از حافظه</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestMetrics?.memoryUsage.toFixed(1) || '0'}%</div>
            <Progress value={latestMetrics?.memoryUsage || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">زمان پاسخ</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestMetrics?.responseTime.toFixed(0) || '0'}ms</div>
            <div className="text-xs text-muted-foreground mt-1">
              میانگین پاسخ API
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نمای کلی</TabsTrigger>
          <TabsTrigger value="issues">مسائل</TabsTrigger>
          <TabsTrigger value="ai">عملکرد AI</TabsTrigger>
          <TabsTrigger value="trends">روندها</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>توصیه‌های سیستم</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {systemStatus?.recommendations.map((rec, index) => (
                    <div key={index} className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>آمار اتصالات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">اتصالات فعال</span>
                    <span className="font-medium">{latestMetrics?.activeConnections || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">اتصالات دیتابیس</span>
                    <span className="font-medium">{latestMetrics?.databaseConnections || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">نرخ خطا</span>
                    <span className="font-medium">{latestMetrics?.errorRate.toFixed(2) || '0'}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="issues" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>مسائل شناسایی شده</CardTitle>
            </CardHeader>
            <CardContent>
              {systemStatus?.issues.length ? (
                <div className="space-y-4">
                  {systemStatus.issues.map((issue, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{issue.description}</h4>
                        <Badge variant={
                          issue.severity === 'critical' ? 'destructive' : 
                          issue.severity === 'high' ? 'destructive' : 'secondary'
                        }>
                          {issue.severity === 'critical' ? 'بحرانی' :
                           issue.severity === 'high' ? 'مهم' :
                           issue.severity === 'medium' ? 'متوسط' : 'کم'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        نوع: {issue.type}
                      </p>
                      <p className="text-sm bg-green-50 text-green-800 p-2 rounded">
                        <strong>اقدام پیشنهادی:</strong> {issue.suggestedAction}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-lg font-medium text-green-600">هیچ مسئله‌ای شناسایی نشد</p>
                  <p className="text-sm text-muted-foreground">سیستم در وضعیت مطلوب عمل می‌کند</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>زمان پاسخ AI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {aiPerformance?.averageResponseTime.toFixed(0) || '0'}ms
                </div>
                <p className="text-sm text-muted-foreground">میانگین پاسخ Nova</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>نرخ موفقیت</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {aiPerformance?.successRate.toFixed(1) || '0'}%
                </div>
                <Progress value={aiPerformance?.successRate || 0} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>امتیاز کیفیت</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {aiPerformance?.qualityScore.toFixed(1) || '0'}
                </div>
                <Progress value={aiPerformance?.qualityScore || 0} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {aiPerformance?.commonIssues.length ? (
            <Card>
              <CardHeader>
                <CardTitle>مسائل رایج AI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {aiPerformance.commonIssues.map((issue, index) => (
                    <div key={index} className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-800">{issue}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>تحلیل روندها</CardTitle>
            </CardHeader>
            <CardContent>
              {systemStatus?.trends.length ? (
                <div className="space-y-4">
                  {systemStatus.trends.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{trend.metric}</p>
                        <p className="text-sm text-muted-foreground">در {trend.timeframe} گذشته</p>
                      </div>
                      <div className="text-left">
                        <Badge variant={
                          trend.direction === 'improving' ? 'default' :
                          trend.direction === 'stable' ? 'secondary' : 'destructive'
                        }>
                          {trend.direction === 'improving' ? 'بهبود' :
                           trend.direction === 'stable' ? 'پایدار' : 'کاهش'}
                        </Badge>
                        <p className="text-sm mt-1">{trend.changePercent.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">اطلاعات کافی برای تحلیل روند موجود نیست</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}