import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/ui/admin-layout";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ServiceZone, InsertServiceZone, insertServiceZoneSchema } from "@shared/schema";
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

export default function ZonesPage() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<ServiceZone | null>(null);

  // Fetch service zones
  const { data: zones, isLoading } = useQuery<ServiceZone[]>({
    queryKey: ["/api/zones"],
  });

  // Create form for adding new service zone
  const addForm = useForm<InsertServiceZone>({
    resolver: zodResolver(insertServiceZoneSchema),
    defaultValues: {
      name: "",
      zipCodes: "",
      deliveryFee: 0,
    },
  });

  // Create form for editing service zone
  const editForm = useForm<InsertServiceZone>({
    resolver: zodResolver(insertServiceZoneSchema),
    defaultValues: {
      name: "",
      zipCodes: "",
      deliveryFee: 0,
    },
  });

  // Add zone mutation
  const addZoneMutation = useMutation({
    mutationFn: async (data: InsertServiceZone) => {
      // Convert fee from dollars to cents
      const formattedData = {
        ...data,
        deliveryFee: data.deliveryFee * 100,
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
    mutationFn: async (data: InsertServiceZone & { id: number }) => {
      const { id, ...rest } = data;
      // Convert fee from dollars to cents
      const formattedData = {
        ...rest,
        deliveryFee: rest.deliveryFee * 100,
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

  const onAddSubmit = (data: InsertServiceZone) => {
    addZoneMutation.mutate(data);
  };

  const onEditSubmit = (data: InsertServiceZone) => {
    if (selectedZone) {
      editZoneMutation.mutate({ ...data, id: selectedZone.id });
    }
  };

  const handleEdit = (zone: ServiceZone) => {
    setSelectedZone(zone);
    // Convert fee from cents to dollars for form display
    editForm.reset({
      ...zone,
      deliveryFee: zone.deliveryFee / 100,
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
                        <FormLabel>Delivery Fee ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                      <FormLabel>Delivery Fee ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
            const zipCodeCount = zone.zipCodes.split(',').length;
            
            return (
              <Card key={zone.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center">
                    <MapPin className="mr-2 h-5 w-5 text-primary" />
                    {zone.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium">ZIP Codes</p>
                      <p className="text-sm text-neutral-600 mt-1">
                        {zipCodeCount > 5 
                          ? zone.zipCodes.split(',').slice(0, 5).join(', ') + ` +${zipCodeCount - 5} more`
                          : zone.zipCodes.split(',').join(', ')}
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">Delivery Fee</p>
                        <p className="text-lg font-bold text-primary">${(zone.deliveryFee / 100).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Coverage</p>
                        <p className="text-lg font-bold">{zipCodeCount} ZIP codes</p>
                      </div>
                    </div>
                    <div className="flex space-x-2 pt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(zone)}
                      >
                        <Edit className="mr-1 h-4 w-4" /> Edit
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
    </AdminLayout>
  );
}
