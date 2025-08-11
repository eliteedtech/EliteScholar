import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, FileText, Send, Calculator, Download, Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { api } from "@/lib/api";
import SuperAdminLayout from "@/components/superadmin/layout";
import InvoiceSendPage from "./invoice-send";
import type { School as SchoolType, Feature as FeatureType, Invoice as InvoiceType } from "@/lib/types";

// Enhanced invoice form schema
const invoiceLineSchema = z.object({
  featureId: z.string(),
  quantity: z.number().min(1),
  unitPrice: z.number(),
  unitMeasurement: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  negotiatedPrice: z.number().optional(),
});

const invoiceSchema = z.object({
  schoolId: z.string().min(1, "School is required"),
  features: z.array(invoiceLineSchema).min(1, "At least one feature must be selected"),
  finalAmount: z.number().optional(),
  dueDate: z.string().min(1, "Due date is required"),
  notes: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;
type InvoiceLineData = z.infer<typeof invoiceLineSchema>;

interface School {
  id: string;
  name: string;
  shortName: string;
  adminEmail: string;
  hasNegotiatedPrice: boolean;
}

interface Feature {
  id: string;
  name: string;
  description?: string;
  price: number;
  pricingType: "per_student" | "per_staff" | "per_term" | "per_semester" | "per_school" | "per_month" | "per_year" | "one_time" | "pay_as_you_go" | "custom" | "free";
  requiresDateRange?: boolean;
  isActive: boolean;
}

interface SchoolFeature {
  id: string;
  schoolId: string;
  featureId: string;
  enabled: boolean;
  feature: Feature;
}

interface Invoice {
  id: string;
  schoolId: string;
  schoolName: string;
  invoiceNumber: string;
  totalAmount: number;
  finalAmount?: number;
  status: "pending" | "paid" | "overdue";
  dueDate: string;
  features: InvoiceLineData[];
  notes?: string;
  createdAt: string;
  paidAt?: string;
}

const UNIT_MEASUREMENT_OPTIONS = [
  { value: "per_student", label: "Per Student" },
  { value: "per_staff", label: "Per Staff" },
  { value: "per_term", label: "Per Term" },
  { value: "per_semester", label: "Per Semester" },
  { value: "per_school", label: "Per School" },
  { value: "per_month", label: "Per Month" },
  { value: "per_year", label: "Per Year" },
  { value: "one_time", label: "One Time" },
  { value: "pay_as_you_go", label: "Pay As You Go" },
  { value: "custom", label: "Custom" },
];

export default function EnhancedInvoicesPage() {
  const { toast } = useToast();
  const [sendingInvoice, setSendingInvoice] = useState<{
    id: string;
    schoolName: string;
    invoiceNumber: string;
    totalAmount: string;
  } | null>(null);
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  const [enabledFeatures, setEnabledFeatures] = useState<SchoolFeature[]>([]);
  const [calculatedTotal, setCalculatedTotal] = useState(0);

  // Form setup
  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      schoolId: "",
      features: [],
      dueDate: "",
      notes: "",
    },
  });

  // Fetch invoices
  const { data: invoicesResponse, isLoading } = useQuery<{ invoices: Invoice[]; total: number }>({
    queryKey: ["/api/invoices"],
  });
  const invoices = invoicesResponse?.invoices || [];

  // Fetch schools
  const { data: schoolsResponse } = useQuery<{ schools: SchoolType[] }>({
    queryKey: ["/api/superadmin/schools"],
  });
  const schools = schoolsResponse?.schools || [];

  // Fetch enabled school features when school is selected
  useEffect(() => {
    if (selectedSchoolId) {
      api.superadmin.getEnabledSchoolFeatures(selectedSchoolId)
        .then((features) => {
          setEnabledFeatures(features);
        })
        .catch((error) => {
          console.error("Failed to fetch school features:", error);
          toast({
            title: "Error",
            description: "Failed to fetch school features",
            variant: "destructive",
          });
        });
    }
  }, [selectedSchoolId, toast]);

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      const response = await apiRequest("POST", "/api/invoices/enhanced", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Enhanced invoice created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setCreateDialogOpen(false);
      form.reset();
      setSelectedSchoolId("");
      setEnabledFeatures([]);
      setCalculatedTotal(0);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle school selection
  const handleSchoolChange = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    form.setValue("schoolId", schoolId);
    form.setValue("features", []); // Reset features when school changes
  };

  // Add feature to invoice
  const addFeature = (feature: Feature) => {
    const currentFeatures = form.getValues("features");
    const existingFeature = currentFeatures.find(f => f.featureId === feature.id);
    
    if (existingFeature) {
      toast({
        title: "Feature already added",
        description: "This feature is already in the invoice",
        variant: "destructive",
      });
      return;
    }

    const newFeature: InvoiceLineData = {
      featureId: feature.id,
      quantity: 1,
      unitPrice: feature.price / 100, // Convert from kobo to naira
      unitMeasurement: feature.pricingType || "per_school",
      ...(feature.requiresDateRange && {
        startDate: "",
        endDate: "",
      }),
    };

    form.setValue("features", [...currentFeatures, newFeature]);
    calculateTotal();
  };

  // Remove feature from invoice
  const removeFeature = (index: number) => {
    const currentFeatures = form.getValues("features");
    const updatedFeatures = currentFeatures.filter((_, i) => i !== index);
    form.setValue("features", updatedFeatures);
    calculateTotal();
  };

  // Calculate total amount
  const calculateTotal = () => {
    const features = form.getValues("features");
    const total = features.reduce((sum, feature) => {
      const price = feature.negotiatedPrice || feature.unitPrice;
      return sum + (price * feature.quantity);
    }, 0);
    setCalculatedTotal(total);
  };

  // Update feature data
  const updateFeature = (index: number, field: keyof InvoiceLineData, value: any) => {
    const currentFeatures = form.getValues("features");
    const updatedFeatures = [...currentFeatures];
    (updatedFeatures[index] as any)[field] = value;
    form.setValue("features", updatedFeatures);
    calculateTotal();
  };

  const handleSubmit = (data: InvoiceFormData) => {
    // Add final amount if provided
    const submitData = {
      ...data,
      finalAmount: data.finalAmount || calculatedTotal,
    };
    createInvoiceMutation.mutate(submitData);
  };

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`;
  };

  const getFeatureName = (featureId: string) => {
    const feature = enabledFeatures.find(f => f.feature.id === featureId);
    return feature?.feature.name || "Unknown Feature";
  };

  return (
    <SuperAdminLayout
      title="Enhanced Invoice Management"
      subtitle="Create and manage feature-based invoices with unit measurements and negotiated pricing"
    >
      <div className="space-y-6" data-testid="enhanced-invoices-page">
        <div className="flex items-center justify-between">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-enhanced-invoice">
                <Plus className="h-4 w-4 mr-2" />
                Create Enhanced Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Enhanced Invoice</DialogTitle>
                <DialogDescription>
                  Create an invoice with school-specific features, unit measurements, and negotiated pricing
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  {/* School Selection */}
                  <FormField
                    control={form.control}
                    name="schoolId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>School</FormLabel>
                        <Select onValueChange={handleSchoolChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-school-enhanced">
                              <SelectValue placeholder="Select school" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {schools.map((school: SchoolType) => (
                              <SelectItem key={school.id} value={school.id}>
                                {school.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Available Features */}
                  {selectedSchoolId && enabledFeatures.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Available Features for School</CardTitle>
                        <CardDescription>
                          Only enabled features for this school are shown
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 max-h-40 overflow-y-auto">
                          {enabledFeatures.map((schoolFeature) => (
                            <div key={schoolFeature.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex-1">
                                <div className="font-medium">{schoolFeature.feature.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {formatPrice(schoolFeature.feature.price / 100)} • {schoolFeature.feature.pricingType}
                                </div>
                                {schoolFeature.feature.requiresDateRange && (
                                  <Badge variant="outline" className="text-xs">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    Requires Dates
                                  </Badge>
                                )}
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => addFeature(schoolFeature.feature)}
                                data-testid={`button-add-feature-${schoolFeature.feature.id}`}
                              >
                                Add
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Selected Features */}
                  {form.watch("features").length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Invoice Features</CardTitle>
                        <CardDescription>
                          Configure quantities, unit measurements, and pricing for each feature
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {form.watch("features").map((feature, index) => (
                            <div key={index} className="p-4 border rounded-lg space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">{getFeatureName(feature.featureId)}</h4>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeFeature(index)}
                                  data-testid={`button-remove-feature-${index}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {/* Quantity */}
                                <div>
                                  <label className="text-sm font-medium">Quantity</label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={feature.quantity}
                                    onChange={(e) => updateFeature(index, "quantity", parseInt(e.target.value) || 1)}
                                    data-testid={`input-quantity-${index}`}
                                  />
                                </div>

                                {/* Unit Measurement */}
                                <div>
                                  <label className="text-sm font-medium">Unit Measurement</label>
                                  <Select
                                    value={feature.unitMeasurement}
                                    onValueChange={(value) => updateFeature(index, "unitMeasurement", value)}
                                  >
                                    <SelectTrigger data-testid={`select-unit-${index}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {UNIT_MEASUREMENT_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Unit Price */}
                                <div>
                                  <label className="text-sm font-medium">Unit Price (₦)</label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={feature.unitPrice}
                                    onChange={(e) => updateFeature(index, "unitPrice", parseFloat(e.target.value) || 0)}
                                    data-testid={`input-unit-price-${index}`}
                                  />
                                </div>

                                {/* Negotiated Price */}
                                <div>
                                  <label className="text-sm font-medium">Negotiated Price (₦)</label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={feature.negotiatedPrice || ""}
                                    onChange={(e) => updateFeature(index, "negotiatedPrice", parseFloat(e.target.value) || undefined)}
                                    placeholder="Override price"
                                    data-testid={`input-negotiated-price-${index}`}
                                  />
                                </div>
                              </div>

                              {/* Date Range (if required) */}
                              {enabledFeatures.find(f => f.feature.id === feature.featureId)?.feature.requiresDateRange && (
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Start Date</label>
                                    <Input
                                      type="date"
                                      value={feature.startDate || ""}
                                      onChange={(e) => updateFeature(index, "startDate", e.target.value)}
                                      data-testid={`input-start-date-${index}`}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">End Date</label>
                                    <Input
                                      type="date"
                                      value={feature.endDate || ""}
                                      onChange={(e) => updateFeature(index, "endDate", e.target.value)}
                                      data-testid={`input-end-date-${index}`}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Line Total */}
                              <div className="flex justify-end">
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Line Total: </span>
                                  <span className="font-medium">
                                    {formatPrice((feature.negotiatedPrice || feature.unitPrice) * feature.quantity)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Total Amount */}
                        <div className="flex justify-between items-center pt-4 border-t">
                          <span className="text-lg font-medium">Calculated Total:</span>
                          <span className="text-xl font-bold">{formatPrice(calculatedTotal)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Final Amount Override */}
                  <FormField
                    control={form.control}
                    name="finalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Final Amount (Optional Override)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Leave empty to use calculated total"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                            data-testid="input-final-amount"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Due Date */}
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-due-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Additional notes for the invoice..."
                            {...field}
                            data-testid="textarea-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createInvoiceMutation.isPending}
                      data-testid="button-submit-enhanced-invoice"
                    >
                      {createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle>Enhanced Invoices</CardTitle>
            <CardDescription>
              Feature-based invoices with detailed pricing and measurements
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading invoices...</div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No invoices found. Create your first enhanced invoice!
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.schoolName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {invoice.features.length} feature{invoice.features.length !== 1 ? 's' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatPrice(invoice.finalAmount || invoice.totalAmount)}
                        {invoice.finalAmount && invoice.finalAmount !== invoice.totalAmount && (
                          <div className="text-xs text-muted-foreground">
                            (Base: {formatPrice(invoice.totalAmount)})
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            invoice.status === "paid" ? "default" :
                            invoice.status === "overdue" ? "destructive" : "secondary"
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // View invoice logic - could open a preview dialog
                              toast({
                                title: "View Invoice",
                                description: `Opening invoice ${invoice.invoiceNumber}`,
                              });
                            }}
                            data-testid={`button-view-invoice-${invoice.id}`}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSendingInvoice({
                                id: invoice.id,
                                schoolName: invoice.schoolName,
                                invoiceNumber: invoice.invoiceNumber,
                                totalAmount: formatPrice(invoice.finalAmount || invoice.totalAmount),
                              });
                            }}
                            data-testid={`button-send-email-${invoice.id}`}
                          >
                            <Send className="h-4 w-4" />
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
    </SuperAdminLayout>
  );
}