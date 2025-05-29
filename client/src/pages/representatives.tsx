import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import RepresentativeForm from "@/components/forms/representative-form";

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
}

export default function Representatives() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [telegramFilter, setTelegramFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRep, setEditingRep] = useState<Representative | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: representatives, isLoading } = useQuery<Representative[]>({
    queryKey: ['/api/representatives'],
  });

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
          <DialogContent className="max-w-2xl">
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
            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      نام / نام کاربری
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      تلفن
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      فروشگاه
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      وضعیت
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRepresentatives?.map((rep) => (
                    <tr key={rep.id} className="table-row-hover">
                      <td className="px-3 py-4">
                        <div className="text-sm font-medium text-gray-900">{rep.fullName}</div>
                        <div className="text-xs text-gray-500">@{rep.adminUsername}</div>
                        <div className="text-xs text-gray-400 md:hidden">{rep.phoneNumber || '-'}</div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500 persian-nums hidden md:table-cell">
                        {rep.phoneNumber || "-"}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500 hidden lg:table-cell">
                        {rep.storeName || "-"}
                      </td>
                      <td className="px-3 py-4">
                        {getStatusBadge(rep.status)}
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex space-x-1 space-x-reverse">
                          <Button
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEdit(rep)}
                            className="text-xs px-2 py-1"
                          >
                            ویرایش
                          </Button>
                          <Button
                            variant="ghost" 
                            size="sm"
                            className="text-blue-600 hover:text-blue-900 text-xs px-2 py-1"
                          >
                            فاکتور
                          </Button>
                          <Button
                            variant="ghost" 
                            size="sm"
                            className="text-red-600 hover:text-red-900 text-xs px-2 py-1"
                            onClick={() => handleDelete(rep.id)}
                          >
                            حذف
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
