import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  FolderOpen, 
  Send, 
  Share2, 
  Calendar, 
  FileText, 
  DollarSign,
  MessageCircle,
  Users,
  CheckCircle
} from "lucide-react";

interface InvoiceBatch {
  id: number;
  batchName: string;
  uploadDate: string;
  fileName: string;
  totalInvoices: number;
  totalAmount: string;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  representativeId: number;
  batchId: number;
  totalAmount: string;
  status: string;
  telegramSent: boolean;
  sentToRepresentative: boolean;
  createdAt: string;
  representative: {
    id: number;
    fullName: string;
    adminUsername: string;
    telegramId: string | null;
  } | null;
}

export default function InvoiceBatches() {
  const [selectedBatch, setSelectedBatch] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch invoice batches
  const { data: batches = [], isLoading: loadingBatches } = useQuery({
    queryKey: ['/api/invoice-batches'],
  });

  // Fetch invoices for selected batch
  const { data: batchInvoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ['/api/invoices/batch', selectedBatch],
    enabled: !!selectedBatch,
  });

  // Batch send to Telegram mutation
  const batchSendMutation = useMutation({
    mutationFn: (batchId: number) => 
      apiRequest('POST', `/api/invoices/batch/${batchId}/send-telegram`),
    onSuccess: () => {
      toast({
        title: "ارسال موفق",
        description: "تمام فاکتورهای این دسته با موفقیت به ربات تلگرام ارسال شد",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
    },
    onError: () => {
      toast({
        title: "خطا در ارسال",
        description: "خطایی در ارسال فاکتورها رخ داد",
        variant: "destructive",
      });
    },
  });

  // Individual invoice share mutation
  const shareMutation = useMutation({
    mutationFn: (invoiceId: number) => 
      apiRequest('POST', `/api/invoices/${invoiceId}/share-telegram`),
    onSuccess: () => {
      toast({
        title: "همرسانی موفق",
        description: "فاکتور با موفقیت به نماینده ارسال شد",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
    },
    onError: () => {
      toast({
        title: "خطا در همرسانی",
        description: "خطایی در ارسال فاکتور رخ داد",
        variant: "destructive",
      });
    },
  });

  const formatPersianDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  };

  const generateTelegramShareLink = (invoice: Invoice) => {
    if (!invoice.representative?.telegramId) return null;
    
    const invoiceText = `
فاکتور شماره: ${invoice.invoiceNumber}
مبلغ: ${parseFloat(invoice.totalAmount).toLocaleString()} تومان
نماینده: ${invoice.representative.fullName}
وضعیت: ${invoice.status === 'pending' ? 'در انتظار' : invoice.status === 'paid' ? 'پرداخت شده' : 'منقضی'}

برای مشاهده جزئیات بیشتر به پنل مدیریت مراجعه کنید.
    `.trim();

    const encodedText = encodeURIComponent(invoiceText);
    return `${invoice.representative.telegramId}?text=${encodedText}`;
  };

  if (loadingBatches) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">در حال بارگذاری دسته‌های فاکتور...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          مدیریت فاکتورها
        </h1>
        <p className="text-gray-600">
          فاکتورها بر اساس دسته‌های آپلود سازماندهی شده‌اند
        </p>
      </div>

      {batches.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                هیچ دسته‌ای یافت نشد
              </h3>
              <p className="text-gray-600">
                پس از آپلود فایل .ods، دسته‌های فاکتور در اینجا نمایش داده خواهند شد
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Accordion type="single" collapsible className="space-y-4">
            {batches.map((batch: InvoiceBatch) => (
              <AccordionItem key={batch.id} value={batch.id.toString()} className="border rounded-lg">
                <Card>
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-4 space-x-reverse">
                        <FolderOpen className="h-6 w-6 text-blue-600" />
                        <div className="text-right">
                          <h3 className="text-lg font-semibold">{batch.batchName}</h3>
                          <p className="text-sm text-gray-600">{batch.fileName}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6 space-x-reverse">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">تعداد فاکتور</p>
                          <p className="font-semibold">{batch.totalInvoices}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">مجموع مبلغ</p>
                          <p className="font-semibold">{parseFloat(batch.totalAmount).toLocaleString()} تومان</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">تاریخ آپلود</p>
                          <p className="font-semibold">{formatPersianDate(batch.uploadDate)}</p>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="px-6 pb-6">
                      <Separator className="mb-4" />
                      
                      {/* Batch Actions */}
                      <div className="flex justify-between items-center mb-6">
                        <Button
                          onClick={() => batchSendMutation.mutate(batch.id)}
                          disabled={batchSendMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Send className="h-4 w-4 ml-2" />
                          ارسال گروهی به ربات تلگرام
                        </Button>
                        <div className="text-sm text-gray-600">
                          {batch.totalInvoices} فاکتور در این دسته
                        </div>
                      </div>

                      {/* Load invoices for this batch */}
                      <InvoiceBatchContent 
                        batchId={batch.id} 
                        onShare={(invoiceId) => shareMutation.mutate(invoiceId)}
                        isSharing={shareMutation.isPending}
                      />
                    </div>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
    </div>
  );
}

// Component for displaying invoices within a batch
function InvoiceBatchContent({ 
  batchId, 
  onShare, 
  isSharing 
}: { 
  batchId: number; 
  onShare: (invoiceId: number) => void;
  isSharing: boolean;
}) {
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['/api/invoices/batch', batchId],
  });

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600">در حال بارگذاری فاکتورها...</p>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">هیچ فاکتوری در این دسته یافت نشد</p>
      </div>
    );
  }

  const generateTelegramShareLink = (invoice: Invoice) => {
    if (!invoice.representative?.telegramId) return null;
    
    const invoiceText = `
فاکتور شماره: ${invoice.invoiceNumber}
مبلغ: ${parseFloat(invoice.totalAmount).toLocaleString()} تومان
نماینده: ${invoice.representative.fullName}
وضعیت: ${invoice.status === 'pending' ? 'در انتظار' : invoice.status === 'paid' ? 'پرداخت شده' : 'منقضی'}

برای مشاهده جزئیات بیشتر به پنل مدیریت مراجعه کنید.
    `.trim();

    const encodedText = encodeURIComponent(invoiceText);
    return `${invoice.representative.telegramId}?text=${encodedText}`;
  };

  return (
    <div className="space-y-3">
      {invoices.map((invoice: Invoice) => (
        <div key={invoice.id} className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <FileText className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-semibold">{invoice.invoiceNumber}</p>
                <p className="text-sm text-gray-600">
                  {invoice.representative?.fullName || 'نماینده نامشخص'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="text-center">
                <p className="text-sm text-gray-600">مبلغ</p>
                <p className="font-semibold">{parseFloat(invoice.totalAmount).toLocaleString()} تومان</p>
              </div>
              
              <div className="flex items-center space-x-2 space-x-reverse">
                {invoice.telegramSent && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="h-3 w-3 ml-1" />
                    ارسال شده به ربات
                  </Badge>
                )}
                {invoice.sentToRepresentative && (
                  <Badge variant="secondary" className="text-xs">
                    <MessageCircle className="h-3 w-3 ml-1" />
                    ارسال شده به نماینده
                  </Badge>
                )}
              </div>

              <div className="flex space-x-2 space-x-reverse">
                {invoice.representative?.telegramId ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const shareLink = generateTelegramShareLink(invoice);
                      if (shareLink) {
                        window.open(shareLink, '_blank');
                        onShare(invoice.id);
                      }
                    }}
                    disabled={isSharing}
                  >
                    <Share2 className="h-4 w-4 ml-1" />
                    همرسانی تلگرام
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" disabled>
                    <Share2 className="h-4 w-4 ml-1" />
                    تلگرام تنظیم نشده
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}