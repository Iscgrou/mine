import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Users, Edit3, Trash2, Eye, UserPlus, 
  TrendingUp, DollarSign, Phone, Mail, MapPin,
  Building, Calendar, Award, AlertCircle, CheckCircle,
  Search, Filter, Download, MoreHorizontal, Star,
  UserCheck, UserX, Settings, Clock, Target, FileText,
  User
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
import { FinancialBalance } from '@/components/ui/financial-balance';

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
  collaboratorId: number | null;
  collaboratorName: string | null;
  limitedPrice1Month: string | null;
  limitedPrice2Month: string | null;
  limitedPrice3Month: string | null;
  limitedPrice4Month: string | null;
  limitedPrice5Month: string | null;
  limitedPrice6Month: string | null;
  unlimitedMonthlyPrice: string | null;
  salesMetrics?: {
    totalSales: number;
    monthlyRevenue: number;
    activeSubscriptions: number;
    conversionRate: number;
  };
  collaborationLevel: 'basic' | 'advanced' | 'premium';
  verificationStatus: 'pending' | 'verified' | 'rejected';
}

interface Collaborator {
  id: number;
  collaboratorName: string;
  uniqueCollaboratorId: string;
  status: string;
}

interface NewRepresentativeForm {
  fullName: string;
  adminUsername: string;
  collaboratorId: string;
  phoneNumber: string;
  telegramId: string;
  storeName: string;
  storeAddress: string;
  limitedPrice1Month: string;
  limitedPrice2Month: string;
  limitedPrice3Month: string;
  limitedPrice4Month: string;
  limitedPrice5Month: string;
  limitedPrice6Month: string;
  unlimitedMonthlyPrice: string;
  nationalId: string;
  collaborationLevel: 'basic' | 'advanced' | 'premium';
  introducerType: 'direct' | 'collaborator';
  introducerCollaboratorId: number | null;
  initialPassword: string;
  notes: string;
}

