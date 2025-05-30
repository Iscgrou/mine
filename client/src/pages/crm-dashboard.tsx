import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { formatCurrency, formatPersianDate } from "@/lib/persian-utils";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { 
  Users, Phone, Clock, MessageSquare, CheckCircle, 
  Target, TrendingUp, Search, Filter, ChevronRight,
  BarChart3, PieChart, Activity, Calendar,
  Star, ThumbsUp, Zap, Award, Plus, Bell, FileText
} from "lucide-react";
import { NotificationCenter } from "@/components/notification-center";
import { DailyWorkLog } from "@/components/daily-work-log";

interface CrmStats {
  totalCustomers: number;
  activeTickets: number;
  todayInteractions: number;
  pendingFollowups: number;
}

interface Customer {
  id: number;
  fullName: string;
  phoneNumber: string;
  email?: string;
  lastContact: string;
  status: 'active' | 'inactive' | 'prospect';
  totalValue: string;
}

interface Ticket {
  id: number;
  title: string;
  customer: string;
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  assignedTo?: string;
}

// Animated Stats Card Component
const AnimatedStatsCard = ({ title, value, change, icon: Icon, delay = 0 }: {
  title: string;
  value: string | number;
  change?: { value: number; type: 'increase' | 'decrease' };
  icon: any;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    whileHover={{ y: -5, scale: 1.02 }}
    className="group"
  >
    <Card className="relative overflow-hidden bg-gradient-to-br from-white to-blue-50/30 border-blue-100 hover:border-blue-200 transition-all duration-300 hover:shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent"></div>
      <CardContent className="p-6 relative">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <motion.p 
              className="text-3xl font-bold text-gray-900 persian-nums"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: delay + 0.3 }}
            >
              {typeof value === 'string' ? value : value.toLocaleString('fa-IR')}
            </motion.p>
            {change && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + 0.5 }}
                className={cn(
                  "flex items-center text-sm mt-2",
                  change.type === 'increase' ? "text-green-600" : "text-red-600"
                )}
              >
                <TrendingUp className={cn("w-4 h-4 ml-1", 
                  change.type === 'decrease' && "rotate-180"
                )} />
                <span className="persian-nums">
                  {change.value > 0 ? '+' : ''}{change.value}%
                </span>
                <span className="mr-1">نسبت به ماه گذشته</span>
              </motion.div>
            )}
          </div>
          <motion.div 
            className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl group-hover:from-blue-600 group-hover:to-blue-700 transition-all duration-300"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <Icon className="w-6 h-6 text-white" />
          </motion.div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

