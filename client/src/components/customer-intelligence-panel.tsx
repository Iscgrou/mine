import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";

interface CustomerPrediction {
  customerId: number;
  churnRisk: {
    probability: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    keyFactors: string[];
    timeline: 'immediate' | '1-week' | '1-month' | '3-months';
  };
  recommendations: {
    actions: Array<{
      priority: 'high' | 'medium' | 'low';
      action: string;
      expectedImpact: string;
      timeframe: string;
    }>;
    nextBestOffer: {
      serviceType: 'unlimited' | 'limited';
      discount?: number;
      reasoning: string;
    };
  };
  lifetimeValuePrediction: {
    next30Days: number;
    next90Days: number;
    next12Months: number;
    confidence: number;
  };
  engagementStrategy: {
    preferredChannel: 'call' | 'message' | 'telegram';
    optimalContactTime: string;
    communicationTone: 'formal' | 'friendly' | 'technical';
    keyTopics: string[];
  };
}

export default function CustomerIntelligencePanel() {
  const [customerId, setCustomerId] = useState("");
  const [prediction, setPrediction] = useState<CustomerPrediction | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");

  const analyzeCustomer = async () => {
    if (!customerId.trim()) {
      setError("لطفاً شناسه مشتری را وارد کنید");
      return;
    }

    setIsAnalyzing(true);
    setError("");
    
    try {
      const response = await fetch("/api/ai/customer-analysis", {
        method: "POST",
        body: JSON.stringify({ customerId: parseInt(customerId) }),
        headers: { "Content-Type": "application/json" }
      });

      const data = await response.json();

      if (data.success) {
        setPrediction(data.prediction);
      } else {
        setError(data.message || "خطا در تحلیل مشتری");
      }
    } catch (err) {
      setError("خطا در ارتباط با سرور هوش مصنوعی");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Analysis Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-reverse space-x-2">
            <i className="fas fa-brain text-blue-600"></i>
            <span>تحلیل هوش مصنوعی مشتری</span>
          </CardTitle>
          <CardDescription>
            تحلیل رفتار مشتری و پیش‌بینی ریسک ترک سرویس با استفاده از Vertex AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-reverse space-x-4 items-end">
            <div className="flex-1">
              <Label htmlFor="customerId">شناسه مشتری</Label>
              <Input
                id="customerId"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                placeholder="مثال: 653"
                className="mt-1"
              />
            </div>
            <Button 
              onClick={analyzeCustomer}
              disabled={isAnalyzing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isAnalyzing ? (
                <>
                  <i className="fas fa-spinner fa-spin ml-2"></i>
                  در حال تحلیل...
                </>
              ) : (
                <>
                  <i className="fas fa-search ml-2"></i>
                  تحلیل مشتری
                </>
              )}
            </Button>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {prediction && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview">نمای کلی</TabsTrigger>
            <TabsTrigger value="recommendations">توصیه‌ها</TabsTrigger>
            <TabsTrigger value="predictions">پیش‌بینی‌ها</TabsTrigger>
            <TabsTrigger value="strategy">استراتژی</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Churn Risk */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">ریسک ترک سرویس</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>احتمال ترک:</span>
                      <Badge className={getRiskColor(prediction.churnRisk.riskLevel)}>
                        {Math.round(prediction.churnRisk.probability * 100)}%
                      </Badge>
                    </div>
                    <Progress 
                      value={prediction.churnRisk.probability * 100} 
                      className="h-3"
                    />
                    <div className="text-sm text-gray-600">
                      <p><strong>سطح ریسک:</strong> {prediction.churnRisk.riskLevel}</p>
                      <p><strong>زمان‌بندی:</strong> {prediction.churnRisk.timeline}</p>
                    </div>
                    <div>
                      <p className="font-medium mb-2">فاکتورهای کلیدی:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {prediction.churnRisk.keyFactors.map((factor, index) => (
                          <li key={index} className="flex items-start">
                            <i className="fas fa-exclamation-triangle text-orange-500 mt-0.5 ml-2 text-xs"></i>
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lifetime Value Prediction */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">پیش‌بینی ارزش مشتری</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>30 روز آینده:</span>
                      <span className="font-medium">
                        {prediction.lifetimeValuePrediction.next30Days.toLocaleString()} تومان
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>90 روز آینده:</span>
                      <span className="font-medium">
                        {prediction.lifetimeValuePrediction.next90Days.toLocaleString()} تومان
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>12 ماه آینده:</span>
                      <span className="font-medium">
                        {prediction.lifetimeValuePrediction.next12Months.toLocaleString()} تومان
                      </span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between">
                        <span>اطمینان پیش‌بینی:</span>
                        <Badge variant="outline">
                          {Math.round(prediction.lifetimeValuePrediction.confidence * 100)}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>اقدامات پیشنهادی</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {prediction.recommendations.actions.map((action, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{action.action}</h4>
                        <Badge className={getPriorityColor(action.priority)}>
                          {action.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{action.expectedImpact}</p>
                      <p className="text-xs text-gray-500">
                        <i className="fas fa-clock ml-1"></i>
                        زمان‌بندی: {action.timeframe}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>بهترین پیشنهاد سرویس</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">نوع سرویس پیشنهادی:</span>
                    <Badge variant="outline">
                      {prediction.recommendations.nextBestOffer.serviceType}
                    </Badge>
                  </div>
                  {prediction.recommendations.nextBestOffer.discount && (
                    <div className="flex items-center justify-between mb-2">
                      <span>تخفیف پیشنهادی:</span>
                      <span className="text-green-600 font-medium">
                        {prediction.recommendations.nextBestOffer.discount}%
                      </span>
                    </div>
                  )}
                  <p className="text-sm text-gray-600">
                    <strong>دلیل:</strong> {prediction.recommendations.nextBestOffer.reasoning}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Predictions Tab */}
          <TabsContent value="predictions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>تحلیل پیش‌بینی درآمد</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {prediction.lifetimeValuePrediction.next30Days.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">درآمد 30 روز آینده</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {prediction.lifetimeValuePrediction.next90Days.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">درآمد 90 روز آینده</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {prediction.lifetimeValuePrediction.next12Months.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">درآمد 12 ماه آینده</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Strategy Tab */}
          <TabsContent value="strategy" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>استراتژی تعامل</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>کانال ترجیحی تماس:</Label>
                    <Badge variant="outline" className="mt-1 ml-2">
                      {prediction.engagementStrategy.preferredChannel}
                    </Badge>
                  </div>
                  <div>
                    <Label>بهترین زمان تماس:</Label>
                    <Badge variant="outline" className="mt-1 ml-2">
                      {prediction.engagementStrategy.optimalContactTime}
                    </Badge>
                  </div>
                  <div>
                    <Label>سبک ارتباط:</Label>
                    <Badge variant="outline" className="mt-1 ml-2">
                      {prediction.engagementStrategy.communicationTone}
                    </Badge>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Label>موضوعات کلیدی برای گفتگو:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {prediction.engagementStrategy.keyTopics.map((topic, index) => (
                      <Badge key={index} variant="secondary">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}