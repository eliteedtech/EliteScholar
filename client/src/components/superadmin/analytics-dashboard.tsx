import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Users, DollarSign, School, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AnalyticsDashboard() {
  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["/api/analytics"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const analytics = analyticsData || {};

  const statsCards = [
    {
      title: "Total Schools",
      value: analytics.totalSchools || 0,
      icon: School,
      change: "+2 this month"
    },
    {
      title: "Active Schools",
      value: analytics.activeSchools || 0,
      icon: Users,
      change: "+1 this month"
    },
    {
      title: "Total Revenue",
      value: `₦${analytics.totalRevenue || 0}`,
      icon: DollarSign,
      change: "+15% from last month"
    },
    {
      title: "Pending Invoices",
      value: analytics.pendingInvoices || 0,
      icon: FileText,
      change: "2 overdue"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics Dashboard</h2>
        <p className="text-slate-600 dark:text-slate-400">System performance and insights</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white" data-testid={`stat-${index}`}>
                  {stat.value}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Schools by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Schools by Status</CardTitle>
            <CardDescription>Distribution of school payment status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(analytics.schoolsByStatus || []).map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{item.status}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${(item.count / analytics.totalSchools) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Invoice Status */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Status</CardTitle>
            <CardDescription>Current invoice status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(analytics.invoiceStatus || []).map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{item.status}</Badge>
                  </div>
                  <span className="text-sm font-medium">{item.count}</span>
                </div>
              ))}
              {(!analytics.invoiceStatus || analytics.invoiceStatus.length === 0) && (
                <p className="text-slate-500 text-center py-4">No invoice data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue Trend</CardTitle>
          <CardDescription>Revenue over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            {(analytics.monthlyRevenue || []).length > 0 ? (
              <div className="w-full">
                <div className="flex items-end gap-4 h-48">
                  {analytics.monthlyRevenue.map((month: any, index: number) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="bg-primary rounded-t w-full min-h-[20px]"
                        style={{
                          height: `${Math.max(20, (month.revenue / Math.max(...analytics.monthlyRevenue.map((m: any) => m.revenue))) * 200)}px`
                        }}
                      ></div>
                      <span className="text-xs mt-2">{month.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-500">No revenue data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feature Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Usage</CardTitle>
          <CardDescription>Most popular features across schools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(analytics.featureUsage || []).map((feature: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">{feature.featureName}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(feature.usage / analytics.totalSchools) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{feature.usage} schools</span>
                </div>
              </div>
            ))}
            {(!analytics.featureUsage || analytics.featureUsage.length === 0) && (
              <p className="text-slate-500 text-center py-4">No feature usage data available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}