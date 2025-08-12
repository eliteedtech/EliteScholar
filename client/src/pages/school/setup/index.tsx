import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  School, 
  GraduationCap, 
  BookOpen, 
  Building, 
  Calendar,
  Users,
  Settings
} from "lucide-react";
import { SchoolLayout } from "@/components/school";

const setupModules = [
  {
    id: "sections",
    title: "Sections",
    description: "Manage school sections like Primary, Junior Secondary, Senior Secondary",
    icon: <School className="h-8 w-8" />,
    href: "/school/setup/sections",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    id: "classes",
    title: "Classes",
    description: "Create class levels with sections (e.g., JSS1A, SSS2B)",
    icon: <GraduationCap className="h-8 w-8" />,
    href: "/school/setup/classes",
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    id: "subjects",
    title: "Subjects",
    description: "Setup subjects with departments and class assignments",
    icon: <BookOpen className="h-8 w-8" />,
    href: "/school/setup/subjects",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    id: "branches",
    title: "Branches",
    description: "Manage school branches and assign administrators",
    icon: <Building className="h-8 w-8" />,
    href: "/school/setup/branches",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  {
    id: "academic-years",
    title: "Academic Years",
    description: "Create academic years, terms, and auto-generate weekly calendar",
    icon: <Calendar className="h-8 w-8" />,
    href: "/school/setup/academic-years",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
];

export default function SchoolSetup() {
  return (
    <SchoolLayout title="School Setup" subtitle="Configure your school's educational structure">
      <div className="space-y-6">
        {/* Overview Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Settings className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <CardTitle>School Configuration</CardTitle>
                <CardDescription>
                  Set up your school's educational structure and organizational framework
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Setup Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {setupModules.map((module) => (
            <Card key={module.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className={`w-12 h-12 ${module.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                  <div className={module.color}>
                    {module.icon}
                  </div>
                </div>
                <CardTitle className="text-lg">{module.title}</CardTitle>
                <CardDescription className="text-sm">
                  {module.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={module.href}>
                  <Button className="w-full" variant="outline" data-testid={`setup-${module.id}`}>
                    Configure {module.title}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Setup Progress Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Setup Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              <strong>Recommended Setup Order:</strong>
            </div>
            <ol className="text-sm space-y-2 ml-4 list-decimal text-muted-foreground">
              <li><strong>Sections:</strong> Create primary organizational groups (Primary, JSS, SSS)</li>
              <li><strong>Classes:</strong> Add specific class levels within each section</li>
              <li><strong>Subjects:</strong> Define subjects and assign them to appropriate classes</li>
              <li><strong>Academic Years:</strong> Set up current academic year and terms</li>
              <li><strong>Branches:</strong> Configure additional branches if applicable</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </SchoolLayout>
  );
}