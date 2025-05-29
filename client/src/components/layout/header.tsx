import { useMemo } from "react";
import { useLocation } from "wouter";

const pageNames: Record<string, string> = {
  "dashboard": "داشبورد",
  "representatives": "مدیریت نمایندگان",
  "invoices": "صورتحساب‌ها",
  "analytics": "مرکز تحلیل و گزارش",
  "import": "آپلود فایل ODS",
  "payments": "پیگیری پرداخت‌ها",
  "backup": "پشتیبان‌گیری",
  "settings": "تنظیمات",
  // CRM specific pages
  "customers": "مدیریت مشتریان",
  "tickets": "مدیریت تیکت‌ها",
  "followups": "پیگیری‌ها",
  "reports": "گزارشات CRM",
};

// Helper function to extract page name from path
function getPageFromPath(path: string): string {
  // Remove secret path prefixes
  let cleanPath = path
    .replace(/^\/ciwomplefoadm867945/, '') // Admin secret path
    .replace(/^\/csdfjkjfoascivomrm867945/, ''); // CRM secret path
  
  // Remove leading slash
  cleanPath = cleanPath.replace(/^\//, '');
  
  // If empty or root, it's dashboard
  if (!cleanPath || cleanPath === '/') {
    return 'dashboard';
  }
  
  return cleanPath;
}

export default function Header() {
  const [location] = useLocation();
  
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
          {/* Notification Bell */}
          <button className="relative p-2 text-orange-500 hover:text-orange-600">
            <i className="fas fa-bell text-lg"></i>
            <span className="absolute top-0 left-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
              ۳
            </span>
          </button>
          
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
