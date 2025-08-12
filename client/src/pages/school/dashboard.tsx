import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import { useLocation } from "wouter";
import { GraduationCap, Users, BookOpen, Calendar, Settings, LogOut } from "lucide-react";

export default function SchoolDashboard() {
  const { user, logout } = useAuthStore();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const getDashboardCards = () => {
    const role = user?.role;
    
    switch (role) {
      case "school_admin":
        return [
          {
            title: "Academic Years",
            description: "Manage academic years and terms",
            icon: Calendar,
            action: () => setLocation("/school/academic-years"),
            color: "bg-blue-500"
          },
          {
            title: "Classes & Subjects",
            description: "Organize classes and subjects",
            icon: BookOpen,
            action: () => setLocation("/school/classes"),
            color: "bg-green-500"
          },
          {
            title: "Users Management",
            description: "Manage teachers, students and parents",
            icon: Users,
            action: () => setLocation("/school/users"),
            color: "bg-purple-500"
          },
          {
            title: "School Settings",
            description: "Configure school preferences",
            icon: Settings,
            action: () => setLocation("/school/settings"),
            color: "bg-gray-500"
          }
        ];
      
      case "teacher":
        return [
          {
            title: "My Classes",
            description: "View and manage your classes",
            icon: BookOpen,
            action: () => setLocation("/school/my-classes"),
            color: "bg-blue-500"
          },
          {
            title: "Students",
            description: "View your students",
            icon: Users,
            action: () => setLocation("/school/students"),
            color: "bg-green-500"
          },
          {
            title: "Schedule",
            description: "View your teaching schedule",
            icon: Calendar,
            action: () => setLocation("/school/schedule"),
            color: "bg-purple-500"
          },
          {
            title: "Profile",
            description: "Update your profile",
            icon: Settings,
            action: () => setLocation("/school/profile"),
            color: "bg-gray-500"
          }
        ];
      
      case "student":
        return [
          {
            title: "My Classes",
            description: "View your enrolled classes",
            icon: BookOpen,
            action: () => setLocation("/school/my-classes"),
            color: "bg-blue-500"
          },
          {
            title: "Schedule",
            description: "View your class schedule",
            icon: Calendar,
            action: () => setLocation("/school/schedule"),
            color: "bg-green-500"
          },
          {
            title: "Classmates",
            description: "View your classmates",
            icon: Users,
            action: () => setLocation("/school/classmates"),
            color: "bg-purple-500"
          },
          {
            title: "Profile",
            description: "Update your profile",
            icon: Settings,
            action: () => setLocation("/school/profile"),
            color: "bg-gray-500"
          }
        ];
      
      case "parent":
        return [
          {
            title: "My Children",
            description: "View your children's information",
            icon: Users,
            action: () => setLocation("/school/children"),
            color: "bg-blue-500"
          },
          {
            title: "Academic Progress",
            description: "Track academic performance",
            icon: BookOpen,
            action: () => setLocation("/school/progress"),
            color: "bg-green-500"
          },
          {
            title: "Schedule",
            description: "View children's schedules",
            icon: Calendar,
            action: () => setLocation("/school/schedule"),
            color: "bg-purple-500"
          },
          {
            title: "Profile",
            description: "Update your profile",
            icon: Settings,
            action: () => setLocation("/school/profile"),
            color: "bg-gray-500"
          }
        ];
      
      default:
        return [];
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "school_admin":
        return "School Administrator";
      case "teacher":
        return "Teacher";
      case "student":
        return "Student";
      case "parent":
        return "Parent";
      default:
        return role;
    }
  };

  const dashboardCards = getDashboardCards();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-900">Elite Scholar</h1>
                  <p className="text-xs text-slate-500">{getRoleDisplayName(user?.role || "")}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2"
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Welcome back, {user?.name}!
          </h2>
          <p className="text-slate-600">
            Here's what you can do with your {getRoleDisplayName(user?.role || "").toLowerCase()} account.
          </p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {dashboardCards.map((card, index) => (
            <Card 
              key={index} 
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={card.action}
              data-testid={`card-${card.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-900">
                      {card.title}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600">
                  {card.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats or Information */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GraduationCap className="w-5 h-5" />
                <span>Quick Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-slate-900">2024/2025</p>
                  <p className="text-sm text-slate-600">Current Academic Year</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-slate-900">Term 2</p>
                  <p className="text-sm text-slate-600">Current Term</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-slate-900">Week 8</p>
                  <p className="text-sm text-slate-600">Current Week</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}