import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatPersianDate } from "@/lib/persian-utils";
import { cn } from "@/lib/utils";

interface Customer {
  id: number;
  fullName: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  lastContact: string;
  status: 'active' | 'inactive' | 'prospect';
  totalValue: string;
  notes?: string;
  source: string;
  assignedTo?: string;
}

export default function CrmCustomers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Sample customer data
  const customers: Customer[] = [
    {
      id: 1,
      fullName: "احمد رضایی",
      phoneNumber: "09121234567",
      email: "ahmad@example.com",
      address: "تهران، خیابان ولیعصر، پلاک ۱۲۳",
      lastContact: "2024-01-20",
      status: "active",
      totalValue: "12500000",
      notes: "مشتری وفادار، همیشه به موقع پرداخت می‌کند",
      source: "تماس تلفنی",
      assignedTo: "سارا احمدی"
    },
    {
      id: 2,
      fullName: "فاطمه محمدی",
      phoneNumber: "09129876543",
      email: "fateme@example.com",
      address: "اصفهان، خیابان چهارباغ، پلاک ۴۵",
      lastContact: "2024-01-19",
      status: "prospect",
      totalValue: "0",
      notes: "علاقمند به پلن نامحدود",
      source: "وب‌سایت",
      assignedTo: "علی حسینی"
    },
    {
      id: 3,
      fullName: "علی حسینی",
      phoneNumber: "09123456789",
      email: "ali@example.com",
      address: "شیراز، خیابان زند، پلاک ۶۷",
      lastContact: "2024-01-18",
      status: "active",
      totalValue: "8750000",
      source: "معرفی دوستان",
      assignedTo: "مریم کریمی"
    },
    {
      id: 4,
      fullName: "زهرا صادقی",
      phoneNumber: "09134567890",
      email: "zahra@example.com",
      lastContact: "2024-01-15",
      status: "inactive",
      totalValue: "3200000",
      notes: "قطع ارتباط از ماه گذشته",
      source: "تبلیغات آنلاین",
      assignedTo: "سارا احمدی"
    },
    {
      id: 5,
      fullName: "محمد کریمی",
      phoneNumber: "09145678901",
      lastContact: "2024-01-14",
      status: "prospect",
      totalValue: "0",
      notes: "درحال بررسی پلان‌های مختلف",
      source: "تماس تلفنی",
      assignedTo: "علی حسینی"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'prospect': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'فعال';
      case 'inactive': return 'غیرفعال';
      case 'prospect': return 'احتمالی';
      default: return status;
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phoneNumber.includes(searchTerm) ||
                         (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">مدیریت مشتریان</h1>
          <p className="text-gray-600">مشاهده و مدیریت اطلاعات مشتریان</p>
        </div>
        <Button>
          <i className="fas fa-plus ml-2"></i>
          مشتری جدید
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="جستجو در نام، تلفن یا ایمیل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="فیلتر وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                <SelectItem value="active">فعال</SelectItem>
                <SelectItem value="inactive">غیرفعال</SelectItem>
                <SelectItem value="prospect">احتمالی</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {customers.filter(c => c.status === 'active').length.toLocaleString('fa-IR')}
            </div>
            <p className="text-sm text-gray-600">مشتری فعال</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {customers.filter(c => c.status === 'prospect').length.toLocaleString('fa-IR')}
            </div>
            <p className="text-sm text-gray-600">مشتری احتمالی</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-600">
              {customers.filter(c => c.status === 'inactive').length.toLocaleString('fa-IR')}
            </div>
            <p className="text-sm text-gray-600">مشتری غیرفعال</p>
          </CardContent>
        </Card>
      </div>

      {/* Customers Grid - Responsive Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <i className="fas fa-user text-primary"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{customer.fullName}</CardTitle>
                    <CardDescription>{customer.phoneNumber}</CardDescription>
                  </div>
                </div>
                <Badge className={getStatusColor(customer.status)}>
                  {getStatusText(customer.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {customer.email && (
                <div className="flex items-center text-sm text-gray-600">
                  <i className="fas fa-envelope ml-2 w-4"></i>
                  <span className="truncate">{customer.email}</span>
                </div>
              )}
              
              <div className="flex items-center text-sm text-gray-600">
                <i className="fas fa-calendar ml-2 w-4"></i>
                <span>آخرین تماس: {formatPersianDate(customer.lastContact)}</span>
              </div>

              {customer.assignedTo && (
                <div className="flex items-center text-sm text-gray-600">
                  <i className="fas fa-user-tie ml-2 w-4"></i>
                  <span>مسئول: {customer.assignedTo}</span>
                </div>
              )}

              <div className="flex items-center text-sm text-gray-600">
                <i className="fas fa-money-bill ml-2 w-4"></i>
                <span>کل خرید: {parseInt(customer.totalValue).toLocaleString('fa-IR')} تومان</span>
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <i className="fas fa-source ml-2 w-4"></i>
                <span>منبع: {customer.source}</span>
              </div>

              {customer.notes && (
                <div className="bg-gray-50 p-2 rounded text-xs text-gray-600">
                  <i className="fas fa-sticky-note ml-1"></i>
                  {customer.notes}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1">
                      <i className="fas fa-eye ml-1"></i>
                      مشاهده
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>جزئیات مشتری</DialogTitle>
                      <DialogDescription>
                        اطلاعات کامل {customer.fullName}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">نام کامل</label>
                          <p className="text-sm text-gray-600">{customer.fullName}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">شماره تلفن</label>
                          <p className="text-sm text-gray-600">{customer.phoneNumber}</p>
                        </div>
                        {customer.email && (
                          <div>
                            <label className="text-sm font-medium">ایمیل</label>
                            <p className="text-sm text-gray-600">{customer.email}</p>
                          </div>
                        )}
                        <div>
                          <label className="text-sm font-medium">وضعیت</label>
                          <Badge className={getStatusColor(customer.status)}>
                            {getStatusText(customer.status)}
                          </Badge>
                        </div>
                      </div>
                      {customer.address && (
                        <div>
                          <label className="text-sm font-medium">آدرس</label>
                          <p className="text-sm text-gray-600">{customer.address}</p>
                        </div>
                      )}
                      {customer.notes && (
                        <div>
                          <label className="text-sm font-medium">یادداشت‌ها</label>
                          <p className="text-sm text-gray-600">{customer.notes}</p>
                        </div>
                      )}
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

      {filteredCustomers.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <i className="fas fa-search text-4xl text-gray-300 mb-4"></i>
            <p className="text-gray-500">هیچ مشتری‌ای یافت نشد</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}