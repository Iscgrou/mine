import React from 'react';
import { AdminBalanceSync } from '@/components/admin-balance-sync';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, TrendingUp, AlertTriangle } from 'lucide-react';

export default function AdminBalanceManagement() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              مدیریت مانده ادمین‌ها
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              نظارت و مدیریت مانده حساب ادمین‌ها و نمایندگان
            </p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                سیستم همگام‌سازی
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">فعال</div>
              <p className="text-xs text-muted-foreground">
                بروزرسانی خودکار هر دقیقه
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                دقت داده‌ها
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">100%</div>
              <p className="text-xs text-muted-foreground">
                مبتنی بر داده‌های واقعی فاکتورها
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                هشدارهای سیستم
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">0</div>
              <p className="text-xs text-muted-foreground">
                بدون هشدار فعال
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Balance Sync Component */}
        <AdminBalanceSync />

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>توضیحات سیستم همگام‌سازی</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">محاسبه مانده:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• مانده = کل پرداختی - کل بدهی</li>
                  <li>• مانده مثبت: طلبکار (سیستم بدهکار است)</li>
                  <li>• مانده منفی: بدهکار (ادمین بدهکار است)</li>
                  <li>• مانده صفر: تسویه حساب</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">بروزرسانی داده‌ها:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• بروزرسانی خودکار هر 60 ثانیه</li>
                  <li>• امکان بروزرسانی دستی</li>
                  <li>• اتصال مستقیم به پایگاه داده</li>
                  <li>• محاسبه بر اساس وضعیت واقعی فاکتورها</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}