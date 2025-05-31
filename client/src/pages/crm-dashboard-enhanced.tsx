import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatPersianDate, formatPersianNumber } from "@/lib/persian-utils";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { 
  Users, Phone, Clock, MessageSquare, CheckCircle, 
  Target, TrendingUp, Search, Filter, ChevronRight,
  BarChart3, PieChart, Activity, Calendar,
  Star, ThumbsUp, Zap, Award, Plus, Bell, FileText
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

interface CrmStats {
  totalCustomers: number;
  activeTickets: number;
  todayInteractions: number;
  pendingFollowups: number;
  monthlyPerformance: {
    callsCompleted: number;
    successRate: number;
    customerSatisfaction: number;
    targetProgress: number;
  };
  weeklyActivity: {
    day: string;
    calls: number;
    tickets: number;
    followups: number;
  }[];
  performanceMetrics: {
    callEfficiency: number;
    responseTime: number;
    resolutionRate: number;
    customerRetention: number;
  };
}

interface Customer {
  id: number;
  fullName: string;
  phoneNumber: string;
  email?: string;
  lastContact: string;
  status: 'active' | 'inactive' | 'prospect';
  totalValue: string;
  priority: 'high' | 'medium' | 'low';
  nextAction?: string;
  satisfaction?: number;
}

interface Ticket {
  id: number;
  title: string;
  customer: string;
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  assignedTo?: string;
  estimatedTime?: string;
  category: string;
}

interface DailyTask {
  id: number;
  title: string;
  type: 'call' | 'followup' | 'meeting' | 'email';
  customer: string;
  priority: 'high' | 'medium' | 'low';
  dueTime: string;
  completed: boolean;
}

// Enhanced Stats Card Component
const EnhancedStatsCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  delay = 0,
  color = "blue",
  trend = "up"
}: {
  title: string;
  value: string | number;
  change?: string;
  icon: any;
  delay?: number;
  color?: string;
  trend?: "up" | "down" | "neutral";
}) => {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600 border-blue-200",
    green: "bg-green-100 text-green-600 border-green-200",
    orange: "bg-orange-100 text-orange-600 border-orange-200",
    purple: "bg-purple-100 text-purple-600 border-purple-200",
    red: "bg-red-100 text-red-600 border-red-200"
  };

  const trendColors = {
    up: "text-green-600",
    down: "text-red-600",
    neutral: "text-gray-600"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold mt-2">{formatPersianNumber(value.toString())}</p>
              {change && (
                <p className={`text-xs mt-1 flex items-center gap-1 ${trendColors[trend]}`}>
                  <i className={`fas fa-arrow-${trend === 'up' ? 'up' : trend === 'down' ? 'down' : 'right'}`}></i>
                  {change} نسبت به هفته گذشته
                </p>
              )}
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClasses[color]}`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Quick Action Button Component
const QuickActionButton = ({ 
  icon: Icon, 
  title, 
  description, 
  onClick,
  color = "blue"
}: {
  icon: any;
  title: string;
  description: string;
  onClick: () => void;
  color?: string;
}) => {
  const colorClasses = {
    blue: "hover:bg-blue-50 border-blue-200",
    green: "hover:bg-green-50 border-green-200",
    orange: "hover:bg-orange-50 border-orange-200",
    purple: "hover:bg-purple-50 border-purple-200"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full p-4 text-right border rounded-lg transition-colors duration-200 ${colorClasses[color]}`}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-gray-600" />
        <div>
          <h3 className="font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </motion.button>
  );
};

