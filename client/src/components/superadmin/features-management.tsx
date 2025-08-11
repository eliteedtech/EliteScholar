import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Search, Edit, Trash2, Layers3, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Feature } from "@shared/schema";

export default function FeaturesManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const { toast } = useToast();

  // Fetch features
  const { data: features, isLoading } = useQuery({
    queryKey: ["/api/features"],
  });

  // Create feature mutation
  const createFeatureMutation = useMutation({
    mutationFn: async (featureData: any) => {
      const response = await apiRequest("POST", "/api/features", featureData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/features"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Feature created successfully",
        description: "The feature is now available for schools.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating feature",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Update feature mutation
  const updateFeatureMutation = useMutation({
    mutationFn: async (data: { id: string; featureData: any }) => {
      const response = await apiRequest("PATCH", `/api/features/${data.id}`, data.featureData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/features"] });
      setSelectedFeature(null);
      toast({
        title: "Feature updated successfully",
        description: "Changes have been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating feature",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Delete feature mutation
  const deleteFeatureMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/features/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/features"] });
      toast({
        title: "Feature deleted successfully",
        description: "The feature has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting feature",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const filteredFeatures = (features || []).filter((feature: Feature) =>
    feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    feature.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateFeature = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const featureData = {
      name: formData.get("name"),
      key: formData.get("key"),
      description: formData.get("description"),
      price: parseInt(formData.get("price") as string) * 100, // Convert to kobo
      category: formData.get("category"),
      type: {
        module: formData.get("typeModule") === "true",
        standalone: formData.get("typeStandalone") === "true",
        both: formData.get("typeBoth") === "true",
      },
    };

    createFeatureMutation.mutate(featureData);
  };

  const handleUpdateFeature = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFeature) return;

    const formData = new FormData(event.currentTarget);
    
    const featureData = {
      name: formData.get("name"),
      description: formData.get("description"),
      price: parseInt(formData.get("price") as string) * 100, // Convert to kobo
      category: formData.get("category"),
      type: {
        module: formData.get("typeModule") === "true",
        standalone: formData.get("typeStandalone") === "true",
        both: formData.get("typeBoth") === "true",
      },
    };

    updateFeatureMutation.mutate({
      id: selectedFeature.id,
      featureData,
    });
  };

  const getTypeDisplayName = (type: any) => {
    if (type?.both) return "Both";
    if (type?.module) return "Module";
    if (type?.standalone) return "Standalone";
    return "Unknown";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Feature Management</h2>
          <p className="text-slate-600 dark:text-slate-400">Create and manage system features</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-feature">
              <Plus className="h-4 w-4 mr-2" />
              Create Feature
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Feature</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateFeature} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Feature Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Student Attendance"
                    required
                    data-testid="input-feature-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="key">Feature Key *</Label>
                  <Input
                    id="key"
                    name="key"
                    placeholder="student_attendance"
                    required
                    data-testid="input-feature-key"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Track student attendance and generate reports"
                  rows={3}
                  data-testid="input-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₦) *</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    placeholder="5000"
                    required
                    data-testid="input-price"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select name="category">
                    <SelectTrigger data-testid="select-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CORE">Core</SelectItem>
                      <SelectItem value="PREMIUM">Premium</SelectItem>
                      <SelectItem value="ADDON">Add-on</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Feature Type</Label>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="typeModule" name="typeModule" value="true" />
                    <Label htmlFor="typeModule">Module</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="typeStandalone" name="typeStandalone" value="true" />
                    <Label htmlFor="typeStandalone">Standalone</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="typeBoth" name="typeBoth" value="true" />
                    <Label htmlFor="typeBoth">Both</Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createFeatureMutation.isPending}
                  data-testid="button-submit-feature"
                >
                  {createFeatureMutation.isPending ? "Creating..." : "Create Feature"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Search features..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-features"
          />
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFeatures.map((feature: Feature) => (
          <Card key={feature.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg" data-testid={`text-feature-name-${feature.id}`}>
                    {feature.name}
                  </CardTitle>
                  <CardDescription data-testid={`text-feature-key-${feature.id}`}>
                    {feature.key}
                  </CardDescription>
                </div>
                <Badge
                  variant={feature.isActive ? "default" : "secondary"}
                  data-testid={`badge-status-${feature.id}`}
                >
                  {feature.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="text-slate-600" data-testid={`text-description-${feature.id}`}>
                  {feature.description || "No description"}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Price:</span>
                  <span className="font-medium flex items-center" data-testid={`text-price-${feature.id}`}>
                    <DollarSign className="h-3 w-3 mr-1" />
                    ₦{(feature.price / 100).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Type:</span>
                  <span className="font-medium" data-testid={`text-type-${feature.id}`}>
                    {getTypeDisplayName((feature as any).type)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Category:</span>
                  <span className="font-medium" data-testid={`text-category-${feature.id}`}>
                    {feature.category}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedFeature(feature)}
                  data-testid={`button-edit-${feature.id}`}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteFeatureMutation.mutate(feature.id)}
                  disabled={deleteFeatureMutation.isPending}
                  data-testid={`button-delete-${feature.id}`}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFeatures.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Layers3 className="h-12 w-12 text-slate-400 mb-4" />
            <p className="text-slate-600 text-center">
              {searchTerm ? "No features found matching your search." : "No features created yet."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Feature Dialog */}
      <Dialog open={!!selectedFeature} onOpenChange={() => setSelectedFeature(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Feature</DialogTitle>
          </DialogHeader>
          {selectedFeature && (
            <form onSubmit={handleUpdateFeature} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editName">Feature Name *</Label>
                <Input
                  id="editName"
                  name="name"
                  defaultValue={selectedFeature.name}
                  required
                  data-testid="input-edit-feature-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  name="description"
                  defaultValue={selectedFeature.description || ""}
                  rows={3}
                  data-testid="input-edit-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editPrice">Price (₦) *</Label>
                  <Input
                    id="editPrice"
                    name="price"
                    type="number"
                    defaultValue={selectedFeature.price / 100}
                    required
                    data-testid="input-edit-price"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editCategory">Category</Label>
                  <Select name="category" defaultValue={selectedFeature.category || ""}>
                    <SelectTrigger data-testid="select-edit-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CORE">Core</SelectItem>
                      <SelectItem value="PREMIUM">Premium</SelectItem>
                      <SelectItem value="ADDON">Add-on</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Feature Type</Label>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="editTypeModule"
                      name="typeModule"
                      value="true"
                      defaultChecked={(selectedFeature as any).type?.module}
                    />
                    <Label htmlFor="editTypeModule">Module</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="editTypeStandalone"
                      name="typeStandalone"
                      value="true"
                      defaultChecked={(selectedFeature as any).type?.standalone}
                    />
                    <Label htmlFor="editTypeStandalone">Standalone</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="editTypeBoth"
                      name="typeBoth"
                      value="true"
                      defaultChecked={(selectedFeature as any).type?.both}
                    />
                    <Label htmlFor="editTypeBoth">Both</Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedFeature(null)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateFeatureMutation.isPending}
                  data-testid="button-submit-edit-feature"
                >
                  {updateFeatureMutation.isPending ? "Updating..." : "Update Feature"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}