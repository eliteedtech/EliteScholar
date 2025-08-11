import SuperAdminLayout from "@/components/superadmin/layout";
import SchoolsTable from "@/components/superadmin/schools-table";

export default function SchoolsPage() {
  return (
    <SuperAdminLayout
      title="School Management"
      subtitle="Manage schools and their settings across your platform"
    >
      <SchoolsTable />
    </SuperAdminLayout>
  );
}