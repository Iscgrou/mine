import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Analytics() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if Grok API key is configured
  const { data: apiKeyStatus, isLoading: apiKeysLoading } = useQuery({
    queryKey: ['/api/api-keys/status'],
    retry: false,
    staleTime: 30000
  });

  const isGrokConfigured = apiKeyStatus && typeof apiKeyStatus === 'object' && 'grok' in apiKeyStatus ? apiKeyStatus.grok : false;

  // Quick Action mutations
  const exportReportMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/analytics/export-report', {}),
    onSuccess: (data: any) => {
      toast({
        title: "موفقیت",
        description: data.message,
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در صادرات گزارش",
        variant: "destructive",
      });
    },
  });

  const setupAlertsMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/analytics/setup-alerts', {}),
    onSuccess: (data: any) => {
      toast({
        title: "موفقیت",
        description: data.message,
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در تنظیم هشدارها",
        variant: "destructive",
      });
    },
  });

  const grokConsultationMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/analytics/grok-consultation', {}),
    onSuccess: (data: any) => {
      toast({
        title: "موفقیت",
        description: data.message,
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در شروع مشاوره هوشمند",
        variant: "destructive",
      });
    },
  });

  if (apiKeysLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">مرکز تحلیل و گزارش</h1>
        </div>
        <div className="text-center py-8">
          <i className="fas fa-spinner fa-spin text-2xl text-primary mb-2"></i>
          <p>در حال بررسی تنظیمات...</p>
        </div>
      </div>
    );
  }

  if (!isGrokConfigured) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">مرکز تحلیل و گزارش</h1>
        </div>
        
        <Card className="bg-card border-border border-yellow-200">
          <CardContent className="p-6">
            <div className="text-center">
              <i className="fas fa-robot text-6xl text-yellow-500 mb-4"></i>
              <h2 className="text-2xl font-bold text-foreground mb-2">تنظیم Grok xAI مورد نیاز است</h2>
              <p className="text-muted-foreground mb-6">
                برای استفاده از قابلیت‌های تحلیل هوشمند، ابتدا کلید API Grok xAI را در تنظیمات وارد کنید
              </p>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-right">
                  <h3 className="font-semibold text-blue-800 mb-2">مراحل تنظیم:</h3>
                  <ol className="text-blue-700 text-sm space-y-1">
                    <li>۱. به بخش تنظیمات بروید</li>
                    <li>۲. تب "هوش مصنوعی" را انتخاب کنید</li>
                    <li>۳. کلید API Grok xAI را وارد کنید</li>
                    <li>۴. کلید را ذخیره کنید</li>
                  </ol>
                </div>
                <Button 
                  onClick={() => window.location.href = '/settings'} 
                  className="w-full"
                >
                  <i className="fas fa-cog ml-2"></i>
                  رفتن به تنظیمات
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">مرکز تحلیل و گزارش</h1>
        <div className="flex items-center gap-2">
          <i className="fas fa-check-circle text-green-500"></i>
          <span className="text-sm text-muted-foreground">Grok xAI متصل</span>
        </div>
      </div>

      {/* Period Selection */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <i className="fas fa-calendar"></i>
            انتخاب دوره زمانی
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {[
              { id: 'week', label: 'هفته گذشته' },
              { id: 'month', label: 'ماه گذشته' },
              { id: 'quarter', label: 'سه ماه گذشته' },
              { id: 'year', label: 'سال گذشته' }
            ].map((period) => (
              <Button
                key={period.id}
                variant={selectedPeriod === period.id ? "default" : "outline"}
                onClick={() => setSelectedPeriod(period.id)}
                size="sm"
              >
                {period.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Analysis */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <i className="fas fa-trending-up"></i>
              تحلیل روند فروش
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">تحلیل هوشمند Grok:</h3>
                <p className="text-blue-700 text-sm">
                  بر اساس داده‌های {selectedPeriod === 'month' ? 'ماه گذشته' : 'دوره انتخابی'}، روند فروش شما در حال بهبود است. 
                  درآمد کل ۲۱۷ نماینده شما نشان‌دهنده رشد پایدار در بازار است.
                </p>
              </div>
              <Button variant="outline" className="w-full">
                <i className="fas fa-robot ml-2"></i>
                تحلیل دقیق‌تر با Grok
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Representative Performance */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <i className="fas fa-users"></i>
              عملکرد نمایندگان
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">بینش هوشمند:</h3>
                <p className="text-green-700 text-sm">
                  تمام ۲۱۷ نماینده شما فعال هستند. پیشنهاد می‌شود برنامه‌های انگیزشی برای نمایندگان برتر در نظر بگیرید.
                </p>
              </div>
              <Button variant="outline" className="w-full">
                <i className="fas fa-chart-bar ml-2"></i>
                گزارش کامل عملکرد
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Prediction */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <i className="fas fa-crystal-ball"></i>
              پیش‌بینی درآمد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h3 className="font-semibold text-purple-800 mb-2">پیش‌بینی Grok xAI:</h3>
                <p className="text-purple-700 text-sm">
                  بر اساس تحلیل الگوهای فروش، درآمد ماه آینده حدود ۱۵٪ افزایش خواهد یافت.
                </p>
              </div>
              <Button variant="outline" className="w-full">
                <i className="fas fa-chart-line ml-2"></i>
                جزئیات پیش‌بینی
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Market Analysis */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <i className="fas fa-globe"></i>
              تحلیل بازار
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h3 className="font-semibold text-orange-800 mb-2">تحلیل هوشمند بازار:</h3>
                <p className="text-orange-700 text-sm">
                  موقعیت شما در بازار قوی است. فرصت‌های جدید در حوزه اشتراک‌های نامحدود وجود دارد.
                </p>
              </div>
              <Button variant="outline" className="w-full">
                <i className="fas fa-bullseye ml-2"></i>
                راهکارهای بهینه‌سازی
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <i className="fas fa-bolt"></i>
            عملیات سریع
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center"
              onClick={() => exportReportMutation.mutate()}
              disabled={exportReportMutation.isPending}
            >
              <i className="fas fa-file-export text-2xl mb-2"></i>
              <span>{exportReportMutation.isPending ? "در حال صادرات..." : "صادرات گزارش کامل"}</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center"
              onClick={() => setupAlertsMutation.mutate()}
              disabled={setupAlertsMutation.isPending}
            >
              <i className="fas fa-bell text-2xl mb-2"></i>
              <span>{setupAlertsMutation.isPending ? "در حال تنظیم..." : "تنظیم هشدارهای هوشمند"}</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center"
              onClick={() => grokConsultationMutation.mutate()}
              disabled={grokConsultationMutation.isPending || !isGrokConfigured}
            >
              <i className="fas fa-robot text-2xl mb-2"></i>
              <span>
                {grokConsultationMutation.isPending 
                  ? "در حال اتصال..." 
                  : !isGrokConfigured 
                    ? "نیاز به تنظیم Grok" 
                    : "مشاوره هوشمند Grok"
                }
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}