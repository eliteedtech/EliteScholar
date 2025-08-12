import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Plus, ArrowLeft, Users, BookOpen } from "lucide-react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/store/auth";

const academicYearSchema = z.object({
  name: z.string().min(1, "Academic year name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

type AcademicYearFormData = z.infer<typeof academicYearSchema>;

export default function AcademicYearsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<AcademicYearFormData>({
    resolver: zodResolver(academicYearSchema),
    defaultValues: {
      name: "",
      startDate: "",
      endDate: "",
    },
  });

  // Mock data for now - this would be replaced with actual API calls
  const { data: academicYears = [], isLoading } = useQuery({
    queryKey: ['/api/academic-years', user?.schoolId],
    queryFn: async () => {
      // This would be replaced with actual API call
      return [
        {
          id: "1",
          name: "2024/2025",
          startDate: "2024-09-01",
          endDate: "2025-06-30",
          isActive: true,
          isCurrent: true,
          createdAt: "2024-08-01",
        },
        {
          id: "2", 
          name: "2023/2024",
          startDate: "2023-09-01",
          endDate: "2024-06-30",
          isActive: true,
          isCurrent: false,
          createdAt: "2023-08-01",
        },
      ];
    },
    enabled: !!user?.schoolId,
  });

  const createAcademicYearMutation = useMutation({
    mutationFn: async (data: AcademicYearFormData) => {
      // This would be replaced with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { ...data, id: Date.now().toString() };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/academic-years'] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Academic year created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create academic year",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AcademicYearFormData) => {
    createAcademicYearMutation.mutate(data);
  };

  if (user?.role !== "school_admin") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-slate-600">You don't have permission to access this page.</p>
            <Button onClick={() => setLocation("/school")} className="mt-4">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/school")}
                className="flex items-center space-x-2"
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Academic Years</h1>
                <p className="text-sm text-slate-500">Manage academic years and terms</p>
              </div>
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2" data-testid="button-add-academic-year">
                  <Plus className="w-4 h-4" />
                  <span>Add Academic Year</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Academic Year</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Academic Year Name</FormLabel>
                          <FormControl>
                            <Input placeholder="2025/2026" {...field} data-testid="input-academic-year-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-start-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-end-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createAcademicYearMutation.isPending}
                        data-testid="button-submit-academic-year"
                      >
                        {createAcademicYearMutation.isPending ? "Creating..." : "Create"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">Loading academic years...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {academicYears.map((year: any) => (
              <Card key={year.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Calendar className="w-5 h-5" />
                        <span>{year.name}</span>
                      </CardTitle>
                      <CardDescription>
                        {new Date(year.startDate).toLocaleDateString()} - {new Date(year.endDate).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col space-y-1">
                      {year.isCurrent && (
                        <Badge variant="default">Current</Badge>
                      )}
                      {year.isActive && (
                        <Badge variant="secondary">Active</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center p-3 bg-slate-50 rounded-lg">
                        <p className="font-semibold text-slate-900">3</p>
                        <p className="text-slate-600">Terms</p>
                      </div>
                      <div className="text-center p-3 bg-slate-50 rounded-lg">
                        <p className="font-semibold text-slate-900">36</p>
                        <p className="text-slate-600">Weeks</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setLocation(`/school/academic-years/${year.id}/terms`)}
                        data-testid={`button-manage-terms-${year.id}`}
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Manage Terms
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setLocation(`/school/academic-years/${year.id}/settings`)}
                        data-testid={`button-settings-${year.id}`}
                      >
                        Settings
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {academicYears.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Academic Years</h3>
                <p className="text-slate-600 mb-4">Create your first academic year to get started.</p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Academic Year
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}