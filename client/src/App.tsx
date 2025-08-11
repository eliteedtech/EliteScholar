import { Switch, Route } from "wouter";
import { lazy, Suspense, startTransition } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import SuperAdminDashboard from "@/pages/superadmin/dashboard";
import SettingsPage from "@/pages/superadmin/settings";
import SchoolsPage from "@/pages/superadmin/schools";
import InvoicesPage from "@/pages/superadmin/invoices";
import EnhancedInvoicesPage from "@/pages/superadmin/invoices-enhanced";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  const FeaturesPage = lazy(() => import("./pages/superadmin/features"));
  const AnalyticsPage = lazy(() => import("./pages/superadmin/analytics"));

  return (
    <Switch>
      {!user ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Landing} />
        </>
      ) : (
        <>
          {user.role === "superadmin" && (
            <>
              <Route path="/" component={SuperAdminDashboard} />
              <Route path="/superadmin" component={SuperAdminDashboard} />
              <Route path="/superadmin/schools" component={SchoolsPage} />
              <Route path="/superadmin/invoices" component={InvoicesPage} />
              <Route path="/superadmin/invoices-enhanced" component={EnhancedInvoicesPage} />
              <Route path="/superadmin/invoice-pdf-generator">
                <Suspense fallback={<div>Loading PDF generator...</div>}>
                  {(() => {
                    const InvoicePDFGeneratorPage = lazy(() => import("./pages/superadmin/invoice-pdf-generator"));
                    return <InvoicePDFGeneratorPage />;
                  })()}
                </Suspense>
              </Route>
              <Route path="/superadmin/settings-enhanced">
                <Suspense fallback={<div>Loading settings...</div>}>
                  {(() => {
                    const SettingsEnhancedPage = lazy(() => import("./pages/superadmin/settings-enhanced"));
                    return <SettingsEnhancedPage />;
                  })()}
                </Suspense>
              </Route>
              <Route path="/superadmin/features">
                <Suspense fallback={<div>Loading...</div>}>
                  <FeaturesPage />
                </Suspense>
              </Route>
              <Route path="/superadmin/analytics">
                <Suspense fallback={<div>Loading...</div>}>
                  <AnalyticsPage />
                </Suspense>
              </Route>
              <Route path="/superadmin/users" component={SuperAdminDashboard} />
              <Route path="/superadmin/settings" component={SettingsPage} />
            </>
          )}
          {/* Add other role-specific routes here */}
        </>
      )}
      <Route component={NotFound} />
    </Switch>
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
