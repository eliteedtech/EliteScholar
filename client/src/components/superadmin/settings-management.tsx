import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Save, Upload, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

export default function SettingsManagement() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch current settings
  const { data: settings } = useQuery({
    queryKey: ["/api/superadmin/settings"],
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settingsData: any) => {
      const response = await apiRequest("PUT", "/api/superadmin/settings", settingsData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/settings"] });
      toast({
        title: "Settings updated successfully",
        description: "Changes have been saved to the system.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating settings",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const settingsData = {
      appName: formData.get("appName"),
      domain: formData.get("domain"),
      smtpHost: formData.get("smtpHost"),
      smtpPort: formData.get("smtpPort"),
      smtpUser: formData.get("smtpUser"),
      smtpPassword: formData.get("smtpPassword"),
      smtpSecure: formData.get("smtpSecure") === "true",
      emailFromAddress: formData.get("emailFromAddress"),
      emailFromName: formData.get("emailFromName"),
    };

    updateSettingsMutation.mutate(settingsData);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);

      const response = await fetch("/api/superadmin/upload-logo", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/superadmin/settings"] });
        toast({
          title: "Logo uploaded successfully",
          description: "The app logo has been updated.",
        });
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      toast({
        title: "Error uploading logo",
        description: "Failed to upload the logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">System Settings</h2>
        <p className="text-slate-600 dark:text-slate-400">Configure global application settings</p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Application Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Application Settings
            </CardTitle>
            <CardDescription>
              Basic application configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="appName">Application Name</Label>
                <Input
                  id="appName"
                  name="appName"
                  defaultValue={settings?.appName || "Elite Scholar"}
                  placeholder="Elite Scholar"
                  data-testid="input-app-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  name="domain"
                  defaultValue={settings?.domain || ""}
                  placeholder="elitescholar.com"
                  data-testid="input-domain"
                />
                <p className="text-xs text-slate-500">
                  Used to generate school subdomains (e.g., school.domain.com)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Application Logo</Label>
              <div className="flex items-center gap-4">
                {settings?.appLogo && (
                  <img
                    src={settings.appLogo}
                    alt="App Logo"
                    className="h-12 w-12 object-contain border rounded"
                  />
                )}
                <div className="flex-1">
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={isLoading}
                    data-testid="input-logo"
                  />
                  {isLoading && (
                    <p className="text-xs text-slate-500 mt-1">Uploading...</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Email Configuration</CardTitle>
            <CardDescription>
              SMTP settings for sending emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtpHost">SMTP Host</Label>
                <Input
                  id="smtpHost"
                  name="smtpHost"
                  defaultValue={settings?.smtpHost || ""}
                  placeholder="smtp.gmail.com"
                  data-testid="input-smtp-host"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPort">SMTP Port</Label>
                <Input
                  id="smtpPort"
                  name="smtpPort"
                  defaultValue={settings?.smtpPort || "587"}
                  placeholder="587"
                  data-testid="input-smtp-port"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtpUser">SMTP Username</Label>
                <Input
                  id="smtpUser"
                  name="smtpUser"
                  defaultValue={settings?.smtpUser || ""}
                  placeholder="your-email@gmail.com"
                  data-testid="input-smtp-user"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPassword">SMTP Password</Label>
                <Input
                  id="smtpPassword"
                  name="smtpPassword"
                  type="password"
                  defaultValue={settings?.smtpPassword || ""}
                  placeholder="Your SMTP password"
                  data-testid="input-smtp-password"
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emailFromAddress">From Email Address</Label>
                <Input
                  id="emailFromAddress"
                  name="emailFromAddress"
                  type="email"
                  defaultValue={settings?.emailFromAddress || ""}
                  placeholder="noreply@elitescholar.com"
                  data-testid="input-from-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailFromName">From Name</Label>
                <Input
                  id="emailFromName"
                  name="emailFromName"
                  defaultValue={settings?.emailFromName || "Elite Scholar"}
                  placeholder="Elite Scholar"
                  data-testid="input-from-name"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="smtpSecure"
                name="smtpSecure"
                value="true"
                defaultChecked={settings?.smtpSecure || false}
                className="rounded border-slate-300"
              />
              <Label htmlFor="smtpSecure" className="text-sm">
                Use secure connection (SSL/TLS)
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Database Information */}
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>
              Current system status and information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Database Status</Label>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-slate-600">Connected</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Application Version</Label>
                <span className="text-sm text-slate-600">v1.0.0</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={updateSettingsMutation.isPending}
            data-testid="button-save-settings"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}