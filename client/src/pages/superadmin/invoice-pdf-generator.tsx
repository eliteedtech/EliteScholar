import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Document, Page, Text, View, StyleSheet, Font, Image, pdf } from "@react-pdf/renderer";
import { ChromePicker } from "react-color";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  FileImage, 
  Download, 
  Eye, 
  Upload, 
  Palette, 
  Settings, 
  Save,
  Plus,
  Trash2,
  Copy,
  RefreshCw
} from "lucide-react";
import type { 
  School, 
  InvoiceTemplate, 
  InvoiceAsset, 
  InsertInvoiceTemplate, 
  InsertInvoiceAsset,
  Feature,
  SchoolFeature,
  InvoiceLine
} from "@shared/schema";

// Invoice PDF Schema
const invoiceLineSchema = z.object({
  featureId: z.string(),
  quantity: z.number().min(1),
  unitPrice: z.number(),
  unitMeasurement: z.string(),
  negotiatedPrice: z.number().optional(),
});

const invoicePDFSchema = z.object({
  schoolId: z.string().min(1, "School is required"),
  templateId: z.string().optional(),
  features: z.array(invoiceLineSchema).min(1, "At least one feature must be selected"),
  dueDate: z.string().min(1, "Due date is required"),
  notes: z.string().optional(),
  customization: z.object({
    primaryColor: z.string().default("#2563eb"),
    accentColor: z.string().default("#64748b"),
    logoUrl: z.string().optional(),
    watermarkUrl: z.string().optional(),
    backgroundImageUrl: z.string().optional(),
    showWatermark: z.boolean().default(false),
    showBackgroundImage: z.boolean().default(false),
    headerStyle: z.string().default("default"),
    footerText: z.string().default(""),
  }),
});

type InvoicePDFFormData = z.infer<typeof invoicePDFSchema>;
type InvoiceLineData = z.infer<typeof invoiceLineSchema>;

// PDF Template Types
type TemplateType = "modern" | "classic" | "minimal" | "corporate";

// Template Schema
const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  templateType: z.enum(["modern", "classic", "minimal", "corporate"]),
  primaryColor: z.string(),
  accentColor: z.string(),
  logoUrl: z.string().optional(),
  watermarkUrl: z.string().optional(),
  backgroundImageUrl: z.string().optional(),
  customization: z.object({
    showWatermark: z.boolean(),
    showBackgroundImage: z.boolean(),
    headerStyle: z.string(),
    footerText: z.string(),
  }),
});

type TemplateFormData = z.infer<typeof templateSchema>;

// PDF Styles based on template type
const createStyles = (customization: any, templateType: TemplateType) => {
  const baseStyles = {
    page: {
      flexDirection: 'column' as const,
      backgroundColor: '#ffffff',
      padding: templateType === 'minimal' ? 30 : 40,
      fontFamily: 'Helvetica',
    },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 30,
      paddingBottom: 20,
      borderBottomWidth: templateType === 'classic' ? 2 : 1,
      borderBottomColor: customization.primaryColor || '#2563eb',
      borderBottomStyle: 'solid' as const,
    },
    logo: {
      width: 80,
      height: 80,
      objectFit: 'contain' as const,
    },
    title: {
      fontSize: templateType === 'corporate' ? 28 : 24,
      fontWeight: 'bold' as const,
      color: customization.primaryColor || '#2563eb',
      marginBottom: 5,
    },
    subtitle: {
      fontSize: 14,
      color: customization.accentColor || '#64748b',
    },
    billToSection: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 30,
    },
    table: {
      marginBottom: 30,
    },
    tableHeader: {
      flexDirection: 'row' as const,
      backgroundColor: templateType === 'modern' ? customization.primaryColor : '#f8fafc',
      padding: 12,
      marginBottom: 1,
    },
    tableHeaderText: {
      fontSize: 12,
      fontWeight: 'bold' as const,
      color: templateType === 'modern' ? '#ffffff' : customization.primaryColor,
    },
    tableRow: {
      flexDirection: 'row' as const,
      padding: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: '#e2e8f0',
      borderBottomStyle: 'solid' as const,
    },
    tableCell: {
      fontSize: 11,
      color: '#374151',
    },
    footer: {
      marginTop: 'auto' as const,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: '#e2e8f0',
      borderTopStyle: 'solid' as const,
      textAlign: 'center' as const,
    },
    watermark: {
      position: 'absolute' as const,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%) rotate(-45deg)',
      opacity: 0.1,
      fontSize: 60,
      color: customization.accentColor || '#64748b',
    }
  };

  return StyleSheet.create(baseStyles);
};

