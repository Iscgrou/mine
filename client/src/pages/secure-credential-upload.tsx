import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Upload, Check, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SecureCredentialUpload() {
  const [credentials, setCredentials] = useState({
    geminiApiKey: '',
    vertexProjectId: '',
    serviceAccountJson: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const response = await fetch('/api/credentials/secure-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          geminiApiKey: credentials.geminiApiKey.trim(),
          vertexProjectId: credentials.vertexProjectId.trim(),
          serviceAccountJson: credentials.serviceAccountJson.trim()
        }),
      });

      if (response.ok) {
        setUploadComplete(true);
        toast({
          title: "اعتبارنامه‌ها با موفقیت به‌روزرسانی شد",
          description: "دسترسی Gemini 2.5 Pro Preview فعال شد",
        });
        
        // Clear form for security
        setCredentials({
          geminiApiKey: '',
          vertexProjectId: '',
          serviceAccountJson: ''
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast({
        title: "خطا در آپلود اعتبارنامه‌ها",
        description: "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const jsonContent = event.target?.result as string;
          JSON.parse(jsonContent); // Validate JSON
          setCredentials(prev => ({
            ...prev,
            serviceAccountJson: jsonContent
          }));
        } catch (error) {
          toast({
            title: "فایل JSON نامعتبر",
            description: "لطفاً فایل Service Account معتبر انتخاب کنید",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }
  };

  if (uploadComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  اعتبارنامه‌ها آپلود شد
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Gemini 2.5 Pro Preview آماده استفاده است
                </p>
              </div>
              <Button 
                onClick={() => window.location.href = '/admin'}
                className="w-full"
              >
                بازگشت به پنل مدیریت
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl">
            آپلود امن اعتبارنامه‌های Vertex AI
          </CardTitle>
          <CardDescription>
            جهت فعال‌سازی دسترسی Gemini 2.5 Pro Preview
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start space-x-3 space-x-reverse">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-medium mb-1">اطلاعات امنیتی:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>اعتبارنامه‌ها به صورت رمزنگاری شده ذخیره می‌شوند</li>
                    <li>دسترسی فقط برای اتصال Gemini 2.5 Pro استفاده می‌شود</li>
                    <li>فرم پس از آپلود موفق پاک می‌شود</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="geminiApiKey">Gemini API Key</Label>
                <Input
                  id="geminiApiKey"
                  type="password"
                  placeholder="AIza..."
                  value={credentials.geminiApiKey}
                  onChange={(e) => setCredentials(prev => ({
                    ...prev,
                    geminiApiKey: e.target.value
                  }))}
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <Label htmlFor="vertexProjectId">Vertex AI Project ID</Label>
                <Input
                  id="vertexProjectId"
                  placeholder="leafy-display-459909-k9"
                  value={credentials.vertexProjectId}
                  onChange={(e) => setCredentials(prev => ({
                    ...prev,
                    vertexProjectId: e.target.value
                  }))}
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <Label htmlFor="serviceAccountJson">Service Account JSON</Label>
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="cursor-pointer"
                  />
                  <Textarea
                    id="serviceAccountJson"
                    placeholder='{"type": "service_account", "project_id": "...", ...}'
                    value={credentials.serviceAccountJson}
                    onChange={(e) => setCredentials(prev => ({
                      ...prev,
                      serviceAccountJson: e.target.value
                    }))}
                    rows={8}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isUploading || !credentials.geminiApiKey}
            >
              {isUploading ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-spin" />
                  در حال آپلود...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  آپلود امن اعتبارنامه‌ها
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}