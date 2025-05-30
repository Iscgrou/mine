import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NotificationProvider } from "@/hooks/use-notifications";
import { SidebarProvider } from "@/contexts/SidebarContext";
import "@/utils/dynamic-layout";
import Sidebar from "@/components/layout/sidebar";
import CrmSidebar from "@/components/layout/crm-sidebar";
import Header from "@/components/layout/header";
import Dashboard from "@/pages/dashboard";
import Representatives from "@/pages/representatives";
import Invoices from "@/pages/invoices";
import InvoiceBatches from "@/pages/invoice-batches";
import Analytics from "@/pages/analytics";
import ImportOds from "@/pages/import-ods";
import Payments from "@/pages/payments";
import Backup from "@/pages/backup";
import Settings from "@/pages/settings";
import CrmDashboard from "@/pages/crm-dashboard";
import CrmCustomers from "@/pages/crm-customers";
import CrmTickets from "@/pages/crm-tickets";
import CrmCallPreparation from "@/pages/crm-call-preparation";
import CrmVoiceNotes from "@/pages/crm-voice-notes";
import CRTPerformance from "@/pages/crt-performance";
import RepresentativeManagement from "@/pages/representative-management";
import AegisDashboard from "@/pages/aegis-dashboard";
import AegisTest from "@/pages/aegis-test";
import GoogleCloudSetup from "@/pages/google-cloud-setup";
import AIIntelligence from "@/pages/ai-intelligence";
import PerformanceMonitoring from "@/pages/performance-monitoring";
import NotFound from "@/pages/not-found";

function Router() {
  const currentPath = window.location.pathname;
  const isCrmSection = currentPath.startsWith('/crm');
  const isAdminSection = currentPath.startsWith('/admin');

  // CRM Layout
  if (isCrmSection) {
    return (
      <div className="app-layout bg-gray-50 rtl">
        <div className="sidebar-container">
          <CrmSidebar />
        </div>
        <div className="main-content-container">
          <Header />
          <main className="page-content">
            <Switch>
              <Route path="/crm" component={CrmDashboard} />
              <Route path="/crm/" component={CrmDashboard} />
              <Route path="/crm/dashboard" component={CrmDashboard} />
              <Route path="/crm/customers" component={CrmCustomers} />
              <Route path="/crm/tickets" component={CrmTickets} />
              <Route path="/crm/call-preparation" component={CrmCallPreparation} />
              <Route path="/crm/voice-notes" component={CrmVoiceNotes} />
              <Route path="/crm/crt-performance" component={CRTPerformance} />
              <Route path="/crm/followups" component={CrmTickets} />
              <Route path="/crm/reports" component={Analytics} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    );
  }

  // Admin Layout (default)
  return (
    <div className="app-layout bg-gray-50 rtl">
      <div className="sidebar-container">
        <Sidebar />
      </div>
      <div className="main-content-container">
        <Header />
        <main className="page-content">
          <Switch>
            {/* Admin routes with new clean paths */}
            <Route path="/admin" component={Dashboard} />
            <Route path="/admin/" component={Dashboard} />
            <Route path="/admin/dashboard" component={Dashboard} />
            <Route path="/admin/representatives" component={RepresentativeManagement} />
            <Route path="/admin/invoices" component={Invoices} />
            <Route path="/admin/invoice-batches" component={InvoiceBatches} />
            <Route path="/admin/analytics" component={Analytics} />
            <Route path="/admin/crt-performance" component={CRTPerformance} />
            <Route path="/admin/import" component={ImportOds} />
            <Route path="/admin/payments" component={Payments} />
            <Route path="/admin/backup" component={Backup} />
            <Route path="/admin/settings" component={Settings} />
            <Route path="/admin/aegis" component={AegisDashboard} />
            <Route path="/admin/aegis-test" component={AegisTest} />
            <Route path="/admin/google-cloud-setup" component={GoogleCloudSetup} />
            <Route path="/admin/ai-intelligence" component={AIIntelligence} />
            <Route path="/admin/performance-monitoring" component={PerformanceMonitoring} />
            
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <NotificationProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </NotificationProvider>
      </SidebarProvider>
    </QueryClientProvider>
  );
}

export default App;
