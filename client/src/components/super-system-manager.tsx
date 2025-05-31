import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  RefreshCw, Users, UserCheck, Building2, FileText, Database, 
  Zap, Activity, CheckCircle, AlertTriangle, XCircle, 
  Settings, TrendingUp, BarChart3, Target, Gauge
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

interface DatabaseOperation {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'success' | 'error';
  progress: number;
  result?: any;
  error?: string;
}

interface SystemHealth {
  database: 'connected' | 'disconnected' | 'error';
  api: 'healthy' | 'degraded' | 'down';
  cache: 'active' | 'expired' | 'disabled';
  sync: 'synchronized' | 'pending' | 'failed';
}

export function SuperSystemManager() {
  const [operations, setOperations] = useState<DatabaseOperation[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    database: 'connected',
    api: 'healthy', 
    cache: 'active',
    sync: 'synchronized'
  });
  const [lastFullSync, setLastFullSync] = useState<Date | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Real-time data with aggressive refresh
  const { data: representatives } = useQuery({
    queryKey: ['/api/representatives'],
    refetchInterval: 3000,
    staleTime: 0
  });

  const { data: collaborators } = useQuery({
    queryKey: ['/api/collaborators'], 
    refetchInterval: 3000,
    staleTime: 0
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
    refetchInterval: 3000,
    staleTime: 0
  });

  const { data: invoices } = useQuery({
    queryKey: ['/api/invoices'],
    refetchInterval: 5000,
    staleTime: 0
  });

  const updateOperation = (id: string, updates: Partial<DatabaseOperation>) => {
    setOperations(prev => prev.map(op => 
      op.id === id ? { ...op, ...updates } : op
    ));
  };

  const addOperation = (operation: Omit<DatabaseOperation, 'id'>) => {
    const id = Date.now().toString();
    setOperations(prev => [...prev, { ...operation, id }]);
    return id;
  };

  const executeCollaboratorCreation = async () => {
    const opId = addOperation({
      name: "بررسی و ایجاد همکاران",
      description: "تأیید وجود همکاران: بهنام، سعید قراری، اونر",
      status: 'running',
      progress: 0
    });

    try {
      updateOperation(opId, { progress: 25 });
      
      // Call the working collaborators initialize endpoint
      const response = await fetch('/api/collaborators/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      updateOperation(opId, { progress: 75 });

      if (response.ok) {
        const data = await response.json();
        
        updateOperation(opId, { 
          status: 'success', 
          progress: 100,
          result: data
        });
        
        toast({
          title: "همکاران تأیید شدند",
          description: `${data.total || 3} همکار در سیستم موجود است`
        });

        // Force refresh all related queries
        await queryClient.invalidateQueries({ queryKey: ['/api/collaborators'] });
        await queryClient.refetchQueries({ queryKey: ['/api/collaborators'] });
        
        return true;
      } else {
        throw new Error('خطا در تأیید همکاران');
      }
    } catch (error) {
      updateOperation(opId, { 
        status: 'error', 
        progress: 0,
        error: error instanceof Error ? error.message : 'خطای ناشناخته'
      });
      
      toast({
        title: "خطا در بررسی همکاران",
        description: error instanceof Error ? error.message : 'خطای ناشناخته',
        variant: "destructive"
      });
      
      return false;
    }
  };

  const executeDataSynchronization = async () => {
    const opId = addOperation({
      name: "همگام‌سازی کامل داده‌ها",
      description: "بروزرسانی شمارش‌ها و همگام‌سازی پایگاه داده",
      status: 'running',
      progress: 0
    });

    try {
      updateOperation(opId, { progress: 20 });

      // Step 1: Refresh counts using working endpoint
      const countsResponse = await fetch('/api/system/refresh-counts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      updateOperation(opId, { progress: 50 });

      // Step 2: Clear and refresh all caches
      queryClient.clear();
      
      updateOperation(opId, { progress: 70 });

      // Step 3: Force refresh all data
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['/api/representatives'] }),
        queryClient.refetchQueries({ queryKey: ['/api/collaborators'] }),
        queryClient.refetchQueries({ queryKey: ['/api/stats'] }),
        queryClient.refetchQueries({ queryKey: ['/api/invoices'] })
      ]);

      updateOperation(opId, { progress: 90 });

      if (countsResponse.ok) {
        const data = await countsResponse.json();
        
        updateOperation(opId, { 
          status: 'success', 
          progress: 100,
          result: data.counts
        });

        setLastFullSync(new Date());
        
        toast({
          title: "همگام‌سازی تکمیل شد",
          description: `داده‌ها با موفقیت بروزرسانی شدند`
        });

        return true;
      } else {
        throw new Error('خطا در همگام‌سازی');
      }
    } catch (error) {
      updateOperation(opId, { 
        status: 'error', 
        progress: 0,
        error: error instanceof Error ? error.message : 'خطای ناشناخته'
      });
      
      toast({
        title: "خطا در همگام‌سازی",
        description: error instanceof Error ? error.message : 'خطای ناشناخته',
        variant: "destructive"
      });
      
      return false;
    }
  };

  const executeFullSystemReboot = async () => {
    const opId = addOperation({
      name: "بازسازی کامل سیستم",
      description: "اجرای دسته‌های 2 و 3 نمایندگان + تعمیر همکاران",
      status: 'running',
      progress: 0
    });

    try {
      updateOperation(opId, { progress: 10 });

      // Step 1: Execute missing representative batches
      console.log('Executing missing representative batches...');
      
      updateOperation(opId, { progress: 20 });
      
      // Execute Batch 2 (سعید قراری)
      const batch2Response = await fetch('/api/representatives/bulk-update-batch2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      updateOperation(opId, { progress: 40 });
      
      // Execute Batch 3 (بهنام)
      const batch3Response = await fetch('/api/representatives/bulk-update-batch3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      updateOperation(opId, { progress: 60 });

      // Step 2: Verify collaborators
      const collabSuccess = await executeCollaboratorCreation();
      
      updateOperation(opId, { progress: 80 });

      // Step 3: Synchronize all data
      const syncSuccess = await executeDataSynchronization();
      
      updateOperation(opId, { progress: 95 });

      if (batch2Response.ok && batch3Response.ok && collabSuccess && syncSuccess) {
        const batch2Data = await batch2Response.json();
        const batch3Data = await batch3Response.json();
        
        updateOperation(opId, { 
          status: 'success', 
          progress: 100,
          result: { 
            message: 'بازسازی کامل انجام شد',
            batch2: batch2Data.summary?.totalProcessed || 0,
            batch3: batch3Data.summary?.totalProcessed || 0,
            totalAdded: (batch2Data.summary?.totalProcessed || 0) + (batch3Data.summary?.totalProcessed || 0)
          }
        });

        toast({
          title: "بازسازی سیستم تکمیل شد",
          description: `${(batch2Data.summary?.totalProcessed || 0) + (batch3Data.summary?.totalProcessed || 0)} نماینده جدید اضافه شد`
        });

        return true;
      } else {
        throw new Error('خطا در یکی از مراحل بازسازی');
      }
    } catch (error) {
      updateOperation(opId, { 
        status: 'error', 
        progress: 0,
        error: error instanceof Error ? error.message : 'خطای ناشناخته'
      });
      
      toast({
        title: "خطا در بازسازی سیستم",
        description: error instanceof Error ? error.message : 'خطای ناشناخته',
        variant: "destructive"
      });
      
      return false;
    }
  };

  const getStatusIcon = (status: DatabaseOperation['status']) => {
    switch (status) {
      case 'running': return <Activity className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Target className="h-4 w-4 text-gray-400" />;
    }
  };

  const getHealthColor = (status: string) => {
    if (status.includes('connected') || status.includes('healthy') || status.includes('active') || status.includes('synchronized')) {
      return 'text-green-600 bg-green-50';
    }
    if (status.includes('pending') || status.includes('degraded') || status.includes('expired')) {
      return 'text-yellow-600 bg-yellow-50';
    }
    return 'text-red-600 bg-red-50';
  };

  const currentCounts = {
    representatives: Array.isArray(representatives) ? representatives.length : 0,
    collaborators: Array.isArray(collaborators) ? collaborators.length : 0,
    invoices: Array.isArray(invoices) ? invoices.length : 0,
    totalReps: stats?.totalReps ? parseInt(stats.totalReps) : 0
  };

  return (
    <div className="space-y-6">
      {/* Real-time Status Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            وضعیت لحظه‌ای سیستم
          </CardTitle>
          <CardDescription>
            داده‌های زنده از پایگاه داده - بروزرسانی هر 3 ثانیه
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div 
              className="text-center p-4 bg-blue-50 rounded-lg"
              whileHover={{ scale: 1.02 }}
            >
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-800">
                {currentCounts.representatives}
              </div>
              <div className="text-sm text-blue-600">نمایندگان فعلی</div>
            </motion.div>
            
            <motion.div 
              className="text-center p-4 bg-green-50 rounded-lg"
              whileHover={{ scale: 1.02 }}
            >
              <Building2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-800">
                {currentCounts.collaborators}
              </div>
              <div className="text-sm text-green-600">همکاران</div>
            </motion.div>
            
            <motion.div 
              className="text-center p-4 bg-purple-50 rounded-lg"
              whileHover={{ scale: 1.02 }}
            >
              <FileText className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-purple-800">
                {currentCounts.invoices}
              </div>
              <div className="text-sm text-purple-600">فاکتورها</div>
            </motion.div>
            
            <motion.div 
              className="text-center p-4 bg-orange-50 rounded-lg"
              whileHover={{ scale: 1.02 }}
            >
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <div className="text-2xl font-bold text-orange-800">
                {currentCounts.totalReps}
              </div>
              <div className="text-sm text-orange-600">آمار کلی</div>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* System Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            سلامت سیستم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(systemHealth).map(([key, status]) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-lg border">
                <span className="text-sm font-medium">
                  {key === 'database' ? 'پایگاه داده' : 
                   key === 'api' ? 'API سرور' :
                   key === 'cache' ? 'حافظه موقت' : 'همگام‌سازی'}
                </span>
                <Badge className={getHealthColor(status)}>
                  {status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            کنترل پیشرفته سیستم
          </CardTitle>
          <CardDescription>
            عملیات قدرتمند برای مدیریت کامل پایگاه داده
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={executeCollaboratorCreation}
              className="h-auto p-4 flex flex-col gap-2"
              variant="outline"
            >
              <Users className="h-6 w-6" />
              <span className="font-medium">ایجاد همکاران</span>
              <span className="text-xs text-gray-500">
                بهنام، سعید قراری، اونر
              </span>
            </Button>
            
            <Button 
              onClick={executeDataSynchronization}
              className="h-auto p-4 flex flex-col gap-2"
              variant="outline"
            >
              <RefreshCw className="h-6 w-6" />
              <span className="font-medium">همگام‌سازی داده‌ها</span>
              <span className="text-xs text-gray-500">
                بروزرسانی شمارش‌ها
              </span>
            </Button>
            
            <Button 
              onClick={executeFullSystemReboot}
              className="h-auto p-4 flex flex-col gap-2"
              variant="default"
            >
              <Zap className="h-6 w-6" />
              <span className="font-medium">راه‌اندازی مجدد کامل</span>
              <span className="text-xs text-white/80">
                بازسازی کامل سیستم
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Operations Monitor */}
      <AnimatePresence>
        {operations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  نظارت بر عملیات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {operations.slice(-5).reverse().map((operation) => (
                  <motion.div
                    key={operation.id}
                    className="p-4 border rounded-lg space-y-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(operation.status)}
                        <span className="font-medium">{operation.name}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {operation.progress}%
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600">{operation.description}</p>
                    
                    <Progress value={operation.progress} className="h-2" />
                    
                    {operation.error && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{operation.error}</AlertDescription>
                      </Alert>
                    )}
                    
                    {operation.result && operation.status === 'success' && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          عملیات با موفقیت تکمیل شد
                        </AlertDescription>
                      </Alert>
                    )}
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Last Sync Info */}
      {lastFullSync && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>آخرین همگام‌سازی کامل:</span>
              <span>{lastFullSync.toLocaleString('fa-IR')}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}