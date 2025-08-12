import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Edit, Trash2, Settings } from "lucide-react";
import { SchoolLayout } from "@/components/school";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface StaffType {
  id: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

const staffTypeFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(2, "Code must be at least 2 characters").max(10, "Code must be at most 10 characters"),
  description: z.string().optional(),
});

type StaffTypeFormData = z.infer<typeof staffTypeFormSchema>;

export default function StaffTypes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedStaffType, setSelectedStaffType] = useState<StaffType | null>(null);

  // Fetch staff types
  const { data: staffTypes = [], isLoading } = useQuery<StaffType[]>({
    queryKey: ["/api/schools/staff-types"],
  });

  // Create staff type mutation
  const createStaffTypeMutation = useMutation({
    mutationFn: (data: StaffTypeFormData) => apiRequest("/api/schools/staff-types", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schools/staff-types"] });
      setShowCreateDialog(false);
      createForm.reset();
      toast({ title: "Success", description: "Staff type created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create staff type",
        variant: "destructive" 
      });
    },
  });

  // Update staff type mutation
  const updateStaffTypeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: StaffTypeFormData }) => 
      apiRequest(`/api/schools/staff-types/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schools/staff-types"] });
      setShowEditDialog(false);
      setSelectedStaffType(null);
      editForm.reset();
      toast({ title: "Success", description: "Staff type updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update staff type",
        variant: "destructive" 
      });
    },
  });

  // Delete staff type mutation
  const deleteStaffTypeMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/schools/staff-types/${id}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schools/staff-types"] });
      toast({ title: "Success", description: "Staff type deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete staff type",
        variant: "destructive" 
      });
    },
  });

  // Create form
  const createForm = useForm<StaffTypeFormData>({
    resolver: zodResolver(staffTypeFormSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
    },
  });

  // Edit form
  const editForm = useForm<StaffTypeFormData>({
    resolver: zodResolver(staffTypeFormSchema),
  });

  // Filter staff types based on search query
  const filteredStaffTypes = staffTypes.filter(type =>
    type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    type.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    type.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (staffType: StaffType) => {
    setSelectedStaffType(staffType);
    editForm.reset({
      name: staffType.name,
      code: staffType.code,
      description: staffType.description || "",
    });
    setShowEditDialog(true);
  };

  const handleDelete = (staffType: StaffType) => {
    if (confirm(`Are you sure you want to delete ${staffType.name}?`)) {
      deleteStaffTypeMutation.mutate(staffType.id);
    }
  };

  const onCreateSubmit = (data: StaffTypeFormData) => {
    createStaffTypeMutation.mutate(data);
  };

  const onEditSubmit = (data: StaffTypeFormData) => {
    if (selectedStaffType) {
      updateStaffTypeMutation.mutate({ id: selectedStaffType.id, data });
    }
  };

  return (
    <SchoolLayout title="Staff Types" subtitle="Manage different types of staff positions">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search staff types..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="search-staff-types"
            />
          </div>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            data-testid="create-staff-type-button"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Staff Type
          </Button>
        </div>

        {/* Stats Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{staffTypes.length}</p>
                <p className="text-xs text-muted-foreground">Total Staff Types</p>
              </div>
              <div className="text-blue-600">
                <Settings className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Staff Types Table */}
        <Card>
          <CardHeader>
            <CardTitle>Staff Types</CardTitle>
            <CardDescription>
              {filteredStaffTypes.length} of {staffTypes.length} staff types shown
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div>Loading staff types...</div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaffTypes.map((staffType) => (
                    <TableRow key={staffType.id} data-testid={`staff-type-row-${staffType.id}`}>
                      <TableCell className="font-medium">{staffType.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{staffType.code}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {staffType.description || "No description"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={staffType.isActive ? "default" : "secondary"}>
                          {staffType.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(staffType)}
                            data-testid={`edit-staff-type-${staffType.id}`}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(staffType)}
                            data-testid={`delete-staff-type-${staffType.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredStaffTypes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? 'No staff types match your search.' : 'No staff types found. Add your first staff type!'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create Staff Type Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Staff Type</DialogTitle>
              <DialogDescription>
                Create a new staff type for classification
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Teacher" data-testid="staff-type-name-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., TCH" data-testid="staff-type-code-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Brief description of this staff type..."
                          data-testid="staff-type-description-input"
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
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createStaffTypeMutation.isPending}
                    data-testid="submit-create-staff-type"
                  >
                    {createStaffTypeMutation.isPending ? "Creating..." : "Create Staff Type"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Staff Type Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Staff Type</DialogTitle>
              <DialogDescription>
                Update staff type information
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Teacher" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., TCH" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Brief description of this staff type..."
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
                    onClick={() => setShowEditDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateStaffTypeMutation.isPending}
                  >
                    {updateStaffTypeMutation.isPending ? "Updating..." : "Update Staff Type"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </SchoolLayout>
  );
}