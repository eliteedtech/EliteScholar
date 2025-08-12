import { SchoolLayout } from "@/components/school";

export default function Branches() {
  return (
    <SchoolLayout title="Branches" subtitle="Manage school branches and administrators">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-slate-900 mb-2">Branches Coming Soon</h3>
          <p className="text-slate-600">Branch management with admin assignments and validation.</p>
        </div>
      </div>
    </SchoolLayout>
  );
}