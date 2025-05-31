import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatPersianNumber, formatPersianDate } from "@/lib/persian-utils";
import InvoiceModal from "@/components/modals/invoice-modal";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface Invoice {
  id: number;
  invoiceNumber: string;
  representativeId: number;
  totalAmount: string;
  status: string;
  dueDate?: string;
  paidDate?: string;
  createdAt: string;
  paymentMethod?: string;
  notes?: string;
  representative: {
    id: number;
    fullName: string;
    adminUsername: string;
    phoneNumber?: string;
    telegramId?: string;
    storeName?: string;
  } | null;
  items?: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

interface InvoiceAnalytics {
  totalRevenue: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  averageInvoiceAmount: number;
  monthlyTrends: {
    month: string;
    revenue: number;
    count: number;
  }[];
  statusDistribution: {
    name: string;
    value: number;
    color: string;
  }[];
  topRepresentatives: {
    name: string;
    revenue: number;
    invoiceCount: number;
  }[];
}

export default function InvoicesEnhanced() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [representativeFilter, setRepresentativeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [amountFilter, setAmountFilter] = useState({ min: "", max: "" });
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "cards" | "analytics">("table");
  const [sortBy, setSortBy] = useState("created");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [searchQuery, setSearchQuery] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices, isLoading, error } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices'],
    refetchInterval: 60000,
  });

  const { data: representatives } = useQuery({
    queryKey: ['/api/representatives'],
  });

  const { data: analytics } = useQuery<InvoiceAnalytics>({
    queryKey: ['/api/invoices/analytics'],
    refetchInterval: 300000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest('PATCH', `/api/invoices/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices/analytics'] });
      toast({
        title: "موفقیت",
        description: "وضعیت فاکتور بروزرسانی شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در بروزرسانی وضعیت فاکتور",
        variant: "destructive",
      });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: (data: { ids: number[], action: string, value?: string }) =>
      apiRequest('PATCH', '/api/invoices/bulk-update', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices/analytics'] });
      setSelectedInvoices([]);
      toast({
        title: "موفقیت",
        description: "فاکتورهای انتخاب شده بروزرسانی شدند",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در بروزرسانی فاکتورها",
        variant: "destructive",
      });
    },
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/invoices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices/analytics'] });
      toast({
        title: "موفقیت",
        description: "فاکتور با موفقیت حذف شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در حذف فاکتور",
        variant: "destructive",
      });
    },
  });

  // Advanced filtering and sorting
  const filteredAndSortedInvoices = invoices
    ?.filter((invoice) => {
      const matchesSearch = !searchQuery || 
        invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.representative?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.representative?.adminUsername?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDateRange = (!dateFrom || new Date(invoice.createdAt) >= new Date(dateFrom)) &&
                              (!dateTo || new Date(invoice.createdAt) <= new Date(dateTo));

      const matchesRep = representativeFilter === "all" || 
                        invoice.representativeId.toString() === representativeFilter;

      const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;

      const amount = parseFloat(invoice.totalAmount.replace(/,/g, ''));
      const matchesAmount = (!amountFilter.min || amount >= parseFloat(amountFilter.min)) &&
                           (!amountFilter.max || amount <= parseFloat(amountFilter.max));

      return matchesSearch && matchesDateRange && matchesRep && matchesStatus && matchesAmount;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case "amount":
          aValue = parseFloat(a.totalAmount.replace(/,/g, ''));
          bValue = parseFloat(b.totalAmount.replace(/,/g, ''));
          break;
        case "created":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "representative":
          aValue = a.representative?.fullName || a.representative?.adminUsername || '';
          bValue = b.representative?.fullName || b.representative?.adminUsername || '';
          break;
        default:
          aValue = a.invoiceNumber;
          bValue = b.invoiceNumber;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Pagination
  const totalPages = Math.ceil((filteredAndSortedInvoices?.length || 0) / itemsPerPage);
  const paginatedInvoices = filteredAndSortedInvoices?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return "fas fa-sort text-gray-400";
    return sortOrder === "asc" ? "fas fa-sort-up text-blue-600" : "fas fa-sort-down text-blue-600";
  };

  const handleSelectAll = () => {
    if (selectedInvoices.length === paginatedInvoices?.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(paginatedInvoices?.map(invoice => invoice.id) || []);
    }
  };

  const handleSelectInvoice = (id: number) => {
    setSelectedInvoices(prev => 
      prev.includes(id) 
        ? prev.filter(invoiceId => invoiceId !== id)
        : [...prev, id]
    );
  };

  const handleBulkAction = (action: string) => {
    if (selectedInvoices.length === 0) {
      toast({
        title: "هشدار",
        description: "لطفاً حداقل یک فاکتور انتخاب کنید",
        variant: "destructive",
      });
      return;
    }

    switch (action) {
      case "mark_paid":
        bulkUpdateMutation.mutate({ ids: selectedInvoices, action: "status", value: "paid" });
        break;
      case "mark_pending":
        bulkUpdateMutation.mutate({ ids: selectedInvoices, action: "status", value: "pending" });
        break;
      case "mark_overdue":
        bulkUpdateMutation.mutate({ ids: selectedInvoices, action: "status", value: "overdue" });
        break;
      case "export":
        // Implement export functionality
        toast({
          title: "اطلاع",
          description: "در حال پردازش درخواست صادرات...",
        });
        break;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      paid: { class: "bg-green-100 text-green-800", text: "پرداخت شده", icon: "fa-check-circle" },
      pending: { class: "bg-yellow-100 text-yellow-800", text: "در انتظار پرداخت", icon: "fa-clock" },
      overdue: { class: "bg-red-100 text-red-800", text: "معوق", icon: "fa-exclamation-triangle" },
      cancelled: { class: "bg-gray-100 text-gray-800", text: "لغو شده", icon: "fa-times-circle" },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { 
      class: "bg-gray-100 text-gray-800", 
      text: status,
      icon: "fa-question-circle"
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${statusInfo.class}`}>
        <i className={`fas ${statusInfo.icon} mr-1`}></i>
        {statusInfo.text}
      </span>
    );
  };

  const handleInvoiceView = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const handleDownload = async (invoiceId: number) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${invoiceId}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      } else {
        toast({
          title: "خطا",
          description: "خطا در دانلود فاکتور",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در دانلود فاکتور",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("آیا از حذف این فاکتور اطمینان دارید؟")) {
      deleteInvoiceMutation.mutate(id);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <i className="fas fa-exclamation-triangle text-red-500 text-2xl mb-2"></i>
              <p className="text-red-700">خطا در بارگیری اطلاعات فاکتورها</p>
              <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
                تلاش مجدد
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">مدیریت فاکتورها</h1>
          <p className="text-gray-600 mt-1">
            مجموع {formatPersianNumber(filteredAndSortedInvoices?.length || 0)} فاکتور
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              <i className="fas fa-table"></i>
            </Button>
            <Button
              variant={viewMode === "cards" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("cards")}
            >
              <i className="fas fa-th-large"></i>
            </Button>
            <Button
              variant={viewMode === "analytics" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("analytics")}
            >
              <i className="fas fa-chart-bar"></i>
            </Button>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <i className="fas fa-plus ml-2"></i>
            فاکتور جدید
          </Button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      {viewMode === "analytics" && analytics && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-green-600">
                  {formatPersianNumber(analytics.totalRevenue.toString())}
                </div>
                <p className="text-sm text-gray-600">کل درآمد (تومان)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-blue-600">
                  {formatPersianNumber(analytics.totalInvoices)}
                </div>
                <p className="text-sm text-gray-600">تعداد کل فاکتورها</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-purple-600">
                  {formatPersianNumber(analytics.averageInvoiceAmount.toString())}
                </div>
                <p className="text-sm text-gray-600">میانگین مبلغ فاکتور</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-orange-600">
                  {formatPersianNumber(analytics.overdueInvoices)}
                </div>
                <p className="text-sm text-gray-600">فاکتورهای معوق</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trends */}
            <Card>
              <CardHeader>
                <CardTitle>روند ماهانه درآمد</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [formatPersianNumber(value), 'درآمد (تومان)']}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>توزیع وضعیت فاکتورها</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Representatives */}
          <Card>
            <CardHeader>
              <CardTitle>برترین نمایندگان بر اساس درآمد</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.topRepresentatives.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [formatPersianNumber(value), 'درآمد (تومان)']}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      {viewMode !== "analytics" && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">جستجو</label>
                <Input
                  placeholder="شماره فاکتور یا نماینده..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">از تاریخ</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تا تاریخ</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نماینده</label>
                <select 
                  className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md"
                  value={representativeFilter}
                  onChange={(e) => setRepresentativeFilter(e.target.value)}
                >
                  <option value="all">همه نمایندگان</option>
                  {representatives?.map((rep: any) => (
                    <option key={rep.id} value={rep.id}>
                      {rep.fullName || rep.adminUsername}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">وضعیت</label>
                <select 
                  className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">همه</option>
                  <option value="paid">پرداخت شده</option>
                  <option value="pending">در انتظار پرداخت</option>
                  <option value="overdue">معوق</option>
                  <option value="cancelled">لغو شده</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">مرتب‌سازی</label>
                <select 
                  className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="created">تاریخ ایجاد</option>
                  <option value="amount">مبلغ</option>
                  <option value="status">وضعیت</option>
                  <option value="representative">نماینده</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions */}
      {viewMode !== "analytics" && selectedInvoices.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {formatPersianNumber(selectedInvoices.length)} فاکتور انتخاب شده
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => handleBulkAction("mark_paid")}>
                  علامت‌گذاری پرداخت شده
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction("mark_pending")}>
                  علامت‌گذاری در انتظار
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction("mark_overdue")}>
                  علامت‌گذاری معوق
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction("export")}>
                  <i className="fas fa-download ml-2"></i>
                  صادرات
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedInvoices([])}>
                  لغو انتخاب
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoices Table/Cards */}
      {viewMode === "table" && (
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-2 p-6">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right">
                        <input
                          type="checkbox"
                          checked={selectedInvoices.length === paginatedInvoices?.length && paginatedInvoices?.length > 0}
                          onChange={handleSelectAll}
                          className="rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-right cursor-pointer" onClick={() => handleSort("invoiceNumber")}>
                        <div className="flex items-center gap-2">
                          شماره فاکتور
                          <i className={getSortIcon("invoiceNumber")}></i>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-right cursor-pointer" onClick={() => handleSort("representative")}>
                        <div className="flex items-center gap-2">
                          نماینده
                          <i className={getSortIcon("representative")}></i>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-right cursor-pointer" onClick={() => handleSort("amount")}>
                        <div className="flex items-center gap-2">
                          مبلغ
                          <i className={getSortIcon("amount")}></i>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-right cursor-pointer" onClick={() => handleSort("status")}>
                        <div className="flex items-center gap-2">
                          وضعیت
                          <i className={getSortIcon("status")}></i>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-right cursor-pointer" onClick={() => handleSort("created")}>
                        <div className="flex items-center gap-2">
                          تاریخ ایجاد
                          <i className={getSortIcon("created")}></i>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-right">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedInvoices?.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedInvoices.includes(invoice.id)}
                            onChange={() => handleSelectInvoice(invoice.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-mono text-sm font-medium">{invoice.invoiceNumber}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium">
                            {invoice.representative?.fullName || invoice.representative?.adminUsername || 'نامشخص'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {invoice.representative?.storeName}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-lg">
                            {formatPersianNumber(invoice.totalAmount)} تومان
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(invoice.status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            {formatPersianDate(invoice.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleInvoiceView(invoice)}
                              title="مشاهده جزئیات"
                            >
                              <i className="fas fa-eye"></i>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDownload(invoice.id)}
                              title="دانلود فاکتور"
                            >
                              <i className="fas fa-download"></i>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDelete(invoice.id)}
                              title="حذف"
                              className="text-red-600 hover:text-red-700"
                            >
                              <i className="fas fa-trash"></i>
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
      )}

      {/* Cards View */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            [...Array(12)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            paginatedInvoices?.map((invoice) => (
              <Card key={invoice.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6" onClick={() => handleInvoiceView(invoice)}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-mono font-medium">{invoice.invoiceNumber}</h3>
                      <p className="text-sm text-gray-500">
                        {invoice.representative?.fullName || invoice.representative?.adminUsername}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedInvoices.includes(invoice.id)}
                        onChange={() => handleSelectInvoice(invoice.id)}
                        className="rounded"
                        onClick={(e) => e.stopPropagation()}
                      />
                      {getStatusBadge(invoice.status)}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">مبلغ:</span>
                      <span className="text-sm font-medium">
                        {formatPersianNumber(invoice.totalAmount)} تومان
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">تاریخ:</span>
                      <span className="text-sm">
                        {formatPersianDate(invoice.createdAt)}
                      </span>
                    </div>
                    
                    {invoice.dueDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">سررسید:</span>
                        <span className="text-sm">
                          {formatPersianDate(invoice.dueDate)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t" onClick={(e) => e.stopPropagation()}>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleInvoiceView(invoice)}
                      className="flex-1"
                    >
                      <i className="fas fa-eye ml-2"></i>
                      مشاهده
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownload(invoice.id)}
                    >
                      <i className="fas fa-download"></i>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {viewMode !== "analytics" && totalPages > 1 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                صفحه {formatPersianNumber(currentPage)} از {formatPersianNumber(totalPages)}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <i className="fas fa-chevron-right"></i>
                </Button>
                
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = Math.max(1, currentPage - 2) + i;
                  if (pageNum > totalPages) return null;
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {formatPersianNumber(pageNum)}
                    </Button>
                  );
                })}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  <i className="fas fa-chevron-left"></i>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedInvoice ? `جزئیات فاکتور ${selectedInvoice.invoiceNumber}` : "فاکتور جدید"}
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <InvoiceModal
              invoice={selectedInvoice}
              onClose={() => {
                setIsModalOpen(false);
                setSelectedInvoice(null);
              }}
              onStatusUpdate={(id, status) => updateStatusMutation.mutate({ id, status })}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}