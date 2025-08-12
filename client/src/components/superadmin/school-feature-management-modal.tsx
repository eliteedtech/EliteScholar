import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings, Link, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface School {
  id: string;
  name: string;
  shortName: string;
}

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
  menuLinks: MenuLink[];
  enabled: boolean;
}

interface SchoolFeatureManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  school: School | null;
}

export default function SchoolFeatureManagementModal({ 
  isOpen, 
  onClose, 
  school 
}: SchoolFeatureManagementModalProps) {
  const [modifiedMenuLinks, setModifiedMenuLinks] = useState<Record<string, MenuLink[]>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch school features with menu links
  const { data: schoolFeatures = [], isLoading } = useQuery({
    queryKey: ["/api/superadmin/schools", school?.id, "features-with-menu"],
    enabled: !!school?.id && isOpen,
  });

  // Fetch school feature setup (customized menu links)
  const { data: schoolFeatureSetup = [] } = useQuery({
    queryKey: ["/api/superadmin/schools", school?.id, "feature-setup"],
    enabled: !!school?.id && isOpen,
  });

  // Mutation to update school feature setup
  const updateFeatureSetupMutation = useMutation({
    mutationFn: async ({ schoolId, featureId, menuLinks }: { 
      schoolId: string; 
      featureId: string; 
      menuLinks: MenuLink[] 
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
      toast({
        title: "Success",
        description: "Feature menu links updated successfully",
      });
    },
    onError: (error) => {
      console.error("Update feature setup error:", error);
      toast({
        title: "Error", 
        description: "Failed to update feature menu links",
        variant: "destructive",
      });
    },
  });

  const handleMenuLinkToggle = (featureId: string, linkIndex: number, enabled: boolean) => {
    const feature = schoolFeatures.find((f: Feature) => f.id === featureId);
    if (!feature) return;

    const currentLinks = modifiedMenuLinks[featureId] || feature.menuLinks;
    const updatedLinks = currentLinks.map((link, index) => 
      index === linkIndex ? { ...link, enabled } : link
    );

    setModifiedMenuLinks(prev => ({
      ...prev,
      [featureId]: updatedLinks
    }));
  };

  const handleSaveFeature = async (featureId: string) => {
    if (!school?.id) return;
    
    const menuLinks = modifiedMenuLinks[featureId];
    if (!menuLinks) return;

    await updateFeatureSetupMutation.mutateAsync({
      schoolId: school.id,
      featureId,
      menuLinks
    });
  };

  const handleSaveAll = async () => {
    if (!school?.id) return;

    try {
      for (const [featureId, menuLinks] of Object.entries(modifiedMenuLinks)) {
        await updateFeatureSetupMutation.mutateAsync({
          schoolId: school.id,
          featureId,
          menuLinks
        });
      }
      
      setModifiedMenuLinks({});
      toast({
        title: "Success",
        description: "All feature configurations saved successfully",
      });
    } catch (error) {
      console.error("Save all error:", error);
      toast({
        title: "Error",
        description: "Failed to save some configurations",
        variant: "destructive",
      });
    }
  };

  const getMenuLinksForFeature = (feature: Feature) => {
    return modifiedMenuLinks[feature.id] || feature.menuLinks || [];
  };

  const hasModifications = Object.keys(modifiedMenuLinks).length > 0;

  if (!school) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Feature Management - {school.name}
          </DialogTitle>
          <DialogDescription>
            Configure menu links and settings for each feature assigned to this school.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Manage which menu links are visible for each feature
          </div>
          {hasModifications && (
            <Button 
              onClick={handleSaveAll} 
              disabled={updateFeatureSetupMutation.isPending}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save All Changes
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1 max-h-[60vh]">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-4 border rounded-lg animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : schoolFeatures.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Features Assigned</h3>
              <p className="text-gray-600">
                This school doesn't have any features assigned. Assign features first from the Feature Assignment page.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {schoolFeatures.map((feature: Feature) => {
                const menuLinks = getMenuLinksForFeature(feature);
                const hasChanges = modifiedMenuLinks[feature.id];
                
                return (
                  <div key={feature.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{feature.name}</h3>
                          {feature.description && (
                            <p className="text-sm text-gray-600">{feature.description}</p>
                          )}
                        </div>
                        <Badge variant={feature.enabled ? "default" : "secondary"}>
                          {feature.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      
                      {hasChanges && (
                        <Button 
                          size="sm" 
                          onClick={() => handleSaveFeature(feature.id)}
                          disabled={updateFeatureSetupMutation.isPending}
                          className="flex items-center gap-1"
                        >
                          <Save className="h-3 w-3" />
                          Save
                        </Button>
                      )}
                    </div>

                    {feature.enabled && (
                      <>
                        <Separator className="mb-4" />
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <Link className="h-4 w-4" />
                            Menu Links ({menuLinks.filter(l => l.enabled !== false).length} active)
                          </h4>
                          
                          {menuLinks.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">
                              No menu links configured for this feature
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {menuLinks.map((link, index) => (
                                <div 
                                  key={index}
                                  className={`flex items-center justify-between p-3 border rounded-md ${
                                    link.enabled === false ? 'bg-gray-50 opacity-60' : 'bg-white'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <i className={`${link.icon} text-gray-500 w-4`}></i>
                                    <span className="font-medium">{link.name}</span>
                                  </div>
                                  
                                  <Checkbox
                                    checked={link.enabled !== false}
                                    onCheckedChange={(checked) => 
                                      handleMenuLinkToggle(feature.id, index, !!checked)
                                    }
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-1" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}