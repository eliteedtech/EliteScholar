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
import { Plus, Search, Edit, Trash2, School } from "lucide-react";
import { SchoolLayout } from "@/components/school";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SchoolSection {
  id: string;
  name: string;
  code: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  classCount: number;
}

const sectionFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required").max(10, "Code must be at most 10 characters"),
  description: z.string().optional(),
  sortOrder: z.number().min(0).optional(),
});

type SectionFormData = z.infer<typeof sectionFormSchema>;

export default function Sections() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedSection, setSelectedSection] = useState<SchoolSection | null>(null);

  // Fetch sections
  const { data: sections = [], isLoading } = useQuery<SchoolSection[]>({
    queryKey: ["/api/schools/setup/sections"],
  });

  // Create section mutation
  const createSectionMutation = useMutation({
    mutationFn: (data: SectionFormData) => apiRequest("/api/schools/setup/sections", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schools/setup/sections"] });
      setShowCreateDialog(false);
      createForm.reset();
      toast({ title: "Success", description: "Section created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create section",
        variant: "destructive" 
      });
    },
  });

  // Update section mutation
  const updateSectionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SectionFormData }) => 
      apiRequest(`/api/schools/setup/sections/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schools/setup/sections"] });
      setShowEditDialog(false);
      setSelectedSection(null);
      editForm.reset();
      toast({ title: "Success", description: "Section updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update section",
        variant: "destructive" 
      });
    },
  });

  // Delete section mutation
  const deleteSectionMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/schools/setup/sections/${id}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schools/setup/sections"] });
      toast({ title: "Success", description: "Section deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete section",
        variant: "destructive" 
      });
    },
  });

  // Create form
  const createForm = useForm<SectionFormData>({
    resolver: zodResolver(sectionFormSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      sortOrder: 0,
    },
  });

  // Edit form
  const editForm = useForm<SectionFormData>({
    resolver: zodResolver(sectionFormSchema),
  });

  // Filter sections based on search query
  const filteredSections = sections.filter(section =>
    section.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (section: SchoolSection) => {
    setSelectedSection(section);
    editForm.reset({
      name: section.name,
      code: section.code,
      description: section.description || "",
      sortOrder: section.sortOrder,
    });
    setShowEditDialog(true);
  };

  const handleDelete = (section: SchoolSection) => {
    if (section.classCount > 0) {
      toast({
        title: "Cannot Delete",
        description: "Cannot delete section with existing classes",
        variant: "destructive"
      });
      return;
    }

    if (confirm(`Are you sure you want to delete ${section.name}?`)) {
      deleteSectionMutation.mutate(section.id);
    }
  };

  const onCreateSubmit = (data: SectionFormData) => {
    createSectionMutation.mutate(data);
  };

  const onEditSubmit = (data: SectionFormData) => {
    if (selectedSection) {
      updateSectionMutation.mutate({ id: selectedSection.id, data });
    }
  };

  return (
    <SchoolLayout title="Sections" subtitle="Manage class groupings for your school">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search sections..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="search-sections"
            />
          </div>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            data-testid="create-section-button"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Section
          </Button>
        </div>

        {/* Stats Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{sections.length}</p>
                <p className="text-xs text-muted-foreground">Total Sections</p>
              </div>
              <div className="text-blue-600">
                <School className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sections Table */}
        <Card>
          <CardHeader>
            <CardTitle>School Sections</CardTitle>
            <CardDescription>
              {filteredSections.length} of {sections.length} sections shown
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div>Loading sections...</div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Classes</TableHead>
                    <TableHead>Sort Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSections
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((section) => (
                    <TableRow key={section.id} data-testid={`section-row-${section.id}`}>
                      <TableCell className="font-medium">{section.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{section.code}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {section.description || "No description"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{section.classCount} classes</Badge>
                      </TableCell>
                      <TableCell>{section.sortOrder}</TableCell>
                      <TableCell>
                        <Badge variant={section.isActive ? "default" : "secondary"}>
                          {section.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(section)}
                            data-testid={`edit-section-${section.id}`}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(section)}
                            disabled={section.classCount > 0}
                            data-testid={`delete-section-${section.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredSections.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? 'No sections match your search.' : 'No sections found. Add your first section!'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create Section Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Section</DialogTitle>
              <DialogDescription>
                Create a new section for grouping classes
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Primary, Junior Secondary" data-testid="section-name-input" />
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
                      <FormLabel>Section Code</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., PRI, JSS" data-testid="section-code-input" />
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
                          placeholder="Brief description of this section..."
                          data-testid="section-description-input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sort Order</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="section-sort-input"
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
                    disabled={createSectionMutation.isPending}
                    data-testid="submit-create-section"
                  >
                    {createSectionMutation.isPending ? "Creating..." : "Create Section"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Section Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Section</DialogTitle>
              <DialogDescription>
                Update section information
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Primary, Junior Secondary" />
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
                      <FormLabel>Section Code</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., PRI, JSS" />
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
                          placeholder="Brief description of this section..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sort Order</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                    disabled={updateSectionMutation.isPending}
                  >
                    {updateSectionMutation.isPending ? "Updating..." : "Update Section"}
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