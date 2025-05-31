/**
 * Secure API Key Upload Interface
 * Protected environment for uploading Vertex AI credentials
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Shield, Key, Upload, CheckCircle, AlertTriangle } from "lucide-react";

export default function SecureAPIUpload() {
  const [credentials, setCredentials] = useState({
    vertexAIApiKey: "",
    googleCloudProjectId: "",
    serviceAccountJson: ""
  });
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { toast } = useToast();

  const handleSecureUpload = async () => {
    if (!credentials.vertexAIApiKey.trim()) {
      toast({
        title: "خطا",
        description: "کلید API الزامی است",
        variant: "destructive",
      });
      return;
    }

    setUploadStatus('uploading');
    
    try {
      const response = await apiRequest('POST', '/api/secure/vertex-credentials', {
        vertexAIApiKey: credentials.vertexAIApiKey,
        googleCloudProjectId: credentials.googleCloudProjectId || undefined,
        serviceAccountJson: credentials.serviceAccountJson || undefined
      }) as { success: boolean; message?: string };

      if (response.success) {
        setUploadStatus('success');
        toast({
          title: "موفقیت",
          description: "اطلاعات API با امنیت کامل ذخیره شد",
        });
        
        // Clear sensitive data from state
        setCredentials({
          vertexAIApiKey: "",
          googleCloudProjectId: "",
          serviceAccountJson: ""
        });
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      setUploadStatus('error');
      toast({
        title: "خطا",
        description: "خطا در ذخیره اطلاعات API",
        variant: "destructive",
      });
      console.error('Secure upload error:', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          JSON.parse(content); // Validate JSON
          setCredentials(prev => ({ ...prev, serviceAccountJson: content }));
          toast({
            title: "موفقیت",
            description: "فایل JSON با موفقیت بارگذاری شد",
          });
        } catch (error) {
          toast({
            title: "خطا",
            description: "فایل JSON نامعتبر است",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    } else {
      toast({
        title: "خطا",
        description: "لطفاً فایل JSON انتخاب کنید",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex items-center justify-center" dir="rtl">
      <Card className="w-full max-w-2xl shadow-lg border-2 border-blue-200">
        <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Shield className="h-8 w-8" />
            <CardTitle className="text-2xl font-bold">محیط امن بارگذاری API</CardTitle>
          </div>
          <p className="text-blue-100">بارگذاری امن اطلاعات Vertex AI</p>
        </CardHeader>
        
        <CardContent className="p-8 space-y-6">
          {/* Security Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">محیط امن فعال</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              تمام اطلاعات در محل امن جداگانه ذخیره می‌شود و از تنظیمات عادی مجزا است
            </p>
          </div>

          {/* Primary API Key */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              <Key className="inline h-4 w-4 ml-1" />
              کلید API Vertex AI (الزامی)
            </label>
            <Input
              type="password"
              value={credentials.vertexAIApiKey}
              onChange={(e) => setCredentials(prev => ({ ...prev, vertexAIApiKey: e.target.value }))}
              placeholder="AIza... یا کلید API Google Cloud"
              className="text-left font-mono"
              dir="ltr"
            />
            <p className="text-xs text-gray-500">
              کلید API از Google Cloud Console یا AI Studio
            </p>
          </div>

          {/* Advanced Options Toggle */}
          <div className="border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full"
            >
              {showAdvanced ? 'پنهان کردن' : 'نمایش'} تنظیمات پیشرفته
            </Button>
          </div>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  شناسه پروژه Google Cloud (اختیاری)
                </label>
                <Input
                  value={credentials.googleCloudProjectId}
                  onChange={(e) => setCredentials(prev => ({ ...prev, googleCloudProjectId: e.target.value }))}
                  placeholder="my-project-id"
                  className="text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Account JSON (اختیاری)
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <Textarea
                    value={credentials.serviceAccountJson}
                    onChange={(e) => setCredentials(prev => ({ ...prev, serviceAccountJson: e.target.value }))}
                    placeholder="محتوای فایل JSON service account..."
                    rows={4}
                    className="text-left font-mono text-xs"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Upload Status */}
          {uploadStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">بارگذاری موفق</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Vertex AI اکنون دسترسی کامل به پروژه دارد
              </p>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">خطا در بارگذاری</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                لطفاً اطلاعات را بررسی کرده و مجدداً تلاش کنید
              </p>
            </div>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleSecureUpload}
            disabled={uploadStatus === 'uploading' || !credentials.vertexAIApiKey.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            size="lg"
          >
            {uploadStatus === 'uploading' ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                در حال بارگذاری امن...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                بارگذاری امن در محفظه مجزا
              </div>
            )}
          </Button>

          {/* Security Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <h4 className="font-medium text-blue-800 mb-2">اطلاعات امنیتی:</h4>
            <ul className="text-blue-700 space-y-1">
              <li>• اطلاعات در فایل جداگانه با مجوزهای محدود ذخیره می‌شود</li>
              <li>• هیچ اطلاعاتی در تنظیمات عادی سیستم قرار نمی‌گیرد</li>
              <li>• پس از بارگذاری، اطلاعات از فرم پاک می‌شود</li>
              <li>• Vertex AI دسترسی کامل به تجزیه و تحلیل پروژه خواهد داشت</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}