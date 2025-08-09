import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import SuperAdminLayout from "@/components/superadmin/layout";
import SchoolForm from "@/components/superadmin/school-form";
import InvoiceForm from "@/components/superadmin/invoice-form";
import FeatureToggle from "@/components/superadmin/feature-toggle";
import { api } from "@/lib/api";
import { SchoolWithDetails } from "@/lib/types";

export default function SchoolsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    search: "",
  });
  const [showSchoolForm, setShowSchoolForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showFeatureToggle, setShowFeatureToggle] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<SchoolWithDetails | null>(null);

  const { data: schoolsData, isLoading } = useQuery({
    queryKey: ["/api/superadmin/schools", page, filters],
    queryFn: () => api.superadmin.getSchools({ page, ...filters }),
  });

  const toggleFeatureMutation = useMutation({
    mutationFn: ({ schoolId, featureKey, action }: {
      schoolId: string;
      featureKey: string;
      action: "enable" | "disable";
    }) => api.superadmin.toggleSchoolFeature(schoolId, featureKey, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/schools"] });
      toast({
        title: "Feature updated",
        description: "School feature has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update feature",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ schoolId, status }: { schoolId: string; status: "ACTIVE" | "DISABLED" }) =>
      api.superadmin.updateSchoolStatus(schoolId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/schools"] });
      toast({
        title: "School status updated",
        description: "School status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update school status",
        variant: "destructive",
      });
    },
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
    setPage(1);
  };

  const handleCreateInvoice = (school: SchoolWithDetails) => {
    setSelectedSchool(school);
    setShowInvoiceForm(true);
  };

  const handleManageFeatures = (school: SchoolWithDetails) => {
    setSelectedSchool(school);
    setShowFeatureToggle(true);
  };

  const handleViewSchool = (school: SchoolWithDetails) => {
    // Implementation for viewing school details
    toast({
      title: "View School",
      description: `Viewing details for ${school.name}`,
    });
  };

  const handleEditSchool = (school: SchoolWithDetails) => {
    setSelectedSchool(school);
    setShowSchoolForm(true);
  };

  const handleToggleStatus = (school: SchoolWithDetails) => {
    const newStatus = school.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    updateStatusMutation.mutate({ schoolId: school.id, status: newStatus });
  };

  const getPaymentStatusBadge = (status: string, dueDate?: string) => {
    switch (status) {
      case "PAID":
        return <Badge className="bg-green-100 text-green-800">PAID</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800">PENDING</Badge>;
      case "UNPAID":
        return <Badge className="bg-red-100 text-red-800">UNPAID</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-100 text-green-800">ACTIVE</Badge>;
      case "DISABLED":
        return <Badge className="bg-red-100 text-red-800">DISABLED</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "K12":
        return <Badge className="bg-purple-100 text-purple-800">K12</Badge>;
      case "NIGERIAN":
        return <Badge className="bg-blue-100 text-blue-800">NIGERIAN</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  return (
    <SuperAdminLayout title="Schools Management" subtitle="Manage schools, features, and billing across your platform">
      <div className="bg-white rounded-xl shadow-sm" data-testid="schools-table">
        {/* Table Header with Controls */}
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Schools</h3>
            <div className="flex items-center space-x-3">
              {/* Filters */}
              <div className="flex items-center space-x-2">
                <label className="text-sm text-slate-600">Type:</label>
                <Select value={filters.type} onValueChange={(value) => handleFilterChange("type", value)}>
                  <SelectTrigger className="w-32" data-testid="filter-type">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="K12">K12</SelectItem>
                    <SelectItem value="NIGERIAN">NIGERIAN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-slate-600">Status:</label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                  <SelectTrigger className="w-32" data-testid="filter-status">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="DISABLED">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Create School Button */}
              <Button 
                onClick={() => setShowSchoolForm(true)}
                className="bg-primary hover:bg-primary/90 flex items-center space-x-2"
                data-testid="button-create-school"
              >
                <i className="fas fa-plus"></i>
                <span>Create School</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Schools Table */}
        {isLoading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">School</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Payment</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Features</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white divide-y divide-slate-200">
                {schoolsData?.schools.map((school) => (
                  <TableRow key={school.id} className="hover:bg-slate-50" data-testid={`school-row-${school.id}`}>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Avatar className="w-10 h-10 rounded-lg">
                          <AvatarImage src={school.logoUrl} alt={`${school.name} logo`} className="object-cover" />
                          <AvatarFallback className="bg-slate-100 rounded-lg">
                            {school.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900" data-testid={`school-name-${school.id}`}>
                            {school.name}
                          </div>
                          <div className="text-sm text-slate-500" data-testid={`school-shortname-${school.id}`}>
                            {school.shortName}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap" data-testid={`school-type-${school.id}`}>
                      {getTypeBadge(school.type)}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap" data-testid={`school-status-${school.id}`}>
                      {getStatusBadge(school.status)}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap" data-testid={`school-payment-${school.id}`}>
                      {getPaymentStatusBadge(school.paymentStatus)}
                      {school.nextPaymentDue && (
                        <div className="text-xs text-slate-500 mt-1">
                          Due: {new Date(school.nextPaymentDue).toLocaleDateString()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap" data-testid={`school-features-${school.id}`}>
                      <div className="flex flex-wrap gap-1">
                        {school.features
                          .filter((sf: any) => sf.enabled)
                          .slice(0, 2)
                          .map((sf: any) => (
                            <Badge key={sf.id} className="bg-green-100 text-green-700 text-xs font-medium">
                              {sf.feature.key}
                            </Badge>
                          ))}
                        {school.features.filter((sf: any) => sf.enabled).length > 2 && (
                          <Badge className="bg-gray-100 text-gray-700 text-xs font-medium">
                            +{school.features.filter((sf: any) => sf.enabled).length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewSchool(school)}
                          className="text-primary hover:text-primary/80"
                          data-testid={`button-view-${school.id}`}
                        >
                          <i className="fas fa-eye"></i>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditSchool(school)}
                          className="text-slate-600 hover:text-slate-900"
                          data-testid={`button-edit-${school.id}`}
                        >
                          <i className="fas fa-edit"></i>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleCreateInvoice(school)}
                          className="text-green-600 hover:text-green-900"
                          data-testid={`button-invoice-${school.id}`}
                        >
                          <i className="fas fa-file-invoice"></i>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {schoolsData && schoolsData.pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-sm text-slate-700">
              Showing <span className="font-medium">{((schoolsData.pagination.page - 1) * schoolsData.pagination.limit) + 1}</span> to{" "}
              <span className="font-medium">{Math.min(schoolsData.pagination.page * schoolsData.pagination.limit, schoolsData.pagination.total)}</span> of{" "}
              <span className="font-medium">{schoolsData.pagination.total}</span> results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-2 text-sm font-medium text-slate-500 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(3, schoolsData.pagination.totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className={pageNum === page 
                      ? "px-3 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md"
                      : "px-3 py-2 text-sm font-medium text-slate-500 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                    }
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(schoolsData.pagination.totalPages, page + 1))}
                disabled={page === schoolsData.pagination.totalPages}
                className="px-3 py-2 text-sm font-medium text-slate-500 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showSchoolForm && (
        <SchoolForm 
          school={selectedSchool}
          onClose={() => {
            setShowSchoolForm(false);
            setSelectedSchool(null);
          }}
          onSuccess={() => {
            setShowSchoolForm(false);
            setSelectedSchool(null);
            queryClient.invalidateQueries({ queryKey: ["/api/superadmin/schools"] });
          }}
        />
      )}

      {showInvoiceForm && selectedSchool && (
        <InvoiceForm 
          school={selectedSchool}
          onClose={() => {
            setShowInvoiceForm(false);
            setSelectedSchool(null);
          }}
          onSuccess={() => {
            setShowInvoiceForm(false);
            setSelectedSchool(null);
            queryClient.invalidateQueries({ queryKey: ["/api/superadmin/schools"] });
          }}
        />
      )}

      {showFeatureToggle && selectedSchool && (
        <FeatureToggle 
          school={selectedSchool}
          onClose={() => {
            setShowFeatureToggle(false);
            setSelectedSchool(null);
          }}
          onToggle={(featureKey, enabled) => {
            toggleFeatureMutation.mutate({
              schoolId: selectedSchool.id,
              featureKey,
              action: enabled ? "enable" : "disable",
            });
          }}
        />
      )}
    </SuperAdminLayout>
  );
}
