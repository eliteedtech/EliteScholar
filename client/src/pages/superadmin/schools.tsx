import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, Ban, CheckCircle, Mail, Link } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import SuperAdminLayout from "@/components/superadmin/layout";
import type { SchoolWithDetails } from "@/lib/types";

// School form schema
const schoolSchema = z.object({
  schoolName: z.string().min(2, "School name must be at least 2 characters"),
  shortName: z.string().min(1, "Short name is required"),
  abbreviation: z.string().optional(),
  motto: z.string().optional(),
  state: z.string().optional(),
  lga: z.string().optional(),
  address: z.string().optional(),
  phones: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  type: z.enum(["K12", "NIGERIAN"]),
  adminName: z.string().min(2, "Admin name is required"),
  adminEmail: z.string().email("Invalid admin email address"),
  defaultPassword: z.string().min(6, "Password must be at least 6 characters").default("123456"),
});

type SchoolFormData = z.infer<typeof schoolSchema>;

interface School {
  id: string;
  schoolName: string;
  shortName: string;
  abbreviation?: string;
  motto?: string;
  state?: string;
  lga?: string;
  address?: string;
  phones: string[];
  email?: string;
  type: "K12" | "NIGERIAN";
  status: "active" | "suspended";
  schoolLink?: string;
  adminEmail: string;
  hasInvoice: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SchoolsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<SchoolWithDetails | null>(null);

  // Fetch schools  
  const { data: schoolsResponse, isLoading } = useQuery<{ schools: SchoolWithDetails[] }>({
    queryKey: ["/api/superadmin/schools"],
  });
  const schools = schoolsResponse?.schools || [];

