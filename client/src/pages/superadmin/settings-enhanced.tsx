import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import SuperAdminLayout from "@/components/superadmin/layout";

const appSettingsSchema = z.object({
  // General Settings
  appName: z.string().default("Elite Scholar"),
  appLogo: z.string().optional(),
  domain: z.string().optional(),
  
  // Email Configuration
  smtpHost: z.string().optional(),
  smtpPort: z.string().default("587"),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  smtpSecure: z.boolean().default(false),
  emailFromAddress: z.string().optional(),
  emailFromName: z.string().default("Elite Scholar"),
  emailTemplate: z.string().optional(),
  
  // Cloudinary Settings
  cloudinaryCloudName: z.string().optional(),
  cloudinaryApiKey: z.string().optional(),
  cloudinaryApiSecret: z.string().optional(),
  cloudinaryUploadPreset: z.string().optional(),
  
  // Communication Methods
  twilioAccountSid: z.string().optional(),
  twilioAuthToken: z.string().optional(),
  twilioPhoneNumber: z.string().optional(),
  twilioWhatsappNumber: z.string().optional(),
  
  // Invoice Settings
  invoiceTemplate: z.string().optional(),
  invoiceBackgroundImage: z.string().optional(),
  invoiceLogo: z.string().optional(),
});

type AppSettingsFormData = z.infer<typeof appSettingsSchema>;

