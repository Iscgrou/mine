import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatPersianNumber, formatPersianDate } from "@/lib/persian-utils";
import InvoiceModal from "@/components/modals/invoice-modal";

interface Invoice {
  id: number;
  invoiceNumber: string;
  representativeId: number;
  totalAmount: string;
  status: string;
  dueDate?: string;
  paidDate?: string;
  createdAt: string;
  representative: {
    id: number;
    fullName: string;
    adminUsername: string;
    phoneNumber?: string;
    telegramId?: string;
  } | null;
}

export default function Invoices() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [representativeFilter, setRepresentativeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices'],
  });

  const { data: representatives } = useQuery({
    queryKey: ['/api/representatives'],
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest('PATCH', `/api/invoices/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      toast({
        title: "موفقیت",
        description: "وضعیت فاکتور به‌روزرسانی شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در به‌روزرسانی وضعیت فاکتور",
        variant: "destructive",
      });
    },
  });

  const filteredInvoices = invoices?.filter((invoice) => {
    const matchesDateFrom = !dateFrom || new Date(invoice.createdAt) >= new Date(dateFrom);
    const matchesDateTo = !dateTo || new Date(invoice.createdAt) <= new Date(dateTo);
    const matchesRep = representativeFilter === "all" || 
      invoice.representativeId.toString() === representativeFilter;
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;

    return matchesDateFrom && matchesDateTo && matchesRep && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      paid: { class: "status-paid", text: "پرداخت شده" },
      pending: { class: "status-pending", text: "در انتظار پرداخت" },
      overdue: { class: "status-overdue", text: "معوق" },
      cancelled: { class: "status-inactive", text: "لغو شده" },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || 
      { class: "status-inactive", text: status };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.class}`}>
        {statusInfo.text}
      </span>
    );
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const handleStatusChange = (invoiceId: number, newStatus: string) => {
    updateStatusMutation.mutate({ id: invoiceId, status: newStatus });
  };

  const generateTelegramLink = (invoice: Invoice) => {
    if (!invoice.representative?.telegramId) {
      toast({
        title: "خطا",
        description: "شناسه تلگرام برای این نماینده ثبت نشده است",
        variant: "destructive",
      });
      return;
    }

    const message = `سلام ${invoice.representative.fullName}،

فاکتور جدید شما آماده است:
شماره فاکتور: ${invoice.invoiceNumber}
مبلغ: ${formatPersianNumber(invoice.totalAmount)} تومان
تاریخ سررسید: ${invoice.dueDate ? formatPersianDate(invoice.dueDate) : 'نامشخص'}

لطفا در اسرع وقت نسبت به پرداخت اقدام فرمایید.`;

    const telegramUrl = `https://t.me/${invoice.representative.telegramId.replace('@', '')}?text=${encodeURIComponent(message)}`;
    window.open(telegramUrl, '_blank');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <CardTitle className="text-lg font-medium text-gray-900">مدیریت صورتحساب‌ها</CardTitle>
        <div className="flex space-x-2 space-x-reverse">
          <Button variant="outline">
            <i className="fas fa-download ml-2"></i>
            دانلود همه
          </Button>
          <Button>
            <i className="fas fa-plus ml-2"></i>
            تولید گروهی
          </Button>
        </div>
      </div>

      {/* Invoice Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                value={representativeFilter}
                onChange={(e) => setRepresentativeFilter(e.target.value)}
              >
                <option value="all">همه نمایندگان</option>
                {representatives?.map((rep: any) => (
                  <option key={rep.id} value={rep.id.toString()}>
                    {rep.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">وضعیت</label>
              <select
                className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
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
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      شماره فاکتور
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      نماینده
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاریخ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      مبلغ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      وضعیت
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInvoices?.map((invoice) => (
                    <tr key={invoice.id} className="table-row-hover">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 persian-nums">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.representative?.fullName || 'نامشخص'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 persian-nums">
                        {formatPersianDate(invoice.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 persian-nums">
                        {formatPersianNumber(invoice.totalAmount)} تومان
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(invoice.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2 space-x-reverse">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewInvoice(invoice)}
                            title="مشاهده"
                          >
                            <i className="fas fa-eye text-blue-600"></i>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="دانلود PDF"
                          >
                            <i className="fas fa-download text-green-600"></i>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => generateTelegramLink(invoice)}
                            title="ارسال تلگرام"
                          >
                            <i className="fab fa-telegram text-blue-500"></i>
                          </Button>
                          {invoice.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(invoice.id, 'paid')}
                              title="علامت‌گذاری به عنوان پرداخت شده"
                              className="text-green-600 hover:text-green-800"
                            >
                              <i className="fas fa-check"></i>
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

      {/* Invoice Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>جزئیات فاکتور</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <InvoiceModal 
              invoice={selectedInvoice} 
              onClose={() => setIsModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
