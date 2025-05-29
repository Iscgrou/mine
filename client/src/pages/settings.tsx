import { useState, useEffect } from "react";
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

export default function Settings() {
  const [companyName, setCompanyName] = useState("شرکت مارفانت");
  const [currency, setCurrency] = useState("تومان");
  const [invoicePrefix, setInvoicePrefix] = useState("INV");
  const [invoiceFormat, setInvoiceFormat] = useState("PDF");
  const [grokApiKey, setGrokApiKey] = useState("");
  const [selectedTab, setSelectedTab] = useState("company");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check API key status with error handling
  const { data: apiKeyStatus, isLoading: apiKeysLoading, error: apiKeyError } = useQuery({
    queryKey: ['/api/api-keys/status'],
    retry: false,
    staleTime: 30000,
    refetchOnWindowFocus: false
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

  // Save functions with error handling
  const handleSaveTelegramKey = () => {
    if (!telegramToken.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً کلید API تلگرام را وارد کنید",
        variant: "destructive",
      });
      return;
    }
    saveApiKeyMutation.mutate({ keyType: 'telegram', keyValue: telegramToken });
  };

  const handleSaveAiKey = () => {
    if (!aiApiKey.trim()) {
      toast({
        title: "خطا", 
        description: "لطفاً کلید API هوش مصنوعی را وارد کنید",
        variant: "destructive",
      });
      return;
    }
    saveApiKeyMutation.mutate({ keyType: 'ai', keyValue: aiApiKey });
  };

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
    saveSettingMutation.mutate({ key: 'invoiceFormat', value: invoiceFormat });
  };

  // Helper function to render API key status
  const renderApiKeyStatus = (keyName: string, isSet: boolean, statusText: string) => {
    return (
      <div className={`p-3 rounded-lg border ${isSet ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center gap-2">
          <i className={`fas ${isSet ? 'fa-check-circle text-green-600' : 'fa-exclamation-triangle text-red-600'}`}></i>
          <span className={`text-sm font-medium ${isSet ? 'text-green-800' : 'text-red-800'}`}>
            {statusText}
          </span>
        </div>
      </div>
    );
  };

  // Tab content with graceful degradation
  const renderTabContent = () => {
    try {
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
                <div className="mt-6">
                  <Button onClick={handleSaveCompanySettings} disabled={saveSettingMutation.isPending}>
                    <i className="fas fa-save ml-2"></i>
                    ذخیره اطلاعات شرکت
                  </Button>
                </div>
              </CardContent>
            </Card>
          );

        case "telegram":
          return (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <i className="fab fa-telegram"></i>
                  ادغام تلگرام و گزارش‌گیری خودکار
                </CardTitle>
              </CardHeader>
              <CardContent>
                {apiKeysLoading ? (
                  <div className="text-center py-8">
                    <i className="fas fa-spinner fa-spin text-2xl text-primary mb-2"></i>
                    <p>در حال بررسی وضعیت کلیدهای API...</p>
                  </div>
                ) : apiKeyError ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <i className="fas fa-info-circle text-yellow-600"></i>
                      <h3 className="font-medium text-yellow-800">راهنمای تنظیم تلگرام</h3>
                    </div>
                    <p className="text-yellow-700 text-sm mb-4">
                      برای فعال‌سازی ادغام تلگرام، ابتدا کلید API ربات تلگرام را وارد کنید
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">کلید API تلگرام</label>
                        <Input
                          type="password"
                          value={telegramToken}
                          onChange={(e) => setTelegramToken(e.target.value)}
                          placeholder="کلید API ربات تلگرام"
                          className="bg-input border-border text-foreground"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          برای دریافت کلید API از @BotFather در تلگرام استفاده کنید
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">کانال گزارش‌گیری</label>
                        <Input
                          value={telegramChannel}
                          onChange={(e) => setTelegramChannel(e.target.value)}
                          placeholder="@channel_name"
                          className="bg-input border-border text-foreground"
                        />
                      </div>

                      <Button onClick={handleSaveTelegramKey} disabled={saveApiKeyMutation.isPending}>
                        <i className="fas fa-save ml-2"></i>
                        ذخیره تنظیمات تلگرام
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {apiKeyStatus && renderApiKeyStatus('telegram', apiKeyStatus.telegram, apiKeyStatus.telegramSet)}
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">کلید API تلگرام</label>
                      <Input
                        type="password"
                        value={telegramToken}
                        onChange={(e) => setTelegramToken(e.target.value)}
                        placeholder="کلید API ربات تلگرام"
                        className="bg-input border-border text-foreground"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        برای دریافت کلید API از @BotFather در تلگرام استفاده کنید
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">کانال گزارش‌گیری</label>
                      <Input
                        value={telegramChannel}
                        onChange={(e) => setTelegramChannel(e.target.value)}
                        placeholder="@channel_name"
                        className="bg-input border-border text-foreground"
                      />
                    </div>

                    <div className="mt-6">
                      <Button onClick={handleSaveTelegramKey} disabled={saveApiKeyMutation.isPending}>
                        <i className="fas fa-save ml-2"></i>
                        ذخیره تنظیمات تلگرام
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );

        case "ai":
          return (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <i className="fas fa-robot"></i>
                  ابزارهای هوش مصنوعی
                </CardTitle>
              </CardHeader>
              <CardContent>
                {apiKeysLoading ? (
                  <div className="text-center py-8">
                    <i className="fas fa-spinner fa-spin text-2xl text-primary mb-2"></i>
                    <p>در حال بررسی وضعیت کلیدهای API...</p>
                  </div>
                ) : apiKeyError ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <i className="fas fa-info-circle text-yellow-600"></i>
                      <h3 className="font-medium text-yellow-800">راهنمای تنظیم هوش مصنوعی</h3>
                    </div>
                    <p className="text-yellow-700 text-sm mb-4">
                      برای فعال‌سازی ابزارهای هوش مصنوعی، ابتدا کلیدهای API مورد نیاز را وارد کنید
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">کلید API هوش مصنوعی</label>
                        <Input
                          type="password"
                          value={aiApiKey}
                          onChange={(e) => setAiApiKey(e.target.value)}
                          placeholder="کلید API سرویس هوش مصنوعی"
                          className="bg-input border-border text-foreground"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">کلید Grok API</label>
                        <Input
                          type="password"
                          value={grokApiKey}
                          onChange={(e) => setGrokApiKey(e.target.value)}
                          placeholder="کلید API Grok"
                          className="bg-input border-border text-foreground"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button onClick={handleSaveAiKey} disabled={saveApiKeyMutation.isPending}>
                          <i className="fas fa-save ml-2"></i>
                          ذخیره کلید AI
                        </Button>
                        <Button onClick={handleSaveGrokKey} disabled={saveApiKeyMutation.isPending}>
                          <i className="fas fa-save ml-2"></i>
                          ذخیره کلید Grok
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {apiKeyStatus && renderApiKeyStatus('ai', apiKeyStatus.ai, apiKeyStatus.aiSet)}
                    {apiKeyStatus && renderApiKeyStatus('grok', apiKeyStatus.grok, apiKeyStatus.grokSet)}
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">کلید API هوش مصنوعی</label>
                      <Input
                        type="password"
                        value={aiApiKey}
                        onChange={(e) => setAiApiKey(e.target.value)}
                        placeholder="کلید API سرویس هوش مصنوعی"
                        className="bg-input border-border text-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">کلید Grok API</label>
                      <Input
                        type="password"
                        value={grokApiKey}
                        onChange={(e) => setGrokApiKey(e.target.value)}
                        placeholder="کلید API Grok"
                        className="bg-input border-border text-foreground"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <Button onClick={handleSaveAiKey} disabled={saveApiKeyMutation.isPending}>
                        <i className="fas fa-save ml-2"></i>
                        ذخیره کلید AI
                      </Button>
                      <Button onClick={handleSaveGrokKey} disabled={saveApiKeyMutation.isPending}>
                        <i className="fas fa-save ml-2"></i>
                        ذخیره کلید Grok
                      </Button>
                    </div>
                  </div>
                )}
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
                    <Button variant="destructive" className="w-full">
                      <i className="fas fa-trash ml-2"></i>
                      پاک کردن کامل سیستم
                    </Button>
                  </div>
                  
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <h3 className="font-semibold text-orange-800 mb-2">ایجاد پشتیبان اضطراری</h3>
                    <p className="text-orange-700 text-sm mb-4">
                      ایجاد نسخه پشتیبان کامل از تمام داده‌های سیستم
                    </p>
                    <Button variant="outline" className="w-full border-orange-300 text-orange-700 hover:bg-orange-100">
                      <i className="fas fa-download ml-2"></i>
                      ایجاد پشتیبان
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
    } catch (error) {
      console.error("Error rendering tab:", error);
      return (
        <Card className="bg-card border-border">
          <CardContent className="text-center py-8">
            <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
            <p className="text-red-600 font-medium">خطا در نمایش محتوای تب</p>
            <p className="text-muted-foreground text-sm mt-2">لطفاً صفحه را تازه‌سازی کنید</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()} 
              className="mt-4"
            >
              تازه‌سازی صفحه
            </Button>
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