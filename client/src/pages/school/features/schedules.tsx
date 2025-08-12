import { SchoolLayout } from "@/components/school";

export default function Schedules() {
  return (
    <SchoolLayout title="Schedules" subtitle="Manage schedules and timetables">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-slate-900 mb-2">Schedules Coming Soon</h3>
          <p className="text-slate-600">Schedule management will be auto-generated based on feature requirements.</p>
        </div>
      </div>
    </SchoolLayout>
  );
}