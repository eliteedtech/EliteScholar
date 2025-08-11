import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Search, Edit, Trash2, Mail, FileText, Power } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { SchoolWithDetails } from "@shared/schema";

export default function SchoolsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<SchoolWithDetails | null>(null);
  const { toast } = useToast();

  // Fetch schools
  const { data: schoolsData, isLoading } = useQuery({
    queryKey: ["/api/superadmin/schools"],
  });

  // Create school mutation
  const createSchoolMutation = useMutation({
    mutationFn: async (schoolData: any) => {
      const response = await apiRequest("POST", "/api/superadmin/schools", schoolData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/schools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/stats"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "School created successfully",
        description: "Welcome email has been sent to the administrator.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating school",
        description: error.message || "Something went wrong",
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
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/schools"] });
      toast({
        title: "School status updated",
        description: "The school status has been successfully changed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating school status",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const schools = (schoolsData as any)?.schools || [];
  const filteredSchools = schools.filter((school: SchoolWithDetails) =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.shortName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateSchool = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const schoolData = {
      schoolName: formData.get("schoolName"),
      shortName: formData.get("shortName"),
      email: formData.get("email"),
      adminName: formData.get("adminName"),
      adminEmail: formData.get("adminEmail"),
      phones: formData.get("phones"),
      address: formData.get("address"),
      type: formData.get("type"),
      state: formData.get("state"),
      lga: formData.get("lga"),
      motto: formData.get("motto"),
    };

    createSchoolMutation.mutate(schoolData);
  };

  const handleToggleStatus = (school: SchoolWithDetails) => {
    const newStatus = school.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    toggleStatusMutation.mutate({
      id: school.id,
      status: newStatus,
    });
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
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">School Management</h2>
          <p className="text-slate-600 dark:text-slate-400">Create and manage schools</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-school">
              <Plus className="h-4 w-4 mr-2" />
              Create School
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New School</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSchool} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schoolName">School Name *</Label>
                  <Input
                    id="schoolName"
                    name="schoolName"
                    placeholder="Elite High School"
                    required
                    data-testid="input-school-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shortName">Short Name / Abbreviation *</Label>
                  <Input
                    id="shortName"
                    name="shortName"
                    placeholder="elite"
                    required
                    data-testid="input-short-name"
                  />
                  <p className="text-xs text-slate-500">Used for subdomain: shortname.domain.com</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">School Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="info@eliteschool.com"
                    data-testid="input-school-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phones">Phone Numbers</Label>
                  <Input
                    id="phones"
                    name="phones"
                    placeholder="080-xxx-xxxx, 081-xxx-xxxx"
                    data-testid="input-phones"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  placeholder="School address"
                  rows={2}
                  data-testid="input-address"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    name="state"
                    placeholder="Lagos"
                    data-testid="input-state"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lga">LGA</Label>
                  <Input
                    id="lga"
                    name="lga"
                    placeholder="Ikeja"
                    data-testid="input-lga"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">School Type *</Label>
                  <Select name="type" required>
                    <SelectTrigger data-testid="select-school-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="K12">K12</SelectItem>
                      <SelectItem value="NIGERIAN">Nigerian Curriculum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="motto">School Motto</Label>
                <Input
                  id="motto"
                  name="motto"
                  placeholder="Excellence in Education"
                  data-testid="input-motto"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adminName">Admin Name *</Label>
                  <Input
                    id="adminName"
                    name="adminName"
                    placeholder="John Doe"
                    required
                    data-testid="input-admin-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin Email *</Label>
                  <Input
                    id="adminEmail"
                    name="adminEmail"
                    type="email"
                    placeholder="admin@eliteschool.com"
                    required
                    data-testid="input-admin-email"
                  />
                </div>
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
                  disabled={createSchoolMutation.isPending}
                  data-testid="button-submit-school"
                >
                  {createSchoolMutation.isPending ? "Creating..." : "Create School"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Search schools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-schools"
          />
        </div>
      </div>

      {/* Schools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSchools.map((school: SchoolWithDetails) => (
          <Card key={school.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg" data-testid={`text-school-name-${school.id}`}>
                    {school.name}
                  </CardTitle>
                  <CardDescription data-testid={`text-school-short-${school.id}`}>
                    @{school.shortName} • {school.type}
                  </CardDescription>
                </div>
                <Badge
                  variant={school.status === "ACTIVE" ? "default" : "secondary"}
                  data-testid={`badge-status-${school.id}`}
                >
                  {school.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="text-slate-600">
                  Payment: <span className="font-medium">{school.paymentStatus}</span>
                </p>
                <p className="text-slate-600">
                  Branches: <span className="font-medium">{school.branches?.length || 0}</span>
                </p>
                <p className="text-slate-600">
                  Features: <span className="font-medium">{school.features?.length || 0}</span>
                </p>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleStatus(school)}
                  disabled={toggleStatusMutation.isPending}
                  data-testid={`button-toggle-status-${school.id}`}
                >
                  <Power className="h-3 w-3 mr-1" />
                  {school.status === "ACTIVE" ? "Disable" : "Enable"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  data-testid={`button-edit-${school.id}`}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  data-testid={`button-invoice-${school.id}`}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSchools.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-slate-400 mb-4" />
            <p className="text-slate-600 text-center">
              {searchTerm ? "No schools found matching your search." : "No schools created yet."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}