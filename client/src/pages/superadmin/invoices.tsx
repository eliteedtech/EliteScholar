import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, FileText, Send, Calculator, Download } from "lucide-react";

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
import SuperAdminLayout from "@/components/superadmin/layout";
import type { School as SchoolType, Feature as FeatureType, Invoice as InvoiceType } from "@/lib/types";

// Invoice form schema
const invoiceSchema = z.object({
  schoolId: z.string().min(1, "School is required"),
  features: z.array(z.string()).min(1, "At least one feature must be selected"),
  customAmount: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"),
  notes: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface School {
  id: string;
  schoolName: string;
  shortName: string;
  adminEmail: string;
  hasNegotiatedPrice: boolean;
}

interface Feature {
  id: string;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
}

interface Invoice {
  id: string;
  schoolId: string;
  schoolName: string;
  invoiceNumber: string;
  totalAmount: number;
  customAmount?: number;
  status: "pending" | "paid" | "overdue";
  dueDate: string;
  features: { id: string; name: string; price: number }[];
  notes?: string;
  createdAt: string;
  paidAt?: string;
}

export default function InvoicesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  const [showCustomAmount, setShowCustomAmount] = useState(false);

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

  // Fetch features
  const { data: features = [] } = useQuery<FeatureType[]>({
    queryKey: ["/api/features"],
  });

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      const response = await apiRequest("POST", "/api/invoices", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice created successfully! Email sent to school.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setCreateDialogOpen(false);
      form.reset();
      setSelectedFeatures([]);
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

  // Update invoice mutation
  const updateInvoiceMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<InvoiceFormData> }) => {
      const response = await apiRequest("PATCH", `/api/invoices/${data.id}`, data.updates);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setEditDialogOpen(false);
      setSelectedInvoice(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete invoice mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/invoices/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send invoice email mutation
  const sendInvoiceEmailMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const response = await apiRequest("POST", `/api/invoices/${invoiceId}/send-email`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice email sent successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Generate default invoice mutation
  const generateDefaultInvoiceMutation = useMutation({
    mutationFn: async (schoolId: string) => {
      const response = await apiRequest("POST", `/api/invoices/generate-default`, { schoolId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Default invoice generated and sent!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      schoolId: "",
      features: [],
      customAmount: "",
      dueDate: "",
      notes: "",
    },
  });

  // Calculate total when features change
  const handleFeatureChange = (featureId: string, checked: boolean) => {
    let newSelected = [...selectedFeatures];
    
    if (checked) {
      newSelected.push(featureId);
    } else {
      newSelected = newSelected.filter(id => id !== featureId);
    }
    
    setSelectedFeatures(newSelected);
    form.setValue("features", newSelected);
    
    // Calculate total
    const total = newSelected.reduce((sum, id) => {
      const feature = features.find((f: FeatureType) => f.id === id);
      return sum + (feature?.price || 0);
    }, 0);
    
    setCalculatedTotal(total);
  };

  // Check if selected school has negotiated pricing
  const selectedSchool = schools.find((s: SchoolType) => s.id === form.watch("schoolId"));
  const hasNegotiatedPrice = false; // Remove this field for now since it's not in the schema

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setSelectedFeatures(invoice.features.map(f => f.id));
    setCalculatedTotal(invoice.totalAmount);
    
    form.reset({
      schoolId: invoice.schoolId,
      features: invoice.features.map(f => f.id),
      customAmount: invoice.customAmount?.toString() || "",
      dueDate: invoice.dueDate.split('T')[0], // Format for date input
      notes: invoice.notes || "",
    });
    
    setEditDialogOpen(true);
  };

  const handleDelete = (invoice: Invoice) => {
    if (window.confirm(`Are you sure you want to delete invoice ${invoice.invoiceNumber}? This action cannot be undone.`)) {
      deleteInvoiceMutation.mutate(invoice.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "default";
      case "pending":
        return "secondary";
      case "overdue":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <SuperAdminLayout title="Invoice Management" subtitle="Create and manage invoices for schools">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoice Management</h1>
            <p className="text-muted-foreground">Create and manage school invoices and payments</p>
          </div>

          <div className="flex space-x-2">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-invoice">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Invoice</DialogTitle>
                  <DialogDescription>
                    Select school and features to generate an invoice. Email will be sent automatically.
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => createInvoiceMutation.mutate(data))} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="schoolId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>School</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-school">
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

                      <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Due Date</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                data-testid="input-due-date" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Features Selection */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <FormLabel>Select Features</FormLabel>
                        {hasNegotiatedPrice && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCustomAmount(!showCustomAmount)}
                            data-testid="button-toggle-custom-amount"
                          >
                            <Calculator className="mr-2 h-4 w-4" />
                            {showCustomAmount ? "Hide" : "Show"} Custom Amount
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 max-h-60 overflow-y-auto border rounded-lg p-4">
                        {features.map((feature: Feature) => (
                          <div key={feature.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={feature.id}
                              checked={selectedFeatures.includes(feature.id)}
                              onCheckedChange={(checked) => handleFeatureChange(feature.id, checked as boolean)}
                              data-testid={`checkbox-feature-${feature.id}`}
                            />
                            <label
                              htmlFor={feature.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                            >
                              <div>{feature.name}</div>
                              <div className="text-xs text-muted-foreground">₦{feature.price.toLocaleString()}</div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pricing Summary */}
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex justify-between items-center text-sm">
                        <span>Calculated Total:</span>
                        <span className="font-medium">₦{calculatedTotal.toLocaleString()}</span>
                      </div>
                      
                      {showCustomAmount && hasNegotiatedPrice && (
                        <div className="mt-2">
                          <FormField
                            control={form.control}
                            name="customAmount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Custom Amount (Override)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    placeholder="Enter custom amount"
                                    data-testid="input-custom-amount"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Additional notes for this invoice"
                              data-testid="textarea-notes"
                              {...field} 
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
                        data-testid="button-cancel-create"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createInvoiceMutation.isPending || selectedFeatures.length === 0}
                        data-testid="button-submit-create"
                      >
                        {createInvoiceMutation.isPending ? "Creating..." : "Create & Send Invoice"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle>Invoices ({invoices.length})</CardTitle>
            <CardDescription>
              Manage all invoices and track payment status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading invoices...</div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No invoices found. Create your first invoice to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice: Invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <div className="font-medium">{invoice.invoiceNumber}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(invoice.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{invoice.schoolName}</div>
                        <div className="text-sm text-muted-foreground">
                          {invoice.features.length} features
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">₦{invoice.totalAmount.toLocaleString()}</div>
                        {invoice.customAmount && (
                          <div className="text-sm text-muted-foreground">
                            (Custom: ₦{invoice.customAmount.toLocaleString()})
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>{new Date(invoice.dueDate).toLocaleDateString()}</div>
                        {invoice.paidAt && (
                          <div className="text-sm text-muted-foreground">
                            Paid: {new Date(invoice.paidAt).toLocaleDateString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(invoice)}
                            data-testid={`button-edit-${invoice.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => sendInvoiceEmailMutation.mutate(invoice.id)}
                            data-testid={`button-resend-${invoice.id}`}
                          >
                            <Send className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/api/invoices/${invoice.id}/download`, '_blank')}
                            data-testid={`button-download-${invoice.id}`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(invoice)}
                            data-testid={`button-delete-${invoice.id}`}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
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