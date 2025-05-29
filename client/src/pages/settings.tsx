import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Setting {
  id: number;
  key: string;
  value: string;
  description?: string;
}

interface ApiKeyStatus {
  telegram: boolean;
  ai: boolean;
  grok: boolean;
  telegramSet?: boolean;
  aiSet?: boolean;
  grokSet?: boolean;
}

export default function Settings() {
  const [companyName, setCompanyName] = useState("شرکت مارفانت");
  const [currency, setCurrency] = useState("تومان");
  const [invoicePrefix, setInvoicePrefix] = useState("INV");
  const [grokApiKey, setGrokApiKey] = useState("");
  const [selectedTab, setSelectedTab] = useState("company");
  
  // Invoice template states
  const [templateStyle, setTemplateStyle] = useState("modern");
  const [includeStoreName, setIncludeStoreName] = useState(true);
  const [includeTelegramId, setIncludeTelegramId] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState("pdf");
  const [showPreview, setShowPreview] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check API key status
  const { data: apiKeyStatus, isLoading: apiKeysLoading } = useQuery<ApiKeyStatus>({
    queryKey: ['/api/api-keys/status'],
    retry: false,
    staleTime: 30000
  });

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

  const saveApiKeyMutation = useMutation({
    mutationFn: (data: { keyType: string; keyValue: string }) =>
      apiRequest('POST', '/api/api-keys/validate', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/api-keys/status'] });
      toast({
        title: "موفقیت",
        description: "کلید API با موفقیت ذخیره شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در ذخیره کلید API",
        variant: "destructive",
      });
    },
  });

  // Danger Zone mutations
  const systemResetMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/system/reset', {}),
    onSuccess: (data: any) => {
      toast({
        title: "موفقیت",
        description: data.message,
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در بازنشانی سیستم",
        variant: "destructive",
      });
    },
  });

  const emergencyBackupMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/system/backup-emergency', {}),
    onSuccess: (data: any) => {
      toast({
        title: "موفقیت",
        description: data.message,
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در ایجاد پشتیبان اضطراری",
        variant: "destructive",
      });
    },
  });

  const handleSaveGrokKey = () => {
    if (!grokApiKey.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً کلید API Grok را وارد کنید", 
        variant: "destructive",
      });
      return;
    }
    saveApiKeyMutation.mutate({ keyType: 'grok', keyValue: grokApiKey });
  };

  const handleSaveCompanySettings = () => {
    saveSettingMutation.mutate({ key: 'companyName', value: companyName });
    saveSettingMutation.mutate({ key: 'currency', value: currency });
  };

  const handleSaveInvoiceSettings = () => {
    saveSettingMutation.mutate({ key: 'invoicePrefix', value: invoicePrefix });
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
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">نام شرکت</label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="نام شرکت"
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">واحد پول</label>
                  <Input
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    placeholder="تومان"
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">پیشوند شماره فاکتور</label>
                  <Input
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    placeholder="INV"
                    className="bg-input border-border text-foreground"
                  />
                </div>
              </div>
              <div className="mt-6 space-x-2">
                <Button onClick={handleSaveCompanySettings} disabled={saveSettingMutation.isPending}>
                  <i className="fas fa-save ml-2"></i>
                  ذخیره اطلاعات شرکت
                </Button>
                <Button onClick={handleSaveInvoiceSettings} disabled={saveSettingMutation.isPending}>
                  <i className="fas fa-save ml-2"></i>
                  ذخیره تنظیمات فاکتور
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case "invoice":
        return (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <i className="fas fa-file-invoice"></i>
                تنظیمات قالب فاکتور
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Template Style Selection */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">انتخاب قالب طراحی</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { id: 'modern', name: 'مدرن و پاک', desc: 'طراحی مینیمال با استفاده از رنگ آبی برند', icon: 'fa-laptop' },
                      { id: 'classic', name: 'کلاسیک و رسمی', desc: 'طراحی سنتی تجاری با حاشیه و فرم منظم', icon: 'fa-building' },
                      { id: 'persian', name: 'بهینه شده فارسی', desc: 'طراحی راست-چین با قلم و فاصله مناسب فارسی', icon: 'fa-align-right' }
                    ].map((style) => (
                      <div
                        key={style.id}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          templateStyle === style.id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setTemplateStyle(style.id)}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <i className={`fas ${style.icon} text-lg ${templateStyle === style.id ? 'text-primary' : 'text-gray-400'}`}></i>
                          <h3 className={`font-medium ${templateStyle === style.id ? 'text-primary' : 'text-gray-700'}`}>{style.name}</h3>
                        </div>
                        <p className="text-sm text-gray-600">{style.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Optional Elements */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">عناصر اختیاری فاکتور</label>
                  <div className="space-y-3">
                    {[
                      { key: 'storeName', label: 'نام فروشگاه نماینده', state: includeStoreName, setState: setIncludeStoreName },
                      { key: 'telegramId', label: 'شناسه تلگرام نماینده', state: includeTelegramId, setState: setIncludeTelegramId },
                      { key: 'notes', label: 'بخش یادداشت و توضیحات', state: includeNotes, setState: setIncludeNotes }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between">
                        <span className="text-sm text-foreground">{item.label}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={item.state}
                            onChange={(e) => item.setState(e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">لوگوی شرکت</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <i className="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-2"></i>
                    <p className="text-sm text-gray-600 mb-2">فایل لوگو را انتخاب کنید (PNG, JPG)</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload" className="inline-block bg-primary text-white px-4 py-2 rounded-md cursor-pointer hover:bg-primary/90">
                      انتخاب فایل
                    </label>
                    {logoFile && <p className="mt-2 text-sm text-green-600">فایل انتخاب شده: {logoFile.name}</p>}
                  </div>
                </div>

                {/* Output Format */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">فرمت خروجی</label>
                  <div className="flex gap-4">
                    {[
                      { id: 'pdf', label: 'PDF', icon: 'fa-file-pdf' },
                      { id: 'image', label: 'تصویر', icon: 'fa-image' },
                      { id: 'both', label: 'هر دو', icon: 'fa-copy' }
                    ].map((format) => (
                      <label key={format.id} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="outputFormat"
                          value={format.id}
                          checked={outputFormat === format.id}
                          onChange={(e) => setOutputFormat(e.target.value)}
                          className="sr-only"
                        />
                        <div className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-all ${
                          outputFormat === format.id ? 'border-primary bg-primary/5 text-primary' : 'border-gray-300 text-gray-600'
                        }`}>
                          <i className={`fas ${format.icon}`}></i>
                          <span className="text-sm font-medium">{format.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Preview Area */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">پیش‌نمایش قالب</label>
                  {!showPreview ? (
                    <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 text-center">
                      <i className="fas fa-eye text-2xl text-gray-400 mb-2"></i>
                      <p className="text-sm text-gray-600 mb-3">پیش‌نمایش فاکتور با تنظیمات انتخاب شده</p>
                      <Button 
                        variant="outline" 
                        className="text-sm"
                        onClick={() => setShowPreview(true)}
                      >
                        <i className="fas fa-search ml-2"></i>
                        مشاهده پیش‌نمایش
                      </Button>
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-gray-800">پیش‌نمایش فاکتور - قالب {templateStyle === 'modern' ? 'مدرن' : templateStyle === 'classic' ? 'کلاسیک' : 'فارسی'}</h3>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowPreview(false)}
                        >
                          <i className="fas fa-times ml-1"></i>
                          بستن
                        </Button>
                      </div>
                      
                      {/* Sample Invoice Preview */}
                      <div className={`invoice-preview ${templateStyle} bg-white border p-6 rounded text-right`} dir="rtl">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                                <i className="fas fa-chart-line text-white"></i>
                              </div>
                              <h1 className="text-2xl font-bold text-gray-800">{companyName}</h1>
                            </div>
                            <p className="text-gray-600">تهران، خیابان ولیعصر، پلاک ۱۲۳</p>
                            <p className="text-gray-600">تلفن: ۰۲۱-۱۲۳۴۵۶۷۸</p>
                          </div>
                          <div className="text-left">
                            <h2 className="text-xl font-bold text-primary mb-2">فاکتور</h2>
                            <p className="text-gray-600">شماره: {invoicePrefix}-۲۰۲۵-۰۰۱۲۳</p>
                            <p className="text-gray-600">تاریخ: ۱۴۰۳/۱۰/۰۹</p>
                          </div>
                        </div>

                        {/* Representative Info */}
                        <div className="bg-gray-50 p-4 rounded-lg mb-6">
                          <h3 className="font-semibold text-gray-800 mb-3">اطلاعات نماینده</h3>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">نام کامل:</span>
                              <span className="font-medium mr-2">احمد محمدی</span>
                            </div>
                            <div>
                              <span className="text-gray-600">نام کاربری ادمین:</span>
                              <span className="font-medium mr-2">ahmad_admin</span>
                            </div>
                            {includeStoreName && (
                              <div>
                                <span className="text-gray-600">نام فروشگاه:</span>
                                <span className="font-medium mr-2">فروشگاه تکنولوژی محمدی</span>
                              </div>
                            )}
                            {includeTelegramId && (
                              <div>
                                <span className="text-gray-600">تلگرام:</span>
                                <span className="font-medium mr-2">@ahmad_tech</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Items Table */}
                        <div className="mb-6">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-primary text-white">
                                <th className="border p-2 text-right">شرح خدمات</th>
                                <th className="border p-2 text-center">تعداد</th>
                                <th className="border p-2 text-center">قیمت واحد</th>
                                <th className="border p-2 text-center">مبلغ کل</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="border p-2">اشتراک حجمی - ماه ۱</td>
                                <td className="border p-2 text-center">۱۰</td>
                                <td className="border p-2 text-center">۵۰,۰۰۰ {currency}</td>
                                <td className="border p-2 text-center">۵۰۰,۰۰۰ {currency}</td>
                              </tr>
                              <tr className="bg-gray-50">
                                <td className="border p-2">اشتراک نامحدود - ماه ۱</td>
                                <td className="border p-2 text-center">۵</td>
                                <td className="border p-2 text-center">۱۲۰,۰۰۰ {currency}</td>
                                <td className="border p-2 text-center">۶۰۰,۰۰۰ {currency}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Total */}
                        <div className="flex justify-end">
                          <div className="w-64">
                            <div className="flex justify-between py-2 border-b">
                              <span>جمع کل:</span>
                              <span className="font-semibold">۱,۱۰۰,۰۰۰ {currency}</span>
                            </div>
                          </div>
                        </div>

                        {/* Notes */}
                        {includeNotes && (
                          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                            <h4 className="font-medium text-gray-800 mb-2">یادداشت:</h4>
                            <p className="text-sm text-gray-600">لطفاً مبلغ فاکتور را تا تاریخ سررسید پرداخت نمایید.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Custom Notes Section */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">یادداشت پیش‌فرض فاکتور</label>
                  <textarea
                    placeholder="متن یادداشت پیش‌فرض که در همه فاکتورها نمایش داده خواهد شد..."
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                    rows={4}
                    defaultValue="لطفاً مبلغ فاکتور را تا تاریخ سررسید پرداخت نمایید. در صورت سوال با پشتیبانی تماس بگیرید."
                  />
                  <p className="text-xs text-gray-500 mt-1">این یادداشت در انتهای همه فاکتورها نمایش داده می‌شود</p>
                </div>

                {/* Save Settings */}
                <div className="pt-4 border-t border-gray-200">
                  <Button className="w-full">
                    <i className="fas fa-save ml-2"></i>
                    ذخیره تنظیمات قالب فاکتور
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case "grok":
        return (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <i className="fas fa-robot"></i>
                Vertex AI Insight Engine
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!apiKeysLoading && apiKeyStatus && (
                  <div className={`p-3 rounded-lg border ${apiKeyStatus.grok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center gap-2">
                      <i className={`fas ${apiKeyStatus.grok ? 'fa-check-circle text-green-600' : 'fa-exclamation-triangle text-red-600'}`}></i>
                      <span className={`text-sm font-medium ${apiKeyStatus.grok ? 'text-green-800' : 'text-red-800'}`}>
                        {apiKeyStatus.grok ? 'کلید Vertex AI تنظیم شده و آماده استفاده' : 'کلید Vertex AI تنظیم نشده - لطفاً کلید API را وارد کنید'}
                      </span>
                    </div>
                  </div>
                )}
                
                {apiKeysLoading && (
                  <div className="p-3 rounded-lg border bg-gray-50 border-gray-200">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-spinner fa-spin text-gray-600"></i>
                      <span className="text-sm font-medium text-gray-800">
                        در حال بررسی وضعیت کلیدها...
                      </span>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">کلید Grok xAI API</label>
                  <Input
                    type="password"
                    value={grokApiKey}
                    onChange={(e) => setGrokApiKey(e.target.value)}
                    placeholder="کلید API Grok"
                    className="bg-input border-border text-foreground"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    کلید API برای استفاده از قابلیت‌های پیشرفته Grok xAI
                  </p>
                </div>

                <div className="mt-6">
                  <Button onClick={handleSaveGrokKey} disabled={saveApiKeyMutation.isPending}>
                    <i className="fas fa-save ml-2"></i>
                    ذخیره کلید Grok
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case "danger":
        return (
          <Card className="bg-card border-border border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <i className="fas fa-exclamation-triangle"></i>
                منطقه خطر
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">پاک کردن کامل داده‌ها</h3>
                  <p className="text-red-700 text-sm mb-4">
                    این عمل تمام اطلاعات شامل نمایندگان، فاکتورها، پرداخت‌ها و تنظیمات را حذف می‌کند
                  </p>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => systemResetMutation.mutate()}
                    disabled={systemResetMutation.isPending}
                  >
                    <i className="fas fa-trash ml-2"></i>
                    {systemResetMutation.isPending ? "در حال پاک کردن..." : "پاک کردن کامل سیستم"}
                  </Button>
                </div>
                
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h3 className="font-semibold text-orange-800 mb-2">ایجاد پشتیبان اضطراری</h3>
                  <p className="text-orange-700 text-sm mb-4">
                    ایجاد نسخه پشتیبان کامل از تمام داده‌های سیستم
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full border-orange-300 text-orange-700 hover:bg-orange-100"
                    onClick={() => emergencyBackupMutation.mutate()}
                    disabled={emergencyBackupMutation.isPending}
                  >
                    <i className="fas fa-download ml-2"></i>
                    {emergencyBackupMutation.isPending ? "در حال ایجاد پشتیبان..." : "ایجاد پشتیبان"}
                  </Button>
                </div>
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
                { id: 'invoice', label: 'قالب فاکتور', icon: 'fa-file-invoice' },
                { id: 'grok', label: 'Grok xAI', icon: 'fa-robot' },
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