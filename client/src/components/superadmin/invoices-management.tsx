import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Search, Edit, Eye, Mail, FileText, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { InvoiceWithLines, SchoolWithDetails } from "@shared/schema";

export default function InvoicesManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch invoices
  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ["/api/invoices"],
  });

  // Fetch schools for invoice creation
  const { data: schoolsData } = useQuery({
    queryKey: ["/api/superadmin/schools"],
  });

  // Fetch features for invoice creation
  const { data: featuresData } = useQuery({
    queryKey: ["/api/features"],
  });

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (invoiceData: any) => {
      const response = await apiRequest("POST", "/api/invoices", invoiceData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Invoice created successfully",
        description: "Invoice has been generated and sent to the school.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating invoice",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const invoices = (invoicesData as any)?.invoices || [];
  const schools = (schoolsData as any)?.schools || [];
  const features = featuresData || [];

  const filteredInvoices = invoices.filter((invoice: InvoiceWithLines) =>
    (invoice.school as any)?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateInvoice = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const invoiceData = {
      schoolId: formData.get("schoolId"),
      dueDate: formData.get("dueDate"),
      notes: formData.get("notes"),
      selectedFeatures: [], // Will be populated from form
      customAmount: formData.get("customAmount"),
    };

    createInvoiceMutation.mutate(invoiceData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "SENT":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "OVERDUE":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200";
    }
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
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Invoice Management</h2>
          <p className="text-slate-600 dark:text-slate-400">Create and manage school invoices</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-invoice">
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="schoolId">Select School *</Label>
                <Select name="schoolId" required>
                  <SelectTrigger data-testid="select-school">
                    <SelectValue placeholder="Choose a school" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school: SchoolWithDetails) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name} (@{school.shortName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  required
                  data-testid="input-due-date"
                />
              </div>

              <div className="space-y-2">
                <Label>Select Features</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                  {features.map((feature: any) => (
                    <div key={feature.id} className="flex items-center justify-between space-x-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`feature-${feature.id}`}
                          name="selectedFeatures"
                          value={feature.id}
                          className="rounded border-slate-300"
                        />
                        <label htmlFor={`feature-${feature.id}`} className="text-sm">
                          {feature.name}
                        </label>
                      </div>
                      <span className="text-sm text-slate-600">
                        ₦{(feature.price / 100).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customAmount">Custom Amount (₦)</Label>
                <Input
                  id="customAmount"
                  name="customAmount"
                  type="number"
                  placeholder="Enter custom amount if applicable"
                  data-testid="input-custom-amount"
                />
                <p className="text-xs text-slate-500">
                  Leave blank to auto-calculate from selected features
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  name="notes"
                  placeholder="Additional notes for the invoice"
                  data-testid="input-notes"
                />
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
                  disabled={createInvoiceMutation.isPending}
                  data-testid="button-submit-invoice"
                >
                  {createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-invoices"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>
            Manage invoices for all schools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Invoice #</th>
                  <th className="text-left p-3 font-medium">School</th>
                  <th className="text-left p-3 font-medium">Amount</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Due Date</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice: InvoiceWithLines) => (
                  <tr key={invoice.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="p-3" data-testid={`text-invoice-number-${invoice.id}`}>
                      {invoice.invoiceNumber}
                    </td>
                    <td className="p-3" data-testid={`text-school-name-${invoice.id}`}>
                      {(invoice.school as any)?.name || "Unknown School"}
                    </td>
                    <td className="p-3" data-testid={`text-amount-${invoice.id}`}>
                      ₦{(invoice.totalAmount / 100).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <Badge 
                        className={getStatusColor(invoice.status)}
                        data-testid={`badge-status-${invoice.id}`}
                      >
                        {invoice.status}
                      </Badge>
                    </td>
                    <td className="p-3" data-testid={`text-due-date-${invoice.id}`}>
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          data-testid={`button-view-${invoice.id}`}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          data-testid={`button-edit-${invoice.id}`}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          data-testid={`button-send-${invoice.id}`}
                        >
                          <Mail className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          data-testid={`button-download-${invoice.id}`}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredInvoices.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-slate-400 mb-4" />
              <p className="text-slate-600 text-center">
                {searchTerm ? "No invoices found matching your search." : "No invoices created yet."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}