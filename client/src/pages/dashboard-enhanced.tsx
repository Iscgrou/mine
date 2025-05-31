import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { formatPersianNumber } from "@/lib/persian-utils";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/use-notifications";
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface Stats {
  totalReps: number;
  activeReps: number;
  monthlyInvoices: number;
  monthlyRevenue: string;
  overduePayments: number;
  weeklyRevenue?: number[];
  paymentStatus?: {
    paid: number;
    pending: number;
    overdue: number;
  };
  topRepresentatives?: {
    name: string;
    revenue: number;
    invoices: number;
  }[];
}

interface RecentInvoice {
  id: number;
  invoiceNumber: string;
  totalAmount: string;
  status: string;
  createdAt: string;
  representative: {
    fullName: string;
    adminUsername: string;
  } | null;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  read: boolean;
}

export default function DashboardEnhanced() {
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTimeRange, setSelectedTimeRange] = useState('week');

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<Stats>({
    queryKey: ['/api/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: recentInvoices, isLoading: invoicesLoading } = useQuery<RecentInvoice[]>({
    queryKey: ['/api/invoices'],
    select: (data) => data.slice(0, 8),
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: notifications = [] } = useQuery<NotificationItem[]>({
    queryKey: ['/api/notifications'],
    refetchInterval: 30000,
  });

  // Real-time revenue chart data
  const revenueChartData = stats?.weeklyRevenue ? stats.weeklyRevenue.map((value, index) => ({
    day: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'][index],
    revenue: value,
    invoices: Math.floor(value / 50000) // Estimated invoices based on average
  })) : [];

  // Payment status pie chart data
  const paymentStatusData = stats?.paymentStatus ? [
    { name: 'پرداخت شده', value: stats.paymentStatus.paid, color: '#10b981' },
    { name: 'در انتظار', value: stats.paymentStatus.pending, color: '#f59e0b' },
    { name: 'معوق', value: stats.paymentStatus.overdue, color: '#ef4444' }
  ] : [];

  if (statsLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <i className="fas fa-exclamation-triangle text-red-500 text-2xl mb-2"></i>
              <p className="text-red-700">خطا در بارگیری اطلاعات داشبورد</p>
              <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
                تلاش مجدد
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      paid: { class: "bg-green-100 text-green-800", text: "پرداخت شده" },
      pending: { class: "bg-yellow-100 text-yellow-800", text: "در انتظار پرداخت" },
      overdue: { class: "bg-red-100 text-red-800", text: "معوق" },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { class: "bg-gray-100 text-gray-800", text: status };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.class}`}>
        {statusInfo.text}
      </span>
    );
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'urgent') => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="p-6">
      {/* Header with real-time clock */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">داشبورد مدیریت</h1>
          <p className="text-gray-600 mt-1">
            {currentTime.toLocaleDateString('fa-IR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })} - {currentTime.toLocaleTimeString('fa-IR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={selectedTimeRange} 
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="week">هفته جاری</option>
            <option value="month">ماه جاری</option>
            <option value="quarter">سه ماه گذشته</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <i className="fas fa-sync-alt ml-2"></i>
            به‌روزرسانی
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نمایندگان فعال</CardTitle>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <i className="fas fa-users text-blue-600"></i>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPersianNumber(stats?.activeReps || 0)}</div>
            <p className="text-xs text-green-600 mt-1">
              <i className="fas fa-arrow-up mr-1"></i>
              +۱۲% نسبت به ماه گذشته
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">درآمد ماهانه</CardTitle>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <i className="fas fa-dollar-sign text-green-600"></i>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPersianNumber(stats?.monthlyRevenue || '0')}</div>
            <p className="text-xs text-green-600 mt-1">
              <i className="fas fa-arrow-up mr-1"></i>
              +۸% نسبت به ماه گذشته
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">پرداخت‌های معوق</CardTitle>
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <i className="fas fa-exclamation-triangle text-red-600"></i>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPersianNumber(stats?.overduePayments || 0)}</div>
            <p className="text-xs text-red-600 mt-1">
              <i className="fas fa-arrow-up mr-1"></i>
              +۳ نسبت به هفته گذشته
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نرخ وصولی</CardTitle>
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <i className="fas fa-percentage text-purple-600"></i>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">۸۷%</div>
            <p className="text-xs text-green-600 mt-1">
              <i className="fas fa-arrow-up mr-1"></i>
              +۵% نسبت به ماه گذشته
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <i className="fas fa-chart-line text-blue-600"></i>
              روند درآمد هفتگی
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [formatPersianNumber(value), 'درآمد (تومان)']}
                    labelFormatter={(label) => `روز: ${label}`}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <i className="fas fa-chart-line text-4xl mb-2"></i>
                  <p>داده‌های نمودار در حال بارگیری...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <i className="fas fa-chart-pie text-green-600"></i>
              وضعیت پرداخت‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <i className="fas fa-chart-pie text-4xl mb-2"></i>
                  <p>داده‌های نمودار در حال بارگیری...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Invoices */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <i className="fas fa-file-invoice text-blue-600"></i>
                آخرین فاکتورها
              </span>
              <Link href="/admin/invoices">
                <Button variant="link" size="sm">
                  مشاهده همه
                  <i className="fas fa-arrow-left mr-1"></i>
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoicesLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {recentInvoices?.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <i className="fas fa-file-invoice text-blue-600"></i>
                      </div>
                      <div>
                        <div className="font-medium">{invoice.invoiceNumber}</div>
                        <div className="text-sm text-gray-600">
                          {invoice.representative?.adminUsername || 'نامشخص'}
                        </div>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{formatPersianNumber(invoice.totalAmount)} تومان</div>
                      <div className="text-sm">{getStatusBadge(invoice.status)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <i className="fas fa-bell text-orange-600"></i>
              اعلان‌های سیستم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {notifications.length > 0 ? notifications.slice(0, 10).map((notification) => (
                <div key={notification.id} className={`p-3 border-l-4 rounded ${
                  notification.type === 'error' ? 'border-red-500 bg-red-50' :
                  notification.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                  notification.type === 'success' ? 'border-green-500 bg-green-50' :
                  'border-blue-500 bg-blue-50'
                }`}>
                  <div className="flex items-start gap-2">
                    <i className={`fas ${
                      notification.type === 'error' ? 'fa-exclamation-circle text-red-600' :
                      notification.type === 'warning' ? 'fa-exclamation-triangle text-yellow-600' :
                      notification.type === 'success' ? 'fa-check-circle text-green-600' :
                      'fa-info-circle text-blue-600'
                    } mt-1`}></i>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{notification.title}</div>
                      <div className="text-xs text-gray-600 mt-1">{notification.message}</div>
                      <div className="text-xs text-gray-500 mt-1">{notification.timestamp}</div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center text-gray-500 py-8">
                  <i className="fas fa-bell-slash text-2xl mb-2"></i>
                  <p>اعلانی موجود نیست</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-bolt text-orange-600"></i>
            عملیات سریع
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/admin/representatives">
              <Button variant="outline" className="w-full h-20 flex-col">
                <i className="fas fa-user-plus text-2xl text-green-600 mb-2"></i>
                <span>افزودن نماینده</span>
              </Button>
            </Link>
            
            <Link href="/admin/invoices">
              <Button variant="outline" className="w-full h-20 flex-col">
                <i className="fas fa-file-pdf text-2xl text-red-600 mb-2"></i>
                <span>تولید فاکتور</span>
              </Button>
            </Link>
            
            <Link href="/admin/import">
              <Button variant="outline" className="w-full h-20 flex-col">
                <i className="fas fa-file-upload text-2xl text-blue-600 mb-2"></i>
                <span>آپلود داده</span>
              </Button>
            </Link>
            
            <Link href="/admin/backup">
              <Button variant="outline" className="w-full h-20 flex-col">
                <i className="fas fa-cloud-download text-2xl text-purple-600 mb-2"></i>
                <span>پشتیبان‌گیری</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}