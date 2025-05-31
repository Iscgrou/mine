import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, CheckCircle, AlertTriangle, RefreshCw, Database } from 'lucide-react';
import { motion } from 'framer-motion';

interface BulkUpdateResult {
  success: boolean;
  message: string;
  summary: {
    totalProcessed: number;
    updated: number;
    created: number;
    collaboratorIssues: number;
  };
  collaboratorIssues: Array<{
    admin_username: string;
    intended_collaborator: string;
    action: string;
  }>;
  pricing: {
    applied: string;
    limited_prices: string;
    unlimited_prices: string;
  };
}

export default function BulkRepresentativeUpdate() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<BulkUpdateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBulkUpdate = async () => {
    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/representatives/bulk-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطای نامشخص در بروزرسانی');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              بروزرسانی انبوه نمایندگان
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              غنی‌سازی پروفایل نمایندگان با ساختار داده جدید و اطلاعات منبع
            </p>
          </div>
        </div>

        {/* Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              جزئیات عملیات بروزرسانی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">اطلاعات پردازش شده:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 80+ نماینده برای بروزرسانی</li>
                  <li>• اطلاعات فروشگاه، تلفن و تلگرام</li>
                  <li>• نوع کمیسیون و معرف</li>
                  <li>• ساختار قیمت‌گذاری پیش‌فرض</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">قیمت‌گذاری پیش‌فرض:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• محدود: 900, 900, 900, 1200, 1400, 1600 تومان</li>
                  <li>• نامحدود: 40000, 80000, 120000, 160000, 200000, 240000 تومان</li>
                  <li>• کمیسیون‌ها: 0% برای نمایندگان مستقیم</li>
                  <li>• معرف‌ها: موقتاً به عنوان مستقیم تنظیم می‌شوند</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Card */}
        <Card>
          <CardHeader>
            <CardTitle>اجرای بروزرسانی</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button
                onClick={handleBulkUpdate}
                disabled={isProcessing}
                size="lg"
                className="flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    در حال پردازش...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4" />
                    شروع بروزرسانی انبوه
                  </>
                )}
              </Button>
              {!isProcessing && !result && (
                <p className="text-sm text-muted-foreground">
                  با کلیک بر روی دکمه، عملیات بروزرسانی شروع می‌شود
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Results Display */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Success Summary */}
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>

            {/* Statistics */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">کل پردازش شده</p>
                      <p className="text-2xl font-bold">{result.summary.totalProcessed}</p>
                    </div>
                    <Database className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">بروزرسانی شده</p>
                      <p className="text-2xl font-bold text-blue-600">{result.summary.updated}</p>
                    </div>
                    <RefreshCw className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">ایجاد شده</p>
                      <p className="text-2xl font-bold text-green-600">{result.summary.created}</p>
                    </div>
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">مسائل معرف</p>
                      <p className="text-2xl font-bold text-orange-600">{result.summary.collaboratorIssues}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pricing Applied */}
            <Card>
              <CardHeader>
                <CardTitle>قیمت‌گذاری اعمال شده</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">{result.pricing.applied}</p>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div>
                      <Badge variant="outline">محدود (هر گیگ)</Badge>
                      <p className="text-sm text-muted-foreground mt-1">{result.pricing.limited_prices}</p>
                    </div>
                    <div>
                      <Badge variant="outline">نامحدود</Badge>
                      <p className="text-sm text-muted-foreground mt-1">{result.pricing.unlimited_prices}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Collaborator Issues */}
            {result.collaboratorIssues.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    مسائل معرف‌ها
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.collaboratorIssues.map((issue, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{issue.admin_username}</p>
                            <p className="text-sm text-muted-foreground">
                              معرف مورد نظر: {issue.intended_collaborator}
                            </p>
                          </div>
                          <Badge variant="secondary">{issue.action}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Alert className="mt-4">
                    <AlertDescription>
                      این نمایندگان موقتاً به عنوان مستقیم تنظیم شدند. پس از ایجاد سیستم همکاران فروش، 
                      می‌توانید آن‌ها را به معرف‌های مربوطه متصل کنید.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}