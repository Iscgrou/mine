import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    name: "داشبورد",
    href: "/dashboard",
    icon: "fas fa-tachometer-alt",
  },
  {
    name: "مدیریت نمایندگان",
    href: "/representatives",
    icon: "fas fa-users",
  },
  {
    name: "صورتحساب‌ها",
    href: "/invoices", 
    icon: "fas fa-file-invoice",
  },
  {
    name: "مرکز تحلیل و گزارش",
    href: "/analytics",
    icon: "fas fa-chart-bar",
  },
  {
    name: "آپلود فایل ODS",
    href: "/import",
    icon: "fas fa-upload",
  },
  {
    name: "پیگیری پرداخت‌ها",
    href: "/payments",
    icon: "fas fa-credit-card",
  },
  {
    name: "پشتیبان‌گیری",
    href: "/backup",
    icon: "fas fa-cloud-upload-alt",
  },
  {
    name: "تنظیمات",
    href: "/settings",
    icon: "fas fa-cog",
  },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-64 bg-white shadow-lg border-l border-gray-200">
      {/* Logo/Header */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
        <div className="flex items-center space-x-reverse space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <i className="fas fa-chart-line text-white text-sm"></i>
          </div>
          <h1 className="text-xl font-bold text-gray-900">مارفانت</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-3">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = location === item.href || (item.href === "/dashboard" && location === "/");
            
            return (
              <Link key={item.href} href={item.href}>
                <span
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200",
                    isActive
                      ? "bg-primary bg-opacity-10 text-primary"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <i className={cn(item.icon, "ml-3 text-lg", 
                    isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-500"
                  )}></i>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center ml-3">
            <i className="fas fa-user text-gray-600 text-sm"></i>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">مدیر سیستم</p>
            <p className="text-xs text-gray-500 truncate">آنلاین</p>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
