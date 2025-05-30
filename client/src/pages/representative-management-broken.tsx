import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Users, Edit3, Trash2, Eye, UserPlus, 
  TrendingUp, DollarSign, Phone, Mail, MapPin,
  Building, Calendar, Award, AlertCircle, CheckCircle,
  Search, Filter, Download, MoreHorizontal, Star,
  UserCheck, UserX, Settings, Clock, Target
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

interface Representative {
  id: number;
  fullName: string;
  adminUsername: string;
  phoneNumber: string | null;
  telegramId: string | null;
  storeName: string | null;
  storeAddress: string | null;
  nationalId: string | null;
  status: string | null;
  createdAt: Date | null;
  commissionRates: {
    limited1Month: string | null;
    limited3Month: string | null;
    limited6Month: string | null;
    unlimited: string | null;
  };
  salesMetrics: {
    totalSales: number;
    monthlyRevenue: number;
    activeSubscriptions: number;
    conversionRate: number;
  };
  collaborationLevel: 'basic' | 'advanced' | 'premium';
  verificationStatus: 'pending' | 'verified' | 'rejected';
}

interface NewRepresentativeForm {
  fullName: string;
  adminUsername: string;
  phoneNumber: string;
  telegramId: string;
  storeName: string;
  storeAddress: string;
  nationalId: string;
  collaborationLevel: 'basic' | 'advanced' | 'premium';
  commissionRates: {
    limited1Month: string;
    limited3Month: string;
    limited6Month: string;
    unlimited: string;
  };
  initialPassword: string;
  notes: string;
}

const CollaborationBadge: React.FC<{ level: string }> = ({ level }) => {
  const colors = {
    basic: 'bg-blue-100 text-blue-800',
    advanced: 'bg-purple-100 text-purple-800',
    premium: 'bg-gold-100 text-gold-800'
  };
  
  const labels = {
    basic: 'پایه',
    advanced: 'پیشرفته', 
    premium: 'ویژه'
  };

  return (
    <Badge className={colors[level as keyof typeof colors] || colors.basic}>
      {labels[level as keyof typeof labels] || level}
    </Badge>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    verified: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800'
  };

  const labels = {
    pending: 'در انتظار تأیید',
    verified: 'تأیید شده',
    rejected: 'رد شده',
    active: 'فعال',
    inactive: 'غیرفعال'
  };

  return (
    <Badge className={colors[status as keyof typeof colors] || colors.pending}>
      {labels[status as keyof typeof labels] || status}
    </Badge>
  );
};

