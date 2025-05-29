import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const representativeSchema = z.object({
  fullName: z.string().min(1, "نام کامل الزامی است"),
  adminUsername: z.string().min(1, "نام کاربری ادمین الزامی است"),
  telegramId: z.string().optional(),
  phoneNumber: z.string().optional(),
  storeName: z.string().optional(),
  // Limited subscription pricing for 1-6 months
  limitedPrice1Month: z.string().optional(),
  limitedPrice2Month: z.string().optional(),
  limitedPrice3Month: z.string().optional(),
  limitedPrice4Month: z.string().optional(),
  limitedPrice5Month: z.string().optional(),
  limitedPrice6Month: z.string().optional(),
  unlimitedMonthlyPrice: z.string().optional(),
  status: z.enum(["active", "inactive", "suspended"]).default("active"),
});

type RepresentativeFormData = z.infer<typeof representativeSchema>;

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
}

interface RepresentativeFormProps {
  representative?: Representative | null;
  onSuccess?: () => void;
}

export default function RepresentativeForm({ representative, onSuccess }: RepresentativeFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<RepresentativeFormData>({
    resolver: zodResolver(representativeSchema),
    defaultValues: {
      fullName: representative?.fullName || "",
      adminUsername: representative?.adminUsername || "",
      telegramId: representative?.telegramId || "",
      phoneNumber: representative?.phoneNumber || "",
      storeName: representative?.storeName || "",
      limitedPrice1Month: representative?.limitedPrice1Month || "",
      limitedPrice2Month: representative?.limitedPrice2Month || "",
      limitedPrice3Month: representative?.limitedPrice3Month || "",
      limitedPrice4Month: representative?.limitedPrice4Month || "",
      limitedPrice5Month: representative?.limitedPrice5Month || "",
      limitedPrice6Month: representative?.limitedPrice6Month || "",
      unlimitedMonthlyPrice: representative?.unlimitedMonthlyPrice || "",
      status: (representative?.status as any) || "active",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: RepresentativeFormData) => 
      apiRequest('POST', '/api/representatives', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/representatives'] });
      toast({
        title: "موفقیت",
        description: "نماینده با موفقیت ایجاد شد",
      });
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در ایجاد نماینده",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: RepresentativeFormData) => 
      apiRequest('PUT', `/api/representatives/${representative?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/representatives'] });
      toast({
        title: "موفقیت",
        description: "نماینده با موفقیت به‌روزرسانی شد",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در به‌روزرسانی نماینده",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RepresentativeFormData) => {
    if (representative) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>نام کامل</FormLabel>
                <FormControl>
                  <Input placeholder="نام و نام خانوادگی" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="adminUsername"
            render={({ field }) => (
              <FormItem>
                <FormLabel>نام کاربری ادمین</FormLabel>
                <FormControl>
                  <Input placeholder="admin_username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>شماره تلفن</FormLabel>
                <FormControl>
                  <Input placeholder="09xxxxxxxxx" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="telegramId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>شناسه تلگرام</FormLabel>
                <FormControl>
                  <Input placeholder="@username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="storeName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نام فروشگاه (اختیاری)</FormLabel>
              <FormControl>
                <Input placeholder="نام فروشگاه" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Limited Subscription Pricing Section */}
        <div className="border border-gray-200 rounded-lg p-3">
          <h3 className="text-sm font-medium text-gray-900 mb-2">قیمت‌گذاری اشتراک حجمی (1-6 ماه)</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { field: 'limitedPrice1Month', label: '1 ماه' },
              { field: 'limitedPrice2Month', label: '2 ماه' },
              { field: 'limitedPrice3Month', label: '3 ماه' },
              { field: 'limitedPrice4Month', label: '4 ماه' },
              { field: 'limitedPrice5Month', label: '5 ماه' },
              { field: 'limitedPrice6Month', label: '6 ماه' }
            ].map((priceField) => (
              <FormField
                key={priceField.field}
                control={form.control}
                name={priceField.field as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>قیمت {priceField.label} (تومان)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="قیمت به تومان" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>

        {/* Unlimited Subscription Pricing */}
        <FormField
          control={form.control}
          name="unlimitedMonthlyPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>قیمت اشتراک نامحدود ماهانه (تومان)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="قیمت ماهانه به تومان" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>وضعیت</FormLabel>
              <FormControl>
                <select 
                  className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  {...field}
                >
                  <option value="active">فعال</option>
                  <option value="inactive">غیرفعال</option>
                  <option value="suspended">معلق</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-end space-x-reverse space-x-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onSuccess}>
            انصراف
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "در حال ذخیره..." : "ذخیره"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
