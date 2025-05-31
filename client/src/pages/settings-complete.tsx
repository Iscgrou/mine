import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Setting {
  id: number;
  key: string;
  value: string;
  description?: string;
}

export default function SettingsComplete() {
  const [selectedTab, setSelectedTab] = useState("company");
  const [companyName, setCompanyName] = useState("شرکت مارفانت");
  const [currency, setCurrency] = useState("تومان");
  const [invoicePrefix, setInvoicePrefix] = useState("INV");
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramChannel, setTelegramChannel] = useState("");
  const [aiApiKey, setAiApiKey] = useState("");
  const [vertexApiKey, setVertexApiKey] = useState("");
  
  // Telegram notification toggles
  const [telegramNotificationsEnabled, setTelegramNotificationsEnabled] = useState(true);
  const [invoiceNotifications, setInvoiceNotifications] = useState(true);
  const [paymentNotifications, setPaymentNotifications] = useState(true);
  const [systemAlerts, setSystemAlerts] = useState(true);
  const [repUpdates, setRepUpdates] = useState(true);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings = [], isLoading: settingsLoading } = useQuery<Setting[]>({
    queryKey: ['/api/settings'],
  });

  const settingsMutation = useMutation({
    mutationFn: async (data: { key: string; value: string; description?: string }) => {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to save setting');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({ title: "موفق", description: "تنظیمات با موفقیت ذخیره شد" });
    },
    onError: () => {
      toast({ title: "خطا", description: "خطا در ذخیره تنظیمات", variant: "destructive" });
    }
  });

  // Load settings on component mount
  useEffect(() => {
    if (settings.length > 0) {
      settings.forEach(setting => {
        switch (setting.key) {
          case 'companyName':
            setCompanyName(setting.value);
            break;
          case 'currency':
            setCurrency(setting.value);
            break;
          case 'invoicePrefix':
            setInvoicePrefix(setting.value);
            break;
          case 'telegramToken':
            setTelegramToken(setting.value);
            break;
          case 'telegramChannel':
            setTelegramChannel(setting.value);
            break;
          case 'aiApiKey':
            setAiApiKey(setting.value);
            break;
          case 'vertexApiKey':
            setVertexApiKey(setting.value);
            break;
          case 'telegramNotificationsEnabled':
            setTelegramNotificationsEnabled(setting.value === 'true');
            break;
          case 'invoiceNotifications':
            setInvoiceNotifications(setting.value === 'true');
            break;
          case 'paymentNotifications':
            setPaymentNotifications(setting.value === 'true');
            break;
          case 'systemAlerts':
            setSystemAlerts(setting.value === 'true');
            break;
          case 'repUpdates':
            setRepUpdates(setting.value === 'true');
            break;
        }
      });
    }
  }, [settings]);

  const saveSetting = (key: string, value: string, description?: string) => {
    settingsMutation.mutate({ key, value, description });
  };

  const saveCompanySettings = () => {
    saveSetting('companyName', companyName, 'نام شرکت');
    saveSetting('currency', currency, 'واحد پول');
    saveSetting('invoicePrefix', invoicePrefix, 'پیشوند فاکتور');
  };

  const saveTelegramSettings = () => {
    saveSetting('telegramToken', telegramToken, 'توکن ربات تلگرام');
    saveSetting('telegramChannel', telegramChannel, 'کانال تلگرام');
  };

  const saveNotificationSettings = () => {
    saveSetting('telegramNotificationsEnabled', telegramNotificationsEnabled.toString(), 'فعالسازی کلی اعلان‌های تلگرام');
    saveSetting('invoiceNotifications', invoiceNotifications.toString(), 'اعلان صدور فاکتور');
    saveSetting('paymentNotifications', paymentNotifications.toString(), 'اعلان پرداخت');
    saveSetting('systemAlerts', systemAlerts.toString(), 'هشدارهای سیستم');
    saveSetting('repUpdates', repUpdates.toString(), 'به‌روزرسانی نمایندگان');
  };

  const saveAISettings = () => {
    saveSetting('aiApiKey', aiApiKey, 'کلید API هوش مصنوعی');
    saveSetting('vertexApiKey', vertexApiKey, 'کلید API Vertex AI');
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case "company":
        return (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <i className="fas fa-building"></i>
                اطلاعات شرکت
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">نام شرکت</label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="نام شرکت را وارد کنید"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">واحد پول</label>
                <select 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="تومان">تومان</option>
                  <option value="ریال">ریال</option>
                  <option value="درهم">درهم</option>
                  <option value="دلار">دلار</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">پیشوند شماره فاکتور</label>
                <Input
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  placeholder="مثال: INV"
                />
              </div>

              <Button 
                onClick={saveCompanySettings} 
                className="w-full"
                disabled={settingsMutation.isPending}
              >
                {settingsMutation.isPending ? (
                  <i className="fas fa-spinner fa-spin ml-2"></i>
                ) : (
                  <i className="fas fa-save ml-2"></i>
                )}
                {settingsMutation.isPending ? "در حال ذخیره..." : "ذخیره تنظیمات شرکت"}
              </Button>
            </CardContent>
          </Card>
        );

      case "telegram":
        return (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <i className="fab fa-telegram"></i>
                تنظیمات تلگرام
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">توکن ربات تلگرام</label>
                <Input
                  type="password"
                  value={telegramToken}
                  onChange={(e) => setTelegramToken(e.target.value)}
                  placeholder="توکن ربات تلگرام را وارد کنید"
                />
                <p className="text-xs text-gray-500 mt-1">
                  برای دریافت توکن، با @BotFather در تلگرام چت کنید
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">شناسه کانال تلگرام</label>
                <Input
                  value={telegramChannel}
                  onChange={(e) => setTelegramChannel(e.target.value)}
                  placeholder="@channel_name یا -100xxxxxxx"
                />
              </div>

              <Button 
                onClick={saveTelegramSettings} 
                className="w-full"
                disabled={settingsMutation.isPending}
              >
                {settingsMutation.isPending ? (
                  <i className="fas fa-spinner fa-spin ml-2"></i>
                ) : (
                  <i className="fas fa-save ml-2"></i>
                )}
                {settingsMutation.isPending ? "در حال ذخیره..." : "ذخیره تنظیمات تلگرام"}
              </Button>
            </CardContent>
          </Card>
        );

      case "notifications":
        return (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <i className="fas fa-bell"></i>
                تنظیمات اعلان‌های تلگرام
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Master toggle */}
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <h3 className="font-semibold text-blue-900">فعال‌سازی کلی اعلان‌های تلگرام</h3>
                    <p className="text-sm text-blue-700 mt-1">تمام اعلان‌های تلگرام را فعال یا غیرفعال کنید</p>
                  </div>
                  <Switch
                    checked={telegramNotificationsEnabled}
                    onCheckedChange={setTelegramNotificationsEnabled}
                  />
                </div>

                {/* Individual notification toggles */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">تنظیمات جزئی اعلان‌ها</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <span className="font-medium">اعلان صدور فاکتور</span>
                        <p className="text-sm text-gray-600">اطلاع‌رسانی هنگام صدور فاکتور جدید</p>
                      </div>
                      <Switch
                        checked={invoiceNotifications && telegramNotificationsEnabled}
                        onCheckedChange={setInvoiceNotifications}
                        disabled={!telegramNotificationsEnabled}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <span className="font-medium">اعلان پرداخت</span>
                        <p className="text-sm text-gray-600">اطلاع‌رسانی تأیید پرداخت‌ها</p>
                      </div>
                      <Switch
                        checked={paymentNotifications && telegramNotificationsEnabled}
                        onCheckedChange={setPaymentNotifications}
                        disabled={!telegramNotificationsEnabled}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <span className="font-medium">هشدارهای سیستم</span>
                        <p className="text-sm text-gray-600">اعلان‌های مهم سیستم و خطاها</p>
                      </div>
                      <Switch
                        checked={systemAlerts && telegramNotificationsEnabled}
                        onCheckedChange={setSystemAlerts}
                        disabled={!telegramNotificationsEnabled}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <span className="font-medium">به‌روزرسانی نمایندگان</span>
                        <p className="text-sm text-gray-600">اطلاع‌رسانی تغییرات اطلاعات نمایندگان</p>
                      </div>
                      <Switch
                        checked={repUpdates && telegramNotificationsEnabled}
                        onCheckedChange={setRepUpdates}
                        disabled={!telegramNotificationsEnabled}
                      />
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <i className="fas fa-info-circle"></i>
                      <span className="font-medium">نکته مهم</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-2">
                      برای عملکرد صحیح اعلان‌ها، ابتدا کلید API تلگرام را در تب تلگرام تنظیم کنید.
                    </p>
                  </div>

                  <Button 
                    onClick={saveNotificationSettings} 
                    className="w-full"
                    disabled={settingsMutation.isPending}
                  >
                    {settingsMutation.isPending ? (
                      <i className="fas fa-spinner fa-spin ml-2"></i>
                    ) : (
                      <i className="fas fa-save ml-2"></i>
                    )}
                    {settingsMutation.isPending ? "در حال ذخیره..." : "ذخیره تنظیمات اعلان‌ها"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case "invoice-preview":
        return (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <i className="fas fa-file-invoice"></i>
                پیش‌نمایش قالب فاکتور
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex gap-4 items-center justify-between">
                  <div className="flex gap-2">
                    <select className="px-3 py-2 border rounded-md">
                      <option value="desktop">دسکتاپ</option>
                      <option value="mobile">موبایل</option>
                      <option value="print">چاپ</option>
                    </select>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.print()}
                    >
                      <i className="fas fa-print ml-2"></i>
                      چاپ
                    </Button>

                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => toast({ title: "PDF", description: "قابلیت دانلود PDF به زودی اضافه خواهد شد" })}
                    >
                      <i className="fas fa-download ml-2"></i>
                      PDF
                    </Button>
                  </div>
                </div>

                {/* Invoice Preview */}
                <Card className="max-w-2xl mx-auto bg-white border">
                  <CardContent className="p-8 space-y-6">
                    {/* Header */}
                    <div className="text-center border-b pb-4">
                      <h1 className="text-3xl font-bold text-blue-600">{companyName}</h1>
                      <p className="text-gray-600 mt-2">ارائه‌دهنده خدمات V2Ray و پروکسی</p>
                    </div>

                    {/* Invoice Info */}
                    <div className="grid grid-cols-2 gap-4 text-right">
                      <div>
                        <h3 className="font-semibold text-gray-700">شماره فاکتور:</h3>
                        <p className="text-lg font-mono">{invoicePrefix}-2025-PREVIEW</p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-700">تاریخ صدور:</h3>
                        <p>{new Date().toLocaleDateString('fa-IR')}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-700">نماینده:</h3>
                        <p>نماینده نمونه</p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-700">شماره تماس:</h3>
                        <p className="font-mono">09123456789</p>
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
                          <tr>
                            <td className="border border-gray-300 p-3 text-right">اشتراک ماهانه V2Ray</td>
                            <td className="border border-gray-300 p-3 text-center">5</td>
                            <td className="border border-gray-300 p-3 text-center font-mono">350,000 {currency}</td>
                            <td className="border border-gray-300 p-3 text-center font-mono">1,750,000 {currency}</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 p-3 text-right">اشتراک فوری V2Ray</td>
                            <td className="border border-gray-300 p-3 text-center">3</td>
                            <td className="border border-gray-300 p-3 text-center font-mono">250,000 {currency}</td>
                            <td className="border border-gray-300 p-3 text-center font-mono">750,000 {currency}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Total */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center text-xl font-bold">
                        <span>مبلغ کل قابل پرداخت:</span>
                        <span className="text-blue-600 font-mono">2,500,000 {currency}</span>
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
            </CardContent>
          </Card>
        );

      case "ai":
        return (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <i className="fas fa-robot"></i>
                تنظیمات هوش مصنوعی
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">کلید API هوش مصنوعی</label>
                <Input
                  type="password"
                  value={aiApiKey}
                  onChange={(e) => setAiApiKey(e.target.value)}
                  placeholder="کلید API را وارد کنید"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">کلید API Vertex AI</label>
                <Input
                  type="password"
                  value={vertexApiKey}
                  onChange={(e) => setVertexApiKey(e.target.value)}
                  placeholder="کلید Vertex AI را وارد کنید"
                />
              </div>

              <Button 
                onClick={saveAISettings} 
                className="w-full"
                disabled={settingsMutation.isPending}
              >
                {settingsMutation.isPending ? (
                  <i className="fas fa-spinner fa-spin ml-2"></i>
                ) : (
                  <i className="fas fa-save ml-2"></i>
                )}
                {settingsMutation.isPending ? "در حال ذخیره..." : "ذخیره تنظیمات هوش مصنوعی"}
              </Button>
            </CardContent>
          </Card>
        );

      case "danger":
        return (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <i className="fas fa-exclamation-triangle"></i>
                منطقه خطر
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-2">پاک کردن تمام داده‌ها</h3>
                <p className="text-sm text-red-700 mb-4">
                  این عمل تمام اطلاعات سیستم را پاک می‌کند و قابل بازگشت نیست.
                </p>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    if (confirm('آیا از پاک کردن تمام داده‌ها اطمینان دارید؟ این عمل قابل بازگشت نیست!')) {
                      toast({ 
                        title: "هشدار", 
                        description: "این عملکرد در نسخه تولید فعال خواهد شد",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  <i className="fas fa-trash ml-2"></i>
                  پاک کردن تمام داده‌ها
                </Button>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">ایجاد پشتیبان</h3>
                <p className="text-sm text-yellow-700 mb-4">
                  پشتیبان کاملی از اطلاعات سیستم ایجاد کنید.
                </p>
                <Button 
                  variant="outline"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/backup', { method: 'GET' });
                      if (response.ok) {
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `marfanet-backup-${new Date().toISOString().split('T')[0]}.json`;
                        link.click();
                        window.URL.revokeObjectURL(url);
                        toast({ title: "موفق", description: "پشتیبان با موفقیت ایجاد شد" });
                      } else {
                        toast({ title: "خطا", description: "خطا در ایجاد پشتیبان", variant: "destructive" });
                      }
                    } catch (error) {
                      toast({ title: "خطا", description: "خطا در ایجاد پشتیبان", variant: "destructive" });
                    }
                  }}
                >
                  <i className="fas fa-download ml-2"></i>
                  ایجاد پشتیبان
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card className="bg-card border-border">
            <CardContent className="text-center py-8">
              <i className="fas fa-cog text-4xl text-muted-foreground mb-4"></i>
              <p className="text-muted-foreground">تب انتخاب شده یافت نشد</p>
            </CardContent>
          </Card>
        );
    }
  };

  if (settingsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">تنظیمات</h1>
        </div>
        <div className="text-center py-8">
          <i className="fas fa-spinner fa-spin text-2xl text-primary mb-2"></i>
          <p>در حال بارگیری تنظیمات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">تنظیمات</h1>
      </div>

      {/* Tab Navigation */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="border-b border-border">
            <nav className="flex space-x-8 px-6" dir="rtl">
              {[
                { id: 'company', label: 'شرکت', icon: 'fa-building' },
                { id: 'telegram', label: 'تلگرام', icon: 'fa-telegram' },
                { id: 'notifications', label: 'اعلان‌ها', icon: 'fa-bell' },
                { id: 'invoice-preview', label: 'پیش‌نمایش فاکتور', icon: 'fa-file-invoice' },
                { id: 'ai', label: 'هوش مصنوعی', icon: 'fa-robot' },
                { id: 'danger', label: 'منطقه خطر', icon: 'fa-exclamation-triangle' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                    selectedTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                  }`}
                >
                  <i className={`fas ${tab.icon}`}></i>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </CardContent>
      </Card>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
}