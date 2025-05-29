import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useState } from "react";

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
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle Button - Always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 p-3 bg-orange-500 text-white rounded-lg shadow-lg hover:bg-orange-600 transition-colors"
        title={isOpen ? "إخفاء القائمة" : "إظهار القائمة"}
      >
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-bars'} text-lg`}></i>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Hidden by default */}
      <div className={cn(
        "fixed inset-y-0 right-0 z-50 bg-white shadow-xl border-l border-gray-200 transition-all duration-300 ease-in-out",
        "w-80 sm:w-72 md:w-64",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Logo/Header */}
        <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
          <div className="flex items-center space-x-reverse space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <i className="fas fa-chart-line text-white text-sm"></i>
            </div>
            <h1 className="text-lg xl:text-xl font-bold text-gray-900 truncate">مارفانت</h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3 pb-20">
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
                    onClick={() => setIsOpen(false)} // Close sidebar on navigation
                  >
                    <i className={cn(item.icon, "ml-3 text-base flex-shrink-0 w-5 flex justify-center", 
                      isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-500"
                    )}></i>
                    <span className="truncate">{item.name}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center ml-3 flex-shrink-0">
              <i className="fas fa-user text-gray-600 text-sm"></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">مدیر سیستم</p>
              <p className="text-xs text-gray-500 truncate">آنلاین</p>
            </div>
            <button className="text-gray-400 hover:text-gray-600 flex-shrink-0">
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
