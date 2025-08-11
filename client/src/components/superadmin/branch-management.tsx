import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Plus, Edit2, Pause, Trash2, Play } from "lucide-react";

const branchFormSchema = z.object({
  name: z.string().min(1, "Branch name is required"),
});

type BranchFormData = z.infer<typeof branchFormSchema>;

interface Branch {
  id: string;
  name: string;
  status: "active" | "suspended" | "deleted";
  isMain: boolean;
  schoolId: string;
}

interface BranchManagementProps {
  schoolId: string;
  schoolName: string;
  onClose: () => void;
}

export default function BranchManagement({ schoolId, schoolName, onClose }: BranchManagementProps) {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ["/api/superadmin/schools", schoolId, "branches"],
    queryFn: async () => {
      // For now, return mock data until API is implemented
      return [
        { id: "1", name: "Main Branch", status: "active", isMain: true, schoolId },
      ];
    },
  });

  const form = useForm<BranchFormData>({
    resolver: zodResolver(branchFormSchema),
    defaultValues: {
      name: "",
    },
  });

  const createBranchMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      // Mock implementation until API is ready
      return { id: Date.now().toString(), ...data, status: "active", isMain: false, schoolId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/schools", schoolId, "branches"] });
      toast({
        title: "Branch created successfully",
        description: "The new branch has been added to the school.",
      });
      setIsFormOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error creating branch",
        description: error.message || "Failed to create branch",
        variant: "destructive",
      });
    },
  });

  const updateBranchMutation = useMutation({
    mutationFn: async ({ branchId, data }: { branchId: string; data: { name: string } }) => {
      // Mock implementation until API is ready
      return { id: branchId, ...data, status: "active", isMain: false, schoolId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/schools", schoolId, "branches"] });
      toast({
        title: "Branch updated successfully",
        description: "The branch has been updated.",
      });
      setIsFormOpen(false);
      setEditingBranch(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error updating branch",
        description: error.message || "Failed to update branch",
        variant: "destructive",
      });
    },
  });

  const updateBranchStatusMutation = useMutation({
    mutationFn: async ({ branchId, status }: { branchId: string; status: string }) => {
      // Mock implementation until API is ready
      return { id: branchId, status, isMain: false, schoolId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/schools", schoolId, "branches"] });
      toast({
        title: "Branch status updated",
        description: "The branch status has been changed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating branch status",
        description: error.message || "Failed to update branch status",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BranchFormData) => {
    if (editingBranch) {
      updateBranchMutation.mutate({ branchId: editingBranch.id, data });
    } else {
      createBranchMutation.mutate(data);
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    form.setValue("name", branch.name);
    setIsFormOpen(true);
  };

  const handleSuspend = (branchId: string) => {
    updateBranchStatusMutation.mutate({ branchId, status: "suspended" });
  };

  const handleActivate = (branchId: string) => {
    updateBranchStatusMutation.mutate({ branchId, status: "active" });
  };

  const handleDelete = (branchId: string) => {
    if (confirm("Are you sure you want to delete this branch? This action cannot be undone.")) {
      updateBranchStatusMutation.mutate({ branchId, status: "deleted" });
    }
  };

  const getStatusBadge = (status: string, isMain: boolean) => {
    if (isMain) {
      return <Badge variant="default" className="bg-blue-100 text-blue-800">Main</Badge>;
    }
    
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case "suspended":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Suspended</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const isSubmitting = createBranchMutation.isPending || updateBranchMutation.isPending;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]" data-testid="branch-management-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900">
            Manage Branches - {schoolName}
          </DialogTitle>
          <DialogDescription>
            Add, edit, suspend, or delete branches for this school
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add Branch Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-slate-900">School Branches</h3>
            <Button
              onClick={() => {
                setEditingBranch(null);
                form.reset();
                setIsFormOpen(true);
              }}
              className="flex items-center space-x-2"
              data-testid="button-add-branch"
            >
              <Plus className="w-4 h-4" />
              <span>Add Branch</span>
            </Button>
          </div>

          {/* Branches Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8">
                      Loading branches...
                    </TableCell>
                  </TableRow>
                ) : branches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                      No branches found
                    </TableCell>
                  </TableRow>
                ) : (
                  branches
                    .filter((branch: Branch) => branch.status !== "deleted")
                    .map((branch: Branch) => (
                      <TableRow key={branch.id}>
                        <TableCell className="font-medium">{branch.name}</TableCell>
                        <TableCell>{getStatusBadge(branch.status, branch.isMain)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(branch)}
                              data-testid={`button-edit-branch-${branch.id}`}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            {!branch.isMain && (
                              <>
                                {branch.status === "active" ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSuspend(branch.id)}
                                    className="text-yellow-600 hover:text-yellow-800"
                                    data-testid={`button-suspend-branch-${branch.id}`}
                                  >
                                    <Pause className="w-4 h-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleActivate(branch.id)}
                                    className="text-green-600 hover:text-green-800"
                                    data-testid={`button-activate-branch-${branch.id}`}
                                  >
                                    <Play className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(branch.id)}
                                  className="text-red-600 hover:text-red-800"
                                  data-testid={`button-delete-branch-${branch.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Branch Form Dialog */}
        {isFormOpen && (
          <Dialog open={isFormOpen} onOpenChange={(open) => !open && setIsFormOpen(false)}>
            <DialogContent data-testid="branch-form-modal">
              <DialogHeader>
                <DialogTitle>
                  {editingBranch ? "Edit Branch" : "Add New Branch"}
                </DialogTitle>
                <DialogDescription>
                  {editingBranch ? "Update branch information" : "Create a new branch for this school"}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="branch-name">Branch Name *</Label>
                  <Input
                    id="branch-name"
                    placeholder="North Campus"
                    {...form.register("name")}
                    data-testid="input-branch-name"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsFormOpen(false)}
                    data-testid="button-cancel-branch"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    data-testid="button-save-branch"
                  >
                    {isSubmitting ? "Saving..." : editingBranch ? "Update Branch" : "Add Branch"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}