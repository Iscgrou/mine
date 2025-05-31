import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Users, UserCheck, Building2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface SystemCounts {
  totalRepresentatives: number;
  activeRepresentatives: number;
  totalCollaborators: number;
  totalInvoices: number;
}

interface SyncResponse {
  success: boolean;
  message: string;
  counts?: SystemCounts;
  created?: number;
  collaborators?: any[];
}

export function SystemDataSync() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for current system stats
  const { data: currentStats, isLoading } = useQuery<SystemCounts>({
    queryKey: ['/api/system/refresh-counts'],
    enabled: false
  });

  const initializeCollaborators = async () => {
    setIsInitializing(true);
    try {
      const response = await apiRequest<SyncResponse>('/api/collaborators/initialize', {
        method: 'POST'
      });

      if (response.success) {
        toast({
          title: "همکاران ایجاد شدند",
          description: `${response.created} همکار جدید ایجاد شد`,
        });
        
        // Refresh all data after successful initialization
        await refreshCounts();
      } else {
        toast({
          title: "خطا در ایجاد همکاران",
          description: response.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطا در اتصال",
        description: "امکان ایجاد همکاران وجود ندارد",
        variant: "destructive"
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const refreshCounts = async () => {
    setIsRefreshing(true);
    try {
      const response = await apiRequest<SyncResponse>('/api/system/refresh-counts', {
        method: 'POST'
      });

      if (response.success && response.counts) {
        toast({
          title: "داده‌ها بروزرسانی شد",
          description: `${response.counts.totalRepresentatives} نماینده، ${response.counts.totalCollaborators} همکار`,
        });
        
        // Invalidate all related queries
        queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
        queryClient.invalidateQueries({ queryKey: ['/api/representatives'] });
        queryClient.invalidateQueries({ queryKey: ['/api/collaborators'] });
        queryClient.invalidateQueries({ queryKey: ['/api/crm/stats'] });
      } else {
        toast({
          title: "خطا در بروزرسانی",
          description: response.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطا در اتصال",
        description: "امکان بروزرسانی داده‌ها وجود ندارد",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          مدیریت داده‌های سیستم
        </CardTitle>
        <CardDescription>
          ایجاد همکاران سیستم و بروزرسانی شمارش داده‌ها
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* System Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <div className="text-sm text-gray-600">نمایندگان</div>
            <Badge variant="secondary">
              {currentStats?.totalRepresentatives || '---'}
            </Badge>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <UserCheck className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <div className="text-sm text-gray-600">فعال</div>
            <Badge variant="secondary">
              {currentStats?.activeRepresentatives || '---'}
            </Badge>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <Building2 className="h-6 w-6 mx-auto mb-2 text-purple-600" />
            <div className="text-sm text-gray-600">همکاران</div>
            <Badge variant="secondary">
              {currentStats?.totalCollaborators || '---'}
            </Badge>
          </div>
          
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <FileText className="h-6 w-6 mx-auto mb-2 text-orange-600" />
            <div className="text-sm text-gray-600">فاکتورها</div>
            <Badge variant="secondary">
              {currentStats?.totalInvoices || '---'}
            </Badge>
          </div>
        </div>

        {/* Required Collaborators */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-3">همکاران مورد نیاز سیستم:</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>بهنام</span>
              <Badge variant="outline">behnam_001</Badge>
            </div>
            <div className="flex justify-between">
              <span>سعید قراری</span>
              <Badge variant="outline">saeed_001</Badge>
            </div>
            <div className="flex justify-between">
              <span>اونر</span>
              <Badge variant="outline">owner_001</Badge>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={initializeCollaborators}
            disabled={isInitializing}
            className="flex-1"
          >
            {isInitializing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                در حال ایجاد...
              </>
            ) : (
              <>
                <Users className="mr-2 h-4 w-4" />
                ایجاد همکاران
              </>
            )}
          </Button>
          
          <Button 
            onClick={refreshCounts}
            disabled={isRefreshing}
            variant="outline"
            className="flex-1"
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                بروزرسانی...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                بروزرسانی شمارش‌ها
              </>
            )}
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
          <strong>راهنما:</strong> ابتدا همکاران سیستم را ایجاد کنید، سپس شمارش‌ها را بروزرسانی کنید تا تعداد صحیح نمایندگان نمایش داده شود.
        </div>
      </CardContent>
    </Card>
  );
}