// Quick Actions Component
const QuickActions = ({ onNewTicket, onCallCustomer, onCreateNote, onViewReports }: {
  onNewTicket: () => void;
  onCallCustomer: () => void;
  onCreateNote: () => void;
  onViewReports: () => void;
}) => {
  const actions = [
    { label: "ایجاد تیکت جدید", icon: MessageSquare, color: "blue", onClick: onNewTicket },
    { label: "تماس با مشتری", icon: Phone, color: "green", onClick: onCallCustomer },
    { label: "ثبت یادداشت", icon: FileText, color: "orange", onClick: onCreateNote },
    { label: "مشاهده گزارشات", icon: BarChart3, color: "purple", onClick: onViewReports }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <Card className="bg-gradient-to-br from-white to-purple-50/30 border-purple-100">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 ml-2 text-purple-600" />
            اقدامات سریع
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {actions.map((action, idx) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + idx * 0.1 }}
              whileHover={{ x: 5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={action.onClick}
              className="w-full flex items-center p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 group hover:bg-blue-50"
            >
              <action.icon className="w-4 h-4 ml-3 text-blue-600 group-hover:text-blue-700" />
              <span className="text-gray-700 group-hover:text-gray-900">{action.label}</span>
              <ChevronRight className="w-4 h-4 mr-auto text-gray-400 group-hover:text-gray-600" />
            </motion.button>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function CrmDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [, setLocation] = useLocation();

  // Fetch real data from API
  const { data: stats } = useQuery({
    queryKey: ['/api/crm/stats'],
    queryFn: () => fetch('/api/crm/stats').then(res => res.json()),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Button handlers
  const handleNewCustomer = () => {
    setLocation('/crm/customers');
  };

  const handleNewTicket = () => {
    setLocation('/crm/tickets');
  };

  const handleCallCustomer = () => {
    setLocation('/crm/call-preparation');
  };

  const handleCreateNote = () => {
    setLocation('/crm/voice-notes');
  };

  const handleViewReports = () => {
    setLocation('/analytics');
  };

  const crmStats: CrmStats = stats || {
    totalCustomers: 245,
    activeTickets: 18,
    todayInteractions: 34,
    pendingFollowups: 12
  };

  const recentCustomers: Customer[] = [
    {
      id: 1,
      fullName: "احمد رضایی",
      phoneNumber: "09121234567",
      email: "ahmad@example.com",
      lastContact: "2024-01-20",
      status: "active",
      totalValue: "12500000"
    },
    {
      id: 2,
      fullName: "فاطمه محمدی",
      phoneNumber: "09129876543",
      lastContact: "2024-01-19",
      status: "prospect",
      totalValue: "0"
    },
    {
      id: 3,
      fullName: "علی حسینی",
      phoneNumber: "09123456789",
      email: "ali@example.com",
      lastContact: "2024-01-18",
      status: "active",
      totalValue: "8750000"
    }
  ];

  const activeTickets: Ticket[] = [
    {
      id: 1,
      title: "مشکل در اتصال اینترنت",
      customer: "احمد رضایی",
      priority: "high",
      status: "open",
      createdAt: "2024-01-20",
      assignedTo: "سارا احمدی"
    },
    {
      id: 2,
      title: "درخواست تغییر پلن",
      customer: "فاطمه محمدی",
      priority: "medium",
      status: "in_progress",
      createdAt: "2024-01-19"
    },
    {
      id: 3,
      title: "سوال در مورد صورتحساب",
      customer: "علی حسینی",
      priority: "low",
      status: "open",
      createdAt: "2024-01-18"
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCustomerStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'prospect': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="page-wrapper bg-gradient-to-br from-blue-50/50 via-white to-purple-50/30 min-h-screen">
      <div className="dashboard-container ml-0 md:ml-[8%] lg:ml-[10%] max-w-full md:max-w-[90%] lg:max-w-[85%]">
      {/* Animated Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6"
      >
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div>
            <motion.h1 
              className="text-3xl font-bold text-gray-900 mb-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              مرکز CRM
            </motion.h1>
            <motion.p 
              className="text-gray-600"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              مدیریت هوشمند ارتباط با مشتریان
            </motion.p>
          </div>
          <motion.div 
            className="flex space-x-3 space-x-reverse"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={handleNewCustomer}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
              >
                <Users className="w-4 h-4 ml-2" />
                مشتری جدید
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={handleNewTicket}
                variant="outline" 
                className="border-blue-200 hover:border-blue-300 hover:bg-blue-50"
              >
                <MessageSquare className="w-4 h-4 ml-2" />
                تیکت جدید
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Animated Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <AnimatedStatsCard
          title="کل مشتریان"
          value={crmStats.totalCustomers}
          change={{ value: 12, type: 'increase' }}
          icon={Users}
          delay={0}
        />
        <AnimatedStatsCard
          title="تیکت‌های فعال"
          value={crmStats.activeTickets}
          change={{ value: -4, type: 'decrease' }}
          icon={MessageSquare}
          delay={0.1}
        />
        <AnimatedStatsCard
          title="تعاملات امروز"
          value={crmStats.todayInteractions}
          change={{ value: 8, type: 'increase' }}
          icon={Phone}
          delay={0.2}
        />
        <AnimatedStatsCard
          title="پیگیری‌های معلق"
          value={crmStats.pendingFollowups}
          change={{ value: 2, type: 'increase' }}
          icon={Clock}
          delay={0.3}
        />
      </div>

      {/* Reorganized Main Content - Single Column Layout */}
      <div className="space-y-6 max-w-full">
        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card className="bg-gradient-to-r from-white to-gray-50/50">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="جستجوی مشتریان..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" className="border-gray-200 hover:border-gray-300">
                    <Filter className="w-4 h-4 ml-2" />
                    فیلتر
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Customers Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 ml-2 text-blue-600" />
                مشتریان اخیر
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نام</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تلفن</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وضعیت</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ارزش کل</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">آخرین تماس</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentCustomers.map((customer, idx) => (
                      <motion.tr
                        key={customer.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + idx * 0.1 }}
                        whileHover={{ backgroundColor: "#f8fafc" }}
                        className="hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <motion.div 
                              className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center"
                              whileHover={{ scale: 1.1 }}
                            >
                              <span className="text-white text-sm font-medium">
                                {customer.fullName.charAt(0)}
                              </span>
                            </motion.div>
                            <div className="mr-3">
                              <div className="text-sm font-medium text-gray-900">{customer.fullName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 persian-nums">{customer.phoneNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="secondary" className={getCustomerStatusColor(customer.status)}>
                            {customer.status === 'active' ? 'فعال' : customer.status === 'inactive' ? 'غیرفعال' : 'احتمالی'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 persian-nums">{customer.totalValue}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPersianDate(customer.lastContact)}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Relocated Sections: Quick Actions & Notification Center Below Recent Customers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions - Now Below Recent Customers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <QuickActions 
              onNewTicket={handleNewTicket}
              onCallCustomer={handleCallCustomer}
              onCreateNote={handleCreateNote}
              onViewReports={handleViewReports}
            />
          </motion.div>

          {/* Notification Center - Now Below Recent Customers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
          >
            <Card className="bg-gradient-to-br from-white to-green-50/30 border-green-100">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 ml-2 text-green-600" />
                  مرکز اطلاعیه‌ها
                </CardTitle>
              </CardHeader>
              <CardContent>
                <NotificationCenter />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Additional CRM Analytics Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <Card className="bg-gradient-to-br from-white to-indigo-50/30 border-indigo-100">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 ml-2 text-indigo-600" />
                ثبت کار روزانه
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DailyWorkLog />
            </CardContent>
          </Card>
        </motion.div>

          {/* Active Tickets */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
          >
            <Card className="bg-gradient-to-br from-white to-orange-50/30 border-orange-100">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="w-5 h-5 ml-2 text-orange-600" />
                  تیکت‌های فعال
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeTickets.map((ticket, idx) => (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 + idx * 0.1 }}
                    whileHover={{ x: 5, scale: 1.02 }}
                    className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{ticket.title}</h4>
                      <Badge variant="secondary" className={getPriorityColor(ticket.priority)}>
                        {ticket.priority === 'high' ? 'بالا' : ticket.priority === 'medium' ? 'متوسط' : 'پایین'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{ticket.customer}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className={getStatusColor(ticket.status)}>
                        {ticket.status === 'open' ? 'باز' : ticket.status === 'in_progress' ? 'در حال بررسی' : 'حل شده'}
                      </Badge>
                      <span className="text-xs text-gray-500">{formatPersianDate(ticket.createdAt)}</span>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}