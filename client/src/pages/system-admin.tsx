import { SuperSystemManager } from "@/components/super-system-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Users, Database, RefreshCw, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface SystemStats {
  totalCustomers: number;
  activeCustomers: number;
  totalRevenue: number;
  pendingInvoices: number;
}

export default function SystemAdmin() {
  const { data: stats, isLoading } = useQuery<SystemStats>({
    queryKey: ['/api/stats']
  });

  const { data: representatives, isLoading: repsLoading } = useQuery({
    queryKey: ['/api/representatives']
  });

  const { data: collaborators, isLoading: collabsLoading } = useQuery({
    queryKey: ['/api/collaborators'],
    refetchInterval: 5000 // Refresh every 5 seconds to catch database updates
  });

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">مدیریت سیستم</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
            مدیریت داده‌ها، همکاران و تنظیمات سیستم
          </p>
        </div>
        <Badge variant="secondary" className="text-xs sm:text-sm">
          <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          پنل مدیریت
        </Badge>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">نمایندگان</p>
                <p className="text-lg sm:text-2xl font-bold">
                  {repsLoading ? '...' : Array.isArray(representatives) ? representatives.length : 0}
                </p>
              </div>
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">همکاران</p>
                <p className="text-lg sm:text-2xl font-bold">
                  {collabsLoading ? '...' : Array.isArray(collaborators) ? collaborators.length : 0}
                </p>
              </div>
              <Database className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">مشتریان</p>
                <p className="text-lg sm:text-2xl font-bold">
                  {isLoading ? '...' : stats?.totalCustomers || 0}
                </p>
              </div>
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">فاکتورهای معلق</p>
                <p className="text-lg sm:text-2xl font-bold">
                  {isLoading ? '...' : stats?.pendingInvoices || 0}
                </p>
              </div>
              <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced System Management */}
      <SuperSystemManager />

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Database className="h-4 w-4 sm:h-5 sm:w-5" />
            وضعیت سیستم
          </CardTitle>
          <CardDescription>
            بررسی سلامت داده‌ها و ارتباطات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm">پایگاه داده</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                متصل
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm">API سرور</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                فعال
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm">همکاران</span>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                نیاز به بررسی
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Required Collaborators Status */}
      <Card>
        <CardHeader>
          <CardTitle>همکاران مورد نیاز</CardTitle>
          <CardDescription>
            این همکاران باید در سیستم موجود باشند تا نمایندگان به آنها اختصاص یابند
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <div>
                <span className="font-medium">بهنام</span>
                <span className="text-sm text-gray-500 mr-2">(behnam_001)</span>
              </div>
              <Badge variant="outline">مورد نیاز</Badge>
            </div>
            
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <div>
                <span className="font-medium">سعید قراری</span>
                <span className="text-sm text-gray-500 mr-2">(saeed_001)</span>
              </div>
              <Badge variant="outline">مورد نیاز</Badge>
            </div>
            
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <div>
                <span className="font-medium">اونر</span>
                <span className="text-sm text-gray-500 mr-2">(owner_001)</span>
              </div>
              <Badge variant="outline">مورد نیاز</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>عملیات سریع</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
              <RefreshCw className="h-6 w-6" />
              <span>بروزرسانی کامل</span>
              <span className="text-xs text-gray-500">
                بروزرسانی تمام داده‌ها
              </span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
              <Users className="h-6 w-6" />
              <span>مدیریت همکاران</span>
              <span className="text-xs text-gray-500">
                ایجاد و ویرایش همکاران
              </span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
              <Database className="h-6 w-6" />
              <span>بررسی داده‌ها</span>
              <span className="text-xs text-gray-500">
                تحلیل سلامت داده‌ها
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}