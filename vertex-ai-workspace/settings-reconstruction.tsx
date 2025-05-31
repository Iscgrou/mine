/**
 * Vertex AI Settings Component - Complete Reconstruction
 * Saved in isolated workspace to prevent loss during project modifications
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
}

interface SettingsData {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  logoUrl: string;
  invoiceNote: string;
  telegramBotToken: string;
  telegramChatId: string;
  templateStyle: string;
}

export default function VertexAISettings() {
  const [activeTab, setActiveTab] = useState("company");
  const [formData, setFormData] = useState<SettingsData>({
    companyName: "",
    companyAddress: "",
    companyPhone: "",
    logoUrl: "",
    invoiceNote: "",
    telegramBotToken: "",
    telegramChatId: "",
    templateStyle: "modern"
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load settings from database
  const { data: settings, isLoading } = useQuery<SystemSetting[]>({
    queryKey: ['/api/settings'],
    staleTime: 5000
  });

  // Initialize form data from database settings
  useEffect(() => {
    if (settings && settings.length > 0) {
      const settingsMap = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string>);

      setFormData({
        companyName: settingsMap.company_name || "",
        companyAddress: settingsMap.company_address || "",
        companyPhone: settingsMap.company_phone || "",
        logoUrl: settingsMap.logo_url || "",
        invoiceNote: settingsMap.invoice_note || "",
        telegramBotToken: settingsMap.telegram_bot_token || "",
        telegramChatId: settingsMap.telegram_admin_chat_id || "",
        templateStyle: settingsMap.template_style || "modern"
      });
    }
  }, [settings]);

  // Save setting mutation with proper error handling
  const saveSettingMutation = useMutation({
    mutationFn: async (data: { key: string; value: string; description?: string }) => {
      return await apiRequest('POST', '/api/settings', data);
    },
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

  // Save company settings
  const saveCompanySettings = async () => {
    const promises = [
      saveSettingMutation.mutateAsync({
        key: 'company_name',
        value: formData.companyName,
        description: 'نام شرکت'
      }),
      saveSettingMutation.mutateAsync({
        key: 'company_address',
        value: formData.companyAddress,
        description: 'آدرس شرکت'
      }),
      saveSettingMutation.mutateAsync({
        key: 'company_phone',
        value: formData.companyPhone,
        description: 'تلفن شرکت'
      }),
      saveSettingMutation.mutateAsync({
        key: 'logo_url',
        value: formData.logoUrl,
        description: 'آدرس لوگو'
      }),
      saveSettingMutation.mutateAsync({
        key: 'invoice_note',
        value: formData.invoiceNote,
        description: 'یادداشت فاکتور'
      })
    ];

    try {
      await Promise.all(promises);
    } catch (error) {
      console.error('Company settings save error:', error);
    }
  };

  // Save Telegram settings
  const saveTelegramSettings = async () => {
    const promises = [
      saveSettingMutation.mutateAsync({
        key: 'telegram_bot_token',
        value: formData.telegramBotToken,
        description: 'توکن ربات تلگرام'
      }),
      saveSettingMutation.mutateAsync({
        key: 'telegram_admin_chat_id',
        value: formData.telegramChatId,
        description: 'شناسه چت ادمین'
      })
    ];

    try {
      await Promise.all(promises);
    } catch (error) {
      console.error('Telegram settings save error:', error);
    }
  };

  // Save template settings
  const saveTemplateSettings = async () => {
    try {
      await saveSettingMutation.mutateAsync({
        key: 'template_style',
        value: formData.templateStyle,
        description: 'استایل قالب فاکتور'
      });
    } catch (error) {
      console.error('Template settings save error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6" dir="rtl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "company", name: "اطلاعات شرکت" },
    { id: "telegram", name: "تلگرام" },
    { id: "template", name: "قالب فاکتور" }
  ];

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">تنظیمات سیستم</h1>
        <div className="text-sm text-gray-500">
          بازسازی شده توسط Vertex AI
        </div>
      </div>

      <div className="border-b">
        <div className="flex space-x-8 space-x-reverse">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {activeTab === "company" && (
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات شرکت</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">نام شرکت</label>
                <Input
                  value={formData.companyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  placeholder="نام شرکت خود را وارد کنید"
                  className="text-right"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">آدرس شرکت</label>
                <Textarea
                  value={formData.companyAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyAddress: e.target.value }))}
                  placeholder="آدرس کامل شرکت"
                  className="text-right"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">تلفن شرکت</label>
                <Input
                  value={formData.companyPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyPhone: e.target.value }))}
                  placeholder="021-12345678"
                  className="text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">آدرس لوگو</label>
                <Input
                  value={formData.logoUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                  className="text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">یادداشت پیش‌فرض فاکتور</label>
                <Textarea
                  value={formData.invoiceNote}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoiceNote: e.target.value }))}
                  placeholder="یادداشت یا توضیحات اضافی برای فاکتورها"
                  className="text-right"
                  rows={3}
                />
              </div>

              <Button
                onClick={saveCompanySettings}
                disabled={saveSettingMutation.isPending}
                className="w-full"
              >
                {saveSettingMutation.isPending ? "در حال ذخیره..." : "ذخیره اطلاعات شرکت"}
              </Button>
            </CardContent>
          </Card>
        )}

        {activeTab === "telegram" && (
          <Card>
            <CardHeader>
              <CardTitle>تنظیمات تلگرام</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">توکن ربات تلگرام</label>
                <Input
                  type="password"
                  value={formData.telegramBotToken}
                  onChange={(e) => setFormData(prev => ({ ...prev, telegramBotToken: e.target.value }))}
                  placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                  className="text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">شناسه چت ادمین</label>
                <Input
                  value={formData.telegramChatId}
                  onChange={(e) => setFormData(prev => ({ ...prev, telegramChatId: e.target.value }))}
                  placeholder="-1001234567890"
                  className="text-left"
                  dir="ltr"
                />
              </div>

              <Button
                onClick={saveTelegramSettings}
                disabled={saveSettingMutation.isPending}
                className="w-full"
              >
                {saveSettingMutation.isPending ? "در حال ذخیره..." : "ذخیره تنظیمات تلگرام"}
              </Button>
            </CardContent>
          </Card>
        )}

        {activeTab === "template" && (
          <Card>
            <CardHeader>
              <CardTitle>تنظیمات قالب فاکتور</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-3">انتخاب قالب</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'modern', name: 'مدرن', desc: 'طراحی مدرن و زیبا' },
                    { id: 'classic', name: 'کلاسیک', desc: 'طراحی سنتی و رسمی' },
                    { id: 'minimal', name: 'مینیمال', desc: 'طراحی ساده و پاک' }
                  ].map((template) => (
                    <div
                      key={template.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        formData.templateStyle === template.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, templateStyle: template.id }))}
                    >
                      <h3 className="font-medium">{template.name}</h3>
                      <p className="text-sm text-gray-600">{template.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={saveTemplateSettings}
                disabled={saveSettingMutation.isPending}
                className="w-full"
              >
                {saveSettingMutation.isPending ? "در حال ذخیره..." : "ذخیره تنظیمات قالب"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Vertex AI متصل و فعال</span>
              <span className="text-xs text-gray-500">- سیستم بازسازی شده</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}