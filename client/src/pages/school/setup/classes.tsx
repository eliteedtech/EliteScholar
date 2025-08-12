import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Edit, Trash2, GraduationCap } from "lucide-react";
import { SchoolLayout } from "@/components/school";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SchoolSection {
  id: string;
  name: string;
  code: string;
}

interface ClassLevel {
  id: string;
  name: string;
  levelLabel: string;
  fullName: string;
  capacity: number;
  sortOrder: number;
  isActive: boolean;
}

interface SectionWithClasses {
  section: SchoolSection;
  classes: ClassLevel[];
}

const classLevelFormSchema = z.object({
  sectionId: z.string().min(1, "Section is required"),
  name: z.string().min(1, "Class name is required"),
  levelLabel: z.string().min(1, "Level label is required"),
  capacity: z.number().min(0).optional(),
});

type ClassLevelFormData = z.infer<typeof classLevelFormSchema>;

export default function Classes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>("");

  // Fetch sections
  const { data: sections = [] } = useQuery<SchoolSection[]>({
    queryKey: ["/api/schools/setup/sections"],
  });

  // Fetch class levels grouped by section
  const { data: sectionsWithClasses = [], isLoading } = useQuery<SectionWithClasses[]>({
    queryKey: ["/api/schools/setup/class-levels"],
  });

  // Create class level mutation
  const createClassLevelMutation = useMutation({
    mutationFn: (data: ClassLevelFormData) => apiRequest("/api/schools/setup/class-levels", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schools/setup/class-levels"] });
      setShowCreateDialog(false);
      createForm.reset();
      toast({ title: "Success", description: "Class level created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create class level",
        variant: "destructive" 
      });
    },
  });

  // Create form
  const createForm = useForm<ClassLevelFormData>({
    resolver: zodResolver(classLevelFormSchema),
    defaultValues: {
      sectionId: "",
      name: "",
      levelLabel: "A",
      capacity: 0,
    },
  });

  const handleCreateClass = (sectionId?: string) => {
    if (sectionId) {
      createForm.setValue("sectionId", sectionId);
    }
    setShowCreateDialog(true);
  };

  const onCreateSubmit = (data: ClassLevelFormData) => {
    createClassLevelMutation.mutate(data);
  };

  // Filter sections and classes based on search query
  const filteredSectionsWithClasses = sectionsWithClasses.map(sectionWithClasses => ({
    ...sectionWithClasses,
    classes: sectionWithClasses.classes.filter(classLevel =>
      classLevel.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      classLevel.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(sectionWithClasses => 
    sectionWithClasses.section.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sectionWithClasses.classes.length > 0
  );

  const totalClasses = sectionsWithClasses.reduce((total, section) => total + section.classes.length, 0);

  return (
    <SchoolLayout title="Classes" subtitle="Manage class levels and organize students">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search classes..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="search-classes"
            />
          </div>
          <Button 
            onClick={() => handleCreateClass()}
            data-testid="create-class-button"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Class Level
          </Button>
        </div>

        {/* Stats Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{totalClasses}</p>
                <p className="text-xs text-muted-foreground">Total Classes</p>
              </div>
              <div className="text-blue-600">
                <GraduationCap className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Classes grouped by Section */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div>Loading classes...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredSectionsWithClasses.map((sectionWithClasses) => (
              <Card key={sectionWithClasses.section.id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {sectionWithClasses.section.name}
                        <Badge variant="outline">{sectionWithClasses.section.code}</Badge>
                      </CardTitle>
                      <CardDescription>
                        {sectionWithClasses.classes.length} classes in this section
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreateClass(sectionWithClasses.section.id)}
                      data-testid={`add-class-${sectionWithClasses.section.id}`}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Level
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {sectionWithClasses.classes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {sectionWithClasses.classes.map((classLevel) => (
                        <Card key={classLevel.id} className="border-slate-200">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-lg">{classLevel.fullName}</h4>
                              <Badge variant={classLevel.isActive ? "default" : "secondary"}>
                                {classLevel.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div>Base: {classLevel.name}</div>
                              <div>Level: {classLevel.levelLabel}</div>
                              <div>Capacity: {classLevel.capacity || "Not set"}</div>
                            </div>
                            <div className="flex justify-end space-x-1 mt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                data-testid={`edit-class-${classLevel.id}`}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                data-testid={`delete-class-${classLevel.id}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No classes in this section. Add your first class level!
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {filteredSectionsWithClasses.length === 0 && (
              <Card>
                <CardContent className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No classes match your search.' : 'No sections found. Create sections first before adding classes.'}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Create Class Level Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Class Level</DialogTitle>
              <DialogDescription>
                Create a new class level in a section
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="sectionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="section-select">
                            <SelectValue placeholder="Select section" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sections.map((section) => (
                            <SelectItem key={section.id} value={section.id}>
                              {section.name} ({section.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., JSS1, SSS2" data-testid="class-name-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="levelLabel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Level Label</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., A, B, C" data-testid="level-label-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={createForm.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="capacity-input"
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
                    disabled={createClassLevelMutation.isPending}
                    data-testid="submit-create-class"
                  >
                    {createClassLevelMutation.isPending ? "Creating..." : "Create Class"}
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