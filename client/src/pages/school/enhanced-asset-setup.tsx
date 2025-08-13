import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Plus, Search, Filter, Eye, DollarSign, Users, Package, Edit, Trash2, History, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import SchoolLayout from "@/components/school/layout";

// Enhanced Asset form schema
const assetFormSchema = z.object({
  name: z.string().min(1, "Asset name is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  type: z.string().min(1, "Type is required"),
  serialNumber: z.string().optional(),
  model: z.string().optional(),
  brand: z.string().optional(),
  condition: z.string().min(1, "Condition is required"),
  location: z.string().optional(),
  totalQuantity: z.number().min(1, "Quantity must be at least 1"),
  warrantyExpiry: z.string().optional(),
  maintenanceSchedule: z.string().optional(),
  notes: z.string().optional(),
});

// Purchase form schema
const purchaseFormSchema = z.object({
  purchaseDate: z.string().min(1, "Purchase date is required"),
  purchasePrice: z.number().min(0, "Price must be positive"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  supplier: z.string().optional(),
  invoiceNumber: z.string().optional(),
  notes: z.string().optional(),
});

// Assignment form schema
const assignmentFormSchema = z.object({
  assignmentType: z.enum(["user", "class", "location"]),
  assignedTo: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  assignedDate: z.string().min(1, "Assignment date is required"),
  notes: z.string().optional(),
});

type AssetFormData = z.infer<typeof assetFormSchema>;
type PurchaseFormData = z.infer<typeof purchaseFormSchema>;
type AssignmentFormData = z.infer<typeof assignmentFormSchema>;

interface Asset {
  id: string;
  name: string;
  description?: string;
  category: string;
  type: string;
  serialNumber?: string;
  model?: string;
  brand?: string;
  condition: string;
  location?: string;
  totalQuantity: number;
  availableQuantity: number;
  warrantyExpiry?: string;
  maintenanceSchedule?: string;
  notes?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface AssetPurchase {
  id: string;
  purchaseDate: string;
  purchasePrice: number;
  quantity: number;
  totalCost: number;
  supplier?: string;
  invoiceNumber?: string;
  notes?: string;
  createdAt: string;
}

interface AssetAssignment {
  id: string;
  assignmentType: string;
  assignedTo?: string;
  location: string;
  quantity: number;
  assignedDate: string;
  returnDate?: string;
  status: string;
  notes?: string;
  createdAt: string;
}

interface GradeSection {
  id: string;
  name: string;
  code: string;
  type: string;
}

export default function EnhancedAssetSetup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [filters, setFilters] = useState({ category: "all", condition: "all" });
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch assets
  const { data: assets = [], isLoading: assetsLoading } = useQuery({
    queryKey: ["/api/schools", user?.schoolId, "assets", filters],
    enabled: !!user?.schoolId,
  });

  // Fetch grade sections for location dropdown
  const { data: gradeSections = [] } = useQuery<GradeSection[]>({
    queryKey: ["/api/schools", user?.schoolId, "grade-sections"],
    enabled: !!user?.schoolId,
  });

  // Fetch asset details with purchase history and assignments
  const { data: assetDetails } = useQuery({
    queryKey: ["/api/assets", selectedAsset?.id, "details"],
    enabled: !!selectedAsset?.id && showDetailsDialog,
    queryFn: async () => {
      const [purchasesResponse, assignmentsResponse] = await Promise.all([
        apiRequest("GET", `/api/assets/${selectedAsset?.id}/purchases`),
        apiRequest("GET", `/api/assets/${selectedAsset?.id}/assignments`),
      ]);
      
      const purchases = await purchasesResponse.json();
      const assignments = await assignmentsResponse.json();
      
      // Calculate totals
      const totalPurchaseCost = purchases.reduce((sum: number, purchase: AssetPurchase) => 
        sum + purchase.totalCost, 0);
      
      return {
        ...selectedAsset,
        purchases,
        assignments,
        totalPurchaseCost,
        currentValue: selectedAsset?.currentValue || 0,
      };
    },
  });

  // Create asset mutation
  const createAssetMutation = useMutation({
    mutationFn: async (data: AssetFormData) => {
      const response = await apiRequest("POST", `/api/assets`, {
        ...data,
        schoolId: user?.schoolId,
        createdBy: user?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schools", user?.schoolId, "assets"] });
      setShowCreateDialog(false);
      toast({ title: "Success", description: "Asset created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Add purchase mutation
  const addPurchaseMutation = useMutation({
    mutationFn: async (data: PurchaseFormData & { totalCost: number }) => {
      const response = await apiRequest("POST", `/api/assets/${selectedAsset?.id}/purchases`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schools", user?.schoolId, "assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assets", selectedAsset?.id, "details"] });
      setShowPurchaseDialog(false);
      toast({ title: "Success", description: "Purchase added successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Assign asset mutation
  const assignAssetMutation = useMutation({
    mutationFn: async (data: AssignmentFormData) => {
      const response = await apiRequest("POST", `/api/assets/${selectedAsset?.id}/assignments`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schools", user?.schoolId, "assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assets", selectedAsset?.id, "details"] });
      setShowAssignDialog(false);
      toast({ title: "Success", description: "Asset assigned successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Forms
  const createForm = useForm<AssetFormData>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      totalQuantity: 1,
      condition: "Good",
    },
  });

  const purchaseForm = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      quantity: 1,
      purchaseDate: new Date().toISOString().split('T')[0],
    },
  });

  const assignmentForm = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      assignmentType: "location",
      quantity: 1,
      assignedDate: new Date().toISOString().split('T')[0],
    },
  });

  // Filter assets
  const filteredAssets = (assets as Asset[]).filter((asset: Asset) => {
    const matchesSearch = !searchTerm || 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filters.category === "all" || asset.category === filters.category;
    const matchesCondition = filters.condition === "all" || asset.condition === filters.condition;
    
    return matchesSearch && matchesCategory && matchesCondition;
  });

  const onCreateSubmit = (data: AssetFormData) => {
    createAssetMutation.mutate(data);
  };

  const onPurchaseSubmit = (data: PurchaseFormData) => {
    addPurchaseMutation.mutate({
      ...data,
      totalCost: data.purchasePrice * data.quantity,
    });
  };

  const onAssignmentSubmit = (data: AssignmentFormData) => {
    assignAssetMutation.mutate(data);
  };

  const openPurchaseDialog = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowPurchaseDialog(true);
  };

  const openAssignDialog = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowAssignDialog(true);
  };

  const openDetailsDialog = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowDetailsDialog(true);
  };

  return (
    <SchoolLayout title="Asset Management" subtitle="Manage school assets and equipment">
    <div className="space-y-6" data-testid="enhanced-asset-setup">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enhanced Asset Management</h1>
          <p className="text-gray-600">
            Manage assets with quantity tracking, purchase history, and assignments
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-asset">
          <Plus className="h-4 w-4 mr-2" />
          Create Asset
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Assets</Label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name, category, or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-assets"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Label htmlFor="category-filter">Category</Label>
              <Select
                value={filters.category}
                onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger data-testid="select-category-filter">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Equipment">Equipment</SelectItem>
                  <SelectItem value="Furniture">Furniture</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Sports">Sports</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:w-48">
              <Label htmlFor="condition-filter">Condition</Label>
              <Select
                value={filters.condition}
                onValueChange={(value) => setFilters(prev => ({ ...prev, condition: value }))}
              >
                <SelectTrigger data-testid="select-condition-filter">
                  <SelectValue placeholder="All Conditions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Conditions</SelectItem>
                  <SelectItem value="Excellent">Excellent</SelectItem>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Fair">Fair</SelectItem>
                  <SelectItem value="Poor">Poor</SelectItem>
                  <SelectItem value="Damaged">Damaged</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assets Grid */}
      {assetsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-20 bg-gray-200 rounded mb-4"></div>
                <div className="flex gap-2">
                  <div className="h-8 bg-gray-200 rounded flex-1"></div>
                  <div className="h-8 bg-gray-200 rounded flex-1"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(filteredAssets as Asset[]).map((asset: Asset) => (
            <Card key={asset.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {asset.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {asset.category} • {asset.type}
                    </p>
                  </div>
                  <Badge
                    variant={
                      asset.condition === "Excellent" ? "default" :
                      asset.condition === "Good" ? "secondary" :
                      asset.condition === "Fair" ? "outline" :
                      "destructive"
                    }
                  >
                    {asset.condition}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Quantity Info */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Quantity:</span>
                    <span className="font-medium">{asset.totalQuantity}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Available:</span>
                    <span className={`font-medium ${
                      asset.availableQuantity === 0 ? "text-red-600" : 
                      asset.availableQuantity < asset.totalQuantity * 0.3 ? "text-yellow-600" : 
                      "text-green-600"
                    }`}>
                      {asset.availableQuantity}
                    </span>
                  </div>
                  
                  {/* Location */}
                  {asset.location && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">{asset.location}</span>
                    </div>
                  )}

                  <Separator />

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDetailsDialog(asset)}
                      className="flex-1"
                      data-testid={`button-view-details-${asset.id}`}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPurchaseDialog(asset)}
                      data-testid={`button-add-purchase-${asset.id}`}
                    >
                      <DollarSign className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAssignDialog(asset)}
                      disabled={asset.availableQuantity === 0}
                      data-testid={`button-assign-asset-${asset.id}`}
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredAssets.length === 0 && !assetsLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filters.category !== "all" || filters.condition !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by creating your first asset"}
            </p>
            {!searchTerm && filters.category === "all" && filters.condition === "all" && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Asset
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Asset Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Asset</DialogTitle>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter asset name" {...field} data-testid="input-asset-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-asset-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Equipment">Equipment</SelectItem>
                          <SelectItem value="Furniture">Furniture</SelectItem>
                          <SelectItem value="Technology">Technology</SelectItem>
                          <SelectItem value="Sports">Sports</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Laptop, Chair, Ball" {...field} data-testid="input-asset-type" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condition*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-asset-condition">
                            <SelectValue placeholder="Select condition" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Excellent">Excellent</SelectItem>
                          <SelectItem value="Good">Good</SelectItem>
                          <SelectItem value="Fair">Fair</SelectItem>
                          <SelectItem value="Poor">Poor</SelectItem>
                          <SelectItem value="Damaged">Damaged</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="totalQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity*</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1"
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          data-testid="input-asset-quantity"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-asset-location">
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {gradeSections.map((section) => (
                            <SelectItem key={section.id} value={section.name}>
                              {section.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter serial number" {...field} data-testid="input-asset-serial" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter brand" {...field} data-testid="input-asset-brand" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter asset description"
                        className="resize-none"
                        {...field}
                        data-testid="textarea-asset-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createAssetMutation.isPending}
                  data-testid="button-submit-create-asset"
                >
                  {createAssetMutation.isPending ? "Creating..." : "Create Asset"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Purchase Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Purchase for {selectedAsset?.name}</DialogTitle>
          </DialogHeader>
          <Form {...purchaseForm}>
            <form onSubmit={purchaseForm.handleSubmit(onPurchaseSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={purchaseForm.control}
                  name="purchaseDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Date*</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-purchase-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={purchaseForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity*</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1"
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          data-testid="input-purchase-quantity"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={purchaseForm.control}
                name="purchasePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Price*</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        data-testid="input-purchase-price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={purchaseForm.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter supplier name" {...field} data-testid="input-purchase-supplier" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={purchaseForm.control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter invoice number" {...field} data-testid="input-purchase-invoice" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowPurchaseDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={addPurchaseMutation.isPending}
                  data-testid="button-submit-add-purchase"
                >
                  {addPurchaseMutation.isPending ? "Adding..." : "Add Purchase"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assign {selectedAsset?.name}</DialogTitle>
          </DialogHeader>
          <Form {...assignmentForm}>
            <form onSubmit={assignmentForm.handleSubmit(onAssignmentSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={assignmentForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity*</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1"
                          max={selectedAsset?.availableQuantity || 1}
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          data-testid="input-assignment-quantity"
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-gray-500">
                        Available: {selectedAsset?.availableQuantity}
                      </p>
                    </FormItem>
                  )}
                />

                <FormField
                  control={assignmentForm.control}
                  name="assignedDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assignment Date*</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-assignment-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={assignmentForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-assignment-location">
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {gradeSections.map((section) => (
                          <SelectItem key={section.id} value={section.name}>
                            {section.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={assignmentForm.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned To</FormLabel>
                    <FormControl>
                      <Input placeholder="Person/Department name" {...field} data-testid="input-assignment-assignee" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={assignmentForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Assignment notes"
                        className="resize-none"
                        {...field}
                        data-testid="textarea-assignment-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAssignDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={assignAssetMutation.isPending}
                  data-testid="button-submit-assign-asset"
                >
                  {assignAssetMutation.isPending ? "Assigning..." : "Assign Asset"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Asset Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              {selectedAsset?.name} - Complete History
            </DialogTitle>
          </DialogHeader>
          
          {assetDetails && (
            <div className="space-y-6">
              {/* Asset Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Asset Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Total Cost:</span>
                      <span className="ml-2">${assetDetails.totalPurchaseCost?.toFixed(2) || "0.00"}</span>
                    </div>
                    <div>
                      <span className="font-medium">Current Value:</span>
                      <span className="ml-2">${assetDetails.currentValue?.toFixed(2) || "0.00"}</span>
                    </div>
                    <div>
                      <span className="font-medium">Total Quantity:</span>
                      <span className="ml-2">{assetDetails.totalQuantity}</span>
                    </div>
                    <div>
                      <span className="font-medium">Available:</span>
                      <span className="ml-2">{assetDetails.availableQuantity}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Purchase History */}
              <Accordion type="single" collapsible defaultValue="purchases">
                <AccordionItem value="purchases">
                  <AccordionTrigger className="text-lg font-semibold">
                    Purchase History ({assetDetails.purchases?.length || 0})
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      {(assetDetails.purchases as AssetPurchase[])?.map((purchase: AssetPurchase) => (
                        <Card key={purchase.id}>
                          <CardContent className="pt-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Date:</span>
                                <span className="ml-2">
                                  {new Date(purchase.purchaseDate).toLocaleDateString()}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium">Quantity:</span>
                                <span className="ml-2">{purchase.quantity}</span>
                              </div>
                              <div>
                                <span className="font-medium">Unit Price:</span>
                                <span className="ml-2">${purchase.purchasePrice.toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="font-medium">Total Cost:</span>
                                <span className="ml-2">${purchase.totalCost.toFixed(2)}</span>
                              </div>
                              {purchase.supplier && (
                                <div>
                                  <span className="font-medium">Supplier:</span>
                                  <span className="ml-2">{purchase.supplier}</span>
                                </div>
                              )}
                              {purchase.invoiceNumber && (
                                <div>
                                  <span className="font-medium">Invoice:</span>
                                  <span className="ml-2">{purchase.invoiceNumber}</span>
                                </div>
                              )}
                            </div>
                            {purchase.notes && (
                              <div className="mt-2 text-sm">
                                <span className="font-medium">Notes:</span>
                                <p className="text-gray-600 mt-1">{purchase.notes}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )) || (
                        <p className="text-gray-500 text-center py-4">No purchase history available</p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Assignment History */}
                <AccordionItem value="assignments">
                  <AccordionTrigger className="text-lg font-semibold">
                    Assignment History ({assetDetails.assignments?.length || 0})
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      {(assetDetails.assignments as AssetAssignment[])?.map((assignment: AssetAssignment) => (
                        <Card key={assignment.id}>
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start mb-2">
                              <Badge variant={
                                assignment.status === 'assigned' ? 'default' : 'secondary'
                              }>
                                {assignment.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Location:</span>
                                <span className="ml-2">{assignment.location}</span>
                              </div>
                              <div>
                                <span className="font-medium">Quantity:</span>
                                <span className="ml-2">{assignment.quantity}</span>
                              </div>
                              <div>
                                <span className="font-medium">Assigned Date:</span>
                                <span className="ml-2">
                                  {new Date(assignment.assignedDate).toLocaleDateString()}
                                </span>
                              </div>
                              {assignment.returnDate && (
                                <div>
                                  <span className="font-medium">Returned Date:</span>
                                  <span className="ml-2">
                                    {new Date(assignment.returnDate).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                              {assignment.assignedTo && (
                                <div>
                                  <span className="font-medium">Assigned To:</span>
                                  <span className="ml-2">{assignment.assignedTo}</span>
                                </div>
                              )}
                            </div>
                            {assignment.notes && (
                              <div className="mt-2 text-sm">
                                <span className="font-medium">Notes:</span>
                                <p className="text-gray-600 mt-1">{assignment.notes}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )) || (
                        <p className="text-gray-500 text-center py-4">No assignment history available</p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </SchoolLayout>
  );
}