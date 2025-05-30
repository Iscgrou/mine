import { useState } from "react";
import { Eye, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

interface FinancialBalanceProps {
  representativeId: number;
  currentBalance: number;
  representativeName: string;
}

interface LedgerEntry {
  id: number;
  transactionDate: string;
  transactionType: string;
  amount: string;
  runningBalance: string;
  referenceNumber: string | null;
  description: string | null;
}

interface LedgerResponse {
  representative: {
    id: number;
    fullName: string;
    adminUsername: string;
  };
  currentBalance: number;
  transactions: LedgerEntry[];
}

export function FinancialBalance({ representativeId, currentBalance, representativeName }: FinancialBalanceProps) {
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);

  const { data: ledgerData, isLoading } = useQuery<LedgerResponse>({
    queryKey: ['/api/representatives', representativeId, 'ledger'],
    enabled: isLedgerOpen,
  });

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('fa-IR').format(Math.abs(balance));
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return "text-red-600 dark:text-red-400"; // Debtor
    if (balance < 0) return "text-green-600 dark:text-green-400"; // Creditor
    return "text-gray-600 dark:text-gray-400"; // Balanced
  };

  const getBalanceStatus = (balance: number) => {
    if (balance > 0) return "بدهکار";
    if (balance < 0) return "بستانکار";
    return "تسویه";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  };

  const exportToPDF = () => {
    // Generate PDF export functionality
    const printWindow = window.open('', '_blank');
    if (!printWindow || !ledgerData) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>صورتحساب ${representativeName}</title>
        <style>
          body { font-family: 'Tahoma', sans-serif; direction: rtl; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .balance { font-size: 18px; font-weight: bold; color: ${currentBalance > 0 ? '#dc2626' : '#16a34a'}; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
          th { background-color: #f5f5f5; }
          .debit { color: #dc2626; }
          .credit { color: #16a34a; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>صورتحساب مالی</h2>
          <h3>${representativeName}</h3>
          <p class="balance">موجودی فعلی: ${formatBalance(currentBalance)} تومان ${getBalanceStatus(currentBalance)}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>تاریخ</th>
              <th>نوع تراکنش</th>
              <th>مبلغ</th>
              <th>موجودی</th>
              <th>شماره مرجع</th>
              <th>شرح</th>
            </tr>
          </thead>
          <tbody>
            ${ledgerData.transactions.map(transaction => `
              <tr>
                <td>${formatDate(transaction.transactionDate)}</td>
                <td>${transaction.transactionType === 'invoice' ? 'فاکتور' : 'پرداخت'}</td>
                <td class="${transaction.transactionType === 'invoice' ? 'debit' : 'credit'}">
                  ${formatBalance(parseFloat(transaction.amount))} تومان
                </td>
                <td>${formatBalance(parseFloat(transaction.runningBalance))} تومان</td>
                <td>${transaction.referenceNumber || '-'}</td>
                <td>${transaction.description || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`font-semibold ${getBalanceColor(currentBalance)}`}>
        {currentBalance === 0 ? 'تسویه' : 
         `${formatBalance(currentBalance)} تومان ${getBalanceStatus(currentBalance)}`
        }
      </span>
      
      <Dialog open={isLedgerOpen} onOpenChange={setIsLedgerOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <Eye className="h-4 w-4" />
            جزئیات
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>صورتحساب مالی - {representativeName}</span>
              <div className="flex items-center gap-2">
                <Badge variant={currentBalance > 0 ? "destructive" : currentBalance < 0 ? "default" : "secondary"}>
                  موجودی فعلی: {formatBalance(currentBalance)} تومان {getBalanceStatus(currentBalance)}
                </Badge>
                <Button variant="outline" size="sm" onClick={exportToPDF}>
                  <Download className="h-4 w-4 ml-2" />
                  خروجی PDF
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : ledgerData && ledgerData.transactions ? (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">خلاصه حساب</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">کل تراکنش‌ها:</span>
                    <p className="font-semibold">{ledgerData.transactions.length}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">کل فاکتورها:</span>
                    <p className="font-semibold text-red-600">
                      {formatBalance(
                        ledgerData.transactions
                          .filter(t => t.transactionType === 'invoice')
                          .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                      )} تومان
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">کل پرداخت‌ها:</span>
                    <p className="font-semibold text-green-600">
                      {formatBalance(
                        ledgerData.transactions
                          .filter(t => t.transactionType === 'payment')
                          .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                      )} تومان
                    </p>
                  </div>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>تاریخ</TableHead>
                    <TableHead>نوع تراکنش</TableHead>
                    <TableHead>مبلغ</TableHead>
                    <TableHead>موجودی پس از تراکنش</TableHead>
                    <TableHead>شماره مرجع</TableHead>
                    <TableHead>شرح</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerData.transactions?.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{formatDate(transaction.transactionDate)}</TableCell>
                      <TableCell>
                        <Badge variant={transaction.transactionType === 'invoice' ? "destructive" : "default"}>
                          {transaction.transactionType === 'invoice' ? 'فاکتور' : 'پرداخت'}
                        </Badge>
                      </TableCell>
                      <TableCell className={transaction.transactionType === 'invoice' ? 'text-red-600' : 'text-green-600'}>
                        {formatBalance(parseFloat(transaction.amount))} تومان
                      </TableCell>
                      <TableCell className={parseFloat(transaction.runningBalance) > 0 ? 'text-red-600' : 'text-green-600'}>
                        {formatBalance(parseFloat(transaction.runningBalance))} تومان
                      </TableCell>
                      <TableCell>{transaction.referenceNumber || '-'}</TableCell>
                      <TableCell>{transaction.description || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center p-8">
              <p className="text-gray-500">هیچ تراکنش مالی ثبت نشده است</p>
              <p className="text-sm text-gray-400 mt-2">تراکنش‌های آینده در اینجا نمایش داده خواهند شد</p>
            </div>
          ) }
          
          {!ledgerData && !isLoading && (
            <div className="text-center p-8 text-gray-500">
              خطا در بارگذاری اطلاعات صورتحساب
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}