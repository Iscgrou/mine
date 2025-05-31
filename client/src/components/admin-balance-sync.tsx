import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface AdminBalance {
  adminUsername: string;
  fullName: string;
  currentBalance: number;
  totalDebt: number;
  totalPaid: number;
  invoiceCount: number;
  lastUpdate: string;
}

export function AdminBalanceSync() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: adminBalances, isLoading, refetch } = useQuery<AdminBalance[]>({
    queryKey: ['/api/admin/balance-sync'],
    refetchInterval: 60000, // Refresh every minute
  });

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };

  const getBalanceStatus = (balance: number) => {
    if (balance > 0) return { label: 'بدهکار', color: 'destructive' };
    if (balance < 0) return { label: 'طلبکار', color: 'default' };
    return { label: 'تسویه', color: 'secondary' };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            همگام‌سازی مانده ادمین‌ها
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalAdmins = adminBalances?.length || 0;
  const totalDebt = adminBalances?.reduce((sum, admin) => sum + admin.totalDebt, 0) || 0;
  const totalPaid = adminBalances?.reduce((sum, admin) => sum + admin.totalPaid, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">کل ادمین‌ها</p>
                <p className="text-2xl font-bold">{totalAdmins}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">کل بدهی</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDebt)}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">کل پرداختی</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Balances Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              مانده حساب ادمین‌ها
            </CardTitle>
            <Button
              onClick={handleManualRefresh}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              بروزرسانی
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {adminBalances && adminBalances.length > 0 ? (
            <div className="space-y-4">
              {adminBalances.map((admin, index) => {
                const status = getBalanceStatus(admin.currentBalance);
                return (
                  <motion.div
                    key={admin.adminUsername}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{admin.fullName}</h4>
                        <Badge variant={status.color as any}>{status.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">@{admin.adminUsername}</p>
                      <p className="text-xs text-muted-foreground">
                        {admin.invoiceCount} فاکتور
                      </p>
                    </div>
                    
                    <div className="text-left space-y-1">
                      <p className="font-medium">
                        مانده: {formatCurrency(Math.abs(admin.currentBalance))}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        بدهی: {formatCurrency(admin.totalDebt)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        پرداختی: {formatCurrency(admin.totalPaid)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              هیچ ادمینی یافت نشد
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}