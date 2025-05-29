import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Sidebar from "@/components/layout/sidebar";
import CrmSidebar from "@/components/layout/crm-sidebar";
import Header from "@/components/layout/header";
import Dashboard from "@/pages/dashboard";
import Representatives from "@/pages/representatives";
import Invoices from "@/pages/invoices";
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
import AegisDashboard from "@/pages/aegis-dashboard";
import AegisTest from "@/pages/aegis-test";
import GoogleCloudSetup from "@/pages/google-cloud-setup";
import NotFound from "@/pages/not-found";

function Router() {
  const currentPath = window.location.pathname;
  const isCrmSection = currentPath.startsWith('/csdfjkjfoascivomrm867945');
  const isAdminSection = currentPath.startsWith('/ciwomplefoadm867945');

  // Safari URL Security Check: Prevent access if secure path was stripped
  if (currentPath === '/' || currentPath === '/index.html') {
    return (
      <div style={{
        fontFamily: 'Tahoma',
        direction: 'rtl',
        textAlign: 'center',
        padding: '50px',
        background: '#f5f5f5',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '8px',
          maxWidth: '400px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ color: '#d32f2f', marginBottom: '20px' }}>🚫 خطای دسترسی</h1>
          <p style={{ color: '#666', lineHeight: '1.6' }}>URL امنیتی حذف شده است.</p>
          <p style={{ color: '#666', lineHeight: '1.6' }}>لطفاً از لینک کامل و صحیح استفاده کنید.</p>
          <p style={{ color: '#ff6b35', fontWeight: 'bold', marginTop: '15px' }}>
            ⚠️ Safari: حتماً لینک کامل را وارد کنید
          </p>
          <small style={{ color: '#999' }}>Security Error - Use Complete URL</small>
        </div>
      </div>
    );
  }

  // CRM Layout
  if (isCrmSection) {
    return (
      <div className="min-h-screen bg-gray-50 rtl">
        <CrmSidebar />
        <div className="lg:mr-72 md:mr-64 sm:mr-56 w-full">
          <Header />
          <main className="w-full overflow-y-auto p-4 lg:p-6">
            <Switch>
              <Route path="/csdfjkjfoascivomrm867945" component={CrmDashboard} />
              <Route path="/csdfjkjfoascivomrm867945/" component={CrmDashboard} />
              <Route path="/csdfjkjfoascivomrm867945/dashboard" component={CrmDashboard} />
              <Route path="/csdfjkjfoascivomrm867945/customers" component={CrmCustomers} />
              <Route path="/csdfjkjfoascivomrm867945/tickets" component={CrmTickets} />
              <Route path="/csdfjkjfoascivomrm867945/call-preparation" component={CrmCallPreparation} />
              <Route path="/csdfjkjfoascivomrm867945/voice-notes" component={CrmVoiceNotes} />
              <Route path="/csdfjkjfoascivomrm867945/followups" component={CrmTickets} />
              <Route path="/csdfjkjfoascivomrm867945/reports" component={Analytics} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    );
  }

  // Admin Layout (default)
  return (
    <div className="min-h-screen bg-gray-50 rtl">
      <Sidebar />
      <div className="w-full">
        <Header />
        <main className="w-full overflow-y-auto p-4 lg:p-6">
          <Switch>
            {/* Admin routes with secret path prefix */}
            <Route path="/ciwomplefoadm867945" component={Dashboard} />
            <Route path="/ciwomplefoadm867945/" component={Dashboard} />
            <Route path="/ciwomplefoadm867945/dashboard" component={Dashboard} />
            <Route path="/ciwomplefoadm867945/representatives" component={Representatives} />
            <Route path="/ciwomplefoadm867945/invoices" component={Invoices} />
            <Route path="/ciwomplefoadm867945/analytics" component={Analytics} />
            <Route path="/ciwomplefoadm867945/import" component={ImportOds} />
            <Route path="/ciwomplefoadm867945/payments" component={Payments} />
            <Route path="/ciwomplefoadm867945/backup" component={Backup} />
            <Route path="/ciwomplefoadm867945/settings" component={Settings} />
            <Route path="/ciwomplefoadm867945/aegis" component={AegisDashboard} />
            <Route path="/ciwomplefoadm867945/aegis-test" component={AegisTest} />
            <Route path="/ciwomplefoadm867945/google-cloud-setup" component={GoogleCloudSetup} />
            
            {/* Legacy routes for development */}
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/representatives" component={Representatives} />
            <Route path="/invoices" component={Invoices} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/import" component={ImportOds} />
            <Route path="/payments" component={Payments} />
            <Route path="/backup" component={Backup} />
            <Route path="/settings" component={Settings} />
            
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
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
