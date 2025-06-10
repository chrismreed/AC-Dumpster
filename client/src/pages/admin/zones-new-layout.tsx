import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/ui/admin-layout";
import { Button } from "@/components/ui/button";
import { GeofenceEditor } from "@/components/admin/geofence-editor";
import { ZonesOverviewMap } from "@/components/admin/zones-overview-map";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PriceInput } from "@/components/ui/price-input";
import { Switch } from "@/components/ui/switch";
import { ServiceZone, insertServiceZoneSchema } from "@shared/schema";
import { Loader2, Plus, Edit, Trash, MapPin } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import * as z from "zod";
import { cn } from "@/lib/utils";

// Extended schema for the form
const extendedZoneSchema = insertServiceZoneSchema.extend({
  deliveryFee: z.coerce.number().min(0, { message: "Delivery fee must be a positive number" }),
  sameDayDeliveryFee: z.coerce.number().min(0, { message: "Same-day delivery fee must be a positive number" }),
  useGeofencing: z.boolean().optional(),
  sameDayDeliveryEnabled: z.boolean().optional(),
}).refine((data) => {
  // Ensure either zip codes or geofencing is used, but not both
  const hasZipCodes = data.zipCodes && data.zipCodes.trim().length > 0;
  const hasGeofencing = data.useGeofencing;
  
  if (!hasZipCodes && !hasGeofencing) {
    return false; // Must have either zip codes or geofencing
  }
  if (hasZipCodes && hasGeofencing) {
    return false; // Cannot have both
  }
  return true;
}, {
  message: "Please choose either ZIP codes OR boundary-based service area, not both",
  path: ["zipCodes"], // Show error on zip codes field
});

