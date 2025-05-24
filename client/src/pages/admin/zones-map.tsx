import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/ui/admin-layout";
import { ZonesOverviewMap } from "@/components/admin/zones-overview-map";
import { ServiceZone } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function ZonesMapPage() {
  const { toast } = useToast();
  
  // Fetch service zones
  const { data: zones, isLoading } = useQuery<ServiceZone[]>({
    queryKey: ["/api/zones"],
  });
  
  // Navigate to edit zone
  const handleEditZone = (zone: ServiceZone) => {
    toast({
      title: `Editing ${zone.name}`,
      description: "Please use the zones list to edit this service area.",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Service Areas Map</h1>
            <p className="text-gray-500">View all service zones on a single map</p>
          </div>
          <Link href="/admin/zones">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Zones
            </Button>
          </Link>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-[500px]">
            <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <ZonesOverviewMap 
            zones={zones || []} 
            onEditZone={handleEditZone}
          />
        )}
      </div>
    </AdminLayout>
  );
}