import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface MenuLink {
  name: string;
  href: string;
  icon: string;
  enabled?: boolean;
}

interface Feature {
  id: string;
  key: string;
  name: string;
  description: string;
  menuLinks: MenuLink[];
  enabled: boolean;
}

interface FeatureMenuSidebarProps {
  className?: string;
}

export default function FeatureMenuSidebar({ className = "" }: FeatureMenuSidebarProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());

  // Fetch school features with menu links
  const { data: schoolFeatures = [], isLoading } = useQuery({
    queryKey: ["/api/schools/features"],
    enabled: !!user && ["school_admin", "teacher"].includes(user.role || ""),
  });

  // Fetch customized feature setup for menu links
  const { data: featureSetup = [] } = useQuery({
    queryKey: ["/api/schools/feature-setup"],
    enabled: !!user && ["school_admin", "teacher"].includes(user.role || ""),
  });

  const toggleFeature = (featureId: string) => {
    const newExpanded = new Set(expandedFeatures);
    if (newExpanded.has(featureId)) {
      newExpanded.delete(featureId);
    } else {
      newExpanded.add(featureId);
    }
    setExpandedFeatures(newExpanded);
  };

  const getMenuLinksForFeature = (feature: Feature) => {
    // Check if there's a customized setup for this feature
    const customSetup = featureSetup.find((setup: any) => setup.featureId === feature.id);
    if (customSetup && customSetup.menuLinks) {
      return customSetup.menuLinks.filter((link: MenuLink) => link.enabled !== false);
    }
    
    // Fall back to default menu links from feature
    return (feature.menuLinks || []).filter((link: MenuLink) => link.enabled !== false);
  };

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded mb-2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!schoolFeatures.length) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500 text-sm">No features available</p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {schoolFeatures
        .filter((feature: Feature) => feature.enabled)
        .map((feature: Feature) => {
          const menuLinks = getMenuLinksForFeature(feature);
          const isExpanded = expandedFeatures.has(feature.id);
          const hasMenuLinks = menuLinks.length > 0;
          
          return (
            <div key={feature.id} className="space-y-1">
              <Collapsible open={isExpanded} onOpenChange={() => toggleFeature(feature.id)}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`w-full justify-between px-3 py-2 h-auto text-left ${
                      location.includes(`/school/features/${feature.key}`)
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                    data-testid={`feature-${feature.key}`}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <i className="fas fa-puzzle-piece w-4"></i>
                      <span className="truncate">{feature.name}</span>
                      {menuLinks.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {menuLinks.length}
                        </Badge>
                      )}
                    </div>
                    {hasMenuLinks && (
                      isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )
                    )}
                  </Button>
                </CollapsibleTrigger>
                
                {hasMenuLinks && (
                  <CollapsibleContent className="ml-6 space-y-1">
                    {menuLinks.map((link: MenuLink, index: number) => (
                      <Link
                        key={index}
                        href={link.href}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                          location === link.href
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                        data-testid={`menu-link-${feature.key}-${index}`}
                      >
                        <i className={`${link.icon} w-4 text-xs`}></i>
                        <span className="truncate">{link.name}</span>
                      </Link>
                    ))}
                  </CollapsibleContent>
                )}
              </Collapsible>
            </div>
          );
        })}
    </div>
  );
}