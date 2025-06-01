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
import { PriceInput } from "@/components/ui/price-input";
import { Dumpster, InsertDumpster, insertDumpsterSchema, Booking, RentalDuration } from "@shared/schema";
import { Loader2, Plus, Edit, Trash } from "lucide-react";
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

export default function DumpstersPage() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDumpster, setSelectedDumpster] = useState<Dumpster | null>(null);

  // Fetch dumpsters
  const { data: dumpsters, isLoading } = useQuery<Dumpster[]>({
    queryKey: ["/api/dumpsters"],
  });

  // Fetch bookings to calculate deployed units
  const { data: bookings } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  // Calculate deployed units for each dumpster
  const getDeployedCount = (dumpsterId: number) => {
    if (!bookings) return 0;
    return bookings.filter(booking => 
      booking.dumpsterId === dumpsterId && booking.status === 'delivered'
    ).length;
  };

  // Create form for adding new dumpster
  const addForm = useForm<InsertDumpster>({
    resolver: zodResolver(insertDumpsterSchema),
    defaultValues: {
      name: "",
      dimensions: "",
      description: "",
      weightLimit: 0,
      availability: 0,
      imageUrl: "",
    },
  });

  // Create form for editing dumpster
  const editForm = useForm<InsertDumpster>({
    resolver: zodResolver(insertDumpsterSchema),
    defaultValues: {
      name: "",
      dimensions: "",
      description: "",
      weightLimit: 0,
      availability: 0,
      imageUrl: "",
    },
  });

  // Add dumpster mutation
  const addDumpsterMutation = useMutation({
    mutationFn: async (data: InsertDumpster) => {
      const response = await apiRequest("POST", "/api/dumpsters", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dumpsters"] });
      setIsAddDialogOpen(false);
      addForm.reset();
      toast({
        title: "Dumpster added",
        description: "The dumpster has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add dumpster: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Edit dumpster mutation
  const editDumpsterMutation = useMutation({
    mutationFn: async (data: InsertDumpster & { id: number }) => {
      const { id, ...rest } = data;
      const response = await apiRequest("PUT", `/api/dumpsters/${id}`, rest);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dumpsters"] });
      setIsEditDialogOpen(false);
      setSelectedDumpster(null);
      toast({
        title: "Dumpster updated",
        description: "The dumpster has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update dumpster: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete dumpster mutation
  const deleteDumpsterMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/dumpsters/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dumpsters"] });
      toast({
        title: "Dumpster deleted",
        description: "The dumpster has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete dumpster: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onAddSubmit = (data: InsertDumpster) => {
    addDumpsterMutation.mutate(data);
  };

  const onEditSubmit = (data: InsertDumpster) => {
    if (selectedDumpster) {
      editDumpsterMutation.mutate({ ...data, id: selectedDumpster.id });
    }
  };

  const handleEdit = (dumpster: Dumpster) => {
    setSelectedDumpster(dumpster);
    editForm.reset({
      name: dumpster.name,
      dimensions: dumpster.dimensions,
      description: dumpster.description,
      weightLimit: dumpster.weightLimit,
      availability: dumpster.availability,
      imageUrl: dumpster.imageUrl || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteDumpsterMutation.mutate(id);
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
            <h1 className="text-3xl font-bold">Dumpsters</h1>
            <p className="text-gray-500">Manage your dumpster inventory and pricing</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Dumpster
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Dumpster</DialogTitle>
                <DialogDescription>
                  Fill in the details to add a new dumpster to your inventory.
                </DialogDescription>
              </DialogHeader>
              <Form {...addForm}>
                <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
                  <FormField
                    control={addForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="10 Yard Dumpster" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addForm.control}
                    name="dimensions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dimensions</FormLabel>
                        <FormControl>
                          <Input placeholder="12' × 8' × 3.5' (LWH)" {...field} />
                        </FormControl>
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
                          <Textarea placeholder="Ideal for small remodeling projects..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={addForm.control}
                      name="basePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Base Price</FormLabel>
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
                    <FormField
                      control={addForm.control}
                      name="weightLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight Limit (lbs)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addForm.control}
                      name="availability"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Availability</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={addForm.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="/assets/dumpster-10yard.svg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={addDumpsterMutation.isPending}
                    >
                      {addDumpsterMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Add Dumpster
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
              <DialogTitle>Edit Dumpster</DialogTitle>
              <DialogDescription>
                Update the details of this dumpster.
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="dimensions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dimensions</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
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
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={editForm.control}
                    name="basePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Price</FormLabel>
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
                  <FormField
                    control={editForm.control}
                    name="weightLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight Limit (lbs)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="availability"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Availability</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={editForm.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={editDumpsterMutation.isPending}
                  >
                    {editDumpsterMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Update Dumpster
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Dumpster Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dumpsters?.map((dumpster) => (
            <Card key={dumpster.id}>
              <CardHeader className="pb-2">
                <CardTitle>{dumpster.name}</CardTitle>
                <CardDescription>{dumpster.dimensions}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-neutral-600">{dumpster.description}</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">Base Price</p>
                      <p className="text-lg font-bold text-primary">${(dumpster.basePrice / 100).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Weight Limit</p>
                      <p className="text-lg font-bold">{dumpster.weightLimit / 2000} tons</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Deployed</p>
                      <p className="text-lg font-bold">{getDeployedCount(dumpster.id)}/{dumpster.availability} units</p>
                    </div>
                  </div>
                  <div className="flex space-x-2 pt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEdit(dumpster)}
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
                            This will permanently delete the "{dumpster.name}" dumpster. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(dumpster.id)}
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
              <div className="px-6 pb-6">
                <DumpsterPricingManager 
                  dumpsterId={dumpster.id} 
                  dumpsterName={dumpster.name}
                />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
