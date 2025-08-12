import { SchoolLayout } from "@/components/school";

export default function Subjects() {
  return (
    <SchoolLayout title="Subjects" subtitle="Manage school subjects and departments">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-slate-900 mb-2">Subjects Coming Soon</h3>
          <p className="text-slate-600">Advanced subject management with department support and multi-class assignments.</p>
        </div>
      </div>
    </SchoolLayout>
  );
}