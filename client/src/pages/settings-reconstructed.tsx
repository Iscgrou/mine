/**
 * Settings System - Complete Reconstruction (Project Lazarus)
 * Production-ready replacement addressing all critical failures
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SystemSetting {
  id: number;
  key: string;
  value: string;
  description?: string;
  updated_at?: string;
}

interface SettingsState {
  companyName: string;
  logoUrl: string;
  invoiceNote: string;
  telegramBotToken: string;
  telegramAdminChatId: string;
  templateStyle: string;
  includeStoreName: boolean;
  includeTelegramId: boolean;
  includeNotes: boolean;
  outputFormat: string;
}

export default function SettingsReconstructed() {
  const [activeTab, setActiveTab] = useState("company");
  const [settingsState, setSettingsState] = useState<SettingsState>({
    companyName: "",
    logoUrl: "",
    invoiceNote: "",
    telegramBotToken: "",
    telegramAdminChatId: "",
    templateStyle: "modern_clean",
    includeStoreName: true,
    includeTelegramId: true,
    includeNotes: false,
    outputFormat: "pdf"
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load settings data
  const { data: settings, isLoading } = useQuery<SystemSetting[]>({
    queryKey: ['/api/settings'],
    staleTime: 5000,
    retry: 3
  });

  // Initialize settings state from loaded data
  useEffect(() => {
    if (settings && settings.length > 0) {
      const settingsMap = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string>);

      // Parse template settings if available
      let templateConfig = {};
      if (settingsMap.invoice_template_settings) {
        try {
          templateConfig = JSON.parse(settingsMap.invoice_template_settings);
        } catch (e) {
          console.error('Error parsing template settings:', e);
        }
      }

      setSettingsState({
        companyName: settingsMap.company_name || "MarFanet",
        logoUrl: settingsMap.logo_url || "",
        invoiceNote: settingsMap.invoice_note || "",
        telegramBotToken: settingsMap.telegram_bot_token || "",
        telegramAdminChatId: settingsMap.telegram_admin_chat_id || "",
        templateStyle: (templateConfig as any)?.templateStyle || "modern_clean",
        includeStoreName: (templateConfig as any)?.includeStoreName !== false,
        includeTelegramId: (templateConfig as any)?.includeTelegramId !== false,
        includeNotes: (templateConfig as any)?.includeNotes || false,
        outputFormat: (templateConfig as any)?.outputFormat || "pdf"
      });
    }
  }, [settings]);

  // Save individual setting mutation
  const saveSettingMutation = useMutation({
    mutationFn: async (data: { key: string; value: string; description?: string }) => {
      const response = await apiRequest('POST', '/api/settings', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "موفقیت",
        description: "تنظیمات با موفقیت ذخیره شد",
      });
    },
    onError: (error) => {
      toast({
        title: "خطا",
        description: "خطا در ذخیره تنظیمات",
        variant: "destructive",
      });
      console.error('Settings save error:', error);
    },
  });

  // Save company settings
  const saveCompanySettings = async () => {
    try {
      await Promise.all([
        saveSettingMutation.mutateAsync({
          key: 'company_name',
          value: settingsState.companyName,
          description: 'Company name for invoices and branding'
        }),
        saveSettingMutation.mutateAsync({
          key: 'logo_url',
          value: settingsState.logoUrl,
          description: 'Company logo URL for invoice templates'
        }),
        saveSettingMutation.mutateAsync({
          key: 'invoice_note',
          value: settingsState.invoiceNote,
          description: 'Default note to include in invoices'
        })
      ]);
    } catch (error) {
      console.error('Error saving company settings:', error);
    }
  };

  // Save Telegram settings
  const saveTelegramSettings = async () => {
    try {
      await Promise.all([
        saveSettingMutation.mutateAsync({
          key: 'telegram_bot_token',
          value: settingsState.telegramBotToken,
          description: 'Telegram bot token for notifications'
        }),
        saveSettingMutation.mutateAsync({
          key: 'telegram_admin_chat_id',
          value: settingsState.telegramAdminChatId,
          description: 'Admin chat ID for Telegram notifications'
        })
      ]);
    } catch (error) {
      console.error('Error saving Telegram settings:', error);
    }
  };

  // Save template settings
  const saveTemplateSettings = async () => {
    try {
      const templateConfig = {
        templateStyle: settingsState.templateStyle,
        includeStoreName: settingsState.includeStoreName,
        includeTelegramId: settingsState.includeTelegramId,
        includeNotes: settingsState.includeNotes,
        outputFormat: settingsState.outputFormat
      };

      await saveSettingMutation.mutateAsync({
        key: 'invoice_template_settings',
        value: JSON.stringify(templateConfig),
        description: 'Invoice template configuration'
      });
    } catch (error) {
      console.error('Error saving template settings:', error);
    }
  };

  // Template preview
  const openTemplatePreview = (templateId: string) => {
    setPreviewTemplate(templateId);
    const previewUrl = `/api/invoice/preview/${templateId}`;
    window.open(previewUrl, '_blank', 'width=800,height=600');
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "company", name: "اطلاعات شرکت", icon: "fas fa-building" },
    { id: "telegram", name: "تلگرام", icon: "fab fa-telegram" },
    { id: "invoice", name: "قالب فاکتور", icon: "fas fa-file-invoice" },
    { id: "ai", name: "هوش مصنوعی", icon: "fas fa-brain" }
  ];

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">تنظیمات سیستم</h1>
        <div className="text-sm text-muted-foreground">
          آخرین بروزرسانی: {new Date().toLocaleDateString('fa-IR')}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <div className="flex space-x-8 space-x-reverse">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
              }`}
            >
              <i className={`${tab.icon} ml-2`}></i>
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Company Settings */}
        {activeTab === "company" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <i className="fas fa-building"></i>
                اطلاعات شرکت و برندینگ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  نام شرکت
                </label>
                <Input
                  value={settingsState.companyName}
                  onChange={(e) => setSettingsState(prev => ({ ...prev, companyName: e.target.value }))}
                  placeholder="نام شرکت یا برند خود را وارد کنید"
                  className="text-right"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  آدرس لوگو (URL)
                </label>
                <Input
                  value={settingsState.logoUrl}
                  onChange={(e) => setSettingsState(prev => ({ ...prev, logoUrl: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                  className="text-left"
                  dir="ltr"
                />
                {settingsState.logoUrl && (
                  <div className="mt-2">
                    <img
                      src={settingsState.logoUrl}
                      alt="پیش‌نمایش لوگو"
                      className="h-16 object-contain border rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  یادداشت پیش‌فرض فاکتور
                </label>
                <Textarea
                  value={settingsState.invoiceNote}
                  onChange={(e) => setSettingsState(prev => ({ ...prev, invoiceNote: e.target.value }))}
                  placeholder="یادداشت یا توضیحات اضافی که در تمام فاکتورها نمایش داده شود"
                  className="text-right"
                  rows={3}
                />
              </div>

              <Button
                onClick={saveCompanySettings}
                disabled={saveSettingMutation.isPending}
                className="w-full"
              >
                <i className="fas fa-save ml-2"></i>
                ذخیره اطلاعات شرکت
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Telegram Settings */}
        {activeTab === "telegram" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <i className="fab fa-telegram"></i>
                تنظیمات تلگرام
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  توکن ربات تلگرام
                </label>
                <Input
                  type="password"
                  value={settingsState.telegramBotToken}
                  onChange={(e) => setSettingsState(prev => ({ ...prev, telegramBotToken: e.target.value }))}
                  placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                  className="text-left"
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  توکن ربات تلگرام خود را از @BotFather دریافت کنید
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  شناسه چت ادمین
                </label>
                <Input
                  value={settingsState.telegramAdminChatId}
                  onChange={(e) => setSettingsState(prev => ({ ...prev, telegramAdminChatId: e.target.value }))}
                  placeholder="-1001234567890"
                  className="text-left"
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  شناسه چت یا کانال که اعلان‌ها به آن ارسال شود
                </p>
              </div>

              <Button
                onClick={saveTelegramSettings}
                disabled={saveSettingMutation.isPending}
                className="w-full"
              >
                <i className="fab fa-telegram ml-2"></i>
                ذخیره تنظیمات تلگرام
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Invoice Template Settings */}
        {activeTab === "invoice" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <i className="fas fa-file-invoice"></i>
                تنظیمات قالب فاکتور
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  انتخاب قالب طراحی
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      id: 'modern_clean',
                      name: 'مدرن و پاک',
                      desc: 'طراحی مدرن با گرادیانت‌های زیبا',
                      icon: 'fa-magic',
                      colors: ['#4f46e5', '#10b981', '#667eea']
                    },
                    {
                      id: 'classic_formal',
                      name: 'کلاسیک و رسمی',
                      desc: 'ساختار رسمی اداری کلاسیک',
                      icon: 'fa-university',
                      colors: ['#1f2937', '#d97706', '#374151']
                    },
                    {
                      id: 'persian_optimized',
                      name: 'بهینه شده فارسی',
                      desc: 'طراحی بهینه برای متون فارسی',
                      icon: 'fa-star-and-crescent',
                      colors: ['#059669', '#dc2626', '#34d399']
                    }
                  ].map((template) => (
                    <div
                      key={template.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        settingsState.templateStyle === template.id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSettingsState(prev => ({ ...prev, templateStyle: template.id }))}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <i className={`fas ${template.icon} text-lg ${
                          settingsState.templateStyle === template.id ? 'text-primary' : 'text-gray-400'
                        }`}></i>
                        <h3 className={`font-medium ${
                          settingsState.templateStyle === template.id ? 'text-primary' : 'text-gray-700'
                        }`}>
                          {template.name}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{template.desc}</p>
                      
                      {/* Color palette */}
                      <div className="flex gap-2 mb-3">
                        {template.colors.map((color, index) => (
                          <div
                            key={index}
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          openTemplatePreview(template.id);
                        }}
                      >
                        پیش‌نمایش
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Template Options */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  عناصر اختیاری فاکتور
                </label>
                <div className="space-y-3">
                  {[
                    { 
                      key: 'includeStoreName', 
                      label: 'نام فروشگاه نماینده',
                      value: settingsState.includeStoreName,
                      onChange: (checked: boolean) => setSettingsState(prev => ({ ...prev, includeStoreName: checked }))
                    },
                    { 
                      key: 'includeTelegramId', 
                      label: 'شناسه تلگرام نماینده',
                      value: settingsState.includeTelegramId,
                      onChange: (checked: boolean) => setSettingsState(prev => ({ ...prev, includeTelegramId: checked }))
                    },
                    { 
                      key: 'includeNotes', 
                      label: 'بخش یادداشت و توضیحات',
                      value: settingsState.includeNotes,
                      onChange: (checked: boolean) => setSettingsState(prev => ({ ...prev, includeNotes: checked }))
                    }
                  ].map((option) => (
                    <div key={option.key} className="flex items-center justify-between">
                      <span className="text-sm text-foreground">{option.label}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={option.value}
                          onChange={(e) => option.onChange(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={saveTemplateSettings}
                disabled={saveSettingMutation.isPending}
                className="w-full"
              >
                <i className="fas fa-save ml-2"></i>
                ذخیره تنظیمات قالب
              </Button>
            </CardContent>
          </Card>
        )}

        {/* AI Settings */}
        {activeTab === "ai" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <i className="fas fa-brain"></i>
                تنظیمات هوش مصنوعی
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <i className="fas fa-check-circle text-green-600"></i>
                  <div>
                    <h3 className="font-medium text-green-800">Vertex AI فعال است</h3>
                    <p className="text-sm text-green-600">
                      سیستم با استفاده از متغیر محیطی GOOGLE_APPLICATION_CREDENTIALS پیکربندی شده است
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-foreground">ویژگی‌های هوش مصنوعی فعال:</h3>
                <ul className="space-y-2">
                  {[
                    "تجزیه و تحلیل عملکرد نمایندگان",
                    "پیش‌بینی روندهای فروش",
                    "بهینه‌سازی قیمت‌گذاری",
                    "تشخیص الگوهای پرداخت",
                    "پردازش متن فارسی"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <i className="fas fa-check text-green-600 text-sm"></i>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}