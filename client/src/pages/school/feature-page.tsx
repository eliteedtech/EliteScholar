import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import SchoolLayout from "@/components/school/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowLeft, Settings, FileX } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface Feature {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  menuLinks?: {
    name: string;
    href: string;
    icon?: string;
    enabled?: boolean;
  }[];
}

export default function FeaturePage() {
  const { featureName, page } = useParams<{ featureName: string; page?: string }>();
  const { user } = useAuth();
  
  // Fetch enabled features for the school to find the matching feature
  const { data: features = [], isLoading } = useQuery<Feature[]>({
    queryKey: ["/api/schools/features"],
    queryFn: () => {
      const schoolId = user?.schoolId;
      if (!schoolId) {
        console.error("No school ID found for user");
        return [];
      }
      return fetch(`/api/schools/features?schoolId=${schoolId}`)
        .then(res => res.json());
    },
    enabled: !!user?.schoolId,
  });

  if (isLoading) {
    return (
      <SchoolLayout title="Loading..." subtitle="Please wait">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading feature...</p>
          </div>
        </div>
      </SchoolLayout>
    );
  }

  // Find the feature by matching the URL-friendly feature name with the feature key
  const feature = features.find(f => {
    const urlFriendlyKey = f.key.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return urlFriendlyKey === featureName;
  });

  if (!feature) {
    return (
      <SchoolLayout title="Feature Not Found" subtitle="The requested feature could not be found">
        <div className="flex flex-col items-center justify-center min-h-[500px] text-center">
          <FileX className="h-24 w-24 text-gray-400 mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Feature Not Found</h1>
          <p className="text-gray-600 mb-6 max-w-md">
            The feature "{featureName}" is not available or has not been assigned to your school.
          </p>
          <Button onClick={() => window.history.back()} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>
      </SchoolLayout>
    );
  }

  // Check if the specific page exists in menu links
  const currentPage = page || 'dashboard';
  const menuLink = feature.menuLinks?.find(link => {
    const linkPage = link.href.split('/').pop() || 'dashboard';
    return linkPage === currentPage;
  });

  return (
    <SchoolLayout 
      title={feature.name} 
      subtitle={page ? `${page.charAt(0).toUpperCase() + page.slice(1)} Page` : "Feature Overview"}
    >
      <div className="space-y-6">
        {/* Feature Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {feature.name}
                  <Badge variant="default">Enabled</Badge>
                </CardTitle>
                <CardDescription className="mt-2">
                  {feature.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Page Not Created Notice */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Page Under Development
            </CardTitle>
            <CardDescription className="text-orange-700">
              The "{currentPage}" page for {feature.name} has not been created yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <h4 className="font-medium text-gray-900 mb-2">Current URL:</h4>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                  /school/{featureName}/{currentPage}
                </code>
              </div>
              
              {feature.menuLinks && feature.menuLinks.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-orange-200">
                  <h4 className="font-medium text-gray-900 mb-3">Available Menu Links:</h4>
                  <div className="space-y-2">
                    {feature.menuLinks.map((link, index) => {
                      const linkPage = link.href.split('/').pop() || 'dashboard';
                      const isCurrentPage = linkPage === currentPage;
                      return (
                        <div key={index} className={`flex items-center justify-between p-2 rounded ${isCurrentPage ? 'bg-orange-100' : 'bg-gray-50'}`}>
                          <div className="flex items-center gap-2">
                            <i className={link.icon || 'fas fa-circle'} />
                            <span className="font-medium">{link.name}</span>
                            {isCurrentPage && <Badge variant="secondary" className="text-xs">Current</Badge>}
                          </div>
                          <code className="text-xs text-gray-600">{link.href}</code>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <div className="text-sm text-orange-700">
                <p className="font-medium">To create this page:</p>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Create a component for the "{currentPage}" page</li>
                  <li>Add routing logic to handle this specific feature page</li>
                  <li>Implement the feature functionality</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Information */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Feature Key</label>
                <p className="mt-1 text-sm text-gray-900">{feature.key}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">URL Pattern</label>
                <p className="mt-1 text-sm text-gray-900">/school/{featureName}/*</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <p className="mt-1">
                  <Badge variant="default">
                    {feature.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Menu Links</label>
                <p className="mt-1 text-sm text-gray-900">
                  {feature.menuLinks?.length || 0} configured
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SchoolLayout>
  );
}