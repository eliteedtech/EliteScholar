import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, DollarSign, FileText, Calendar } from "lucide-react";
import SuperAdminLayout from "@/components/superadmin/layout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

interface AnalyticsData {
  totalSchools: number;
  activeSchools: number;
  totalRevenue: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    invoices: number;
  }>;
  topFeatures: Array<{
    name: string;
    purchaseCount: number;
    revenue: number;
  }>;
  schoolDistribution: Array<{
    type: string;
    count: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics"],
  });

  if (isLoading) {
    return (
      <SuperAdminLayout title="Analytics" subtitle="View system performance and insights">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-8 bg-slate-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-48 bg-slate-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  if (!analytics) {
    return (
      <SuperAdminLayout title="Analytics" subtitle="View system performance and insights">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              Failed to load analytics data
            </div>
          </CardContent>
        </Card>
      </SuperAdminLayout>
    );
  }

  const paymentSuccessRate = analytics.totalInvoices > 0 
    ? ((analytics.paidInvoices / analytics.totalInvoices) * 100).toFixed(1)
    : "0";

  const activeSchoolRate = analytics.totalSchools > 0
    ? ((analytics.activeSchools / analytics.totalSchools) * 100).toFixed(1)
    : "0";

  return (
    <SuperAdminLayout title="Analytics Dashboard" subtitle="View system performance and insights">
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card data-testid="card-total-schools">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-schools">
                {analytics.totalSchools}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className={`inline-flex items-center ${
                  parseFloat(activeSchoolRate) >= 80 ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {parseFloat(activeSchoolRate) >= 80 ? (
                    <TrendingUp className="mr-1 h-3 w-3" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3" />
                  )}
                  {activeSchoolRate}% active
                </span>
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-revenue">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-revenue">
                ₦{analytics.totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                From {analytics.paidInvoices} paid invoices
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-invoices">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-invoices">
                {analytics.totalInvoices}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className={`inline-flex items-center ${
                  parseFloat(paymentSuccessRate) >= 70 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {parseFloat(paymentSuccessRate) >= 70 ? (
                    <TrendingUp className="mr-1 h-3 w-3" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3" />
                  )}
                  {paymentSuccessRate}% paid
                </span>
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-pending-invoices">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-pending-invoices">
                {analytics.pendingInvoices + analytics.overdueInvoices}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.overdueInvoices > 0 && (
                  <span className="text-red-600">
                    {analytics.overdueInvoices} overdue
                  </span>
                )}
                {analytics.overdueInvoices === 0 && (
                  <span className="text-green-600">All current</span>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by Month */}
          <Card data-testid="card-revenue-chart">
            <CardHeader>
              <CardTitle>Revenue by Month</CardTitle>
              <CardDescription>
                Monthly revenue and invoice trends over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'revenue' ? `₦${value.toLocaleString()}` : value,
                      name === 'revenue' ? 'Revenue' : 'Invoices'
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" name="revenue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Features */}
          <Card data-testid="card-top-features">
            <CardHeader>
              <CardTitle>Top Features</CardTitle>
              <CardDescription>
                Most purchased features by schools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topFeatures.slice(0, 5).map((feature, index) => (
                  <div key={feature.name} className="flex items-center justify-between" data-testid={`feature-${index}`}>
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{feature.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {feature.purchaseCount} purchases
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₦{feature.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* School Distribution */}
          <Card data-testid="card-school-distribution">
            <CardHeader>
              <CardTitle>School Distribution</CardTitle>
              <CardDescription>
                Schools by curriculum type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.schoolDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analytics.schoolDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Invoice Status Overview */}
          <Card data-testid="card-invoice-status">
            <CardHeader>
              <CardTitle>Invoice Status Overview</CardTitle>
              <CardDescription>
                Current status of all invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium">Paid</span>
                  </div>
                  <span className="font-bold text-green-700" data-testid="text-paid-count">
                    {analytics.paidInvoices}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="font-medium">Pending</span>
                  </div>
                  <span className="font-bold text-yellow-700" data-testid="text-pending-count">
                    {analytics.pendingInvoices}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="font-medium">Overdue</span>
                  </div>
                  <span className="font-bold text-red-700" data-testid="text-overdue-count">
                    {analytics.overdueInvoices}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SuperAdminLayout>
  );
}