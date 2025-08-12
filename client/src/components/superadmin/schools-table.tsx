import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import SchoolForm from "./school-form";
import InvoiceForm from "./invoice-form";
import FeatureToggle from "./feature-toggle";
import BranchManagement from "./branch-management";
import SchoolFeatureManagementModal from "./school-feature-management-modal";
import SchoolFeatureMenuModal from "./school-feature-menu-modal";
import SchoolFeatureSelectorModal from "./school-feature-selector-modal";
import { api } from "@/lib/api";
import { SchoolWithDetails } from "@/lib/types";

export default function SchoolsTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    type: "all",
    status: "all",
    search: "",
  });
  const [showSchoolForm, setShowSchoolForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showFeatureToggle, setShowFeatureToggle] = useState(false);
  const [showBranchManagement, setShowBranchManagement] = useState(false);
  const [showFeatureManagement, setShowFeatureManagement] = useState(false);
  const [showFeatureMenuModal, setShowFeatureMenuModal] = useState(false);
  const [showFeatureSelectorModal, setShowFeatureSelectorModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<SchoolWithDetails | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);

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

  const handleManageBranches = (school: SchoolWithDetails) => {
    setSelectedSchool(school);
    setShowBranchManagement(true);
  };

  const handleManageFeatureMenus = (school: SchoolWithDetails) => {
    setSelectedSchool(school);
    setShowFeatureSelectorModal(true);
  };

  const handleFeatureSelect = (feature: any) => {
    setSelectedFeature(feature);
    setShowFeatureMenuModal(true);
  };

  const handleEdit = (school: SchoolWithDetails) => {
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

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-32 mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
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
                    <SelectItem value="all">All Types</SelectItem>
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
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="DISABLED">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Create School Button */}
              <Button 
                onClick={() => setShowSchoolForm(true)}
                className="flex items-center space-x-2"
                data-testid="button-create-school"
              >
                <i className="fas fa-plus"></i>
                <span>Create School</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Schools Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>School</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schoolsData?.schools.map((school) => (
                <TableRow key={school.id} className="hover:bg-slate-50" data-testid={`school-row-${school.id}`}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={school.logoUrl} alt={`${school.name} logo`} />
                        <AvatarFallback className="bg-slate-100">
                          {school.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-slate-900" data-testid={`school-name-${school.id}`}>
                          {school.name}
                        </div>
                        <div className="text-sm text-slate-500" data-testid={`school-shortname-${school.id}`}>
                          {school.shortName}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell data-testid={`school-type-${school.id}`}>
                    {getTypeBadge(school.type)}
                  </TableCell>
                  <TableCell data-testid={`school-status-${school.id}`}>
                    {getStatusBadge(school.status)}
                  </TableCell>
                  <TableCell data-testid={`school-payment-${school.id}`}>
                    {getPaymentStatusBadge(school.paymentStatus)}
                    {school.nextPaymentDue && (
                      <div className="text-xs text-slate-500 mt-1">
                        Due: {new Date(school.nextPaymentDue).toLocaleDateString()}
                      </div>
                    )}
                  </TableCell>
                  <TableCell data-testid={`school-features-${school.id}`}>
                    <div className="flex flex-wrap gap-1">
                      {school.features
                        .filter((sf: any) => sf.enabled && sf.feature)
                        .slice(0, 2)
                        .map((sf: any) => (
                          <Badge key={sf.id} variant="secondary" className="text-xs">
                            {sf.feature?.key || sf.featureId || 'Unknown'}
                          </Badge>
                        ))}
                      {school.features.filter((sf: any) => sf.enabled && sf.feature).length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{school.features.filter((sf: any) => sf.enabled && sf.feature).length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleManageFeatures(school)}
                        data-testid={`button-features-${school.id}`}
                        title="Manage Features"
                      >
                        <i className="fas fa-cogs text-slate-600"></i>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleManageFeatureMenus(school)}
                        data-testid={`button-feature-menus-${school.id}`}
                        title="Feature Menu Links"
                      >
                        <i className="fas fa-link text-indigo-600"></i>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleManageBranches(school)}
                        data-testid={`button-branches-${school.id}`}
                      >
                        <i className="fas fa-sitemap text-blue-600"></i>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleCreateInvoice(school)}
                        data-testid={`button-invoice-${school.id}`}
                      >
                        <i className="fas fa-file-invoice text-green-600"></i>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEdit(school)}
                        data-testid={`button-edit-${school.id}`}
                      >
                        <i className="fas fa-edit text-purple-600"></i>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleToggleStatus(school)}
                        disabled={updateStatusMutation.isPending}
                        data-testid={`button-toggle-status-${school.id}`}
                      >
                        <i className={`fas ${school.status === "ACTIVE" ? "fa-ban text-red-600" : "fa-check text-green-600"}`}></i>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {schoolsData && schoolsData.pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-sm text-slate-700">
              Showing {((schoolsData.pagination.page - 1) * schoolsData.pagination.limit) + 1} to{" "}
              {Math.min(schoolsData.pagination.page * schoolsData.pagination.limit, schoolsData.pagination.total)} of{" "}
              {schoolsData.pagination.total} results
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setPage(Math.max(1, page - 1))}
                    className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(5, schoolsData.pagination.totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setPage(pageNum)}
                        isActive={pageNum === page}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setPage(Math.min(schoolsData.pagination.totalPages, page + 1))}
                    className={page === schoolsData.pagination.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
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

      {showBranchManagement && selectedSchool && (
        <BranchManagement 
          schoolId={selectedSchool.id}
          schoolName={selectedSchool.name}
          onClose={() => {
            setShowBranchManagement(false);
            setSelectedSchool(null);
          }}
        />
      )}
      
      {showFeatureManagement && selectedSchool && (
        <SchoolFeatureManagementModal 
          school={selectedSchool}
          isOpen={showFeatureManagement}
          onClose={() => {
            setShowFeatureManagement(false);
            setSelectedSchool(null);
          }}
        />
      )}
      
      {showFeatureSelectorModal && selectedSchool && (
        <SchoolFeatureSelectorModal 
          school={selectedSchool}
          isOpen={showFeatureSelectorModal}
          onClose={() => {
            setShowFeatureSelectorModal(false);
            setSelectedSchool(null);
          }}
          onFeatureSelect={handleFeatureSelect}
        />
      )}
      
      {showFeatureMenuModal && selectedSchool && selectedFeature && (
        <SchoolFeatureMenuModal 
          school={selectedSchool}
          feature={selectedFeature}
          isOpen={showFeatureMenuModal}
          onClose={() => {
            setShowFeatureMenuModal(false);
            setSelectedSchool(null);
            setSelectedFeature(null);
          }}
        />
      )}
    </>
  );
}
