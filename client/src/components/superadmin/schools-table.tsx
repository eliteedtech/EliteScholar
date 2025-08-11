import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Edit, MoreVertical, Trash2, Building, Users, Banknote, ToggleLeft, Eye } from "lucide-react";
import type { School } from "../../../shared/schema";
import { SchoolForm } from "./school-form";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface SchoolsTableProps {
  schools: School[];
  onSchoolUpdate?: () => void;
}

export function SchoolsTable({ schools, onSchoolUpdate }: SchoolsTableProps) {
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation for deleting school (soft delete)
  const deleteSchoolMutation = useMutation({
    mutationFn: async (schoolId: string) => {
      const response = await fetch(`/api/superadmin/schools/${schoolId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete school');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "School deleted",
        description: "The school has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/schools'] });
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/stats'] });
      onSchoolUpdate?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete school. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Mutation for updating school status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ schoolId, status }: { schoolId: string; status: string }) => {
      const response = await fetch(`/api/superadmin/schools/${schoolId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "School status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/schools'] });
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/stats'] });
      onSchoolUpdate?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleEdit = (school: School) => {
    setSelectedSchool(school);
    setShowEditForm(true);
  };

  const handleDelete = (schoolId: string) => {
    if (window.confirm('Are you sure you want to delete this school? This action cannot be undone.')) {
      deleteSchoolMutation.mutate(schoolId);
    }
  };

  const handleStatusChange = (schoolId: string, newStatus: string) => {
    updateStatusMutation.mutate({ schoolId, status: newStatus });
  };

  const handleManageBranches = (school: School) => {
    setSelectedSchool(school);
    setShowBranchModal(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { label: "Active", variant: "default" as const },
      SUSPENDED: { label: "Suspended", variant: "secondary" as const },
      DELETED: { label: "Deleted", variant: "destructive" as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ACTIVE;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      PAID: { label: "Paid", variant: "default" as const },
      PENDING: { label: "Pending", variant: "secondary" as const },
      UNPAID: { label: "Unpaid", variant: "destructive" as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (schools.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No schools found</h3>
            <p className="text-gray-600">Start by creating your first school.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Schools Overview
            <span className="text-sm font-normal text-gray-600">
              {schools.length} school{schools.length !== 1 ? 's' : ''}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {schools.map((school) => (
              <div 
                key={school.id} 
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                data-testid={`school-item-${school.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-lg">
                        {school.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900" data-testid={`text-school-name-${school.id}`}>
                          {school.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {school.shortName} • {school.type} Curriculum
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          Status: {getStatusBadge(school.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          Payment: {getPaymentStatusBadge(school.paymentStatus)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          Type: {school.type}
                        </span>
                      </div>
                    </div>

                    {school.email && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600">
                          <strong>Email:</strong> {school.email}
                        </p>
                      </div>
                    )}

                    {school.address && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          <strong>Address:</strong> {school.address}
                        </p>
                      </div>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="h-8 w-8 p-0"
                        data-testid={`button-school-actions-${school.id}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleEdit(school)}
                        data-testid={`button-edit-school-${school.id}`}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit School
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleManageBranches(school)}
                        data-testid={`button-manage-branches-${school.id}`}
                      >
                        <Building className="mr-2 h-4 w-4" />
                        Manage Branches
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleStatusChange(school.id, school.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                        data-testid={`button-toggle-status-${school.id}`}
                      >
                        <ToggleLeft className="mr-2 h-4 w-4" />
                        {school.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDelete(school.id)}
                        className="text-red-600"
                        data-testid={`button-delete-school-${school.id}`}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete School
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit School Form */}
      {showEditForm && selectedSchool && (
        <SchoolForm
          isOpen={showEditForm}
          onClose={() => {
            setShowEditForm(false);
            setSelectedSchool(null);
          }}
          school={selectedSchool}
          onSuccess={() => {
            setShowEditForm(false);
            setSelectedSchool(null);
            onSchoolUpdate?.();
          }}
        />
      )}

      {/* Branch Management Modal - TODO: Implement */}
      {showBranchModal && selectedSchool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">
              Manage Branches - {selectedSchool.name}
            </h3>
            <p className="text-gray-600 mb-4">
              Branch management functionality will be implemented here.
            </p>
            <Button 
              onClick={() => setShowBranchModal(false)}
              data-testid="button-close-branch-modal"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </>
  );
}