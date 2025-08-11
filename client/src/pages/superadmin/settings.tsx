import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/auth";
import { apiRequest } from "@/lib/queryClient";
import SuperAdminLayout from "@/components/superadmin/layout";

// Profile form schema
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  return true;
}, {
  message: "Current password is required to set new password",
  path: ["currentPassword"],
});

// App settings form schema
const appSettingsSchema = z.object({
  appName: z.string().min(1, "App name is required"),
  appLogo: z.string().optional(),
  domain: z.string().url("Invalid domain URL").optional().or(z.literal("")),
  smtpHost: z.string().optional(),
  smtpPort: z.string().optional(),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  smtpSecure: z.boolean(),
  emailFromAddress: z.string().email("Invalid email address").optional().or(z.literal("")),
  emailFromName: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type AppSettingsFormData = z.infer<typeof appSettingsSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState("profile");

  // Fetch app settings
  const { data: appSettings, isLoading: appSettingsLoading } = useQuery({
    queryKey: ["/api/superadmin/settings"],
  });

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // App settings form
  const appSettingsForm = useForm<AppSettingsFormData>({
    resolver: zodResolver(appSettingsSchema),
    values: appSettings ? {
      appName: appSettings.appName || "Elite Scholar",
      appLogo: appSettings.appLogo || "",
      domain: appSettings.domain || "",
      smtpHost: appSettings.smtpHost || "",
      smtpPort: appSettings.smtpPort || "587",
      smtpUser: appSettings.smtpUser || "",
      smtpPassword: appSettings.smtpPassword || "",
      smtpSecure: appSettings.smtpSecure || false,
      emailFromAddress: appSettings.emailFromAddress || "",
      emailFromName: appSettings.emailFromName || "Elite Scholar",
    } : undefined,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await apiRequest("/api/auth/profile", "PUT", data);
      return response;
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      profileForm.reset({
        name: updatedUser.name,
        email: updatedUser.email,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Update app settings mutation
  const updateAppSettingsMutation = useMutation({
    mutationFn: async (data: AppSettingsFormData) => {
      const response = await apiRequest("/api/superadmin/settings", "PUT", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/settings"] });
      toast({
        title: "Settings updated",
        description: "App settings have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  // Test email connection mutation
  const testEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/superadmin/settings/test-email", "POST");
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Email test successful",
        description: "Email configuration is working correctly.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Email test failed",
        description: error.message || "Failed to send test email",
        variant: "destructive",
      });
    },
  });

  const handleProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const handleAppSettingsSubmit = (data: AppSettingsFormData) => {
    updateAppSettingsMutation.mutate(data);
  };

  const handleTestEmail = () => {
    testEmailMutation.mutate();
  };

  return (
    <SuperAdminLayout
      title="Settings"
      subtitle="Configure your profile and application settings"
    >
      <div className="max-w-4xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
            <TabsTrigger value="app" data-testid="tab-app">App Settings</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  Update your personal information and change your password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" data-testid="input-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="border-t pt-6">
                      <h4 className="text-sm font-medium text-slate-900 mb-4">Change Password</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={profileForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Password</FormLabel>
                              <FormControl>
                                <Input {...field} type="password" data-testid="input-current-password" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                <Input {...field} type="password" data-testid="input-new-password" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <Input {...field} type="password" data-testid="input-confirm-password" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={updateProfileMutation.isPending}
                        data-testid="button-save-profile"
                      >
                        {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* App Settings Tab */}
          <TabsContent value="app" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Settings</CardTitle>
                <CardDescription>
                  Configure global application settings and email configuration.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {appSettingsLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-10 bg-slate-200 rounded"></div>
                    ))}
                  </div>
                ) : (
                  <Form {...appSettingsForm}>
                    <form onSubmit={appSettingsForm.handleSubmit(handleAppSettingsSubmit)} className="space-y-6">
                      {/* App Configuration */}
                      <div>
                        <h4 className="text-sm font-medium text-slate-900 mb-4">App Configuration</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={appSettingsForm.control}
                            name="appName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>App Name</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-app-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={appSettingsForm.control}
                            name="domain"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Domain URL</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="https://yourschool.elitescholar.com" data-testid="input-domain" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Email Configuration */}
                      <div className="border-t pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-medium text-slate-900">Email Configuration (Nodemailer)</h4>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleTestEmail}
                            disabled={testEmailMutation.isPending}
                            data-testid="button-test-email"
                          >
                            {testEmailMutation.isPending ? "Testing..." : "Test Connection"}
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={appSettingsForm.control}
                            name="smtpHost"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SMTP Host</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="smtp.gmail.com" data-testid="input-smtp-host" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={appSettingsForm.control}
                            name="smtpPort"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SMTP Port</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="587" data-testid="input-smtp-port" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={appSettingsForm.control}
                            name="smtpUser"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SMTP Username</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="your-email@gmail.com" data-testid="input-smtp-user" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={appSettingsForm.control}
                            name="smtpPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SMTP Password</FormLabel>
                                <FormControl>
                                  <Input {...field} type="password" placeholder="App password or email password" data-testid="input-smtp-password" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={appSettingsForm.control}
                            name="emailFromAddress"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>From Email Address</FormLabel>
                                <FormControl>
                                  <Input {...field} type="email" placeholder="noreply@elitescholar.com" data-testid="input-from-email" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={appSettingsForm.control}
                            name="emailFromName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>From Name</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Elite Scholar" data-testid="input-from-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={updateAppSettingsMutation.isPending}
                          data-testid="button-save-settings"
                        >
                          {updateAppSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
}