import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import RepresentativeForm from "@/components/forms/representative-form";
import { FinancialBalance } from "@/components/ui/financial-balance";
import { formatPersianNumber } from "@/lib/persian-utils";

interface Representative {
  id: number;
  fullName: string;
  adminUsername: string;
  telegramId?: string;
  phoneNumber?: string;
  storeName?: string;
  limitedPrice1Month?: string;
  limitedPrice2Month?: string;
  limitedPrice3Month?: string;
  limitedPrice4Month?: string;
  limitedPrice5Month?: string;
  limitedPrice6Month?: string;
  unlimitedMonthlyPrice?: string;
  status: string;
  createdAt: string;
  currentBalance?: number;
  customerSummary?: {
    totalActiveCustomers: number;
    totalCustomers: number;
    lastCustomerActivity: string | null;
  };
  monthlyRevenue?: number;
  totalInvoices?: number;
  lastLoginAt?: string;
  joinedAt?: string;
}

interface RepresentativeAnalytics {
  totalRevenue: number;
  averageMonthlyRevenue: number;
  topPerformers: Representative[];
  statusDistribution: {
    active: number;
    inactive: number;
    suspended: number;
  };
  revenueGrowth: number;
}

export default function RepresentativesEnhanced() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [telegramFilter, setTelegramFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRep, setEditingRep] = useState<Representative | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'crm'>('crm');
  const [selectedReps, setSelectedReps] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: representativesData, isLoading, error } = useQuery<Representative[]>({
    queryKey: ['/api/representatives'],
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: analytics } = useQuery<RepresentativeAnalytics>({
    queryKey: ['/api/representatives/analytics'],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // Detect user role from URL path
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/admin')) {
      setUserRole('admin');
    } else {
      setUserRole('crm');
    }
  }, []);

  const representatives = representativesData || [];

  const deleteRepMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/representatives/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/representatives'] });
      queryClient.invalidateQueries({ queryKey: ['/api/representatives/analytics'] });
      toast({
        title: "موفقیت",
        description: "نماینده با موفقیت حذف شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در حذف نماینده",
        variant: "destructive",
      });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: (data: { ids: number[], status: string }) => 
      apiRequest('PATCH', '/api/representatives/bulk-update', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/representatives'] });
      setSelectedReps([]);
      toast({
        title: "موفقیت",
        description: "نمایندگان انتخاب شده بروزرسانی شدند",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در بروزرسانی نمایندگان",
        variant: "destructive",
      });
    },
  });

  // Advanced filtering and sorting
  const filteredAndSortedRepresentatives = representatives
    ?.filter((rep) => {
      const matchesSearch = !searchQuery || 
        rep.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rep.adminUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rep.phoneNumber?.includes(searchQuery) ||
        rep.storeName?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || rep.status === statusFilter;
      
      const matchesTelegram = telegramFilter === "all" || 
        (telegramFilter === "has_telegram" && rep.telegramId) ||
        (telegramFilter === "no_telegram" && !rep.telegramId);

      return matchesSearch && matchesStatus && matchesTelegram;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case "name":
          aValue = a.fullName || a.adminUsername;
          bValue = b.fullName || b.adminUsername;
          break;
        case "revenue":
          aValue = a.monthlyRevenue || 0;
          bValue = b.monthlyRevenue || 0;
          break;
        case "customers":
          aValue = a.customerSummary?.totalActiveCustomers || 0;
          bValue = b.customerSummary?.totalActiveCustomers || 0;
          break;
        case "balance":
          aValue = a.currentBalance || 0;
          bValue = b.currentBalance || 0;
          break;
        case "created":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          aValue = a.fullName || a.adminUsername;
          bValue = b.fullName || b.adminUsername;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Pagination
  const totalPages = Math.ceil((filteredAndSortedRepresentatives?.length || 0) / itemsPerPage);
  const paginatedRepresentatives = filteredAndSortedRepresentatives?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleEdit = (rep: Representative) => {
    setEditingRep(rep);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("آیا از حذف این نماینده اطمینان دارید؟")) {
      deleteRepMutation.mutate(id);
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedReps.length === 0) {
      toast({
        title: "هشدار",
        description: "لطفاً حداقل یک نماینده انتخاب کنید",
        variant: "destructive",
      });
      return;
    }

    switch (action) {
      case "activate":
        bulkUpdateMutation.mutate({ ids: selectedReps, status: "active" });
        break;
      case "deactivate":
        bulkUpdateMutation.mutate({ ids: selectedReps, status: "inactive" });
        break;
      case "suspend":
        bulkUpdateMutation.mutate({ ids: selectedReps, status: "suspended" });
        break;
    }
  };

  const handleSelectAll = () => {
    if (selectedReps.length === paginatedRepresentatives?.length) {
      setSelectedReps([]);
    } else {
      setSelectedReps(paginatedRepresentatives?.map(rep => rep.id) || []);
    }
  };

  const handleSelectRep = (id: number) => {
    setSelectedReps(prev => 
      prev.includes(id) 
        ? prev.filter(repId => repId !== id)
        : [...prev, id]
    );
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingRep(null);
  };

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

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { class: "bg-green-100 text-green-800", text: "فعال" },
      inactive: { class: "bg-gray-100 text-gray-800", text: "غیرفعال" },
      suspended: { class: "bg-yellow-100 text-yellow-800", text: "معلق" },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { class: "bg-gray-100 text-gray-800", text: status };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusInfo.class}`}>
        {statusInfo.text}
      </span>
    );
  };

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <i className="fas fa-exclamation-triangle text-red-500 text-2xl mb-2"></i>
              <p className="text-red-700">خطا در بارگیری اطلاعات نمایندگان</p>
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
      {/* Header with Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">مدیریت نمایندگان</h1>
              <p className="text-gray-600 mt-1">
                مجموع {formatPersianNumber(representatives.length)} نماینده
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
              </div>
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <i className="fas fa-plus ml-2"></i>
                    نماینده جدید
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingRep ? "ویرایش نماینده" : "نماینده جدید"}</DialogTitle>
                  </DialogHeader>
                  <RepresentativeForm 
                    representative={editingRep} 
                    onSuccess={handleModalClose}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Quick Stats */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-green-600">
                    {formatPersianNumber(analytics.statusDistribution.active)}
                  </div>
                  <p className="text-sm text-gray-600">نمایندگان فعال</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatPersianNumber(analytics.totalRevenue.toString())}
                  </div>
                  <p className="text-sm text-gray-600">کل درآمد</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatPersianNumber(analytics.averageMonthlyRevenue.toString())}
                  </div>
                  <p className="text-sm text-gray-600">میانگین درآمد ماهانه</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-orange-600">
                    {analytics.revenueGrowth > 0 ? '+' : ''}{formatPersianNumber(analytics.revenueGrowth.toString())}%
                  </div>
                  <p className="text-sm text-gray-600">رشد درآمد</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Top Performers Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <i className="fas fa-trophy text-yellow-500"></i>
              برترین نمایندگان
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.topPerformers.slice(0, 5).map((rep, index) => (
                <div key={rep.id} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-100 text-gray-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{rep.fullName || rep.adminUsername}</div>
                    <div className="text-xs text-gray-500">
                      {formatPersianNumber(rep.monthlyRevenue?.toString() || '0')} تومان
                    </div>
                  </div>
                </div>
              )) || (
                <div className="text-center text-gray-500 py-4">
                  <i className="fas fa-chart-line text-2xl mb-2"></i>
                  <p className="text-sm">داده‌های عملکرد در حال بارگیری...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">جستجو</label>
              <Input
                type="text"
                placeholder="نام، نام کاربری، شماره تلفن یا نام فروشگاه..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">وضعیت</label>
              <select 
                className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">همه</option>
                <option value="active">فعال</option>
                <option value="inactive">غیرفعال</option>
                <option value="suspended">معلق</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">تلگرام</label>
              <select 
                className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                value={telegramFilter}
                onChange={(e) => setTelegramFilter(e.target.value)}
              >
                <option value="all">همه</option>
                <option value="has_telegram">دارای شناسه</option>
                <option value="no_telegram">بدون شناسه</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">مرتب‌سازی</label>
              <select 
                className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name">نام</option>
                <option value="revenue">درآمد</option>
                <option value="customers">تعداد مشتریان</option>
                <option value="balance">موجودی</option>
                <option value="created">تاریخ عضویت</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedReps.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {formatPersianNumber(selectedReps.length)} نماینده انتخاب شده
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => handleBulkAction("activate")}>
                  فعال‌سازی
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction("deactivate")}>
                  غیرفعال‌سازی
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction("suspend")}>
                  تعلیق
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedReps([])}>
                  لغو انتخاب
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Representatives Table/Cards */}
      {viewMode === "table" ? (
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
                          checked={selectedReps.length === paginatedRepresentatives?.length && paginatedRepresentatives?.length > 0}
                          onChange={handleSelectAll}
                          className="rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-right cursor-pointer" onClick={() => handleSort("name")}>
                        <div className="flex items-center gap-2">
                          نام نماینده
                          <i className={getSortIcon("name")}></i>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-right">نام کاربری</th>
                      <th className="px-6 py-3 text-right">تلگرام</th>
                      <th className="px-6 py-3 text-right">نام فروشگاه</th>
                      <th className="px-6 py-3 text-right">وضعیت</th>
                      <th className="px-6 py-3 text-right cursor-pointer" onClick={() => handleSort("balance")}>
                        <div className="flex items-center gap-2">
                          موجودی
                          <i className={getSortIcon("balance")}></i>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-right cursor-pointer" onClick={() => handleSort("customers")}>
                        <div className="flex items-center gap-2">
                          مشتریان
                          <i className={getSortIcon("customers")}></i>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-right cursor-pointer" onClick={() => handleSort("revenue")}>
                        <div className="flex items-center gap-2">
                          درآمد ماهانه
                          <i className={getSortIcon("revenue")}></i>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-right">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedRepresentatives?.map((rep) => (
                      <tr key={rep.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedReps.includes(rep.id)}
                            onChange={() => handleSelectRep(rep.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium">{rep.fullName || rep.adminUsername}</div>
                          <div className="text-sm text-gray-500">{rep.phoneNumber}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-mono text-sm">{rep.adminUsername}</div>
                        </td>
                        <td className="px-6 py-4">
                          {rep.telegramId ? (
                            <div className="flex items-center gap-1">
                              <i className="fab fa-telegram text-blue-500"></i>
                              <span className="text-sm">{rep.telegramId}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">بدون شناسه</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">{rep.storeName || 'نامشخص'}</div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(rep.status)}
                        </td>
                        <td className="px-6 py-4">
                          <FinancialBalance 
                            representativeId={rep.id}
                            currentBalance={rep.currentBalance || 0}
                            representativeName={rep.fullName}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium">{formatPersianNumber(rep.customerSummary?.totalActiveCustomers || 0)}</div>
                            <div className="text-gray-500 text-xs">از {formatPersianNumber(rep.customerSummary?.totalCustomers || 0)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium">
                            {formatPersianNumber(rep.monthlyRevenue?.toString() || '0')} تومان
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEdit(rep)}
                              title="ویرایش"
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                            {userRole === 'admin' && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDelete(rep.id)}
                                title="حذف"
                                className="text-red-600 hover:text-red-700"
                              >
                                <i className="fas fa-trash"></i>
                              </Button>
                            )}
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
      ) : (
        // Cards View
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
            paginatedRepresentatives?.map((rep) => (
              <Card key={rep.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-medium">{rep.fullName || rep.adminUsername}</h3>
                      <p className="text-sm text-gray-500">@{rep.adminUsername}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedReps.includes(rep.id)}
                        onChange={() => handleSelectRep(rep.id)}
                        className="rounded"
                      />
                      {getStatusBadge(rep.status)}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">فروشگاه:</span>
                      <span className="text-sm font-medium">{rep.storeName || 'نامشخص'}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">مشتریان:</span>
                      <span className="text-sm font-medium">
                        {formatPersianNumber(rep.customerSummary?.totalActiveCustomers || 0)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">درآمد ماهانه:</span>
                      <span className="text-sm font-medium">
                        {formatPersianNumber(rep.monthlyRevenue?.toString() || '0')} تومان
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">تلگرام:</span>
                      {rep.telegramId ? (
                        <div className="flex items-center gap-1">
                          <i className="fab fa-telegram text-blue-500"></i>
                          <span className="text-xs">{rep.telegramId}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">بدون شناسه</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEdit(rep)}
                      className="flex-1"
                    >
                      <i className="fas fa-edit ml-2"></i>
                      ویرایش
                    </Button>
                    {userRole === 'admin' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(rep.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
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
    </div>
  );
}