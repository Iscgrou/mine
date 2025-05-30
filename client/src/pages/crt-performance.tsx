import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

// Modern Animated Components
const AnimatedCard = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    whileHover={{ 
      scale: 1.02, 
      boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
      transition: { duration: 0.2 }
    }}
    className={`bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50 hover:border-blue-200/50 transition-all duration-300 ${className}`}
  >
    {children}
  </motion.div>
);

const CountUpNumber = ({ value, duration = 2 }: { value: number, duration?: number }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const increment = value / (duration * 60);
    const timer = setInterval(() => {
      setCount(prev => {
        const next = prev + increment;
        if (next >= value) {
          clearInterval(timer);
          return value;
        }
        return next;
      });
    }, 1000 / 60);
    
    return () => clearInterval(timer);
  }, [value, duration]);
  
  return (
    <span className="persian-nums">
      {Math.round(count).toLocaleString('fa-IR')}
    </span>
  );
};

const ProgressRing = ({ progress, size = 120, strokeWidth = 8, color = "rgb(59, 130, 246)" }: {
  progress: number, size?: number, strokeWidth?: number, color?: string
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgb(229, 231, 235)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-gray-700 persian-nums">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
};

const AnimatedMetricCard = ({ title, value, subtitle, icon, color = "blue", delay = 0 }: {
  title: string, value: number, subtitle?: string, icon: string, color?: string, delay?: number
}) => {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600 text-blue-600",
    green: "from-green-500 to-green-600 text-green-600", 
    purple: "from-purple-500 to-purple-600 text-purple-600",
    orange: "from-orange-500 to-orange-600 text-orange-600",
    red: "from-red-500 to-red-600 text-red-600"
  };

  return (
    <AnimatedCard delay={delay} className="relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            <CountUpNumber value={value} />
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
        <motion.div 
          className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue} flex items-center justify-center text-white shadow-lg`}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ duration: 0.2 }}
        >
          <i className={`${icon} text-xl`}></i>
        </motion.div>
      </div>
      
      {/* Animated background pattern */}
      <motion.div
        className="absolute top-0 right-0 w-32 h-32 opacity-5"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <i className={`${icon} text-8xl`}></i>
      </motion.div>
    </AnimatedCard>
  );
};

const GlowingButton = ({ active, onClick, children, className = "" }: {
  active: boolean, onClick: () => void, children: React.ReactNode, className?: string
}) => (
  <motion.button
    onClick={onClick}
    className={`
      relative px-6 py-3 rounded-xl font-medium transition-all duration-300
      ${active 
        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25' 
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } ${className}
    `}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    {active && (
      <motion.div
        className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400 to-purple-500 opacity-75"
        animate={{ 
          scale: [1, 1.05, 1],
          opacity: [0.75, 0.5, 0.75]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    )}
    <span className="relative z-10">{children}</span>
  </motion.button>
);

const PulsingDot = ({ color = "green", size = "small" }: { color?: string, size?: string }) => {
  const sizeClasses = {
    small: "w-2 h-2",
    medium: "w-3 h-3",
    large: "w-4 h-4"
  };
  
  const colorClasses = {
    green: "bg-green-500",
    red: "bg-red-500", 
    yellow: "bg-yellow-500",
    blue: "bg-blue-500"
  };

  return (
    <div className="relative">
      <motion.div
        className={`rounded-full ${colorClasses[color as keyof typeof colorClasses]} ${sizeClasses[size as keyof typeof sizeClasses]}`}
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.div
        className={`absolute inset-0 rounded-full ${colorClasses[color as keyof typeof colorClasses]} opacity-75`}
        animate={{ scale: [1, 2, 1], opacity: [0.75, 0, 0.75] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </div>
  );
};

export default function CRTPerformance() {
  const [selectedPeriod, setSelectedPeriod] = useState('7');
  const [analysisMode, setAnalysisMode] = useState<'metrics' | 'ai'>('metrics');
  const [isLoading, setIsLoading] = useState(true);

  // Calculate date range based on selected period
  const getDateRange = (days: string) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(days));
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  const dateRange = getDateRange(selectedPeriod);

  // Fetch CRT performance metrics  
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ['/api/crt/performance', dateRange.startDate, dateRange.endDate],
    queryFn: () => 
      fetch(`/api/crt/performance?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch metrics');
          return res.json();
        }),
    retry: 2
  });

  // Fetch AI analysis
  const { data: aiData, isLoading: aiLoading } = useQuery({
    queryKey: ['/api/crt/ai-analysis', dateRange.startDate, dateRange.endDate],
    queryFn: () => 
      fetch(`/api/crt/ai-analysis?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch AI analysis');
          return res.json();
        }),
    enabled: analysisMode === 'ai'
  });

  // Simulate loading for visual effect
  useEffect(() => {
    if (!metricsLoading) {
      const timer = setTimeout(() => setIsLoading(false), 800);
      return () => clearTimeout(timer);
    }
  }, [metricsLoading]);

  if (isLoading || metricsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-6"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <motion.h2 
              className="text-2xl font-bold text-gray-800 mb-2"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              در حال بارگذاری تحلیل عملکرد
            </motion.h2>
            <p className="text-gray-600">لطفاً صبر کنید...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Handle data safely with proper validation
  const safeMetrics = metrics || {
    period: {
      shamsiStartDate: "در حال بارگذاری...",
      shamsiEndDate: "در حال بارگذاری..."
    },
    overallActivity: {
      totalInteractions: 0,
      callsMade: 0,
      averageCallDuration: 0,
      telegramMessages: 0,
      tasksCompleted: 0,
      tasksCreated: 0
    },
    interactionOutcomes: {
      issuesResolved: 0,
      followupsScheduled: 0,
      panelSalesPresentations: 0,
      escalatedIssues: 0
    },
    sentimentAnalysis: {
      overallSentiment: 'neutral' as const,
      sentimentScore: 0
    },
    commonTopics: [],
    anomalies: []
  };

  // Calculate rates safely
  const completionRate = safeMetrics.overallActivity.tasksCreated > 0 ? 
    (safeMetrics.overallActivity.tasksCompleted / safeMetrics.overallActivity.tasksCreated * 100) : 0;
  const resolutionRate = safeMetrics.overallActivity.totalInteractions > 0 ? 
    (safeMetrics.interactionOutcomes.issuesResolved / safeMetrics.overallActivity.totalInteractions * 100) : 0;
  const satisfactionScore = (safeMetrics.sentimentAnalysis.sentimentScore + 1) * 50;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Animated Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <motion.h1 
                className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3"
                animate={{ backgroundPosition: ["0%", "100%"] }}
                transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
              >
                مرکز نظارت عملکرد CRT
              </motion.h1>
              <p className="text-gray-600 text-lg">تحلیل هوشمند عملکرد تیم روابط مشتریان با قدرت هوش مصنوعی</p>
              <div className="flex items-center gap-2 mt-2">
                <PulsingDot color="green" />
                <span className="text-sm text-gray-500">آنلاین و فعال</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.select 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                whileFocus={{ scale: 1.02 }}
              >
                <option value="7">۷ روز گذشته</option>
                <option value="14">۲ هفته گذشته</option>
                <option value="30">ماه گذشته</option>
                <option value="90">۳ ماه گذشته</option>
              </motion.select>
              
              <div className="flex gap-2">
                <GlowingButton 
                  active={analysisMode === 'metrics'}
                  onClick={() => setAnalysisMode('metrics')}
                >
                  <i className="fas fa-chart-bar ml-2"></i>
                  آمار عملکرد
                </GlowingButton>
                <GlowingButton 
                  active={analysisMode === 'ai'}
                  onClick={() => setAnalysisMode('ai')}
                >
                  <i className="fas fa-brain ml-2"></i>
                  تحلیل هوشمند
                </GlowingButton>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Period Info */}
        <AnimatedCard delay={0.1} className="mb-8 text-center">
          <p className="text-gray-700">
            <span className="font-semibold">دوره مورد بررسی:</span>
            <span className="mx-2 persian-nums">{safeMetrics.period.shamsiStartDate}</span>
            <span className="text-gray-400">تا</span>
            <span className="mx-2 persian-nums">{safeMetrics.period.shamsiEndDate}</span>
          </p>
        </AnimatedCard>

        <AnimatePresence mode="wait">
          {analysisMode === 'metrics' ? (
            <motion.div
              key="metrics"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5 }}
            >
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                <AnimatedMetricCard
                  title="کل تعاملات"
                  value={mockMetrics.overallActivity.totalInteractions}
                  subtitle={`میانگین روزانه: ${Math.round(mockMetrics.overallActivity.totalInteractions / parseInt(selectedPeriod))}`}
                  icon="fas fa-comments"
                  color="blue"
                  delay={0.2}
                />
                <AnimatedMetricCard
                  title="تماس‌های انجام شده"
                  value={mockMetrics.overallActivity.callsMade}
                  subtitle={`میانگین مدت: ${mockMetrics.overallActivity.averageCallDuration} دقیقه`}
                  icon="fas fa-phone"
                  color="green"
                  delay={0.3}
                />
                <AnimatedMetricCard
                  title="کارهای تکمیل شده"
                  value={mockMetrics.overallActivity.tasksCompleted}
                  subtitle={`از ${mockMetrics.overallActivity.tasksCreated} کار ایجاد شده`}
                  icon="fas fa-check-circle"
                  color="purple"
                  delay={0.4}
                />
                <AnimatedMetricCard
                  title="مشکلات حل شده"
                  value={mockMetrics.interactionOutcomes.issuesResolved}
                  subtitle={`نرخ حل: ${Math.round(resolutionRate)}%`}
                  icon="fas fa-tools"
                  color="orange"
                  delay={0.5}
                />
              </div>

              {/* Performance Indicators */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <AnimatedCard delay={0.6}>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">نرخ تکمیل کارها</h3>
                    <ProgressRing progress={completionRate} color="rgb(99, 102, 241)" />
                    <p className="text-sm text-gray-600 mt-3">
                      {mockMetrics.overallActivity.tasksCompleted} از {mockMetrics.overallActivity.tasksCreated} کار
                    </p>
                  </div>
                </AnimatedCard>

                <AnimatedCard delay={0.7}>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">نرخ حل مشکل</h3>
                    <ProgressRing progress={resolutionRate} color="rgb(16, 185, 129)" />
                    <p className="text-sm text-gray-600 mt-3">
                      {mockMetrics.interactionOutcomes.issuesResolved} از {mockMetrics.overallActivity.totalInteractions} تعامل
                    </p>
                  </div>
                </AnimatedCard>

                <AnimatedCard delay={0.8}>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">رضایت مشتریان</h3>
                    <ProgressRing progress={satisfactionScore} color="rgb(245, 158, 11)" />
                    <div className="mt-3">
                      <span className={`text-lg font-bold ${
                        mockMetrics.sentimentAnalysis.overallSentiment === 'positive' ? 'text-green-600' :
                        mockMetrics.sentimentAnalysis.overallSentiment === 'negative' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {mockMetrics.sentimentAnalysis.overallSentiment === 'positive' ? '😊 مثبت' :
                         mockMetrics.sentimentAnalysis.overallSentiment === 'negative' ? '😟 منفی' : '😐 خنثی'}
                      </span>
                    </div>
                  </div>
                </AnimatedCard>
              </div>

              {/* Topics Analysis */}
              <AnimatedCard delay={0.9}>
                <h3 className="text-xl font-semibold text-gray-800 mb-6">موضوعات پربحث</h3>
                <div className="space-y-4">
                  {mockMetrics.commonTopics.map((topic, index) => (
                    <motion.div 
                      key={index}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1 + index * 0.1 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-800">{topic.topic}</span>
                          <motion.span 
                            className="text-2xl"
                            animate={{ rotate: topic.trend === 'increasing' ? [0, 5, 0] : [0, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            {topic.trend === 'increasing' ? '📈' : topic.trend === 'decreasing' ? '📉' : '➡️'}
                          </motion.span>
                        </div>
                        <div className="flex items-center mt-2 gap-4">
                          <span className="text-sm text-gray-600 persian-nums">
                            {topic.frequency.toLocaleString('fa-IR')} مورد
                          </span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${
                                topic.trend === 'increasing' ? 'bg-gradient-to-r from-red-400 to-red-500' :
                                topic.trend === 'decreasing' ? 'bg-gradient-to-r from-green-400 to-green-500' :
                                'bg-gradient-to-r from-blue-400 to-blue-500'
                              }`}
                              initial={{ width: 0 }}
                              animate={{ width: `${(topic.frequency / mockMetrics.commonTopics[0].frequency) * 100}%` }}
                              transition={{ duration: 1.5, delay: 1.2 + index * 0.1 }}
                            />
                          </div>
                        </div>
                      </div>
                      <motion.div 
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          topic.trend === 'increasing' ? 'bg-red-100 text-red-700' :
                          topic.trend === 'decreasing' ? 'bg-green-100 text-green-700' :
                          'bg-blue-100 text-blue-700'
                        }`}
                        whileHover={{ scale: 1.1 }}
                      >
                        {topic.trend === 'increasing' ? 'افزایشی' : 
                         topic.trend === 'decreasing' ? 'کاهشی' : 'ثابت'}
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
              </AnimatedCard>
            </motion.div>
          ) : (
            <motion.div
              key="ai"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
            >
              {aiLoading ? (
                <AnimatedCard>
                  <div className="text-center py-12">
                    <motion.div
                      className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <p className="text-gray-600">در حال تحلیل هوشمند داده‌ها...</p>
                  </div>
                </AnimatedCard>
              ) : (
                <AnimatedCard>
                  <div className="text-center py-12">
                    <motion.i 
                      className="fas fa-brain text-6xl text-purple-500 mb-4"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">تحلیل هوشمند</h3>
                    <p className="text-gray-600 mb-6">
                      برای فعال‌سازی تحلیل هوشمند، لطفاً کلیدهای API مربوط به Vertex AI را پیکربندی کنید.
                    </p>
                    <motion.button
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      پیکربندی API
                    </motion.button>
                  </div>
                </AnimatedCard>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}