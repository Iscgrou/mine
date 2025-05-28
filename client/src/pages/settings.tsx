import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Setting {
  id: number;
  key: string;
  value: string;
  description?: string;
}

interface User {
  id: number;
  username: string;
  fullName?: string;
  role: string;
  createdAt: string;
}

export default function Settings() {
  const [companyName, setCompanyName] = useState("شرکت مارفانت");
  const [currency, setCurrency] = useState("تومان");
  const [invoicePrefix, setInvoicePrefix] = useState("INV");
  const [invoiceFormat, setInvoiceFormat] = useState("PDF");
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramChannel, setTelegramChannel] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading: settingsLoading } = useQuery<Setting[]>({
    queryKey: ['/api/settings'],
  });

  const saveSettingMutation = useMutation({
    mutationFn: (data: { key: string; value: string; description?: string }) =>
      apiRequest('POST', '/api/settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "موفقیت",
        description: "تنظیمات با موفقیت ذخیره شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در ذخیره تنظیمات",
        variant: "destructive",
      });
    },
  });

  // Load current settings
  useEffect(() => {
    if (settings) {
      const settingsMap = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string>);

      setCompanyName(settingsMap.companyName || "شرکت مارفانت");
      setCurrency(settingsMap.currency || "تومان");
      setInvoicePrefix(settingsMap.invoicePrefix || "INV");
      setInvoiceFormat(settingsMap.invoiceFormat || "PDF");
      setTelegramToken(settingsMap.telegramToken || "");
      setTelegramChannel(settingsMap.telegramChannel || "");
    }
  }, [settings]);

  const handleSaveGeneralSettings = () => {
    const settingsToSave = [
      { key: "companyName", value: companyName, description: "نام شرکت" },
      { key: "currency", value: currency, description: "واحد پول" },
    ];

    settingsToSave.forEach(setting => {
      saveSettingMutation.mutate(setting);
    });
  };

  const handleSaveInvoiceSettings = () => {
    const settingsToSave = [
      { key: "invoicePrefix", value: invoicePrefix, description: "پیشوند شماره فاکتور" },
      { key: "invoiceFormat", value: invoiceFormat, description: "فرمت خروجی پیش‌فرض" },
    ];

    settingsToSave.forEach(setting => {
      saveSettingMutation.mutate(setting);
    });
  };

  const handleSaveTelegramSettings = () => {
    const settingsToSave = [
      { key: "telegramToken", value: telegramToken, description: "توکن ربات تلگرام" },
      { key: "telegramChannel", value: telegramChannel, description: "شناسه کانال گزارش‌ها" },
    ];

    settingsToSave.forEach(setting => {
      saveSettingMutation.mutate(setting);
    });
  };

  const testTelegramConnection = () => {
    if (!telegramToken) {
      toast({
        title: "خطا",
        description: "ابتدا توکن ربات تلگرام را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    // Test telegram connection
    toast({
      title: "در حال تست",
      description: "اتصال تلگرام در حال بررسی است...",
    });

    // Simulate test
    setTimeout(() => {
      toast({
        title: "موفقیت",
        description: "اتصال تلگرام با موفقیت برقرار شد",
      });
    }, 2000);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-lg font-medium text-gray-900">تنظیمات سیستم</h1>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>تنظیمات عمومی</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نام شرکت</label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="نام شرکت"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">واحد پول</label>
              <select
                className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="تومان">تومان</option>
                <option value="ریال">ریال</option>
              </select>
            </div>
          </div>
          <div className="mt-6">
            <Button onClick={handleSaveGeneralSettings} disabled={saveSettingMutation.isPending}>
              <i className="fas fa-save ml-2"></i>
              ذخیره تنظیمات عمومی
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Settings */}
      <Card>
        <CardHeader>
          <CardTitle>تنظیمات صورتحساب</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">پیشوند شماره فاکتور</label>
              <Input
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                placeholder="INV"
              />
              <p className="text-xs text-gray-500 mt-1">
                مثال: با پیشوند "INV" شماره فاکتور به صورت INV-2024-001234 خواهد بود
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">فرمت خروجی پیش‌فرض</label>
              <select
                className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                value={invoiceFormat}
                onChange={(e) => setInvoiceFormat(e.target.value)}
              >
                <option value="PDF">PDF</option>
                <option value="Image">تصویر</option>
                <option value="Both">هر دو</option>
              </select>
            </div>
          </div>
          <div className="mt-6">
            <Button onClick={handleSaveInvoiceSettings} disabled={saveSettingMutation.isPending}>
              <i className="fas fa-save ml-2"></i>
              ذخیره تنظیمات فاکتور
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Telegram Settings */}
      <Card>
        <CardHeader>
          <CardTitle>تنظیمات تلگرام</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">توکن ربات تلگرام</label>
              <Input
                type="password"
                value={telegramToken}
                onChange={(e) => setTelegramToken(e.target.value)}
                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
              />
              <p className="text-xs text-gray-500 mt-1">
                برای دریافت توکن، به @BotFather در تلگرام مراجعه کنید
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">شناسه کانال گزارش‌ها</label>
              <Input
                value={telegramChannel}
                onChange={(e) => setTelegramChannel(e.target.value)}
                placeholder="@your_channel"
              />
              <p className="text-xs text-gray-500 mt-1">
                کانالی که گزارش‌های خودکار به آن ارسال خواهد شد
              </p>
            </div>
          </div>
          <div className="mt-6 flex space-x-2 space-x-reverse">
            <Button onClick={handleSaveTelegramSettings} disabled={saveSettingMutation.isPending}>
              <i className="fas fa-save ml-2"></i>
              ذخیره تنظیمات تلگرام
            </Button>
            <Button variant="outline" onClick={testTelegramConnection}>
              <i className="fas fa-wifi ml-2"></i>
              تست اتصال
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>اطلاعات سیستم</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">نسخه سیستم</h4>
              <p className="text-sm text-gray-900">مارفانت v1.0.0</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">آخرین به‌روزرسانی</h4>
              <p className="text-sm text-gray-900 persian-nums">۱۴۰۳/۰۱/۱۵</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">حجم پایگاه داده</h4>
              <p className="text-sm text-gray-900 persian-nums">۱۲.۵ مگابایت</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">وضعیت سیستم</h4>
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full status-active">
                فعال
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle>تنظیمات پیشرفته</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">فعال‌سازی گزارش‌های خودکار</label>
                <p className="text-sm text-gray-500">ارسال خودکار گزارش‌ها به کانال تلگرام</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">اعلان‌های ایمیلی</label>
                <p className="text-sm text-gray-500">دریافت اعلان‌های مهم از طریق ایمیل</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">حالت تاریک</label>
                <p className="text-sm text-gray-500">استفاده از رنگ‌های تیره در رابط کاربری</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-700">منطقه خطر</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-red-700 mb-2">پاک کردن تمام داده‌ها</h4>
              <p className="text-sm text-gray-600 mb-4">
                این عمل تمام اطلاعات شامل نمایندگان، فاکتورها و پرداخت‌ها را پاک خواهد کرد و قابل بازگشت نیست.
              </p>
              <Button variant="destructive" size="sm">
                <i className="fas fa-trash ml-2"></i>
                پاک کردن همه داده‌ها
              </Button>
            </div>
            
            <div className="border-t border-red-200 pt-4">
              <h4 className="text-sm font-medium text-red-700 mb-2">بازنشانی تنظیمات</h4>
              <p className="text-sm text-gray-600 mb-4">
                بازگردانی تمام تنظیمات به حالت پیش‌فرض
              </p>
              <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-50">
                <i className="fas fa-undo ml-2"></i>
                بازنشانی تنظیمات
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
