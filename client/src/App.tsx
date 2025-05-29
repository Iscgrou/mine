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
import NotFound from "@/pages/not-found";

function Router() {
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
            
            {/* Legacy routes for development - redirect to secret path */}
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
