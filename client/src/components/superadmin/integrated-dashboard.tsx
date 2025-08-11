import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { 
  School, 
  Building2, 
  FileText, 
  Settings, 
  BarChart3, 
  Layers3,
  Users,
  DollarSign,
  TrendingUp,
  Activity
} from "lucide-react";

// Import existing components
import SchoolsManagement from "@/components/superadmin/schools-management";
import InvoicesManagement from "@/components/superadmin/invoices-management";
import FeaturesManagement from "@/components/superadmin/features-management";
import AnalyticsDashboard from "@/components/superadmin/analytics-dashboard";
import SettingsManagement from "@/components/superadmin/settings-management";

export default function IntegratedDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch overview stats
  const { data: stats } = useQuery({
    queryKey: ["/api/superadmin/stats"],
  });

  const { data: analyticsData } = useQuery({
    queryKey: ["/api/analytics"],
  });

  const overviewCards = [
    {
      title: "Total Schools",
      value: (stats as any)?.totalSchools || 0,
      icon: School,
      description: "Registered schools",
      trend: "+12% from last month"
    },
    {
      title: "Active Subscriptions", 
      value: (stats as any)?.activeSubscriptions || 0,
      icon: Building2,
      description: "Paid subscriptions",
      trend: "+8% from last month"
    },
    {
      title: "Monthly Revenue",
      value: `₦${(analyticsData as any)?.totalRevenue || 0}`,
      icon: DollarSign,
      description: "This month's revenue",
      trend: "+23% from last month"
    },
    {
      title: "Pending Invoices",
      value: (analyticsData as any)?.pendingInvoices || 0,
      icon: FileText,
      description: "Awaiting payment",
      trend: "-5% from last month"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Super Admin Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage schools, invoices, features, and system settings
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Navigation Tabs */}
          <TabsList className="grid w-full grid-cols-6 lg:grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="schools" className="flex items-center gap-2">
              <School className="h-4 w-4" />
              Schools
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Layers3 className="h-4 w-4" />
              Features
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {overviewCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {card.title}
                      </CardTitle>
                      <Icon className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {card.value}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {card.description}
                      </p>
                      <div className="flex items-center mt-2">
                        <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                        <span className="text-xs text-green-500">{card.trend}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common administrative tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  onClick={() => setActiveTab("schools")}
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  data-testid="button-create-school"
                >
                  <School className="h-6 w-6" />
                  <span>Create New School</span>
                </Button>
                <Button 
                  onClick={() => setActiveTab("invoices")}
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  data-testid="button-create-invoice"
                >
                  <FileText className="h-6 w-6" />
                  <span>Generate Invoice</span>
                </Button>
                <Button 
                  onClick={() => setActiveTab("features")}
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  data-testid="button-manage-features"
                >
                  <Layers3 className="h-6 w-6" />
                  <span>Manage Features</span>
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Schools</CardTitle>
                  <CardDescription>
                    Latest registered schools
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* This will show recent schools */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Demo School</p>
                        <p className="text-sm text-slate-600">K12 Curriculum</p>
                      </div>
                      <Badge variant="outline" className="text-green-600">
                        Active
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Status</CardTitle>
                  <CardDescription>
                    School payment overview
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Paid Schools</span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Pending Payment</span>
                      <span className="font-medium">1</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Overdue</span>
                      <span className="font-medium text-red-600">0</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Schools Management Tab */}
          <TabsContent value="schools">
            <SchoolsManagement />
          </TabsContent>

          {/* Invoices Management Tab */}
          <TabsContent value="invoices">
            <InvoicesManagement />
          </TabsContent>

          {/* Features Management Tab */}
          <TabsContent value="features">
            <FeaturesManagement />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <SettingsManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}