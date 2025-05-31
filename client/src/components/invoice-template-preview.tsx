import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function InvoiceTemplatePreview() {
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile" | "print">("desktop");

  // Fetch sample invoice for preview
  const { data: invoices = [] } = useQuery({
    queryKey: ['/api/invoices'],
  });

  // Generate sample invoice data
  const sampleInvoice = {
    id: 999,
    invoiceNumber: "INV-2025-PREVIEW",
    representativeName: "نماینده نمونه",
    representativePhone: "09123456789",
    totalAmount: 2500000,
    issueDate: new Date().toLocaleDateString('fa-IR'),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fa-IR'),
    items: [
      {
        description: "اشتراک ماهانه V2Ray",
        quantity: 5,
        unitPrice: 350000,
        totalPrice: 1750000
      },
      {
        description: "اشتراک فوری V2Ray",
        quantity: 3,
        unitPrice: 250000,
        totalPrice: 750000
      }
    ]
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    alert("قابلیت دانلود PDF به زودی اضافه خواهد شد");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-right">پیش‌نمایش قالب فاکتور</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center justify-between">
            <div className="flex gap-2">
              <select 
                value={previewMode} 
                onChange={(e) => setPreviewMode(e.target.value as "desktop" | "mobile" | "print")}
                className="px-3 py-2 border rounded-md"
              >
                <option value="desktop">دسکتاپ</option>
                <option value="mobile">موبایل</option>
                <option value="print">چاپ</option>
              </select>
              
              <Button onClick={handlePrint} variant="outline" size="sm">
                <i className="fas fa-print ml-2"></i>
                چاپ
              </Button>

              <Button onClick={handleDownloadPDF} variant="outline" size="sm">
                <i className="fas fa-download ml-2"></i>
                PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Preview */}
      <Card className={`
        ${previewMode === "mobile" ? "max-w-sm mx-auto" : ""}
        ${previewMode === "print" ? "print:shadow-none print:border-none" : ""}
      `}>
        <CardContent className="p-8 space-y-6">
          {/* Header */}
          <div className="text-center border-b pb-4">
            <h1 className="text-3xl font-bold text-blue-600">شرکت مارفانت</h1>
            <p className="text-gray-600 mt-2">ارائه‌دهنده خدمات V2Ray و پروکسی</p>
          </div>

          {/* Invoice Info */}
          <div className="grid grid-cols-2 gap-4 text-right">
            <div>
              <h3 className="font-semibold text-gray-700">شماره فاکتور:</h3>
              <p className="text-lg font-mono">{sampleInvoice.invoiceNumber}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700">تاریخ صدور:</h3>
              <p>{sampleInvoice.issueDate}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700">نماینده:</h3>
              <p>{sampleInvoice.representativeName}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700">شماره تماس:</h3>
              <p className="font-mono">{sampleInvoice.representativePhone}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-3 text-right">شرح خدمات</th>
                  <th className="border border-gray-300 p-3 text-center">تعداد</th>
                  <th className="border border-gray-300 p-3 text-center">قیمت واحد</th>
                  <th className="border border-gray-300 p-3 text-center">مبلغ کل</th>
                </tr>
              </thead>
              <tbody>
                {sampleInvoice.items.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-3 text-right">{item.description}</td>
                    <td className="border border-gray-300 p-3 text-center">{item.quantity}</td>
                    <td className="border border-gray-300 p-3 text-center font-mono">
                      {item.unitPrice.toLocaleString()} تومان
                    </td>
                    <td className="border border-gray-300 p-3 text-center font-mono">
                      {item.totalPrice.toLocaleString()} تومان
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-xl font-bold">
              <span>مبلغ کل قابل پرداخت:</span>
              <span className="text-blue-600 font-mono">
                {sampleInvoice.totalAmount.toLocaleString()} تومان
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-600 border-t pt-4">
            <p>با تشکر از اعتماد شما</p>
            <p>www.marfanet.com | support@marfanet.com</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}