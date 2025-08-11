import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth";
import { useAuth } from "@/hooks/use-auth";

interface LayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export default function SuperAdminLayout({ title, subtitle, children }: LayoutProps) {
  const [location] = useLocation();
  const { logout } = useAuthStore();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const navigation = [
    {
      name: "Schools",
      href: "/superadmin/schools",
      icon: "fas fa-school",
      // count: 127,
      active: location === "/" || location === "/superadmin" || location === "/superadmin/schools",
    },
    {
      name: "Invoices",
      href: "/superadmin/invoices",
      icon: "fas fa-file-invoice-dollar",
      // count: 42,
      active: location === "/superadmin/invoices",
    },
    {
      name: "Enhanced Invoices",
      href: "/superadmin/invoices-enhanced",
      icon: "fas fa-file-invoice",
      active: location === "/superadmin/invoices-enhanced",
    },
    {
      name: "Features",
      href: "/superadmin/features",
      icon: "fas fa-cogs",
      active: location === "/superadmin/features",
    },
    {
      name: "Analytics",
      href: "/superadmin/analytics",
      icon: "fas fa-chart-bar",
      active: location === "/superadmin/analytics",
    },
    {
      name: "Users",
      href: "/superadmin/users",
      icon: "fas fa-users",
      active: location === "/superadmin/users",
    },
    {
      name: "Settings",
      href: "/superadmin/settings",
      icon: "fas fa-cog",
      active: location === "/superadmin/settings",
    },
    {
      name: "Enhanced Settings",
      href: "/superadmin/settings-enhanced",
      icon: "fas fa-cogs",
      active: location === "/superadmin/settings-enhanced",
    },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <nav className="bg-white shadow-lg w-64 min-h-screen" data-testid="sidebar-navigation">
        <div className="p-6">
          {/* Elite Scholar Logo */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <i className="fas fa-graduation-cap text-white text-lg"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Elite Scholar</h1>
              <p className="text-xs text-slate-500">Super Admin</p>
            </div>
          </div>

          {/* Navigation Menu */}
          <ul className="space-y-2">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link 
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    item.active
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                  data-testid={`nav-link-${item.name.toLowerCase()}`}
                >
                  <i className={`${item.icon} w-5`}></i>
                  <span>{item.name}</span>
                  {item.count && (
                    <Badge variant="secondary" className="ml-auto">
                      {item.count}
                    </Badge>
                  )}
                </Link>
              </li>
            ))}
          </ul>

          {/* Attribution */}
          <div className="mt-8 pt-8 border-t border-slate-200">
            <p className="text-xs text-slate-400 text-center">
              Powered by<br />
              <span className="font-semibold text-slate-600">Elite Edu Tech</span>
            </p>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4" data-testid="header">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900" data-testid="page-title">{title}</h2>
              <p className="text-slate-600" data-testid="page-subtitle">{subtitle}</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
                <Input
                  type="text"
                  placeholder="Search schools..."
                  className="pl-10 pr-4 py-2"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="search-input"
                />
              </div>

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative" data-testid="notifications-button">
                <i className="fas fa-bell text-slate-400"></i>
                <Badge variant="destructive" className="absolute -top-1 -right-1 w-5 h-5 text-xs">
                  3
                </Badge>
              </Button>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&h=150" />
                  <AvatarFallback>SA</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-slate-900" data-testid="user-name">
                    {user?.name || "Super Admin"}
                  </p>
                  <p className="text-sm text-slate-500" data-testid="user-email">
                    {user?.email || "admin@elitescholar.com"}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="logout-button">
                  <i className="fas fa-sign-out-alt text-slate-600"></i>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6" data-testid="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}
