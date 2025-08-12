import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Users, Settings, Check, X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SuperAdminLayout from "@/components/superadmin/layout";

interface School {
  id: string;
  name: string;
  shortName: string;
  type: string;
  status: string;
}

interface Feature {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
  isCore: boolean;
}

interface SchoolFeature {
  id: string;
  schoolId: string;
  featureId: string;
  enabled: boolean;
  feature: Feature;
}

export default function FeatureAssignment() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch schools
  const { data: schoolsData, isLoading: schoolsLoading } = useQuery({
    queryKey: ["/api/superadmin/schools"],
  });

  const schools = schoolsData?.schools || [];

  // Fetch all features
  const { data: allFeatures = [], isLoading: featuresLoading } = useQuery({
    queryKey: ["/api/features"],
  });

  // Fetch school features for selected school
  const {
    data: schoolFeatures = [],
    isLoading: schoolFeaturesLoading,
    refetch: refetchSchoolFeatures,
  } = useQuery({
    queryKey: ["/api/superadmin/schools", selectedSchool, "features"],
    enabled: !!selectedSchool,
  });

  // Mutation to toggle school feature
  const toggleFeatureMutation = useMutation({
    mutationFn: async ({
      schoolId,
      featureId,
      enabled,
    }: {
      schoolId: string;
      featureId: string;
      enabled: boolean;
    }) => {
      return apiRequest(`/api/superadmin/schools/${schoolId}/features`, {
        method: "POST",
        body: { featureId, enabled },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/superadmin/schools", selectedSchool, "features"],
      });
      toast({
        title: "Success",
        description: "Feature assignment updated successfully",
      });
    },
    onError: (error) => {
      console.error("Toggle feature error:", error);
      toast({
        title: "Error",
        description: "Failed to update feature assignment",
        variant: "destructive",
      });
    },
  });

  // Mutation to assign multiple features to a school
  const assignFeaturesMutation = useMutation({
    mutationFn: async ({
      schoolId,
      featureIds,
    }: {
      schoolId: string;
      featureIds: string[];
    }) => {
      return apiRequest(`/api/superadmin/schools/${schoolId}/features/bulk`, {
        method: "POST",
        body: { featureIds },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/superadmin/schools", selectedSchool, "features"],
      });
      toast({
        title: "Success",
        description: "Features assigned successfully",
      });
    },
    onError: (error) => {
      console.error("Assign features error:", error);
      toast({
        title: "Error",
        description: "Failed to assign features",
        variant: "destructive",
      });
    },
  });

  const filteredSchools = schools.filter(
    (school: School) =>
      school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.shortName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleToggleFeature = (featureId: string, enabled: boolean) => {
    if (!selectedSchool) return;
    toggleFeatureMutation.mutate({
      schoolId: selectedSchool,
      featureId,
      enabled,
    });
  };

  // Bulk assign features mutation
  const bulkAssignFeaturesMutation = useMutation({
    mutationFn: async ({
      schoolIds,
      featureIds,
    }: {
      schoolIds: string[];
      featureIds: string[];
    }) => {
      return apiRequest(`/api/superadmin/schools/features/bulk-assign`, {
        method: "POST",
        body: { schoolIds, featureIds },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/schools"] });
      setSelectedSchools([]);
      setSelectedFeatures([]);
      toast({
        title: "Success",
        description: "Features assigned to schools successfully",
      });
    },
    onError: (error) => {
      console.error("Bulk assign features error:", error);
      toast({
        title: "Error",
        description: "Failed to assign features to schools",
        variant: "destructive",
      });
    },
  });

  const assignAllCoreFeatures = () => {
    if (!selectedSchool) return;
    const coreFeatureIds = allFeatures
      .filter((f: Feature) => f.isCore)
      .map((f: Feature) => f.id);
    assignFeaturesMutation.mutate({
      schoolId: selectedSchool,
      featureIds: coreFeatureIds,
    });
  };

  const handleBulkAssign = () => {
    if (selectedSchools.length === 0 || selectedFeatures.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select both schools and features to assign",
        variant: "destructive",
      });
      return;
    }

    bulkAssignFeaturesMutation.mutate({
      schoolIds: selectedSchools,
      featureIds: selectedFeatures,
    });
  };

  const toggleSchoolSelection = (schoolId: string) => {
    setSelectedSchools((prev) =>
      prev.includes(schoolId)
        ? prev.filter((id) => id !== schoolId)
        : [...prev, schoolId],
    );
  };

  const toggleFeatureSelection = (featureId: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(featureId)
        ? prev.filter((id) => id !== featureId)
        : [...prev, featureId],
    );
  };

  const getFeatureStatus = (featureId: string) => {
    const schoolFeature = schoolFeatures.find(
      (sf: SchoolFeature) => sf.featureId === featureId,
    );
    return schoolFeature?.enabled || false;
  };

  if (schoolsLoading || featuresLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <SuperAdminLayout 
      title="Feature Assignment"
      subtitle="Assign features to schools and manage access permissions"
      > 
      <div
        className="container mx-auto p-6 space-y-6"
        data-testid="feature-assignment-page"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-3xl font-bold text-gray-900"
              data-testid="page-title"
            >
              Feature Assignment
            </h1>
            <p className="text-gray-600 mt-2" data-testid="page-description">
              Assign features to schools and manage their access permissions
            </p>
          </div>
        </div>

        <Tabs defaultValue="individual" className="space-y-6">
          <TabsList>
            <TabsTrigger value="individual" data-testid="tab-individual">
              Individual Assignment
            </TabsTrigger>
            <TabsTrigger value="bulk" data-testid="tab-bulk">
              Bulk Assignment
            </TabsTrigger>
          </TabsList>

          <TabsContent value="individual" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* School Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Select School
                  </CardTitle>
                  <CardDescription>
                    Choose a school to manage its feature assignments
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search schools..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-schools"
                    />
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredSchools.map((school: School) => (
                      <div
                        key={school.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedSchool === school.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedSchool(school.id)}
                        data-testid={`school-item-${school.id}`}
                      >
                        <h3 className="font-medium text-gray-900">
                          {school.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {school.shortName}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {school.type}
                          </Badge>
                          <Badge
                            variant={
                              school.status === "ACTIVE"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {school.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Feature Assignment */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Feature Assignment
                    {selectedSchool && (
                      <Button
                        onClick={assignAllCoreFeatures}
                        size="sm"
                        variant="outline"
                        className="ml-auto"
                        disabled={assignFeaturesMutation.isPending}
                        data-testid="button-assign-core-features"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Assign Core Features
                      </Button>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {selectedSchool
                      ? "Toggle features on/off for the selected school"
                      : "Select a school to manage its features"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedSchool ? (
                    <div className="space-y-6">
                      {schoolFeaturesLoading ? (
                        <div className="animate-pulse space-y-3">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className="h-16 bg-gray-200 rounded"
                            ></div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {allFeatures.map((feature: Feature) => {
                            const isEnabled = getFeatureStatus(feature.id);
                            return (
                              <div
                                key={feature.id}
                                className="flex items-center justify-between p-4 border rounded-lg"
                                data-testid={`feature-item-${feature.key}`}
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-medium text-gray-900">
                                      {feature.name}
                                    </h3>
                                    {feature.isCore && (
                                      <Badge
                                        variant="default"
                                        className="text-xs"
                                      >
                                        Core
                                      </Badge>
                                    )}
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {feature.category}
                                    </Badge>
                                  </div>
                                  {feature.description && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      {feature.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    {isEnabled ? (
                                      <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <X className="h-4 w-4 text-red-500" />
                                    )}
                                    <span className="text-sm text-gray-600">
                                      {isEnabled ? "Enabled" : "Disabled"}
                                    </span>
                                  </div>
                                  <Switch
                                    checked={isEnabled}
                                    onCheckedChange={(checked) =>
                                      handleToggleFeature(feature.id, checked)
                                    }
                                    disabled={toggleFeatureMutation.isPending}
                                    data-testid={`switch-feature-${feature.key}`}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No School Selected
                      </h3>
                      <p className="text-gray-600">
                        Please select a school from the list to manage its
                        feature assignments.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Feature Assignment</CardTitle>
                <CardDescription>
                  Assign features to multiple schools at once
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Schools Selection */}
                  <div>
                    <h3 className="font-medium mb-3">Select Schools</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-2">
                      {schools.map((school: School) => (
                        <div
                          key={school.id}
                          className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
                        >
                          <Checkbox
                            checked={selectedSchools.includes(school.id)}
                            onCheckedChange={() =>
                              toggleSchoolSelection(school.id)
                            }
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {school.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {school.shortName}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {school.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      {selectedSchools.length} school(s) selected
                    </div>
                  </div>

                  {/* Features Selection */}
                  <div>
                    <h3 className="font-medium mb-3">Select Features</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-2">
                      {allFeatures.map((feature: Feature) => (
                        <div
                          key={feature.id}
                          className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
                        >
                          <Checkbox
                            checked={selectedFeatures.includes(feature.id)}
                            onCheckedChange={() =>
                              toggleFeatureSelection(feature.id)
                            }
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {feature.name}
                              </span>
                              {feature.isCore && (
                                <Badge variant="default" className="text-xs">
                                  Core
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {feature.description}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      {selectedFeatures.length} feature(s) selected
                    </div>
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <Button
                    onClick={handleBulkAssign}
                    disabled={
                      bulkAssignFeaturesMutation.isPending ||
                      selectedSchools.length === 0 ||
                      selectedFeatures.length === 0
                    }
                    className="w-full max-w-md"
                  >
                    {bulkAssignFeaturesMutation.isPending
                      ? "Assigning..."
                      : `Assign ${selectedFeatures.length} Feature(s) to ${selectedSchools.length} School(s)`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
}
