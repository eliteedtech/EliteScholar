import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Plus, Search, Filter, Eye, DollarSign, Package, Edit, Trash2, History, ShoppingCart, TrendingUp } from "lucide-react";
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

// Supply categories
const SUPPLY_CATEGORIES = [
  "Uniforms",
  "Textbooks", 
  "Stationery",
  "Sports",
  "Cleaning",
  "Teaching Materials",
  "Laboratory",
  "Medical",
  "Kitchen",
  "Other"
];

// Supply units
const SUPPLY_UNITS = [
  "piece",
  "set", 
  "pair",
  "kg",
  "g",
  "liter",
  "ml",
  "meter",
  "cm",
  "box",
  "pack",
  "dozen",
  "bundle",
  "roll"
];

// Usage types
const USAGE_TYPES = [
  "issued",
  "sold", 
  "consumed",
  "lost",
  "damaged"
];

// Supply form schema
const supplyFormSchema = z.object({
  name: z.string().min(1, "Supply name is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  type: z.string().min(1, "Type is required"),
  unit: z.string().min(1, "Unit is required"),
  minimumStock: z.number().min(0, "Minimum stock must be positive").default(0),
  maximumStock: z.number().min(1, "Maximum stock must be positive").default(1000),
  location: z.string().optional(),
  supplier: z.string().optional(),
  notes: z.string().optional(),
});

// Purchase form schema
const purchaseFormSchema = z.object({
  purchaseDate: z.string().min(1, "Purchase date is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Price must be positive"),
  supplier: z.string().optional(),
  invoiceNumber: z.string().optional(),
  notes: z.string().optional(),
});

// Usage form schema
const usageFormSchema = z.object({
  usageType: z.enum(["issued", "sold", "consumed", "lost", "damaged"]),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  recipient: z.string().optional(),
  purpose: z.string().optional(),
  usageDate: z.string().min(1, "Usage date is required"),
  notes: z.string().optional(),
});

type SupplyFormData = z.infer<typeof supplyFormSchema>;
type PurchaseFormData = z.infer<typeof purchaseFormSchema>;
type UsageFormData = z.infer<typeof usageFormSchema>;

interface Supply {
  id: string;
  name: string;
  description?: string;
  category: string;
  type: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  unitPrice?: number;
  supplier?: string;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface SupplyPurchase {
  id: string;
  purchaseDate: string;
  quantity: number;
  unitPrice: number;
  totalCost: number;
  supplier?: string;
  invoiceNumber?: string;
  notes?: string;
  createdAt: string;
}

interface SupplyUsage {
  id: string;
  usageType: string;
  quantity: number;
  recipient?: string;
  purpose?: string;
  usageDate: string;
  notes?: string;
  createdAt: string;
}

export default function SupplySetup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedSupply, setSelectedSupply] = useState<Supply | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [showUsageDialog, setShowUsageDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [filters, setFilters] = useState({ category: "all", stockLevel: "all" });
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch supplies
  const { data: supplies = [], isLoading, error } = useQuery<Supply[]>({
    queryKey: ["/api/schools", user?.schoolId, "supplies"],
    enabled: !!user?.schoolId,
  });

  // Fetch suppliers for dropdown
  const { data: suppliers = [] } = useQuery<any[]>({
    queryKey: ["/api/schools", user?.schoolId, "suppliers"],
    enabled: !!user?.schoolId,
  });

  // Forms
  const createForm = useForm<SupplyFormData>({
    resolver: zodResolver(supplyFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      type: "",
      unit: "piece",
      minimumStock: 0,
      maximumStock: 1000,
      location: "",
      supplier: "",
      notes: "",
    },
  });

  const purchaseForm = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      purchaseDate: new Date().toISOString().split('T')[0],
      quantity: 1,
      unitPrice: 0,
      supplier: "",
      invoiceNumber: "",
      notes: "",
    },
  });

  const usageForm = useForm<UsageFormData>({
    resolver: zodResolver(usageFormSchema),
    defaultValues: {
      usageType: "issued",
      quantity: 1,
      recipient: "",
      purpose: "",
      usageDate: new Date().toISOString().split('T')[0],
      notes: "",
    },
  });

  // Create supply mutation
  const createSupplyMutation = useMutation({
    mutationFn: async (data: SupplyFormData) => {
      const response = await apiRequest("POST", "/api/supplies", {
        ...data,
        schoolId: user?.schoolId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schools", user?.schoolId, "supplies"] });
      setShowCreateDialog(false);
      createForm.reset();
      toast({ title: "Success", description: "Supply created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Add purchase mutation
  const addPurchaseMutation = useMutation({
    mutationFn: async (data: PurchaseFormData) => {
      const totalCost = data.quantity * data.unitPrice;
      const response = await apiRequest("POST", `/api/supplies/${selectedSupply?.id}/purchases`, {
        ...data,
        totalCost,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schools", user?.schoolId, "supplies"] });
      setShowPurchaseDialog(false);
      purchaseForm.reset();
      toast({ title: "Success", description: "Purchase recorded successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Record usage mutation
  const recordUsageMutation = useMutation({
    mutationFn: async (data: UsageFormData) => {
      const response = await apiRequest("POST", `/api/supplies/${selectedSupply?.id}/usage`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schools", user?.schoolId, "supplies"] });
      setShowUsageDialog(false);
      usageForm.reset();
      toast({ title: "Success", description: "Usage recorded successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Form handlers
  const onCreateSubmit = (data: SupplyFormData) => {
    createSupplyMutation.mutate(data);
  };

  const onPurchaseSubmit = (data: PurchaseFormData) => {
    addPurchaseMutation.mutate(data);
  };

  const onUsageSubmit = (data: UsageFormData) => {
    recordUsageMutation.mutate(data);
  };

  // Filter supplies
  const filteredSupplies = supplies.filter((supply) => {
    const matchesSearch = supply.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supply.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filters.category === "all" || supply.category === filters.category;
    
    let matchesStockLevel = true;
    if (filters.stockLevel === "low") {
      matchesStockLevel = supply.currentStock <= supply.minimumStock;
    } else if (filters.stockLevel === "out") {
      matchesStockLevel = supply.currentStock === 0;
    } else if (filters.stockLevel === "adequate") {
      matchesStockLevel = supply.currentStock > supply.minimumStock;
    }
    
    return matchesSearch && matchesCategory && matchesStockLevel;
  });

  // Get stock status
  const getStockStatus = (supply: Supply) => {
    if (supply.currentStock === 0) return { status: "Out of Stock", color: "bg-red-500" };
    if (supply.currentStock <= supply.minimumStock) return { status: "Low Stock", color: "bg-yellow-500" };
    return { status: "In Stock", color: "bg-green-500" };
  };

  const handleOpenPurchaseDialog = (supply: Supply) => {
    setSelectedSupply(supply);
    purchaseForm.reset({
      purchaseDate: new Date().toISOString().split('T')[0],
      quantity: 1,
      unitPrice: supply.unitPrice || 0,
      supplier: supply.supplier || "",
      invoiceNumber: "",
      notes: "",
    });
    setShowPurchaseDialog(true);
  };

  const handleOpenUsageDialog = (supply: Supply) => {
    setSelectedSupply(supply);
    usageForm.reset({
      usageType: "issued",
      quantity: 1,
      recipient: "",
      purpose: "",
      usageDate: new Date().toISOString().split('T')[0],
      notes: "",
    });
    setShowUsageDialog(true);
  };

  if (isLoading) return <SchoolLayout title="Supply Management"><div>Loading supplies...</div></SchoolLayout>;
  if (error) return <SchoolLayout title="Supply Management"><div>Error loading supplies</div></SchoolLayout>;

  return (
    <SchoolLayout title="Supply Management">
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Supply Management</h1>
            <p className="text-gray-600 mt-1">Manage school supplies, track inventory and purchases</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} data-testid="button-add-supply">
            <Plus className="h-4 w-4 mr-2" />
            Add Supply
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Supplies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{supplies.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Low Stock Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {supplies.filter((s) => s.currentStock <= s.minimumStock && s.currentStock > 0).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Out of Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {supplies.filter((s) => s.currentStock === 0).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${supplies.reduce((sum, s) => sum + ((s.unitPrice || 0) * s.currentStock), 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search supplies..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    data-testid="input-search-supplies"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="w-40" data-testid="select-category-filter">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {SUPPLY_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={filters.stockLevel} onValueChange={(value) => setFilters(prev => ({ ...prev, stockLevel: value }))}>
                  <SelectTrigger className="w-40" data-testid="select-stock-filter">
                    <SelectValue placeholder="Stock Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stock</SelectItem>
                    <SelectItem value="adequate">In Stock</SelectItem>
                    <SelectItem value="low">Low Stock</SelectItem>
                    <SelectItem value="out">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supplies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSupplies.map((supply: Supply) => {
            const stockStatus = getStockStatus(supply);
            return (
              <Card key={supply.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold truncate">{supply.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{supply.category} • {supply.type}</p>
                    </div>
                    <Badge className={`${stockStatus.color} text-white text-xs`}>
                      {stockStatus.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Current Stock:</span>
                      <div className="font-semibold">{supply.currentStock} {supply.unit}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Unit Price:</span>
                      <div className="font-semibold">${supply.unitPrice?.toFixed(2) || "0.00"}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Min Stock:</span>
                      <div className="font-semibold">{supply.minimumStock} {supply.unit}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Total Value:</span>
                      <div className="font-semibold">${((supply.unitPrice || 0) * supply.currentStock).toFixed(2)}</div>
                    </div>
                  </div>
                  
                  {supply.description && (
                    <p className="text-sm text-gray-600 truncate">{supply.description}</p>
                  )}
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenPurchaseDialog(supply)}
                      data-testid={`button-purchase-${supply.id}`}
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Purchase
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenUsageDialog(supply)}
                      data-testid={`button-usage-${supply.id}`}
                    >
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Usage
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedSupply(supply);
                        setShowDetailsDialog(true);
                      }}
                      data-testid={`button-details-${supply.id}`}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {filteredSupplies.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No supplies found</h3>
              <p className="text-gray-600">
                {searchTerm || filters.category !== "all" || filters.stockLevel !== "all"
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first supply item"
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Supply Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Supply</DialogTitle>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supply Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter supply name" {...field} data-testid="input-supply-name" />
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
                          <SelectTrigger data-testid="select-supply-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SUPPLY_CATEGORIES.map((category) => (
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Polo Shirt, Exercise Book" {...field} data-testid="input-supply-type" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-supply-unit">
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SUPPLY_UNITS.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={createForm.control}
                  name="minimumStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Stock</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-minimum-stock"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="maximumStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Stock</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1"
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1000)}
                          data-testid="input-maximum-stock"
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
                      <FormLabel>Storage Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Store Room A" {...field} data-testid="input-supply-location" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createForm.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Supplier</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-supply-supplier">
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No supplier</SelectItem>
                        {suppliers.map((supplier: any) => (
                          <SelectItem key={supplier.id} value={supplier.name}>
                            {supplier.name}
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional details about the supply"
                        className="resize-none"
                        {...field}
                        data-testid="textarea-supply-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional notes"
                        className="resize-none"
                        {...field}
                        data-testid="textarea-supply-notes"
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
                  disabled={createSupplyMutation.isPending}
                  data-testid="button-submit-create-supply"
                >
                  {createSupplyMutation.isPending ? "Creating..." : "Create Supply"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Purchase Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Record Purchase for {selectedSupply?.name}</DialogTitle>
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
                      <p className="text-xs text-gray-500">
                        Unit: {selectedSupply?.unit}
                      </p>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={purchaseForm.control}
                name="unitPrice"
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-purchase-supplier">
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No supplier</SelectItem>
                        {suppliers.map((supplier: any) => (
                          <SelectItem key={supplier.id} value={supplier.name}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      <Input placeholder="Enter invoice number" {...field} data-testid="input-invoice-number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={purchaseForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Purchase notes"
                        className="resize-none"
                        {...field}
                        data-testid="textarea-purchase-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-gray-50 p-3 rounded-md">
                <div className="flex justify-between text-sm">
                  <span>Total Cost:</span>
                  <span className="font-semibold">
                    ${((purchaseForm.watch("quantity") || 0) * (purchaseForm.watch("unitPrice") || 0)).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowPurchaseDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={addPurchaseMutation.isPending}
                  data-testid="button-submit-purchase"
                >
                  {addPurchaseMutation.isPending ? "Recording..." : "Record Purchase"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Usage Dialog */}
      <Dialog open={showUsageDialog} onOpenChange={setShowUsageDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Record Usage for {selectedSupply?.name}</DialogTitle>
          </DialogHeader>
          <Form {...usageForm}>
            <form onSubmit={usageForm.handleSubmit(onUsageSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={usageForm.control}
                  name="usageType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usage Type*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-usage-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {USAGE_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={usageForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity*</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1"
                          max={selectedSupply?.currentStock || 1}
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          data-testid="input-usage-quantity"
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-gray-500">
                        Available: {selectedSupply?.currentStock} {selectedSupply?.unit}
                      </p>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={usageForm.control}
                name="usageDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usage Date*</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-usage-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={usageForm.control}
                name="recipient"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient</FormLabel>
                    <FormControl>
                      <Input placeholder="Who received the supplies" {...field} data-testid="input-usage-recipient" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={usageForm.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purpose</FormLabel>
                    <FormControl>
                      <Input placeholder="Purpose of usage" {...field} data-testid="input-usage-purpose" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={usageForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Usage notes"
                        className="resize-none"
                        {...field}
                        data-testid="textarea-usage-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowUsageDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={recordUsageMutation.isPending}
                  data-testid="button-submit-usage"
                >
                  {recordUsageMutation.isPending ? "Recording..." : "Record Usage"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </SchoolLayout>
  );
}