import { useLocation } from "wouter";
import SuperAdminLayout from "@/components/superadmin/layout";
import StatsCards from "@/components/superadmin/stats-cards";
import SchoolsTable from "@/components/superadmin/schools-table";
import FeaturesManagement from "@/components/superadmin/features-management";

export default function SuperAdminDashboard() {
  const [location] = useLocation();
  const currentPage = location.split("/").pop() || "schools";

  const renderContent = () => {
    switch (currentPage) {
      case "schools":
      case "superadmin":
      case "":
        return (
          <div className="space-y-8">
            <StatsCards />
            <SchoolsTable />
          </div>
        );
      case "invoices":
        return (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Invoice Management</h3>
            <p className="text-slate-600">Invoice management interface coming soon...</p>
          </div>
        );
      case "features":
        return <FeaturesManagement />;
      case "analytics":
        return (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Analytics Dashboard</h3>
            <p className="text-slate-600">Analytics dashboard coming soon...</p>
          </div>
        );
      case "users":
        return (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">User Management</h3>
            <p className="text-slate-600">User management interface coming soon...</p>
          </div>
        );
      default:
        return (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Page Not Found</h3>
            <p className="text-slate-600">The requested page could not be found.</p>
          </div>
        );
    }
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case "schools":
      case "superadmin":
      case "":
        return {
          title: "School Management",
          subtitle: "Manage schools, features, and billing across your platform"
        };
      case "invoices":
        return {
          title: "Invoice Management",
          subtitle: "Track payments and manage billing for all schools"
        };
      case "features":
        return {
          title: "Feature Management",
          subtitle: "Configure and manage platform features"
        };
      case "analytics":
        return {
          title: "Analytics Dashboard",
          subtitle: "View platform performance and usage statistics"
        };
      case "users":
        return {
          title: "User Management",
          subtitle: "Manage platform users and permissions"
        };
      default:
        return {
          title: "Dashboard",
          subtitle: "Elite Scholar Super Admin Dashboard"
        };
    }
  };

  const pageInfo = getPageTitle();

  return (
    <SuperAdminLayout title={pageInfo.title} subtitle={pageInfo.subtitle}>
      {renderContent()}
    </SuperAdminLayout>
  );
}