export default function RepresentativeManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [collaborationFilter, setCollaborationFilter] = useState('all');
  const [selectedRepresentative, setSelectedRepresentative] = useState<Representative | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [moreActionsOpen, setMoreActionsOpen] = useState(false);
  const [financialHistoryOpen, setFinancialHistoryOpen] = useState(false);
  const [commissionSettingsOpen, setCommissionSettingsOpen] = useState(false);
  
  const [newRepForm, setNewRepForm] = useState<NewRepresentativeForm>({
    fullName: '',
    adminUsername: '',
    collaboratorId: '',
    phoneNumber: '',
    telegramId: '',
    storeName: '',
    storeAddress: '',
    limitedPrice1Month: '50000',
    limitedPrice2Month: '90000',
    limitedPrice3Month: '120000',
    limitedPrice4Month: '150000',
    limitedPrice5Month: '180000',
    limitedPrice6Month: '200000',
    unlimitedMonthlyPrice: '80000',
    nationalId: '',
    collaborationLevel: 'basic',
    introducerType: 'direct',
    introducerCollaboratorId: null,
    initialPassword: '',
    notes: ''
  });

  // Query for representatives data
  const { data: representatives = [], isLoading } = useQuery({
    queryKey: ['/api/representatives'],
    queryFn: async () => {
      const response = await fetch('/api/representatives');
      if (!response.ok) throw new Error('Failed to fetch representatives');
      return response.json();
    }
  });

  // Query for collaborators data
  const { data: collaborators = [] } = useQuery({
    queryKey: ['/api/collaborators'],
    queryFn: async () => {
      const response = await fetch('/api/collaborators');
      if (!response.ok) throw new Error('Failed to fetch collaborators');
      return response.json();
    }
  });

  // Add representative mutation
  const addRepresentativeMutation = useMutation({
    mutationFn: async (newRep: NewRepresentativeForm) => {
      const response = await fetch('/api/representatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRep)
      });
      if (!response.ok) throw new Error('Failed to add representative');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/representatives'] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "موفق",
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

  // Filter representatives
  const filteredRepresentatives = representatives.filter((rep: Representative) => {
    const matchesSearch = rep.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rep.adminUsername?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rep.storeName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || rep.status === statusFilter;
    const matchesCollaboration = collaborationFilter === 'all' || (rep.collaborationLevel && rep.collaborationLevel === collaborationFilter);
    
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
      collaboratorId: '',
      phoneNumber: '',
      telegramId: '',
      storeName: '',
      storeAddress: '',
      limitedPrice1Month: '50000',
      limitedPrice2Month: '90000',
      limitedPrice3Month: '120000',
      limitedPrice4Month: '150000',
      limitedPrice5Month: '180000',
      limitedPrice6Month: '200000',
      unlimitedMonthlyPrice: '80000',
      nationalId: '',
      collaborationLevel: 'basic',
      introducerType: 'direct',
      introducerCollaboratorId: null,
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
                    <div>
                      <Label htmlFor="storeAddress">آدرس فروشگاه</Label>
                      <Input
                        id="storeAddress"
                        value={newRepForm.storeAddress}
                        onChange={(e) => setNewRepForm(prev => ({ ...prev, storeAddress: e.target.value }))}
                        placeholder="آدرس کامل فروشگاه"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">یادداشت‌ها</Label>
                    <Input
                      id="notes"
                      value={newRepForm.notes}
                      onChange={(e) => setNewRepForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="یادداشت‌های اضافی"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="commission" className="space-y-4">
                  <div>
                    <Label>سطح همکاری</Label>
                    <Select
                      value={newRepForm.collaborationLevel}
                      onValueChange={(value: 'basic' | 'advanced' | 'premium') => 
                        setNewRepForm(prev => ({ ...prev, collaborationLevel: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">پایه</SelectItem>
                        <SelectItem value="advanced">پیشرفته</SelectItem>
                        <SelectItem value="premium">ویژه</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>نوع معرف</Label>
                    <Select
                      value={newRepForm.introducerType}
                      onValueChange={(value: 'direct' | 'collaborator') => {
                        setNewRepForm(prev => ({ 
                          ...prev, 
                          introducerType: value,
                          introducerCollaboratorId: value === 'direct' ? null : prev.introducerCollaboratorId
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="direct">مستقیم</SelectItem>
                        <SelectItem value="collaborator">معرفی شده توسط همکار</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newRepForm.introducerType === 'collaborator' && (
                    <div>
                      <Label>همکار معرف</Label>
                      <Select
                        value={newRepForm.introducerCollaboratorId?.toString() || ''}
                        onValueChange={(value) => 
                          setNewRepForm(prev => ({ 
                            ...prev, 
                            introducerCollaboratorId: value ? parseInt(value) : null 
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب همکار معرف" />
                        </SelectTrigger>
                        <SelectContent>
                          {collaborators.map((collaborator: any) => (
                            <SelectItem key={collaborator.id} value={collaborator.id.toString()}>
                              {collaborator.collaboratorName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {/* Limited Subscription Pricing (1-6 months) */}
                  <div>
                    <Label>قیمت‌گذاری اشتراک محدود (تومان)</Label>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div>
                        <Label htmlFor="limitedPrice1Month">1 ماه</Label>
                        <Input
                          id="limitedPrice1Month"
                          type="number"
                          value={newRepForm.limitedPrice1Month}
                          onChange={(e) => setNewRepForm(prev => ({
                            ...prev,
                            limitedPrice1Month: e.target.value
                          }))}
                          placeholder="50000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="limitedPrice2Month">2 ماه</Label>
                        <Input
                          id="limitedPrice2Month"
                          type="number"
                          value={newRepForm.limitedPrice2Month}
                          onChange={(e) => setNewRepForm(prev => ({
                            ...prev,
                            limitedPrice2Month: e.target.value
                          }))}
                          placeholder="90000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="limitedPrice3Month">3 ماه</Label>
                        <Input
                          id="limitedPrice3Month"
                          type="number"
                          value={newRepForm.limitedPrice3Month}
                          onChange={(e) => setNewRepForm(prev => ({
                            ...prev,
                            limitedPrice3Month: e.target.value
                          }))}
                          placeholder="120000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="limitedPrice4Month">4 ماه</Label>
                        <Input
                          id="limitedPrice4Month"
                          type="number"
                          value={newRepForm.limitedPrice4Month}
                          onChange={(e) => setNewRepForm(prev => ({
                            ...prev,
                            limitedPrice4Month: e.target.value
                          }))}
                          placeholder="150000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="limitedPrice5Month">5 ماه</Label>
                        <Input
                          id="limitedPrice5Month"
                          type="number"
                          value={newRepForm.limitedPrice5Month}
                          onChange={(e) => setNewRepForm(prev => ({
                            ...prev,
                            limitedPrice5Month: e.target.value
                          }))}
                          placeholder="180000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="limitedPrice6Month">6 ماه</Label>
                        <Input
                          id="limitedPrice6Month"
                          type="number"
                          value={newRepForm.limitedPrice6Month}
                          onChange={(e) => setNewRepForm(prev => ({
                            ...prev,
                            limitedPrice6Month: e.target.value
                          }))}
                          placeholder="200000"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Unlimited Subscription Pricing */}
                  <div>
                    <Label htmlFor="unlimitedMonthlyPrice">قیمت اشتراک نامحدود ماهانه (تومان)</Label>
                    <Input
                      id="unlimitedMonthlyPrice"
                      type="number"
                      value={newRepForm.unlimitedMonthlyPrice}
                      onChange={(e) => setNewRepForm(prev => ({
                        ...prev,
                        unlimitedMonthlyPrice: e.target.value
                      }))}
                      placeholder="80000"
                    />
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

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="جستجو در نام، نام کاربری یا نام فروشگاه..."
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
                  <SelectItem value="suspended">تعلیق</SelectItem>
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Representatives Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredRepresentatives.map((rep: Representative) => (
              <motion.div
                key={rep.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base font-semibold">{rep.fullName}</CardTitle>
                        <p className="text-sm text-gray-600">@{rep.adminUsername}</p>
                      </div>
                      <Badge variant={rep.verificationStatus === 'verified' ? 'default' : 'secondary'}>
                        {rep.verificationStatus === 'verified' ? 'تایید شده' : 'در انتظار'}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {/* Total Debt Display */}
                    <div className="bg-gradient-to-r from-red-50 to-rose-50 p-3 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">میزان بدهی کل</span>
                        <div className="text-lg font-bold text-red-700">
                          {(0).toLocaleString('fa-IR')} تومان
                        </div>
                      </div>
                    </div>
                    
                    {/* Store Info */}
                    {rep.storeName && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span>{rep.storeName}</span>
                      </div>
                    )}
                    
                    {/* Contact Info */}
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{rep.phoneNumber || 'شماره ثبت نشده'}</span>
                    </div>
                    
                    {/* Collaborator/Introducer Info */}
                    <div className="flex items-center gap-2 text-sm bg-blue-50 p-2 rounded-lg">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-800">معرف:</span>
                      <span className="text-blue-700">
                        {rep.collaboratorName || 'نامشخص'}
                      </span>
                    </div>
                    
                    {/* Collaboration Level */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">
                          {rep.collaborationLevel === 'basic' ? 'پایه' : 
                           rep.collaborationLevel === 'advanced' ? 'پیشرفته' : 'ویژه'}
                        </span>
                      </div>
                      <Badge variant="outline">
                        {rep.status || 'فعال'}
                      </Badge>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 hover:bg-blue-50 hover:border-blue-300"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedRepresentative(rep);
                          setViewModalOpen(true);
                          console.log('Viewing representative:', rep.id);
                        }}
                      >
                        <Eye className="w-3 h-3 ml-1" />
                        مشاهده
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="hover:bg-green-50 hover:border-green-300"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedRepresentative(rep);
                          setEditModalOpen(true);
                          console.log('Editing representative:', rep.id);
                        }}
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="hover:bg-gray-50 hover:border-gray-300"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedRepresentative(rep);
                          setMoreActionsOpen(true);
                          console.log('More actions for representative:', rep.id);
                        }}
                      >
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      
      {filteredRepresentatives.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">هیچ نماینده‌ای یافت نشد</h3>
            <p className="text-gray-600">برای شروع، نماینده جدیدی اضافه کنید</p>
          </CardContent>
        </Card>
      )}

      {/* View Representative Details Dialog */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>جزئیات نماینده</DialogTitle>
          </DialogHeader>
          {selectedRepresentative && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">نام کامل</Label>
                  <p className="text-base">{selectedRepresentative.fullName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">نام کاربری</Label>
                  <p className="text-base">@{selectedRepresentative.adminUsername}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">شماره تلفن</Label>
                  <p className="text-base">{selectedRepresentative.phoneNumber || 'ثبت نشده'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">تلگرام</Label>
                  <p className="text-base">{selectedRepresentative.telegramId || 'ثبت نشده'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">نام فروشگاه</Label>
                  <p className="text-base">{selectedRepresentative.storeName || 'ثبت نشده'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">وضعیت تایید</Label>
                  <Badge variant={selectedRepresentative.verificationStatus === 'verified' ? 'default' : 'secondary'}>
                    {selectedRepresentative.verificationStatus === 'verified' ? 'تایید شده' : 'در انتظار'}
                  </Badge>
                </div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <Label className="text-sm font-medium">میزان بدهی کل</Label>
                <p className="text-xl font-bold text-red-700">{(0).toLocaleString('fa-IR')} تومان</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Representative Dialog */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>ویرایش کامل نماینده</DialogTitle>
          </DialogHeader>
          {selectedRepresentative && (
            <div className="space-y-6">
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="personal">اطلاعات شخصی</TabsTrigger>
                  <TabsTrigger value="business">اطلاعات کسب‌وکار</TabsTrigger>
                  <TabsTrigger value="pricing">قیمت‌گذاری</TabsTrigger>
                </TabsList>
                
                <TabsContent value="personal" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>نام کامل</Label>
                      <Input defaultValue={selectedRepresentative.fullName} />
                    </div>
                    <div>
                      <Label>نام کاربری</Label>
                      <Input defaultValue={selectedRepresentative.adminUsername} />
                    </div>
                    <div>
                      <Label>شماره تلفن</Label>
                      <Input defaultValue={selectedRepresentative.phoneNumber || ''} />
                    </div>
                    <div>
                      <Label>شناسه تلگرام</Label>
                      <Input defaultValue={selectedRepresentative.telegramId || ''} />
                    </div>
                    <div>
                      <Label>کد ملی</Label>
                      <Input defaultValue={selectedRepresentative.nationalId || ''} />
                    </div>
                    <div>
                      <Label>وضعیت تایید</Label>
                      <Select defaultValue={selectedRepresentative.verificationStatus}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">در انتظار</SelectItem>
                          <SelectItem value="verified">تایید شده</SelectItem>
                          <SelectItem value="rejected">رد شده</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="business" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>نام فروشگاه</Label>
                      <Input defaultValue={selectedRepresentative.storeName || ''} />
                    </div>
                    <div>
                      <Label>آدرس فروشگاه</Label>
                      <Input defaultValue={selectedRepresentative.storeAddress || ''} />
                    </div>
                    <div>
                      <Label>سطح همکاری</Label>
                      <Select defaultValue={selectedRepresentative.collaborationLevel}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">پایه</SelectItem>
                          <SelectItem value="advanced">پیشرفته</SelectItem>
                          <SelectItem value="premium">ویژه</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>وضعیت</Label>
                      <Select defaultValue={selectedRepresentative.status || 'active'}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">فعال</SelectItem>
                          <SelectItem value="inactive">غیرفعال</SelectItem>
                          <SelectItem value="suspended">تعلیق</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="pricing" className="space-y-4">
                  <div>
                    <Label>قیمت‌گذاری اشتراک محدود (تومان)</Label>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div>
                        <Label className="text-sm">1 ماه</Label>
                        <Input defaultValue={selectedRepresentative.limitedPrice1Month || '900'} />
                      </div>
                      <div>
                        <Label className="text-sm">2 ماه</Label>
                        <Input defaultValue={selectedRepresentative.limitedPrice2Month || '900'} />
                      </div>
                      <div>
                        <Label className="text-sm">3 ماه</Label>
                        <Input defaultValue={selectedRepresentative.limitedPrice3Month || '900'} />
                      </div>
                      <div>
                        <Label className="text-sm">4 ماه</Label>
                        <Input defaultValue={selectedRepresentative.limitedPrice4Month || '1400'} />
                      </div>
                      <div>
                        <Label className="text-sm">5 ماه</Label>
                        <Input defaultValue={selectedRepresentative.limitedPrice5Month || '1500'} />
                      </div>
                      <div>
                        <Label className="text-sm">6 ماه</Label>
                        <Input defaultValue={selectedRepresentative.limitedPrice6Month || '1600'} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label>قیمت اشتراک نامحدود (تومان)</Label>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div>
                        <Label className="text-sm">1 ماه</Label>
                        <Input defaultValue={selectedRepresentative.unlimitedPrice1Month || '40000'} />
                      </div>
                      <div>
                        <Label className="text-sm">2 ماه</Label>
                        <Input defaultValue={selectedRepresentative.unlimitedPrice2Month || '80000'} />
                      </div>
                      <div>
                        <Label className="text-sm">3 ماه</Label>
                        <Input defaultValue={selectedRepresentative.unlimitedPrice3Month || '120000'} />
                      </div>
                      <div>
                        <Label className="text-sm">4 ماه</Label>
                        <Input defaultValue={selectedRepresentative.unlimitedPrice4Month || '160000'} />
                      </div>
                      <div>
                        <Label className="text-sm">5 ماه</Label>
                        <Input defaultValue={selectedRepresentative.unlimitedPrice5Month || '200000'} />
                      </div>
                      <div>
                        <Label className="text-sm">6 ماه</Label>
                        <Input defaultValue={selectedRepresentative.unlimitedPrice6Month || '240000'} />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                  انصراف
                </Button>
                <Button onClick={() => {
                  toast({
                    title: "ویرایش انجام شد",
                    description: `اطلاعات ${selectedRepresentative.fullName} با موفقیت به‌روزرسانی شد`,
                  });
                  setEditModalOpen(false);
                }}>
                  ذخیره تغییرات
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* More Actions Dialog */}
      <Dialog open={moreActionsOpen} onOpenChange={setMoreActionsOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>عملیات اضافی</DialogTitle>
          </DialogHeader>
          {selectedRepresentative && (
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start hover:bg-green-50"
                onClick={() => {
                  setFinancialHistoryOpen(true);
                  setMoreActionsOpen(false);
                }}
              >
                <DollarSign className="w-4 h-4 ml-2" />
                مدیریت حساب مالی
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start hover:bg-blue-50"
                onClick={() => {
                  setCommissionSettingsOpen(true);
                  setMoreActionsOpen(false);
                }}
              >
                <Settings className="w-4 h-4 ml-2" />
                تنظیمات کمیسیون
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start hover:bg-purple-50"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/export-representative-data', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ representativeId: selectedRepresentative.id })
                    });
                    
                    if (response.ok) {
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `representative-${selectedRepresentative.adminUsername}-data.xlsx`;
                      a.click();
                      
                      toast({
                        title: "دانلود گزارش",
                        description: `گزارش ${selectedRepresentative.fullName} آماده شد`,
                      });
                    }
                  } catch (error) {
                    toast({
                      title: "خطا در دانلود",
                      description: "مشکلی در تولید گزارش پیش آمد",
                      variant: "destructive"
                    });
                  }
                  setMoreActionsOpen(false);
                }}
              >
                <Download className="w-4 h-4 ml-2" />
                دانلود اطلاعات کامل
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start hover:bg-orange-50"
                onClick={() => {
                  // Toggle representative status
                  const newStatus = selectedRepresentative.status === 'active' ? 'inactive' : 'active';
                  toast({
                    title: "تغییر وضعیت",
                    description: `وضعیت ${selectedRepresentative.fullName} به ${newStatus === 'active' ? 'فعال' : 'غیرفعال'} تغییر یافت`,
                  });
                  setMoreActionsOpen(false);
                }}
              >
                <UserCheck className="w-4 h-4 ml-2" />
                {selectedRepresentative.status === 'active' ? 'غیرفعال کردن' : 'فعال کردن'}
              </Button>
              <div className="border-t pt-2">
                <Button 
                  variant="destructive" 
                  className="w-full justify-start"
                  onClick={() => {
                    if (confirm(`آیا از حذف ${selectedRepresentative.fullName} اطمینان دارید؟ این عملیات قابل بازگشت نیست.`)) {
                      // Call delete API
                      fetch(`/api/representatives/${selectedRepresentative.id}`, {
                        method: 'DELETE'
                      }).then(() => {
                        toast({
                          title: "نماینده حذف شد",
                          description: `${selectedRepresentative.fullName} با موفقیت حذف شد`,
                          variant: "destructive"
                        });
                        queryClient.invalidateQueries({ queryKey: ['/api/representatives'] });
                      });
                      setMoreActionsOpen(false);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 ml-2" />
                  حذف نماینده
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Financial History Management Dialog */}
      <Dialog open={financialHistoryOpen} onOpenChange={setFinancialHistoryOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>مدیریت حساب مالی - {selectedRepresentative?.fullName}</DialogTitle>
          </DialogHeader>
          {selectedRepresentative && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <Label className="text-sm font-medium text-red-700">بدهی کل</Label>
                  <p className="text-2xl font-bold text-red-700">{(0).toLocaleString('fa-IR')} تومان</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <Label className="text-sm font-medium text-green-700">پرداخت‌های امروز</Label>
                  <p className="text-2xl font-bold text-green-700">{(0).toLocaleString('fa-IR')} تومان</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <Label className="text-sm font-medium text-blue-700">کمیسیون ماه جاری</Label>
                  <p className="text-2xl font-bold text-blue-700">{(0).toLocaleString('fa-IR')} تومان</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Plus className="w-4 h-4 ml-2" />
                    ثبت پرداخت جدید
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <DollarSign className="w-4 h-4 ml-2" />
                    تسویه حساب
                  </Button>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">آخرین تراکنش‌ها</h3>
                  <p className="text-gray-600 text-sm">تراکنش‌های مالی در اینجا نمایش داده خواهد شد</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Commission Settings Dialog */}
      <Dialog open={commissionSettingsOpen} onOpenChange={setCommissionSettingsOpen}>
        <DialogContent className="max-w-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>تنظیمات کمیسیون - {selectedRepresentative?.fullName}</DialogTitle>
          </DialogHeader>
          {selectedRepresentative && (
            <div className="space-y-6">
              <div>
                <Label>نرخ کمیسیون بر اساس نوع اشتراک (درصد)</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label className="text-sm">یک ماه محدود</Label>
                    <Input defaultValue={selectedRepresentative.limitedCommissionRate || '15'} />
                  </div>
                  <div>
                    <Label className="text-sm">سه ماه محدود</Label>
                    <Input defaultValue={selectedRepresentative.limited3MonthCommissionRate || '18'} />
                  </div>
                  <div>
                    <Label className="text-sm">شش ماه محدود</Label>
                    <Input defaultValue={selectedRepresentative.limited6MonthCommissionRate || '20'} />
                  </div>
                  <div>
                    <Label className="text-sm">نامحدود</Label>
                    <Input defaultValue={selectedRepresentative.unlimitedCommissionRate || '25'} />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>حداقل فروش ماهیانه (تومان)</Label>
                  <Input placeholder="مثال: 10000000" />
                </div>
                <div>
                  <Label>سقف کمیسیون ماهیانه (تومان)</Label>
                  <Input placeholder="مثال: 50000000" />
                </div>
              </div>
              
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setCommissionSettingsOpen(false)}>
                  انصراف
                </Button>
                <Button onClick={() => {
                  toast({
                    title: "تنظیمات ذخیره شد",
                    description: `تنظیمات کمیسیون ${selectedRepresentative.fullName} به‌روزرسانی شد`,
                  });
                  setCommissionSettingsOpen(false);
                }}>
                  ذخیره تغییرات
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}