import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X, Link, Settings, Plus, Edit2, Trash2 } from "lucide-react";
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
  feature?: Feature | null;
}

const defaultIcons = [
  "fas fa-home",
  "fas fa-dashboard",
  "fas fa-chart-bar",
  "fas fa-users",
  "fas fa-cog",
  "fas fa-book",
  "fas fa-graduation-cap",
  "fas fa-calendar",
  "fas fa-file-alt",
  "fas fa-bell",
];

export default function SchoolFeatureMenuModal({ 
  isOpen, 
  onClose, 
  school,
  feature = null
}: SchoolFeatureMenuModalProps) {
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(feature);
  const [selectedMenuLinks, setSelectedMenuLinks] = useState<string[]>([]);
  const [customMenuLinks, setCustomMenuLinks] = useState<MenuLink[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newMenuLink, setNewMenuLink] = useState<MenuLink>({
    name: "",
    href: "",
    icon: "fas fa-home",
    enabled: true,
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all features
  const { data: allFeatures, isLoading: featuresLoading } = useQuery({
    queryKey: ["/api/superadmin/features"],
    enabled: isOpen,
  });

  // Fetch current school feature setup for selected feature
  const { data: schoolFeatureSetup, isLoading } = useQuery({
    queryKey: ["/api/superadmin/schools", school?.id, "feature-setup", selectedFeature?.id],
    enabled: !!(school?.id && selectedFeature?.id && isOpen),
  });

  useEffect(() => {
    if (schoolFeatureSetup && schoolFeatureSetup.menuLinks) {
      // Parse menu links from JSON string if needed
      let menuLinks = schoolFeatureSetup.menuLinks;
      if (typeof menuLinks === 'string') {
        try {
          menuLinks = JSON.parse(menuLinks);
        } catch (e) {
          console.error('Failed to parse menu links:', e);
          menuLinks = [];
        }
      }
      
      // Use only database menu links - no defaults
      const enabledLinks = (menuLinks || [])
        .filter((link: MenuLink) => link.enabled)
        .map((link: MenuLink) => link.name);
      
      setSelectedMenuLinks(enabledLinks);
      setCustomMenuLinks(menuLinks || []);
    } else {
      // If no setup exists, start with empty state - no defaults
      setSelectedMenuLinks([]);
      setCustomMenuLinks([]);
    }
  }, [schoolFeatureSetup, selectedFeature]);

  // Set initial feature if provided
  useEffect(() => {
    if (feature && !selectedFeature) {
      setSelectedFeature(feature);
    }
  }, [feature, selectedFeature]);

  // Update school feature setup mutation
  const updateSchoolFeatureSetupMutation = useMutation({
    mutationFn: async ({ schoolId, featureId, menuLinks }: {
      schoolId: string;
      featureId: string;
      menuLinks: MenuLink[];
    }) => {
      console.log('Updating school feature setup:', { schoolId, featureId, menuLinks });
      const response = await apiRequest("PUT", `/api/superadmin/schools/${schoolId}/feature-setup`, {
        featureId,
        menuLinks
      });
      return response.json();
    },
    onSuccess: () => {
      console.log('School feature setup updated successfully');
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
    if (!school?.id || !selectedFeature?.id) {
      console.error('Missing school or feature ID:', { schoolId: school?.id, featureId: selectedFeature?.id });
      return;
    }

    // Save only the custom menu links with enabled status
    const menuLinksWithStatus = customMenuLinks.map(link => ({
      ...link,
      enabled: selectedMenuLinks.includes(link.name)
    }));

    console.log('Calling save with data:', {
      schoolId: school.id,
      featureId: selectedFeature.id,
      menuLinks: menuLinksWithStatus
    });

    updateSchoolFeatureSetupMutation.mutate({
      schoolId: school.id,
      featureId: selectedFeature.id,
      menuLinks: menuLinksWithStatus
    });
  };

  const handleAddCustomMenuLink = () => {
    if (!newMenuLink.name.trim() || !newMenuLink.href.trim()) {
      toast({
        title: "Validation Error",
        description: "Menu link name and URL are required",
        variant: "destructive",
      });
      return;
    }

    // Check if name already exists
    const allExistingNames = customMenuLinks.map(link => link.name);

    if (allExistingNames.includes(newMenuLink.name)) {
      toast({
        title: "Validation Error",
        description: "Menu link name already exists",
        variant: "destructive",
      });
      return;
    }

    setCustomMenuLinks([...customMenuLinks, newMenuLink]);
    setSelectedMenuLinks([...selectedMenuLinks, newMenuLink.name]);
    setNewMenuLink({
      name: "",
      href: "",
      icon: "fas fa-home",
      enabled: true,
    });
    setShowAddForm(false);
  };

  const handleUpdateCustomMenuLink = (index: number, updates: Partial<MenuLink>) => {
    const updated = customMenuLinks.map((link, i) => 
      i === index ? { ...link, ...updates } : link
    );
    setCustomMenuLinks(updated);
  };

  const handleRemoveCustomMenuLink = (index: number) => {
    const linkToRemove = customMenuLinks[index];
    const updated = customMenuLinks.filter((_, i) => i !== index);
    setCustomMenuLinks(updated);
    
    // Remove from selected links as well
    setSelectedMenuLinks(prev => prev.filter(name => name !== linkToRemove.name));
    
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  if (!school) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configure Menu Links - {school.name}
          </DialogTitle>
          <DialogDescription>
            Select a feature and manage its menu links for this school
          </DialogDescription>
        </DialogHeader>

        {/* Feature Selection */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="feature-select">Select Feature</Label>
            <Select 
              value={selectedFeature?.id || ""} 
              onValueChange={(value) => {
                const feature = allFeatures?.find((f: Feature) => f.id === value);
                setSelectedFeature(feature || null);
                setSelectedMenuLinks([]);
                setCustomMenuLinks([]);
              }}
            >
              <SelectTrigger id="feature-select">
                <SelectValue placeholder="Choose a feature to manage" />
              </SelectTrigger>
              <SelectContent>
                {allFeatures?.map((feature: Feature) => (
                  <SelectItem key={feature.id} value={feature.id}>
                    {feature.name} ({feature.key})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedFeature && (
          <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{school.shortName}</Badge>
              <span className="text-sm font-medium">{school.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default">{selectedFeature.name}</Badge>
              <Button
                size="sm"
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Add Menu Link
              </Button>
            </div>
          </div>
        )}

        {selectedFeature && (
        <ScrollArea className="flex-1 max-h-[50vh]">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Add New Menu Link Form */}
              {showAddForm && (
                <Card className="border-dashed border-2 border-blue-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>Add New Menu Link</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowAddForm(false)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="new-name">Link Name</Label>
                        <Input
                          id="new-name"
                          value={newMenuLink.name}
                          onChange={(e) => setNewMenuLink({ ...newMenuLink, name: e.target.value })}
                          placeholder="Reports, Analytics, etc."
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="new-href">Link URL</Label>
                        <Input
                          id="new-href"
                          value={newMenuLink.href}
                          onChange={(e) => setNewMenuLink({ ...newMenuLink, href: e.target.value })}
                          placeholder="/school/features/feature-key/page"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="new-icon">Icon Class</Label>
                        <select
                          id="new-icon"
                          value={newMenuLink.icon}
                          onChange={(e) => setNewMenuLink({ ...newMenuLink, icon: e.target.value })}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          {defaultIcons.map(icon => (
                            <option key={icon} value={icon}>
                              {icon}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="flex items-end">
                        <Button onClick={handleAddCustomMenuLink} className="w-full">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Menu Link
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Menu Links from Database */}
              {customMenuLinks.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Menu Links</h4>
                  <div className="space-y-2">
                    {customMenuLinks.map((link, index) => (
                      <Card 
                        key={`custom-${index}`} 
                        className={`transition-all ${
                          selectedMenuLinks.includes(link.name) 
                            ? 'ring-2 ring-green-500 bg-green-50' 
                            : 'opacity-60'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              checked={selectedMenuLinks.includes(link.name)}
                              onCheckedChange={() => handleToggleMenuLink(link.name)}
                              data-testid={`checkbox-custom-menu-link-${index}`}
                            />
                            <div className="flex items-center gap-3 flex-1">
                              <i className={`${link.icon} text-gray-600`} />
                              <div>
                                <div className="font-medium text-sm">{link.name}</div>
                                <div className="text-xs text-gray-500">{link.href}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={selectedMenuLinks.includes(link.name) ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {selectedMenuLinks.includes(link.name) ? "Enabled" : "Disabled"}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveCustomMenuLink(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {editingIndex === index && (
                            <div className="mt-4 pt-4 border-t">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor={`edit-name-${index}`}>Link Name</Label>
                                  <Input
                                    id={`edit-name-${index}`}
                                    value={link.name}
                                    onChange={(e) => handleUpdateCustomMenuLink(index, { name: e.target.value })}
                                    placeholder="Dashboard, Reports, Settings..."
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor={`edit-href-${index}`}>Link URL</Label>
                                  <Input
                                    id={`edit-href-${index}`}
                                    value={link.href}
                                    onChange={(e) => handleUpdateCustomMenuLink(index, { href: e.target.value })}
                                    placeholder="/school/features/feature-key/page"
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor={`edit-icon-${index}`}>Icon Class</Label>
                                  <select
                                    id={`edit-icon-${index}`}
                                    value={link.icon}
                                    onChange={(e) => handleUpdateCustomMenuLink(index, { icon: e.target.value })}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                  >
                                    {defaultIcons.map(icon => (
                                      <option key={icon} value={icon}>
                                        {icon}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {customMenuLinks.length === 0 && !showAddForm && (
                <div className="text-center py-8">
                  <Link className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Menu Links Yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Add menu links for this feature to make them available to the school.
                  </p>
                  <Button onClick={() => setShowAddForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Menu Link
                  </Button>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        )}

        {selectedFeature && (
        <div className="border-t pt-4">
          <div className="text-sm text-gray-600 mb-3">
            {selectedMenuLinks.length} of {customMenuLinks.length} menu links enabled

          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button 
              onClick={() => {
                console.log('Save button clicked!');
                handleSave();
              }}
              disabled={updateSchoolFeatureSetupMutation.isPending}
              data-testid="button-save-menu-links"
            >
              <Save className="h-4 w-4 mr-1" />
              {updateSchoolFeatureSetupMutation.isPending ? 'Saving...' : 'Save Menu Links'}
            </Button>
          </div>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}