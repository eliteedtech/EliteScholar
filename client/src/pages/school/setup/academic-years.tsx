import { SchoolLayout } from "@/components/school";

export default function AcademicYears() {
  return (
    <SchoolLayout title="Academic Years" subtitle="Manage academic years, terms, and calendar">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-slate-900 mb-2">Academic Years Coming Soon</h3>
          <p className="text-slate-600">Comprehensive academic year management with automatic week generation and calendar view.</p>
        </div>
      </div>
    </SchoolLayout>
  );
}