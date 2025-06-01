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
  vertexAI: boolean;
  telegramSet?: string;
  vertexAISet?: string;
}

export default function Settings() {
  const [companyName, setCompanyName] = useState("شرکت مارفانت");
  const [currency, setCurrency] = useState("تومان");
  const [invoicePrefix, setInvoicePrefix] = useState("INV");
  const [vertexApiKey, setVertexApiKey] = useState("");
  const [selectedTab, setSelectedTab] = useState("company");
  
  // Alpha 35 Invoice Configuration States
  const [invoiceConfig, setInvoiceConfig] = useState({
    template: "professional",
    headerStyle: "centered",
    showLogo: true,
    logoPosition: "top-left",
    companyInfoDisplay: "full",
    representativeInfoLevel: "detailed",
    itemGrouping: "by-duration",
    calculationDisplay: "detailed",
    commissionVisibility: "hidden",
    footerContent: "contact-info",
    colorScheme: "blue-professional",
    fontFamily: "iranian-sans",
    paperSize: "a4",
    margins: "standard",
    watermark: false,
    qrCode: true,
    digitalSignature: false
  });

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
    retry: false,
    staleTime: 30000
  });

  // Load existing settings
  const existingSettings = settings?.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, string>) || {};

  // Save setting mutation
  const saveSettingMutation = useMutation({
    mutationFn: async (setting: { key: string; value: string; description?: string }) => {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setting)
      });
      if (!response.ok) throw new Error('Failed to save setting');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تنظیمات ذخیره شد",
        description: "تغییرات با موفقیت اعمال شد"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/api-keys/status'] });
    },
    onError: () => {
      toast({
        title: "خطا در ذخیره تنظیمات",
        description: "لطفاً دوباره تلاش کنید",
        variant: "destructive"
      });
    }
  });

  const handleSaveCompanySettings = () => {
    saveSettingMutation.mutate({
      key: 'company_settings',
      value: JSON.stringify({ companyName, currency, invoicePrefix }),
      description: 'Company Configuration Settings'
    });
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
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">نام شرکت</label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="نام شرکت خود را وارد کنید"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">واحد پول</label>
                  <select 
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="تومان">تومان</option>
                    <option value="ریال">ریال</option>
                    <option value="درهم">درهم</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">پیشوند شماره فاکتور</label>
                  <Input
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    placeholder="مثال: INV, MF"
                  />
                </div>

                <div className="mt-6">
                  <Button onClick={handleSaveCompanySettings} disabled={saveSettingMutation.isPending}>
                    <i className="fas fa-save ml-2"></i>
                    ذخیره اطلاعات شرکت
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case "invoice":
        return (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <i className="fas fa-cogs"></i>
                سیستم پیکربندی فاکتور Alpha 35
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Template & Layout Configuration */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-foreground">قالب و طرح‌بندی</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">نوع قالب</label>
                        <select 
                          value={invoiceConfig.template}
                          onChange={(e) => setInvoiceConfig({...invoiceConfig, template: e.target.value})}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="professional">حرفه‌ای</option>
                          <option value="modern">مدرن</option>
                          <option value="classic">کلاسیک</option>
                          <option value="minimalist">مینیمال</option>
                          <option value="iranian-traditional">سنتی ایرانی</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">سبک هدر</label>
                        <select 
                          value={invoiceConfig.headerStyle}
                          onChange={(e) => setInvoiceConfig({...invoiceConfig, headerStyle: e.target.value})}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="centered">متمرکز</option>
                          <option value="left-aligned">چپ‌چین</option>
                          <option value="split">دوطرفه</option>
                          <option value="banner">بنری</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">طرح رنگی</label>
                        <select 
                          value={invoiceConfig.colorScheme}
                          onChange={(e) => setInvoiceConfig({...invoiceConfig, colorScheme: e.target.value})}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="blue-professional">آبی حرفه‌ای</option>
                          <option value="green-corporate">سبز شرکتی</option>
                          <option value="gray-elegant">خاکستری شیک</option>
                          <option value="persian-blue">آبی ایرانی</option>
                          <option value="custom">سفارشی</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">نوع فونت</label>
                        <select 
                          value={invoiceConfig.fontFamily}
                          onChange={(e) => setInvoiceConfig({...invoiceConfig, fontFamily: e.target.value})}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="iranian-sans">ایران Sans</option>
                          <option value="vazir">وزیر</option>
                          <option value="yekan">یکان</option>
                          <option value="sahel">ساحل</option>
                          <option value="custom">سفارشی</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Content Configuration */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-foreground">محتوا و اطلاعات</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">سطح جزئیات نماینده</label>
                        <select 
                          value={invoiceConfig.representativeInfoLevel}
                          onChange={(e) => setInvoiceConfig({...invoiceConfig, representativeInfoLevel: e.target.value})}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="basic">پایه (نام و کد)</option>
                          <option value="detailed">تفصیلی (کامل)</option>
                          <option value="contact-only">فقط تماس</option>
                          <option value="business-focused">تجاری محور</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">گروه‌بندی آیتم‌ها</label>
                        <select 
                          value={invoiceConfig.itemGrouping}
                          onChange={(e) => setInvoiceConfig({...invoiceConfig, itemGrouping: e.target.value})}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="by-duration">بر اساس مدت</option>
                          <option value="by-type">بر اساس نوع (محدود/نامحدود)</option>
                          <option value="by-volume">بر اساس حجم</option>
                          <option value="flat">تخت (بدون گروه‌بندی)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">نمایش محاسبات</label>
                        <select 
                          value={invoiceConfig.calculationDisplay}
                          onChange={(e) => setInvoiceConfig({...invoiceConfig, calculationDisplay: e.target.value})}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="detailed">تفصیلی (همه فرمول‌ها)</option>
                          <option value="summary">خلاصه</option>
                          <option value="minimal">حداقلی</option>
                          <option value="step-by-step">مرحله به مرحله</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">نمایش کمیسیون</label>
                        <select 
                          value={invoiceConfig.commissionVisibility}
                          onChange={(e) => setInvoiceConfig({...invoiceConfig, commissionVisibility: e.target.value})}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="hidden">مخفی</option>
                          <option value="summary-only">فقط خلاصه</option>
                          <option value="detailed">تفصیلی</option>
                          <option value="separate-section">بخش جداگانه</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Advanced Configuration */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-foreground">تنظیمات پیشرفته</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">اندازه کاغذ</label>
                        <select 
                          value={invoiceConfig.paperSize}
                          onChange={(e) => setInvoiceConfig({...invoiceConfig, paperSize: e.target.value})}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="a4">A4</option>
                          <option value="letter">Letter</option>
                          <option value="legal">Legal</option>
                          <option value="custom">سفارشی</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">حاشیه‌ها</label>
                        <select 
                          value={invoiceConfig.margins}
                          onChange={(e) => setInvoiceConfig({...invoiceConfig, margins: e.target.value})}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="narrow">باریک</option>
                          <option value="standard">استاندارد</option>
                          <option value="wide">پهن</option>
                          <option value="custom">سفارشی</option>
                        </select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            checked={invoiceConfig.showLogo}
                            onChange={(e) => setInvoiceConfig({...invoiceConfig, showLogo: e.target.checked})}
                            className="mr-2"
                          />
                          نمایش لوگو
                        </label>
                        
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            checked={invoiceConfig.qrCode}
                            onChange={(e) => setInvoiceConfig({...invoiceConfig, qrCode: e.target.checked})}
                            className="mr-2"
                          />
                          QR Code
                        </label>
                        
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            checked={invoiceConfig.watermark}
                            onChange={(e) => setInvoiceConfig({...invoiceConfig, watermark: e.target.checked})}
                            className="mr-2"
                          />
                          واترمارک
                        </label>
                        
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            checked={invoiceConfig.digitalSignature}
                            onChange={(e) => setInvoiceConfig({...invoiceConfig, digitalSignature: e.target.checked})}
                            className="mr-2"
                          />
                          امضای دیجیتال
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          // Generate preview with current config
                          window.open(`/api/invoice/preview?config=${btoa(JSON.stringify(invoiceConfig))}`, '_blank');
                        }}
                      >
                        <i className="fas fa-eye ml-2"></i>
                        پیش‌نمایش
                      </Button>
                      
                      <Button 
                        onClick={() => {
                          // Save invoice configuration
                          saveSettingMutation.mutate({
                            key: 'invoice_config_alpha35',
                            value: JSON.stringify(invoiceConfig),
                            description: 'Alpha 35 Invoice Configuration System'
                          });
                        }}
                        disabled={saveSettingMutation.isPending}
                      >
                        <i className="fas fa-save ml-2"></i>
                        ذخیره تنظیمات
                      </Button>
                    </div>
                    
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        // Reset to defaults
                        setInvoiceConfig({
                          template: "professional",
                          headerStyle: "centered",
                          showLogo: true,
                          logoPosition: "top-left",
                          companyInfoDisplay: "full",
                          representativeInfoLevel: "detailed",
                          itemGrouping: "by-duration",
                          calculationDisplay: "detailed",
                          commissionVisibility: "hidden",
                          footerContent: "contact-info",
                          colorScheme: "blue-professional",
                          fontFamily: "iranian-sans",
                          paperSize: "a4",
                          margins: "standard",
                          watermark: false,
                          qrCode: true,
                          digitalSignature: false
                        });
                      }}
                    >
                      <i className="fas fa-undo ml-2"></i>
                      بازگردانی به پیش‌فرض
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case "api":
        return (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <i className="fas fa-key"></i>
                مدیریت کلیدهای API
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* API Key Status */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-foreground">وضعیت کلیدهای API</h3>
                  {apiKeysLoading ? (
                    <div className="text-center py-4">
                      <i className="fas fa-spinner fa-spin text-2xl text-primary"></i>
                      <p className="mt-2 text-muted-foreground">بررسی وضعیت...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className={`p-4 rounded-lg border ${apiKeyStatus?.vertexAI ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <i className={`fas fa-brain ${apiKeyStatus?.vertexAI ? 'text-green-600' : 'text-red-600'}`}></i>
                          <span className="font-medium">Google Vertex AI</span>
                        </div>
                        <p className={`text-sm ${apiKeyStatus?.vertexAI ? 'text-green-700' : 'text-red-700'}`}>
                          {apiKeyStatus?.vertexAI ? 'متصل و فعال' : 'نیاز به پیکربندی'}
                        </p>
                        {apiKeyStatus?.vertexAISet && (
                          <p className="text-xs text-gray-600 mt-1">
                            کلید: {apiKeyStatus.vertexAISet}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* API Key Configuration */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-foreground">پیکربندی کلیدهای API</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        کلید Google Vertex AI
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type="password"
                          placeholder="کلید API خود را وارد کنید..."
                          value={vertexApiKey}
                          onChange={(e) => setVertexApiKey(e.target.value)}
                          className="flex-1"
                        />
                        <Button 
                          onClick={() => {
                            saveSettingMutation.mutate({
                              key: 'vertex_ai_key',
                              value: vertexApiKey,
                              description: 'Google Vertex AI API Key'
                            });
                          }}
                          disabled={saveSettingMutation.isPending || !vertexApiKey}
                        >
                          <i className="fas fa-save ml-2"></i>
                          ذخیره
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-3xl text-primary mb-4"></i>
          <p className="text-muted-foreground">در حال بارگذاری تنظیمات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">تنظیمات سیستم</h1>
        <p className="text-muted-foreground">مدیریت تنظیمات کلی سیستم مارفانت</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-border">
        {[
          { id: "company", label: "اطلاعات شرکت", icon: "fa-building" },
          { id: "invoice", label: "فاکتور Alpha 35", icon: "fa-file-invoice" },
          { id: "api", label: "کلیدهای API", icon: "fa-key" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
              selectedTab === tab.id
                ? 'bg-primary text-white border-b-2 border-primary'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <i className={`fas ${tab.icon} ml-2`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
}