import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SuperAdminLayout from "../../components/superadmin/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Search, Filter, Download, Eye, DollarSign, Calendar } from "lucide-react";

interface Invoice {
  id: string;
  schoolName: string;
  amount: number;
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";
  dueDate: string;
  createdAt: string;
  features: string[];
}

export default function InvoicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Mock data for demonstration - replace with actual API call
  const mockInvoices: Invoice[] = [
    {
      id: "INV-001",
      schoolName: "Greenfield Academy",
      amount: 45000,
      status: "PAID",
      dueDate: "2024-02-15",
      createdAt: "2024-01-15",
      features: ["attendance", "gradebook", "messaging"]
    },
    {
      id: "INV-002", 
      schoolName: "Sunrise International",
      amount: 32000,
      status: "SENT",
      dueDate: "2024-02-20",
      createdAt: "2024-01-20",
      features: ["attendance", "gradebook"]
    },
    {
      id: "INV-003",
      schoolName: "Elite Preparatory School",
      amount: 58000,
      status: "OVERDUE",
      dueDate: "2024-01-30",
      createdAt: "2024-01-01",
      features: ["attendance", "gradebook", "messaging", "analytics", "parent-portal"]
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { label: "Draft", variant: "secondary" as const },
      SENT: { label: "Sent", variant: "default" as const },
      PAID: { label: "Paid", variant: "default" as const },
      OVERDUE: { label: "Overdue", variant: "destructive" as const },
      CANCELLED: { label: "Cancelled", variant: "secondary" as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredInvoices = mockInvoices.filter(invoice => {
    const matchesSearch = invoice.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         invoice.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = mockInvoices
    .filter(inv => inv.status === "PAID")
    .reduce((sum, inv) => sum + inv.amount, 0);

  const pendingAmount = mockInvoices
    .filter(inv => inv.status === "SENT")
    .reduce((sum, inv) => sum + inv.amount, 0);

  const overdueAmount = mockInvoices
    .filter(inv => inv.status === "OVERDUE")
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <SuperAdminLayout
      title="Invoice Management"
      subtitle="Manage billing and payments for all schools"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">₦{totalRevenue.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Payment</p>
                  <p className="text-2xl font-bold text-blue-600">₦{pendingAmount.toLocaleString()}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overdue Amount</p>
                  <p className="text-2xl font-bold text-red-600">₦{overdueAmount.toLocaleString()}</p>
                </div>
                <FileText className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                  <p className="text-2xl font-bold text-gray-900">{mockInvoices.length}</p>
                </div>
                <FileText className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Invoice Management</CardTitle>
              <Button 
                onClick={() => setShowCreateForm(true)}
                data-testid="button-create-invoice"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-invoices"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48" data-testid="select-status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>

            {/* Invoice List */}
            <div className="space-y-4">
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
                  <p className="text-gray-600">Try adjusting your search criteria or create a new invoice.</p>
                </div>
              ) : (
                filteredInvoices.map((invoice) => (
                  <div 
                    key={invoice.id} 
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    data-testid={`invoice-item-${invoice.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900" data-testid={`text-invoice-id-${invoice.id}`}>
                            {invoice.id}
                          </h3>
                          {getStatusBadge(invoice.status)}
                          <span className="text-sm text-gray-500">
                            Due: {new Date(invoice.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <span>
                            <strong>School:</strong> {invoice.schoolName}
                          </span>
                          <span>
                            <strong>Amount:</strong> ₦{invoice.amount.toLocaleString()}
                          </span>
                          <span>
                            <strong>Features:</strong> {invoice.features.join(", ")}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          data-testid={`button-view-invoice-${invoice.id}`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          data-testid={`button-download-invoice-${invoice.id}`}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Create Invoice Modal Placeholder */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
              <h3 className="text-lg font-semibold mb-4">Create New Invoice</h3>
              <p className="text-gray-600 mb-4">
                Invoice creation form will be implemented here with:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
                <li>School selection</li>
                <li>Feature selection with auto-calculated prices</li>
                <li>Manual price entry for features without set prices</li>
                <li>Due date and payment terms</li>
                <li>"Create Invoice" vs "Generate Invoice" based on school's existing invoices</li>
              </ul>
              <Button 
                onClick={() => setShowCreateForm(false)}
                data-testid="button-close-create-invoice-modal"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}