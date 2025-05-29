import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { formatCurrency, formatPersianDate } from "@/lib/persian-utils";
import { cn } from "@/lib/utils";

interface CrmStats {
  totalCustomers: number;
  activeTickets: number;
  todayInteractions: number;
  pendingFollowups: number;
}

interface Customer {
  id: number;
  fullName: string;
  phoneNumber: string;
  email?: string;
  lastContact: string;
  status: 'active' | 'inactive' | 'prospect';
  totalValue: string;
}

interface Ticket {
  id: number;
  title: string;
  customer: string;
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  assignedTo?: string;
}

export default function CrmDashboard() {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data for CRM (in real implementation, these would come from APIs)
  const stats: CrmStats = {
    totalCustomers: 245,
    activeTickets: 18,
    todayInteractions: 34,
    pendingFollowups: 12
  };

  const recentCustomers: Customer[] = [
    {
      id: 1,
      fullName: "احمد رضایی",
      phoneNumber: "09121234567",
      email: "ahmad@example.com",
      lastContact: "2024-01-20",
      status: "active",
      totalValue: "12500000"
    },
    {
      id: 2,
      fullName: "فاطمه محمدی",
      phoneNumber: "09129876543",
      lastContact: "2024-01-19",
      status: "prospect",
      totalValue: "0"
    },
    {
      id: 3,
      fullName: "علی حسینی",
      phoneNumber: "09123456789",
      email: "ali@example.com",
      lastContact: "2024-01-18",
      status: "active",
      totalValue: "8750000"
    }
  ];

  const activeTickets: Ticket[] = [
    {
      id: 1,
      title: "مشکل در اتصال اینترنت",
      customer: "احمد رضایی",
      priority: "high",
      status: "open",
      createdAt: "2024-01-20",
      assignedTo: "سارا احمدی"
    },
    {
      id: 2,
      title: "درخواست تغییر پلن",
      customer: "فاطمه محمدی",
      priority: "medium",
      status: "in_progress",
      createdAt: "2024-01-19"
    },
    {
      id: 3,
      title: "سوال در مورد صورتحساب",
      customer: "علی حسینی",
      priority: "low",
      status: "open",
      createdAt: "2024-01-18"
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCustomerStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'prospect': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">مرکز CRM</h1>
          <p className="text-gray-600">مدیریت ارتباط با مشتریان</p>
        </div>
        <div className="flex space-x-3 space-x-reverse">
          <Button>
            <i className="fas fa-plus ml-2"></i>
            مشتری جدید
          </Button>
          <Button variant="outline">
            <i className="fas fa-ticket-alt ml-2"></i>
            تیکت جدید
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل مشتریان</CardTitle>
            <i className="fas fa-users h-4 w-4 text-muted-foreground"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers.toLocaleString('fa-IR')}</div>
            <p className="text-xs text-muted-foreground">+۱۲ نفر این ماه</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تیکت‌های فعال</CardTitle>
            <i className="fas fa-ticket-alt h-4 w-4 text-muted-foreground"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTickets.toLocaleString('fa-IR')}</div>
            <p className="text-xs text-muted-foreground">-۴ از دیروز</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تعاملات امروز</CardTitle>
            <i className="fas fa-comments h-4 w-4 text-muted-foreground"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayInteractions.toLocaleString('fa-IR')}</div>
            <p className="text-xs text-muted-foreground">+۸ از ساعت قبل</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">پیگیری‌های معلق</CardTitle>
            <i className="fas fa-clock h-4 w-4 text-muted-foreground"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingFollowups.toLocaleString('fa-IR')}</div>
            <p className="text-xs text-muted-foreground">۵ فوری</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Customers */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>مشتریان اخیر</CardTitle>
                <CardDescription>آخرین مشتریان اضافه شده</CardDescription>
              </div>
              <Button variant="outline" size="sm">مشاهده همه</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCustomers.map((customer) => (
                <div key={customer.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <i className="fas fa-user text-primary text-sm"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {customer.fullName}
                        </p>
                        <p className="text-xs text-gray-500">{customer.phoneNumber}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <Badge className={getCustomerStatusColor(customer.status)}>
                      {customer.status === 'active' ? 'فعال' : 
                       customer.status === 'inactive' ? 'غیرفعال' : 'احتمالی'}
                    </Badge>
                    <p className="text-xs text-gray-500">
                      {formatPersianDate(customer.lastContact)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Tickets */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>تیکت‌های فعال</CardTitle>
                <CardDescription>تیکت‌های نیازمند پیگیری</CardDescription>
              </div>
              <Button variant="outline" size="sm">مشاهده همه</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeTickets.map((ticket) => (
                <div key={ticket.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900 flex-1">
                      {ticket.title}
                    </h4>
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {ticket.priority === 'high' ? 'فوری' : 
                       ticket.priority === 'medium' ? 'متوسط' : 'عادی'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>مشتری: {ticket.customer}</span>
                    <Badge className={getStatusColor(ticket.status)}>
                      {ticket.status === 'open' ? 'باز' : 
                       ticket.status === 'in_progress' ? 'درحال پیگیری' : 
                       ticket.status === 'resolved' ? 'حل شده' : 'بسته'}
                    </Badge>
                  </div>
                  {ticket.assignedTo && (
                    <p className="text-xs text-gray-500 mt-1">
                      تخصیص: {ticket.assignedTo}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}