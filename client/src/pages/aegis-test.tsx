import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { AlertTriangle, Bug, Database, Zap, FileText } from "lucide-react";

export default function AegisTest() {
  const [testResults, setTestResults] = useState<Array<{
    type: string;
    description: string;
    status: 'running' | 'success' | 'error';
    result?: any;
    timestamp: Date;
  }>>([]);

  // Test 1: Frontend JavaScript Error
  const triggerJSError = () => {
    const testId = Date.now();
    setTestResults(prev => [...prev, {
      type: 'frontend-error',
      description: 'تست خطای JavaScript فرانت‌اند',
      status: 'running',
      timestamp: new Date()
    }]);

    try {
      // Intentionally trigger a JavaScript error
      (window as any).nonExistentFunction();
    } catch (error) {
      console.error('Aegis Test Error:', error);
      setTestResults(prev => prev.map(test => 
        test.timestamp.getTime() === testId ? 
        { ...test, status: 'success', result: error.message } : test
      ));
    }
  };

  // Test 2: API Error Simulation
  const triggerAPIError = useMutation({
    mutationFn: () => apiRequest('/api/nonexistent-endpoint', 'GET'),
    onMutate: () => {
      setTestResults(prev => [...prev, {
        type: 'api-error',
        description: 'تست خطای API (404)',
        status: 'running',
        timestamp: new Date()
      }]);
    },
    onError: (error) => {
      setTestResults(prev => [...prev.slice(0, -1), {
        type: 'api-error',
        description: 'تست خطای API (404)',
        status: 'success',
        result: error.message,
        timestamp: new Date()
      }]);
    }
  });

  // Test 3: Database Operation Test
  const triggerDBTest = useMutation({
    mutationFn: () => apiRequest('/api/representatives', 'GET'),
    onMutate: () => {
      setTestResults(prev => [...prev, {
        type: 'database-operation',
        description: 'تست عملیات دیتابیس (موفق)',
        status: 'running',
        timestamp: new Date()
      }]);
    },
    onSuccess: (data) => {
      setTestResults(prev => [...prev.slice(0, -1), {
        type: 'database-operation',
        description: 'تست عملیات دیتابیس (موفق)',
        status: 'success',
        result: `${data?.length || 0} نماینده دریافت شد`,
        timestamp: new Date()
      }]);
    },
    onError: (error) => {
      setTestResults(prev => [...prev.slice(0, -1), {
        type: 'database-operation',
        description: 'تست عملیات دیتابیس (خطا)',
        status: 'error',
        result: error.message,
        timestamp: new Date()
      }]);
    }
  });

  // Test 4: Nova AI Engine Test
  const triggerNovaTest = useMutation({
    mutationFn: () => apiRequest('/api/nova/call-preparation', 'POST', {
      representativeId: 1,
      callPurpose: 'تست سیستم نظارت ایجیس',
      crmUserId: 1
    }),
    onMutate: () => {
      setTestResults(prev => [...prev, {
        type: 'ai-interaction',
        description: 'تست موتور AI Nova',
        status: 'running',
        timestamp: new Date()
      }]);
    },
    onSuccess: (data) => {
      setTestResults(prev => [...prev.slice(0, -1), {
        type: 'ai-interaction',
        description: 'تست موتور AI Nova',
        status: 'success',
        result: 'آماده‌سازی تماس با موفقیت انجام شد',
        timestamp: new Date()
      }]);
    },
    onError: (error) => {
      setTestResults(prev => [...prev.slice(0, -1), {
        type: 'ai-interaction',
        description: 'تست موتور AI Nova',
        status: 'error',
        result: error.message,
        timestamp: new Date()
      }]);
    }
  });

  // Test 5: Performance Test (Multiple Rapid Requests)
  const triggerPerformanceTest = () => {
    setTestResults(prev => [...prev, {
      type: 'performance',
      description: 'تست عملکرد (درخواست‌های متعدد)',
      status: 'running',
      timestamp: new Date()
    }]);

    const promises = Array.from({ length: 10 }, (_, i) => 
      fetch('/api/representatives').then(r => r.json())
    );

    Promise.all(promises)
      .then(() => {
        setTestResults(prev => [...prev.slice(0, -1), {
          type: 'performance',
          description: 'تست عملکرد (درخواست‌های متعدد)',
          status: 'success',
          result: '10 درخواست همزمان با موفقیت انجام شد',
          timestamp: new Date()
        }]);
      })
      .catch((error) => {
        setTestResults(prev => [...prev.slice(0, -1), {
          type: 'performance',
          description: 'تست عملکرد (درخواست‌های متعدد)',
          status: 'error',
          result: error.message,
          timestamp: new Date()
        }]);
      });
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const getTestIcon = (type: string) => {
    switch (type) {
      case 'frontend-error': return <Bug className="h-4 w-4" />;
      case 'api-error': return <AlertTriangle className="h-4 w-4" />;
      case 'database-operation': return <Database className="h-4 w-4" />;
      case 'ai-interaction': return <Zap className="h-4 w-4" />;
      case 'performance': return <FileText className="h-4 w-4" />;
      default: return <Bug className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold">آزمایش سیستم نظارت ایجیس</h1>
        <p className="text-muted-foreground">
          ابزارهای تست برای ارزیابی قابلیت‌های نظارت و تشخیص سیستم ایجیس
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          این آزمایش‌ها برای تست سیستم نظارت طراحی شده‌اند و ممکن است خطاهای کنترل شده ایجاد کنند.
          تمام فعالیت‌ها توسط سیستم ایجیس ثبت و تحلیل خواهند شد.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              خطای فرانت‌اند
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              ایجاد خطای JavaScript کنترل شده برای تست تشخیص خطاهای فرانت‌اند
            </p>
            <Button onClick={triggerJSError} className="w-full">
              اجرای تست
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              خطای API
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              ارسال درخواست به endpoint غیرموجود برای تست تشخیص خطاهای API
            </p>
            <Button 
              onClick={() => triggerAPIError.mutate()}
              disabled={triggerAPIError.isPending}
              className="w-full"
            >
              {triggerAPIError.isPending ? 'در حال اجرا...' : 'اجرای تست'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              عملیات دیتابیس
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              اجرای عملیات دیتابیس برای تست نظارت بر تراکنش‌های موفق
            </p>
            <Button 
              onClick={() => triggerDBTest.mutate()}
              disabled={triggerDBTest.isPending}
              className="w-full"
            >
              {triggerDBTest.isPending ? 'در حال اجرا...' : 'اجرای تست'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              تعامل با AI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              فراخوانی سرویس Nova AI برای تست نظارت بر عملیات‌های هوش مصنوعی
            </p>
            <Button 
              onClick={() => triggerNovaTest.mutate()}
              disabled={triggerNovaTest.isPending}
              className="w-full"
            >
              {triggerNovaTest.isPending ? 'در حال اجرا...' : 'اجرای تست'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              تست عملکرد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              ارسال چندین درخواست همزمان برای تست نظارت عملکرد سیستم
            </p>
            <Button onClick={triggerPerformanceTest} className="w-full">
              اجرای تست
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>مدیریت نتایج</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              پاکسازی نتایج آزمایش‌های قبلی
            </p>
            <Button onClick={clearResults} variant="outline" className="w-full">
              پاک کردن نتایج
            </Button>
          </CardContent>
        </Card>
      </div>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>نتایج آزمایش‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((test, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getTestIcon(test.type)}
                    <div>
                      <p className="font-medium">{test.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {test.timestamp.toLocaleString('fa-IR')}
                      </p>
                      {test.result && (
                        <p className="text-xs mt-1 text-muted-foreground">
                          {test.result}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={
                    test.status === 'success' ? 'default' :
                    test.status === 'error' ? 'destructive' : 'secondary'
                  }>
                    {test.status === 'success' ? 'موفق' :
                     test.status === 'error' ? 'خطا' : 'در حال اجرا'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          پس از اجرای آزمایش‌ها، به داشبورد ایجیس مراجعه کنید تا نتایج تشخیص و تحلیل سیستم نظارت را مشاهده نمایید.
          سیستم ایجیس باید تمام این رویدادها را ثبت کرده و در گزارش‌های خود نمایش دهد.
        </AlertDescription>
      </Alert>
    </div>
  );
}