import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit, Trash2, Package, DollarSign, Calendar, MapPin, AlertCircle, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import SchoolLayout from "@/components/school/layout";
import { apiRequest } from "@/lib/queryClient";

// Asset form schema
const assetFormSchema = z.object({
  name: z.string().min(1, "Asset name is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  type: z.string().min(1, "Type is required"),
  serialNumber: z.string().optional(),
  model: z.string().optional(),
  brand: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.string().optional(),
  currentValue: z.string().optional(),
  condition: z.string().min(1, "Condition is required"),
  location: z.string().optional(),
  assignedTo: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  maintenanceSchedule: z.string().optional(),
  notes: z.string().optional(),
});

type AssetFormData = z.infer<typeof assetFormSchema>;

interface Asset {
  id: string;
  name: string;
  description?: string;
  category: string;
  type: string;
  serialNumber?: string;
  model?: string;
  brand?: string;
  purchaseDate?: string;
  purchasePrice?: string;
  currentValue?: string;
  condition: string;
  location?: string;
  assignedTo?: string;
  warrantyExpiry?: string;
  maintenanceSchedule?: string;
  notes?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const ASSET_CATEGORIES = [
  "Equipment",
  "Furniture",
  "Technology", 
  "Sports",
  "Laboratory",
  "Transportation",
  "Other"
];

const ASSET_CONDITIONS = [
  "Excellent",
  "Good", 
  "Fair",
  "Poor",
  "Damaged"
];

const CONDITION_COLORS = {
  "Excellent": "bg-green-100 text-green-800",
  "Good": "bg-blue-100 text-blue-800", 
  "Fair": "bg-yellow-100 text-yellow-800",
  "Poor": "bg-orange-100 text-orange-800",
  "Damaged": "bg-red-100 text-red-800"
};

export default function AssetSetupPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<AssetFormData>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      condition: "Good",
    },
  });

  // Fetch assets
  const { data: assets = [], isLoading } = useQuery<Asset[]>({
    queryKey: ["/api/schools/assets", user?.schoolId, categoryFilter, conditionFilter],
    queryFn: async () => {
      if (!user?.schoolId) throw new Error("No school ID");
      
      const params = new URLSearchParams();
      if (categoryFilter) params.append("category", categoryFilter);
      if (conditionFilter) params.append("condition", conditionFilter);
      params.append("isActive", "true");
      
      const response = await fetch(`/api/schools/${user.schoolId}/assets?${params}`);
      if (!response.ok) throw new Error("Failed to fetch assets");
      return response.json();
    },
    enabled: !!user?.schoolId,
  });

  // Create asset mutation
  const createAssetMutation = useMutation({
    mutationFn: async (data: AssetFormData & { imageFile?: File }) => {
      if (!user?.schoolId) throw new Error("No school ID");
      
      const formData = new FormData();
      const assetData = {
        ...data,
        schoolId: user.schoolId,
        createdBy: user.id,
        isActive: true,
      };
      
      formData.append('assetData', JSON.stringify(assetData));
      if (data.imageFile) {
        formData.append('image', data.imageFile);
      }

      const response = await fetch('/api/assets', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create asset');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Asset created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/schools/assets"] });
      setIsDialogOpen(false);
      form.reset();
      setImageFile(null);
      setImagePreview(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update asset mutation
  const updateAssetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AssetFormData & { imageFile?: File } }) => {
      const formData = new FormData();
      const assetData = {
        ...data,
        schoolId: user?.schoolId,
      };
      
      formData.append('assetData', JSON.stringify(assetData));
      if (data.imageFile) {
        formData.append('image', data.imageFile);
      }

      const response = await fetch(`/api/assets/${id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update asset');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Asset updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/schools/assets"] });
      setIsDialogOpen(false);
      setSelectedAsset(null);
      form.reset();
      setImageFile(null);
      setImagePreview(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete asset mutation
  const deleteAssetMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/assets/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete asset');
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Asset deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/schools/assets"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error", 
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (data: AssetFormData) => {
    const submitData = { ...data, imageFile: imageFile || undefined };
    
    if (selectedAsset) {
      updateAssetMutation.mutate({ id: selectedAsset.id, data: submitData });
    } else {
      createAssetMutation.mutate(submitData);
    }
  };

  const handleEdit = (asset: Asset) => {
    setSelectedAsset(asset);
    form.reset({
      name: asset.name,
      description: asset.description || "",
      category: asset.category,
      type: asset.type,
      serialNumber: asset.serialNumber || "",
      model: asset.model || "",
      brand: asset.brand || "",
      purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : "",
      purchasePrice: asset.purchasePrice || "",
      currentValue: asset.currentValue || "",
      condition: asset.condition,
      location: asset.location || "",
      assignedTo: asset.assignedTo || "",
      warrantyExpiry: asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toISOString().split('T')[0] : "",
      maintenanceSchedule: asset.maintenanceSchedule || "",
      notes: asset.notes || "",
    });
    setImagePreview(asset.imageUrl || null);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedAsset(null);
    form.reset({
      condition: "Good",
    });
    setImageFile(null);
    setImagePreview(null);
    setIsDialogOpen(true);
  };

  const filteredAssets = assets.filter((asset) =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ""
  );

  // Prevent access for non-school admins
  if (user?.role !== "school_admin") {
    return (
      <SchoolLayout title="Access Denied" subtitle="Asset Management">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Only school administrators can access asset management.</p>
          </CardContent>
        </Card>
      </SchoolLayout>
    );
  }

  return (
    <SchoolLayout title="Asset Management" subtitle="Manage school assets and equipment">
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
            <p className="text-gray-600">Track and manage school equipment and resources</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Asset
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedAsset ? "Edit Asset" : "Add New Asset"}
                </DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Asset Name *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Laptop, Desk, Projector" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ASSET_CATEGORIES.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Dell Laptop, Office Chair" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="condition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Condition *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select condition" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ASSET_CONDITIONS.map((condition) => (
                                <SelectItem key={condition} value={condition}>
                                  {condition}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Additional details about the asset" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="brand"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Brand</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Dell, HP" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Model</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Latitude 5520" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="serialNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Serial Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., ABC123456789" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="purchaseDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purchase Date</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="purchasePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purchase Price</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" placeholder="0.00" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="currentValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Value</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" placeholder="0.00" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="warrantyExpiry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Warranty Expiry</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Computer Lab, Office A" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="assignedTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assigned To</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., John Doe, IT Department" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="maintenanceSchedule"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maintenance Schedule</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Maintenance requirements and schedule" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Additional notes or comments" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Image upload */}
                  <div className="space-y-2">
                    <Label htmlFor="image" className="flex items-center gap-2">
                      <FileImage className="h-4 w-4" />
                      Asset Image
                    </Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {imagePreview && (
                      <div className="mt-2">
                        <img
                          src={imagePreview}
                          alt="Asset preview"
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createAssetMutation.isPending || updateAssetMutation.isPending}
                    >
                      {createAssetMutation.isPending || updateAssetMutation.isPending ? "Saving..." : "Save Asset"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">Search Assets</Label>
                <Input
                  id="search"
                  placeholder="Search by name, category, type, location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="category-filter">Category</Label>
                <Select value={categoryFilter || "all"} onValueChange={(value) => setCategoryFilter(value === "all" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {ASSET_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="condition-filter">Condition</Label>
                <Select value={conditionFilter || "all"} onValueChange={(value) => setConditionFilter(value === "all" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All conditions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All conditions</SelectItem>
                    {ASSET_CONDITIONS.map((condition) => (
                      <SelectItem key={condition} value={condition}>
                        {condition}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assets Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Assets ({filteredAssets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p>Loading assets...</p>
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No assets found</p>
                <p className="text-sm text-gray-500 mb-4">
                  {searchTerm || categoryFilter || conditionFilter
                    ? "Try adjusting your search or filters"
                    : "Start by adding your first asset"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Purchase Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {asset.imageUrl && (
                              <img
                                src={asset.imageUrl}
                                alt={asset.name}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            )}
                            <div>
                              <div className="font-medium">{asset.name}</div>
                              <div className="text-sm text-gray-500">
                                {asset.brand} {asset.model}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{asset.category}</div>
                            <div className="text-sm text-gray-500">{asset.type}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={CONDITION_COLORS[asset.condition as keyof typeof CONDITION_COLORS]}>
                            {asset.condition}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {asset.location && <MapPin className="h-3 w-3 text-gray-400" />}
                            {asset.location || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {asset.currentValue && <DollarSign className="h-3 w-3 text-gray-400" />}
                            {asset.currentValue ? `$${parseFloat(asset.currentValue).toLocaleString()}` : "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {asset.purchaseDate && <Calendar className="h-3 w-3 text-gray-400" />}
                            {asset.purchaseDate
                              ? new Date(asset.purchaseDate).toLocaleDateString()
                              : "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(asset)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteAssetMutation.mutate(asset.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              disabled={deleteAssetMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SchoolLayout>
  );
}