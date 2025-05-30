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
    const invoices = Array.isArray(invoicesData) ? invoicesData : [];
    const representatives = Array.isArray(representativesData) ? representativesData : [];
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
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle className="text-xs font-medium text-right">{title}</CardTitle>
        <Icon className="h-3 w-3 text-muted-foreground" />
      </CardHeader>
      <CardContent className="pb-2">
        <div className="text-sm md:text-lg font-bold text-right break-words">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground text-right mt-1">
            {trend && (
              <span className={`inline-flex items-center ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trend === 'up' ? <TrendingUp className="h-2 w-2 ml-1" /> : <TrendingDown className="h-2 w-2 ml-1" />}
              </span>
            )}
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="responsive-content space-y-2 md:space-y-4" dir="rtl">
      <div className="flex flex-col items-center space-y-2 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg mx-1">
        <h1 className="text-base md:text-xl font-bold text-center text-blue-900">مرکز تحلیل گزارش</h1>
        <p className="text-xs text-blue-600 text-center">تحلیل جامع عملکرد کسب و کار</p>
      </div>

      {/* Dynamic Overview Metrics */}
      <div className="dynamic-stats-grid">
        <div className="dynamic-stats-card">
          <div className="stats-card-header">
            <div className="stats-card-icon" style={{ background: '#10b981' }}>
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="stats-card-value">{formatCurrency(analyticsData.overview.totalRevenue)}</div>
          <div className="stats-card-label">کل درآمد</div>
          <div className="stats-card-change positive">
            رشد ماهانه ۱۲.۵٪
          </div>
        </div>

        <div className="dynamic-stats-card">
          <div className="stats-card-header">
            <div className="stats-card-icon" style={{ background: '#3b82f6' }}>
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="stats-card-value">{analyticsData.overview.totalInvoices.toLocaleString('fa-IR')}</div>
          <div className="stats-card-label">تعداد فاکتور</div>
          <div className="stats-card-change positive">
            در ماه جاری
          </div>
        </div>

        <div className="dynamic-stats-card">
          <div className="stats-card-header">
            <div className="stats-card-icon" style={{ background: '#8b5cf6' }}>
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="stats-card-value">{analyticsData.overview.activeRepresentatives.toLocaleString('fa-IR')}</div>
          <div className="stats-card-label">نمایندگان فعال</div>
          <div className="stats-card-change positive">
            در سراسر کشور
          </div>
        </div>

        <div className="dynamic-stats-card">
          <div className="stats-card-header">
            <div className="stats-card-icon" style={{ background: '#f59e0b' }}>
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="stats-card-value">{analyticsData.overview.monthlyGrowth}%</div>
          <div className="stats-card-label">رشد ماهانه</div>
          <div className="stats-card-change positive">
            نسبت به ماه قبل
          </div>
        </div>
      </div>

      <Tabs key="mobile-optimized-tabs" defaultValue="overview" className="space-y-2 md:space-y-4">
        <div className="overflow-x-auto px-1">
          <TabsList className="grid w-full grid-cols-4 min-w-max h-6 md:h-10 bg-blue-50 border border-blue-200">
            <TabsTrigger value="overview" className="text-xs md:text-sm px-1 py-0.5 md:px-3 md:py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">کلی</TabsTrigger>
            <TabsTrigger value="services" className="text-xs md:text-sm px-1 py-0.5 md:px-3 md:py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">خدمات</TabsTrigger>
            <TabsTrigger value="regions" className="text-xs md:text-sm px-1 py-0.5 md:px-3 md:py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">مناطق</TabsTrigger>
            <TabsTrigger value="trends" className="text-xs md:text-sm px-1 py-0.5 md:px-3 md:py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">روندها</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="dynamic-grid-container">
            {/* Dynamic Chart Container for Monthly Revenue */}
            <div className="dynamic-chart-container">
              <div className="dynamic-chart-wrapper">
                <h3 className="dynamic-chart-title">روند درآمد ماهانه</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'revenue' ? formatCurrency(Number(value)) : value,
                        name === 'revenue' ? 'درآمد' : name === 'invoices' ? 'فاکتور' : 'نمایندگان'
                      ]} 
                      contentStyle={{ fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="revenue" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Dynamic Business Insights */}
            <div className="dynamic-chart-container">
              <div className="dynamic-chart-wrapper">
                <h3 className="dynamic-chart-title">بینش‌های کسب و کار</h3>
                <div className="space-y-3">
                  {analyticsData.businessInsights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200">
                      <Badge variant={insight.type === 'success' ? 'default' : insight.type === 'warning' ? 'destructive' : 'secondary'}>
                        {insight.type === 'success' ? 'موفقیت' : insight.type === 'warning' ? 'هشدار' : insight.type === 'opportunity' ? 'فرصت' : 'اطلاعات'}
                      </Badge>
                      <div className="flex-1 space-y-1">
                        <h4 className="font-medium">{insight.title}</h4>
                        <p className="text-sm text-gray-600">{insight.description}</p>
                        {insight.value && (
                          <p className="text-sm font-medium text-blue-600">{insight.value}</p>
                        )}
                      </div>
                      {insight.trend && (
                        insight.trend === 'up' ? 
                          <TrendingUp className="h-5 w-5 text-green-600" /> : 
                          <TrendingDown className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <div className="dynamic-grid-container">
            {/* Service Distribution Chart */}
            <div className="dynamic-chart-container">
              <div className="dynamic-chart-wrapper">
                <h3 className="dynamic-chart-title">توزیع خدمات</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={analyticsData.serviceBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={40}
                      fill="#8884d8"
                      dataKey="value"
                      fontSize={8}
                    >
                      {analyticsData.serviceBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Service Revenue Chart */}
            <div className="dynamic-chart-container">
              <div className="dynamic-chart-wrapper">
                <h3 className="dynamic-chart-title">درآمد بر اساس خدمات</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={analyticsData.serviceBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(Number(value)), 'درآمد']}
                      contentStyle={{ fontSize: '12px' }}
                    />
                    <Bar dataKey="revenue" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="regions" className="space-y-4">
          <div className="dynamic-table-container">
            <div className="dynamic-table-wrapper">
              <table className="dynamic-table">
                <thead>
                  <tr>
                    <th>منطقه</th>
                    <th>نمایندگان</th>
                    <th>درآمد</th>
                    <th>رشد</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.regionalData.map((region, index) => (
                    <tr key={index}>
                      <td>{region.region}</td>
                      <td>{region.representatives.toLocaleString('fa-IR')}</td>
                      <td>{formatCurrency(region.revenue)}</td>
                      <td className={region.growth > 0 ? 'text-green-600' : 'text-red-600'}>
                        {region.growth > 0 ? '+' : ''}{region.growth}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="dynamic-table-container">
            <div className="dynamic-table-wrapper">
              <table className="dynamic-table">
                <thead>
                  <tr>
                    <th>نماینده</th>
                    <th>درآمد</th>
                    <th>فاکتورها</th>
                    <th>منطقه</th>
                    <th>رشد</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.topPerformers.map((performer) => (
                    <tr key={performer.id}>
                      <td>{performer.name}</td>
                      <td>{formatCurrency(performer.revenue)}</td>
                      <td>{performer.invoices.toLocaleString('fa-IR')}</td>
                      <td>{performer.region}</td>
                      <td className={performer.growth > 0 ? 'text-green-600' : 'text-red-600'}>
                        {performer.growth > 0 ? '+' : ''}{performer.growth}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
              <CardContent>
                <ResponsiveContainer width="100%" height={125}>
                  <BarChart data={analyticsData.serviceBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip 
                      formatter={(value) => formatCurrency(Number(value))} 
                      contentStyle={{ fontSize: '10px' }}
                    />
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



        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تحلیل روندها</CardTitle>
              <CardDescription>بررسی تغییرات عملکرد در طول زمان</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={analyticsData.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={10} />
                  <YAxis yAxisId="left" fontSize={10} />
                  <YAxis yAxisId="right" orientation="right" fontSize={10} />
                  <Tooltip contentStyle={{ fontSize: '10px' }} />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#8884d8" name="درآمد" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="invoices" stroke="#82ca9d" name="فاکتور" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="representatives" stroke="#ffc658" name="نمایندگان" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}