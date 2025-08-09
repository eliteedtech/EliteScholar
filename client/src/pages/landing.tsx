import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setAuth } = useAuthStore();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    shortName: "",
  });

  const loginMutation = useMutation({
    mutationFn: api.auth.login,
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      toast({
        title: "Login successful",
        description: "Welcome to Elite Scholar!",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start space-x-3 mb-8">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <i className="fas fa-graduation-cap text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Elite Scholar</h1>
              <p className="text-slate-600">School Management System</p>
            </div>
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
            Comprehensive School Management
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            Streamline your educational institution with our powerful platform featuring 
            invoice management, payment tracking, and automated workflows.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <i className="fas fa-file-invoice text-blue-600"></i>
              </div>
              <h3 className="font-semibold text-slate-900">Invoice Management</h3>
              <p className="text-sm text-slate-600">Automated billing and payment tracking</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <i className="fas fa-school text-green-600"></i>
              </div>
              <h3 className="font-semibold text-slate-900">Multi-tenant</h3>
              <p className="text-sm text-slate-600">Support for multiple schools and branches</p>
            </div>
          </div>

          <div className="text-center lg:text-left">
            <p className="text-sm text-slate-400">
              Powered by<br />
              <span className="font-semibold text-slate-600">Elite Edu Tech</span>
            </p>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription>
                Sign in to your Elite Scholar account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@school.edu"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    data-testid="input-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    data-testid="input-password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shortName">School Code (Optional)</Label>
                  <Input
                    id="shortName"
                    name="shortName"
                    type="text"
                    placeholder="school-code"
                    value={formData.shortName}
                    onChange={handleInputChange}
                    data-testid="input-shortname"
                  />
                  <p className="text-xs text-slate-500">
                    Leave empty for Super Admin login
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-sign-in-alt mr-2"></i>
                      Sign In
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-600">
                  Need help? Contact support at{" "}
                  <a href="mailto:support@elitescholar.com" className="text-primary hover:underline">
                    support@elitescholar.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
