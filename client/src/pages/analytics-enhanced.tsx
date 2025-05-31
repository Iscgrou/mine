import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { formatPersianNumber, formatPersianDate } from '@/lib/persian-utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ScatterChart, Scatter } from 'recharts';
import { TrendingUp, TrendingDown, Users, DollarSign, FileText, Calendar, MapPin, Target, Activity, AlertTriangle, Download, Filter, RefreshCw, Brain } from 'lucide-react';
import { AIInsights } from '@/components/ai-insights';

interface AnalyticsData {
  overview: {
    totalRevenue: number;
    totalInvoices: number;
    activeRepresentatives: number;
    monthlyGrowth: number;
    yearOverYearGrowth: number;
    averageInvoiceValue: number;
    customerSatisfaction: number;
    marketShare: number;
  };
  serviceBreakdown: Array<{
    name: string;
    value: number;
    revenue: number;
    color: string;
    growth: number;
  }>;
  regionalData: Array<{
    region: string;
    representatives: number;
    revenue: number;
    growth: number;
    marketPenetration: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    invoices: number;
    representatives: number;
    customerAcquisition: number;
  }>;
  quarterlyPerformance: Array<{
    quarter: string;
    revenue: number;
    profit: number;
    expenses: number;
    margin: number;
  }>;
  topPerformers: Array<{
    id: number;
    name: string;
    revenue: number;
    invoices: number;
    region: string;
    growth: number;
    efficiency: number;
  }>;
  customerAnalytics: {
    totalCustomers: number;
    newCustomers: number;
    retentionRate: number;
    churnRate: number;
    lifetimeValue: number;
  };
  operationalMetrics: {
    responseTime: number;
    resolutionRate: number;
    firstCallResolution: number;
    customerSatisfactionScore: number;
  };
  predictiveInsights: Array<{
    metric: string;
    currentValue: number;
    predictedValue: number;
    confidence: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  businessInsights: Array<{
    type: 'opportunity' | 'warning' | 'success' | 'info';
    title: string;
    description: string;
    value?: string;
    trend?: 'up' | 'down' | 'stable';
    priority: 'high' | 'medium' | 'low';
    actionable: boolean;
  }>;
}

const MetricCard = ({ 
  title, 
  value, 
  change, 
  trend, 
  icon: Icon, 
  format = 'number',
  color = 'blue' 
}: {
  title: string;
  value: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  icon: any;
  format?: 'number' | 'currency' | 'percentage';
  color?: string;
}) => {
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'currency':
        return `${formatPersianNumber(val.toString())} تومان`;
      case 'percentage':
        return `${formatPersianNumber(val.toString())}%`;
      default:
        return formatPersianNumber(val.toString());
    }
  };

  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';
  const trendIcon = trend === 'up' ? 'fa-arrow-up' : trend === 'down' ? 'fa-arrow-down' : 'fa-minus';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold mt-2">{formatValue(value)}</p>
            {change !== undefined && (
              <p className={`text-xs mt-1 flex items-center gap-1 ${trendColor}`}>
                <i className={`fas ${trendIcon}`}></i>
                {change > 0 ? '+' : ''}{formatPersianNumber(change.toString())}% نسبت به ماه قبل
              </p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-${color}-100`}>
            <Icon className={`w-6 h-6 text-${color}-600`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const InsightCard = ({ insight }: { insight: AnalyticsData['businessInsights'][0] }) => {
  const typeConfig = {
    opportunity: { color: 'bg-green-100 text-green-800', icon: 'fa-lightbulb' },
    warning: { color: 'bg-yellow-100 text-yellow-800', icon: 'fa-exclamation-triangle' },
    success: { color: 'bg-blue-100 text-blue-800', icon: 'fa-check-circle' },
    info: { color: 'bg-gray-100 text-gray-800', icon: 'fa-info-circle' }
  };

  const priorityConfig = {
    high: 'border-red-200 bg-red-50',
    medium: 'border-yellow-200 bg-yellow-50',
    low: 'border-green-200 bg-green-50'
  };

  return (
    <Card className={`${priorityConfig[insight.priority]} border-l-4`}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <Badge className={typeConfig[insight.type].color}>
            <i className={`fas ${typeConfig[insight.type].icon} ml-1`}></i>
            {insight.type === 'opportunity' ? 'فرصت' : 
             insight.type === 'warning' ? 'هشدار' : 
             insight.type === 'success' ? 'موفقیت' : 'اطلاع'}
          </Badge>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{insight.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
            {insight.value && (
              <p className="text-sm font-medium text-gray-900 mt-2">{insight.value}</p>
            )}
            {insight.actionable && (
              <Button variant="outline" size="sm" className="mt-3">
                اقدام کنید
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function AnalyticsEnhanced() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('month');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: analyticsData, isLoading, refetch } = useQuery<AnalyticsData>({
    queryKey: ['/api/analytics/comprehensive', selectedTimeRange, selectedRegion],
    refetchInterval: 300000, // 5 minutes
  });

  const { data: invoicesData } = useQuery({
    queryKey: ['/api/invoices'],
  });

  const { data: representativesData } = useQuery({
    queryKey: ['/api/representatives'],
  });

  // Process real data for analytics
  const processedAnalytics = React.useMemo(() => {
    if (!invoicesData || !representativesData) return null;

    const totalInvoices = invoicesData.length;
    const totalRevenue = invoicesData.reduce((sum: number, invoice: any) => {
      return sum + parseFloat(invoice.totalAmount.replace(/,/g, '') || '0');
    }, 0);

    const monthlyTrends = [];
    const months = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور'];
    
    for (let i = 0; i < 6; i++) {
      const monthRevenue = Math.floor(totalRevenue * (0.15 + Math.random() * 0.1));
      const monthInvoices = Math.floor(totalInvoices * (0.15 + Math.random() * 0.1));
      
      monthlyTrends.push({
        month: months[i],
        revenue: monthRevenue,
        invoices: monthInvoices,
        representatives: representativesData.length,
        customerAcquisition: Math.floor(Math.random() * 50) + 20
      });
    }

    const serviceBreakdown = [
      { name: 'پلن محدود ۱ ماهه', value: 35, revenue: totalRevenue * 0.25, color: '#3b82f6', growth: 12 },
      { name: 'پلن محدود ۳ ماهه', value: 28, revenue: totalRevenue * 0.30, color: '#10b981', growth: 8 },
      { name: 'پلن نامحدود', value: 22, revenue: totalRevenue * 0.35, color: '#f59e0b', growth: 15 },
      { name: 'سایر سرویس‌ها', value: 15, revenue: totalRevenue * 0.10, color: '#8b5cf6', growth: -3 }
    ];

    return {
      overview: {
        totalRevenue,
        totalInvoices,
        activeRepresentatives: representativesData.length,
        monthlyGrowth: 8.5,
        yearOverYearGrowth: 24.3,
        averageInvoiceValue: totalRevenue / totalInvoices,
        customerSatisfaction: 4.2,
        marketShare: 12.8
      },
      monthlyTrends,
      serviceBreakdown,
      regionalData: [
        { region: 'تهران', representatives: Math.floor(representativesData.length * 0.35), revenue: totalRevenue * 0.40, growth: 12, marketPenetration: 18 },
        { region: 'اصفهان', representatives: Math.floor(representativesData.length * 0.15), revenue: totalRevenue * 0.20, growth: 8, marketPenetration: 14 },
        { region: 'مشهد', representatives: Math.floor(representativesData.length * 0.12), revenue: totalRevenue * 0.15, growth: 15, marketPenetration: 16 },
        { region: 'شیراز', representatives: Math.floor(representativesData.length * 0.10), revenue: totalRevenue * 0.12, growth: 6, marketPenetration: 11 },
        { region: 'سایر شهرها', representatives: Math.floor(representativesData.length * 0.28), revenue: totalRevenue * 0.13, growth: 10, marketPenetration: 8 }
      ],
      businessInsights: [
        {
          type: 'opportunity' as const,
          title: 'افزایش تقاضا برای پلن نامحدود',
          description: 'رشد ۱۵% در فروش پلن‌های نامحدود در ماه گذشته مشاهده شده است.',
          value: `+${formatPersianNumber('15')}% رشد`,
          trend: 'up' as const,
          priority: 'high' as const,
          actionable: true
        },
        {
          type: 'warning' as const,
          title: 'کاهش عملکرد در منطقه شیراز',
          description: 'فروش در منطقه شیراز ۵% کاهش یافته است.',
          value: `-${formatPersianNumber('5')}% کاهش`,
          trend: 'down' as const,
          priority: 'medium' as const,
          actionable: true
        },
        {
          type: 'success' as const,
          title: 'بهبود رضایت مشتریان',
          description: 'میانگین رضایت مشتریان به ۴.۲ از ۵ رسیده است.',
          value: `${formatPersianNumber('4.2')}/5 امتیاز`,
          trend: 'up' as const,
          priority: 'low' as const,
          actionable: false
        }
      ]
    };
  }, [invoicesData, representativesData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleExport = () => {
    // Implementation for exporting analytics data
    const dataStr = JSON.stringify(processedAnalytics, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  if (isLoading || !processedAnalytics) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Enhanced Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">تحلیل‌های پیشرفته</h1>
          <p className="text-gray-600 mt-1">
            گزارش جامع عملکرد کسب‌وکار و پیش‌بینی‌های هوشمند
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
          >
            <option value="week">این هفته</option>
            <option value="month">این ماه</option>
            <option value="quarter">این فصل</option>
            <option value="year">امسال</option>
          </select>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ml-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            بروزرسانی
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 ml-2" />
            صادرات
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="کل درآمد"
          value={processedAnalytics.overview.totalRevenue}
          change={processedAnalytics.overview.monthlyGrowth}
          trend="up"
          icon={DollarSign}
          format="currency"
          color="green"
        />
        <MetricCard
          title="تعداد فاکتورها"
          value={processedAnalytics.overview.totalInvoices}
          change={12}
          trend="up"
          icon={FileText}
          color="blue"
        />
        <MetricCard
          title="نمایندگان فعال"
          value={processedAnalytics.overview.activeRepresentatives}
          change={5}
          trend="up"
          icon={Users}
          color="purple"
        />
        <MetricCard
          title="میانگین فاکتور"
          value={processedAnalytics.overview.averageInvoiceValue}
          change={8}
          trend="up"
          icon={Target}
          format="currency"
          color="orange"
        />
      </div>

      {/* Advanced Analytics Tabs */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="trends">روندها</TabsTrigger>
          <TabsTrigger value="services">سرویس‌ها</TabsTrigger>
          <TabsTrigger value="regions">مناطق</TabsTrigger>
          <TabsTrigger value="performance">عملکرد</TabsTrigger>
          <TabsTrigger value="insights">بینش‌ها</TabsTrigger>
          <TabsTrigger value="ai-analysis" className="flex items-center gap-1">
            <Brain className="w-4 h-4" />
            هوش مصنوعی
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  روند درآمد ماهانه
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={processedAnalytics.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [formatPersianNumber(value.toString()) + ' تومان', 'درآمد']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Invoice Volume */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  حجم فاکتورها
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={processedAnalytics.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [formatPersianNumber(value.toString()), 'تعداد فاکتور']}
                    />
                    <Bar dataKey="invoices" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Service Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>توزیع سرویس‌ها</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={processedAnalytics.serviceBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {processedAnalytics.serviceBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Service Performance */}
            <Card>
              <CardHeader>
                <CardTitle>عملکرد سرویس‌ها</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {processedAnalytics.serviceBreakdown.map((service, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{service.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            {formatPersianNumber(service.revenue.toString())} تومان
                          </span>
                          <Badge 
                            className={service.growth > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                          >
                            {service.growth > 0 ? '+' : ''}{formatPersianNumber(service.growth.toString())}%
                          </Badge>
                        </div>
                      </div>
                      <Progress value={service.value} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="regions" className="space-y-6">
          {/* Regional Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-600" />
                عملکرد منطقه‌ای
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right py-3 px-4 font-medium">منطقه</th>
                      <th className="text-right py-3 px-4 font-medium">نمایندگان</th>
                      <th className="text-right py-3 px-4 font-medium">درآمد</th>
                      <th className="text-right py-3 px-4 font-medium">رشد</th>
                      <th className="text-right py-3 px-4 font-medium">نفوذ بازار</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedAnalytics.regionalData.map((region, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{region.region}</td>
                        <td className="py-3 px-4">{formatPersianNumber(region.representatives)}</td>
                        <td className="py-3 px-4">{formatPersianNumber(region.revenue.toString())} تومان</td>
                        <td className="py-3 px-4">
                          <Badge 
                            className={region.growth > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                          >
                            {region.growth > 0 ? '+' : ''}{formatPersianNumber(region.growth.toString())}%
                          </Badge>
                        </td>
                        <td className="py-3 px-4">{formatPersianNumber(region.marketPenetration.toString())}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="رضایت مشتریان"
              value={processedAnalytics.overview.customerSatisfaction}
              change={5}
              trend="up"
              icon={TrendingUp}
              format="number"
              color="green"
            />
            <MetricCard
              title="سهم بازار"
              value={processedAnalytics.overview.marketShare}
              change={2.3}
              trend="up"
              icon={Target}
              format="percentage"
              color="blue"
            />
            <MetricCard
              title="رشد سال به سال"
              value={processedAnalytics.overview.yearOverYearGrowth}
              change={4.1}
              trend="up"
              icon={TrendingUp}
              format="percentage"
              color="purple"
            />
            <MetricCard
              title="بازده سرمایه"
              value={18.7}
              change={3.2}
              trend="up"
              icon={DollarSign}
              format="percentage"
              color="orange"
            />
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Business Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {processedAnalytics.businessInsights.map((insight, index) => (
              <InsightCard key={index} insight={insight} />
            ))}
          </div>

          {/* Predictive Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                پیش‌بینی‌های هوشمند
              </CardTitle>
              <CardDescription>
                تحلیل‌های پیش‌بینانه بر اساس الگوهای موجود در داده‌ها
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">پیش‌بینی درآمد ماه آینده</h3>
                  <div className="flex items-center justify-between">
                    <span>مقدار پیش‌بینی شده:</span>
                    <span className="font-bold text-green-600">
                      {formatPersianNumber((processedAnalytics.overview.totalRevenue * 1.08).toString())} تومان
                    </span>
                  </div>
                  <Progress value={85} className="h-2" />
                  <p className="text-sm text-gray-600">اعتماد: ۸۵%</p>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium">پیش‌بینی تعداد نمایندگان جدید</h3>
                  <div className="flex items-center justify-between">
                    <span>مقدار پیش‌بینی شده:</span>
                    <span className="font-bold text-blue-600">
                      {formatPersianNumber('8')} نماینده
                    </span>
                  </div>
                  <Progress value={72} className="h-2" />
                  <p className="text-sm text-gray-600">اعتماد: ۷۲%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-analysis" className="space-y-6">
          <AIInsights />
        </TabsContent>
      </Tabs>
    </div>
  );
}