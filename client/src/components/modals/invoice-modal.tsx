import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { formatPersianNumber, formatPersianDate } from "@/lib/persian-utils";

interface InvoiceItem {
  id: number;
  description: string;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
  subscriptionType: string;
  durationMonths: number;
}

interface InvoiceModalProps {
  invoice: {
    id: number;
    invoiceNumber: string;
    totalAmount: string;
    status: string;
    createdAt: string;
    dueDate?: string;
    representative: {
      fullName: string;
      adminUsername: string;
      phoneNumber?: string;
      telegramId?: string;
    } | null;
  };
  onClose: () => void;
}

export default function InvoiceModal({ invoice, onClose }: InvoiceModalProps) {
  const { data: invoiceDetails, isLoading } = useQuery({
    queryKey: [`/api/invoices/${invoice.id}`],
  });

  const handleDownloadPDF = () => {
    // Implementation for PDF generation
    console.log("Downloading PDF for invoice:", invoice.invoiceNumber);
    // This would integrate with a PDF generation library like jsPDF or react-pdf
  };

  const handleDownloadImage = () => {
    // Implementation for image generation
    console.log("Downloading image for invoice:", invoice.invoiceNumber);
    // This would convert the invoice to an image format
  };

  const handleSendToTelegram = () => {
    if (!invoice.representative?.telegramId) {
      alert("شناسه تلگرام برای این نماینده ثبت نشده است");
      return;
    }

    const message = `سلام ${invoice.representative.fullName}،

فاکتور شما آماده است:
شماره: ${invoice.invoiceNumber}
مبلغ: ${formatPersianNumber(invoice.totalAmount)} تومان
تاریخ: ${formatPersianDate(invoice.createdAt)}

لطفا نسبت به پرداخت اقدام فرمایید.`;

    const telegramUrl = `https://t.me/${invoice.representative.telegramId.replace('@', '')}?text=${encodeURIComponent(message)}`;
    window.open(telegramUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const items: InvoiceItem[] = invoiceDetails?.items || [];

  return (
    <div className="p-6">
      {/* Invoice Header */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">فاکتور خرید</h2>
            <p className="text-gray-600 mt-1">
              شماره فاکتور: <span className="persian-nums">{invoice.invoiceNumber}</span>
            </p>
          </div>
          <div className="text-left">
            <p className="text-sm text-gray-600">تاریخ صدور:</p>
            <p className="font-medium persian-nums">{formatPersianDate(invoice.createdAt)}</p>
          </div>
        </div>

        {/* Representative Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">اطلاعات نماینده:</h4>
            <p className="text-gray-600">{invoice.representative?.fullName || 'نامشخص'}</p>
            <p className="text-gray-600">{invoice.representative?.adminUsername || ''}</p>
            <p className="text-gray-600 persian-nums">{invoice.representative?.phoneNumber || ''}</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">اطلاعات تماس:</h4>
            <p className="text-gray-600">{invoice.representative?.telegramId || 'شناسه تلگرام ثبت نشده'}</p>
            {invoice.dueDate && (
              <>
                <p className="text-sm text-gray-600 mt-2">تاریخ سررسید:</p>
                <p className="text-gray-900 persian-nums">{formatPersianDate(invoice.dueDate)}</p>
              </>
            )}
          </div>
        </div>

        {/* Invoice Items */}
        <div className="mb-8">
          <h4 className="font-semibold text-gray-800 mb-4">جزئیات خرید:</h4>
          <table className="w-full border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-right p-3 text-sm font-medium text-gray-600">شرح</th>
                <th className="text-right p-3 text-sm font-medium text-gray-600">مقدار</th>
                <th className="text-right p-3 text-sm font-medium text-gray-600">قیمت واحد</th>
                <th className="text-right p-3 text-sm font-medium text-gray-600">مبلغ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.id}>
                    <td className="p-3 text-sm text-gray-900">{item.description}</td>
                    <td className="p-3 text-sm text-gray-600 persian-nums">
                      {item.subscriptionType === 'standard' 
                        ? `${formatPersianNumber(item.quantity)} GB`
                        : `${formatPersianNumber(item.quantity)} عدد`
                      }
                    </td>
                    <td className="p-3 text-sm text-gray-600 persian-nums">
                      {formatPersianNumber(item.unitPrice)} تومان
                    </td>
                    <td className="p-3 text-sm text-gray-900 font-medium persian-nums">
                      {formatPersianNumber(item.totalPrice)} تومان
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-500">
                    اطلاعات جزئی موجود نیست
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between py-2 border-t border-gray-200">
              <span className="font-semibold text-gray-800">مجموع کل:</span>
              <span className="font-bold text-lg text-gray-900 persian-nums">
                {formatPersianNumber(invoice.totalAmount)} تومان
              </span>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="mt-6 flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-600 ml-2">وضعیت:</span>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              invoice.status === 'paid' ? 'status-paid' :
              invoice.status === 'pending' ? 'status-pending' :
              'status-overdue'
            }`}>
              {invoice.status === 'paid' ? 'پرداخت شده' :
               invoice.status === 'pending' ? 'در انتظار پرداخت' : 'معوق'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 space-x-reverse mt-6">
        <Button variant="outline" onClick={handleDownloadPDF}>
          <i className="fas fa-file-pdf ml-2"></i>
          دانلود PDF
        </Button>
        <Button variant="outline" onClick={handleDownloadImage}>
          <i className="fas fa-image ml-2"></i>
          دانلود تصویر
        </Button>
        <Button onClick={handleSendToTelegram}>
          <i className="fab fa-telegram-plane ml-2"></i>
          ارسال به تلگرام
        </Button>
      </div>
    </div>
  );
}
