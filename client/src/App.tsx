import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import Dashboard from "@/pages/dashboard";
import Representatives from "@/pages/representatives";
import Invoices from "@/pages/invoices";
import Analytics from "@/pages/analytics";
import ImportOds from "@/pages/import-ods";
import Payments from "@/pages/payments";
import Backup from "@/pages/backup";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="flex min-h-screen bg-gray-50 rtl">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:mr-56 xl:mr-64 2xl:mr-72 transition-all duration-300">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Switch>
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
