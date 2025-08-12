import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { X, Settings, Link } from "lucide-react";

interface Feature {
  id: string;
  key: string;
  name: string;
  description: string;
  menuLinks?: any[];
}

interface School {
  id: string;
  name: string;
  shortName: string;
}

interface SchoolFeatureSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  school: School | null;
  onFeatureSelect: (feature: Feature) => void;
}

export default function SchoolFeatureSelectorModal({ 
  isOpen, 
  onClose, 
  school,
  onFeatureSelect 
}: SchoolFeatureSelectorModalProps) {
  // Fetch school features
  const { data: schoolFeatures, isLoading } = useQuery({
    queryKey: ["/api/schools/features"],
    enabled: !!(school?.id && isOpen),
  });

  const handleFeatureSelect = (feature: Feature) => {
    onFeatureSelect(feature);
    onClose();
  };

  if (!school) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Select Feature - {school.name}
          </DialogTitle>
          <DialogDescription>
            Choose a feature to manage its menu links for {school.name}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{school.shortName}</Badge>
            <span className="text-sm font-medium">{school.name}</span>
          </div>
        </div>

        <ScrollArea className="flex-1 max-h-[50vh]">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {schoolFeatures && schoolFeatures.length > 0 ? (
                schoolFeatures.map((feature: Feature) => (
                  <Card 
                    key={feature.id} 
                    className="cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                    onClick={() => handleFeatureSelect(feature)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Settings className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{feature.name}</div>
                            <div className="text-xs text-gray-500">{feature.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {feature.menuLinks?.length || 0} Menu Links
                          </Badge>
                          <Link className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Features Available
                  </h3>
                  <p className="text-gray-600">
                    This school doesn't have any assigned features yet. 
                    Please assign features first in the Feature Assignment page.
                  </p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="border-t pt-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}