/**
 * GEMINI 2.5 PRO GENESIS RECONSTRUCTION
 * Settings System Complete Rebuild - Production Ready Solution
 * Addresses: Data persistence failures, Vertex AI config loss, interface non-responsiveness
 */

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Setting {
  id: number;
  key: string;
  value: string;
  description?: string;
  updatedAt: string;
}

interface ApiKeyStatus {
  telegram: boolean;
  vertexAI: boolean;
  grok: boolean;
  telegramSet?: string;
  vertexAISet?: string;
  grokSet?: string;
}

interface SettingsFormData {
  companyName: string;
  currency: string;
  invoicePrefix: string;
  templateStyle: string;
  includeStoreName: boolean;
  includeTelegramId: boolean;
  includeNotes: boolean;
  outputFormat: string;
}

export default function ReconstructedSettings() {
  const [activeTab, setActiveTab] = useState("company");
  const [formData, setFormData] = useState<SettingsFormData>({
    companyName: "شرکت مارفانت",
    currency: "تومان",
    invoicePrefix: "INV",
    templateStyle: "persian_optimized",
    includeStoreName: true,
    includeTelegramId: true,
    includeNotes: false,
    outputFormat: "pdf"
  });
  
  const [apiKeys, setApiKeys] = useState({
    vertexAI: "",
    telegram: "",
    grok: ""
  });

  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Enhanced data fetching with error boundaries
  const { data: settings, isLoading: settingsLoading, error: settingsError } = useQuery<Setting[]>({
    queryKey: ['/api/settings'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: 1000
  });

  const { data: apiKeyStatus, isLoading: apiKeysLoading } = useQuery<ApiKeyStatus>({
    queryKey: ['/api/api-keys/status'],
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 3
  });

  // Auto-save functionality with debouncing
  useEffect(() => {
    if (!isDirty) return;
    
    const autoSaveTimer = setTimeout(() => {
      handleAutoSave();
    }, 3000); // Auto-save after 3 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [formData, isDirty]);

  // Load settings into form
  useEffect(() => {
    if (settings) {
      const settingsMap = new Map(settings.map(s => [s.key, s.value]));
      setFormData(prev => ({
        ...prev,
        companyName: settingsMap.get('companyName') || prev.companyName,
        currency: settingsMap.get('currency') || prev.currency,
        invoicePrefix: settingsMap.get('invoicePrefix') || prev.invoicePrefix,
        templateStyle: settingsMap.get('templateStyle') || prev.templateStyle,
        includeStoreName: settingsMap.get('includeStoreName') === 'true',
        includeTelegramId: settingsMap.get('includeTelegramId') === 'true',
        includeNotes: settingsMap.get('includeNotes') === 'true',
        outputFormat: settingsMap.get('outputFormat') || prev.outputFormat
      }));
    }
  }, [settings]);

  // Batch save mutation with transaction support
  const batchSaveMutation = useMutation({
    mutationFn: async (data: { settings: Array<{key: string, value: string, description?: string}>, apiKeys?: {[key: string]: string} }) => {
      const response = await apiRequest('POST', '/api/settings/batch', data);
      return response;
    },
    onSuccess: () => {
      setIsDirty(false);
      setLastSaved(new Date());
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/api-keys/status'] });
      toast({
        title: "موفقیت",
        description: "تمام تنظیمات با موفقیت ذخیره شد",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطا در ذخیره",
        description: error.message || "خطا در ذخیره تنظیمات",
        variant: "destructive",
      });
    },
  });

  // API key validation mutation
  const validateApiKeyMutation = useMutation({
    mutationFn: async (data: { keyType: string; keyValue: string }) => {
      return await apiRequest('POST', '/api/api-keys/validate', data);
    },
    onSuccess: (data, variables) => {
      toast({
        title: "تأیید شد",
        description: `کلید ${variables.keyType} معتبر است و ذخیره شد`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/api-keys/status'] });
    },
    onError: (error: any, variables) => {
      toast({
        title: "کلید نامعتبر",
        description: `کلید ${variables.keyType} معتبر نیست: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleFormChange = (key: keyof SettingsFormData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleApiKeyChange = (keyType: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [keyType]: value }));
    setIsDirty(true);
  };

  const handleAutoSave = async () => {
    if (!isDirty) return;
    
    const settingsToSave = [
      { key: 'companyName', value: formData.companyName, description: 'نام شرکت' },
      { key: 'currency', value: formData.currency, description: 'واحد پول' },
      { key: 'invoicePrefix', value: formData.invoicePrefix, description: 'پیشوند فاکتور' },
      { key: 'templateStyle', value: formData.templateStyle, description: 'قالب فاکتور' },
      { key: 'includeStoreName', value: formData.includeStoreName.toString(), description: 'نمایش نام فروشگاه' },
      { key: 'includeTelegramId', value: formData.includeTelegramId.toString(), description: 'نمایش تلگرام' },
      { key: 'includeNotes', value: formData.includeNotes.toString(), description: 'نمایش یادداشت' },
      { key: 'outputFormat', value: formData.outputFormat, description: 'فرمت خروجی' }
    ];

    const validApiKeys = Object.entries(apiKeys).filter(([_, value]) => value.trim() !== '');
    const apiKeysData = validApiKeys.length > 0 ? Object.fromEntries(validApiKeys) : undefined;

    batchSaveMutation.mutate({ settings: settingsToSave, apiKeys: apiKeysData });
  };

  const handleManualSave = () => {
    handleAutoSave();
  };

  const handleApiKeyValidation = (keyType: string) => {
    const keyValue = apiKeys[keyType as keyof typeof apiKeys];
    if (!keyValue.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً ابتدا کلید را وارد کنید",
        variant: "destructive",
      });
      return;
    }
    validateApiKeyMutation.mutate({ keyType, keyValue });
  };

  const renderTabButton = (tabId: string, label: string, icon: string) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
        activeTab === tabId 
          ? 'bg-primary text-white shadow-md' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <i className={`fas ${icon}`}></i>
      <span className="font-medium">{label}</span>
    </button>
  );

  const renderCompanyTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-building text-primary"></i>
            اطلاعات پایه شرکت
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">نام شرکت</label>
            <Input
              value={formData.companyName}
              onChange={(e) => handleFormChange('companyName', e.target.value)}
              placeholder="نام شرکت خود را وارد کنید"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">واحد پول</label>
            <Input
              value={formData.currency}
              onChange={(e) => handleFormChange('currency', e.target.value)}
              placeholder="تومان، ریال، دلار و..."
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">پیشوند شماره فاکتور</label>
            <Input
              value={formData.invoicePrefix}
              onChange={(e) => handleFormChange('invoicePrefix', e.target.value)}
              placeholder="INV، MF، SALE"
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderInvoiceTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-file-invoice text-primary"></i>
            تنظیمات قالب فاکتور
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Style */}
          <div>
            <label className="block text-sm font-medium mb-3">انتخاب قالب طراحی</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'persian_optimized', name: 'بهینه شده فارسی', desc: 'طراحی با المان‌های فرهنگی ایرانی' },
                { id: 'modern_clean', name: 'مدرن و پاک', desc: 'طراحی مدرن با گرادیانت‌های هندسی' },
                { id: 'classic_formal', name: 'کلاسیک و رسمی', desc: 'ساختار رسمی اداری' }
              ].map((style) => (
                <div
                  key={style.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    formData.templateStyle === style.id ? 'border-primary bg-primary/5' : 'border-gray-200'
                  }`}
                  onClick={() => handleFormChange('templateStyle', style.id)}
                >
                  <h3 className="font-medium mb-2">{style.name}</h3>
                  <p className="text-sm text-gray-600">{style.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Elements */}
          <div>
            <label className="block text-sm font-medium mb-3">عناصر اختیاری فاکتور</label>
            <div className="space-y-4">
              {[
                { key: 'includeStoreName', label: 'نام فروشگاه نماینده', checked: formData.includeStoreName },
                { key: 'includeTelegramId', label: 'شناسه تلگرام نماینده', checked: formData.includeTelegramId },
                { key: 'includeNotes', label: 'بخش یادداشت و توضیحات', checked: formData.includeNotes }
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <span>{item.label}</span>
                  <Switch
                    checked={item.checked}
                    onCheckedChange={(checked) => handleFormChange(item.key as keyof SettingsFormData, checked)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Output Format */}
          <div>
            <label className="block text-sm font-medium mb-3">فرمت خروجی</label>
            <div className="flex gap-4">
              {[
                { id: 'pdf', label: 'PDF' },
                { id: 'image', label: 'تصویر' },
                { id: 'both', label: 'هر دو' }
              ].map((format) => (
                <label key={format.id} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="outputFormat"
                    value={format.id}
                    checked={formData.outputFormat === format.id}
                    onChange={(e) => handleFormChange('outputFormat', e.target.value)}
                    className="mr-2"
                  />
                  {format.label}
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderApiTab = () => (
    <div className="space-y-6">
      {/* Vertex AI Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-brain text-primary"></i>
            تنظیمات Vertex AI (Gemini 2.5 Pro)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">کلید API Google Cloud</label>
            <div className="flex gap-2">
              <Input
                type="password"
                value={apiKeys.vertexAI}
                onChange={(e) => handleApiKeyChange('vertexAI', e.target.value)}
                placeholder="کلید Vertex AI را وارد کنید"
                className="flex-1"
              />
              <Button 
                onClick={() => handleApiKeyValidation('vertexAI')}
                disabled={validateApiKeyMutation.isPending}
                variant={apiKeyStatus?.vertexAI ? "default" : "outline"}
              >
                {apiKeyStatus?.vertexAI ? 'فعال' : 'تست'}
              </Button>
            </div>
            {apiKeyStatus?.vertexAISet && (
              <p className="text-sm text-green-600 mt-1">✓ کلید معتبر تنظیم شده: {apiKeyStatus.vertexAISet}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Telegram Bot Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fab fa-telegram text-primary"></i>
            تنظیمات ربات تلگرام
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">توکن ربات تلگرام</label>
            <div className="flex gap-2">
              <Input
                type="password"
                value={apiKeys.telegram}
                onChange={(e) => handleApiKeyChange('telegram', e.target.value)}
                placeholder="توکن ربات تلگرام"
                className="flex-1"
              />
              <Button 
                onClick={() => handleApiKeyValidation('telegram')}
                disabled={validateApiKeyMutation.isPending}
                variant={apiKeyStatus?.telegram ? "default" : "outline"}
              >
                {apiKeyStatus?.telegram ? 'فعال' : 'تست'}
              </Button>
            </div>
            {apiKeyStatus?.telegramSet && (
              <p className="text-sm text-green-600 mt-1">✓ توکن معتبر تنظیم شده: {apiKeyStatus.telegramSet}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-2xl text-primary mb-2"></i>
          <p>در حال بارگذاری تنظیمات...</p>
        </div>
      </div>
    );
  }

  if (settingsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-600">
          <i className="fas fa-exclamation-triangle text-2xl mb-2"></i>
          <p>خطا در بارگذاری تنظیمات</p>
          <Button onClick={() => window.location.reload()} className="mt-2">
            تلاش مجدد
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">تنظیمات سیستم</h1>
        <div className="flex items-center gap-4">
          {lastSaved && (
            <span className="text-sm text-gray-500">
              آخرین ذخیره: {lastSaved.toLocaleTimeString('fa-IR')}
            </span>
          )}
          {isDirty && (
            <span className="text-sm text-orange-500 flex items-center gap-1">
              <i className="fas fa-circle text-xs"></i>
              تغییرات ذخیره نشده
            </span>
          )}
          <Button 
            onClick={handleManualSave}
            disabled={!isDirty || batchSaveMutation.isPending}
            className="flex items-center gap-2"
          >
            {batchSaveMutation.isPending ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-save"></i>
            )}
            ذخیره تغییرات
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        {renderTabButton('company', 'اطلاعات شرکت', 'fa-building')}
        {renderTabButton('invoice', 'قالب فاکتور', 'fa-file-invoice')}
        {renderTabButton('api', 'کلیدهای API', 'fa-key')}
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'company' && renderCompanyTab()}
        {activeTab === 'invoice' && renderInvoiceTab()}
        {activeTab === 'api' && renderApiTab()}
      </div>
    </div>
  );
}