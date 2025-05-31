import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Eye, AlertCircle, CheckCircle, Clock } from "lucide-react";

interface FileImport {
  id: number;
  fileName: string;
  recordsProcessed: number;
  recordsSkipped: number;
  status: string;
  errorDetails?: string;
  createdAt: string;
}

export default function ImportJSON() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImport, setSelectedImport] = useState<FileImport | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: fileImports, isLoading } = useQuery<FileImport[]>({
    queryKey: ['/api/file-imports'],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('jsonFile', file);
      
      setIsUploading(true);
      setUploadProgress(0);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 15;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 200);

      try {
        const response = await fetch('/api/import-json', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'خطا در آپلود فایل');
        }

        return await response.json();
      } catch (error) {
        clearInterval(progressInterval);
        setIsUploading(false);
        setUploadProgress(0);
        throw error;
      }
    },
    onSuccess: (data) => {
      setIsUploading(false);
      setUploadProgress(0);
      queryClient.invalidateQueries({ queryKey: ['/api/file-imports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/representatives'] });
      
      toast({
        title: "موفقیت",
        description: `فایل با موفقیت پردازش شد. ${data.invoicesCreated} فاکتور ایجاد شد.`,
      });
    },
    onError: (error: any) => {
      setIsUploading(false);
      setUploadProgress(0);
      toast({
        title: "خطا",
        description: error.message || "خطا در پردازش فایل",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.json')) {
      toast({
        title: "خطا",
        description: "لطفا فقط فایل‌های JSON انتخاب کنید",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleViewDetails = (fileImport: FileImport) => {
    setSelectedImport(fileImport);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      completed: { 
        icon: CheckCircle, 
        class: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300", 
        text: "موفق" 
      },
      processing: { 
        icon: Clock, 
        class: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300", 
        text: "در حال پردازش" 
      },
      failed: { 
        icon: AlertCircle, 
        class: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300", 
        text: "ناموفق" 
      },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { 
      icon: AlertCircle, 
      class: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300", 
      text: status 
    };
    
    const Icon = statusInfo.icon;
    
    return (
      <Badge className={statusInfo.class}>
        <Icon className="w-3 h-3 ml-1" />
        {statusInfo.text}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <CardTitle className="text-lg font-medium text-gray-900 dark:text-gray-100">وارد کردن فایل JSON</CardTitle>

      {/* File Upload Zone */}
      <Card>
        <CardContent className="pt-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ${
              isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-300 dark:border-gray-600 hover:border-primary hover:bg-primary/5'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <div className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4">
              <FileText className="w-12 h-12" />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium text-primary hover:text-primary/80">کلیک کنید</span>
              <span className="mr-1">یا فایل را اینجا بکشید</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">فقط فایل‌های JSON تا حجم ۱۰ مگابایت</p>

            <input
              id="file-input"
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileInputChange}
            />
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>در حال آپلود...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sample JSON Structure */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center">
            <FileText className="w-4 h-4 ml-2" />
            نمونه ساختار JSON
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-xs overflow-x-auto text-right" dir="ltr">
{`[
  {
    "admin_username": "admin1",
    "limited_1_month_volume": "150.0000",
    "limited_2_month_volume": "75.5000",
    "limited_3_month_volume": "0.0000",
    "limited_4_month_volume": "0.0000",
    "limited_5_month_volume": "0.0000",
    "limited_6_month_volume": "0.0000",
    "unlimited_1_month": "5",
    "unlimited_2_month": "2",
    "unlimited_3_month": "0",
    "unlimited_4_month": "0",
    "unlimited_5_month": "0",
    "unlimited_6_month": "0"
  }
]`}
          </pre>
        </CardContent>
      </Card>

      {/* Import History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">تاریخچه واردات</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">در حال بارگذاری...</p>
            </div>
          ) : fileImports && fileImports.length > 0 ? (
            <div className="space-y-3">
              {fileImports.map((fileImport) => (
                <div
                  key={fileImport.id}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {fileImport.fileName}
                      </h4>
                      {getStatusBadge(fileImport.status)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      پردازش شده: {fileImport.recordsProcessed} | رد شده: {fileImport.recordsSkipped}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(fileImport.createdAt).toLocaleDateString('fa-IR')}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(fileImport)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">هنوز فایلی آپلود نشده است</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedImport} onOpenChange={() => setSelectedImport(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>جزئیات واردات</DialogTitle>
          </DialogHeader>
          {selectedImport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">نام فایل:</span>
                  <p className="text-gray-600 dark:text-gray-400">{selectedImport.fileName}</p>
                </div>
                <div>
                  <span className="font-medium">وضعیت:</span>
                  <div className="mt-1">{getStatusBadge(selectedImport.status)}</div>
                </div>
                <div>
                  <span className="font-medium">تعداد پردازش شده:</span>
                  <p className="text-gray-600 dark:text-gray-400">{selectedImport.recordsProcessed}</p>
                </div>
                <div>
                  <span className="font-medium">تعداد رد شده:</span>
                  <p className="text-gray-600 dark:text-gray-400">{selectedImport.recordsSkipped}</p>
                </div>
                <div className="col-span-2">
                  <span className="font-medium">تاریخ:</span>
                  <p className="text-gray-600 dark:text-gray-400">
                    {new Date(selectedImport.createdAt).toLocaleDateString('fa-IR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              
              {selectedImport.errorDetails && (
                <div>
                  <span className="font-medium text-red-600">جزئیات خطا:</span>
                  <pre className="mt-1 p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 text-xs rounded border overflow-x-auto">
                    {selectedImport.errorDetails}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}