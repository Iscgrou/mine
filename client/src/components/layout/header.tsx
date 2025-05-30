import { useMemo } from "react";
import { useLocation } from "wouter";
import NotificationCenter from "@/components/notification-center";
import { useNotifications } from "@/hooks/use-notifications";

const pageNames: Record<string, string> = {
  "dashboard": "داشبورد",
  "representatives": "مدیریت نمایندگان",
  "invoices": "صورتحساب‌ها",
  "invoice-batches": "دسته‌بندی صورتحساب‌ها",
  "analytics": "مرکز تحلیل و گزارش",
  "import": "آپلود فایل ODS",
  "payments": "پیگیری پرداخت‌ها",
  "backup": "پشتیبان‌گیری",
  "settings": "تنظیمات",
  "aegis": "سیستم نظارت آیگیس",
  "aegis-test": "تست سیستم آیگیس",
  "google-cloud-setup": "پیکربندی گوگل کلود",
  // CRM specific pages
  "customers": "مدیریت مشتریان",
  "tickets": "مدیریت تیکت‌ها",
  "call-preparation": "آماده‌سازی هوشمند تماس",
  "voice-notes": "یادداشت‌های صوتی",
  "followups": "پیگیری‌ها",
  "reports": "گزارشات CRM",
};

// Helper function to extract page name from path
function getPageFromPath(path: string): string {
  // Remove new clean path prefixes
  let cleanPath = path
    .replace(/^\/admin/, '') // Admin clean path
    .replace(/^\/crm/, ''); // CRM clean path
  
  // Remove leading slash
  cleanPath = cleanPath.replace(/^\//, '');
  
  // If empty or root, it's dashboard
  if (!cleanPath || cleanPath === '/' || cleanPath === '') {
    return 'dashboard';
  }
  
  return cleanPath;
}

export default function Header() {
  const [location] = useLocation();
  const { notifications, markAsRead, markAllAsRead, dismiss } = useNotifications();
  
  const currentPageTitle = useMemo(() => {
    const pageName = getPageFromPath(location);
    return pageNames[pageName] || "صفحه ناشناخته";
  }, [location]);
  
  const currentDate = useMemo(() => {
    const now = new Date();
    const persianDate = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now);
    return persianDate;
  }, []);

  const handleNotificationAction = (notification: any) => {
    // Handle notification action clicks - navigate to relevant page
    if (notification.relatedEntity) {
      switch (notification.relatedEntity.type) {
        case 'invoice':
          window.location.href = '/admin/invoices';
          break;
        case 'representative':
          window.location.href = '/admin/representatives';
          break;
        case 'task':
          // Navigate to task management or dashboard
          break;
        default:
          break;
      }
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center text-sm text-gray-500">
          <i className="fas fa-calendar-alt ml-1.5 h-4 w-4 text-gray-400"></i>
          <span className="persian-nums">{currentDate}</span>
        </div>
        
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <h2 className="text-2xl font-bold leading-7 text-gray-900">{currentPageTitle}</h2>
        </div>
        
        <div className="flex items-center space-x-reverse space-x-4">
          {/* System Status */}
          <div className="flex items-center text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full ml-2"></div>
            <span>سیستم آنلاین</span>
          </div>
        </div>
      </div>
    </header>
  );
}