export default function CrmDashboardEnhanced() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTimeRange, setSelectedTimeRange] = useState('today');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, navigate] = useLocation();

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Enhanced data queries
  const { data: crmStats, isLoading: statsLoading } = useQuery<CrmStats>({
    queryKey: ['/api/crm/stats', selectedTimeRange],
    refetchInterval: 30000,
  });

  const { data: recentCustomers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ['/api/crm/customers/recent'],
    refetchInterval: 60000,
  });

  const { data: activeTickets, isLoading: ticketsLoading } = useQuery<Ticket[]>({
    queryKey: ['/api/crm/tickets/active'],
    refetchInterval: 60000,
  });

  const { data: dailyTasks, isLoading: tasksLoading } = useQuery<DailyTask[]>({
    queryKey: ['/api/crm/tasks/today'],
    refetchInterval: 30000,
  });

  // Sample data for demonstration (replace with real API data)
  const sampleWeeklyActivity = [
    { day: 'شنبه', calls: 25, tickets: 8, followups: 12 },
    { day: 'یکشنبه', calls: 30, tickets: 6, followups: 15 },
    { day: 'دوشنبه', calls: 28, tickets: 10, followups: 9 },
    { day: 'سه‌شنبه', calls: 35, tickets: 12, followups: 18 },
    { day: 'چهارشنبه', calls: 32, tickets: 7, followups: 14 },
    { day: 'پنج‌شنبه', calls: 29, tickets: 9, followups: 11 },
    { day: 'جمعه', calls: 22, tickets: 5, followups: 8 }
  ];

  const samplePerformanceData = [
    { name: 'کارایی تماس', value: 87, color: '#3b82f6' },
    { name: 'زمان پاسخ', value: 92, color: '#10b981' },
    { name: 'نرخ حل مسئله', value: 78, color: '#f59e0b' },
    { name: 'حفظ مشتری', value: 95, color: '#8b5cf6' }
  ];

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'new_call':
        navigate('/crm/call-preparation');
        break;
      case 'new_ticket':
        navigate('/crm/tickets');
        break;
      case 'view_customers':
        navigate('/crm/customers');
        break;
      case 'ai_insights':
        navigate('/crm/crt-performance');
        break;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    const labels = {
      high: 'بحرانی',
      medium: 'متوسط',
      low: 'عادی'
    };
    return (
      <Badge className={colors[priority as keyof typeof colors]}>
        {labels[priority as keyof typeof labels]}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      open: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-orange-100 text-orange-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    const labels = {
      open: 'باز',
      in_progress: 'در حال پردازش',
      resolved: 'حل شده',
      closed: 'بسته'
    };
    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  if (statsLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Enhanced Header */}
      <div className="flex justify-between items-start">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold text-gray-900"
          >
            داشبورد CRM
          </motion.h1>
          <p className="text-gray-600 mt-1">
            {currentTime.toLocaleDateString('fa-IR', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long', 
              day: 'numeric'
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
          >
            <option value="today">امروز</option>
            <option value="week">این هفته</option>
            <option value="month">این ماه</option>
          </select>
          <Button variant="outline" size="sm">
            <Bell className="w-4 h-4 ml-2" />
            اعلان‌ها
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <EnhancedStatsCard
          title="مشتریان فعال"
          value={crmStats?.totalCustomers || 158}
          change="+12"
          icon={Users}
          color="blue"
          trend="up"
          delay={0}
        />
        <EnhancedStatsCard
          title="تیکت‌های باز"
          value={crmStats?.activeTickets || 23}
          change="-5"
          icon={MessageSquare}
          color="orange"
          trend="down"
          delay={0.1}
        />
        <EnhancedStatsCard
          title="تعاملات امروز"
          value={crmStats?.todayInteractions || 47}
          change="+8"
          icon={Activity}
          color="green"
          trend="up"
          delay={0.2}
        />
        <EnhancedStatsCard
          title="پیگیری‌های معوق"
          value={crmStats?.pendingFollowups || 12}
          change="+3"
          icon={Clock}
          color="red"
          trend="up"
          delay={0.3}
        />
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Activity Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              فعالیت هفتگی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sampleWeeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    const labels = { calls: 'تماس', tickets: 'تیکت', followups: 'پیگیری' };
                    return [formatPersianNumber(value), labels[name as keyof typeof labels]];
                  }}
                />
                <Bar dataKey="calls" fill="#3b82f6" name="calls" />
                <Bar dataKey="tickets" fill="#f59e0b" name="tickets" />
                <Bar dataKey="followups" fill="#10b981" name="followups" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              شاخص‌های عملکرد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {samplePerformanceData.map((metric, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{metric.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: metric.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${metric.value}%` }}
                        transition={{ delay: index * 0.2, duration: 1 }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-600">
                      {formatPersianNumber(metric.value)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            اقدامات سریع
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionButton
              icon={Phone}
              title="تماس جدید"
              description="آماده‌سازی هوشمند تماس"
              onClick={() => handleQuickAction('new_call')}
              color="blue"
            />
            <QuickActionButton
              icon={Plus}
              title="تیکت جدید"
              description="ایجاد تیکت پشتیبانی"
              onClick={() => handleQuickAction('new_ticket')}
              color="green"
            />
            <QuickActionButton
              icon={Users}
              title="مدیریت مشتریان"
              description="مشاهده و ویرایش مشتریان"
              onClick={() => handleQuickAction('view_customers')}
              color="purple"
            />
            <QuickActionButton
              icon={BarChart3}
              title="بینش هوش مصنوعی"
              description="تحلیل عملکرد CRT"
              onClick={() => handleQuickAction('ai_insights')}
              color="orange"
            />
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities and Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                مشتریان اخیر
              </span>
              <Button variant="link" size="sm" onClick={() => navigate('/crm/customers')}>
                مشاهده همه
                <ChevronRight className="w-4 h-4 mr-1" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(recentCustomers || [
                { id: 1, fullName: 'احمد محمدی', phoneNumber: '09123456789', status: 'active', totalValue: '2,500,000', lastContact: '2025-01-31T10:30:00Z', priority: 'high' },
                { id: 2, fullName: 'فاطمه احمدی', phoneNumber: '09187654321', status: 'prospect', totalValue: '1,200,000', lastContact: '2025-01-30T14:15:00Z', priority: 'medium' },
                { id: 3, fullName: 'علی رضایی', phoneNumber: '09151234567', status: 'active', totalValue: '850,000', lastContact: '2025-01-29T16:45:00Z', priority: 'low' }
              ]).slice(0, 5).map((customer, index) => (
                <motion.div
                  key={customer.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate(`/crm/customers/${customer.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {customer.fullName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{customer.fullName}</p>
                      <p className="text-sm text-gray-600">{customer.phoneNumber}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    {getPriorityBadge(customer.priority)}
                    <p className="text-sm text-gray-600 mt-1">
                      {formatCurrency(customer.totalValue)} تومان
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Tickets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-orange-600" />
                تیکت‌های فعال
              </span>
              <Button variant="link" size="sm" onClick={() => navigate('/crm/tickets')}>
                مشاهده همه
                <ChevronRight className="w-4 h-4 mr-1" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(activeTickets || [
                { id: 1, title: 'مشکل اتصال سرویس', customer: 'احمد محمدی', priority: 'high', status: 'open', createdAt: '2025-01-31T09:15:00Z', category: 'فنی' },
                { id: 2, title: 'درخواست تغییر پلن', customer: 'فاطمه احمدی', priority: 'medium', status: 'in_progress', createdAt: '2025-01-30T11:30:00Z', category: 'فروش' },
                { id: 3, title: 'سوال درباره فاکتور', customer: 'علی رضایی', priority: 'low', status: 'open', createdAt: '2025-01-29T13:45:00Z', category: 'مالی' }
              ]).slice(0, 5).map((ticket, index) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate(`/crm/tickets/${ticket.id}`)}
                >
                  <div>
                    <p className="font-medium">{ticket.title}</p>
                    <p className="text-sm text-gray-600">{ticket.customer} • {ticket.category}</p>
                  </div>
                  <div className="text-left space-y-1">
                    {getStatusBadge(ticket.status)}
                    {getPriorityBadge(ticket.priority)}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            وظایف امروز
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(dailyTasks || [
              { id: 1, title: 'تماس پیگیری با احمد محمدی', type: 'call', customer: 'احمد محمدی', priority: 'high', dueTime: '10:30', completed: false },
              { id: 2, title: 'ارسال ایمیل پیشنهاد به فاطمه احمدی', type: 'email', customer: 'فاطمه احمدی', priority: 'medium', dueTime: '14:00', completed: true },
              { id: 3, title: 'جلسه با تیم فروش', type: 'meeting', customer: 'تیم داخلی', priority: 'medium', dueTime: '16:00', completed: false }
            ]).map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 border rounded-lg ${task.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => {}}
                      className="mt-1 rounded"
                    />
                    <div>
                      <p className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                        {task.title}
                      </p>
                      <p className="text-sm text-gray-600">{task.customer}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        <Clock className="w-3 h-3 inline ml-1" />
                        {task.dueTime}
                      </p>
                    </div>
                  </div>
                  {getPriorityBadge(task.priority)}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}