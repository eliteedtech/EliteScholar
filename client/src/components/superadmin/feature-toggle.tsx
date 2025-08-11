import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { SchoolWithDetails } from "@/lib/types";

interface FeatureToggleProps {
  school: SchoolWithDetails;
  onClose: () => void;
  onToggle: (featureKey: string, enabled: boolean) => void;
}

export default function FeatureToggle({ school, onClose, onToggle }: FeatureToggleProps) {
  const [pendingToggles, setPendingToggles] = useState<Record<string, boolean>>({});

  const { data: allFeatures, isLoading: featuresLoading } = useQuery({
    queryKey: ["/api/superadmin/features"],
    queryFn: () => api.superadmin.getFeatures(),
  });

  const { data: schoolFeatures, isLoading: schoolFeaturesLoading } = useQuery({
    queryKey: ["/api/superadmin/schools", school.id, "features"],
    queryFn: () => api.superadmin.getSchoolFeatures(school.id),
  });

  const schoolFeatureMap = (schoolFeatures || []).reduce((acc, sf) => {
    acc[sf.feature.key] = sf.enabled;
    return acc;
  }, {} as Record<string, boolean>);

  const isLoading = featuresLoading || schoolFeaturesLoading;

  const handleToggle = (featureKey: string, enabled: boolean) => {
    setPendingToggles({ ...pendingToggles, [featureKey]: enabled });
    onToggle(featureKey, enabled);
    
    // Remove from pending after a delay (assuming the mutation completes)
    setTimeout(() => {
      setPendingToggles(prev => {
        const updated = { ...prev };
        delete updated[featureKey];
        return updated;
      });
    }, 1000);
  };

  const isFeatureEnabled = (featureKey: string) => {
    if (featureKey in pendingToggles) {
      return pendingToggles[featureKey];
    }
    return schoolFeatureMap[featureKey] || false;
  };

  const isFeaturePending = (featureKey: string) => {
    return featureKey in pendingToggles;
  };

  if (isLoading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-200 rounded"></div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" data-testid="feature-toggle-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900">Manage School Features</DialogTitle>
          <DialogDescription>
            Enable or disable features for {school.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allFeatures?.map((feature) => {
              const enabled = isFeatureEnabled(feature.key);
              const pending = isFeaturePending(feature.key);
              
              return (
                <div 
                  key={feature.id} 
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg"
                  data-testid={`feature-toggle-${feature.key}`}
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900">{feature.name}</h4>
                    <p className="text-sm text-slate-500">{feature.description || feature.key}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {pending && (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    )}
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) => handleToggle(feature.key, checked)}
                      disabled={pending}
                      data-testid={`switch-${feature.key}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end space-x-3">
          <Button 
            onClick={onClose}
            variant="outline"
            data-testid="button-close"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
