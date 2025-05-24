import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/ui/admin-layout";
import { Button } from "@/components/ui/button";
import { GeofenceEditor } from "@/components/admin/google-map-drawer";
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
import { ServiceZone, InsertServiceZone, insertServiceZoneSchema } from "@shared/schema";
import { Loader2, Plus, Edit, Trash, MapPin, Globe, Map, Navigation } from "lucide-react";
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
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { z } from "zod";

export default function ZonesPage() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isGeofenceEditorOpen, setIsGeofenceEditorOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<ServiceZone | null>(null);

  // Fetch service zones
  const { data: zones, isLoading } = useQuery<ServiceZone[]>({
    queryKey: ["/api/zones"],
  });

  // Extended schema for form with geofencing fields
  const extendedZoneSchema = insertServiceZoneSchema.extend({
    useGeofencing: z.boolean().default(false),
    centerLat: z.number().nullable().optional(),
    centerLng: z.number().nullable().optional(),
    radiusMeters: z.number().nullable().optional(),
    polygonPath: z.string().nullable().optional(),
    feeMultiplier: z.number().default(1.0),
    maxDrivingMinutes: z.number().nullable().optional()
  });
  
  type ExtendedZoneForm = z.infer<typeof extendedZoneSchema>;

  // Create form for adding new service zone
  const addForm = useForm<ExtendedZoneForm>({
    resolver: zodResolver(extendedZoneSchema),
    defaultValues: {
      name: "",
      zipCodes: "",
      deliveryFee: 0,
      useGeofencing: false,
      centerLat: null,
      centerLng: null,
      radiusMeters: null,
      feeMultiplier: 1.0,
      maxDrivingMinutes: null
    },
  });

  // Create form for editing service zone
  const editForm = useForm<ExtendedZoneForm>({
    resolver: zodResolver(extendedZoneSchema),
    defaultValues: {
      name: "",
      zipCodes: "",
      deliveryFee: 0,
      useGeofencing: false,
      centerLat: null,
      centerLng: null,
      radiusMeters: null,
      feeMultiplier: 1.0,
      maxDrivingMinutes: null
    },
  });

  // Add zone mutation
  const addZoneMutation = useMutation({
    mutationFn: async (data: ExtendedZoneForm) => {
      // Convert fee from dollars to cents
      // Format geofencing data based on whether it's enabled
      const formattedData = {
        ...data,
        deliveryFee: data.deliveryFee * 100,
        // Include geofencing fields only if geofencing is enabled
        useGeofencing: data.useGeofencing,
        centerLat: data.useGeofencing ? data.centerLat : null,
        centerLng: data.useGeofencing ? data.centerLng : null,
        radiusMeters: data.useGeofencing ? data.radiusMeters : null,
        feeMultiplier: data.useGeofencing ? data.feeMultiplier : 1.0,
        maxDrivingMinutes: data.useGeofencing ? data.maxDrivingMinutes : null
      };
      
      const response = await apiRequest("POST", "/api/zones", formattedData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/zones"] });
      setIsAddDialogOpen(false);
      addForm.reset();
      toast({
        title: "Service zone added",
        description: "The service zone has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add service zone: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Edit zone mutation
  const editZoneMutation = useMutation({
    mutationFn: async (data: ExtendedZoneForm & { id: number }) => {
      const { id, ...rest } = data;
      // Convert fee from dollars to cents
      const formattedData = {
        ...rest,
        deliveryFee: rest.deliveryFee * 100,
        // Include geofencing fields only if geofencing is enabled
        useGeofencing: rest.useGeofencing,
        centerLat: rest.useGeofencing ? rest.centerLat : null,
        centerLng: rest.useGeofencing ? rest.centerLng : null,
        radiusMeters: rest.useGeofencing ? rest.radiusMeters : null,
        feeMultiplier: rest.useGeofencing ? rest.feeMultiplier : 1.0,
        maxDrivingMinutes: rest.useGeofencing ? rest.maxDrivingMinutes : null
      };
      
      const response = await apiRequest("PUT", `/api/zones/${id}`, formattedData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/zones"] });
      setIsEditDialogOpen(false);
      setSelectedZone(null);
      toast({
        title: "Service zone updated",
        description: "The service zone has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update service zone: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete zone mutation
  const deleteZoneMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/zones/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/zones"] });
      toast({
        title: "Service zone deleted",
        description: "The service zone has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete service zone: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onAddSubmit = (data: ExtendedZoneForm) => {
    // Ensure useGeofencing is always a boolean
    const formData = {
      ...data,
      useGeofencing: Boolean(data.useGeofencing),
      feeMultiplier: data.feeMultiplier || 1.0
    };
    addZoneMutation.mutate(formData);
  };

  const onEditSubmit = (data: ExtendedZoneForm) => {
    if (selectedZone) {
      // Ensure useGeofencing is always a boolean
      const formData = {
        ...data,
        useGeofencing: Boolean(data.useGeofencing),
        feeMultiplier: data.feeMultiplier || 1.0,
        id: selectedZone.id
      };
      editZoneMutation.mutate(formData);
    }
  };

  const handleEdit = (zone: ServiceZone) => {
    setSelectedZone(zone);
    // Convert fee from cents to dollars for form display
    // Handle geofencing fields
    editForm.reset({
      ...zone,
      deliveryFee: zone.deliveryFee / 100,
      useGeofencing: zone.useGeofencing || false,
      centerLat: zone.centerLat || null,
      centerLng: zone.centerLng || null,
      radiusMeters: zone.radiusMeters || null,
      polygonPath: zone.polygonPath || null,
      feeMultiplier: zone.feeMultiplier || 1.0,
      maxDrivingMinutes: zone.maxDrivingMinutes || null
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteZoneMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  // Handle saving geofence data
  const handleSaveGeofence = async (geofenceData: any) => {
    if (selectedZone) {
      try {
        const updatedZone = {
          ...selectedZone,
          ...geofenceData,
          id: selectedZone.id
        };
        
        await editZoneMutation.mutateAsync(updatedZone);
        setIsGeofenceEditorOpen(false);
        toast({
          title: "Geofence Updated",
          description: "The service zone geofence has been updated successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update geofence. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
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
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Service Zone</DialogTitle>
                <DialogDescription>
                  Define a new service area with associated ZIP codes and delivery fee.
                </DialogDescription>
              </DialogHeader>
              <Form {...addForm}>
                <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="basic">Basic Information</TabsTrigger>
                      <TabsTrigger value="geofence">Geofencing</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="basic" className="space-y-4 pt-4">
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
                        name="zipCodes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ZIP Codes</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="10001,10002,10003,10004,10005" 
                                {...field} 
                              />
                            </FormControl>
                            <p className="text-sm text-muted-foreground">
                              Enter ZIP codes separated by commas
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addForm.control}
                        name="deliveryFee"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Base Delivery Fee</FormLabel>
                            <FormControl>
                              <PriceInput
                                {...field}
                                onValueChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    
                    <TabsContent value="geofence" className="space-y-4 pt-4">
                      <FormField
                        control={addForm.control}
                        name="useGeofencing"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Enable Geofencing</FormLabel>
                              <FormDescription>
                                Calculate delivery fees based on actual driving distance using Google Maps
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      {addForm.watch("useGeofencing") && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={addForm.control}
                              name="centerLat"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Center Latitude</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      step="0.000001"
                                      placeholder="39.1200"
                                      value={field.value === null ? "" : field.value}
                                      onChange={(e) => field.onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={addForm.control}
                              name="centerLng"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Center Longitude</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      step="0.000001"
                                      placeholder="-88.5434"
                                      value={field.value === null ? "" : field.value}
                                      onChange={(e) => field.onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={addForm.control}
                            name="radiusMeters"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Service Radius (meters)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="20000"
                                    value={field.value === null ? "" : field.value}
                                    onChange={(e) => field.onChange(e.target.value === "" ? null : parseInt(e.target.value))}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Maximum distance from center point in meters (e.g., 20000 = 20km)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={addForm.control}
                            name="feeMultiplier"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Fee Multiplier</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.1"
                                    placeholder="1.5"
                                    value={field.value}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Multiply the base fee by this amount (e.g., 1.5 = 150% of base fee)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={addForm.control}
                            name="maxDrivingMinutes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Max Driving Time (minutes)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="45"
                                    value={field.value === null ? "" : field.value}
                                    onChange={(e) => field.onChange(e.target.value === "" ? null : parseInt(e.target.value))}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Maximum acceptable driving time for delivery in this zone
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                    </TabsContent>
                  </Tabs>
                  
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={addZoneMutation.isPending}
                    >
                      {addZoneMutation.isPending && (
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

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Service Zone</DialogTitle>
              <DialogDescription>
                Update the details of this service zone.
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">Basic Information</TabsTrigger>
                    <TabsTrigger value="geofence">Geofencing</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="basic" className="space-y-4 pt-4">
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
                      name="zipCodes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Codes</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <p className="text-sm text-muted-foreground">
                            Enter ZIP codes separated by commas
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="deliveryFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Base Delivery Fee</FormLabel>
                          <FormControl>
                            <PriceInput
                              {...field}
                              onValueChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                  
                  <TabsContent value="geofence" className="space-y-4 pt-4">
                    <FormField
                      control={editForm.control}
                      name="useGeofencing"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Enable Geofencing</FormLabel>
                            <FormDescription>
                              Calculate delivery fees based on actual driving distance using Google Maps
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    {editForm.watch("useGeofencing") && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={editForm.control}
                            name="centerLat"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Center Latitude</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.000001"
                                    placeholder="39.1200"
                                    value={field.value === null ? "" : field.value}
                                    onChange={(e) => field.onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={editForm.control}
                            name="centerLng"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Center Longitude</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.000001"
                                    placeholder="-88.5434"
                                    value={field.value === null ? "" : field.value}
                                    onChange={(e) => field.onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={editForm.control}
                          name="radiusMeters"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Service Radius (meters)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="20000"
                                  value={field.value === null ? "" : field.value}
                                  onChange={(e) => field.onChange(e.target.value === "" ? null : parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormDescription>
                                Maximum distance from center point in meters (e.g., 20000 = 20km)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={editForm.control}
                          name="feeMultiplier"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fee Multiplier</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.1"
                                  placeholder="1.5"
                                  value={field.value}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormDescription>
                                Multiply the base fee by this amount (e.g., 1.5 = 150% of base fee)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={editForm.control}
                          name="maxDrivingMinutes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Max Driving Time (minutes)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="45"
                                  value={field.value === null ? "" : field.value}
                                  onChange={(e) => field.onChange(e.target.value === "" ? null : parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormDescription>
                                Maximum acceptable driving time for delivery in this zone
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </TabsContent>
                </Tabs>
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={editZoneMutation.isPending}
                  >
                    {editZoneMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Update Zone
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Service Zones Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {zones?.map((zone) => {
            const zipCodeCount = zone.zipCodes ? zone.zipCodes.split(',').filter(Boolean).length : 0;
            
            return (
              <Card key={zone.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center">
                    {zone.useGeofencing ? (
                      <Globe className="mr-2 h-5 w-5 text-primary" />
                    ) : (
                      <MapPin className="mr-2 h-5 w-5 text-primary" />
                    )}
                    {zone.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium">Zone Type</p>
                      <p className="text-sm font-medium mt-1">
                        {zone.useGeofencing ? (
                          <span className="flex items-center text-emerald-600">
                            <Map className="mr-1 h-4 w-4" /> 
                            Geofence-based pricing
                          </span>
                        ) : (
                          <span className="flex items-center text-blue-600">
                            <MapPin className="mr-1 h-4 w-4" /> 
                            ZIP code-based pricing
                          </span>
                        )}
                      </p>
                    </div>
                    
                    {!zone.useGeofencing && (
                      <div>
                        <p className="text-sm font-medium">ZIP Codes</p>
                        <p className="text-sm text-neutral-600 mt-1">
                          {zipCodeCount > 0 ? (
                            zipCodeCount > 5 
                              ? zone.zipCodes.split(',').slice(0, 5).join(', ') + ` +${zipCodeCount - 5} more`
                              : zone.zipCodes.split(',').join(', ')
                          ) : (
                            <span className="text-neutral-400">No ZIP codes defined</span>
                          )}
                        </p>
                      </div>
                    )}
                    
                    {zone.useGeofencing && (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="font-medium">Center Point</p>
                          <p className="text-neutral-600">
                            {zone.centerLat && zone.centerLng ? (
                              <span>{zone.centerLat.toFixed(4)}, {zone.centerLng.toFixed(4)}</span>
                            ) : (
                              <span className="text-neutral-400">Not set</span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Radius</p>
                          <p className="text-neutral-600">
                            {zone.radiusMeters ? (
                              <span>{(zone.radiusMeters / 1000).toFixed(1)} km</span>
                            ) : (
                              <span className="text-neutral-400">Not set</span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Fee Multiplier</p>
                          <p className="text-neutral-600">
                            {zone.feeMultiplier ? (
                              <span>{zone.feeMultiplier.toFixed(1)}x</span>
                            ) : (
                              <span>1.0x</span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Max Drive Time</p>
                          <p className="text-neutral-600">
                            {zone.maxDrivingMinutes ? (
                              <span>{zone.maxDrivingMinutes} mins</span>
                            ) : (
                              <span className="text-neutral-400">No limit</span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">Delivery Fee</p>
                        <p className="text-lg font-bold text-primary">${(zone.deliveryFee / 100).toFixed(2)}</p>
                      </div>
                      {!zone.useGeofencing && (
                        <div>
                          <p className="text-sm font-medium">Coverage</p>
                          <p className="text-lg font-bold">{zipCodeCount} ZIP codes</p>
                        </div>
                      )}
                      {zone.useGeofencing && (
                        <div>
                          <p className="text-sm font-medium">Dynamic Pricing</p>
                          <div className="flex items-center">
                            <Navigation className="h-4 w-4 mr-1 text-orange-500" />
                            <p className="text-sm font-medium">Distance-based</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2 pt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(zone)}
                      >
                        <Edit className="mr-1 h-4 w-4" /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedZone(zone);
                          setIsGeofenceEditorOpen(true);
                        }}
                      >
                        <Map className="mr-1 h-4 w-4" /> Map
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash className="mr-1 h-4 w-4" /> Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the "{zone.name}" service zone. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(zone.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Geofence Editor Drawer */}
      <Drawer open={isGeofenceEditorOpen} onOpenChange={setIsGeofenceEditorOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>Geofence Editor - {selectedZone?.name}</DrawerTitle>
            <DrawerDescription>
              Draw custom boundaries on the map to define your service area
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-6">
            {selectedZone && (
              <GeofenceEditor 
                zone={selectedZone}
                onSave={handleSaveGeofence}
                onCancel={() => setIsGeofenceEditorOpen(false)}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </AdminLayout>
  );
}
