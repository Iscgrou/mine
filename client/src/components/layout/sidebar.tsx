import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/SidebarContext";

// Helper to get the correct base path based on current location
const getBasePath = () => {
  const currentPath = window.location.pathname;
  if (currentPath.startsWith('/admin')) {
    return '/admin';
  }
  return '/admin'; // default to admin
};

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
    name: "مدیریت همکاران فروش",
    href: "/collaborators",
    icon: "fas fa-handshake",
  },
  {
    name: "صورتحساب‌ها",
    href: "/invoices", 
    icon: "fas fa-file-invoice",
  },
  {
    name: "دسته‌بندی صورتحساب‌ها",
    href: "/invoice-batches",
    icon: "fas fa-layer-group",
  },
  {
    name: "مرکز تحلیل و گزارش",
    href: "/analytics",
    icon: "fas fa-chart-bar",
  },
  {
    name: "نظارت عملکرد CRT",
    href: "/crt-performance",
    icon: "fas fa-analytics",
  },
  {
    name: "واردات داده JSON",
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
  {
    name: "پروژه ایجیس",
    href: "/aegis",
    icon: "fas fa-shield-alt",
  },
  {
    name: "هوش مصنوعی Vertex",
    href: "/ai-intelligence",
    icon: "fas fa-brain",
  },
  {
    name: "نظارت عملکرد پیشرفته",
    href: "/performance-monitoring",
    icon: "fas fa-tachometer-alt",
  },
  {
    name: "مدیریت مانده ادمین‌ها",
    href: "/balance-management",
    icon: "fas fa-balance-scale",
  },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { state, close } = useSidebar();
  const basePath = getBasePath();

  return (
    <>
      {/* Overlay - clickable to close */}
      {state.isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={close}
        />
      )}

      {/* Dynamic Responsive Sidebar */}
      <div 
        className="sidebar-dynamic"
        data-sidebar-state={state.isOpen ? "open" : "closed"}
      >
        {/* Header Section - Fixed */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon">
              <i className="fas fa-chart-line"></i>
            </div>
            <h1 className="brand-title">مارفانت</h1>
          </div>
          <button
            onClick={close}
            className="sidebar-close-btn"
            title="بستن منو"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Navigation Section - Scrollable */}
        <nav className="sidebar-navigation">
          <div className="nav-items-container">
            {navigationItems.map((item) => {
              const fullHref = basePath + item.href;
              const isActive = location === fullHref || (item.href === "/dashboard" && (location === basePath || location === basePath + "/"));
              
              return (
                <Link
                  key={item.href}
                  href={fullHref}
                  className="nav-item"
                  data-active={isActive}
                  onClick={close}
                >
                  <i className={cn("nav-item-icon", item.icon)}></i>
                  <span className="nav-item-text">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="footer-content">
            <div className="user-avatar">
              <i className="fas fa-user"></i>
            </div>
            <div className="user-info">
              <p className="user-name">مدیر سیستم</p>
              <p className="user-status">آنلاین</p>
            </div>
            <button className="logout-btn">
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