export default function EnhancedSettingsPage() {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState("default");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/superadmin/settings"],
    queryFn: () => api.get("/api/superadmin/settings"),
  });

  const form = useForm<AppSettingsFormData>({
    resolver: zodResolver(appSettingsSchema),
    defaultValues: {
      appName: settings?.appName || "Elite Scholar",
      smtpPort: settings?.smtpPort || "587",
      emailFromName: settings?.emailFromName || "Elite Scholar",
      smtpSecure: settings?.smtpSecure || false,
      emailTemplate: settings?.emailTemplate || defaultEmailTemplate,
      invoiceTemplate: settings?.invoiceTemplate || defaultInvoiceTemplate,
      ...settings,
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: AppSettingsFormData) =>
      api.post("/api/superadmin/settings", data),
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Application settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/settings"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: () => api.post("/api/superadmin/test-email"),
    onSuccess: () => {
      toast({
        title: "Test Email Sent",
        description: "Check your inbox to verify email configuration.",
      });
    },
    onError: () => {
      toast({
        title: "Email Test Failed",
        description: "Please check your email configuration.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AppSettingsFormData) => {
    updateSettingsMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <SuperAdminLayout title="Application Settings" subtitle="Configure system settings and integrations">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading settings...</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout title="Enhanced Settings" subtitle="Comprehensive application configuration">
      <div className="p-6 max-w-6xl mx-auto">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Accordion type="multiple" defaultValue={["general", "email"]} className="space-y-4">
            
            {/* General Settings */}
            <AccordionItem value="general">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-2">
                  <i className="fas fa-cog text-primary"></i>
                  General Settings
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardHeader>
                    <CardTitle>Application Configuration</CardTitle>
                    <CardDescription>
                      Basic application settings and branding
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="appName">Application Name</Label>
                        <Input
                          id="appName"
                          {...form.register("appName")}
                          data-testid="input-app-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="domain">Domain</Label>
                        <Input
                          id="domain"
                          {...form.register("domain")}
                          placeholder="yourdomain.com"
                          data-testid="input-domain"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="appLogo">Application Logo URL</Label>
                      <Input
                        id="appLogo"
                        {...form.register("appLogo")}
                        placeholder="https://example.com/logo.png"
                        data-testid="input-app-logo"
                      />
                    </div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

            {/* Email Configuration */}
            <AccordionItem value="email">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-2">
                  <i className="fas fa-envelope text-primary"></i>
                  Email Configuration
                  <Badge variant="secondary" className="ml-auto">
                    {form.watch("smtpHost") ? "Configured" : "Not Set"}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardHeader>
                    <CardTitle>SMTP Settings</CardTitle>
                    <CardDescription>
                      Configure email delivery for notifications and invoices
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="smtpHost">SMTP Host</Label>
                        <Input
                          id="smtpHost"
                          {...form.register("smtpHost")}
                          placeholder="smtp.gmail.com"
                          data-testid="input-smtp-host"
                        />
                      </div>
                      <div>
                        <Label htmlFor="smtpPort">SMTP Port</Label>
                        <Input
                          id="smtpPort"
                          {...form.register("smtpPort")}
                          placeholder="587"
                          data-testid="input-smtp-port"
                        />
                      </div>
                      <div>
                        <Label htmlFor="smtpUser">SMTP Username</Label>
                        <Input
                          id="smtpUser"
                          {...form.register("smtpUser")}
                          placeholder="your-email@gmail.com"
                          data-testid="input-smtp-user"
                        />
                      </div>
                      <div>
                        <Label htmlFor="smtpPassword">SMTP Password</Label>
                        <Input
                          type="password"
                          id="smtpPassword"
                          {...form.register("smtpPassword")}
                          placeholder="your-app-password"
                          data-testid="input-smtp-password"
                        />
                      </div>
                      <div>
                        <Label htmlFor="emailFromAddress">From Email Address</Label>
                        <Input
                          id="emailFromAddress"
                          {...form.register("emailFromAddress")}
                          placeholder="noreply@yourdomain.com"
                          data-testid="input-email-from"
                        />
                      </div>
                      <div>
                        <Label htmlFor="emailFromName">From Name</Label>
                        <Input
                          id="emailFromName"
                          {...form.register("emailFromName")}
                          placeholder="Elite Scholar"
                          data-testid="input-email-from-name"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="smtpSecure"
                        checked={form.watch("smtpSecure")}
                        onCheckedChange={(checked) => form.setValue("smtpSecure", checked)}
                        data-testid="switch-smtp-secure"
                      />
                      <Label htmlFor="smtpSecure">Use SSL/TLS</Label>
                    </div>
                    <div>
                      <Label htmlFor="emailTemplate">Email Template</Label>
                      <Textarea
                        id="emailTemplate"
                        {...form.register("emailTemplate")}
                        rows={6}
                        placeholder="HTML email template with placeholders"
                        data-testid="textarea-email-template"
                      />
                      <p className="text-sm text-slate-600 mt-1">
                        Available placeholders: {{schoolName}}, {{invoiceNumber}}, {{totalAmount}}, {{dueDate}}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => testEmailMutation.mutate()}
                      disabled={testEmailMutation.isPending}
                      data-testid="button-test-email"
                    >
                      {testEmailMutation.isPending ? "Sending..." : "Test Email Configuration"}
                    </Button>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

            {/* Communication Methods */}
            <AccordionItem value="communication">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-2">
                  <i className="fas fa-comments text-primary"></i>
                  Communication Methods
                  <Badge variant="secondary" className="ml-auto">
                    {form.watch("twilioAccountSid") ? "Twilio Ready" : "Not Set"}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardHeader>
                    <CardTitle>Twilio Configuration</CardTitle>
                    <CardDescription>
                      Enable SMS and WhatsApp messaging for invoice delivery
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="twilioAccountSid">Twilio Account SID</Label>
                        <Input
                          id="twilioAccountSid"
                          {...form.register("twilioAccountSid")}
                          placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          data-testid="input-twilio-sid"
                        />
                      </div>
                      <div>
                        <Label htmlFor="twilioAuthToken">Twilio Auth Token</Label>
                        <Input
                          type="password"
                          id="twilioAuthToken"
                          {...form.register("twilioAuthToken")}
                          placeholder="your-auth-token"
                          data-testid="input-twilio-token"
                        />
                      </div>
                      <div>
                        <Label htmlFor="twilioPhoneNumber">SMS Phone Number</Label>
                        <Input
                          id="twilioPhoneNumber"
                          {...form.register("twilioPhoneNumber")}
                          placeholder="+1234567890"
                          data-testid="input-twilio-phone"
                        />
                      </div>
                      <div>
                        <Label htmlFor="twilioWhatsappNumber">WhatsApp Number</Label>
                        <Input
                          id="twilioWhatsappNumber"
                          {...form.register("twilioWhatsappNumber")}
                          placeholder="whatsapp:+1234567890"
                          data-testid="input-twilio-whatsapp"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

            {/* Cloudinary Settings */}
            <AccordionItem value="cloudinary">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-2">
                  <i className="fas fa-cloud-upload-alt text-primary"></i>
                  Cloudinary Configuration
                  <Badge variant="secondary" className="ml-auto">
                    {form.watch("cloudinaryCloudName") ? "Connected" : "Not Set"}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardHeader>
                    <CardTitle>Image Upload Settings</CardTitle>
                    <CardDescription>
                      Configure Cloudinary for image storage and optimization
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cloudinaryCloudName">Cloud Name</Label>
                        <Input
                          id="cloudinaryCloudName"
                          {...form.register("cloudinaryCloudName")}
                          placeholder="your-cloud-name"
                          data-testid="input-cloudinary-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cloudinaryApiKey">API Key</Label>
                        <Input
                          id="cloudinaryApiKey"
                          {...form.register("cloudinaryApiKey")}
                          placeholder="123456789012345"
                          data-testid="input-cloudinary-key"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cloudinaryApiSecret">API Secret</Label>
                        <Input
                          type="password"
                          id="cloudinaryApiSecret"
                          {...form.register("cloudinaryApiSecret")}
                          placeholder="your-api-secret"
                          data-testid="input-cloudinary-secret"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cloudinaryUploadPreset">Upload Preset</Label>
                        <Input
                          id="cloudinaryUploadPreset"
                          {...form.register("cloudinaryUploadPreset")}
                          placeholder="elite_scholar_uploads"
                          data-testid="input-cloudinary-preset"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

            {/* Invoice Settings */}
            <AccordionItem value="invoice">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-2">
                  <i className="fas fa-file-invoice text-primary"></i>
                  Invoice Template Settings
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardHeader>
                    <CardTitle>Invoice Customization</CardTitle>
                    <CardDescription>
                      Design your invoice template with preview
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="invoiceBackgroundImage">Background Image URL</Label>
                        <Input
                          id="invoiceBackgroundImage"
                          {...form.register("invoiceBackgroundImage")}
                          placeholder="https://example.com/bg.png"
                          data-testid="input-invoice-bg"
                        />
                      </div>
                      <div>
                        <Label htmlFor="invoiceLogo">Invoice Logo URL</Label>
                        <Input
                          id="invoiceLogo"
                          {...form.register("invoiceLogo")}
                          placeholder="https://example.com/logo.png"
                          data-testid="input-invoice-logo"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="invoiceTemplate">Invoice Template HTML</Label>
                      <Textarea
                        id="invoiceTemplate"
                        {...form.register("invoiceTemplate")}
                        rows={8}
                        placeholder="HTML invoice template"
                        data-testid="textarea-invoice-template"
                      />
                      <p className="text-sm text-slate-600 mt-1">
                        Available placeholders: {{schoolName}}, {{invoiceNumber}}, {{totalAmount}}, {{items}}, {{dueDate}}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-2">Invoice Preview</h4>
                        <div 
                          className="border rounded-lg p-4 bg-white shadow-sm min-h-[300px]"
                          dangerouslySetInnerHTML={{ 
                            __html: form.watch("invoiceTemplate")?.replace(/\{\{(\w+)\}\}/g, (match, key) => {
                              const sampleData: any = {
                                schoolName: "Sample School",
                                invoiceNumber: "INV-2025-001",
                                totalAmount: "₦236,320.80",
                                dueDate: "January 31, 2025",
                                items: "<tr><td>Feature Management</td><td>1</td><td>₦50,000</td></tr>"
                              };
                              return sampleData[key] || match;
                            }) || ""
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

          </Accordion>

          <div className="flex justify-end space-x-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              data-testid="button-reset-settings"
            >
              Reset Changes
            </Button>
            <Button
              type="submit"
              disabled={updateSettingsMutation.isPending}
              data-testid="button-save-settings"
            >
              {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </div>
    </SuperAdminLayout>
  );
}

const defaultEmailTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice from {{schoolName}}</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
    <h2 style="color: #333; margin-bottom: 20px;">Invoice {{invoiceNumber}}</h2>
    <p>Dear {{schoolName}},</p>
    <p>Please find attached your invoice for the amount of <strong>{{totalAmount}}</strong>.</p>
    <p>Due Date: <strong>{{dueDate}}</strong></p>
    <p>Thank you for choosing Elite Scholar.</p>
    <p>Best regards,<br>Elite Scholar Team</p>
  </div>
</body>
</html>
`;

const defaultInvoiceTemplate = `
<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #2563eb; margin-bottom: 10px;">INVOICE</h1>
    <h2 style="color: #64748b;">{{invoiceNumber}}</h2>
  </div>
  
  <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
    <div>
      <h3>Bill To:</h3>
      <p><strong>{{schoolName}}</strong></p>
    </div>
    <div style="text-align: right;">
      <p><strong>Due Date:</strong> {{dueDate}}</p>
    </div>
  </div>
  
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
    <thead>
      <tr style="background-color: #f8fafc;">
        <th style="padding: 12px; text-align: left; border: 1px solid #e2e8f0;">Description</th>
        <th style="padding: 12px; text-align: right; border: 1px solid #e2e8f0;">Quantity</th>
        <th style="padding: 12px; text-align: right; border: 1px solid #e2e8f0;">Amount</th>
      </tr>
    </thead>
    <tbody>
      {{items}}
    </tbody>
  </table>
  
  <div style="text-align: right; margin-top: 20px;">
    <h3 style="font-size: 18px; color: #2563eb;">Total: {{totalAmount}}</h3>
  </div>
</div>
`;