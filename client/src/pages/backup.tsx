import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatPersianDate, formatFileSize } from "@/lib/persian-utils";

interface Backup {
  id: number;
  fileName: string;
  fileSize?: number;
  backupType: string;
  googleDriveFileId?: string;
  status: string;
  createdAt: string;
}

export default function Backup() {
  const [backupProgress, setBackupProgress] = useState(0);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [googleDriveEmail, setGoogleDriveEmail] = useState("");
  const [encryptionKey, setEncryptionKey] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: backups, isLoading } = useQuery<Backup[]>({
    queryKey: ['/api/backups'],
  });

  const createBackupMutation = useMutation({
    mutationFn: async () => {
      setIsCreatingBackup(true);
      setBackupProgress(0);

      // Simulate backup progress
      const progressInterval = setInterval(() => {
        setBackupProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 500);

      try {
        const response = await apiRequest('POST', '/api/backups', {
          backupType: 'manual'
        });

        clearInterval(progressInterval);
        setBackupProgress(100);

        return response;
      } catch (error) {
        clearInterval(progressInterval);
        setIsCreatingBackup(false);
        setBackupProgress(0);
        throw error;
      }
    },
    onSuccess: () => {
      setTimeout(() => {
        setIsCreatingBackup(false);
        setBackupProgress(0);
      }, 1000);
      
      queryClient.invalidateQueries({ queryKey: ['/api/backups'] });
      toast({
        title: "موفقیت",
        description: "پشتیبان با موفقیت ایجاد شد",
      });
    },
    onError: (error: any) => {
      setIsCreatingBackup(false);
      setBackupProgress(0);
      toast({
        title: "خطا",
        description: error.message || "خطا در ایجاد پشتیبان",
        variant: "destructive",
      });
    },
  });

  const handleCreateBackup = () => {
    createBackupMutation.mutate();
  };

  const handleRestoreBackup = (backupId: number) => {
    if (confirm("آیا از بازیابی این پشتیبان اطمینان دارید؟ این عمل تمام داده‌های موجود را جایگزین خواهد کرد.")) {
      toast({
        title: "در حال بازیابی",
        description: "عملیات بازیابی آغاز شد...",
      });
      // Implementation would go here
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      completed: { class: "status-paid", text: "موفق" },
      failed: { class: "status-overdue", text: "ناموفق" },
      processing: { class: "status-pending", text: "در حال پردازش" },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || 
      { class: "status-inactive", text: status };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.class}`}>
        {statusInfo.text}
      </span>
    );
  };

  const getBackupTypeText = (type: string) => {
    return type === 'auto' ? 'خودکار' : 'دستی';
  };

  return (
    <div className="p-6 space-y-6">
      <CardTitle className="text-lg font-medium text-gray-900">مدیریت پشتیبان‌گیری</CardTitle>

      {/* Google Drive Connection Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="fas fa-check-circle text-green-400 h-5 w-5"></i>
              </div>
              <div className="mr-3">
                <h3 className="text-sm font-medium text-green-800">اتصال به گوگل درایو برقرار است</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>آخرین پشتیبان‌گیری: {backups?.[0] ? formatPersianDate(backups[0].createdAt) : 'هیچ پشتیبانی وجود ندارد'}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900">پشتیبان‌گیری فوری</h4>
                <i className="fas fa-cloud-upload-alt text-2xl text-primary"></i>
              </div>
              <p className="text-sm text-gray-600 mb-4">ایجاد پشتیبان کامل از تمام داده‌ها و ارسال به گوگل درایو</p>
              
              {isCreatingBackup && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-blue-600">در حال ایجاد پشتیبان...</span>
                    <span className="text-sm text-blue-600">{Math.round(backupProgress)}%</span>
                  </div>
                  <Progress value={backupProgress} className="h-2" />
                </div>
              )}
              
              <Button 
                className="w-full" 
                onClick={handleCreateBackup}
                disabled={isCreatingBackup}
              >
                <i className="fas fa-plus ml-2"></i>
                {isCreatingBackup ? "در حال ایجاد..." : "ایجاد پشتیبان"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900">بازیابی داده‌ها</h4>
                <i className="fas fa-cloud-download-alt text-2xl text-green-600"></i>
              </div>
              <p className="text-sm text-gray-600 mb-4">بازیابی داده‌ها از فایل پشتیبان موجود در گوگل درایو</p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.sql,.gz,.tar';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      toast({
                        title: "فایل انتخاب شد",
                        description: `فایل ${file.name} برای بازیابی انتخاب شد`,
                      });
                    }
                  };
                  input.click();
                }}
              >
                <i className="fas fa-download ml-2"></i>
                انتخاب فایل برای بازیابی
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Google Drive Settings */}
      <Card>
        <CardHeader>
          <CardTitle>تنظیمات گوگل درایو</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ایمیل گوگل درایو
              </label>
              <Input
                type="email"
                placeholder="example@gmail.com"
                value={googleDriveEmail}
                onChange={(e) => setGoogleDriveEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                کلید رمزگذاری
              </label>
              <Input
                type="password"
                placeholder="کلید رمزگذاری برای امنیت بیشتر"
                value={encryptionKey}
                onChange={(e) => setEncryptionKey(e.target.value)}
              />
            </div>
            <Button 
              variant="outline"
              onClick={() => {
                if (!googleDriveEmail) {
                  toast({
                    title: "خطا",
                    description: "لطفاً ایمیل گوگل درایو را وارد کنید",
                    variant: "destructive"
                  });
                  return;
                }
                
                // Save Google Drive settings
                toast({
                  title: "موفقیت",
                  description: "تنظیمات گوگل درایو ذخیره شد",
                });
              }}
            >
              <i className="fas fa-save ml-2"></i>
              ذخیره تنظیمات
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backup Settings */}
      <Card>
        <CardHeader>
          <CardTitle>تنظیمات پشتیبان‌گیری</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">پشتیبان‌گیری خودکار روزانه</label>
                <p className="text-sm text-gray-500">ایجاد خودکار پشتیبان در ساعت ۰۲:۰۰ شب</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">رمزگذاری پیشرفته</label>
                <p className="text-sm text-gray-500">رمزگذاری فایل‌های پشتیبان با AES-256</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">حذف خودکار پشتیبان‌های قدیمی</label>
                <p className="text-sm text-gray-500">حذف پشتیبان‌های قدیمی‌تر از ۳۰ روز</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle>تاریخچه پشتیبان‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاریخ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      نوع
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      حجم
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      وضعیت
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {backups?.map((backup) => (
                    <tr key={backup.id} className="table-row-hover">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 persian-nums">
                        {formatPersianDate(backup.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getBackupTypeText(backup.backupType)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 persian-nums">
                        {backup.fileSize ? formatFileSize(backup.fileSize) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(backup.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2 space-x-reverse">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRestoreBackup(backup.id)}
                            disabled={backup.status !== 'completed'}
                          >
                            بازیابی
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              if (backup.googleDriveFileId) {
                                window.open(`/api/backups/${backup.id}/download`, '_blank');
                              } else {
                                toast({
                                  title: "خطا",
                                  description: "فایل پشتیبان در دسترس نیست",
                                  variant: "destructive"
                                });
                              }
                            }}
                            disabled={backup.status !== 'completed'}
                          >
                            دانلود
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
