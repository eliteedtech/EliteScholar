import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Save, X, Link, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MenuLink {
  name: string;
  href: string;
  icon: string;
  enabled?: boolean;
}

interface Feature {
  id: string;
  key: string;
  name: string;
  description: string;
  menuLinks?: MenuLink[];
}

interface School {
  id: string;
  name: string;
  shortName: string;
}

interface SchoolFeatureMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  school: School | null;
  feature: Feature | null;
}

export default function SchoolFeatureMenuModal({ 
  isOpen, 
  onClose, 
  school,
  feature 
}: SchoolFeatureMenuModalProps) {
  const [selectedMenuLinks, setSelectedMenuLinks] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch current school feature setup
  const { data: schoolFeatureSetup, isLoading } = useQuery({
    queryKey: ["/api/superadmin/schools", school?.id, "feature-setup", feature?.id],
    enabled: !!(school?.id && feature?.id && isOpen),
  });

  useEffect(() => {
    if (schoolFeatureSetup) {
      // Extract enabled menu link names from the setup
      const enabledLinks = (schoolFeatureSetup.menuLinks || [])
        .filter((link: MenuLink) => link.enabled)
        .map((link: MenuLink) => link.name);
      setSelectedMenuLinks(enabledLinks);
    } else if (feature?.menuLinks) {
      // Default to all menu links enabled if no setup exists
      const allLinks = feature.menuLinks.map(link => link.name);
      setSelectedMenuLinks(allLinks);
    }
  }, [schoolFeatureSetup, feature]);

  // Update school feature setup mutation
  const updateSchoolFeatureSetupMutation = useMutation({
    mutationFn: async ({ schoolId, featureId, menuLinks }: {
      schoolId: string;
      featureId: string;
      menuLinks: MenuLink[];
    }) => {
      return apiRequest(`/api/superadmin/schools/${schoolId}/feature-setup`, {
        method: "PUT",
        body: { featureId, menuLinks },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/superadmin/schools", school?.id, "feature-setup"] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/schools/features"] 
      });
      toast({
        title: "Success",
        description: "School feature menu links updated successfully",
      });
      onClose();
    },
    onError: (error) => {
      console.error("Update school feature setup error:", error);
      toast({
        title: "Error", 
        description: "Failed to update school feature menu links",
        variant: "destructive",
      });
    },
  });

  const handleToggleMenuLink = (linkName: string) => {
    setSelectedMenuLinks(prev => 
      prev.includes(linkName)
        ? prev.filter(name => name !== linkName)
        : [...prev, linkName]
    );
  };

  const handleSave = () => {
    if (!school?.id || !feature?.id || !feature.menuLinks) return;

    // Create updated menu links with enabled/disabled status
    const updatedMenuLinks = feature.menuLinks.map(link => ({
      ...link,
      enabled: selectedMenuLinks.includes(link.name)
    }));

    updateSchoolFeatureSetupMutation.mutate({
      schoolId: school.id,
      featureId: feature.id,
      menuLinks: updatedMenuLinks
    });
  };

  if (!school || !feature) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configure Menu Links - {feature.name}
          </DialogTitle>
          <DialogDescription>
            Select which menu links should be available for {school.name} when using the {feature.name} feature
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{school.shortName}</Badge>
            <span className="text-sm font-medium">{school.name}</span>
          </div>
          <Badge variant="default">{feature.name}</Badge>
        </div>

        <ScrollArea className="flex-1 max-h-[50vh]">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {feature.menuLinks && feature.menuLinks.length > 0 ? (
                feature.menuLinks.map((link, index) => (
                  <Card 
                    key={index} 
                    className={`transition-all ${
                      selectedMenuLinks.includes(link.name) 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'opacity-60'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={selectedMenuLinks.includes(link.name)}
                          onCheckedChange={() => handleToggleMenuLink(link.name)}
                          data-testid={`checkbox-menu-link-${index}`}
                        />
                        <div className="flex items-center gap-3 flex-1">
                          <i className={`${link.icon} text-gray-600`} />
                          <div>
                            <div className="font-medium text-sm">{link.name}</div>
                            <div className="text-xs text-gray-500">{link.href}</div>
                          </div>
                        </div>
                        <Badge 
                          variant={selectedMenuLinks.includes(link.name) ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {selectedMenuLinks.includes(link.name) ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <Link className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Menu Links Available
                  </h3>
                  <p className="text-gray-600">
                    This feature doesn't have any configured menu links yet. 
                    Ask your administrator to add menu links for this feature.
                  </p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="border-t pt-4">
          <div className="text-sm text-gray-600 mb-3">
            {selectedMenuLinks.length} of {feature.menuLinks?.length || 0} menu links enabled
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={updateSchoolFeatureSetupMutation.isPending}
            >
              <Save className="h-4 w-4 mr-1" />
              {updateSchoolFeatureSetupMutation.isPending ? 'Saving...' : 'Save Menu Links'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}