import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { SchoolWithDetails } from "@/lib/types";

const schoolFormSchema = z.object({
  schoolName: z.string().min(1, "School name is required"),
  shortName: z.string().min(1, "Short name is required").regex(/^[a-z0-9-]+$/, "Short name must contain only lowercase letters, numbers, and hyphens"),
  abbreviation: z.string().min(1, "Abbreviation is required"),
  motto: z.string().optional(),
  state: z.string().optional(),
  lga: z.string().optional(),
  address: z.string().optional(),
  phones: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  type: z.enum(["K12", "NIGERIAN"]),
  schoolAdmin: z.object({
    name: z.string().min(1, "Admin name is required"),
    email: z.string().email("Invalid email address"),
  }),
  defaultPassword: z.string().default("123456"),
  initialFeatures: z.array(z.string()).default([]),
  selectedGradeGroups: z.array(z.string()).default([]),
  branches: z.array(z.object({
    name: z.string().min(1, "Branch name is required"),
  })).default([{ name: "Main Branch" }]),
});

type SchoolFormData = z.infer<typeof schoolFormSchema>;

interface SchoolFormProps {
  school?: SchoolWithDetails | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SchoolForm({ school, onClose, onSuccess }: SchoolFormProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(school?.logoUrl || null);

  // Grade Groups for K12
  const k12GradeGroups = [
    {
      name: "Nursery",
      classes: 3,
      grades: ["Pre-K", "Kindergarten"]
    },
    {
      name: "Primary", 
      classes: 6,
      grades: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"]
    },
    {
      name: "Secondary",
      classes: 6, 
      grades: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"]
    }
  ];

  // Grade Groups for Nigerian Curriculum
  const nigerianGradeGroups = [
    {
      name: "Nursery",
      classes: 3,
      grades: ["Nursery 1", "Nursery 2"]
    },
    {
      name: "Primary",
      classes: 6,
      grades: ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6"]
    },
    {
      name: "Secondary",
      classes: 6,
      grades: ["JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"]
    },
    {
      name: "Islamiyya",
      classes: 6, // Always 6 classes
      grades: ["Islamiyya 1", "Islamiyya 2", "Islamiyya 3", "Islamiyya 4", "Islamiyya 5", "Islamiyya 6"]
    },
    {
      name: "Adult Learning",
      classes: 6, // Always 6 classes
      grades: ["Adult Basic", "Adult Intermediate", "Adult Advanced"]
    }
  ];

  const { data: features } = useQuery({
    queryKey: ["/api/superadmin/features"],
    queryFn: () => api.superadmin.getFeatures(),
  });

  const form = useForm<SchoolFormData>({
    resolver: zodResolver(schoolFormSchema),
    defaultValues: {
      schoolName: school?.name || "",
      shortName: school?.shortName || "",
      abbreviation: school?.abbreviation || "",
      motto: school?.motto || "",
      state: school?.state || "",
      lga: school?.lga || "",
      address: school?.address || "",
      phones: school?.phones?.join(", ") || "",
      email: school?.email || "",
      type: school?.type || "K12",
      schoolAdmin: {
        name: "",
        email: "",
      },
      defaultPassword: "123456",
      initialFeatures: school?.features?.filter(f => f.enabled).map(f => f.feature.key) || [],
      selectedGradeGroups: [],
      branches: school?.branches?.map(b => ({ name: b.name })) || [{ name: "Main Branch" }],
    },
  });

  const createSchoolMutation = useMutation({
    mutationFn: (data: FormData) => api.superadmin.createSchool(data),
    onSuccess: () => {
      toast({
        title: "School created successfully",
        description: "The school has been created and welcome email sent to the admin.",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error creating school",
        description: error.message || "Failed to create school",
        variant: "destructive",
      });
    },
  });

  const updateSchoolMutation = useMutation({
    mutationFn: ({ schoolId, data }: { schoolId: string; data: FormData }) => 
      api.superadmin.updateSchool(schoolId, data),
    onSuccess: () => {
      toast({
        title: "School updated successfully",
        description: "The school has been updated successfully.",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error updating school",
        description: error.message || "Failed to update school",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Logo file must be less than 4MB",
          variant: "destructive",
        });
        return;
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/svg+xml", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Logo must be JPG, PNG, SVG, or WebP format",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addBranch = () => {
    const currentBranches = form.getValues("branches");
    form.setValue("branches", [...currentBranches, { name: "" }]);
  };

  const removeBranch = (index: number) => {
    const currentBranches = form.getValues("branches");
    if (currentBranches.length > 1) {
      form.setValue("branches", currentBranches.filter((_, i) => i !== index));
    }
  };

  const onSubmit = (data: SchoolFormData) => {
    const formData = new FormData();
    
    // Prepare school data
    const schoolData = {
      ...data,
      phones: data.phones ? data.phones.split(",").map(p => p.trim()).filter(p => p) : [],
    };
    
    formData.append("schoolData", JSON.stringify(schoolData));
    
    if (selectedFile) {
      formData.append("logo", selectedFile);
    }

    if (school) {
      updateSchoolMutation.mutate({ schoolId: school.id, data: formData });
    } else {
      createSchoolMutation.mutate(formData);
    }
  };

  const isSubmitting = createSchoolMutation.isPending || updateSchoolMutation.isPending;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="school-form-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900">
            {school ? "Edit School" : "Create New School"}
          </DialogTitle>
          <DialogDescription>
            {school ? "Update school information" : "Create a new school and setup admin account"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* School Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="schoolName">School Name *</Label>
              <Input
                id="schoolName"
                placeholder="Grace Academy International"
                {...form.register("schoolName")}
                data-testid="input-school-name"
              />
              {form.formState.errors.schoolName && (
                <p className="text-sm text-red-600">{form.formState.errors.schoolName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="shortName">Short Name (URL) *</Label>
              <Input
                id="shortName"
                placeholder="grace-academy"
                {...form.register("shortName")}
                data-testid="input-short-name"
              />
              <p className="text-xs text-slate-500">Will be used for: {form.watch("shortName") || "school-name"}.elitescholar.com</p>
              {form.formState.errors.shortName && (
                <p className="text-sm text-red-600">{form.formState.errors.shortName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="abbreviation">Abbreviation *</Label>
              <Input
                id="abbreviation"
                placeholder="GAI"
                {...form.register("abbreviation")}
                data-testid="input-abbreviation"
              />
              {form.watch("abbreviation") && (
                <div className="mt-2 p-2 bg-blue-50 rounded-md">
                  <p className="text-xs text-blue-700">
                    <strong>Preview Link:</strong> https://{form.watch("abbreviation")?.toLowerCase()}.elitescholar.com
                  </p>
                </div>
              )}
              {form.formState.errors.abbreviation && (
                <p className="text-sm text-red-600">{form.formState.errors.abbreviation.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">School Type *</Label>
              <Select value={form.watch("type")} onValueChange={(value) => form.setValue("type", value as "K12" | "NIGERIAN")}>
                <SelectTrigger data-testid="select-school-type">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="K12">K12 (Grade 1-12)</SelectItem>
                  <SelectItem value="NIGERIAN">Nigerian Curriculum</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="info@graceacademy.edu.ng"
                {...form.register("email")}
                data-testid="input-email"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phones">Phone Numbers</Label>
              <Input
                id="phones"
                placeholder="+234 803 123 4567, +234 805 987 6543"
                {...form.register("phones")}
                data-testid="input-phones"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                placeholder="Lagos"
                {...form.register("state")}
                data-testid="input-state"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lga">LGA</Label>
              <Input
                id="lga"
                placeholder="Ikeja"
                {...form.register("lga")}
                data-testid="input-lga"
              />
            </div>
          </div>

          {/* Address and Logo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="123 Education Avenue, Victoria Island..."
                rows={3}
                {...form.register("address")}
                data-testid="input-address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo">School Logo</Label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                {filePreview ? (
                  <div className="space-y-2">
                    <img src={filePreview} alt="Logo preview" className="w-16 h-16 mx-auto object-cover rounded" />
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                      Change Logo
                    </Button>
                  </div>
                ) : (
                  <>
                    <i className="fas fa-cloud-upload-alt text-3xl text-slate-400 mb-2"></i>
                    <p className="text-sm text-slate-600">
                      Drop logo here or{" "}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-primary font-medium"
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 4MB</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                  data-testid="input-logo"
                />
              </div>
            </div>
          </div>

          {/* Motto */}
          <div className="space-y-2">
            <Label htmlFor="motto">School Motto</Label>
            <Input
              id="motto"
              placeholder="Excellence in Education"
              {...form.register("motto")}
              data-testid="input-motto"
            />
          </div>

          {/* School Admin Information - Only for new schools */}
          {!school && (
            <div className="border-t border-slate-200 pt-6">
              <h4 className="text-lg font-medium text-slate-900 mb-4">School Administrator</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="adminName">Admin Name *</Label>
                  <Input
                    id="adminName"
                    placeholder="John Doe"
                    {...form.register("schoolAdmin.name")}
                    data-testid="input-admin-name"
                  />
                  {form.formState.errors.schoolAdmin?.name && (
                    <p className="text-sm text-red-600">{form.formState.errors.schoolAdmin.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin Email *</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="admin@graceacademy.edu.ng"
                    {...form.register("schoolAdmin.email")}
                    data-testid="input-admin-email"
                  />
                  {form.formState.errors.schoolAdmin?.email && (
                    <p className="text-sm text-red-600">{form.formState.errors.schoolAdmin.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultPassword">Default Password</Label>
                  <Input
                    id="defaultPassword"
                    {...form.register("defaultPassword")}
                    data-testid="input-default-password"
                  />
                  <p className="text-xs text-slate-500">Admin will be forced to change password on first login</p>
                </div>
              </div>
            </div>
          )}

          {/* Initial Features - Only for new schools */}
          {/* Grade Groups Selection */}
          {!school && (
            <div className="border-t border-slate-200 pt-6">
              <h4 className="text-lg font-medium text-slate-900 mb-4">Grade Groups</h4>
              <p className="text-sm text-slate-600 mb-4">Select which grade groups this school will offer:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(form.watch("type") === "K12" ? k12GradeGroups : nigerianGradeGroups).map((group) => (
                  <div key={group.name} className="flex items-start space-x-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50">
                    <Checkbox
                      id={`group-${group.name}`}
                      checked={form.watch("selectedGradeGroups").includes(group.name)}
                      onCheckedChange={(checked) => {
                        const currentGroups = form.getValues("selectedGradeGroups");
                        if (checked) {
                          form.setValue("selectedGradeGroups", [...currentGroups, group.name]);
                        } else {
                          form.setValue("selectedGradeGroups", currentGroups.filter(g => g !== group.name));
                        }
                      }}
                      data-testid={`checkbox-group-${group.name}`}
                    />
                    <div className="flex-1">
                      <Label htmlFor={`group-${group.name}`} className="text-sm font-medium text-slate-700 cursor-pointer">
                        {group.name}
                      </Label>
                      <p className="text-xs text-slate-500 mt-1">
                        {group.classes} classes • Includes: {group.grades.join(", ")}
                      </p>
                      {(group.name === "Islamiyya" || group.name === "Adult Learning") && (
                        <p className="text-xs text-blue-600 mt-1 font-medium">Always creates 6 classes</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!school && features && (
            <div className="border-t border-slate-200 pt-6">
              <h4 className="text-lg font-medium text-slate-900 mb-4">Initial Features</h4>
              <p className="text-sm text-slate-600 mb-4">Select which features to enable for this school:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {features.map((feature) => (
                  <div key={feature.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={feature.key}
                      checked={form.watch("initialFeatures").includes(feature.key)}
                      onCheckedChange={(checked) => {
                        const currentFeatures = form.getValues("initialFeatures");
                        if (checked) {
                          form.setValue("initialFeatures", [...currentFeatures, feature.key]);
                        } else {
                          form.setValue("initialFeatures", currentFeatures.filter(f => f !== feature.key));
                        }
                      }}
                      data-testid={`checkbox-feature-${feature.key}`}
                    />
                    <Label htmlFor={feature.key} className="text-sm font-medium text-slate-700">
                      {feature.name}
                      {feature.description && (
                        <span className="block text-xs text-slate-500 mt-1">{feature.description}</span>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Branches */}
          <div className="border-t border-slate-200 pt-6">
            <h4 className="text-lg font-medium text-slate-900 mb-4">School Branches</h4>
            <div className="space-y-3">
              {form.watch("branches").map((branch, index) => (
                <div key={index} className={`flex items-center space-x-3 p-3 rounded-lg ${index === 0 ? 'bg-slate-50' : 'border border-slate-200'}`}>
                  <Input
                    placeholder="Branch Name"
                    value={branch.name}
                    onChange={(e) => {
                      const branches = form.getValues("branches");
                      branches[index].name = e.target.value;
                      form.setValue("branches", branches);
                    }}
                    className="flex-1"
                    data-testid={`input-branch-${index}`}
                  />
                  {index === 0 && (
                    <span className="text-sm text-green-600 font-medium">Main</span>
                  )}
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBranch(index)}
                      className="text-red-600 hover:text-red-800"
                      data-testid={`button-remove-branch-${index}`}
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                onClick={addBranch}
                className="text-primary hover:text-primary/80 text-sm font-medium flex items-center space-x-2"
                data-testid="button-add-branch"
              >
                <i className="fas fa-plus"></i>
                <span>Add Another Branch</span>
              </Button>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="border-t border-slate-200 pt-6 flex items-center justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90"
              data-testid="button-submit"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {school ? "Updating..." : "Creating..."}
                </>
              ) : (
                school ? "Update School" : "Create School"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
