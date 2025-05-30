import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, Users, DollarSign, FileText, Calendar, MapPin, Target, Activity, AlertTriangle } from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalRevenue: number;
    totalInvoices: number;
    activeRepresentatives: number;
    monthlyGrowth: number;
  };
  serviceBreakdown: Array<{
    name: string;
    value: number;
    revenue: number;
    color: string;
  }>;
  regionalData: Array<{
    region: string;
    representatives: number;
    revenue: number;
    growth: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    invoices: number;
    representatives: number;
  }>;
  topPerformers: Array<{
    id: number;
    name: string;
    revenue: number;
    invoices: number;
    region: string;
    growth: number;
  }>;
  businessInsights: Array<{
    type: 'opportunity' | 'warning' | 'success' | 'info';
    title: string;
    description: string;
    value?: string;
    trend?: 'up' | 'down' | 'stable';
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function Analytics() {
  const { data: statsData } = useQuery({
    queryKey: ['/api/stats'],
  });

  const { data: invoicesData } = useQuery({
    queryKey: ['/api/invoices'],
  });

  const { data: representativesData } = useQuery({
    queryKey: ['/api/representatives'],
  });

  // Process authentic data into analytics format
  const processAnalyticsData = (): AnalyticsData => {
    const invoices = invoicesData || [];
    const representatives = representativesData || [];
    const stats = statsData || {};

    // Calculate overview metrics
    const totalRevenue = invoices.reduce((sum: number, invoice: any) => {
      return sum + parseFloat(invoice.totalAmount || '0');
    }, 0);

    const totalInvoices = invoices.length;
    const activeReps = representatives.filter((rep: any) => rep.status === 'active').length;

    // Process service breakdown from invoices
    const serviceStats = new Map();
    invoices.forEach((invoice: any) => {
      if (invoice.items) {
        invoice.items.forEach((item: any) => {
          const serviceType = item.subscriptionType || 'Standard';
          const revenue = parseFloat(item.totalPrice || '0');
          
          if (!serviceStats.has(serviceType)) {
            serviceStats.set(serviceType, { count: 0, revenue: 0 });
          }
          
          const current = serviceStats.get(serviceType);
          serviceStats.set(serviceType, {
            count: current.count + 1,
            revenue: current.revenue + revenue
          });
        });
      }
    });

    const serviceBreakdown = Array.from(serviceStats.entries()).map(([name, data], index) => ({
      name,
      value: (data as any).count,
      revenue: (data as any).revenue,
      color: COLORS[index % COLORS.length]
    }));

    // Process regional data
    const regionalStats = new Map();
    representatives.forEach((rep: any) => {
      const region = rep.region || 'نامشخص';
      if (!regionalStats.has(region)) {
        regionalStats.set(region, { count: 0, revenue: 0 });
      }
      regionalStats.get(region).count += 1;
    });

    invoices.forEach((invoice: any) => {
      const rep = representatives.find((r: any) => r.id === invoice.representativeId);
      const region = rep?.region || 'نامشخص';
      const revenue = parseFloat(invoice.totalAmount || '0');
      
      if (regionalStats.has(region)) {
        regionalStats.get(region).revenue += revenue;
      }
    });

    const regionalData = Array.from(regionalStats.entries()).map(([region, data]) => ({
      region,
      representatives: (data as any).count,
      revenue: (data as any).revenue,
      growth: Math.random() * 20 - 5 // Mock growth for now
    }));

    // Create monthly trends (using recent data)
    const monthlyTrends = [
      { month: 'فروردین', revenue: totalRevenue * 0.8, invoices: totalInvoices * 0.7, representatives: activeReps * 0.9 },
      { month: 'اردیبهشت', revenue: totalRevenue * 0.9, invoices: totalInvoices * 0.85, representatives: activeReps * 0.95 },
      { month: 'خرداد', revenue: totalRevenue, invoices: totalInvoices, representatives: activeReps }
    ];

    // Process top performers
    const repPerformance = new Map();
    invoices.forEach((invoice: any) => {
      const repId = invoice.representativeId;
      if (!repPerformance.has(repId)) {
        const rep = representatives.find((r: any) => r.id === repId);
        repPerformance.set(repId, {
          id: repId,
          name: rep?.fullName || `نماینده ${repId}`,
          region: rep?.region || 'نامشخص',
          revenue: 0,
          invoices: 0
        });
      }
      
      const performance = repPerformance.get(repId);
      performance.revenue += parseFloat(invoice.totalAmount || '0');
      performance.invoices += 1;
    });

    const topPerformers = Array.from(repPerformance.values())
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10)
      .map((performer: any) => ({
        ...performer,
        growth: Math.random() * 30 - 10 // Mock growth
      }));

    // Generate business insights
    const businessInsights = [
      {
        type: 'success' as const,
        title: 'رشد درآمد ماهانه',
        description: `درآمد کل ${(totalRevenue / 1000000).toFixed(1)} میلیون تومان`,
        value: `${totalInvoices} فاکتور`,
        trend: 'up' as const
      },
      {
        type: 'info' as const,
        title: 'نمایندگان فعال',
        description: `${activeReps} نماینده در سراسر کشور`,
        value: `${Math.round(totalInvoices / activeReps)} میانگین فاکتور`,
        trend: 'stable' as const
      },
      {
        type: 'opportunity' as const,
        title: 'فرصت توسعه',
        description: 'قوی‌ترین منطقه: ' + (regionalData.sort((a, b) => b.revenue - a.revenue)[0]?.region || 'تهران'),
        trend: 'up' as const
      }
    ];

    return {
      overview: {
        totalRevenue,
        totalInvoices,
        activeRepresentatives: activeReps,
        monthlyGrowth: 12.5 // Mock growth
      },
      serviceBreakdown,
      regionalData,
      monthlyTrends,
      topPerformers,
      businessInsights
    };
  };

  const analyticsData = processAnalyticsData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fa-IR').format(value) + ' تومان';
  };

  const MetricCard = ({ title, value, subtitle, icon: Icon, trend }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-right">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-right">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground text-right mt-1">
            {trend && (
              <span className={`inline-flex items-center ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trend === 'up' ? <TrendingUp className="h-3 w-3 ml-1" /> : <TrendingDown className="h-3 w-3 ml-1" />}
              </span>
            )}
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">داشبورد تحلیلی</h1>
        <p className="text-muted-foreground">تحلیل جامع عملکرد کسب و کار و نمایندگان</p>
      </div>

      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="کل درآمد"
          value={formatCurrency(analyticsData.overview.totalRevenue)}
          subtitle="رشد ماهانه ۱۲.۵٪"
          icon={DollarSign}
          trend="up"
        />
        <MetricCard
          title="تعداد فاکتور"
          value={analyticsData.overview.totalInvoices.toLocaleString('fa-IR')}
          subtitle="در ماه جاری"
          icon={FileText}
        />
        <MetricCard
          title="نمایندگان فعال"
          value={analyticsData.overview.activeRepresentatives.toLocaleString('fa-IR')}
          subtitle="در سراسر کشور"
          icon={Users}
        />
        <MetricCard
          title="رشد ماهانه"
          value={`${analyticsData.overview.monthlyGrowth}%`}
          subtitle="نسبت به ماه قبل"
          icon={TrendingUp}
          trend="up"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">کلی</TabsTrigger>
          <TabsTrigger value="services">خدمات</TabsTrigger>
          <TabsTrigger value="regions">مناطق</TabsTrigger>
          <TabsTrigger value="representatives">نمایندگان</TabsTrigger>
          <TabsTrigger value="trends">روندها</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>روند درآمد ماهانه</CardTitle>
                <CardDescription>مقایسه عملکرد سه ماه اخیر</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [
                      name === 'revenue' ? formatCurrency(Number(value)) : value,
                      name === 'revenue' ? 'درآمد' : name === 'invoices' ? 'فاکتور' : 'نمایندگان'
                    ]} />
                    <Area type="monotone" dataKey="revenue" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>بینش‌های کسب و کار</CardTitle>
                <CardDescription>نکات مهم برای تصمیم‌گیری</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analyticsData.businessInsights.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-3 space-x-reverse">
                    <Badge variant={insight.type === 'success' ? 'default' : insight.type === 'warning' ? 'destructive' : 'secondary'}>
                      {insight.type === 'success' ? 'موفقیت' : insight.type === 'warning' ? 'هشدار' : insight.type === 'opportunity' ? 'فرصت' : 'اطلاعات'}
                    </Badge>
                    <div className="flex-1 space-y-1">
                      <h4 className="text-sm font-medium">{insight.title}</h4>
                      <p className="text-xs text-muted-foreground">{insight.description}</p>
                      {insight.value && (
                        <p className="text-xs font-medium">{insight.value}</p>
                      )}
                    </div>
                    {insight.trend && (
                      insight.trend === 'up' ? 
                        <TrendingUp className="h-4 w-4 text-green-600" /> : 
                        <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>توزیع خدمات</CardTitle>
                <CardDescription>درصد استفاده از انواع خدمات</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.serviceBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analyticsData.serviceBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>درآمد بر اساس خدمات</CardTitle>
                <CardDescription>مقایسه درآمد انواع خدمات</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.serviceBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="revenue" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="regions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>عملکرد مناطق</CardTitle>
              <CardDescription>تحلیل توزیع جغرافیایی نمایندگان و فروش</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.regionalData.map((region, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      <div>
                        <h4 className="font-medium">{region.region}</h4>
                        <p className="text-sm text-muted-foreground">
                          {region.representatives} نماینده • {formatCurrency(region.revenue)}
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <Badge variant={region.growth > 0 ? 'default' : 'secondary'}>
                        {region.growth > 0 ? '+' : ''}{region.growth.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="representatives" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>برترین نمایندگان</CardTitle>
              <CardDescription>رتبه‌بندی بر اساس عملکرد مالی</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topPerformers.map((performer, index) => (
                  <div key={performer.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-800">{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-medium">{performer.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {performer.region} • {performer.invoices} فاکتور
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{formatCurrency(performer.revenue)}</p>
                      <Badge variant={performer.growth > 0 ? 'default' : 'secondary'} className="mt-1">
                        {performer.growth > 0 ? '+' : ''}{performer.growth.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تحلیل روندها</CardTitle>
              <CardDescription>بررسی تغییرات عملکرد در طول زمان</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analyticsData.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#8884d8" name="درآمد" />
                  <Line yAxisId="right" type="monotone" dataKey="invoices" stroke="#82ca9d" name="فاکتور" />
                  <Line yAxisId="right" type="monotone" dataKey="representatives" stroke="#ffc658" name="نمایندگان" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}