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
}

export default function Representatives() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [telegramFilter, setTelegramFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRep, setEditingRep] = useState<Representative | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'crm'>('crm');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: representativesData, isLoading } = useQuery<Representative[]>({
    queryKey: ['/api/representatives'],
  });

  // Detect user role from URL path (simple approach)
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/admin')) {
      setUserRole('admin');
    } else {
      setUserRole('crm');
    }
  }, []);

  // Representatives data is already filtered by the server based on user role
  const representatives = representativesData || [];

  const deleteRepMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/representatives/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/representatives'] });
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

  const filteredRepresentatives = representatives?.filter((rep) => {
    const matchesSearch = !searchQuery || 
      rep.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.adminUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.phoneNumber?.includes(searchQuery);

    const matchesStatus = statusFilter === "all" || rep.status === statusFilter;
    
    const matchesTelegram = telegramFilter === "all" || 
      (telegramFilter === "has_telegram" && rep.telegramId) ||
      (telegramFilter === "no_telegram" && !rep.telegramId);

    return matchesSearch && matchesStatus && matchesTelegram;
  });

  const handleEdit = (rep: Representative) => {
    setEditingRep(rep);
    setIsModalOpen(true);
  };

  const handleInvoiceView = (representativeId: number) => {
    // Project Phoenix: Fix navigation routing with proper React Router navigation
    const currentPath = window.location.pathname;
    const isAdmin = currentPath.startsWith('/admin');
    const targetPath = isAdmin ? `/admin/invoices?rep=${representativeId}` : `/invoices?rep=${representativeId}`;
    window.location.href = targetPath;
  };

  const handleDelete = (id: number) => {
    if (confirm("آیا از حذف این نماینده اطمینان دارید؟")) {
      deleteRepMutation.mutate(id);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingRep(null);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { class: "status-active", text: "فعال" },
      inactive: { class: "status-inactive", text: "غیرفعال" },
      suspended: { class: "status-pending", text: "معلق" },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { class: "status-inactive", text: status };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.class}`}>
        {statusInfo.text}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <CardTitle className="text-lg font-medium text-gray-900">مدیریت نمایندگان</CardTitle>
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

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">جستجو</label>
              <Input
                type="text"
                placeholder="نام یا نام کاربری..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Representatives Table */}
      <div className="dynamic-table-container">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="dynamic-chart-title">لیست نمایندگان</h3>
            <div className="text-sm text-gray-500">
              مجموع: {filteredRepresentatives?.length || 0} نماینده
            </div>
          </div>
          
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <table className="dynamic-table">
              <thead>
                <tr>
                  <th>نام نماینده</th>
                  <th>نام کاربری</th>
                  <th>تلگرام</th>
                  <th>نام فروشگاه</th>
                  <th>وضعیت</th>
                  <th>موجودی</th>
                  <th>مشتریان</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filteredRepresentatives?.map((rep) => (
                  <tr key={rep.id}>
                    <td>
                      <div className="font-medium">{rep.fullName || rep.adminUsername}</div>
                    </td>
                    <td>
                      <div className="font-mono text-sm">{rep.adminUsername}</div>
                    </td>
                    <td>
                      {rep.telegramId ? (
                        <div className="flex items-center gap-1">
                          <i className="fab fa-telegram text-blue-500"></i>
                          <span className="text-sm">{rep.telegramId}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">بدون شناسه</span>
                      )}
                    </td>
                    <td>
                      <div className="text-sm">{rep.storeName || 'نامشخص'}</div>
                    </td>
                    <td>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        rep.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : rep.status === 'inactive'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {rep.status === 'active' ? 'فعال' : rep.status === 'inactive' ? 'غیرفعال' : 'معلق'}
                      </span>
                    </td>
                    <td>
                      <FinancialBalance 
                        representativeId={rep.id}
                        currentBalance={rep.currentBalance || 0}
                        representativeName={rep.fullName}
                      />
                    </td>
                    <td>
                      <div className="text-sm">
                        <div className="font-medium">{rep.customerSummary?.totalActiveCustomers || 0}</div>
                        <div className="text-gray-500 text-xs">از {rep.customerSummary?.totalCustomers || 0}</div>
                      </div>
                    </td>
                    <td>
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
          )}
        </div>
      </div>
    </div>
  );
}
