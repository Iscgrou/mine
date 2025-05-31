import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Brain, TrendingUp, AlertCircle, CheckCircle, Users, DollarSign } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AIInsight {
  type: 'trend' | 'recommendation' | 'alert' | 'success';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

interface AIAnalysisResponse {
  insights: AIInsight[];
  summary: string;
  confidence: number;
}

export function AIInsights() {
  const [query, setQuery] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null);

  // Fetch business data for AI analysis
  const { data: invoices } = useQuery({
    queryKey: ['/api/invoices'],
    enabled: true
  });

  const { data: representatives } = useQuery({
    queryKey: ['/api/representatives'],
    enabled: true
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
    enabled: true
  });

  const handleAnalyze = async () => {
    if (!query.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const businessData = {
        invoices: invoices || [],
        representatives: representatives || [],
        stats: stats || {},
        query: query
      };

      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(businessData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setAnalysis(result);
    } catch (error) {
      console.error('AI analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return <TrendingUp className="h-4 w-4" />;
      case 'recommendation': return <Brain className="h-4 w-4" />;
      case 'alert': return <AlertCircle className="h-4 w-4" />;
      case 'success': return <CheckCircle className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'trend': return 'bg-blue-100 text-blue-800';
      case 'recommendation': return 'bg-purple-100 text-purple-800';
      case 'alert': return 'bg-red-100 text-red-800';
      case 'success': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Query Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            تحلیل هوشمند کسب‌وکار
          </CardTitle>
          <CardDescription>
            سوال خود را درباره وضعیت کسب‌وکار، عملکرد نمایندگان یا پیش‌بینی فروش بپرسید
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="مثال: عملکرد فروش این ماه چگونه بوده؟ یا کدام نمایندگان بهترین عملکرد را دارند؟"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-h-[100px] text-right"
            dir="rtl"
          />
          <Button 
            onClick={handleAnalyze}
            disabled={!query.trim() || isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                در حال تحلیل...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 ml-2" />
                تحلیل با هوش مصنوعی
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* AI Analysis Results */}
      {analysis && (
        <div className="space-y-4">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>خلاصه تحلیل</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  اطمینان: {Math.round(analysis.confidence * 100)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed" dir="rtl">
                {analysis.summary}
              </p>
            </CardContent>
          </Card>

          {/* Insights */}
          <div className="grid gap-4">
            {analysis.insights.map((insight, index) => (
              <Card key={index} className="border-l-4 border-l-purple-500">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {getInsightIcon(insight.type)}
                        <h3 className="font-semibold text-right" dir="rtl">
                          {insight.title}
                        </h3>
                      </div>
                      <p className="text-gray-600 text-right" dir="rtl">
                        {insight.description}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge className={getInsightColor(insight.type)}>
                        {insight.type === 'trend' && 'روند'}
                        {insight.type === 'recommendation' && 'پیشنهاد'}
                        {insight.type === 'alert' && 'هشدار'}
                        {insight.type === 'success' && 'موفقیت'}
                      </Badge>
                      <Badge variant="outline" className={getPriorityColor(insight.priority)}>
                        {insight.priority === 'high' && 'اولویت بالا'}
                        {insight.priority === 'medium' && 'اولویت متوسط'}
                        {insight.priority === 'low' && 'اولویت پایین'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quick Insights Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle>تحلیل‌های سریع</CardTitle>
          <CardDescription>بینش‌های آماده بر اساس داده‌های فعلی</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => setQuery("وضعیت کلی فروش و درآمد چگونه است؟")}
            >
              <DollarSign className="h-6 w-6 text-green-600" />
              <span className="text-sm">تحلیل فروش</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => setQuery("کدام نمایندگان بهترین عملکرد را دارند؟")}
            >
              <Users className="h-6 w-6 text-blue-600" />
              <span className="text-sm">عملکرد نمایندگان</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => setQuery("پیش‌بینی درآمد ماه آینده چگونه است؟")}
            >
              <TrendingUp className="h-6 w-6 text-purple-600" />
              <span className="text-sm">پیش‌بینی فروش</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}