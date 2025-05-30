import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Component } from "react";

// Error Boundary Component
class ErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
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
            <h1 style={{ color: '#d32f2f', marginBottom: '20px' }}>خطای سیستم</h1>
            <p style={{ color: '#666', lineHeight: '1.6' }}>در حال بارگذاری...</p>
            <button 
              onClick={() => window.location.reload()} 
              style={{
                background: '#007BFF',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                marginTop: '20px',
                cursor: 'pointer'
              }}
            >
              تازه‌سازی صفحه
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Simple Dashboard Component for testing
function SimpleDashboard() {
  return (
    <div style={{
      fontFamily: 'Tahoma',
      direction: 'rtl',
      padding: '20px',
      background: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>پنل مدیریت MarFanet</h1>
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <p>سیستم در حال بارگذاری کامل...</p>
      </div>
    </div>
  );
}

// Lazy load components
const Dashboard = React.lazy(() => import("@/pages/dashboard").catch(() => ({ default: SimpleDashboard })));
const ImportOds = React.lazy(() => import("@/pages/import-ods").catch(() => ({ default: SimpleDashboard })));
const Representatives = React.lazy(() => import("@/pages/representatives").catch(() => ({ default: SimpleDashboard })));
const InvoiceBatches = React.lazy(() => import("@/pages/invoice-batches").catch(() => ({ default: SimpleDashboard })));
const Analytics = React.lazy(() => import("@/pages/analytics").catch(() => ({ default: SimpleDashboard })));
const Payments = React.lazy(() => import("@/pages/payments").catch(() => ({ default: SimpleDashboard })));
const Settings = React.lazy(() => import("@/pages/settings").catch(() => ({ default: SimpleDashboard })));

import React from "react";

function Router() {
  const currentPath = window.location.pathname;

  return (
    <React.Suspense fallback={
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
          <h1 style={{ color: '#333', marginBottom: '20px' }}>MarFanet</h1>
          <p style={{ color: '#666', lineHeight: '1.6' }}>در حال بارگذاری...</p>
        </div>
      </div>
    }>
      <div style={{
        fontFamily: 'Tahoma',
        direction: 'rtl',
        minHeight: '100vh',
        background: '#f5f5f5'
      }}>
        <Switch>
          <Route path="/ciwomplefoadm867945" component={Dashboard} />
          <Route path="/ciwomplefoadm867945/" component={Dashboard} />
          <Route path="/ciwomplefoadm867945/dashboard" component={Dashboard} />
          <Route path="/ciwomplefoadm867945/representatives" component={Representatives} />
          <Route path="/ciwomplefoadm867945/invoices" component={InvoiceBatches} />
          <Route path="/ciwomplefoadm867945/analytics" component={Analytics} />
          <Route path="/ciwomplefoadm867945/import" component={ImportOds} />
          <Route path="/ciwomplefoadm867945/payments" component={Payments} />
          <Route path="/ciwomplefoadm867945/settings" component={Settings} />
          <Route component={SimpleDashboard} />
        </Switch>
      </div>
    </React.Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
