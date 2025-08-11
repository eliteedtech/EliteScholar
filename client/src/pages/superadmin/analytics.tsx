import { useState } from "react";
import SuperAdminLayout from "../../components/superadmin/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Building, Users, Target, Download, Calendar } from "lucide-react";

// Mock data for charts and analytics
const mockMonthlyRevenue = [
  { month: "Jan", revenue: 125000, schools: 8 },
  { month: "Feb", revenue: 158000, schools: 12 },
  { month: "Mar", revenue: 142000, schools: 10 },
  { month: "Apr", revenue: 189000, schools: 15 },
  { month: "May", revenue: 178000, schools: 14 },
  { month: "Jun", revenue: 205000, schools: 18 },
];

const mockTopFeatures = [
  { name: "Attendance Tracking", schools: 23, revenue: 115000, growth: 12.5 },
  { name: "Grade Management", schools: 20, revenue: 100000, growth: 8.3 },
  { name: "Parent Portal", schools: 18, revenue: 90000, growth: 15.7 },
  { name: "Messaging System", schools: 15, revenue: 75000, growth: -2.1 },
  { name: "Analytics Dashboard", schools: 12, revenue: 60000, growth: 25.4 },
];

const mockSchoolData = [
  { name: "Greenfield Academy", students: 850, revenue: 45000, status: "ACTIVE", growth: 8.5 },
  { name: "Sunrise International", students: 720, revenue: 32000, status: "ACTIVE", growth: 12.3 },
  { name: "Elite Preparatory School", students: 1200, revenue: 58000, status: "ACTIVE", growth: -1.2 },
  { name: "Future Leaders Academy", students: 650, revenue: 28000, status: "ACTIVE", growth: 22.1 },
  { name: "Bright Minds School", students: 580, revenue: 25000, status: "SUSPENDED", growth: -8.5 },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("6months");
  const [selectedMetric, setSelectedMetric] = useState("revenue");

  const totalRevenue = mockMonthlyRevenue.reduce((sum, month) => sum + month.revenue, 0);
  const averageRevenuePerSchool = totalRevenue / mockMonthlyRevenue.reduce((sum, month) => sum + month.schools, 0);
  const topPerformingFeature = mockTopFeatures[0];
  const totalStudents = mockSchoolData.reduce((sum, school) => sum + school.students, 0);

  return (
    <SuperAdminLayout
      title="Analytics Dashboard"
      subtitle="Insights and performance metrics across all schools"
    >
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-48" data-testid="select-time-range">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
                <SelectItem value="2years">Last 2 Years</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-48" data-testid="select-metric">
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="schools">School Count</SelectItem>
                <SelectItem value="students">Student Count</SelectItem>
                <SelectItem value="features">Feature Adoption</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" data-testid="button-export-data">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button variant="outline" data-testid="button-schedule-report">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">₦{totalRevenue.toLocaleString()}</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+12.5%</span>
                  </div>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Schools</p>
                  <p className="text-2xl font-bold text-blue-600">{mockSchoolData.filter(s => s.status === "ACTIVE").length}</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
                    <span className="text-sm text-blue-600">+8.3%</span>
                  </div>
                </div>
                <Building className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-purple-600">{totalStudents.toLocaleString()}</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="h-4 w-4 text-purple-500 mr-1" />
                    <span className="text-sm text-purple-600">+15.7%</span>
                  </div>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Revenue/School</p>
                  <p className="text-2xl font-bold text-orange-600">₦{Math.round(averageRevenuePerSchool).toLocaleString()}</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="h-4 w-4 text-orange-500 mr-1" />
                    <span className="text-sm text-orange-600">+5.2%</span>
                  </div>
                </div>
                <Target className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart Simulation */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                📊 Interactive chart showing monthly revenue trends will be displayed here using Recharts
              </div>
              {mockMonthlyRevenue.map((month, index) => (
                <div key={month.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-gray-900 w-12">{month.month}</span>
                    <div className="w-64 bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-blue-600 h-3 rounded-full" 
                        style={{ width: `${(month.revenue / Math.max(...mockMonthlyRevenue.map(m => m.revenue))) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">₦{month.revenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">{month.schools} schools</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Features */}
          <Card>
            <CardHeader>
              <CardTitle>Top Features by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTopFeatures.map((feature, index) => (
                  <div key={feature.name} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{feature.name}</h4>
                      <p className="text-sm text-gray-600">{feature.schools} schools • ₦{feature.revenue.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={feature.growth > 0 ? "default" : "destructive"}>
                        {feature.growth > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {Math.abs(feature.growth)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* School Performance */}
          <Card>
            <CardHeader>
              <CardTitle>School Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockSchoolData.map((school, index) => (
                  <div key={school.name} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{school.name}</h4>
                      <p className="text-sm text-gray-600">
                        {school.students} students • ₦{school.revenue.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <Badge variant={school.status === "ACTIVE" ? "default" : "secondary"}>
                        {school.status}
                      </Badge>
                      <Badge variant={school.growth > 0 ? "default" : "destructive"}>
                        {school.growth > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {Math.abs(school.growth)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Adoption Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Adoption Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>📈 Interactive line chart showing feature adoption over time will be displayed here</p>
              <p className="text-sm mt-2">Using Recharts for data visualization with filtering and drilling capabilities</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}