import SuperAdminLayout from "../../components/superadmin/layout";

export default function SchoolsPage() {
  return (
    <SuperAdminLayout
      title="School Management"
      subtitle="Manage schools and their settings across your platform"
    >
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">School Management</h3>
        <p className="text-slate-600">Advanced school management with grade groups and soft delete functionality.</p>
      </div>
    </SuperAdminLayout>
  );
}