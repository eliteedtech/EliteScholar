import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Upload,
  Trash2,
  TestTube,
} from "lucide-react";
import SuperAdminDashboard from "./dashboard";
import SuperAdminLayout from "@/components/superadmin/layout";

interface ServiceStatus {
  name: string;
  status: "connected" | "disconnected" | "error" | "testing";
  lastChecked?: string;
  error?: string;
  configured: boolean;
}

interface AppConfig {
  id?: string;
  appName?: string;
  appLogo?: string;
  domain?: string;

  // SendGrid
  sendgridApiKey?: string;
  sendgridFromEmail?: string;
  sendgridFromName?: string;
  sendgridStatus?: string;
  sendgridLastChecked?: string;
  sendgridErrorMessage?: string;

  // SMTP
  smtpHost?: string;
  smtpPort?: string;
  smtpUser?: string;
  smtpPassword?: string;
  smtpSecure?: boolean;
  smtpStatus?: string;
  smtpLastChecked?: string;
  smtpErrorMessage?: string;

  // Cloudinary
  cloudinaryCloudName?: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string;
  cloudinaryUploadPreset?: string;
  cloudinaryStatus?: string;
  cloudinaryLastChecked?: string;
  cloudinaryErrorMessage?: string;

  // Twilio
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
  twilioWhatsappNumber?: string;
  twilioSmsStatus?: string;
  twilioWhatsappStatus?: string;
  twilioLastChecked?: string;
  twilioErrorMessage?: string;

  // System
  maintenanceMode?: boolean;
  allowRegistration?: boolean;
  maxFileUploadSize?: number;

  // Invoice
  invoiceTemplate?: string;
  invoiceBackgroundImage?: string;
  invoiceLogo?: string;

  createdAt?: string;
  updatedAt?: string;
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("basic");
  const [uploadingAsset, setUploadingAsset] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch app config
  const { data: config, isLoading } = useQuery<AppConfig>({
    queryKey: ["/api/superadmin/config"],
  });

