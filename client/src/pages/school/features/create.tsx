import { SchoolLayout } from "@/components/school";

export default function CreateFeature() {
  return (
    <SchoolLayout title="Create" subtitle="Create new feature record">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-slate-900 mb-2">Feature Coming Soon</h3>
          <p className="text-slate-600">This creation page will be auto-generated based on the feature type.</p>
        </div>
      </div>
    </SchoolLayout>
  );
}