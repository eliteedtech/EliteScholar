import { Switch, Route } from "wouter";
import { lazy, Suspense, startTransition } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import LoginPage from "@/pages/login";
import SchoolLoginPage from "@/pages/school-login";
import SuperAdminDashboard from "@/pages/superadmin/dashboard";
import ProfilePage from "@/pages/superadmin/profile";
import SchoolsPage from "@/pages/superadmin/schools";
import InvoicesPage from "@/pages/superadmin/invoices";
import EnhancedInvoicesPage from "@/pages/superadmin/invoices-enhanced";
import SettingsPage from "@/pages/superadmin/settings";

// School pages
const SchoolDashboard = lazy(() => import("./pages/school/dashboard"));
const AcademicYearsPage = lazy(() => import("./pages/school/academic-years"));

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
          <Route path="/login" component={LoginPage} />
          <Route path="/school-login" component={SchoolLoginPage} />
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
              <Route path="/superadmin/settings" component={SettingsPage} />
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
              <Route path="/superadmin/feature-assignment">
                <Suspense fallback={<div>Loading...</div>}>
                  {(() => {
                    const FeatureAssignmentPage = lazy(() => import("./pages/superadmin/feature-assignment"));
                    return <FeatureAssignmentPage />;
                  })()}
                </Suspense>
              </Route>
              <Route path="/superadmin/analytics">
                <Suspense fallback={<div>Loading...</div>}>
                  <AnalyticsPage />
                </Suspense>
              </Route>
              <Route path="/superadmin/users" component={SuperAdminDashboard} />
              <Route path="/superadmin/profile" component={ProfilePage} />
              <Route path="/superadmin/database">
                <Suspense fallback={<div>Loading database...</div>}>
                  {(() => {
                    const DatabasePage = lazy(() => import("./pages/superadmin/database"));
                    return <DatabasePage />;
                  })()}
                </Suspense>
              </Route>
            </>
          )}
          
          {/* School-specific routes for all school roles */}
          {(user.role === "school_admin" || user.role === "teacher" || user.role === "student" || user.role === "parent") && (
            <>
              <Route path="/" component={() => (
                <Suspense fallback={<div>Loading...</div>}>
                  <SchoolDashboard />
                </Suspense>
              )} />
              <Route path="/school" component={() => (
                <Suspense fallback={<div>Loading...</div>}>
                  <SchoolDashboard />
                </Suspense>
              )} />
              
              {/* School Admin specific routes */}
              {user.role === "school_admin" && (
                <>
                  <Route path="/school/academic-years" component={() => (
                    <Suspense fallback={<div>Loading...</div>}>
                      <AcademicYearsPage />
                    </Suspense>
                  )} />
                  <Route path="/school/classes">
                    <Suspense fallback={<div>Loading...</div>}>
                      {(() => {
                        const ClassesPage = lazy(() => import("./pages/school/classes"));
                        return <ClassesPage />;
                      })()}
                    </Suspense>
                  </Route>

                  {/* Specific asset setup route - must come before generic feature routes */}
                  <Route path="/school/school-setup/asset-setup">
                    <Suspense fallback={<div>Loading...</div>}>
                      {(() => {
                        const EnhancedAssetSetupPage = lazy(() => import("./pages/school/enhanced-asset-setup"));
                        return <EnhancedAssetSetupPage />;
                      })()}
                    </Suspense>
                  </Route>
                  
                  {/* Feature-based routes - New URL pattern /school/feature-name/* (but NOT /school/school-setup/*) */}
                  <Route path="/school/:featureName/:page?" component={({ params }) => {
                    // Skip this route for school-setup paths to avoid conflicts with specific routes
                    if (params?.featureName === 'school-setup') {
                      return null;
                    }
                    return (
                      <Suspense fallback={<div>Loading...</div>}>
                        {(() => {
                          const FeaturePage = lazy(() => import("./pages/school/feature-page"));
                          return <FeaturePage />;
                        })()}
                      </Suspense>
                    );
                  }} />
                  
                  {/* Legacy feature routes for backward compatibility */}
                  <Route path="/school/features/:featureId" component={() => (
                    <Suspense fallback={<div>Loading...</div>}>
                      {(() => {
                        const FeatureOverview = lazy(() => import("./pages/school/features/[featureId]/index"));
                        return <FeatureOverview />;
                      })()}
                    </Suspense>
                  )} />
                  
                  <Route path="/school/features/:featureId/list" component={() => (
                    <Suspense fallback={<div>Loading...</div>}>
                      {(() => {
                        const StaffList = lazy(() => import("./pages/school/features/staff-management/list"));
                        return <StaffList />;
                      })()}
                    </Suspense>
                  )} />
                  
                  <Route path="/school/features/:featureId/create">
                    <Suspense fallback={<div>Loading...</div>}>
                      {(() => {
                        const CreatePage = lazy(() => import("./pages/school/features/create"));
                        return <CreatePage />;
                      })()}
                    </Suspense>
                  </Route>
                  
                  <Route path="/school/features/:featureId/types">
                    <Suspense fallback={<div>Loading...</div>}>
                      {(() => {
                        const TypesPage = lazy(() => import("./pages/school/features/types"));
                        return <TypesPage />;
                      })()}
                    </Suspense>
                  </Route>
                  
                  <Route path="/school/features/:featureId/schedules">
                    <Suspense fallback={<div>Loading...</div>}>
                      {(() => {
                        const SchedulesPage = lazy(() => import("./pages/school/features/schedules"));
                        return <SchedulesPage />;
                      })()}
                    </Suspense>
                  </Route>
                  
                  {/* School Setup routes */}
                  <Route path="/school/setup">
                    <Suspense fallback={<div>Loading...</div>}>
                      {(() => {
                        const SetupIndexPage = lazy(() => import("./pages/school/setup/index"));
                        return <SetupIndexPage />;
                      })()}
                    </Suspense>
                  </Route>
                  
                  <Route path="/school/setup/sections">
                    <Suspense fallback={<div>Loading...</div>}>
                      {(() => {
                        const SectionsPage = lazy(() => import("./pages/school/setup/sections"));
                        return <SectionsPage />;
                      })()}
                    </Suspense>
                  </Route>
                  
                  <Route path="/school/setup/classes">
                    <Suspense fallback={<div>Loading...</div>}>
                      {(() => {
                        const ClassesPage = lazy(() => import("./pages/school/setup/classes"));
                        return <ClassesPage />;
                      })()}
                    </Suspense>
                  </Route>
                  
                  <Route path="/school/setup/subjects">
                    <Suspense fallback={<div>Loading...</div>}>
                      {(() => {
                        const SubjectsPage = lazy(() => import("./pages/school/setup/subjects"));
                        return <SubjectsPage />;
                      })()}
                    </Suspense>
                  </Route>
                  
                  <Route path="/school/setup/branches">
                    <Suspense fallback={<div>Loading...</div>}>
                      {(() => {
                        const BranchesPage = lazy(() => import("./pages/school/setup/branches"));
                        return <BranchesPage />;
                      })()}
                    </Suspense>
                  </Route>
                  
                  <Route path="/school/setup/academic-years">
                    <Suspense fallback={<div>Loading...</div>}>
                      {(() => {
                        const AcademicYearsPage = lazy(() => import("./pages/school/setup/academic-years"));
                        return <AcademicYearsPage />;
                      })()}
                    </Suspense>
                  </Route>
                  <Route path="/school/users">
                    <Suspense fallback={<div>Loading...</div>}>
                      {(() => {
                        const UsersPage = lazy(() => import("./pages/school/users"));
                        return <UsersPage />;
                      })()}
                    </Suspense>
                  </Route>
                  <Route path="/school/settings">
                    <Suspense fallback={<div>Loading...</div>}>
                      {(() => {
                        const SchoolSettingsPage = lazy(() => import("./pages/school/settings"));
                        return <SchoolSettingsPage />;
                      })()}
                    </Suspense>
                  </Route>
                </>
              )}
            </>
          )}
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
