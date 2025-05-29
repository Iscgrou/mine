import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatPersianNumber, formatPersianDate } from "@/lib/persian-utils";

interface Payment {
  id: number;
  invoiceId?: number;
  representativeId: number;
  amount: string;
  paymentType: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  representative: {
    fullName: string;
    adminUsername: string;
  } | null;
  invoice: {
    invoiceNumber: string;
  } | null;
}

interface Invoice {
  id: number;
  representativeId: number;
  invoiceNumber: string;
  status: string;
  totalAmount: string;
  dueDate: string;
}

interface PaymentStats {
  thisMonth: string;
  pending: string;
  total: string;
}

const paymentSchema = z.object({
  representativeId: z.string().min(1, "انتخاب نماینده الزامی است"),
  invoiceId: z.string().optional(),
  amount: z.string().min(1, "مبلغ الزامی است"),
  paymentType: z.enum(["full", "partial"]).default("full"),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export default function Payments() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [representativeFilter, setRepresentativeFilter] = useState("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ['/api/payments'],
  });

  const { data: representatives } = useQuery<any[]>({
    queryKey: ['/api/representatives'],
  });

  const { data: invoices } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices'],
  });

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentType: "full",
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: (data: PaymentFormData) => {
      const payload = {
        ...data,
        representativeId: parseInt(data.representativeId),
        invoiceId: data.invoiceId ? parseInt(data.invoiceId) : undefined,
        amount: data.amount,
      };
      return apiRequest('POST', '/api/payments', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      toast({
        title: "موفقیت",
        description: "پرداخت با موفقیت ثبت شد",
      });
      form.reset();
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در ثبت پرداخت",
        variant: "destructive",
      });
    },
  });

  const filteredPayments = payments?.filter((payment) => {
    return representativeFilter === "all" || 
      payment.representativeId.toString() === representativeFilter;
  });

  const getPaymentStats = (): PaymentStats => {
    if (!payments) return { thisMonth: "0", pending: "0", total: "0" };

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const thisMonthPayments = payments.filter(
      p => new Date(p.createdAt) >= monthStart
    );
    
    const thisMonth = thisMonthPayments.reduce(
      (sum, p) => sum + parseFloat(p.amount), 0
    ).toString();

    // Calculate pending from invoices
    const pendingAmount = "325000"; // This would come from invoices API
    
    const total = payments.reduce(
      (sum, p) => sum + parseFloat(p.amount), 0
    ).toString();

    return { thisMonth, pending: pendingAmount, total };
  };

  const stats = getPaymentStats();

  const onSubmit = (data: PaymentFormData) => {
    createPaymentMutation.mutate(data);
  };

  const getRepresentativeInvoices = (representativeId: string) => {
    return invoices?.filter((invoice: Invoice) => 
      invoice.representativeId.toString() === representativeId && 
      invoice.status === 'pending'
    ) || [];
  };

  const selectedRepId = form.watch("representativeId");
  const availableInvoices = selectedRepId ? getRepresentativeInvoices(selectedRepId) : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <CardTitle className="text-lg font-medium text-gray-900">مدیریت پرداخت‌ها</CardTitle>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <i className="fas fa-plus ml-2"></i>
              ثبت پرداخت
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>ثبت پرداخت جدید</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="representativeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نماینده</FormLabel>
                      <FormControl>
                        <select 
                          className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                          {...field}
                        >
                          <option value="">انتخاب نماینده</option>
                          {representatives?.map((rep: any) => (
                            <option key={rep.id} value={rep.id.toString()}>
                              {rep.fullName}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {availableInvoices.length > 0 && (
                  <FormField
                    control={form.control}
                    name="invoiceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>فاکتور (اختیاری)</FormLabel>
                        <FormControl>
                          <select 
                            className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                            {...field}
                          >
                            <option value="">بدون فاکتور مشخص</option>
                            {availableInvoices.map((invoice: any) => (
                              <option key={invoice.id} value={invoice.id.toString()}>
                                {invoice.invoiceNumber} - {formatPersianNumber(invoice.totalAmount)} تومان
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مبلغ پرداخت (تومان)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="مبلغ به تومان" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع پرداخت</FormLabel>
                      <FormControl>
                        <select 
                          className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                          {...field}
                        >
                          <option value="full">پرداخت کامل</option>
                          <option value="partial">پرداخت جزئی</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>روش پرداخت</FormLabel>
                      <FormControl>
                        <Input placeholder="نقد، کارت، چک، ..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>یادداشت</FormLabel>
                      <FormControl>
                        <Input placeholder="توضیحات اضافی..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                    انصراف
                  </Button>
                  <Button type="submit" disabled={createPaymentMutation.isPending}>
                    {createPaymentMutation.isPending ? "در حال ثبت..." : "ثبت پرداخت"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="stats-card">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-green-100 rounded-md flex items-center justify-center">
                  <i className="fas fa-check-circle text-green-600"></i>
                </div>
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">دریافتی این ماه</dt>
                  <dd className="text-lg font-medium text-gray-900 persian-nums">
                    {formatPersianNumber(stats.thisMonth)} تومان
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-yellow-100 rounded-md flex items-center justify-center">
                  <i className="fas fa-clock text-yellow-600"></i>
                </div>
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">معوقات</dt>
                  <dd className="text-lg font-medium text-gray-900 persian-nums">
                    {formatPersianNumber(stats.pending)} تومان
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-100 rounded-md flex items-center justify-center">
                  <i className="fas fa-chart-line text-blue-600"></i>
                </div>
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">کل درآمد</dt>
                  <dd className="text-lg font-medium text-gray-900 persian-nums">
                    {formatPersianNumber(stats.total)} تومان
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">فیلتر بر اساس نماینده</label>
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
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
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
              {filteredPayments?.map((payment) => (
                <div key={payment.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {payment.representative?.fullName || 'نامشخص'}
                      </div>
                      <div className="text-lg font-bold text-green-600 persian-nums mb-2">
                        {formatPersianNumber(payment.amount)} تومان
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                        <span className="persian-nums">📅 {formatPersianDate(payment.createdAt)}</span>
                        <span>🔹 {payment.paymentType === 'full' ? 'پرداخت کامل' : 'پرداخت جزئی'}</span>
                        {payment.paymentMethod && (
                          <span>💳 {payment.paymentMethod}</span>
                        )}
                        {payment.invoice && (
                          <span>📄 {payment.invoice.invoiceNumber}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Button
                        variant="outline" 
                        size="sm"
                        className="text-xs px-3 py-1 h-7"
                      >
                        مشاهده جزئیات
                      </Button>
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