// PDF Invoice Component
const InvoicePDFDocument: React.FC<{
  invoice: any;
  school: School;
  template: any;
}> = ({ invoice, school, template }) => {
  const styles = createStyles(template.customization, template.templateType);
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Background Image */}
        {template.customization?.showBackgroundImage && template.backgroundImageUrl && (
          <Image
            src={template.backgroundImageUrl}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0.05,
            }}
          />
        )}

        {/* Header */}
        <View style={styles.header}>
          <View>
            {template.logoUrl && (
              <Image src={template.logoUrl} style={styles.logo} />
            )}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.title}>INVOICE</Text>
            <Text style={styles.subtitle}>#{invoice.invoiceNumber || 'INV-001'}</Text>
          </View>
        </View>

        {/* Bill To Section */}
        <View style={styles.billToSection}>
          <View>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
              Bill To:
            </Text>
            <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 5 }}>
              {school.name}
            </Text>
            <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>
              {school.address}
            </Text>
            <Text style={{ fontSize: 12, color: '#64748b' }}>
              {school.email}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 12, marginBottom: 5 }}>
              <Text style={{ fontWeight: 'bold' }}>Date: </Text>
              {new Date().toLocaleDateString()}
            </Text>
            <Text style={{ fontSize: 12, marginBottom: 5 }}>
              <Text style={{ fontWeight: 'bold' }}>Due Date: </Text>
              {new Date(invoice.dueDate).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 3 }]}>Description</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Qty</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Price</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Amount</Text>
          </View>

          {/* Table Rows */}
          {invoice.features.map((item: any, index: number) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 3 }]}>{item.name}</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                {item.quantity}
              </Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                ₦{(item.unitPrice / 100).toLocaleString()}
              </Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                ₦{((item.negotiatedPrice || item.unitPrice) * item.quantity / 100).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        {/* Total */}
        <View style={{ alignItems: 'flex-end', marginBottom: 30 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: template.primaryColor || '#2563eb',
            padding: 15,
            backgroundColor: '#f8fafc',
            borderRadius: 5,
          }}>
            Total: ₦{(invoice.totalAmount / 100).toLocaleString()}
          </Text>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>
              Notes:
            </Text>
            <Text style={{ fontSize: 12, color: '#64748b' }}>
              {invoice.notes}
            </Text>
          </View>
        )}

        {/* Watermark */}
        {template.customization?.showWatermark && (
          <Text style={styles.watermark}>INVOICE</Text>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={{ fontSize: 10, color: '#64748b' }}>
            {template.customization?.footerText || "Thank you for your business!"}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default function InvoicePDFGenerator() {
  const { toast } = useToast();
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [enabledFeatures, setEnabledFeatures] = useState<(SchoolFeature & { feature: Feature })[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<{ type: string; show: boolean }>({ type: "", show: false });
  const [previewData, setPreviewData] = useState<any>(null);
  const [assets, setAssets] = useState<InvoiceAsset[]>([]);
  const [createTemplateDialogOpen, setCreateTemplateDialogOpen] = useState(false);

  // Form for invoice generation
  const form = useForm<InvoicePDFFormData>({
    resolver: zodResolver(invoicePDFSchema),
    defaultValues: {
      schoolId: "",
      features: [],
      dueDate: "",
      notes: "",
      customization: {
        primaryColor: "#2563eb",
        accentColor: "#64748b",
        showWatermark: false,
        showBackgroundImage: false,
        headerStyle: "default",
        footerText: "",
      },
    },
  });

  // Form for template creation
  const templateForm = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      templateType: "modern",
      primaryColor: "#2563eb",
      accentColor: "#64748b",
      customization: {
        showWatermark: false,
        showBackgroundImage: false,
        headerStyle: "default",
        footerText: "",
      },
    },
  });

  // Fetch schools
  const { data: schoolsResponse } = useQuery<{ schools: School[] }>({
    queryKey: ["/api/superadmin/schools"],
  });
  const schools = schoolsResponse?.schools || [];

  // Fetch templates
  const { data: templatesResponse } = useQuery<{ templates: InvoiceTemplate[] }>({
    queryKey: ["/api/invoice-templates"],
  });
  const templates = templatesResponse?.templates || [];

  // Fetch assets
  const { data: assetsResponse } = useQuery<{ assets: InvoiceAsset[] }>({
    queryKey: ["/api/invoice-assets"],
  });

  useEffect(() => {
    if (assetsResponse?.assets) {
      setAssets(assetsResponse.assets);
    }
  }, [assetsResponse]);

  // Fetch enabled school features when school is selected
  useEffect(() => {
    if (selectedSchoolId) {
      const fetchFeatures = async () => {
        try {
          const response = await fetch(`/api/schools/${selectedSchoolId}/enabled-features`);
          const features = await response.json();
          setEnabledFeatures(features);
        } catch (error) {
          console.error("Failed to fetch school features:", error);
          toast({
            title: "Error",
            description: "Failed to fetch school features",
            variant: "destructive",
          });
        }
      };
      fetchFeatures();
    }
  }, [selectedSchoolId, toast]);

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      const response = await apiRequest("POST", "/api/invoice-templates", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Template created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoice-templates"] });
      setCreateTemplateDialogOpen(false);
      templateForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Generate PDF mutation
  const generatePDFMutation = useMutation({
    mutationFn: async (data: InvoicePDFFormData) => {
      // Create the invoice data
      const invoiceData = {
        ...data,
        invoiceNumber: `INV-${Date.now()}`,
        totalAmount: data.features.reduce((sum, feature) => {
          const price = feature.negotiatedPrice || feature.unitPrice;
          return sum + (price * feature.quantity);
        }, 0),
      };

      // Find the selected school
      const school = schools.find(s => s.id === data.schoolId);
      if (!school) throw new Error("School not found");

      // Use selected template or create default
      const template = selectedTemplate || {
        templateType: "modern",
        primaryColor: data.customization.primaryColor,
        accentColor: data.customization.accentColor,
        customization: data.customization,
      };

      // Generate PDF
      const pdfDoc = <InvoicePDFDocument 
        invoice={invoiceData} 
        school={school} 
        template={template} 
      />;
      
      const blob = await pdf(pdfDoc).toBlob();
      
      // Download the PDF
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceData.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return invoiceData;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "PDF invoice generated successfully!",
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

  // Upload asset mutation
  const uploadAssetMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', file.type.startsWith('image/') ? 'logo' : 'document');
      
      const response = await fetch('/api/invoice-assets/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to upload asset');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Asset uploaded successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoice-assets"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSchoolChange = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    form.setValue("schoolId", schoolId);
  };

  const handleTemplateSelect = (template: InvoiceTemplate) => {
    setSelectedTemplate(template);
    // Update form with template customization
    const currentCustomization = form.getValues("customization");
    const templateCustomization = (template.customization as any) || {};
    form.setValue("customization", {
      ...currentCustomization,
      primaryColor: template.primaryColor || "#2563eb",
      accentColor: template.accentColor || "#64748b",
      logoUrl: template.logoUrl || undefined,
      watermarkUrl: template.watermarkUrl || undefined,
      backgroundImageUrl: template.backgroundImageUrl || undefined,
      showWatermark: templateCustomization.showWatermark || false,
      showBackgroundImage: templateCustomization.showBackgroundImage || false,
      headerStyle: templateCustomization.headerStyle || "default",
      footerText: templateCustomization.footerText || "",
    });
  };

  const handleColorChange = (color: { hex: string }, type: 'primary' | 'accent') => {
    const colorValue = color.hex;
    form.setValue(`customization.${type === 'primary' ? 'primaryColor' : 'accentColor'}`, colorValue);
    if (type === 'primary') {
      templateForm.setValue('primaryColor', colorValue);
    } else {
      templateForm.setValue('accentColor', colorValue);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'watermark' | 'background') => {
    const file = event.target.files?.[0];
    if (file) {
      uploadAssetMutation.mutate(file);
    }
  };

  const addFeatureToInvoice = (feature: SchoolFeature & { feature: Feature }) => {
    const currentFeatures = form.getValues("features");
    const exists = currentFeatures.find(f => f.featureId === feature.featureId);
    
    if (!exists) {
      const newFeature: InvoiceLineData = {
        featureId: feature.featureId,
        quantity: 1,
        unitPrice: feature.feature.price || 0,
        unitMeasurement: feature.feature.pricingType || "per_school",
      };
      
      form.setValue("features", [...currentFeatures, newFeature]);
      
      // Update preview data
      updatePreview();
    }
  };

  const removeFeatureFromInvoice = (index: number) => {
    const currentFeatures = form.getValues("features");
    form.setValue("features", currentFeatures.filter((_, i) => i !== index));
    updatePreview();
  };

  const updatePreview = () => {
    const formData = form.getValues();
    if (formData.schoolId && formData.features.length > 0) {
      const school = schools.find(s => s.id === formData.schoolId);
      const featuresWithDetails = formData.features.map(f => {
        const featureDetails = enabledFeatures.find(ef => ef.featureId === f.featureId);
        return {
          ...f,
          name: featureDetails?.feature.name || "Unknown Feature",
        };
      });
      
      setPreviewData({
        ...formData,
        school,
        features: featuresWithDetails,
        totalAmount: featuresWithDetails.reduce((sum, feature) => {
          const price = feature.negotiatedPrice || feature.unitPrice;
          return sum + (price * feature.quantity);
        }, 0),
      });
    }
  };

  const onSubmit = (data: InvoicePDFFormData) => {
    generatePDFMutation.mutate(data);
  };

  const onCreateTemplate = (data: TemplateFormData) => {
    createTemplateMutation.mutate(data);
  };

  return (
    <div className="flex h-screen">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              PDF Invoice Generator
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Create professional PDF invoices with customizable templates, colors, and assets.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
            {/* Left Panel - Form */}
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Invoice Configuration</CardTitle>
                  <CardDescription>
                    Configure your invoice settings and customize the appearance
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-y-auto max-h-[calc(100vh-300px)]">
                  <Tabs defaultValue="invoice" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="invoice">Invoice</TabsTrigger>
                      <TabsTrigger value="template">Template</TabsTrigger>
                      <TabsTrigger value="customization">Design</TabsTrigger>
                      <TabsTrigger value="assets">Assets</TabsTrigger>
                    </TabsList>

                    {/* Invoice Tab */}
                    <TabsContent value="invoice" className="space-y-6">
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                          {/* School Selection */}
                          <FormField
                            control={form.control}
                            name="schoolId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>School</FormLabel>
                                <Select onValueChange={handleSchoolChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-school-pdf">
                                      <SelectValue placeholder="Select school" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {schools.map((school) => (
                                      <SelectItem key={school.id} value={school.id}>
                                        {school.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Available Features */}
                          {selectedSchoolId && enabledFeatures.length > 0 && (
                            <div className="space-y-4">
                              <h4 className="text-sm font-medium">Available Features</h4>
                              <div className="grid grid-cols-1 gap-3 max-h-40 overflow-y-auto">
                                {enabledFeatures.map((schoolFeature) => (
                                  <div
                                    key={schoolFeature.id}
                                    className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => addFeatureToInvoice(schoolFeature)}
                                  >
                                    <div className="flex-1">
                                      <div className="font-medium text-sm">
                                        {schoolFeature.feature.name}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        ₦{((schoolFeature.feature.price || 0) / 100).toLocaleString()} • {schoolFeature.feature.pricingType}
                                      </div>
                                    </div>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      data-testid={`button-add-feature-${schoolFeature.featureId}`}
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Selected Features */}
                          {form.watch("features").length > 0 && (
                            <div className="space-y-4">
                              <h4 className="text-sm font-medium">Selected Features</h4>
                              <div className="space-y-3">
                                {form.watch("features").map((feature, index) => {
                                  const featureDetails = enabledFeatures.find(
                                    (ef) => ef.featureId === feature.featureId
                                  );
                                  return (
                                    <div key={index} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                      <div className="flex-1">
                                        <div className="font-medium text-sm">
                                          {featureDetails?.feature.name || "Unknown Feature"}
                                        </div>
                                        <div className="flex gap-4 mt-2">
                                          <Input
                                            type="number"
                                            placeholder="Qty"
                                            className="w-20"
                                            value={feature.quantity}
                                            onChange={(e) => {
                                              const features = form.getValues("features");
                                              features[index].quantity = parseInt(e.target.value) || 1;
                                              form.setValue("features", features);
                                              updatePreview();
                                            }}
                                          />
                                          <Input
                                            type="number"
                                            placeholder="Price"
                                            className="w-28"
                                            value={feature.unitPrice}
                                            onChange={(e) => {
                                              const features = form.getValues("features");
                                              features[index].unitPrice = parseInt(e.target.value) || 0;
                                              form.setValue("features", features);
                                              updatePreview();
                                            }}
                                          />
                                        </div>
                                      </div>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => removeFeatureFromInvoice(index)}
                                        data-testid={`button-remove-feature-${index}`}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Due Date */}
                          <FormField
                            control={form.control}
                            name="dueDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Due Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} data-testid="input-due-date" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Notes */}
                          <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Notes (Optional)</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Additional notes or terms..."
                                    {...field}
                                    data-testid="textarea-notes"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button
                            type="submit"
                            className="w-full"
                            disabled={generatePDFMutation.isPending}
                            data-testid="button-generate-pdf"
                          >
                            {generatePDFMutation.isPending ? (
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4 mr-2" />
                            )}
                            Generate PDF Invoice
                          </Button>
                        </form>
                      </Form>
                    </TabsContent>

                    {/* Template Tab */}
                    <TabsContent value="template" className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-medium">Select Template</h4>
                          <Dialog open={createTemplateDialogOpen} onOpenChange={setCreateTemplateDialogOpen}>
                            <DialogTrigger asChild>
                              <Button size="sm" data-testid="button-create-template">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Template
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Create New Template</DialogTitle>
                                <DialogDescription>
                                  Create a custom invoice template with your preferred styling.
                                </DialogDescription>
                              </DialogHeader>
                              <Form {...templateForm}>
                                <form onSubmit={templateForm.handleSubmit(onCreateTemplate)} className="space-y-4">
                                  <FormField
                                    control={templateForm.control}
                                    name="name"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Template Name</FormLabel>
                                        <FormControl>
                                          <Input {...field} placeholder="My Custom Template" />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <FormField
                                    control={templateForm.control}
                                    name="templateType"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Template Type</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select template type" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="modern">Modern</SelectItem>
                                            <SelectItem value="classic">Classic</SelectItem>
                                            <SelectItem value="minimal">Minimal</SelectItem>
                                            <SelectItem value="corporate">Corporate</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <div className="flex gap-4">
                                    <Button
                                      type="submit"
                                      disabled={createTemplateMutation.isPending}
                                      data-testid="button-save-template"
                                    >
                                      {createTemplateMutation.isPending ? (
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                      ) : (
                                        <Save className="h-4 w-4 mr-2" />
                                      )}
                                      Save Template
                                    </Button>
                                  </div>
                                </form>
                              </Form>
                            </DialogContent>
                          </Dialog>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          {templates.map((template) => (
                            <div
                              key={template.id}
                              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                selectedTemplate?.id === template.id
                                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300"
                                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
                              }`}
                              onClick={() => handleTemplateSelect(template)}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h5 className="font-medium">{template.name}</h5>
                                  <p className="text-sm text-muted-foreground capitalize">
                                    {template.templateType} style
                                  </p>
                                  <div className="flex gap-2 mt-2">
                                    <div
                                      className="w-4 h-4 rounded border"
                                      style={{ backgroundColor: template.primaryColor || '#2563eb' }}
                                    />
                                    <div
                                      className="w-4 h-4 rounded border"
                                      style={{ backgroundColor: template.accentColor || '#64748b' }}
                                    />
                                  </div>
                                </div>
                                {selectedTemplate?.id === template.id && (
                                  <Badge variant="secondary">Selected</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    {/* Customization Tab */}
                    <TabsContent value="customization" className="space-y-6">
                      <div className="space-y-6">
                        {/* Colors */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium">Colors</h4>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Primary Color</label>
                              <div className="flex items-center gap-2 mt-1">
                                <div
                                  className="w-8 h-8 rounded border cursor-pointer"
                                  style={{ backgroundColor: form.watch("customization.primaryColor") }}
                                  onClick={() => setShowColorPicker({ type: "primary", show: !showColorPicker.show })}
                                />
                                <Input
                                  value={form.watch("customization.primaryColor")}
                                  onChange={(e) => handleColorChange({ hex: e.target.value }, 'primary')}
                                  className="flex-1"
                                />
                              </div>
                              {showColorPicker.show && showColorPicker.type === "primary" && (
                                <div className="absolute z-10 mt-2">
                                  <ChromePicker
                                    color={form.watch("customization.primaryColor") || "#2563eb"}
                                    onChange={(color: { hex: string }) => handleColorChange(color, 'primary')}
                                  />
                                </div>
                              )}
                            </div>

                            <div>
                              <label className="text-sm font-medium">Accent Color</label>
                              <div className="flex items-center gap-2 mt-1">
                                <div
                                  className="w-8 h-8 rounded border cursor-pointer"
                                  style={{ backgroundColor: form.watch("customization.accentColor") }}
                                  onClick={() => setShowColorPicker({ type: "accent", show: !showColorPicker.show })}
                                />
                                <Input
                                  value={form.watch("customization.accentColor")}
                                  onChange={(e) => handleColorChange({ hex: e.target.value }, 'accent')}
                                  className="flex-1"
                                />
                              </div>
                              {showColorPicker.show && showColorPicker.type === "accent" && (
                                <div className="absolute z-10 mt-2">
                                  <ChromePicker
                                    color={form.watch("customization.accentColor") || "#64748b"}
                                    onChange={(color: { hex: string }) => handleColorChange(color, 'accent')}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Display Options */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium">Display Options</h4>
                          
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-sm">Show Watermark</label>
                              <Switch
                                checked={form.watch("customization.showWatermark")}
                                onCheckedChange={(checked) => 
                                  form.setValue("customization.showWatermark", checked)
                                }
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <label className="text-sm">Show Background Image</label>
                              <Switch
                                checked={form.watch("customization.showBackgroundImage")}
                                onCheckedChange={(checked) => 
                                  form.setValue("customization.showBackgroundImage", checked)
                                }
                              />
                            </div>
                          </div>
                        </div>

                        {/* Footer Text */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Footer Text</label>
                          <Input
                            value={form.watch("customization.footerText")}
                            onChange={(e) => form.setValue("customization.footerText", e.target.value)}
                            placeholder="Thank you for your business!"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    {/* Assets Tab */}
                    <TabsContent value="assets" className="space-y-6">
                      <div className="space-y-6">
                        {/* Upload Buttons */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, 'logo')}
                              className="hidden"
                              id="logo-upload"
                            />
                            <label
                              htmlFor="logo-upload"
                              className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <Upload className="h-8 w-8 mb-2 text-gray-400" />
                              <span className="text-sm font-medium">Upload Logo</span>
                            </label>
                          </div>

                          <div className="text-center">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, 'watermark')}
                              className="hidden"
                              id="watermark-upload"
                            />
                            <label
                              htmlFor="watermark-upload"
                              className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <FileImage className="h-8 w-8 mb-2 text-gray-400" />
                              <span className="text-sm font-medium">Upload Watermark</span>
                            </label>
                          </div>

                          <div className="text-center">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, 'background')}
                              className="hidden"
                              id="background-upload"
                            />
                            <label
                              htmlFor="background-upload"
                              className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <FileImage className="h-8 w-8 mb-2 text-gray-400" />
                              <span className="text-sm font-medium">Upload Background</span>
                            </label>
                          </div>
                        </div>

                        {/* Assets Grid */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium">Uploaded Assets</h4>
                          <div className="grid grid-cols-2 gap-4">
                            {assets.map((asset) => (
                              <div key={asset.id} className="p-3 border rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">{asset.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {asset.type}
                                  </Badge>
                                </div>
                                {asset.url && (
                                  <img
                                    src={asset.url}
                                    alt={asset.name}
                                    className="w-full h-20 object-cover rounded border"
                                  />
                                )}
                                <div className="mt-2 flex justify-between items-center">
                                  <span className="text-xs text-muted-foreground">
                                    {asset.size && `${(asset.size / 1024).toFixed(1)}KB`}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      if (asset.type === 'logo') {
                                        form.setValue("customization.logoUrl", asset.url);
                                      } else if (asset.type === 'watermark') {
                                        form.setValue("customization.watermarkUrl", asset.url);
                                      } else {
                                        form.setValue("customization.backgroundImageUrl", asset.url);
                                      }
                                    }}
                                  >
                                    Use
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - Preview */}
            <div className="lg:col-span-1">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Live Preview
                  </CardTitle>
                  <CardDescription>
                    See how your invoice will look
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-y-auto max-h-[calc(100vh-300px)]">
                  {previewData ? (
                    <div className="space-y-4">
                      {/* Preview Header */}
                      <div 
                        className="p-4 rounded-lg text-white"
                        style={{ backgroundColor: form.watch("customization.primaryColor") }}
                      >
                        <h3 className="text-lg font-bold">INVOICE</h3>
                        <p className="text-sm opacity-90">Preview Mode</p>
                      </div>

                      {/* School Info */}
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <h4 className="font-medium text-sm">Bill To:</h4>
                        <p className="font-bold">{previewData.school?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {previewData.school?.address}
                        </p>
                      </div>

                      {/* Items */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Items:</h4>
                        {previewData.features.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            <span>{item.name}</span>
                            <span>₦{((item.negotiatedPrice || item.unitPrice) * item.quantity / 100).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      {/* Total */}
                      <div 
                        className="p-3 rounded text-white font-bold text-center"
                        style={{ backgroundColor: form.watch("customization.accentColor") }}
                      >
                        Total: ₦{(previewData.totalAmount / 100).toLocaleString()}
                      </div>

                      {/* Notes */}
                      {previewData.notes && (
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                          <h4 className="font-medium text-sm mb-1">Notes:</h4>
                          <p className="text-xs">{previewData.notes}</p>
                        </div>
                      )}

                      {/* Footer */}
                      {form.watch("customization.footerText") && (
                        <div className="text-center text-xs text-muted-foreground border-t pt-3">
                          {form.watch("customization.footerText")}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-center">
                      <div>
                        <Eye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-sm text-muted-foreground">
                          Select a school and add features to see preview
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}