import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Crown, TrendingUp, Database, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface BatchResult {
  success: boolean;
  message: string;
  summary?: {
    totalProcessed: number;
    updated: number;
    notFound: number;
    collaboratorIssues: number;
    errors: number;
  };
  collaboratorStatus?: string;
  collaboratorIssues?: Array<{
    admin_username: string;
    intended_collaborator: string;
    action: string;
  }>;
  errors?: string[];
  pricing?: {
    applied: string;
    limited_prices_new: string;
    unlimited_prices: string;
    telegram_ids: string;
    commissions: string;
    collaborator_link?: string;
  };
}

export default function BulkRepresentativeUpdateBatch3() {
  const [batch1Result, setBatch1Result] = useState<BatchResult | null>(null);
  const [batch2Result, setBatch2Result] = useState<BatchResult | null>(null);
  const [batch3Result, setBatch3Result] = useState<BatchResult | null>(null);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [currentBatch, setCurrentBatch] = useState<string | null>(null);

  const executeBatch = async (batchNumber: number, endpoint: string) => {
    const batchKey = `batch${batchNumber}`;
    setLoading(prev => ({ ...prev, [batchKey]: true }));
    setCurrentBatch(batchKey);
    
    try {
      const result = await apiRequest(`/api/representatives/${endpoint}`, {
        method: 'POST'
      }) as BatchResult;
      
      if (batchNumber === 1) setBatch1Result(result);
      if (batchNumber === 2) setBatch2Result(result);
      if (batchNumber === 3) setBatch3Result(result);
      
    } catch (error) {
      const errorResult: BatchResult = {
        success: false,
        message: `خطا در اجرای دسته ${batchNumber}: ${error instanceof Error ? error.message : 'خطای ناشناخته'}`
      };
      
      if (batchNumber === 1) setBatch1Result(errorResult);
      if (batchNumber === 2) setBatch2Result(errorResult);
      if (batchNumber === 3) setBatch3Result(errorResult);
    } finally {
      setLoading(prev => ({ ...prev, [batchKey]: false }));
      setCurrentBatch(null);
    }
  };

  const BatchCard = ({ 
    title, 
    description, 
    features, 
    result, 
    onExecute, 
    loading: isLoading,
    batchNumber,
    pricing
  }: {
    title: string;
    description: string;
    features: string[];
    result: BatchResult | null;
    onExecute: () => void;
    loading: boolean;
    batchNumber: number;
    pricing: string;
  }) => (
    <Card className="border-2 hover:border-blue-200 transition-colors">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Database className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="font-medium text-sm mb-2">ویژگی‌های این دسته:</h4>
          <ul className="text-sm space-y-1">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg">
          <h4 className="font-medium text-sm mb-1">ساختار قیمت‌گذاری:</h4>
          <p className="text-sm text-blue-700">{pricing}</p>
        </div>

        <Button 
          onClick={onExecute} 
          disabled={isLoading || currentBatch !== null}
          className="w-full"
          variant={result?.success ? "outline" : "default"}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 animate-spin" />
              در حال اجرا...
            </div>
          ) : result?.success ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              اجرا شده - اجرای مجدد
            </div>
          ) : (
            `اجرای دسته ${batchNumber}`
          )}
        </Button>

        {result && (
          <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <AlertCircle className={`h-4 w-4 ${result.success ? "text-green-600" : "text-red-600"}`} />
            <AlertDescription className={result.success ? "text-green-800" : "text-red-800"}>
              {result.message}
            </AlertDescription>
          </Alert>
        )}

        {result?.summary && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="bg-blue-100 p-2 rounded text-center">
              <div className="font-bold text-blue-700">{result.summary.totalProcessed}</div>
              <div className="text-xs text-blue-600">کل پردازش شده</div>
            </div>
            <div className="bg-green-100 p-2 rounded text-center">
              <div className="font-bold text-green-700">{result.summary.updated}</div>
              <div className="text-xs text-green-600">بروزرسانی شده</div>
            </div>
            <div className="bg-yellow-100 p-2 rounded text-center">
              <div className="font-bold text-yellow-700">{result.summary.notFound}</div>
              <div className="text-xs text-yellow-600">یافت نشده</div>
            </div>
            <div className="bg-purple-100 p-2 rounded text-center">
              <div className="font-bold text-purple-700">{result.summary.collaboratorIssues}</div>
              <div className="text-xs text-purple-600">مسائل همکار</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const getTotalProgress = () => {
    const completed = [batch1Result, batch2Result, batch3Result].filter(r => r?.success).length;
    return (completed / 3) * 100;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">بروزرسانی انبوه نمایندگان - سه دسته</h1>
          <p className="text-gray-600 mt-2">
            سیستم بروزرسانی جامع پروفایل نمایندگان با ساختارهای قیمت‌گذاری و کمیسیون متفاوت
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          <Users className="h-4 w-4 ml-2" />
          227+ نماینده
        </Badge>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
        <div className="flex items-center gap-3 mb-3">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium">پیشرفت کلی بروزرسانی</h3>
        </div>
        <Progress value={getTotalProgress()} className="h-2 mb-2" />
        <p className="text-sm text-gray-600">
          {[batch1Result, batch2Result, batch3Result].filter(r => r?.success).length} از 3 دسته تکمیل شده
        </p>
      </div>

      <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6">
        <BatchCard
          title="دسته اول - ساختار پایه"
          description="81 نماینده با ساختار قیمت‌گذاری استاندارد"
          batchNumber={1}
          features={[
            "قیمت‌گذاری استاندارد محدود: 800 تومان",
            "قیمت‌گذاری نامحدود: 40000-240000 تومان", 
            "کمیسیون 0% (تنظیم مستقل توسط ادمین)",
            "اطلاعات تماس کامل از منابع معتبر"
          ]}
          pricing="محدود: 800، نامحدود: 40000-240000 تومان"
          result={batch1Result}
          onExecute={() => executeBatch(1, "bulk-update-batch1")}
          loading={loading.batch1 || false}
        />

        <BatchCard
          title="دسته دوم - تخفیف ویژه"
          description="16 نماینده با کاهش قیمت 3 ماه اول"
          batchNumber={2}
          features={[
            "کاهش 800 تومان در 3 ماه اول محدود",
            "قیمت‌گذاری نامحدود بدون تغییر",
            "تنظیم ID تلگرام به null",
            "کمیسیون 0% برای تنظیم بعدی"
          ]}
          pricing="محدود: 800، 800، 800، 1200، 1400، 1600 تومان"
          result={batch2Result}
          onExecute={() => executeBatch(2, "bulk-update-batch2")}
          loading={loading.batch2 || false}
        />

        <BatchCard
          title="دسته سوم - همکار بهنام"
          description="130+ نماینده با کمیسیون 25% برای بهنام"
          batchNumber={3}
          features={[
            "قیمت‌گذاری جدید محدود: 1200 تومان",
            "کمیسیون 25% برای محدود و نامحدود",
            "اتصال به همکار 'بهنام'",
            "ID تلگرام با پیشوند https://t.me/"
          ]}
          pricing="محدود: 1200، 1200، 1200، 1500، 1700، 2000 تومان"
          result={batch3Result}
          onExecute={() => executeBatch(3, "bulk-update-batch3")}
          loading={loading.batch3 || false}
        />
      </div>

      {(batch1Result?.collaboratorIssues || batch2Result?.collaboratorIssues || batch3Result?.collaboratorIssues) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-600" />
              مسائل سیستم همکاران
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="border-amber-200 bg-amber-50 mb-4">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                سیستم مدیریت همکاران هنوز پیاده‌سازی نشده است. همه نمایندگان موقتاً به عنوان "Direct" تنظیم شده‌اند.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              {[
                ...(batch2Result?.collaboratorIssues || []),
                ...(batch3Result?.collaboratorIssues || [])
              ].slice(0, 5).map((issue, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="font-mono text-sm">{issue.admin_username}</span>
                  <Badge variant="outline">{issue.intended_collaborator}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(batch1Result?.errors || batch2Result?.errors || batch3Result?.errors) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              خطاها و نمایندگان یافت نشده
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-32">
              <div className="space-y-1">
                {[
                  ...(batch1Result?.errors || []),
                  ...(batch2Result?.errors || []),
                  ...(batch3Result?.errors || [])
                ].map((error, idx) => (
                  <div key={idx} className="text-sm text-red-600 p-1">
                    {error}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium mb-2">راهنمای اجرا:</h3>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>ابتدا دسته اول را برای ایجاد ساختار پایه اجرا کنید</li>
          <li>سپس دسته دوم را برای اعمال تخفیفات ویژه اجرا کنید</li>
          <li>در نهایت دسته سوم را برای اتصال به همکار بهنام اجرا کنید</li>
          <li>پس از اجرای همه دسته‌ها، سیستم مدیریت همکاران را پیاده‌سازی کنید</li>
        </ol>
      </div>
    </div>
  );
}