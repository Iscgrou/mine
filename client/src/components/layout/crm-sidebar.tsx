import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useState } from "react";

// Helper to get the correct base path for CRM
const getCrmBasePath = () => {
  const currentPath = window.location.pathname;
  if (currentPath.startsWith('/csdfjkjfoascivomrm867945')) {
    return '/csdfjkjfoascivomrm867945';
  }
  return ''; // fallback for development
};

const crmNavigationItems = [
  {
    name: "داشبورد CRM",
    href: "/dashboard",
    icon: "fas fa-tachometer-alt",
  },
  {
    name: "مشتریان",
    href: "/customers",
    icon: "fas fa-users",
  },
  {
    name: "تیکت‌ها",
    href: "/tickets", 
    icon: "fas fa-ticket-alt",
  },
  {
    name: "آماده‌سازی هوشمند تماس",
    href: "/call-preparation",
    icon: "fas fa-brain",
  },
  {
    name: "یادداشت‌های صوتی",
    href: "/voice-notes",
    icon: "fas fa-microphone",
  },
  {
    name: "پیگیری‌ها",
    href: "/followups",
    icon: "fas fa-tasks",
  },
  {
    name: "گزارشات CRM",
    href: "/reports",
    icon: "fas fa-chart-line",
  },
];

export default function CrmSidebar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const basePath = getCrmBasePath();

  return (
    <>
      {/* Toggle Button - Always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 lg:hidden bg-white shadow-lg rounded-md p-2 border border-gray-200"
      >
        <i className={cn("fas transition-transform duration-200", 
          isOpen ? "fa-times" : "fa-bars"
        )}></i>
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed right-0 top-0 h-full bg-white shadow-lg border-l border-gray-200 z-40 transition-transform duration-300 ease-in-out",
        "w-72 lg:w-72 md:w-64 sm:w-56", // Responsive width for different screen sizes
        isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center ml-3 flex-shrink-0">
              <i className="fas fa-headset text-white text-lg"></i>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">مرکز CRM</h1>
              <p className="text-sm text-gray-500 truncate">MarFanet Customer Relations</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3 pb-20">
          <div className="space-y-1">
            {crmNavigationItems.map((item) => {
              const fullHref = basePath + item.href;
              const isActive = location === fullHref || (item.href === "/dashboard" && (location === basePath || location === basePath + "/"));
              
              return (
                <Link key={item.href} href={fullHref}>
                  <span
                    className={cn(
                      "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200",
                      isActive
                        ? "bg-blue-600 bg-opacity-10 text-blue-600"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                    onClick={() => setIsOpen(false)} // Close sidebar on navigation
                  >
                    <i className={cn(item.icon, "ml-3 text-base flex-shrink-0 w-5 flex justify-center", 
                      isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-500"
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
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center ml-3 flex-shrink-0">
              <i className="fas fa-user text-white text-sm"></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">تیم CRM</p>
              <p className="text-xs text-gray-500 truncate">آنلاین</p>
            </div>
            <button className="text-gray-400 hover:text-gray-600 flex-shrink-0">
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Main content spacing */}
      <div className="lg:mr-72 md:mr-64 sm:mr-56 w-full">
        {/* This ensures content doesn't go under the sidebar on desktop */}
      </div>
    </>
  );
}