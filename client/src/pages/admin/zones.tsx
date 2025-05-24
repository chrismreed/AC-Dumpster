import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/ui/admin-layout";
import { Button } from "@/components/ui/button";
import { GeofenceEditor } from "@/components/admin/geofence-editor";
import { ZonesOverviewMap } from "@/components/admin/zones-overview-map";
import { Link } from "wouter";
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
import { Loader2, Plus, Edit, Trash, MapPin, Globe, Map, Navigation, Layout } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as z from "zod";

// Extended schema for the form
const extendedZoneSchema = insertServiceZoneSchema.extend({
  baseFee: z.coerce.number().min(0, { message: "Base fee must be a positive number" }),
});

export default function ZonesPage() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<ServiceZone | null>(null);
  const [isGeofenceEditorOpen, setIsGeofenceEditorOpen] = useState(false);

  const { data: zones, isLoading } = useQuery<ServiceZone[]>({
    queryKey: ["/api/zones"],
  });

  const addForm = useForm<z.infer<typeof extendedZoneSchema>>({
    resolver: zodResolver(extendedZoneSchema),
    defaultValues: {
      name: "",
      zipCodes: "",
      description: "",
      baseFee: 0,
    },
  });

  const editForm = useForm<z.infer<typeof extendedZoneSchema>>({
    resolver: zodResolver(extendedZoneSchema),
    defaultValues: {
      name: "",
      zipCodes: "",
      description: "",
      baseFee: 0,
    },
  });

  const createZoneMutation = useMutation({
    mutationFn: async (data: z.infer<typeof extendedZoneSchema>) => {
      const response = await apiRequest("POST", "/api/zones", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/zones"] });
      setIsAddDialogOpen(false);
      addForm.reset();
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/zones"] });
      setIsEditDialogOpen(false);
      editForm.reset();
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
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/zones"] });
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
    createZoneMutation.mutate(data);
  };

  const onEditSubmit = (data: z.infer<typeof extendedZoneSchema>) => {
    if (selectedZone) {
      updateZoneMutation.mutate({
        ...selectedZone,
        ...data,
      });
    }
  };

  const handleEdit = (zone: ServiceZone) => {
    setSelectedZone(zone);
    editForm.reset({
      name: zone.name,
      zipCodes: zone.zipCodes || "",
      description: zone.description || "",
      baseFee: zone.baseFee || 0,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteZoneMutation.mutate(id);
  };

  const handleOpenGeofenceEditor = (zone: ServiceZone) => {
    setSelectedZone(zone);
    setIsGeofenceEditorOpen(true);
  };

  const handleSaveGeofence = (polygonPath: string) => {
    if (selectedZone) {
      updateZoneMutation.mutate({
        ...selectedZone,
        polygonPath,
      });
    }
    setIsGeofenceEditorOpen(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Service Zones</h1>
            <p className="text-gray-500">Manage your service areas and location-based pricing</p>
          </div>
          <div className="flex space-x-2">
            <Link href="/admin/zones-map">
              <Button variant="outline">
                <Map className="mr-2 h-4 w-4" /> View All Zones Map
              </Button>
            </Link>
            <Link href="/admin/zones-new">
              <Button variant="outline" className="bg-amber-100 hover:bg-amber-200 border-amber-300">
                <Layout className="mr-2 h-4 w-4" /> Try New Layout
              </Button>
            </Link>
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
                                <Input placeholder="12345, 23456, 34567" {...field} />
                              </FormControl>
                              <FormDescription>
                                Comma-separated list of ZIP codes in this zone
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={addForm.control}
                          name="baseFee"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Base Delivery Fee</FormLabel>
                              <FormControl>
                                <PriceInput
                                  value={field.value.toString()}
                                  onValueChange={(value) => field.onChange(parseFloat(value))}
                                />
                              </FormControl>
                              <FormDescription>
                                Standard delivery fee for this zone
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={addForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Details about this service zone"
                                  className="resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>
                      
                      <TabsContent value="geofence" className="space-y-4 pt-4">
                        <div className="text-sm text-gray-500">
                          <p>Geofencing allows you to define custom service boundaries.</p>
                          <p className="mt-2">You can add geofencing after creating the zone.</p>
                        </div>
                      </TabsContent>
                    </Tabs>
                    
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
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Service Zones</CardTitle>
                <CardDescription>
                  Manage your delivery areas and pricing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>ZIP Codes</TableHead>
                      <TableHead>Base Fee</TableHead>
                      <TableHead>Geofencing</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {zones && zones.length > 0 ? (
                      zones.map((zone) => (
                        <TableRow key={zone.id}>
                          <TableCell className="font-medium">{zone.name}</TableCell>
                          <TableCell>{zone.zipCodes || "—"}</TableCell>
                          <TableCell>${zone.baseFee?.toFixed(2) || "0.00"}</TableCell>
                          <TableCell>
                            {zone.polygonPaths ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenGeofenceEditor(zone)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Boundary
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenGeofenceEditor(zone)}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Boundary
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <span className="sr-only">Open menu</span>
                                  <Navigation className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(zone)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onSelect={(e) => e.preventDefault()}
                                    >
                                      <Trash className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete the service zone. This action cannot be undone.
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
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No service zones found. Add your first zone to get started.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
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
                
                <FormField
                  control={editForm.control}
                  name="baseFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Delivery Fee</FormLabel>
                      <FormControl>
                        <PriceInput
                          value={field.value.toString()}
                          onValueChange={(value) => field.onChange(parseFloat(value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Standard delivery fee for this zone
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
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

      <Drawer open={isGeofenceEditorOpen} onOpenChange={setIsGeofenceEditorOpen}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Edit Service Zone Boundary</DrawerTitle>
            <DrawerDescription>
              Draw the precise boundary for {selectedZone?.name}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 overflow-y-auto max-h-[calc(90vh-10rem)]">
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