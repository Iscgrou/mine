import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function GoogleCloudSetup() {
  const [credentials, setCredentials] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!credentials.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً اطلاعات کلید Google Cloud را وارد کنید",
        variant: "destructive"
      });
      return;
    }

    // Validate JSON format
    try {
      JSON.parse(credentials);
    } catch (error) {
      toast({
        title: "فرمت نادرست",
        description: "فایل JSON وارد شده معتبر نیست",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    setStatus('idle');

    try {
      const response = await fetch('/api/setup/google-cloud', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credentials: credentials
        })
      });

      if (response.ok) {
        setStatus('success');
        toast({
          title: "موفقیت",
          description: "اطلاعات Google Cloud با موفقیت ذخیره شد",
        });
        
        // Clear the form
        setCredentials("");
      } else {
        const error = await response.json();
        setStatus('error');
        toast({
          title: "خطا در ذخیره",
          description: error.message || "خطا در ذخیره اطلاعات",
          variant: "destructive"
        });
      }
    } catch (error) {
      setStatus('error');
      toast({
        title: "خطای اتصال",
        description: "خطا در ارتباط با سرور",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const testConnection = async () => {
    try {
      const response = await fetch('/api/test/google-cloud-stt', {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "تست موفق",
          description: "اتصال به Google Cloud STT با موفقیت برقرار شد",
        });
      } else {
        toast({
          title: "تست ناموفق",
          description: result.error || "خطا در تست اتصال",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطای تست",
        description: "خطا در تست اتصال",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl" dir="rtl">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Key className="h-12 w-12 text-blue-500" />
          </div>
          <CardTitle className="text-2xl">تنظیمات Google Cloud Speech-to-Text</CardTitle>
          <CardDescription>
            برای فعال‌سازی تبدیل صوت به متن فارسی با اصطلاحات فنی V2Ray، کلید سرویس Google Cloud را وارد کنید
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Instructions */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>راهنمای دریافت کلید:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>به Google Cloud Console بروید</li>
                <li>یک Service Account با دسترسی "Speech-to-Text API" ایجاد کنید</li>
                <li>فایل JSON کلید را دانلود کنید</li>
                <li>محتوای کامل فایل JSON را در زیر وارد کنید</li>
              </ol>
            </AlertDescription>
          </Alert>

          {/* Credentials Input */}
          <div className="space-y-2">
            <Label htmlFor="credentials">محتوای فایل JSON کلید سرویس:</Label>
            <Textarea
              id="credentials"
              value={credentials}
              onChange={(e) => setCredentials(e.target.value)}
              placeholder={`{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",
  "client_email": "your-service@your-project.iam.gserviceaccount.com",
  ...
}`}
              className="min-h-[200px] font-mono text-sm"
              disabled={isSubmitting}
            />
          </div>

          {/* Status Messages */}
          {status === 'success' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                اطلاعات Google Cloud با موفقیت ذخیره شد. سیستم تبدیل صوت به متن فارسی آماده است.
              </AlertDescription>
            </Alert>
          )}

          {status === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                خطا در ذخیره اطلاعات. لطفاً فرمت JSON را بررسی کنید.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || !credentials.trim()}
              className="flex-1"
            >
              {isSubmitting ? "در حال ذخیره..." : "ذخیره اطلاعات"}
            </Button>
            
            {status === 'success' && (
              <Button 
                onClick={testConnection}
                variant="outline"
                className="flex-1"
              >
                تست اتصال
              </Button>
            )}
          </div>

          {/* Features Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">قابلیت‌های فعال شده پس از تنظیم:</h3>
            <ul className="space-y-1 text-sm">
              <li>✅ تبدیل صوت فارسی به متن با دقت بالا</li>
              <li>✅ شناسایی اصطلاحات فنی V2Ray</li>
              <li>✅ تحلیل هوشمند تماس‌های نمایندگان</li>
              <li>✅ نظارت کامل سیستم توسط Aegis</li>
              <li>✅ پردازش صوت بهینه برای تماس‌های تلفنی</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}