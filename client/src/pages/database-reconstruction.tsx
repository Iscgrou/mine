import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Database, 
  Trash2, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  FileText,
  Zap
} from "lucide-react";

export default function DatabaseReconstruction() {
  const [reconstructionPhase, setReconstructionPhase] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  // Current database stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['/api/stats'],
    refetchInterval: 5000
  });

  const { data: representatives, refetch: refetchReps } = useQuery({
    queryKey: ['/api/representatives']
  });

  const { data: collaborators, refetch: refetchCollabs } = useQuery({
    queryKey: ['/api/collaborators']
  });

  // Step 1: Remove All Representatives
  const removeAllRepsMutation = useMutation({
    mutationFn: () => apiRequest('/api/representatives/clear-all', { method: 'DELETE' }),
    onSuccess: () => {
      toast({
        title: "نمایندگان حذف شدند",
        description: "تمام نمایندگان با موفقیت از پایگاه داده حذف شدند",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/representatives'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      setProgress(25);
    },
    onError: (error) => {
      toast({
        title: "خطا در حذف نمایندگان",
        description: `مشکل در حذف نمایندگان: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Step 2: Recreate Representatives Batch 1
  const recreateBatch1Mutation = useMutation({
    mutationFn: () => apiRequest('/api/representatives/recreate-batch-1', { method: 'POST' }),
    onSuccess: () => {
      toast({
        title: "دسته ۱ بازسازی شد",
        description: "نمایندگان دسته ۱ با موفقیت بازسازی شدند",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/representatives'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      setProgress(50);
    }
  });

  // Step 3: Recreate Representatives Batch 2
  const recreateBatch2Mutation = useMutation({
    mutationFn: () => apiRequest('/api/representatives/recreate-batch-2', { method: 'POST' }),
    onSuccess: () => {
      toast({
        title: "دسته ۲ بازسازی شد",
        description: "نمایندگان دسته ۲ با قیمت‌گذاری جدید بازسازی شدند",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/representatives'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      setProgress(75);
    }
  });

  // Step 4: Recreate Representatives Batch 3
  const recreateBatch3Mutation = useMutation({
    mutationFn: () => apiRequest('/api/representatives/recreate-batch-3', { method: 'POST' }),
    onSuccess: () => {
      toast({
        title: "دسته ۳ بازسازی شد",
        description: "نمایندگان دسته ۳ با همکاران ویژه بازسازی شدند",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/representatives'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      setProgress(100);
      setIsProcessing(false);
      setReconstructionPhase('completed');
    }
  });

  const handleFullReconstruction = async () => {
    setIsProcessing(true);
    setProgress(0);
    setReconstructionPhase('removing');

    try {
      // Step 1: Remove all representatives
      await removeAllRepsMutation.mutateAsync();
      setReconstructionPhase('batch1');
      
      // Step 2: Recreate Batch 1
      await recreateBatch1Mutation.mutateAsync();
      setReconstructionPhase('batch2');
      
      // Step 3: Recreate Batch 2
      await recreateBatch2Mutation.mutateAsync();
      setReconstructionPhase('batch3');
      
      // Step 4: Recreate Batch 3
      await recreateBatch3Mutation.mutateAsync();
      
    } catch (error) {
      setIsProcessing(false);
      setReconstructionPhase('');
      setProgress(0);
    }
  };

  const currentRepsCount = Array.isArray(representatives) ? representatives.length : 0;
  const currentCollabsCount = Array.isArray(collaborators) ? collaborators.length : 0;
  const expectedRepsCount = 227; // 80 + 44 + 103

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8 text-blue-600" />
            بازسازی پایگاه داده
          </h1>
          <p className="text-gray-600 mt-2">
            حذف و بازسازی کامل نمایندگان با داده‌های جدید
          </p>
        </div>
        <Badge variant={isProcessing ? "default" : "secondary"} className="text-sm">
          {isProcessing ? "در حال پردازش..." : "آماده بازسازی"}
        </Badge>
      </div>

      {/* Current Database Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">نمایندگان فعلی</p>
                <p className="text-2xl font-bold text-orange-600">
                  {statsLoading ? '...' : currentRepsCount}
                </p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">همکاران</p>
                <p className="text-2xl font-bold text-purple-600">
                  {statsLoading ? '...' : currentCollabsCount}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">هدف نهایی</p>
                <p className="text-2xl font-bold text-green-600">
                  {expectedRepsCount}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reconstruction Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            طرح بازسازی
          </CardTitle>
          <CardDescription>
            مراحل بازسازی کامل پایگاه داده نمایندگان
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-red-600">مرحله ۱: حذف کامل</h3>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• حذف تمام ۱۲۴ نماینده موجود</li>
                <li>• پاکسازی جداول مرتبط</li>
                <li>• آماده‌سازی برای درج جدید</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-blue-600">مرحله ۲: بازسازی دسته‌ها</h3>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• دسته ۱: ۸۰ نماینده اصلی</li>
                <li>• دسته ۲: ۴۴ نماینده با قیمت‌گذاری جدید</li>
                <li>• دسته ۳: ۱۰۳ نماینده با همکاران ویژه</li>
              </ul>
            </div>
          </div>

          <Separator />

          {/* Progress Display */}
          {isProcessing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">پیشرفت بازسازی</span>
                <span className="text-sm text-gray-600">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              <div className="text-center text-sm text-gray-600">
                {reconstructionPhase === 'removing' && "در حال حذف نمایندگان موجود..."}
                {reconstructionPhase === 'batch1' && "در حال بازسازی دسته ۱..."}
                {reconstructionPhase === 'batch2' && "در حال بازسازی دسته ۲..."}
                {reconstructionPhase === 'batch3' && "در حال بازسازی دسته ۳..."}
                {reconstructionPhase === 'completed' && "بازسازی با موفقیت تکمیل شد!"}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleFullReconstruction}
              disabled={isProcessing}
              className="flex items-center gap-2"
              variant="destructive"
            >
              {isProcessing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              شروع بازسازی کامل
            </Button>

            <Button 
              onClick={() => {
                refetchStats();
                refetchReps();
                refetchCollabs();
              }}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              بروزرسانی آمار
            </Button>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-yellow-800">هشدار مهم:</p>
              <p className="text-yellow-700">
                این عملیات تمام نمایندگان موجود را حذف کرده و از ابتدا بازسازی می‌کند. 
                این کار غیرقابل بازگشت است.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}