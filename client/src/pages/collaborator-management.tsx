import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Users, Edit3, Trash2, Eye, UserPlus, 
  TrendingUp, DollarSign, Phone, Mail, MapPin,
  Building, Calendar, Award, AlertCircle, CheckCircle,
  Search, Filter, Download, MoreHorizontal, Star,
  UserCheck, UserX, Settings, Clock, Target,
  Banknote, FileText, History, Calculator
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Collaborator {
  id: number;
  collaboratorName: string;
  uniqueCollaboratorId: string;
  phoneNumber: string | null;
  telegramId: string | null;
  email: string | null;
  bankAccountDetails: string | null;
  currentAccumulatedEarnings: string;
  totalEarningsToDate: string;
  totalPayoutsToDate: string;
  status: string;
  dateJoined: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface NewCollaboratorForm {
  collaboratorName: string;
  phoneNumber: string;
  telegramId: string;
  email: string;
  bankAccountDetails: string;
  status: 'active' | 'inactive' | 'pending_approval';
}

interface PayoutForm {
  payoutAmount: string;
  paymentMethod: string;
  notes: string;
}

export default function CollaboratorManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] = useState<Collaborator | null>(null);
  const [isPayoutDialogOpen, setIsPayoutDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch collaborators
  const { data: collaborators, isLoading } = useQuery({
    queryKey: ['/api/collaborators'],
    queryFn: () => 
      fetch('/api/collaborators')
        .then(res => {
          if (!res.ok) throw new Error('خطا در دریافت همکاران');
          return res.json();
        }) as Promise<Collaborator[]>
  });

  // Add new collaborator mutation
  const addCollaboratorMutation = useMutation({
    mutationFn: (newCollaborator: NewCollaboratorForm) =>
      fetch('/api/collaborators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCollaborator,
          uniqueCollaboratorId: `COL-${Date.now()}`
        })
      }).then(res => {
        if (!res.ok) throw new Error('خطا در افزودن همکار');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collaborators'] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "موفقیت",
        description: "همکار جدید با موفقیت اضافه شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در افزودن همکار جدید",
        variant: "destructive"
      });
    }
  });

  // Record payout mutation
  const recordPayoutMutation = useMutation({
    mutationFn: ({ collaboratorId, payout }: { collaboratorId: number; payout: PayoutForm }) =>
      fetch(`/api/collaborators/${collaboratorId}/payouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payout)
      }).then(res => {
        if (!res.ok) throw new Error('خطا در ثبت پرداخت');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collaborators'] });
      setIsPayoutDialogOpen(false);
      setSelectedCollaborator(null);
      resetPayoutForm();
      toast({
        title: "موفقیت",
        description: "پرداخت با موفقیت ثبت شد",
      });
    }
  });

  const [newCollaboratorForm, setNewCollaboratorForm] = useState<NewCollaboratorForm>({
    collaboratorName: '',
    phoneNumber: '',
    telegramId: '',
    email: '',
    bankAccountDetails: '',
    status: 'active'
  });

  const [payoutForm, setPayoutForm] = useState<PayoutForm>({
    payoutAmount: '',
    paymentMethod: '',
    notes: ''
  });

  const filteredCollaborators = collaborators?.filter(collaborator => {
    const matchesSearch = collaborator.collaboratorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         collaborator.uniqueCollaboratorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         collaborator.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || collaborator.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const handleAddCollaborator = () => {
    if (!newCollaboratorForm.collaboratorName || !newCollaboratorForm.phoneNumber) {
      toast({
        title: "خطا",
        description: "لطفاً فیلدهای اجباری را پر کنید",
        variant: "destructive"
      });
      return;
    }
    addCollaboratorMutation.mutate(newCollaboratorForm);
  };

  const handleRecordPayout = () => {
    if (!selectedCollaborator || !payoutForm.payoutAmount) {
      toast({
        title: "خطا",
        description: "لطفاً مبلغ پرداخت را وارد کنید",
        variant: "destructive"
      });
      return;
    }
    recordPayoutMutation.mutate({
      collaboratorId: selectedCollaborator.id,
      payout: payoutForm
    });
  };

  const resetForm = () => {
    setNewCollaboratorForm({
      collaboratorName: '',
      phoneNumber: '',
      telegramId: '',
      email: '',
      bankAccountDetails: '',
      status: 'active'
    });
  };

  const resetPayoutForm = () => {
    setPayoutForm({
      payoutAmount: '',
      paymentMethod: '',
      notes: ''
    });
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('fa-IR').format(numAmount) + ' تومان';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">فعال</Badge>;
      case 'inactive':
        return <Badge variant="secondary">غیرفعال</Badge>;
      case 'pending_approval':
        return <Badge className="bg-yellow-100 text-yellow-800">در انتظار تایید</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="responsive-content space-y-4" dir="rtl">
      {/* Dynamic Header */}
      <div className="flex flex-col items-center space-y-2 py-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg mx-1">
        <h1 className="text-base md:text-xl font-bold text-center text-emerald-900">مدیریت همکاران فروش</h1>
        <p className="text-xs text-emerald-600 text-center">مدیریت کامل همکاران، کمیسیون‌ها و پرداخت‌ها</p>
      </div>

      {/* Stats Cards */}
      <div className="dynamic-stats-grid">
        <div className="dynamic-stats-card">
          <div className="stats-card-header">
            <div className="stats-card-icon" style={{ background: '#10b981' }}>
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="stats-card-value">{collaborators?.length || 0}</div>
          <div className="stats-card-label">کل همکاران</div>
          <div className="stats-card-change positive">
            فعال: {collaborators?.filter(c => c.status === 'active').length || 0}
          </div>
        </div>

        <div className="dynamic-stats-card">
          <div className="stats-card-header">
            <div className="stats-card-icon" style={{ background: '#3b82f6' }}>
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="stats-card-value">
            {formatCurrency(
              collaborators?.reduce((sum, c) => 
                sum + parseFloat(c.currentAccumulatedEarnings || '0'), 0
              ) || 0
            )}
          </div>
          <div className="stats-card-label">کل درآمد انباشته</div>
          <div className="stats-card-change positive">در انتظار پرداخت</div>
        </div>

        <div className="dynamic-stats-card">
          <div className="stats-card-header">
            <div className="stats-card-icon" style={{ background: '#8b5cf6' }}>
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="stats-card-value">
            {formatCurrency(
              collaborators?.reduce((sum, c) => 
                sum + parseFloat(c.totalPayoutsToDate || '0'), 0
              ) || 0
            )}
          </div>
          <div className="stats-card-label">کل پرداخت‌ها</div>
          <div className="stats-card-change positive">تا به امروز</div>
        </div>

        <div className="dynamic-stats-card">
          <div className="stats-card-header">
            <div className="stats-card-icon" style={{ background: '#f59e0b' }}>
              <Calculator className="w-5 h-5" />
            </div>
          </div>
          <div className="stats-card-value">
            {formatCurrency(
              collaborators?.reduce((sum, c) => 
                sum + parseFloat(c.totalEarningsToDate || '0'), 0
              ) || 0
            )}
          </div>
          <div className="stats-card-label">کل درآمد کمیسیون</div>
          <div className="stats-card-change positive">از ابتدا</div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-4 items-center">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="جستجو همکاران..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 w-64"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="فیلتر وضعیت" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه وضعیت‌ها</SelectItem>
              <SelectItem value="active">فعال</SelectItem>
              <SelectItem value="inactive">غیرفعال</SelectItem>
              <SelectItem value="pending_approval">در انتظار تایید</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="w-4 h-4" />
              افزودن همکار جدید
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>افزودن همکار جدید</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="collaboratorName">نام همکار *</Label>
                  <Input
                    id="collaboratorName"
                    value={newCollaboratorForm.collaboratorName}
                    onChange={(e) => setNewCollaboratorForm(prev => ({ ...prev, collaboratorName: e.target.value }))}
                    placeholder="نام کامل همکار"
                  />
                </div>
                <div>
                  <Label htmlFor="phoneNumber">شماره تماس *</Label>
                  <Input
                    id="phoneNumber"
                    value={newCollaboratorForm.phoneNumber}
                    onChange={(e) => setNewCollaboratorForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="09xxxxxxxxx"
                  />
                </div>
                <div>
                  <Label htmlFor="telegramId">آیدی تلگرام</Label>
                  <Input
                    id="telegramId"
                    value={newCollaboratorForm.telegramId}
                    onChange={(e) => setNewCollaboratorForm(prev => ({ ...prev, telegramId: e.target.value }))}
                    placeholder="@username"
                  />
                </div>
                <div>
                  <Label htmlFor="email">ایمیل</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newCollaboratorForm.email}
                    onChange={(e) => setNewCollaboratorForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="example@email.com"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="bankAccountDetails">جزئیات حساب بانکی</Label>
                <Textarea
                  id="bankAccountDetails"
                  value={newCollaboratorForm.bankAccountDetails}
                  onChange={(e) => setNewCollaboratorForm(prev => ({ ...prev, bankAccountDetails: e.target.value }))}
                  placeholder="شماره کارت، شماره حساب و نام بانک"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="status">وضعیت اولیه</Label>
                <Select
                  value={newCollaboratorForm.status}
                  onValueChange={(value: any) => setNewCollaboratorForm(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">فعال</SelectItem>
                    <SelectItem value="pending_approval">در انتظار تایید</SelectItem>
                    <SelectItem value="inactive">غیرفعال</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  انصراف
                </Button>
                <Button 
                  onClick={handleAddCollaborator}
                  disabled={addCollaboratorMutation.isPending}
                >
                  {addCollaboratorMutation.isPending ? 'در حال افزودن...' : 'افزودن همکار'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Collaborators Table */}
      <div className="dynamic-table-container">
        <div className="dynamic-table-wrapper">
          <table className="dynamic-table">
            <thead>
              <tr>
                <th>نام همکار</th>
                <th>شناسه یکتا</th>
                <th>تماس</th>
                <th>وضعیت</th>
                <th>درآمد انباشته</th>
                <th>کل درآمد</th>
                <th>کل پرداخت‌ها</th>
                <th>تاریخ عضویت</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8">
                    در حال بارگذاری...
                  </td>
                </tr>
              ) : filteredCollaborators.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-500">
                    همکاری یافت نشد
                  </td>
                </tr>
              ) : (
                filteredCollaborators.map((collaborator) => (
                  <tr key={collaborator.id}>
                    <td>
                      <div className="font-medium">{collaborator.collaboratorName}</div>
                    </td>
                    <td>
                      <div className="text-sm font-mono">{collaborator.uniqueCollaboratorId}</div>
                    </td>
                    <td>
                      <div className="text-sm">
                        <div>{collaborator.phoneNumber}</div>
                        {collaborator.telegramId && (
                          <div className="text-gray-500 text-xs">{collaborator.telegramId}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      {getStatusBadge(collaborator.status)}
                    </td>
                    <td>
                      <div className="font-medium text-blue-600">
                        {formatCurrency(collaborator.currentAccumulatedEarnings)}
                      </div>
                    </td>
                    <td>
                      <div className="font-medium text-green-600">
                        {formatCurrency(collaborator.totalEarningsToDate)}
                      </div>
                    </td>
                    <td>
                      <div className="font-medium text-gray-600">
                        {formatCurrency(collaborator.totalPayoutsToDate)}
                      </div>
                    </td>
                    <td>
                      <div className="text-sm">
                        {new Date(collaborator.dateJoined).toLocaleDateString('fa-IR')}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300"
                          onClick={() => {
                            setSelectedCollaborator(collaborator);
                            setIsPayoutDialogOpen(true);
                          }}
                          disabled={parseFloat(collaborator.currentAccumulatedEarnings) <= 0}
                        >
                          <Banknote className="w-4 h-4" />
                          پرداخت
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300"
                        >
                          <Eye className="w-4 h-4" />
                          مشاهده
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300"
                        >
                          <Edit3 className="w-4 h-4" />
                          ویرایش
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Dialog */}
      <Dialog open={isPayoutDialogOpen} onOpenChange={setIsPayoutDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ثبت پرداخت</DialogTitle>
            {selectedCollaborator && (
              <p className="text-sm text-gray-600">
                همکار: {selectedCollaborator.collaboratorName}<br/>
                موجودی قابل پرداخت: {formatCurrency(selectedCollaborator.currentAccumulatedEarnings)}
              </p>
            )}
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="payoutAmount">مبلغ پرداخت (تومان) *</Label>
              <Input
                id="payoutAmount"
                type="number"
                value={payoutForm.payoutAmount}
                onChange={(e) => setPayoutForm(prev => ({ ...prev, payoutAmount: e.target.value }))}
                placeholder="مبلغ پرداخت"
                max={selectedCollaborator ? parseFloat(selectedCollaborator.currentAccumulatedEarnings) : undefined}
              />
            </div>
            
            <div>
              <Label htmlFor="paymentMethod">روش پرداخت</Label>
              <Select
                value={payoutForm.paymentMethod}
                onValueChange={(value) => setPayoutForm(prev => ({ ...prev, paymentMethod: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب روش پرداخت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">انتقال بانکی</SelectItem>
                  <SelectItem value="cash">نقدی</SelectItem>
                  <SelectItem value="check">چک</SelectItem>
                  <SelectItem value="other">سایر</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="notes">یادداشت</Label>
              <Textarea
                id="notes"
                value={payoutForm.notes}
                onChange={(e) => setPayoutForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="یادداشت اضافی در مورد پرداخت"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsPayoutDialogOpen(false)}>
                انصراف
              </Button>
              <Button 
                onClick={handleRecordPayout}
                disabled={recordPayoutMutation.isPending}
              >
                {recordPayoutMutation.isPending ? 'در حال ثبت...' : 'ثبت پرداخت'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}