export default function ZonesNewLayoutPage() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<ServiceZone | null>(null);
  const [mapEditMode, setMapEditMode] = useState(false);

  const { data: zones, isLoading } = useQuery<ServiceZone[]>({
    queryKey: ["/api/zones"],
  });

  // Set first zone as selected when data loads
  useEffect(() => {
    if (zones && zones.length > 0 && !selectedZone) {
      setSelectedZone(zones[0]);
    }
  }, [zones, selectedZone]);

  const addForm = useForm<z.infer<typeof extendedZoneSchema>>({
    resolver: zodResolver(extendedZoneSchema),
    defaultValues: {
      name: "",
      zipCodes: "",
      deliveryFee: 0,
      useGeofencing: false,
      sameDayDeliveryEnabled: false,
      sameDayDeliveryFee: 0,
      sameDayCutoffTime: "",
    },
  });

  const editForm = useForm<z.infer<typeof extendedZoneSchema>>({
    resolver: zodResolver(extendedZoneSchema),
    defaultValues: {
      name: "",
      zipCodes: "",
      deliveryFee: 0,
      useGeofencing: false,
      sameDayDeliveryEnabled: false,
      sameDayDeliveryFee: 0,
      sameDayCutoffTime: "",
    },
  });

  const createZoneMutation = useMutation({
    mutationFn: async (data: z.infer<typeof extendedZoneSchema>) => {
      const response = await apiRequest("POST", "/api/zones", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/zones"] });
      setIsAddDialogOpen(false);
      addForm.reset();
      setSelectedZone(data);
      toast({
        title: "Zone Created",
        description: "The service zone has been successfully created.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create zone: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateZoneMutation = useMutation({
    mutationFn: async (data: ServiceZone) => {
      const { id, ...rest } = data;
      const response = await apiRequest("PUT", `/api/zones/${id}`, rest);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/zones"] });
      setIsEditDialogOpen(false);
      editForm.reset();
      setSelectedZone(data);
      setMapEditMode(false);
      toast({
        title: "Zone Updated",
        description: "The service zone has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update zone: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteZoneMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/zones/${id}`);
      // DELETE requests typically return 204 with no content, so don't try to parse JSON
      if (response.ok) {
        return { success: true };
      } else {
        throw new Error('Failed to delete zone');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/zones"] });
      if (selectedZone && zones && zones.length > 1) {
        const index = zones.findIndex(zone => zone.id === selectedZone.id);
        const newIndex = index === 0 ? 1 : index - 1;
        setSelectedZone(zones[newIndex >= 0 ? newIndex : 0]);
      } else {
        setSelectedZone(null);
      }
      toast({
        title: "Zone Deleted",
        description: "The service zone has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete zone: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onAddSubmit = (data: z.infer<typeof extendedZoneSchema>) => {
    // Filter out useGeofencing field since it's not part of the database schema
    const { useGeofencing, ...createData } = data;
    
    // If using geofencing, clear zip codes
    if (useGeofencing) {
      createData.zipCodes = "";
    }
    
    createZoneMutation.mutate(createData);
  };

  const onEditSubmit = (data: z.infer<typeof extendedZoneSchema>) => {
    if (selectedZone) {
      // Filter out useGeofencing field
      const { useGeofencing, ...updateData } = data;
      
      // If using geofencing, clear zip codes
      if (useGeofencing) {
        updateData.zipCodes = "";
      }
      
      // Create update object preserving existing data
      const fullUpdateData = {
        ...selectedZone,
        name: updateData.name,
        zipCodes: updateData.zipCodes || "",
        deliveryFee: updateData.deliveryFee,
        useGeofencing: useGeofencing ?? false,
      };
      
      updateZoneMutation.mutate(fullUpdateData);
    }
  };

  const handleEdit = (zone: ServiceZone) => {
    setSelectedZone(zone);
    editForm.reset({
      name: zone.name,
      zipCodes: zone.zipCodes || "",
      deliveryFee: zone.deliveryFee || 0,
      useGeofencing: zone.useGeofencing || false,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteZoneMutation.mutate(id);
  };

  const handleSaveGeofence = async (polygonPath: any) => {
    if (selectedZone) {
      try {
        // Make direct API call with proper credentials
        const response = await fetch(`/api/zones/${selectedZone.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            // Include credentials to ensure the session cookie is sent
            'credentials': 'include'
          },
          body: JSON.stringify({
            ...selectedZone,
            polygonPath: polygonPath.polygonPath || polygonPath,
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to save boundary');
        }
        
        // Success - refresh the zones data and update selected zone
        await queryClient.invalidateQueries({ queryKey: ["/api/zones"] });
        
        // Refetch zones to get updated data with new boundary
        const updatedZones = await queryClient.fetchQuery({ queryKey: ["/api/zones"] });
        if (updatedZones && Array.isArray(updatedZones)) {
          const updatedZone = updatedZones.find((z: ServiceZone) => z.id === selectedZone.id);
          if (updatedZone) {
            setSelectedZone(updatedZone);
          }
        }
        
        setMapEditMode(false);
        
        toast({
          title: "Boundary Saved",
          description: "The service zone boundary has been updated successfully.",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: `Failed to save boundary: ${error.message}`,
          variant: "destructive",
        });
      }
    }
  };

  const handleSelectZone = (zone: ServiceZone) => {
    setSelectedZone(zone);
    setMapEditMode(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Service Zones</h1>
            <p className="text-gray-500">Manage your service areas and location-based pricing</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Zone
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Service Zone</DialogTitle>
                <DialogDescription>
                  Define a new service area with associated ZIP codes and delivery fee.
                </DialogDescription>
              </DialogHeader>
              <Form {...addForm}>
                <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
                  <FormField
                    control={addForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zone Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Zone A - City Center" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={addForm.control}
                    name="useGeofencing"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Use Custom Boundary
                          </FormLabel>
                          <FormDescription>
                            Enable to draw a custom service area boundary instead of using ZIP codes
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              if (checked) {
                                addForm.setValue("zipCodes", "");
                              }
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {!addForm.watch("useGeofencing") && (
                    <FormField
                      control={addForm.control}
                      name="zipCodes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Codes</FormLabel>
                          <FormControl>
                            <Input placeholder="12345, 23456, 34567" {...field} />
                          </FormControl>
                          <FormDescription>
                            Comma-separated list of ZIP codes in this zone
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={addForm.control}
                    name="deliveryFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Fee</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Standard delivery fee for this zone
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="submit" disabled={createZoneMutation.isPending}>
                      {createZoneMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Add Zone
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-[300px_1fr] gap-4">
            {/* Zone List */}
            <Card className="h-[calc(100vh-12rem)] overflow-hidden flex flex-col">
              <CardHeader className="py-3">
                <CardTitle className="text-lg">Zones</CardTitle>
                <CardDescription>Select a zone to edit</CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-y-auto flex-grow">
                <div className="divide-y">
                  {zones && zones.length > 0 ? (
                    zones.map((zone) => (
                      <div
                        key={zone.id}
                        className={cn(
                          "w-full p-3 hover:bg-muted flex items-center space-x-2 transition-colors border-b last:border-b-0",
                          selectedZone?.id === zone.id && "bg-muted"
                        )}
                      >
                        <button
                          className="flex-1 text-left flex items-center space-x-2"
                          onClick={() => handleSelectZone(zone)}
                        >
                          <div className="flex-1">
                            <div className="font-medium">{zone.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {zone.zipCodes && zone.zipCodes.trim().length > 0 ? (
                                // Has ZIP codes - this zone uses ZIP codes
                                `ZIP codes: ${zone.zipCodes}`
                              ) : zone.polygonPath && zone.polygonPath.trim().length > 0 ? (
                                // Has custom boundary and no ZIP codes - this zone uses custom boundary
                                "Custom boundary defined"
                              ) : zone.polygonPath ? (
                                // Has empty polygonPath but no ZIP codes - boundary undefined
                                <span className="text-red-500">Boundary undefined</span>
                              ) : (
                                // No ZIP codes and no polygon path
                                "No service area defined"
                              )}
                            </div>
                            <div className="text-xs mt-1 text-primary">
                              ${(zone.deliveryFee / 100).toFixed(2)}
                            </div>
                          </div>
                          <div className="flex items-center">
                            {zone.zipCodes && zone.zipCodes.trim().length > 0 ? (
                              <MapPin className="h-4 w-4 text-blue-500" />
                            ) : zone.polygonPath && zone.polygonPath.trim().length > 0 ? (
                              <MapPin className="h-4 w-4 text-green-500" />
                            ) : (
                              <MapPin className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </button>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(zone);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => e.stopPropagation()}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the service zone "{zone.name}". 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(zone.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      No service zones found. Add your first zone to get started.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Zone Details & Map */}
            <div className="space-y-4">
              {selectedZone ? (
                <>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>{selectedZone.name}</CardTitle>
                      <CardDescription>
                        {selectedZone.polygonPath ? (
                          "Uses custom boundary area"
                        ) : selectedZone.zipCodes ? (
                          `Covers ZIP codes: ${selectedZone.zipCodes}`
                        ) : (
                          "No service area defined"
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-muted-foreground">Delivery Fee</div>
                          <div>${selectedZone.deliveryFee.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="font-medium text-muted-foreground">Boundary Status</div>
                          <div>
                            {selectedZone.polygonPath ? (
                              <span className="text-green-600 flex items-center">
                                <MapPin className="h-4 w-4 mr-1" /> Defined
                              </span>
                            ) : (
                              <span className="text-amber-600 flex items-center">
                                <MapPin className="h-4 w-4 mr-1" /> Not defined
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Service Area Boundary</CardTitle>
                        <CardDescription>
                          Define the exact boundary for this service zone
                        </CardDescription>
                      </div>
                      <Button
                        variant={mapEditMode ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setMapEditMode(!mapEditMode)}
                      >
                        {mapEditMode ? "Cancel Editing" : "Edit Boundary"}
                      </Button>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {mapEditMode ? (
                        <GeofenceEditor
                          zone={selectedZone}
                          onSave={handleSaveGeofence}
                          onCancel={() => setMapEditMode(false)}
                          showAllZones={true}
                          allZones={zones || []}
                        />
                      ) : (
                        <div className="relative min-h-[400px] bg-muted/30 rounded-lg flex items-center justify-center">
                          <div className="absolute inset-0">
                            <GeofenceEditor
                              zone={selectedZone}
                              onSave={handleSaveGeofence}
                              onCancel={() => {}}
                              readOnly={true}
                              showAllZones={true}
                              allZones={zones || []}
                            />
                          </div>
                          {!selectedZone.polygonPath && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-[2px] rounded-lg">
                              <div className="text-center p-8 bg-white/90 rounded-lg shadow-lg">
                                <MapPin className="h-10 w-10 text-muted mx-auto mb-3" />
                                <h3 className="text-lg font-medium">No Boundary Defined</h3>
                                <p className="text-muted-foreground text-sm max-w-md mx-auto mt-1">
                                  Draw a service area boundary for this zone to help
                                  calculate accurate delivery fees.
                                </p>
                                <Button 
                                  className="mt-4" 
                                  onClick={() => setMapEditMode(true)}
                                >
                                  Draw Boundary
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="h-[400px] flex items-center justify-center">
                  <CardContent className="text-center">
                    <MapPin className="h-10 w-10 text-muted mx-auto mb-3" />
                    <h3 className="text-lg font-medium">No Zone Selected</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Select a zone from the list or add a new one to get started
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Service Zone</DialogTitle>
              <DialogDescription>
                Update this service area's information
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zone Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="useGeofencing"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Use Custom Boundary
                        </FormLabel>
                        <FormDescription>
                          Enable to draw a custom service area boundary instead of using ZIP codes
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (checked) {
                              editForm.setValue("zipCodes", "");
                            }
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {!editForm.watch("useGeofencing") && (
                  <FormField
                    control={editForm.control}
                    name="zipCodes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Codes</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          Comma-separated list of ZIP codes in this zone
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={editForm.control}
                  name="deliveryFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Fee</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Standard delivery fee for this zone
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit" disabled={updateZoneMutation.isPending}>
                    {updateZoneMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}