export default function RepresentativeManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [collaborationFilter, setCollaborationFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedRep, setSelectedRep] = useState<Representative | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch representatives
  const { data: representatives, isLoading } = useQuery({
    queryKey: ['/api/representatives'],
    queryFn: () => 
      fetch('/api/representatives')
        .then(res => {
          if (!res.ok) throw new Error('خطا در دریافت نمایندگان');
          return res.json();
        }) as Promise<Representative[]>
  });

  // Add new representative mutation
  const addRepresentativeMutation = useMutation({
    mutationFn: (newRep: NewRepresentativeForm) =>
      fetch('/api/representatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRep)
      }).then(res => {
        if (!res.ok) throw new Error('خطا در افزودن نماینده');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/representatives'] });
      setIsAddDialogOpen(false);
      toast({
        title: "موفقیت",
        description: "نماینده جدید با موفقیت اضافه شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در افزودن نماینده جدید",
        variant: "destructive"
      });
    }
  });

  // Update representative status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      fetch(`/api/representatives/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/representatives'] });
      toast({
        title: "موفقیت",
        description: "وضعیت نماینده بروزرسانی شد",
      });
    }
  });

  const [newRepForm, setNewRepForm] = useState<NewRepresentativeForm>({
    fullName: '',
    adminUsername: '',
    phoneNumber: '',
    telegramId: '',
    storeName: '',
    storeAddress: '',
    nationalId: '',
    collaborationLevel: 'basic',
    commissionRates: {
      limited1Month: '15',
      limited3Month: '18',
      limited6Month: '20',
      unlimited: '25'
    },
    initialPassword: '',
    notes: ''
  });

  const filteredRepresentatives = representatives?.filter(rep => {
    const matchesSearch = rep.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rep.adminUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rep.storeName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || rep.status === statusFilter;
    const matchesCollaboration = collaborationFilter === 'all' || rep.collaborationLevel === collaborationFilter;
    
    return matchesSearch && matchesStatus && matchesCollaboration;
  }) || [];

  const handleAddRepresentative = () => {
    if (!newRepForm.fullName || !newRepForm.adminUsername || !newRepForm.phoneNumber) {
      toast({
        title: "خطا",
        description: "لطفاً فیلدهای اجباری را پر کنید",
        variant: "destructive"
      });
      return;
    }
    addRepresentativeMutation.mutate(newRepForm);
  };

  const resetForm = () => {
    setNewRepForm({
      fullName: '',
      adminUsername: '',
      phoneNumber: '',
      telegramId: '',
      storeName: '',
      storeAddress: '',
      nationalId: '',
      collaborationLevel: 'basic',
      commissionRates: {
        limited1Month: '15',
        limited3Month: '18',
        limited6Month: '20',
        unlimited: '25'
      },
      initialPassword: '',
      notes: ''
    });
  };

  return (
    <div className="responsive-content space-y-4" dir="rtl">
      {/* Dynamic Header */}
      <div className="flex flex-col items-center space-y-2 py-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg mx-1">
        <h1 className="text-base md:text-xl font-bold text-center text-purple-900">مدیریت نمایندگان</h1>
        <p className="text-xs text-purple-600 text-center">مدیریت کامل نمایندگان، سطوح همکاری و کمیسیون‌ها</p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="w-4 h-4" />
              افزودن نماینده جدید
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>افزودن نماینده جدید</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">اطلاعات پایه</TabsTrigger>
                  <TabsTrigger value="business">اطلاعات تجاری</TabsTrigger>
                  <TabsTrigger value="commission">کمیسیون و همکاری</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">نام و نام خانوادگی *</Label>
                      <Input
                        id="fullName"
                        value={newRepForm.fullName}
                        onChange={(e) => setNewRepForm(prev => ({ ...prev, fullName: e.target.value }))}
                        placeholder="نام کامل نماینده"
                      />
                    </div>
                    <div>
                      <Label htmlFor="adminUsername">نام کاربری مدیریت *</Label>
                      <Input
                        id="adminUsername"
                        value={newRepForm.adminUsername}
                        onChange={(e) => setNewRepForm(prev => ({ ...prev, adminUsername: e.target.value }))}
                        placeholder="username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phoneNumber">شماره تلفن *</Label>
                      <Input
                        id="phoneNumber"
                        value={newRepForm.phoneNumber}
                        onChange={(e) => setNewRepForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        placeholder="09xxxxxxxxx"
                      />
                    </div>
                    <div>
                      <Label htmlFor="telegramId">آیدی تلگرام</Label>
                      <Input
                        id="telegramId"
                        value={newRepForm.telegramId}
                        onChange={(e) => setNewRepForm(prev => ({ ...prev, telegramId: e.target.value }))}
                        placeholder="@username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nationalId">کد ملی</Label>
                      <Input
                        id="nationalId"
                        value={newRepForm.nationalId}
                        onChange={(e) => setNewRepForm(prev => ({ ...prev, nationalId: e.target.value }))}
                        placeholder="0000000000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="initialPassword">رمز عبور اولیه *</Label>
                      <Input
                        id="initialPassword"
                        type="password"
                        value={newRepForm.initialPassword}
                        onChange={(e) => setNewRepForm(prev => ({ ...prev, initialPassword: e.target.value }))}
                        placeholder="حداقل 8 کاراکتر"
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="business" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="storeName">نام فروشگاه</Label>
                      <Input
                        id="storeName"
                          value={newRepForm.storeName}
                          onChange={(e) => setNewRepForm(prev => ({ ...prev, storeName: e.target.value }))}
                          placeholder="نام فروشگاه موبایل"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="storeAddress">آدرس فروشگاه</Label>
                      <Textarea
                        id="storeAddress"
                        value={newRepForm.storeAddress}
                        onChange={(e) => setNewRepForm(prev => ({ ...prev, storeAddress: e.target.value }))}
                        placeholder="آدرس کامل فروشگاه"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes">یادداشت‌ها</Label>
                      <Textarea
                        id="notes"
                        value={newRepForm.notes}
                        onChange={(e) => setNewRepForm(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="یادداشت‌های اضافی در مورد نماینده"
                        rows={3}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="commission" className="space-y-4">
                    <div>
                      <Label htmlFor="collaborationLevel">سطح همکاری</Label>
                      <Select
                        value={newRepForm.collaborationLevel}
                        onValueChange={(value: any) => setNewRepForm(prev => ({ ...prev, collaborationLevel: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">پایه - دسترسی محدود</SelectItem>
                          <SelectItem value="advanced">پیشرفته - دسترسی کامل</SelectItem>
                          <SelectItem value="premium">ویژه - دسترسی مدیریتی</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-base font-semibold">نرخ کمیسیون (%)</Label>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <Label htmlFor="limited1Month">محدود 1 ماهه</Label>
                          <Input
                            id="limited1Month"
                            type="number"
                            value={newRepForm.commissionRates.limited1Month}
                            onChange={(e) => setNewRepForm(prev => ({
                              ...prev,
                              commissionRates: { ...prev.commissionRates, limited1Month: e.target.value }
                            }))}
                            placeholder="15"
                          />
                        </div>
                        <div>
                          <Label htmlFor="limited3Month">محدود 3 ماهه</Label>
                          <Input
                            id="limited3Month"
                            type="number"
                            value={newRepForm.commissionRates.limited3Month}
                            onChange={(e) => setNewRepForm(prev => ({
                              ...prev,
                              commissionRates: { ...prev.commissionRates, limited3Month: e.target.value }
                            }))}
                            placeholder="18"
                          />
                        </div>
                        <div>
                          <Label htmlFor="limited6Month">محدود 6 ماهه</Label>
                          <Input
                            id="limited6Month"
                            type="number"
                            value={newRepForm.commissionRates.limited6Month}
                            onChange={(e) => setNewRepForm(prev => ({
                              ...prev,
                              commissionRates: { ...prev.commissionRates, limited6Month: e.target.value }
                            }))}
                            placeholder="20"
                          />
                        </div>
                        <div>
                          <Label htmlFor="unlimited">نامحدود</Label>
                          <Input
                            id="unlimited"
                            type="number"
                            value={newRepForm.commissionRates.unlimited}
                            onChange={(e) => setNewRepForm(prev => ({
                              ...prev,
                              commissionRates: { ...prev.commissionRates, unlimited: e.target.value }
                            }))}
                            placeholder="25"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => { resetForm(); setIsAddDialogOpen(false); }}
                  >
                    انصراف
                  </Button>
                  <Button 
                    onClick={handleAddRepresentative}
                    disabled={addRepresentativeMutation.isPending}
                  >
                    {addRepresentativeMutation.isPending ? 'در حال افزودن...' : 'افزودن نماینده'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            خروجی Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="جستجو در نمایندگان..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="وضعیت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                  <SelectItem value="active">فعال</SelectItem>
                  <SelectItem value="inactive">غیرفعال</SelectItem>
                  <SelectItem value="pending">در انتظار تأیید</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={collaborationFilter} onValueChange={setCollaborationFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="سطح همکاری" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه سطوح</SelectItem>
                  <SelectItem value="basic">پایه</SelectItem>
                  <SelectItem value="advanced">پیشرفته</SelectItem>
                  <SelectItem value="premium">ویژه</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Users className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Representatives List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRepresentatives.map((rep, index) => (
            <motion.div
              key={rep.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{rep.fullName}</CardTitle>
                      <p className="text-sm text-gray-600">@{rep.adminUsername}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <StatusBadge status={rep.status || 'pending'} />
                      <CollaborationBadge level={rep.collaborationLevel} />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      {rep.phoneNumber || 'تلفن ثبت نشده'}
                    </div>
                    
                    {rep.storeName && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building className="w-4 h-4" />
                        {rep.storeName}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                      <div className="text-center">
                        <div className="text-sm text-gray-600">فروش ماهانه</div>
                        <div className="font-semibold persian-nums">
                          {rep.salesMetrics?.totalSales || 0} میلیون
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">نرخ تبدیل</div>
                        <div className="font-semibold persian-nums">
                          {rep.salesMetrics?.conversionRate || 0}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-3">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="w-4 h-4 ml-1" />
                        مشاهده
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Edit3 className="w-4 h-4 ml-1" />
                        ویرایش
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateStatusMutation.mutate({
                          id: rep.id,
                          status: rep.status === 'active' ? 'inactive' : 'active'
                        })}
                      >
                        {rep.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="text-right p-4 font-semibold">نماینده</th>
                    <th className="text-right p-4 font-semibold">تماس</th>
                    <th className="text-right p-4 font-semibold">فروشگاه</th>
                    <th className="text-right p-4 font-semibold">سطح همکاری</th>
                    <th className="text-right p-4 font-semibold">وضعیت</th>
                    <th className="text-right p-4 font-semibold">عملکرد</th>
                    <th className="text-right p-4 font-semibold">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRepresentatives.map((rep) => (
                    <tr key={rep.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{rep.fullName}</div>
                          <div className="text-sm text-gray-600">@{rep.adminUsername}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <div>{rep.phoneNumber}</div>
                          <div className="text-gray-600">{rep.telegramId}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {rep.storeName || 'فروشگاه ثبت نشده'}
                        </div>
                      </td>
                      <td className="p-4">
                        <CollaborationBadge level={rep.collaborationLevel} />
                      </td>
                      <td className="p-4">
                        <StatusBadge status={rep.status || 'pending'} />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <div className="text-xs text-gray-600">فروش</div>
                            <div className="font-medium persian-nums">{rep.salesMetrics?.totalSales || 0}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-600">تبدیل</div>
                            <div className="font-medium persian-nums">{rep.salesMetrics?.conversionRate || 0}%</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredRepresentatives.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">هیچ نماینده‌ای یافت نشد</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter !== 'all' || collaborationFilter !== 'all' 
              ? 'هیچ نماینده‌ای با این فیلترها یافت نشد' 
              : 'هنوز هیچ نماینده‌ای اضافه نشده است'}
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <UserPlus className="w-4 h-4 ml-2" />
            افزودن اولین نماینده
          </Button>
        </div>
      )}
    </div>
  );
}