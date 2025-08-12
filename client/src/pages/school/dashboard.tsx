import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { School, Users, BookOpen, Calendar, TrendingUp, Clock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { SchoolLayout } from "@/components/school";

interface DashboardStats {
  totalStudents: number;
  totalStaff: number;
  totalClasses: number;
  activeSubjects: number;
  currentTerm: string;
  currentWeek: number;
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

export default function SchoolDashboard() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch dashboard stats
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/schools/dashboard/stats"],
  });

  // Fetch assigned features for this school
  const { data: schoolFeatures = [] } = useQuery({
    queryKey: ["/api/schools/features"],
  });

  // Get quick actions based on user role and assigned features
  const getQuickActions = (): QuickAction[] => {
    console.log('School features:', schoolFeatures);
    
    // Base actions that are always available
    const baseActions: QuickAction[] = [];

    // Feature-based actions - only show if feature is assigned and enabled
    const featureActions: Record<string, QuickAction> = {
      'academic_management': {
        title: "Academic Years",
        description: "Manage academic years and terms",
        icon: <Calendar className="h-6 w-6" />,
        href: "/school/academic-years",
        color: "bg-blue-500",
      },
      'class_management': {
        title: "View Classes",
        description: "Browse all classes and sections",
        icon: <School className="h-6 w-6" />,
        href: "/school/classes",
        color: "bg-green-500",
      },
      'subject_management': {
        title: "Subjects",
        description: "Manage school subjects",
        icon: <BookOpen className="h-6 w-6" />,
        href: "/school/subjects",
        color: "bg-purple-500",
      },
      'staff_management': {
        title: "Staff Management",
        description: "Manage staff profiles and assignments",
        icon: <Users className="h-6 w-6" />,
        href: "/school/features/staff-management",
        color: "bg-orange-500",
      },
      'school_setup': {
        title: "School Setup",
        description: "Configure school structure",
        icon: <School className="h-6 w-6" />,
        href: "/school/setup",
        color: "bg-indigo-500",
      },
      'attendance': {
        title: "Attendance",
        description: "Track student attendance",
        icon: <Clock className="h-6 w-6" />,
        href: "/school/features/attendance",
        color: "bg-red-500",
      },
      'gradebook': {
        title: "Gradebook",
        description: "Manage grades and assessments",
        icon: <BookOpen className="h-6 w-6" />,
        href: "/school/features/gradebook",
        color: "bg-emerald-500",
      },
      'report_generation': {
        title: "Reports",
        description: "Generate academic reports",
        icon: <TrendingUp className="h-6 w-6" />,
        href: "/school/features/reports",
        color: "bg-blue-600",
      }
    };

    // Add features that are assigned and enabled to this school
    schoolFeatures.forEach((feature: any) => {
      if (feature.enabled && featureActions[feature.key]) {
        baseActions.push(featureActions[feature.key]);
      }
    });

    // Always show School Setup for school admins
    if (user?.role === "school_admin" && !baseActions.find(action => action.href === "/school/setup")) {
      baseActions.push(featureActions['school_setup']);
    }

    return baseActions;
  };

  const quickActions = getQuickActions();

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <SchoolLayout 
      title={`Welcome back, ${user?.name || 'User'}!`}
      subtitle={`${formatDate(currentTime)} - Good ${currentTime.getHours() < 12 ? 'morning' : currentTime.getHours() < 17 ? 'afternoon' : 'evening'}!`}
    >
      <div className="space-y-8">
        {/* Real-time Clock */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-2xl font-bold text-primary mb-2">
                {formatTime(currentTime)}
              </h3>
              <p className="text-slate-600">
                {formatDate(currentTime)}
              </p>
            </div>
            <Clock className="h-12 w-12 text-primary" />
          </CardContent>
        </Card>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="flex items-center p-6">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats?.totalStudents || 0}</p>
                <p className="text-xs text-muted-foreground">Total Students</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <Users className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats?.totalStaff || 0}</p>
                <p className="text-xs text-muted-foreground">Staff Members</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <School className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats?.totalClasses || 0}</p>
                <p className="text-xs text-muted-foreground">Active Classes</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <BookOpen className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats?.activeSubjects || 0}</p>
                <p className="text-xs text-muted-foreground">Subjects</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Academic Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Current Academic Period
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Current Term:</span>
                <Badge variant="default">{stats?.currentTerm || "Not Set"}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Current Week:</span>
                <Badge variant="secondary">Week {stats?.currentWeek || "N/A"}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">School Status:</span>
                <Badge variant="default" className="bg-green-500">Active</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Last Sync:</span>
                <span className="text-sm text-muted-foreground">Just now</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Get started with the most common tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Card 
                  key={index}
                  className="cursor-pointer hover:shadow-md transition-shadow group"
                  onClick={() => window.location.href = action.href}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${action.color} text-white`}>
                        {action.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
                          {action.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Role Badge */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Logged in as:</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <Badge variant="outline" className="capitalize">
                {user?.role?.replace('_', ' ')}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </SchoolLayout>
  );
}