import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { formatPersianNumber } from "@/lib/persian-utils";
import { useToast } from "@/hooks/use-toast";
import DailyWorkLog from "@/components/daily-work-log";
import { useNotifications } from "@/hooks/use-notifications";
import { useState, useEffect } from "react";

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
  const { addNotification } = useNotifications();
  const [mockTasks, setMockTasks] = useState([
    {
      id: '1',
      title: 'پیگیری پرداخت آقای احمدی',
      description: 'بررسی وضعیت پرداخت فاکتور شماره ۱۲۳۴ و تماس جهت تذکر',
      priority: 'high' as 'high' | 'medium' | 'urgent',
      status: 'pending' as 'pending' | 'completed' | 'overdue',
      dueDate: new Date(),
      scheduledTime: '۰۹:۰۰',
      representativeId: 1,
      representativeName: 'احمد محمدی',
      category: 'followup' as const,
      createdAt: new Date()
    },
    {
      id: '2',
      title: 'بررسی گزارش فروش ماهانه',
      description: 'تجزیه و تحلیل آمار فروش ماه جاری و تهیه گزارش',
      priority: 'medium' as 'high' | 'medium' | 'urgent',
      status: 'pending' as 'pending' | 'completed' | 'overdue',
      dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      scheduledTime: '۱۴:۳۰',
      category: 'review' as const,
      createdAt: new Date()
    },
    {
      id: '3',
      title: 'جلسه با تیم فنی',
      description: 'بحث در مورد بهینه‌سازی سرورهای V2Ray و حل مشکلات فنی',
      priority: 'urgent' as 'high' | 'medium' | 'urgent',
      status: 'overdue' as 'pending' | 'completed' | 'overdue',
      dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      scheduledTime: '۱۰:۰۰',
      category: 'meeting' as const,
      createdAt: new Date()
    }
  ]);

  // Removed problematic useEffect causing infinite re-renders

  const handleTaskComplete = async (taskId: string) => {
    setMockTasks(prev => 
      prev.map(task => 
        task.id === taskId 
          ? { ...task, status: 'completed' as const, completedAt: new Date() }
          : task
      )
    );
    
    addNotification({
      title: 'کار تکمیل شد',
      message: 'کار با موفقیت به عنوان انجام شده علامت‌گذاری شد',
      type: 'success',
      priority: 'low'
    });
  };

  const handleTaskView = (task: any) => {
    addNotification({
      title: 'جزئیات کار',
      message: `مشاهده جزئیات: ${task.title}`,
      type: 'info',
      priority: 'medium',
      actionRequired: true,
      relatedEntity: {
        type: 'task',
        id: task.id,
        name: task.title
      }
    });
  };

  const handleTaskSnooze = (taskId: string, newDate: Date) => {
    setMockTasks(prev => 
      prev.map(task => 
        task.id === taskId 
          ? { ...task, dueDate: newDate }
          : task
      )
    );
    
    addNotification({
      title: 'کار به تعویق افتاد',
      message: `کار به تاریخ ${newDate.toLocaleDateString('fa-IR')} موکول شد`,
      type: 'info',
      priority: 'low'
    });
  };

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
      {/* Dynamic Stats Grid */}
      <div className="dynamic-stats-grid">
        <div className="dynamic-stats-card">
          <div className="stats-card-header">
            <div className="stats-card-icon" style={{ background: '#3b82f6' }}>
              <i className="fas fa-users"></i>
            </div>
          </div>
          <div className="stats-card-value">{formatPersianNumber(stats?.activeReps || 0)}</div>
          <div className="stats-card-label">تعداد نمایندگان فعال</div>
          <div className="stats-card-change positive">
            +۱۲% نسبت به ماه گذشته
          </div>
        </div>

        <div className="dynamic-stats-card">
          <div className="stats-card-header">
            <div className="stats-card-icon" style={{ background: '#10b981' }}>
              <i className="fas fa-file-invoice-dollar"></i>
            </div>
          </div>
          <div className="stats-card-value">{formatPersianNumber(stats?.monthlyRevenue || '0')}</div>
          <div className="stats-card-label">مجموع فروش این ماه (تومان)</div>
          <div className="stats-card-change positive">
            +۸% نسبت به ماه گذشته
          </div>
        </div>

        <div className="dynamic-stats-card">
          <div className="stats-card-header">
            <div className="stats-card-icon" style={{ background: '#f59e0b' }}>
              <i className="fas fa-clock"></i>
            </div>
          </div>
          <div className="stats-card-value">{formatPersianNumber(stats?.overduePayments || 0)}</div>
          <div className="stats-card-label">صورتحساب‌های معوق</div>
          <div className="stats-card-change negative">
            +۳ نسبت به هفته گذشته
          </div>
        </div>

        <div className="dynamic-stats-card">
          <div className="stats-card-header">
            <div className="stats-card-icon" style={{ background: '#3b82f6' }}>
              <i className="fas fa-percentage"></i>
            </div>
          </div>
          <div className="stats-card-value">۸۷%</div>
          <div className="stats-card-label">درصد وصولی</div>
          <div className="stats-card-change positive">
            +۵% نسبت به ماه گذشته
          </div>
        </div>
      </div>

      {/* Responsive Quick Actions and Activity */}
      <div className="card-grid gap-6 mb-8">
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

      {/* Dynamic Recent Invoices Table */}
      <div className="dynamic-table-container">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="dynamic-chart-title">آخرین صورتحساب‌ها</h3>
            <div className="flex items-center gap-3">
              <select className="text-sm border border-gray-300 rounded-md px-3 py-1">
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
          
          {invoicesLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <table className="dynamic-table">
              <thead>
                <tr>
                  <th>نماینده</th>
                  <th>شماره فاکتور</th>
                  <th>مبلغ</th>
                  <th>وضعیت</th>
                  <th>تاریخ</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices?.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <div className="font-medium">
                        {invoice.representative?.adminUsername || 'نامشخص'}
                      </div>
                    </td>
                    <td>
                      <div className="font-mono text-sm">
                        {invoice.invoiceNumber}
                      </div>
                    </td>
                    <td>
                      <div className="font-medium">
                        {formatPersianNumber(invoice.totalAmount)} تومان
                      </div>
                    </td>
                    <td>
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td>
                      <div className="text-sm">
                        {new Date(invoice.createdAt).toLocaleDateString('fa-IR')}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/invoices/${invoice.id}`}>
                          <Button variant="ghost" size="sm" title="مشاهده جزئیات">
                            <i className="fas fa-eye"></i>
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="دانلود فاکتور"
                          onClick={() => window.open(`/api/invoices/${invoice.id}/download`, '_blank')}
                        >
                          <i className="fas fa-download"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Daily Work Log */}
      <div className="dynamic-chart-container">
        <div className="dynamic-chart-wrapper">
          <h3 className="dynamic-chart-title">مدیریت کارهای روزانه</h3>
          <DailyWorkLog 
            tasks={mockTasks}
            onTaskComplete={handleTaskComplete}
            onTaskView={handleTaskView}
            onTaskSnooze={handleTaskSnooze}
          />
        </div>
      </div>
    </div>
  );
}