  // Create school mutation
  const createSchoolMutation = useMutation({
    mutationFn: async (data: SchoolFormData) => {
      const response = await apiRequest("POST", "/api/superadmin/schools", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "School created successfully! Welcome email sent to admin.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/schools"] });
      setCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update school mutation
  const updateSchoolMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<SchoolFormData> }) => {
      const response = await apiRequest("PATCH", `/api/superadmin/schools/${data.id}`, data.updates);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "School updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/schools"] });
      setEditDialogOpen(false);
      setSelectedSchool(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle school status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async (data: { id: string; status: "ACTIVE" | "DISABLED" }) => {
      const response = await apiRequest("PATCH", `/api/superadmin/schools/${data.id}/status`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "School status updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/schools"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete school mutation
  const deleteSchoolMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/superadmin/schools/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "School deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/schools"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send welcome email mutation
  const sendWelcomeEmailMutation = useMutation({
    mutationFn: async (schoolId: string) => {
      const response = await apiRequest("POST", `/api/superadmin/schools/${schoolId}/send-welcome-email`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Welcome email sent successfully!",
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

  const form = useForm<SchoolFormData>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      schoolName: "",
      shortName: "",
      abbreviation: "",
      motto: "",
      state: "",
      lga: "",
      address: "",
      phones: "",
      email: "",
      type: "K12",
      adminName: "",
      adminEmail: "",
      defaultPassword: "123456",
    },
  });

  const editForm = useForm<SchoolFormData>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      schoolName: "",
      shortName: "",
      abbreviation: "",
      motto: "",
      state: "",
      lga: "",
      address: "",
      phones: "",
      email: "",
      type: "K12" as const,
      adminName: "",
      adminEmail: "",
      defaultPassword: "",
    },
  });

  const handleEdit = (school: SchoolWithDetails) => {
    setSelectedSchool(school);
    editForm.reset({
      schoolName: school.name,
      shortName: school.shortName,
      abbreviation: school.abbreviation || "",
      motto: school.motto || "",
      state: school.state || "",
      lga: school.lga || "",
      address: school.address || "",
      phones: school.phones.join(", "),
      email: school.email || "",
      type: school.type,
      adminName: "", // We'll need to fetch this
      adminEmail: school.email || "",
      defaultPassword: "",
    });
    setEditDialogOpen(true);
  };

  const handleToggleStatus = (school: SchoolWithDetails) => {
    const newStatus = school.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    toggleStatusMutation.mutate({ id: school.id, status: newStatus });
  };

  const handleDelete = (school: SchoolWithDetails) => {
    if (window.confirm(`Are you sure you want to delete ${school.name}? This action cannot be undone.`)) {
      deleteSchoolMutation.mutate(school.id);
    }
  };

  return (
    <SuperAdminLayout title="School Management" subtitle="Manage schools, administrators, and access controls">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">School Management</h1>
            <p className="text-muted-foreground">Manage schools, administrators, and access controls</p>
          </div>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-school">
                <Plus className="mr-2 h-4 w-4" />
                Create School
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New School</DialogTitle>
                <DialogDescription>
                  Add a new school to the system. A welcome email will be sent to the admin.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => createSchoolMutation.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="schoolName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>School Name</FormLabel>
                          <FormControl>
                            <Input data-testid="input-school-name" placeholder="Elite International School" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shortName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Short Name</FormLabel>
                          <FormControl>
                            <Input data-testid="input-short-name" placeholder="Elite School" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="abbreviation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Abbreviation (Optional)</FormLabel>
                          <FormControl>
                            <Input data-testid="input-abbreviation" placeholder="EIS" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>School Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-school-type">
                                <SelectValue placeholder="Select school type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="K12">K12</SelectItem>
                              <SelectItem value="NIGERIAN">Nigerian Curriculum</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="motto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>School Motto (Optional)</FormLabel>
                        <FormControl>
                          <Input data-testid="input-motto" placeholder="Excellence in Education" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State (Optional)</FormLabel>
                          <FormControl>
                            <Input data-testid="input-state" placeholder="Lagos" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lga"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LGA (Optional)</FormLabel>
                          <FormControl>
                            <Input data-testid="input-lga" placeholder="Victoria Island" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address (Optional)</FormLabel>
                        <FormControl>
                          <Textarea data-testid="textarea-address" placeholder="School physical address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phones"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Numbers (Optional)</FormLabel>
                          <FormControl>
                            <Input data-testid="input-phones" placeholder="0801234567, 0802345678" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>School Email (Optional)</FormLabel>
                          <FormControl>
                            <Input data-testid="input-school-email" placeholder="info@eliteschool.edu" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-3">Administrator Details</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="adminName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Admin Name</FormLabel>
                            <FormControl>
                              <Input data-testid="input-admin-name" placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="adminEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Admin Email</FormLabel>
                            <FormControl>
                              <Input data-testid="input-admin-email" placeholder="admin@eliteschool.edu" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="defaultPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Password</FormLabel>
                          <FormControl>
                            <Input data-testid="input-default-password" placeholder="123456" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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
                      disabled={createSchoolMutation.isPending}
                      data-testid="button-submit-create"
                    >
                      {createSchoolMutation.isPending ? "Creating..." : "Create School"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Schools Table */}
        <Card>
          <CardHeader>
            <CardTitle>Schools ({schools.length})</CardTitle>
            <CardDescription>
              Manage all schools in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading schools...</div>
            ) : schools.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No schools found. Create your first school to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>School Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Admin Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schools.map((school: SchoolWithDetails) => (
                    <TableRow key={school.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{school.name}</div>
                          <div className="text-sm text-muted-foreground">{school.shortName}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{school.type}</Badge>
                      </TableCell>
                      <TableCell>{school.email || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={school.status === "ACTIVE" ? "default" : "destructive"}>
                          {school.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {false ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/superadmin/invoices?school=${school.id}`, '_blank')}
                            data-testid={`button-view-invoice-${school.id}`}
                          >
                            View Invoice
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/superadmin/invoices/create?school=${school.id}`, '_blank')}
                            data-testid={`button-create-invoice-${school.id}`}
                          >
                            Create Invoice
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(school)}
                            data-testid={`button-edit-${school.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(school)}
                            data-testid={`button-toggle-status-${school.id}`}
                          >
                            {school.status === "ACTIVE" ? (
                              <Ban className="h-4 w-4" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => sendWelcomeEmailMutation.mutate(school.id)}
                            data-testid={`button-resend-email-${school.id}`}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>

                          {false && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open('#', '_blank')}
                              data-testid={`button-open-link-${school.id}`}
                            >
                              <Link className="h-4 w-4" />
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(school)}
                            data-testid={`button-delete-${school.id}`}
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

        {/* Edit School Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit School</DialogTitle>
              <DialogDescription>
                Update school information and settings.
              </DialogDescription>
            </DialogHeader>

            <Form {...editForm}>
              <form 
                onSubmit={editForm.handleSubmit((data) => {
                  if (selectedSchool) {
                    updateSchoolMutation.mutate({ 
                      id: selectedSchool.id, 
                      updates: data 
                    });
                  }
                })} 
                className="space-y-4"
              >
                {/* Similar form fields as create form */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="schoolName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>School Name</FormLabel>
                        <FormControl>
                          <Input data-testid="input-edit-school-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="shortName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Short Name</FormLabel>
                        <FormControl>
                          <Input data-testid="input-edit-short-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditDialogOpen(false)}
                    data-testid="button-cancel-edit"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateSchoolMutation.isPending}
                    data-testid="button-submit-edit"
                  >
                    {updateSchoolMutation.isPending ? "Updating..." : "Update School"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  );
}