import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Download, Printer } from "lucide-react";

interface Representative {
  id: number;
  name: string;
  phone: string;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  representativeName: string;
  representativePhone: string;
  totalAmount: number;
  issueDate: string;
  dueDate: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

export default function InvoiceTemplatePreview() {
  const [selectedRepId, setSelectedRepId] = useState<string>("");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile" | "print">("desktop");

  // Fetch representatives for dropdown
  const { data: representatives = [] } = useQuery<Representative[]>({
    queryKey: ['/api/representatives'],
  });

  // Fetch sample invoice for preview
  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices'],
  });

  const sampleInvoice = invoices[0]; // Use first invoice as sample

  const generatePreviewInvoice = (rep: Representative) => {
    return {
      id: 999,
      invoiceNumber: "INV-2025-PREVIEW",
      representativeName: rep.name,
      representativePhone: rep.phone,
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
  };

  const selectedRep = representatives.find(rep => rep.id.toString() === selectedRepId);
  const previewInvoice = selectedRep ? generatePreviewInvoice(selectedRep) : sampleInvoice;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // This would integrate with PDF generation library
    console.log("PDF download requested");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-right">پیش‌نمایش قالب فاکتور</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">انتخاب نماینده برای پیش‌نمایش</label>
              <Select value={selectedRepId} onValueChange={setSelectedRepId}>
                <SelectTrigger>
                  <SelectValue placeholder="نماینده را انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>
                  {representatives.map((rep) => (
                    <SelectItem key={rep.id} value={rep.id.toString()}>
                      {rep.name} - {rep.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Select value={previewMode} onValueChange={(value: "desktop" | "mobile" | "print") => setPreviewMode(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desktop">دسکتاپ</SelectItem>
                  <SelectItem value="mobile">موبایل</SelectItem>
                  <SelectItem value="print">چاپ</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handlePrint} variant="outline" size="sm">
                <Printer className="w-4 h-4 ml-2" />
                چاپ
              </Button>

              <Button onClick={handleDownloadPDF} variant="outline" size="sm">
                <Download className="w-4 h-4 ml-2" />
                PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Preview */}
      {previewInvoice && (
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
                <p className="text-lg font-mono">{previewInvoice.invoiceNumber}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700">تاریخ صدور:</h3>
                <p>{previewInvoice.issueDate}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700">نماینده:</h3>
                <p>{previewInvoice.representativeName}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700">شماره تماس:</h3>
                <p className="font-mono">{previewInvoice.representativePhone}</p>
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
                  {previewInvoice.items.map((item, index) => (
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
                  {previewInvoice.totalAmount.toLocaleString()} تومان
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
      )}
    </div>
  );
}