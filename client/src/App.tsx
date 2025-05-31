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
import Dashboard from "@/pages/dashboard-enhanced";
import Representatives from "@/pages/representatives-enhanced";
import Invoices from "@/pages/invoices-enhanced";
import InvoiceBatches from "@/pages/invoice-batches";
import Analytics from "@/pages/analytics-enhanced";
import ImportJSON from "@/pages/import-json";
import Payments from "@/pages/payments";
import Backup from "@/pages/backup";
import Settings from "@/pages/settings-complete";
import CrmDashboard from "@/pages/crm-dashboard-enhanced";
import CrmCustomers from "@/pages/crm-customers";
import CrmTickets from "@/pages/crm-tickets";
import CrmCallPreparation from "@/pages/crm-call-preparation";
import CrmVoiceNotes from "@/pages/crm-voice-notes";
import CRTPerformance from "@/pages/crt-performance";
import RepresentativeManagement from "@/pages/representative-management";
import CollaboratorManagement from "@/pages/collaborator-management";
import AegisDashboard from "@/pages/aegis-dashboard";
import AegisTest from "@/pages/aegis-test";
import GoogleCloudSetup from "@/pages/google-cloud-setup";
import AIIntelligence from "@/pages/ai-intelligence";
import PerformanceMonitoring from "@/pages/performance-monitoring";
import NotFound from "@/pages/not-found";
import SecureAPIUpload from "@/pages/secure-api-upload";
import SecureCredentialUpload from "@/pages/secure-credential-upload";
import AdminBalanceManagement from "@/pages/admin-balance-management";
import BulkRepresentativeUpdate from "@/pages/bulk-representative-update";
import BulkRepresentativeUpdateBatch3 from "@/pages/bulk-representative-update-batch3";
import SystemAdmin from "@/pages/system-admin";
import DatabaseReconstruction from "@/pages/database-reconstruction";

function Router() {
  const currentPath = window.location.pathname;
  const isCrmSection = currentPath.startsWith('/crm');
  const isAdminSection = currentPath.startsWith('/admin');

  // CRM Layout
  if (isCrmSection) {
    return (
      <div className="flex h-screen bg-gray-50 rtl">
        <CrmSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
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
    <div className="flex h-screen bg-gray-50 rtl">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Switch>
            {/* Admin routes with new clean paths */}
            <Route path="/admin" component={Dashboard} />
            <Route path="/admin/" component={Dashboard} />
            <Route path="/admin/dashboard" component={Dashboard} />
            <Route path="/admin/representatives" component={RepresentativeManagement} />
            <Route path="/admin/collaborators" component={CollaboratorManagement} />
            <Route path="/admin/invoices" component={Invoices} />
            <Route path="/admin/invoice-batches" component={InvoiceBatches} />
            <Route path="/admin/analytics" component={Analytics} />
            <Route path="/admin/crt-performance" component={CRTPerformance} />
            <Route path="/admin/import" component={ImportJSON} />
            <Route path="/admin/payments" component={Payments} />
            <Route path="/admin/backup" component={Backup} />
            <Route path="/admin/settings" component={Settings} />
            <Route path="/admin/aegis" component={AegisDashboard} />
            <Route path="/admin/aegis-test" component={AegisTest} />
            <Route path="/admin/google-cloud" component={GoogleCloudSetup} />
            <Route path="/admin/ai-intelligence" component={AIIntelligence} />
            <Route path="/admin/performance" component={PerformanceMonitoring} />
            <Route path="/admin/balance-management" component={AdminBalanceManagement} />
            <Route path="/admin/bulk-representative-update" component={BulkRepresentativeUpdate} />
            <Route path="/admin/bulk-update-batches" component={BulkRepresentativeUpdateBatch3} />
            <Route path="/admin/system-admin" component={SystemAdmin} />
            <Route path="/admin/system" component={SystemAdmin} />
            <Route path="/admin/database-reconstruction" component={DatabaseReconstruction} />
            
            {/* Default admin routes for backward compatibility */}
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/representatives" component={Representatives} />
            <Route path="/invoices" component={Invoices} />
            <Route path="/invoice-batches" component={InvoiceBatches} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/import" component={ImportJSON} />
            <Route path="/payments" component={Payments} />
            <Route path="/backup" component={Backup} />
            <Route path="/settings" component={Settings} />
            <Route path="/system-admin" component={SystemAdmin} />
            <Route path="/system" component={SystemAdmin} />
            <Route path="/secure/api-upload" component={SecureAPIUpload} />
            <Route path="/secure/credentials" component={SecureCredentialUpload} />
            
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