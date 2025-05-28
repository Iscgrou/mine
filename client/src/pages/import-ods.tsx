import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FileImport {
  id: number;
  fileName: string;
  recordsProcessed: number;
  recordsSkipped: number;
  status: string;
  errorDetails?: string;
  createdAt: string;
}

export default function ImportOds() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: fileImports, isLoading } = useQuery<FileImport[]>({
    queryKey: ['/api/file-imports'],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('odsFile', file);
      
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
        const response = await fetch('/api/import-ods', {
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
    if (!file.name.endsWith('.ods')) {
      toast({
        title: "خطا",
        description: "لطفا فقط فایل‌های .ods انتخاب کنید",
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

  const getStatusBadge = (status: string) => {
    const statusMap = {
      completed: { class: "status-paid", text: "موفق" },
      processing: { class: "status-pending", text: "در حال پردازش" },
      failed: { class: "status-overdue", text: "ناموفق" },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { class: "status-inactive", text: status };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.class}`}>
        {statusInfo.text}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <CardTitle className="text-lg font-medium text-gray-900">وارد کردن فایل .ods</CardTitle>

      {/* File Upload Zone */}
      <Card>
        <CardContent className="pt-6">
          <div
            className={`upload-zone rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ${
              isDragging ? 'dragover' : ''
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <div className="w-12 h-12 mx-auto text-gray-400 mb-4">
              <i className="fas fa-file-excel text-4xl"></i>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium text-primary hover:text-primary/80">کلیک کنید</span>
              <span className="mr-1">یا فایل را اینجا بکشید</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">فقط فایل‌های .ods تا حجم ۱۰ مگابایت</p>

            <input
              id="file-input"
              type="file"
              accept=".ods"
              className="hidden"
              onChange={handleFileInputChange}
            />
          </div>

          {/* Processing Status */}
          {isUploading && (
            <div className="mt-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <div className="spinner w-5 h-5 ml-3"></div>
                  <span className="text-blue-800 font-medium">در حال پردازش فایل...</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-blue-600 mt-1">
                  {Math.round(uploadProgress)}% تکمیل شده
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Options */}
      <Card>
        <CardHeader>
          <CardTitle>تنظیمات پردازش</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                id="skip-null-values"
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="skip-null-values" className="mr-2 block text-sm text-gray-900">
                رد کردن ردیف‌های حاوی مقادیر null
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="update-existing"
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="update-existing" className="mr-2 block text-sm text-gray-900">
                به‌روزرسانی نمایندگان موجود
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="generate-invoices"
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="generate-invoices" className="mr-2 block text-sm text-gray-900">
                ایجاد خودکار صورتحساب‌ها
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import History */}
      <Card>
        <CardHeader>
          <CardTitle>تاریخچه وارد کردن فایل‌ها</CardTitle>
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
                      نام فایل
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاریخ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تعداد رکورد
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
                  {fileImports?.map((fileImport) => (
                    <tr key={fileImport.id} className="table-row-hover">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {fileImport.fileName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 persian-nums">
                        {new Date(fileImport.createdAt).toLocaleDateString('fa-IR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 persian-nums">
                        {fileImport.recordsProcessed}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(fileImport.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Button variant="ghost" size="sm">
                          مشاهده جزئیات
                        </Button>
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
