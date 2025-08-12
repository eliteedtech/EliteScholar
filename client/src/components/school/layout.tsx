import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Menu,
  Search,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Home,
  Users,
  BookOpen,
  Calendar,
  School,
  GraduationCap,
  Star,
  Moon,
  Sun
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface SchoolLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

interface Feature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

interface NavItem {
  id: string;
  name: string;
  href: string;
  icon: React.ReactNode;
  children?: NavItem[];
  isFavorite?: boolean;
}

export default function SchoolLayout({ children, title, subtitle }: SchoolLayoutProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Fetch enabled features for the school
  const { data: features = [] } = useQuery<Feature[]>({
    queryKey: ["/api/schools/features"],
  });

  // Parse feature descriptions to generate navigation items
  const parseFeatureDescription = (feature: Feature): NavItem[] => {
    if (!feature.description) return [];

    const children: NavItem[] = [];
    const description = feature.description.toLowerCase();

    // Parse description and create appropriate child items
    if (description.includes('manage') || description.includes('list')) {
      children.push({
        id: `${feature.id}-list`,
        name: `${feature.name} List`,
        href: `/school/features/${feature.id}/list`,
        icon: <BookOpen className="h-4 w-4" />,
      });
    }

    if (description.includes('create') || description.includes('add')) {
      children.push({
        id: `${feature.id}-create`,
        name: `Create ${feature.name.replace(' Management', '')}`,
        href: `/school/features/${feature.id}/create`,
        icon: <Users className="h-4 w-4" />,
      });
    }

    if (description.includes('assignment') || description.includes('assign')) {
      children.push({
        id: `${feature.id}-assignments`,
        name: 'Assignments',
        href: `/school/features/${feature.id}/assignments`,
        icon: <GraduationCap className="h-4 w-4" />,
      });
    }

    if (description.includes('schedule') || description.includes('timetable')) {
      children.push({
        id: `${feature.id}-schedules`,
        name: 'Schedules',
        href: `/school/features/${feature.id}/schedules`,
        icon: <Calendar className="h-4 w-4" />,
      });
    }

    if (description.includes('type') && feature.name.includes('Staff')) {
      children.push({
        id: `${feature.id}-types`,
        name: 'Staff Types',
        href: `/school/features/${feature.id}/types`,
        icon: <Settings className="h-4 w-4" />,
      });
    }

    return children;
  };

  // Generate navigation items from features
  const generateNavigation = (): NavItem[] => {
    const baseNavigation: NavItem[] = [
      {
        id: 'dashboard',
        name: 'Dashboard',
        href: '/school',
        icon: <Home className="h-4 w-4" />,
        isFavorite: true,
      },
      {
        id: 'academic-years',
        name: 'Academic Years',
        href: '/school/academic-years',
        icon: <Calendar className="h-4 w-4" />,
      },
    ];

    // Add feature-based navigation
    const featureNavigation: NavItem[] = features
      .filter(f => f.enabled)
      .map(feature => {
        const children = parseFeatureDescription(feature);
        return {
          id: feature.id,
          name: feature.name,
          href: `/school/features/${feature.id}`,
          icon: getFeatureIcon(feature.name),
          children: children.length > 0 ? children : undefined,
        };
      });

    return [...baseNavigation, ...featureNavigation];
  };

  const getFeatureIcon = (featureName: string) => {
    if (featureName.toLowerCase().includes('staff')) return <Users className="h-4 w-4" />;
    if (featureName.toLowerCase().includes('student')) return <GraduationCap className="h-4 w-4" />;
    if (featureName.toLowerCase().includes('class')) return <School className="h-4 w-4" />;
    if (featureName.toLowerCase().includes('subject')) return <BookOpen className="h-4 w-4" />;
    return <Settings className="h-4 w-4" />;
  };

  const navigation = generateNavigation();

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isActive = (href: string) => {
    if (href === '/school' && location === '/school') return true;
    if (href !== '/school' && location.startsWith(href)) return true;
    return false;
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/school-login";
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // You can implement actual dark mode toggle here
  };

  const filteredNavigation = navigation.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.children?.some(child => 
      child.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className={cn("min-h-screen flex bg-slate-50", darkMode && "dark")}>
      {/* Sidebar */}
      <div className={cn(
        "transition-all duration-300 bg-white shadow-lg border-r border-slate-200",
        sidebarOpen ? "w-64" : "w-16"
      )}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <School className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-slate-900">Elite Scholar</h1>
                  <p className="text-xs text-slate-500">School Portal</p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              data-testid="sidebar-toggle"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* School Info */}
        {sidebarOpen && (
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src="https://via.placeholder.com/40" />
                <AvatarFallback>SC</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  Demo School
                </p>
                <p className="text-xs text-slate-500">
                  Branch: Main Campus
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        {sidebarOpen && (
          <div className="p-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search features..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="search-features"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className={cn("flex-1", sidebarOpen ? "h-[calc(100vh-280px)]" : "h-[calc(100vh-120px)]")}>
          <div className="p-2">
            {filteredNavigation.map((item) => (
              <div key={item.id} className="mb-1">
                {item.children ? (
                  <Collapsible
                    open={expandedItems.includes(item.id)}
                    onOpenChange={() => toggleExpanded(item.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <div
                        className={cn(
                          "flex items-center w-full px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors hover:bg-slate-100",
                          isActive(item.href) && "bg-primary/10 text-primary font-medium"
                        )}
                        data-testid={`nav-item-${item.id}`}
                      >
                        {item.icon}
                        {sidebarOpen && (
                          <>
                            <span className="ml-3 flex-1 text-left">{item.name}</span>
                            {item.isFavorite && <Star className="h-3 w-3 text-yellow-500 mr-2" />}
                            {expandedItems.includes(item.id) ? 
                              <ChevronDown className="h-4 w-4" /> : 
                              <ChevronRight className="h-4 w-4" />
                            }
                          </>
                        )}
                      </div>
                    </CollapsibleTrigger>
                    {sidebarOpen && (
                      <CollapsibleContent className="ml-6 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <div
                            key={child.id}
                            className={cn(
                              "flex items-center px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors hover:bg-slate-100",
                              isActive(child.href) && "bg-primary/10 text-primary font-medium"
                            )}
                            onClick={() => setLocation(child.href)}
                            data-testid={`nav-child-${child.id}`}
                          >
                            {child.icon}
                            <span className="ml-3">{child.name}</span>
                          </div>
                        ))}
                      </CollapsibleContent>
                    )}
                  </Collapsible>
                ) : (
                  <div
                    className={cn(
                      "flex items-center px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors hover:bg-slate-100",
                      isActive(item.href) && "bg-primary/10 text-primary font-medium"
                    )}
                    onClick={() => setLocation(item.href)}
                    data-testid={`nav-item-${item.id}`}
                  >
                    {item.icon}
                    {sidebarOpen && (
                      <>
                        <span className="ml-3">{item.name}</span>
                        {item.isFavorite && <Star className="h-3 w-3 text-yellow-500 ml-auto" />}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900" data-testid="page-title">
                {title}
              </h2>
              {subtitle && (
                <p className="text-slate-600 mt-1" data-testid="page-subtitle">
                  {subtitle}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {/* Academic Period Indicator */}
              <div className="hidden md:flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-600">Term 1, Week 5</span>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Dark Mode Toggle */}
              <Button variant="ghost" size="sm" onClick={toggleDarkMode}>
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                <Badge variant="destructive" className="absolute -top-1 -right-1 w-5 h-5 text-xs">
                  3
                </Badge>
              </Button>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="https://via.placeholder.com/32" />
                  <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-slate-900">
                    {user?.name}
                  </p>
                  <p className="text-xs text-slate-500 capitalize">
                    {user?.role?.replace('_', ' ')}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="logout-button">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto" data-testid="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}