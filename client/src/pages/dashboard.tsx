import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { formatPersianNumber } from "@/lib/persian-utils";
import { useToast } from "@/hooks/use-toast";

interface Stats {
  totalReps: number;
  activeReps: number;
  monthlyInvoices: number;
  monthlyRevenue: string;
  overduePayments: number;
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

export default function Dashboard() {
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ['/api/stats'],
  });

  const { data: recentInvoices, isLoading: invoicesLoading } = useQuery<RecentInvoice[]>({
    queryKey: ['/api/invoices'],
    select: (data) => data.slice(0, 5), // Get latest 5 invoices
  });

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

  const getStatusBadge = (status: string) => {
    const statusMap = {
      paid: { class: "status-paid", text: "پرداخت شده" },
      pending: { class: "status-pending", text: "در انتظار پرداخت" },
      overdue: { class: "status-overdue", text: "معوق" },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { class: "status-pending", text: status };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.class}`}>
        {statusInfo.text}
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="stats-card">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-users text-primary"></i>
                </div>
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">تعداد نمایندگان فعال</dt>
                  <dd className="text-2xl font-bold text-gray-900 persian-nums">
                    {formatPersianNumber(stats?.activeReps || 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="font-medium text-green-600">+۱۲%</span>
              <span className="text-gray-500 mr-2">نسبت به ماه گذشته</span>
            </div>
          </div>
        </Card>

        <Card className="stats-card">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-file-invoice-dollar text-green-600"></i>
                </div>
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">مجموع فروش این ماه</dt>
                  <dd className="text-2xl font-bold text-foreground currency-display">
                    <span className="persian-nums">{formatPersianNumber(stats?.monthlyRevenue || '0')}</span> تومان
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="font-medium text-green-600">+۸%</span>
              <span className="text-gray-500 mr-2">نسبت به ماه گذشته</span>
            </div>
          </div>
        </Card>

        <Card className="stats-card">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-clock text-yellow-600"></i>
                </div>
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">صورتحساب‌های معوق</dt>
                  <dd className="text-2xl font-bold text-gray-900 persian-nums">
                    {formatPersianNumber(stats?.overduePayments || 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="font-medium text-red-600">+۳</span>
              <span className="text-gray-500 mr-2">نسبت به هفته گذشته</span>
            </div>
          </div>
        </Card>

        <Card className="stats-card">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-percentage text-blue-600"></i>
                </div>
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">درصد وصولی</dt>
                  <dd className="text-2xl font-bold text-gray-900 persian-nums">۸۷%</dd>
                </dl>
              </div>
            </div>
          </CardContent>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="font-medium text-green-600">+۵%</span>
              <span className="text-gray-500 mr-2">نسبت به ماه گذشته</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>عملیات سریع</span>
              <i className="fas fa-bolt text-orange-500 text-xl"></i>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/import">
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center">
                    <i className="fas fa-file-upload text-primary ml-3"></i>
                    <span>آپلود فایل ODS</span>
                  </div>
                  <i className="fas fa-chevron-left text-gray-400"></i>
                </Button>
              </Link>
              
              <Link href="/admin/representatives">
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center">
                    <i className="fas fa-user-plus text-green-600 ml-3"></i>
                    <span>افزودن نماینده جدید</span>
                  </div>
                  <i className="fas fa-chevron-left text-gray-400"></i>
                </Button>
              </Link>
              
              <Link href="/admin/invoices">
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center">
                    <i className="fas fa-file-pdf text-red-600 ml-3"></i>
                    <span>تولید صورتحساب</span>
                  </div>
                  <i className="fas fa-chevron-left text-gray-400"></i>
                </Button>
              </Link>
              
              <Link href="/admin/backup">
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center">
                    <i className="fas fa-cloud-download-alt text-blue-600 ml-3"></i>
                    <span>پشتیبان‌گیری فوری</span>
                  </div>
                  <i className="fas fa-chevron-left text-gray-400"></i>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>وضعیت سیستم</span>
              <i className="fas fa-server text-blue-600 text-xl"></i>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">پایگاه داده</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full ml-2"></div>
                  <span className="text-sm font-medium text-green-600">متصل</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">سرویس فاکتورسازی</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full ml-2"></div>
                  <span className="text-sm font-medium text-green-600">فعال</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">پشتیبان‌گیری خودکار</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full ml-2"></div>
                  <span className="text-sm font-medium text-green-600">فعال</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">آخرین پشتیبان‌گیری</span>
                <span className="text-sm text-gray-500 persian-nums">۱۴۰۳/۱۰/۰۹</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>آخرین صورتحساب‌ها</CardTitle>
            <div className="flex items-center space-x-reverse space-x-3">
              <select className="text-sm border-gray-300 rounded-md">
                <option>همه نمایندگان</option>
                <option>فعال</option>
                <option>غیرفعال</option>
              </select>
              <Link href="/invoices">
                <Button variant="link" size="sm">
                  مشاهده همه
                  <i className="fas fa-arrow-left mr-1"></i>
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      نماینده
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      مبلغ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاریخ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentInvoices?.map((invoice) => (
                    <tr key={invoice.id} className="table-row-hover">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.representative?.adminUsername || 'نامشخص'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 persian-nums">
                          {formatPersianNumber(invoice.totalAmount)} تومان
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 persian-nums">
                          {new Date(invoice.createdAt).toLocaleDateString('fa-IR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-reverse space-x-2">
                          <Link href={`/admin/invoices/${invoice.id}`}>
                            <Button variant="ghost" size="sm" title="مشاهده جزئیات">
                              <i className="fas fa-eye"></i>
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="دانلود فاکتور"
                            onClick={() => {
                              window.open(`/api/invoices/${invoice.id}/download`, '_blank');
                            }}
                          >
                            <i className="fas fa-download"></i>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="ارسال به تلگرام"
                            onClick={() => {
                              // Implementation for Telegram sharing
                              toast({
                                title: "ارسال به تلگرام",
                                description: "در حال پیاده‌سازی...",
                              });
                            }}
                          >
                            <i className="fab fa-telegram"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
