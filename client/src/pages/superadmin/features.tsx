import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Feature {
  id: string;
  key: string;
  name: string;
  description?: string;
  price?: number;
  category?: string;
  isActive: boolean;
  type: {
    module: boolean;
    standalone: boolean;
    both: boolean;
  };
  createdAt: string;
}

interface FeatureFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  type: {
    module: boolean;
    standalone: boolean;
    both: boolean;
  };
}

export default function FeaturesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [formData, setFormData] = useState<FeatureFormData>({
    name: "",
    description: "",
    price: "",
    category: "CORE",
    type: {
      module: false,
      standalone: false,
      both: false,
    },
  });

  const { data: features = [], isLoading } = useQuery<Feature[]>({
    queryKey: ["/api/features"],
  });

  const createFeatureMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/features", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/features"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Feature created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create feature",
        variant: "destructive",
      });
    },
  });

  const updateFeatureMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/api/features/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/features"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Feature updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update feature",
        variant: "destructive",
      });
    },
  });

  const deleteFeatureMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/features/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/features"] });
      toast({
        title: "Success",
        description: "Feature deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete feature",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "CORE",
      type: {
        module: false,
        standalone: false,
        both: false,
      },
    });
    setEditingFeature(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (feature: Feature) => {
    setEditingFeature(feature);
    setFormData({
      name: feature.name,
      description: feature.description || "",
      price: feature.price ? (feature.price / 100).toString() : "",
      category: feature.category || "CORE",
      type: feature.type,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      name: formData.name,
      description: formData.description,
      price: formData.price ? parseFloat(formData.price) * 100 : null, // Convert to kobo
      category: formData.category,
      type: formData.type,
      key: formData.name.toLowerCase().replace(/\s+/g, "_"),
    };

    if (editingFeature) {
      updateFeatureMutation.mutate({ id: editingFeature.id, data: submitData });
    } else {
      createFeatureMutation.mutate(submitData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this feature?")) {
      deleteFeatureMutation.mutate(id);
    }
  };

  const getTypeDisplay = (type: Feature["type"]) => {
    const types = [];
    if (type.module) types.push("Module");
    if (type.standalone) types.push("Standalone");
    if (type.both) types.push("Both");
    return types.join(", ") || "Not specified";
  };

  const formatPrice = (price?: number) => {
    if (!price) return "Manual entry";
    return `₦${(price / 100).toLocaleString()}`;
  };

  return (
    <div className="space-y-6" data-testid="features-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Features Management</h1>
          <p className="text-muted-foreground">
            Manage system features and their pricing configuration
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} data-testid="button-create-feature">
              <Plus className="h-4 w-4 mr-2" />
              Add Feature
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingFeature ? "Edit Feature" : "Create New Feature"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Feature Name</Label>
                <Input
                  id="name"
                  data-testid="input-feature-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  data-testid="input-feature-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="price">Price (₦)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  data-testid="input-feature-price"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="Leave empty for manual entry"
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  data-testid="select-feature-category"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="CORE">Core</option>
                  <option value="ACADEMICS">Academics</option>
                  <option value="FINANCE">Finance</option>
                  <option value="COMMUNICATION">Communication</option>
                  <option value="ADMINISTRATION">Administration</option>
                </select>
              </div>

              <div>
                <Label>Feature Type</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="module"
                      data-testid="checkbox-type-module"
                      checked={formData.type.module}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          type: { ...formData.type, module: !!checked },
                        })
                      }
                    />
                    <Label htmlFor="module">Module (part of main system)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="standalone"
                      data-testid="checkbox-type-standalone"
                      checked={formData.type.standalone}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          type: { ...formData.type, standalone: !!checked },
                        })
                      }
                    />
                    <Label htmlFor="standalone">Standalone (separate app)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="both"
                      data-testid="checkbox-type-both"
                      checked={formData.type.both}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          type: { ...formData.type, both: !!checked },
                        })
                      }
                    />
                    <Label htmlFor="both">Both (available in both ways)</Label>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  data-testid="button-save-feature"
                  disabled={createFeatureMutation.isPending || updateFeatureMutation.isPending}
                >
                  {editingFeature ? "Update" : "Create"} Feature
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Features</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {features.map((feature) => (
                  <TableRow key={feature.id} data-testid={`row-feature-${feature.id}`}>
                    <TableCell className="font-medium" data-testid={`text-feature-name-${feature.id}`}>
                      {feature.name}
                    </TableCell>
                    <TableCell data-testid={`text-feature-description-${feature.id}`}>
                      {feature.description}
                    </TableCell>
                    <TableCell data-testid={`text-feature-type-${feature.id}`}>
                      {getTypeDisplay(feature.type)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{feature.category}</Badge>
                    </TableCell>
                    <TableCell data-testid={`text-feature-price-${feature.id}`}>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {formatPrice(feature.price)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={feature.isActive ? "default" : "secondary"}>
                        {feature.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(feature)}
                          data-testid={`button-edit-feature-${feature.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(feature.id)}
                          data-testid={`button-delete-feature-${feature.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}