  // Fetch service status
  const { data: statusData, refetch: refetchStatus } = useQuery<{
    services: ServiceStatus[];
  }>({
    queryKey: ["/api/superadmin/config/status"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const form = useForm<AppConfig>({
    defaultValues: config || {},
  });

  // Update form when config loads
  useEffect(() => {
    if (config) {
      form.reset(config);
    }
  }, [config, form]);

  // Update config mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (data: Partial<AppConfig>) =>
      apiRequest(`/api/superadmin/config`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({ title: "Profile updated successfully", variant: "default" });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/config"] });
      refetchStatus();
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async ({ service, config }: { service: string; config: any }) =>
      apiRequest(`/api/superadmin/config/test-connection`, {
        method: "POST",
        body: JSON.stringify({ service, config }),
      }),
    onSuccess: (result: any) => {
      toast({
        title: `${result.service} test ${result.status === "connected" ? "successful" : "failed"}`,
        description: result.message,
        variant: result.status === "connected" ? "default" : "destructive",
      });
      refetchStatus();
    },
    onError: (error: any) => {
      toast({
        title: "Connection test failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Test all connections mutation
  const testAllMutation = useMutation({
    mutationFn: async () =>
      apiRequest(`/api/superadmin/config/test-all`, { method: "POST" }),
    onSuccess: (results: any[]) => {
      const successCount = results.filter(
        (r) => r.status === "connected",
      ).length;
      toast({
        title: `Connection tests completed`,
        description: `${successCount}/${results.length} services connected successfully`,
        variant: successCount === results.length ? "default" : "destructive",
      });
      refetchStatus();
    },
    onError: (error: any) => {
      toast({
        title: "Connection tests failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Asset upload handler
  const handleAssetUpload = async (
    file: File,
    type: "logo" | "watermark" | "background",
  ) => {
    setUploadingAsset(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const response = await fetch("/api/superadmin/config/upload-asset", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      toast({
        title: "Asset uploaded successfully",
        description: `${type} uploaded to Cloudinary`,
        variant: "default",
      });

      // Update form with new asset URL
      if (type === "logo") {
        form.setValue("invoiceLogo", result.url);
      } else if (type === "background") {
        form.setValue("invoiceBackgroundImage", result.url);
      }

      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/config"] });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingAsset(false);
    }
  };

  const onSubmit = (data: AppConfig) => {
    updateConfigMutation.mutate(data);
  };

  const getStatusBadge = (status?: string, configured?: boolean) => {
    if (!configured) {
      return <Badge variant="secondary">Not Configured</Badge>;
    }

    switch (status) {
      case "connected":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      case "testing":
        return (
          <Badge variant="secondary">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Testing
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Disconnected
          </Badge>
        );
    }
  };

  const testService = (service: string) => {
    const formData = form.getValues();
    testConnectionMutation.mutate({ service, config: formData });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  return (
    <SuperAdminLayout
      title="Profile and Config Key Management"
      subtitle=" Manage system features and their Setup configuration"
    >
      <div
        className="container mx-auto p-6 max-w-4xl"
        data-testid="profile-page"
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2" data-testid="page-title">
            Profile & Configuration
          </h1>
          <p className="text-muted-foreground">
            Manage your application settings and service integrations
          </p>
        </div>

        {/* Service Status Overview */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle data-testid="service-status-title">
                  Service Status
                </CardTitle>
                <CardDescription>
                  Overview of all external service connections
                </CardDescription>
              </div>
              <Button
                onClick={() => testAllMutation.mutate()}
                disabled={testAllMutation.isPending}
                variant="outline"
                size="sm"
                data-testid="test-all-button"
              >
                {testAllMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <TestTube className="w-4 h-4 mr-2" />
                )}
                Test All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {statusData?.services.map((service, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                  data-testid={`service-status-${service.name.toLowerCase().replace(" ", "-")}`}
                >
                  <div>
                    <p className="font-medium">{service.name}</p>
                    {service.lastChecked && (
                      <p className="text-xs text-muted-foreground">
                        Last checked:{" "}
                        {new Date(service.lastChecked).toLocaleString()}
                      </p>
                    )}
                  </div>
                  {getStatusBadge(service.status, service.configured)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic" data-testid="tab-basic">
                Basic
              </TabsTrigger>
              <TabsTrigger value="email" data-testid="tab-email">
                Email
              </TabsTrigger>
              <TabsTrigger value="storage" data-testid="tab-storage">
                Storage
              </TabsTrigger>
              <TabsTrigger
                value="communication"
                data-testid="tab-communication"
              >
                Communication
              </TabsTrigger>
              <TabsTrigger value="invoice" data-testid="tab-invoice">
                Invoice
              </TabsTrigger>
            </TabsList>

            {/* Basic Settings */}
            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Application Settings</CardTitle>
                  <CardDescription>
                    Basic application configuration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="appName">Application Name</Label>
                    <Input
                      id="appName"
                      {...form.register("appName")}
                      placeholder="Elite Scholar"
                      data-testid="input-app-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="domain">Domain</Label>
                    <Input
                      id="domain"
                      {...form.register("domain")}
                      placeholder="https://your-domain.com"
                      data-testid="input-domain"
                    />
                  </div>
                  <div>
                    <Label htmlFor="appLogo">Application Logo URL</Label>
                    <Input
                      id="appLogo"
                      {...form.register("appLogo")}
                      placeholder="https://your-logo-url.com/logo.png"
                      data-testid="input-app-logo"
                    />
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-medium">System Settings</h4>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="maintenanceMode"
                        {...form.register("maintenanceMode")}
                        data-testid="switch-maintenance-mode"
                      />
                      <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="allowRegistration"
                        {...form.register("allowRegistration")}
                        data-testid="switch-allow-registration"
                      />
                      <Label htmlFor="allowRegistration">
                        Allow New Registrations
                      </Label>
                    </div>
                    <div>
                      <Label htmlFor="maxFileUploadSize">
                        Max File Upload Size (bytes)
                      </Label>
                      <Input
                        id="maxFileUploadSize"
                        type="number"
                        {...form.register("maxFileUploadSize", {
                          valueAsNumber: true,
                        })}
                        placeholder="10485760"
                        data-testid="input-max-file-size"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Email Settings */}
            <TabsContent value="email" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>SendGrid Configuration</CardTitle>
                      <CardDescription>
                        Primary email service via SendGrid API
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => testService("sendgrid")}
                      disabled={testConnectionMutation.isPending}
                      data-testid="test-sendgrid-button"
                    >
                      {testConnectionMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <TestTube className="w-4 h-4 mr-2" />
                      )}
                      Test Connection
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="sendgridApiKey">SendGrid API Key</Label>
                    <Input
                      id="sendgridApiKey"
                      type="password"
                      {...form.register("sendgridApiKey")}
                      placeholder="Enter SendGrid API key"
                      data-testid="input-sendgrid-api-key"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sendgridFromEmail">
                      From Email Address
                    </Label>
                    <Input
                      id="sendgridFromEmail"
                      type="email"
                      {...form.register("sendgridFromEmail")}
                      placeholder="noreply@your-domain.com"
                      data-testid="input-sendgrid-from-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sendgridFromName">From Name</Label>
                    <Input
                      id="sendgridFromName"
                      {...form.register("sendgridFromName")}
                      placeholder="Elite Scholar"
                      data-testid="input-sendgrid-from-name"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>SMTP Fallback</CardTitle>
                      <CardDescription>
                        Backup email service via SMTP
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => testService("smtp")}
                      disabled={testConnectionMutation.isPending}
                      data-testid="test-smtp-button"
                    >
                      {testConnectionMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <TestTube className="w-4 h-4 mr-2" />
                      )}
                      Test Connection
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
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
                      id="smtpPassword"
                      type="password"
                      {...form.register("smtpPassword")}
                      placeholder="Enter SMTP password"
                      data-testid="input-smtp-password"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="smtpSecure"
                      {...form.register("smtpSecure")}
                      data-testid="switch-smtp-secure"
                    />
                    <Label htmlFor="smtpSecure">Use SSL/TLS</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Storage Settings */}
            <TabsContent value="storage" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Cloudinary Configuration</CardTitle>
                      <CardDescription>
                        Image storage and transformation service
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => testService("cloudinary")}
                      disabled={testConnectionMutation.isPending}
                      data-testid="test-cloudinary-button"
                    >
                      {testConnectionMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <TestTube className="w-4 h-4 mr-2" />
                      )}
                      Test Connection
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="cloudinaryCloudName">Cloud Name</Label>
                    <Input
                      id="cloudinaryCloudName"
                      {...form.register("cloudinaryCloudName")}
                      placeholder="your-cloud-name"
                      data-testid="input-cloudinary-cloud-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cloudinaryApiKey">API Key</Label>
                    <Input
                      id="cloudinaryApiKey"
                      {...form.register("cloudinaryApiKey")}
                      placeholder="123456789012345"
                      data-testid="input-cloudinary-api-key"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cloudinaryApiSecret">API Secret</Label>
                    <Input
                      id="cloudinaryApiSecret"
                      type="password"
                      {...form.register("cloudinaryApiSecret")}
                      placeholder="Enter API secret"
                      data-testid="input-cloudinary-api-secret"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cloudinaryUploadPreset">
                      Upload Preset (Optional)
                    </Label>
                    <Input
                      id="cloudinaryUploadPreset"
                      {...form.register("cloudinaryUploadPreset")}
                      placeholder="elite_scholar_preset"
                      data-testid="input-cloudinary-upload-preset"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Communication Settings */}
            <TabsContent value="communication" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Twilio Configuration</CardTitle>
                      <CardDescription>
                        SMS and WhatsApp messaging service
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => testService("twilio")}
                      disabled={testConnectionMutation.isPending}
                      data-testid="test-twilio-button"
                    >
                      {testConnectionMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <TestTube className="w-4 h-4 mr-2" />
                      )}
                      Test Connection
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="twilioAccountSid">Account SID</Label>
                    <Input
                      id="twilioAccountSid"
                      {...form.register("twilioAccountSid")}
                      placeholder="AC..."
                      data-testid="input-twilio-account-sid"
                    />
                  </div>
                  <div>
                    <Label htmlFor="twilioAuthToken">Auth Token</Label>
                    <Input
                      id="twilioAuthToken"
                      type="password"
                      {...form.register("twilioAuthToken")}
                      placeholder="Enter auth token"
                      data-testid="input-twilio-auth-token"
                    />
                  </div>
                  <div>
                    <Label htmlFor="twilioPhoneNumber">Phone Number</Label>
                    <Input
                      id="twilioPhoneNumber"
                      {...form.register("twilioPhoneNumber")}
                      placeholder="+1234567890"
                      data-testid="input-twilio-phone-number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="twilioWhatsappNumber">
                      WhatsApp Number
                    </Label>
                    <Input
                      id="twilioWhatsappNumber"
                      {...form.register("twilioWhatsappNumber")}
                      placeholder="whatsapp:+1234567890"
                      data-testid="input-twilio-whatsapp-number"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Invoice Settings */}
            <TabsContent value="invoice" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Customization</CardTitle>
                  <CardDescription>
                    Upload and configure invoice assets
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Invoice Logo</Label>
                    <div className="flex items-center space-x-4">
                      <Input
                        {...form.register("invoiceLogo")}
                        placeholder="Logo URL"
                        data-testid="input-invoice-logo"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "image/*";
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement)
                              .files?.[0];
                            if (file) handleAssetUpload(file, "logo");
                          };
                          input.click();
                        }}
                        disabled={uploadingAsset}
                        data-testid="upload-logo-button"
                      >
                        {uploadingAsset ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        Upload Logo
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Background Image</Label>
                    <div className="flex items-center space-x-4">
                      <Input
                        {...form.register("invoiceBackgroundImage")}
                        placeholder="Background image URL"
                        data-testid="input-invoice-background"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "image/*";
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement)
                              .files?.[0];
                            if (file) handleAssetUpload(file, "background");
                          };
                          input.click();
                        }}
                        disabled={uploadingAsset}
                        data-testid="upload-background-button"
                      >
                        {uploadingAsset ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        Upload Background
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="invoiceTemplate">
                      Custom Invoice Template
                    </Label>
                    <Textarea
                      id="invoiceTemplate"
                      {...form.register("invoiceTemplate")}
                      placeholder="Enter custom HTML template for invoices..."
                      rows={6}
                      data-testid="textarea-invoice-template"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              data-testid="reset-button"
            >
              Reset Changes
            </Button>
            <Button
              type="submit"
              disabled={updateConfigMutation.isPending}
              data-testid="save-button"
            >
              {updateConfigMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Save Configuration
            </Button>
          </div>
        </form>
      </div>
    </SuperAdminLayout>
  );
}
