import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Link, Save, X, Edit2 } from "lucide-react";
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
  isActive: boolean;
}

interface FeatureMenuManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: Feature | null;
}

const defaultIcons = [
  "fas fa-home",
  "fas fa-chart-line", 
  "fas fa-edit",
  "fas fa-file-alt",
  "fas fa-chart-bar",
  "fas fa-calendar-check",
  "fas fa-check-square",
  "fas fa-chart-pie",
  "fas fa-money-bill",
  "fas fa-list",
  "fas fa-credit-card",
  "fas fa-file-invoice",
  "fas fa-users",
  "fas fa-user-graduate",
  "fas fa-book",
  "fas fa-cog",
];

export default function FeatureMenuManagementModal({ 
  isOpen, 
  onClose, 
  feature 
}: FeatureMenuManagementModalProps) {
  const [menuLinks, setMenuLinks] = useState<MenuLink[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (feature) {
      setMenuLinks(feature.menuLinks || []);
    }
  }, [feature]);

  // Update feature menu links mutation
  const updateFeatureMenuLinksMutation = useMutation({
    mutationFn: async ({ featureId, menuLinks }: { 
      featureId: string; 
      menuLinks: MenuLink[] 
    }) => {
      return apiRequest("PUT", `/api/superadmin/features/${featureId}`, {
        menuLinks
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/features"] });
      toast({
        title: "Success",
        description: "Feature menu links updated successfully",
      });
      onClose();
    },
    onError: (error) => {
      console.error("Update feature menu links error:", error);
      toast({
        title: "Error", 
        description: "Failed to update feature menu links",
        variant: "destructive",
      });
    },
  });

  const handleAddMenuLink = () => {
    const newLink: MenuLink = {
      name: "",
      href: "",
      icon: "fas fa-home",
      enabled: true,
    };
    setMenuLinks([...menuLinks, newLink]);
    setEditingIndex(menuLinks.length);
  };

  const handleUpdateMenuLink = (index: number, updates: Partial<MenuLink>) => {
    const updated = menuLinks.map((link, i) => 
      i === index ? { ...link, ...updates } : link
    );
    setMenuLinks(updated);
  };

  const handleRemoveMenuLink = (index: number) => {
    const updated = menuLinks.filter((_, i) => i !== index);
    setMenuLinks(updated);
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const handleSave = async () => {
    if (!feature) return;

    // Validate menu links
    const invalidLinks = menuLinks.filter(link => !link.name.trim() || !link.href.trim());
    if (invalidLinks.length > 0) {
      toast({
        title: "Validation Error",
        description: "All menu links must have a name and href",
        variant: "destructive",
      });
      return;
    }

    updateFeatureMenuLinksMutation.mutate({
      featureId: feature.id,
      menuLinks
    });
  };

  const toggleLinkEnabled = (index: number) => {
    handleUpdateMenuLink(index, { enabled: !menuLinks[index].enabled });
  };

  if (!feature) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Menu Links - {feature.name}
          </DialogTitle>
          <DialogDescription>
            Configure menu links that will appear for this feature in school dashboards
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Manage navigation menu items for the {feature.name} feature
          </div>
          <Button onClick={handleAddMenuLink} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Menu Link
          </Button>
        </div>

        <ScrollArea className="flex-1 max-h-[60vh]">
          {menuLinks.length === 0 ? (
            <div className="text-center py-8">
              <Link className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Menu Links</h3>
              <p className="text-gray-600 mb-4">
                Add menu links to help users navigate this feature
              </p>
              <Button onClick={handleAddMenuLink}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Menu Link
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {menuLinks.map((link, index) => (
                <Card key={index} className={`${link.enabled === false ? 'opacity-60' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <i className={link.icon} />
                        {link.name || `Menu Link ${index + 1}`}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={link.enabled !== false ? "default" : "secondary"}>
                          {link.enabled !== false ? "Enabled" : "Disabled"}
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
                          onClick={() => handleRemoveMenuLink(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {editingIndex === index && (
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`name-${index}`}>Link Name</Label>
                          <Input
                            id={`name-${index}`}
                            value={link.name}
                            onChange={(e) => handleUpdateMenuLink(index, { name: e.target.value })}
                            placeholder="Dashboard, Reports, Settings..."
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`href-${index}`}>Link URL</Label>
                          <Input
                            id={`href-${index}`}
                            value={link.href}
                            onChange={(e) => handleUpdateMenuLink(index, { href: e.target.value })}
                            placeholder="/school/features/feature-key/page"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`icon-${index}`}>Icon Class</Label>
                          <select
                            id={`icon-${index}`}
                            value={link.icon}
                            onChange={(e) => handleUpdateMenuLink(index, { icon: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            {defaultIcons.map(icon => (
                              <option key={icon} value={icon}>
                                {icon}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`enabled-${index}`}
                            checked={link.enabled !== false}
                            onCheckedChange={() => toggleLinkEnabled(index)}
                          />
                          <Label htmlFor={`enabled-${index}`}>Enabled by default</Label>
                        </div>
                      </div>
                    </CardContent>
                  )}
                  
                  {editingIndex !== index && (
                    <CardContent className="pt-0">
                      <div className="text-sm text-gray-600">
                        <div><strong>URL:</strong> {link.href || 'Not set'}</div>
                        <div><strong>Icon:</strong> {link.icon}</div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        <Separator />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={updateFeatureMenuLinksMutation.isPending}
          >
            <Save className="h-4 w-4 mr-1" />
            {updateFeatureMenuLinksMutation.isPending ? 'Saving...' : 'Save Menu Links'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}