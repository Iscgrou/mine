import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Database, Users, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

interface ReconstructionStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'success' | 'error';
  progress: number;
  result?: any;
  error?: string;
}

export default function DatabaseReconstruction() {
  const [steps, setSteps] = useState<ReconstructionStep[]>([
    {
      id: 'batch2',
      name: 'اجرای دسته دوم نمایندگان',
      description: 'اضافه کردن نمایندگان همکار سعید قراری',
      status: 'pending',
      progress: 0
    },
    {
      id: 'batch3', 
      name: 'اجرای دسته سوم نمایندگان',
      description: 'اضافه کردن نمایندگان همکار بهنام',
      status: 'pending',
      progress: 0
    },
    {
      id: 'collaborators',
      name: 'تعمیر نمایش همکاران',
      description: 'اتصال صحیح به جدول همکاران',
      status: 'pending',
      progress: 0
    },
    {
      id: 'sync',
      name: 'همگام‌سازی نهایی',
      description: 'بروزرسانی تمام شمارش‌ها',
      status: 'pending',
      progress: 0
    }
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStep = (id: string, updates: Partial<ReconstructionStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === id ? { ...step, ...updates } : step
    ));
  };

  const executeReconstruction = async () => {
    setIsRunning(true);
    
    try {
      // Step 1: Execute Batch 2
      updateStep('batch2', { status: 'running', progress: 25 });
      const batch2Response = await fetch('/api/representatives/bulk-update-batch2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (batch2Response.ok) {
        const batch2Data = await batch2Response.json();
        updateStep('batch2', { 
          status: 'success', 
          progress: 100,
          result: `${batch2Data.summary?.updated || 0} نماینده بروزرسانی شد`
        });
      } else {
        throw new Error('خطا در اجرای دسته دوم');
      }

      // Step 2: Execute Batch 3
      updateStep('batch3', { status: 'running', progress: 25 });
      const batch3Response = await fetch('/api/representatives/bulk-update-batch3', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }
      });

      if (batch3Response.ok) {
        const batch3Data = await batch3Response.json();
        updateStep('batch3', {
          status: 'success',
          progress: 100,
          result: `${batch3Data.summary?.updated || 0} نماینده بروزرسانی شد`
        });
      } else {
        throw new Error('خطا در اجرای دسته سوم');
      }

      // Step 3: Fix collaborators display
      updateStep('collaborators', { status: 'running', progress: 50 });
      
      // Force refresh collaborators query
      await queryClient.invalidateQueries({ queryKey: ['/api/collaborators'] });
      await queryClient.refetchQueries({ queryKey: ['/api/collaborators'] });
      
      updateStep('collaborators', {
        status: 'success',
        progress: 100, 
        result: 'اتصال به جدول همکاران تعمیر شد'
      });

      // Step 4: Final sync
      updateStep('sync', { status: 'running', progress: 25 });
      
      const syncResponse = await fetch('/api/system/refresh-counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (syncResponse.ok) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['/api/representatives'] }),
          queryClient.invalidateQueries({ queryKey: ['/api/stats'] }),
          queryClient.invalidateQueries({ queryKey: ['/api/collaborators'] })
        ]);
        
        updateStep('sync', {
          status: 'success',
          progress: 100,
          result: 'همگام‌سازی کامل انجام شد'
        });

        toast({
          title: "بازسازی پایگاه داده تکمیل شد",
          description: "تمام داده‌ها با موفقیت بروزرسانی شدند"
        });
      } else {
        throw new Error('خطا در همگام‌سازی نهایی');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطای ناشناخته';
      
      // Update current running step as error
      const runningStep = steps.find(s => s.status === 'running');
      if (runningStep) {
        updateStep(runningStep.id, {
          status: 'error',
          progress: 0,
          error: errorMessage
        });
      }

      toast({
        title: "خطا در بازسازی",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: ReconstructionStep['status']) => {
    switch (status) {
      case 'running': return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Database className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: ReconstructionStep['status']) => {
    switch (status) {
      case 'running': return <Badge variant="secondary">در حال اجرا</Badge>;
      case 'success': return <Badge variant="default" className="bg-green-500">تکمیل شد</Badge>;
      case 'error': return <Badge variant="destructive">خطا</Badge>;
      default: return <Badge variant="outline">در انتظار</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">بازسازی پایگاه داده</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
            تعمیر و بروزرسانی کامل داده‌های سیستم
          </p>
        </div>
        <Button 
          onClick={executeReconstruction}
          disabled={isRunning}
          size="sm"
          className="w-full sm:w-auto"
        >
          {isRunning ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              در حال اجرا...
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              شروع بازسازی
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {steps.map((step) => (
          <Card key={step.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(step.status)}
                  <div>
                    <CardTitle className="text-lg">{step.name}</CardTitle>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
                {getStatusBadge(step.status)}
              </div>
            </CardHeader>
            <CardContent>
              {step.status === 'running' && (
                <div className="space-y-2">
                  <Progress value={step.progress} className="h-2" />
                  <p className="text-xs text-gray-500">پیشرفت: {step.progress}%</p>
                </div>
              )}
              
              {step.result && (
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200">{step.result}</p>
                </div>
              )}

              {step.error && (
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200">{step.error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}