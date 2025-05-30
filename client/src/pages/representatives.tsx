import { useState } from "react";
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
}

export default function Representatives() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [telegramFilter, setTelegramFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRep, setEditingRep] = useState<Representative | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: representativesData, isLoading } = useQuery<Representative[]>({
    queryKey: ['/api/representatives'],
  });

  // Add balance field to representatives (0 for all since no financial data exists yet)
  const representatives = representativesData?.map(rep => ({
    ...rep,
    currentBalance: 0
  })) || [];

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

      {/* Representatives Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRepresentatives?.map((rep) => (
                <div key={rep.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {rep.fullName || rep.adminUsername}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        نام کاربری: {rep.adminUsername}
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                        {rep.phoneNumber && (
                          <span className="persian-nums">📞 {rep.phoneNumber}</span>
                        )}
                        {rep.storeName && (
                          <span>🏪 {rep.storeName}</span>
                        )}
                        {rep.telegramId && (
                          <span>📱 {rep.telegramId}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        {getStatusBadge(rep.status)}
                      </div>
                      <div className="text-center min-w-[140px]">
                        <div className="text-xs text-gray-500 mb-1">موجودی مالی</div>
                        <FinancialBalance 
                          representativeId={rep.id}
                          currentBalance={rep.currentBalance || 0}
                          representativeName={rep.fullName || rep.adminUsername}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(rep)}
                          className="text-xs px-3 py-1 h-7"
                        >
                          ویرایش
                        </Button>
                        <Button
                          variant="outline" 
                          size="sm"
                          className="text-blue-600 hover:text-blue-900 text-xs px-3 py-1 h-7"
                        >
                          فاکتور
                        </Button>
                        <Button
                          variant="outline" 
                          size="sm"
                          className="text-red-600 hover:text-red-900 text-xs px-3 py-1 h-7"
                          onClick={() => handleDelete(rep.id)}
                        >
                          حذف
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
