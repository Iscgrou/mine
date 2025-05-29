import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatPersianDate } from "@/lib/persian-utils";
import { cn } from "@/lib/utils";

interface Representative {
  id: number;
  fullName: string;
  adminUsername: string;
  phoneNumber?: string;
  telegramId?: string;
  status: string;
  totalValue?: string;
}

interface CallPreparation {
  id: number;
  representativeId: number;
  callPurpose: string;
  aiTalkingPoints: any[];
  communicationStyle: string;
  potentialObjections: any[];
  opportunityInsights: string;
  historicalContext: string;
  psychologicalProfile: string;
  representative: Representative;
  createdAt: string;
}

interface InteractionHistory {
  id: number;
  type: string;
  direction: string;
  summary: string;
  outcome: string;
  sentimentScore: number;
  createdAt: string;
}

export default function CrmCallPreparation() {
  const [selectedRepId, setSelectedRepId] = useState<number | null>(null);
  const [callPurpose, setCallPurpose] = useState("");
  const [isGeneratingPrep, setIsGeneratingPrep] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const queryClient = useQueryClient();

  // Get representatives list
  const { data: representatives } = useQuery<Representative[]>({
    queryKey: ['/api/representatives'],
  });

  // Get call preparation if representative is selected
  const { data: callPrep, isLoading: isLoadingPrep } = useQuery<CallPreparation>({
    queryKey: ['/api/crm/call-preparation', selectedRepId, callPurpose],
    enabled: !!selectedRepId && !!callPurpose,
  });

  // Get interaction history for selected representative
  const { data: interactionHistory } = useQuery<InteractionHistory[]>({
    queryKey: ['/api/crm/interactions/history', selectedRepId],
    enabled: !!selectedRepId,
  });

  // Generate AI call preparation
  const generatePrepMutation = useMutation({
    mutationFn: async ({ repId, purpose }: { repId: number; purpose: string }) => {
      setIsGeneratingPrep(true);
      // This would call the AI service to generate comprehensive call preparation
      const response = await fetch('/api/crm/generate-call-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ representativeId: repId, callPurpose: purpose })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/call-preparation'] });
      setIsGeneratingPrep(false);
    },
    onError: () => {
      setIsGeneratingPrep(false);
    }
  });

  const filteredRepresentatives = representatives?.filter(rep =>
    rep.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rep.adminUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (rep.phoneNumber && rep.phoneNumber.includes(searchTerm))
  ) || [];

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return "text-green-600";
    if (score < -0.3) return "text-red-600";
    return "text-yellow-600";
  };

  const getSentimentText = (score: number) => {
    if (score > 0.3) return "مثبت";
    if (score < -0.3) return "منفی";
    return "خنثی";
  };

  const handleGeneratePrep = () => {
    if (selectedRepId && callPurpose) {
      generatePrepMutation.mutate({ repId: selectedRepId, purpose: callPurpose });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">آماده‌سازی هوشمند تماس</h1>
          <p className="text-gray-600">تحلیل و برنامه‌ریزی هوشمندانه برای تماس‌های مؤثر</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Representative Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>انتخاب نماینده</CardTitle>
            <CardDescription>نماینده مورد نظر برای تماس را انتخاب کنید</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="جستجو نماینده..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredRepresentatives.map((rep) => (
                <div
                  key={rep.id}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-colors",
                    selectedRepId === rep.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                  onClick={() => setSelectedRepId(rep.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{rep.fullName}</p>
                      <p className="text-xs text-gray-500">{rep.adminUsername}</p>
                      {rep.phoneNumber && (
                        <p className="text-xs text-gray-500">{rep.phoneNumber}</p>
                      )}
                    </div>
                    <Badge variant={rep.status === 'active' ? 'default' : 'secondary'}>
                      {rep.status === 'active' ? 'فعال' : 'غیرفعال'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {selectedRepId && (
              <div className="pt-4 border-t">
                <label className="text-sm font-medium">هدف تماس</label>
                <Select value={callPurpose} onValueChange={setCallPurpose}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="انتخاب هدف تماس" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="support">پشتیبانی فنی</SelectItem>
                    <SelectItem value="sales">فروش و معرفی سرویس</SelectItem>
                    <SelectItem value="follow_up">پیگیری معمول</SelectItem>
                    <SelectItem value="demo">نمایش محصول</SelectItem>
                    <SelectItem value="billing">مسائل مالی</SelectItem>
                    <SelectItem value="retention">حفظ مشتری</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  className="w-full mt-3"
                  onClick={handleGeneratePrep}
                  disabled={!callPurpose || isGeneratingPrep}
                >
                  {isGeneratingPrep ? (
                    <>
                      <i className="fas fa-spinner fa-spin ml-2"></i>
                      در حال تولید...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-brain ml-2"></i>
                      تولید برنامه هوشمند
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Call Preparation Results */}
        <div className="lg:col-span-2">
          {!selectedRepId ? (
            <Card>
              <CardContent className="text-center py-8">
                <i className="fas fa-user-plus text-4xl text-gray-300 mb-4"></i>
                <p className="text-gray-500">لطفاً ابتدا نماینده مورد نظر را انتخاب کنید</p>
              </CardContent>
            </Card>
          ) : !callPurpose ? (
            <Card>
              <CardContent className="text-center py-8">
                <i className="fas fa-bullseye text-4xl text-gray-300 mb-4"></i>
                <p className="text-gray-500">لطفاً هدف تماس را مشخص کنید</p>
              </CardContent>
            </Card>
          ) : isLoadingPrep || isGeneratingPrep ? (
            <Card>
              <CardContent className="text-center py-8">
                <i className="fas fa-spinner fa-spin text-4xl text-blue-500 mb-4"></i>
                <p className="text-gray-500">در حال تحلیل و آماده‌سازی...</p>
              </CardContent>
            </Card>
          ) : callPrep ? (
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">خلاصه</TabsTrigger>
                <TabsTrigger value="talking-points">نکات کلیدی</TabsTrigger>
                <TabsTrigger value="objections">اعتراضات</TabsTrigger>
                <TabsTrigger value="history">تاریخچه</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">پروفایل روانشناختی</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {callPrep.psychologicalProfile || "اطلاعات کافی برای تحلیل روانشناختی موجود نیست"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">سبک ارتباط پیشنهادی</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {callPrep.communicationStyle || "سبک ارتباط استاندارد"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-lg">فرصت‌های شناسایی شده</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {callPrep.opportunityInsights || "فرصت خاصی شناسایی نشده است"}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="talking-points">
                <Card>
                  <CardHeader>
                    <CardTitle>نکات کلیدی گفتگو</CardTitle>
                    <CardDescription>نکات مهم که باید در طول تماس مطرح شوند</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {callPrep.aiTalkingPoints?.map((point: any, index: number) => (
                        <div key={index} className="flex items-start space-x-3 space-x-reverse">
                          <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{point.title}</h4>
                            <p className="text-xs text-gray-600 mt-1">{point.description}</p>
                            {point.priority && (
                              <Badge className="mt-2" variant={point.priority === 'high' ? 'destructive' : 'secondary'}>
                                اولویت {point.priority === 'high' ? 'بالا' : point.priority === 'medium' ? 'متوسط' : 'پایین'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )) || (
                        <p className="text-gray-500 text-center py-4">نکات کلیدی در حال تولید...</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="objections">
                <Card>
                  <CardHeader>
                    <CardTitle>اعتراضات احتمالی و پاسخ‌ها</CardTitle>
                    <CardDescription>اعتراضات متداول و راهکارهای پیشنهادی</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {callPrep.potentialObjections?.map((objection: any, index: number) => (
                        <div key={index} className="border-l-4 border-orange-400 bg-orange-50 p-4 rounded">
                          <h4 className="font-medium text-sm text-orange-800">{objection.objection}</h4>
                          <p className="text-xs text-orange-700 mt-2">{objection.response}</p>
                          {objection.tips && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-orange-800">نکات اضافی:</p>
                              <ul className="text-xs text-orange-700 mt-1 list-disc list-inside">
                                {objection.tips.map((tip: string, tipIndex: number) => (
                                  <li key={tipIndex}>{tip}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )) || (
                        <p className="text-gray-500 text-center py-4">اعتراضات احتمالی در حال تحلیل...</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle>تاریخچه تعاملات</CardTitle>
                    <CardDescription>خلاصه آخرین تعاملات با این نماینده</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {interactionHistory?.map((interaction) => (
                        <div key={interaction.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <Badge variant="outline">{interaction.type}</Badge>
                              <Badge variant={interaction.direction === 'inbound' ? 'default' : 'secondary'}>
                                {interaction.direction === 'inbound' ? 'ورودی' : 'خروجی'}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <span className={cn("text-xs", getSentimentColor(interaction.sentimentScore))}>
                                احساسات: {getSentimentText(interaction.sentimentScore)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatPersianDate(interaction.createdAt)}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">{interaction.summary}</p>
                          {interaction.outcome && (
                            <p className="text-xs text-gray-500 mt-1">نتیجه: {interaction.outcome}</p>
                          )}
                        </div>
                      )) || (
                        <p className="text-gray-500 text-center py-4">تاریخچه تعاملات موجود نیست</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <i className="fas fa-exclamation-triangle text-4xl text-yellow-500 mb-4"></i>
                <p className="text-gray-500">خطا در تولید برنامه تماس. لطفاً دوباره تلاش کنید.</p>
                <Button className="mt-4" onClick={handleGeneratePrep}>
                  تلاش مجدد
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {selectedRepId && callPrep && (
        <Card>
          <CardHeader>
            <CardTitle>عملیات سریع</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline">
                <i className="fas fa-phone ml-2"></i>
                شروع تماس تلفنی
              </Button>
              <Button variant="outline">
                <i className="fab fa-telegram ml-2"></i>
                ارسال پیام تلگرام
              </Button>
              <Button variant="outline">
                <i className="fas fa-calendar-plus ml-2"></i>
                زمان‌بندی تماس
              </Button>
              <Button variant="outline">
                <i className="fas fa-sticky-note ml-2"></i>
                ثبت یادداشت
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}