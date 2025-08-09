import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function StatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/superadmin/stats"],
    queryFn: () => api.superadmin.getStats(),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-slate-200 rounded mb-3"></div>
              <div className="h-8 bg-slate-200 rounded mb-4"></div>
              <div className="h-3 bg-slate-200 rounded w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsCards = [
    {
      title: "Total Schools",
      value: stats?.totalSchools || 0,
      icon: "fas fa-school",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      change: "+12% from last month",
      changeColor: "text-green-600",
    },
    {
      title: "Active Subscriptions",
      value: stats?.activeSubscriptions || 0,
      icon: "fas fa-check-circle",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      change: "96.7% paid on time",
      changeColor: "text-green-600",
    },
    {
      title: "Pending Invoices",
      value: stats?.pendingInvoices || 0,
      icon: "fas fa-clock",
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      change: "₦2.4M pending",
      changeColor: "text-yellow-600",
    },
    {
      title: "Monthly Revenue",
      value: `₦${parseFloat(stats?.monthlyRevenue || "0").toLocaleString()}`,
      icon: "fas fa-chart-line",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      change: "+8.2% from last month",
      changeColor: "text-green-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-testid="stats-cards">
      {statsCards.map((stat, index) => (
        <Card key={index} className="bg-white rounded-xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium" data-testid={`stat-title-${index}`}>
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-slate-900" data-testid={`stat-value-${index}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`w-12 h-12 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                <i className={`${stat.icon} ${stat.iconColor} text-xl`}></i>
              </div>
            </div>
            <div className="mt-4">
              <span className={`text-sm font-medium ${stat.changeColor}`} data-testid={`stat-change-${index}`}>
                {stat.change}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
