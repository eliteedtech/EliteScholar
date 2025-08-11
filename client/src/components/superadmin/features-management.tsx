import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit2, Trash2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";

const featureFormSchema = z.object({
  key: z.string().min(1, "Feature key is required"),
  name: z.string().min(1, "Feature name is required"),
  description: z.string().optional(),
  price: z.string().optional(),
  pricingType: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  isCore: z.boolean().default(false),
});

type FeatureFormData = z.infer<typeof featureFormSchema>;

interface Feature {
  id: string;
  key: string;
  name: string;
  description?: string;
  price?: number;
  pricingType?: string;
  category: string;
  isCore: boolean;
  isActive: boolean;
  createdAt: string;
}

const pricingTypes = [
  { value: "per_student", label: "Per Student" },
  { value: "per_staff", label: "Per Staff" },
  { value: "per_term", label: "Per Term" },
  { value: "per_month", label: "Per Month" },
  { value: "per_year", label: "Per Year" },
  { value: "one_time", label: "One Time" },
  { value: "pay_as_you_go", label: "Pay as You Go" },
  { value: "custom", label: "Custom Pricing" },
];

const categories = [
  "academics",
  "administration", 
  "finance",
  "communication",
  "assessment",
  "reporting",
  "general",
];

export default function FeaturesManagement() {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);

  const { data: features = [], isLoading } = useQuery({
    queryKey: ["/api/superadmin/features"],
    queryFn: () => api.superadmin.getFeatures(),
  });

  const form = useForm<FeatureFormData>({
    resolver: zodResolver(featureFormSchema),
    defaultValues: {
      key: "",
      name: "",
      description: "",
      price: "",
      pricingType: "",
      category: "general",
      isCore: false,
    },
  });

  const createFeatureMutation = useMutation({
    mutationFn: (data: FeatureFormData) => {
      const payload = {
        ...data,
        price: data.price ? parseFloat(data.price) * 100 : null, // Convert to kobo
      };
      return api.superadmin.createFeature(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/features"] });
      toast({
        title: "Success",
        description: "Feature created successfully",
      });
      setIsFormOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create feature",
        variant: "destructive",
      });
    },
  });

  const updateFeatureMutation = useMutation({
    mutationFn: ({ featureId, data }: { featureId: string; data: FeatureFormData }) => {
      const payload = {
        ...data,
        price: data.price ? parseFloat(data.price) * 100 : null,
      };
      return api.superadmin.updateFeature(featureId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/features"] });
      toast({
        title: "Success",
        description: "Feature updated successfully",
      });
      setIsFormOpen(false);
      setEditingFeature(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update feature",
        variant: "destructive",
      });
    },
  });

  const deleteFeatureMutation = useMutation({
    mutationFn: (featureId: string) => api.superadmin.deleteFeature(featureId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/features"] });
      toast({
        title: "Success",
        description: "Feature deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete feature",
        variant: "destructive",
      });
    },
  });

  const handleCreateFeature = () => {
    setEditingFeature(null);
    form.reset();
    setIsFormOpen(true);
  };

  const handleEditFeature = (feature: Feature) => {
    setEditingFeature(feature);
    form.reset({
      key: feature.key,
      name: feature.name,
      description: feature.description || "",
      price: feature.price ? (feature.price / 100).toString() : "",
      pricingType: feature.pricingType || "",
      category: feature.category,
      isCore: feature.isCore,
    });
    setIsFormOpen(true);
  };

  const handleDeleteFeature = (featureId: string) => {
    if (confirm("Are you sure you want to delete this feature?")) {
      deleteFeatureMutation.mutate(featureId);
    }
  };

  const onSubmit = (data: FeatureFormData) => {
    if (editingFeature) {
      updateFeatureMutation.mutate({ featureId: editingFeature.id, data });
    } else {
      createFeatureMutation.mutate(data);
    }
  };

  const formatPrice = (price?: number, pricingType?: string) => {
    if (!price) return "Free";
    const nairaPrice = price / 100;
    const typeLabel = pricingTypes.find(pt => pt.value === pricingType)?.label || "";
    return `₦${nairaPrice.toLocaleString()} ${typeLabel}`;
  };

  if (isLoading) {
    return <div>Loading features...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Features Management</h2>
          <p className="text-slate-600">Manage system features and pricing</p>
        </div>
        <Button onClick={handleCreateFeature} data-testid="button-create-feature">
          <Plus className="w-4 h-4 mr-2" />
          Add Feature
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature: Feature) => (
          <Card key={feature.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{feature.name}</CardTitle>
                  <Badge variant={feature.isCore ? "default" : "secondary"}>
                    {feature.isCore ? "Core" : "Optional"}
                  </Badge>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditFeature(feature)}
                    data-testid={`button-edit-feature-${feature.id}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  {!feature.isCore && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFeature(feature.id)}
                      data-testid={`button-delete-feature-${feature.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-slate-600">{feature.description}</p>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-600">
                    {formatPrice(feature.price, feature.pricingType)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Category: {feature.category}</span>
                  <Badge variant={feature.isActive ? "default" : "secondary"}>
                    {feature.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl" data-testid="feature-form-modal">
          <DialogHeader>
            <DialogTitle>
              {editingFeature ? "Edit Feature" : "Create New Feature"}
            </DialogTitle>
            <DialogDescription>
              {editingFeature ? "Update feature details" : "Add a new feature to the system"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="key">Feature Key *</Label>
                <Input
                  id="key"
                  placeholder="student_portal"
                  {...form.register("key")}
                  data-testid="input-feature-key"
                />
                {form.formState.errors.key && (
                  <p className="text-sm text-red-600">{form.formState.errors.key.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Feature Name *</Label>
                <Input
                  id="name"
                  placeholder="Student Portal"
                  {...form.register("name")}
                  data-testid="input-feature-name"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Feature description..."
                {...form.register("description")}
                data-testid="input-feature-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₦)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...form.register("price")}
                  data-testid="input-feature-price"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricingType">Pricing Type</Label>
                <Select
                  value={form.watch("pricingType")}
                  onValueChange={(value) => form.setValue("pricingType", value)}
                >
                  <SelectTrigger data-testid="select-pricing-type">
                    <SelectValue placeholder="Select pricing type" />
                  </SelectTrigger>
                  <SelectContent>
                    {pricingTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={form.watch("category")}
                  onValueChange={(value) => form.setValue("category", value)}
                >
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="isCore">Core Feature</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isCore"
                    checked={form.watch("isCore")}
                    onCheckedChange={(checked) => form.setValue("isCore", checked)}
                    data-testid="switch-is-core"
                  />
                  <span className="text-sm text-slate-600">
                    Core features cannot be disabled
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createFeatureMutation.isPending || updateFeatureMutation.isPending}
                data-testid="button-submit-feature"
              >
                {editingFeature ? "Update Feature" : "Create Feature"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}