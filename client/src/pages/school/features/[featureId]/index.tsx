import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, Users, Calendar, BookOpen } from "lucide-react";
import { SchoolLayout } from "@/components/school";

interface Feature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

interface FeatureAction {
  id: string;
  name: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: string;
}

export default function FeatureOverview() {
  const { featureId } = useParams();

  // Fetch feature details
  const { data: feature } = useQuery<Feature>({
    queryKey: [`/api/features/${featureId}`],
  });

  // Generate feature actions based on description
  const generateActions = (feature: Feature): FeatureAction[] => {
    if (!feature) return [];

    const actions: FeatureAction[] = [];
    const description = feature.description.toLowerCase();

    if (description.includes('manage') || description.includes('list')) {
      actions.push({
        id: 'list',
        name: `View ${feature.name.replace(' Management', '')} List`,
        description: `Browse and manage all ${feature.name.replace(' Management', '').toLowerCase()} records`,
        href: `/school/features/${featureId}/list`,
        icon: <BookOpen className="h-5 w-5" />,
        color: 'bg-blue-500',
      });
    }

    if (description.includes('create') || description.includes('add')) {
      actions.push({
        id: 'create',
        name: `Create New ${feature.name.replace(' Management', '')}`,
        description: `Add a new ${feature.name.replace(' Management', '').toLowerCase()} record`,
        href: `/school/features/${featureId}/create`,
        icon: <Plus className="h-5 w-5" />,
        color: 'bg-green-500',
      });
    }

    if (description.includes('assignment') || description.includes('assign')) {
      actions.push({
        id: 'assignments',
        name: 'Assignments',
        description: 'Manage assignments and allocations',
        href: `/school/features/${featureId}/assignments`,
        icon: <Users className="h-5 w-5" />,
        color: 'bg-purple-500',
      });
    }

    if (description.includes('schedule') || description.includes('timetable')) {
      actions.push({
        id: 'schedules',
        name: 'Schedules',
        description: 'View and manage schedules and timetables',
        href: `/school/features/${featureId}/schedules`,
        icon: <Calendar className="h-5 w-5" />,
        color: 'bg-orange-500',
      });
    }

    if (description.includes('type') && feature.name.includes('Staff')) {
      actions.push({
        id: 'types',
        name: 'Staff Types',
        description: 'Manage different types of staff positions',
        href: `/school/features/${featureId}/types`,
        icon: <Settings className="h-5 w-5" />,
        color: 'bg-indigo-500',
      });
    }

    return actions;
  };

  const actions = feature ? generateActions(feature) : [];

  if (!feature) {
    return (
      <SchoolLayout title="Loading..." subtitle="Please wait">
        <div>Loading feature...</div>
      </SchoolLayout>
    );
  }

  return (
    <SchoolLayout 
      title={feature.name}
      subtitle={`Manage ${feature.name.replace(' Management', '').toLowerCase()} for your school`}
    >
      <div className="space-y-6">
        {/* Feature Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {feature.name}
                  <Badge variant={feature.enabled ? "default" : "secondary"}>
                    {feature.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </CardTitle>
                <CardDescription className="mt-2">
                  {feature.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Feature Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {actions.map((action) => (
            <Card 
              key={action.id}
              className="cursor-pointer hover:shadow-md transition-shadow group"
              onClick={() => window.location.href = action.href}
              data-testid={`feature-action-${action.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${action.color} text-white`}>
                    {action.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                      {action.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {action.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-primary">0</div>
                <div className="text-sm text-muted-foreground">Total Records</div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">0</div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">0</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SchoolLayout>
  );
}