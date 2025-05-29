import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatPersianDate } from "@/lib/persian-utils";
import { cn } from "@/lib/utils";

interface Ticket {
  id: number;
  title: string;
  description: string;
  customer: string;
  customerPhone: string;
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  resolution?: string;
}

export default function CrmTickets() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Sample ticket data
  const tickets: Ticket[] = [
    {
      id: 1,
      title: "مشکل در اتصال اینترنت",
      description: "سرعت اینترنت بسیار کند است و قطعی‌های مکرر دارد",
      customer: "احمد رضایی",
      customerPhone: "09121234567",
      priority: "high",
      status: "open",
      category: "فنی",
      createdAt: "2024-01-20",
      updatedAt: "2024-01-20",
      assignedTo: "سارا احمدی"
    },
    {
      id: 2,
      title: "درخواست تغییر پلن",
      description: "مشتری می‌خواهد از پلن ۵۰ گیگ به پلن نامحدود تغییر کند",
      customer: "فاطمه محمدی",
      customerPhone: "09129876543",
      priority: "medium",
      status: "in_progress",
      category: "فروش",
      createdAt: "2024-01-19",
      updatedAt: "2024-01-20",
      assignedTo: "علی حسینی"
    },
    {
      id: 3,
      title: "سوال در مورد صورتحساب",
      description: "مشتری سوالاتی در مورد آیتم‌های صورتحساب ماه گذشته دارد",
      customer: "علی حسینی",
      customerPhone: "09123456789",
      priority: "low",
      status: "resolved",
      category: "مالی",
      createdAt: "2024-01-18",
      updatedAt: "2024-01-19",
      assignedTo: "مریم کریمی",
      resolution: "صورتحساب برای مشتری توضیح داده شد و مشکل حل شد"
    },
    {
      id: 4,
      title: "شکایت از کیفیت سرویس",
      description: "مشتری از کیفیت سرویس ناراضی است و درخواست بازگشت وجه دارد",
      customer: "زهرا صادقی",
      customerPhone: "09134567890",
      priority: "high",
      status: "open",
      category: "شکایت",
      createdAt: "2024-01-17",
      updatedAt: "2024-01-17"
    },
    {
      id: 5,
      title: "درخواست تنظیمات روتر",
      description: "مشتری نیاز به کمک برای تنظیمات WiFi روتر دارد",
      customer: "محمد کریمی",
      customerPhone: "09145678901",
      priority: "medium",
      status: "in_progress",
      category: "پشتیبانی",
      createdAt: "2024-01-16",
      updatedAt: "2024-01-17",
      assignedTo: "سارا احمدی"
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

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'فوری';
      case 'medium': return 'متوسط';
      case 'low': return 'عادی';
      default: return priority;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'باز';
      case 'in_progress': return 'درحال پیگیری';
      case 'resolved': return 'حل شده';
      case 'closed': return 'بسته';
      default: return status;
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.customerPhone.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">مدیریت تیکت‌ها</h1>
          <p className="text-gray-600">پیگیری و حل مشکلات مشتریان</p>
        </div>
        <Button>
          <i className="fas fa-plus ml-2"></i>
          تیکت جدید
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="جستجو در عنوان، مشتری یا شماره تماس..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                <SelectItem value="open">باز</SelectItem>
                <SelectItem value="in_progress">درحال پیگیری</SelectItem>
                <SelectItem value="resolved">حل شده</SelectItem>
                <SelectItem value="closed">بسته</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="اولویت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه اولویت‌ها</SelectItem>
                <SelectItem value="high">فوری</SelectItem>
                <SelectItem value="medium">متوسط</SelectItem>
                <SelectItem value="low">عادی</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {tickets.filter(t => t.status === 'open').length.toLocaleString('fa-IR')}
            </div>
            <p className="text-sm text-gray-600">تیکت باز</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {tickets.filter(t => t.status === 'in_progress').length.toLocaleString('fa-IR')}
            </div>
            <p className="text-sm text-gray-600">درحال پیگیری</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {tickets.filter(t => t.priority === 'high').length.toLocaleString('fa-IR')}
            </div>
            <p className="text-sm text-gray-600">فوری</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {tickets.filter(t => t.status === 'resolved').length.toLocaleString('fa-IR')}
            </div>
            <p className="text-sm text-gray-600">حل شده</p>
          </CardContent>
        </Card>
      </div>

      {/* Tickets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTickets.map((ticket) => (
          <Card key={ticket.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {getPriorityText(ticket.priority)}
                    </Badge>
                    <Badge className={getStatusColor(ticket.status)}>
                      {getStatusText(ticket.status)}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{ticket.title}</CardTitle>
                  <CardDescription>تیکت #{ticket.id}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-gray-50 p-3 rounded text-sm">
                {ticket.description}
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <i className="fas fa-user ml-2 w-4"></i>
                <span>{ticket.customer}</span>
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <i className="fas fa-phone ml-2 w-4"></i>
                <span>{ticket.customerPhone}</span>
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <i className="fas fa-tag ml-2 w-4"></i>
                <span>دسته: {ticket.category}</span>
              </div>

              {ticket.assignedTo && (
                <div className="flex items-center text-sm text-gray-600">
                  <i className="fas fa-user-tie ml-2 w-4"></i>
                  <span>مسئول: {ticket.assignedTo}</span>
                </div>
              )}

              <div className="flex items-center text-sm text-gray-600">
                <i className="fas fa-calendar ml-2 w-4"></i>
                <span>ایجاد: {formatPersianDate(ticket.createdAt)}</span>
              </div>

              {ticket.resolution && (
                <div className="bg-green-50 p-2 rounded text-xs text-green-700">
                  <i className="fas fa-check-circle ml-1"></i>
                  <strong>حل شده:</strong> {ticket.resolution}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1">
                      <i className="fas fa-eye ml-1"></i>
                      جزئیات
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>جزئیات تیکت #{ticket.id}</DialogTitle>
                      <DialogDescription>
                        {ticket.title}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">مشتری</label>
                          <p className="text-sm text-gray-600">{ticket.customer}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">شماره تماس</label>
                          <p className="text-sm text-gray-600">{ticket.customerPhone}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">اولویت</label>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {getPriorityText(ticket.priority)}
                          </Badge>
                        </div>
                        <div>
                          <label className="text-sm font-medium">وضعیت</label>
                          <Badge className={getStatusColor(ticket.status)}>
                            {getStatusText(ticket.status)}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">شرح مشکل</label>
                        <p className="text-sm text-gray-600 mt-1">{ticket.description}</p>
                      </div>
                      {ticket.resolution && (
                        <div>
                          <label className="text-sm font-medium">راه حل</label>
                          <p className="text-sm text-gray-600 mt-1">{ticket.resolution}</p>
                        </div>
                      )}
                      <div className="mt-4">
                        <label className="text-sm font-medium">پاسخ جدید</label>
                        <Textarea 
                          placeholder="پاسخ خود را اینجا بنویسید..." 
                          className="mt-2"
                        />
                        <Button className="mt-2">ارسال پاسخ</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" size="sm">
                  <i className="fas fa-edit ml-1"></i>
                  ویرایش
                </Button>
                <Button variant="outline" size="sm">
                  <i className="fas fa-phone ml-1"></i>
                  تماس
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTickets.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <i className="fas fa-search text-4xl text-gray-300 mb-4"></i>
            <p className="text-gray-500">هیچ تیکتی یافت نشد</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}