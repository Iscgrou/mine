import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Download, Calculator, Send, Trash2, Edit, Check } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Invoice {
  id: number;
  invoiceNumber: string;
  representative: {
    id: number;
    fullName: string;
    adminUsername: string;
  } | null;
  batch: {
    id: number;
    batchName: string;
    fileName: string;
  } | null;
  totalAmount: string;
  baseAmount: string;
  status: string;
  createdAt: string;
  dueDate: string | null;
  autoCalculated: boolean;
  priceSource: string;
  telegramSent: boolean;
  sentToRepresentative: boolean;
}

interface InvoiceBatch {
  id: number;
  batchName: string;
  fileName: string;
  totalInvoices: number;
  totalAmount: string;
  processingStatus: string;
  uploadDate: string;
}

export default function InvoicesPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch invoices with real-time updates
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
    refetchInterval: 5000, // Real-time updates every 5 seconds
  });

  // File upload mutation for JSON invoice imports
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/invoices/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "فایل با موفقیت آپلود شد",
        description: "فاکتورها در حال پردازش هستند",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setSelectedFile(null);
    },
    onError: () => {
      toast({
        title: "خطا در آپلود فایل",
        description: "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    },
  });

  // Send to Telegram mutation
  const sendToTelegramMutation = useMutation({
    mutationFn: async (invoiceId: number) => {
      const response = await fetch(`/api/invoices/${invoiceId}/send-telegram`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to send");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "ارسال به تلگرام",
        description: "فاکتور با موفقیت ارسال شد",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    },
  });

  // Delete invoice mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: number) => {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "فاکتور حذف شد",
        description: "فاکتور با موفقیت حذف گردید",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    },
  });

  const handleFileUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "overdue": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid": return "پرداخت شده";
      case "pending": return "در انتظار";
      case "overdue": return "معوقه";
      default: return status;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">مدیریت صورتحساب‌ها</h1>
          <p className="text-gray-600 mt-2">سیستم فاکتورسازی مبتنی بر JSON با محاسبه خودکار کمیسیون</p>
        </div>
      </div>

      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            آپلود فایل JSON فاکتورها
          </CardTitle>
          <CardDescription>
            فایل JSON حاوی اطلاعات فاکتورها را آپلود کنید تا به صورت خودکار پردازش شود
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".json"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="flex-1"
            />
            <Button
              onClick={handleFileUpload}
              disabled={!selectedFile || uploadMutation.isPending}
              className="min-w-[120px]"
            >
              {uploadMutation.isPending ? "در حال آپلود..." : "آپلود فایل"}
            </Button>
          </div>
          {selectedFile && (
            <p className="text-sm text-gray-600 mt-2">
              فایل انتخابی: {selectedFile.name}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            لیست فاکتورها
          </CardTitle>
          <CardDescription>
            {invoices.length} فاکتور در سیستم موجود است
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <div className="text-center py-8">در حال بارگذاری...</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              هیچ فاکتوری یافت نشد. ابتدا فایل JSON را آپلود کنید.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-right p-3">شماره فاکتور</th>
                    <th className="text-right p-3">نماینده</th>
                    <th className="text-right p-3">مبلغ نهایی</th>
                    <th className="text-right p-3">مبلغ قبل کمیسیون</th>
                    <th className="text-right p-3">وضعیت</th>
                    <th className="text-right p-3">تاریخ</th>
                    <th className="text-right p-3">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-mono">{invoice.invoiceNumber}</td>
                      <td className="p-3">
                        {invoice.representative ? (
                          <div>
                            <div className="font-medium">{invoice.representative.fullName}</div>
                            <div className="text-sm text-gray-500">@{invoice.representative.adminUsername}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">نامشخص</span>
                        )}
                      </td>
                      <td className="p-3 font-medium">
                        {parseFloat(invoice.totalAmount).toLocaleString()} تومان
                      </td>
                      <td className="p-3">
                        {parseFloat(invoice.baseAmount).toLocaleString()} تومان
                      </td>
                      <td className="p-3">
                        <Badge className={getStatusColor(invoice.status)}>
                          {getStatusText(invoice.status)}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {new Date(invoice.createdAt).toLocaleDateString('fa-IR')}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          {/* Send to Telegram */}
                          <Button
                            size="sm"
                            variant={invoice.telegramSent ? "secondary" : "outline"}
                            onClick={() => sendToTelegramMutation.mutate(invoice.id)}
                            disabled={sendToTelegramMutation.isPending || invoice.telegramSent}
                            title="ارسال به تلگرام"
                          >
                            {invoice.telegramSent ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>

                          {/* Edit Invoice */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const newAmount = prompt('مبلغ جدید را وارد کنید:', invoice.totalAmount);
                              if (newAmount && newAmount !== invoice.totalAmount) {
                                fetch(`/api/invoices/${invoice.id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ totalAmount: newAmount, baseAmount: newAmount })
                                }).then(() => {
                                  toast({ title: "فاکتور بروزرسانی شد" });
                                  queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
                                });
                              }
                            }}
                            title="ویرایش فاکتور"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          {/* Delete Invoice */}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (window.confirm('آیا از حذف این فاکتور اطمینان دارید؟')) {
                                deleteInvoiceMutation.mutate(invoice.id);
                              }
                            }}
                            disabled={deleteInvoiceMutation.isPending}
                            title="حذف فاکتور"
                          >
                            <Trash2 className="h-4 w-4" />
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