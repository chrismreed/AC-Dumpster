import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/ui/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Dumpster, InsertDumpster, insertDumpsterSchema, Booking, RentalDuration, DumpsterPricing } from "@shared/schema";
import { Loader2, Plus, Edit, Trash, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Sortable dumpster card component
function SortableDumpsterCard({ dumpster, getDeployedCount, handleEdit, handleDelete, pricingData, setPricingData, handleAddPricing, handleDeletePricing, addingPricing, setAddingPricing, newPricingDays, setNewPricingDays, newPricingPrice, setNewPricingPrice, handlePricingDragEnd }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: dumpster.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card ref={setNodeRef} style={style} className="relative">
      <div {...attributes} {...listeners} className="absolute top-2 left-2 cursor-grab active:cursor-grabbing z-10">
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      <CardHeader className="pb-2 pl-8">
        <CardTitle>{dumpster.name}</CardTitle>
        <CardDescription>{dumpster.dimensions}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">{dumpster.description}</p>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">Weight Limit</p>
              <p className="text-lg font-bold text-primary">{dumpster.weightLimit.toLocaleString()} lbs</p>
            </div>
            <div>
              <p className="text-sm font-medium">Capacity</p>
              <p className="text-lg font-bold">{Math.round(dumpster.weightLimit / 2000)} tons</p>
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
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Dumpster</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{dumpster.name}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(dumpster.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
      
      {/* Pricing Management Section */}
      <div className="px-6 pb-6 border-t border-gray-200">
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Rental Duration Pricing</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddingPricing(dumpster.id)}
              className="text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Option
            </Button>
          </div>

          {/* Current pricing options with drag and drop */}
          <DndContext
            sensors={[useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })]}
            collisionDetection={closestCenter}
            onDragEnd={(event) => handlePricingDragEnd(event, dumpster.id, pricingData, setPricingData)}
          >
            <SortableContext
              items={pricingData[dumpster.id]?.map((p: any) => p.id) || []}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2 mb-3">
                {pricingData[dumpster.id]?.map((pricing: any) => (
                  <SortablePricingItem 
                    key={pricing.id} 
                    pricing={pricing} 
                    onDelete={() => handleDeletePricing(pricing.id, dumpster.id)}
                  />
                ))}
                {(!pricingData[dumpster.id] || pricingData[dumpster.id].length === 0) && (
                  <div className="text-sm text-gray-500 italic">No pricing options set</div>
                )}
              </div>
            </SortableContext>
          </DndContext>

          {/* Add new pricing form */}
          {addingPricing === dumpster.id && (
            <div className="bg-gray-50 p-3 rounded border">
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Days
                  </label>
                  <Input
                    type="number"
                    placeholder="3"
                    value={newPricingDays}
                    onChange={(e) => setNewPricingDays(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Price ($)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="480.00"
                    value={newPricingPrice}
                    onChange={(e) => setNewPricingPrice(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAddPricing(dumpster.id)}
                  className="text-xs"
                >
                  Add
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAddingPricing(null);
                    setNewPricingDays("");
                    setNewPricingPrice("");
                  }}
                  className="text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// Sortable pricing item component
function SortablePricingItem({ pricing, onDelete }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: pricing.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex items-center justify-between bg-gray-50 p-2 rounded"
    >
      <div className="flex items-center gap-2">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="w-3 h-3 text-gray-400" />
        </div>
        <span className="text-sm">
          {pricing.days} {pricing.days === 1 ? 'day' : 'days'} - ${(pricing.price / 100).toFixed(2)}
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
      >
        <Trash className="w-3 h-3" />
      </Button>
    </div>
  );
}

export default function DumpstersPage() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDumpster, setSelectedDumpster] = useState<Dumpster | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Pricing management state
  const [pricingData, setPricingData] = useState<Record<number, DumpsterPricing[]>>({});
  const [addingPricing, setAddingPricing] = useState<number | null>(null);
  const [newPricingDays, setNewPricingDays] = useState("");
  const [newPricingPrice, setNewPricingPrice] = useState("");

  // Fetch dumpsters
  const { data: dumpsters, isLoading } = useQuery<Dumpster[]>({
    queryKey: ["/api/dumpsters"],
  });

  // Fetch bookings to show deployed counts
  const { data: bookings } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  // Fetch pricing data for each dumpster
  useEffect(() => {
    if (dumpsters) {
      dumpsters.forEach(async (dumpster) => {
        try {
          const response = await apiRequest("GET", `/api/dumpster-pricing/${dumpster.id}`);
          const pricing = await response.json();
          setPricingData((prev) => ({
            ...prev,
            [dumpster.id]: pricing
          }));
        } catch (error) {
          console.error(`Failed to fetch pricing for dumpster ${dumpster.id}:`, error);
        }
      });
    }
  }, [dumpsters]);

  // Get deployed count for a dumpster
  const getDeployedCount = (dumpsterId: number) => {
    if (!bookings) return 0;
    // Count bookings where dumpsters are actively deployed (not available for new bookings)
    return bookings.filter(booking => 
      booking.dumpsterId === dumpsterId && 
      ['confirmed', 'delivered', 'picked_up'].includes(booking.status)
    ).length;
  };

  // Handle drag end for dumpsters
  const handleDumpsterDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !dumpsters) return;

    if (active.id !== over.id) {
      const oldIndex = dumpsters.findIndex((item) => item.id === active.id);
      const newIndex = dumpsters.findIndex((item) => item.id === over.id);
      
      const newOrder = arrayMove(dumpsters, oldIndex, newIndex);
      
      // Update sort orders
      const dumpsterOrders = newOrder.map((dumpster, index) => ({
        id: dumpster.id,
        sortOrder: index
      }));
      
      try {
        await apiRequest("PUT", "/api/dumpsters/sort-order", { dumpsterOrders });
        queryClient.invalidateQueries({ queryKey: ["/api/dumpsters"] });
        toast({
          title: "Success",
          description: "Dumpster order updated successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update dumpster order",
          variant: "destructive",
        });
      }
    }
  };

  // Handle drag end for pricing
  const handlePricingDragEnd = async (event: DragEndEvent, dumpsterId: number, pricingData: Record<number, DumpsterPricing[]>, setPricingData: any) => {
    const { active, over } = event;

    if (!over || !pricingData[dumpsterId]) return;

    if (active.id !== over.id) {
      const oldIndex = pricingData[dumpsterId].findIndex((item) => item.id === active.id);
      const newIndex = pricingData[dumpsterId].findIndex((item) => item.id === over.id);
      
      const newOrder = arrayMove(pricingData[dumpsterId], oldIndex, newIndex);
      
      // Update local state immediately
      setPricingData((prev: Record<number, DumpsterPricing[]>) => ({
        ...prev,
        [dumpsterId]: newOrder
      }));
      
      // Update sort orders on server
      const pricingOrders = newOrder.map((pricing, index) => ({
        id: pricing.id,
        sortOrder: index
      }));
      
      try {
        await apiRequest("PUT", "/api/dumpster-pricing/sort-order", { pricingOrders });
        toast({
          title: "Success",
          description: "Pricing order updated successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update pricing order",
          variant: "destructive",
        });
      }
    }
  };

  // Add pricing option
  const handleAddPricing = async (dumpsterId: number) => {
    if (!newPricingDays || !newPricingPrice) {
      toast({
        title: "Error",
        description: "Please enter both days and price",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/dumpster-pricing", {
        dumpsterId,
        days: parseInt(newPricingDays),
        price: Math.round(parseFloat(newPricingPrice) * 100), // Convert to cents
        sortOrder: pricingData[dumpsterId]?.length || 0
      });
      const newPricing = await response.json();
      
      setPricingData((prev) => ({
        ...prev,
        [dumpsterId]: [...(prev[dumpsterId] || []), newPricing]
      }));

      setAddingPricing(null);
      setNewPricingDays("");
      setNewPricingPrice("");
      
      toast({
        title: "Success",
        description: "Pricing option added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add pricing option",
        variant: "destructive",
      });
    }
  };

  // Delete pricing option
  const handleDeletePricing = async (pricingId: number, dumpsterId: number) => {
    try {
      await apiRequest("DELETE", `/api/dumpster-pricing/${pricingId}`);
      
      setPricingData((prev) => ({
        ...prev,
        [dumpsterId]: prev[dumpsterId]?.filter(p => p.id !== pricingId) || []
      }));

      toast({
        title: "Success",
        description: "Pricing option deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete pricing option",
        variant: "destructive",
      });
    }
  };

  // Add/Edit/Delete dumpster handlers
  const addForm = useForm<InsertDumpster>({
    resolver: zodResolver(insertDumpsterSchema),
    defaultValues: {
      name: "",
      dimensions: "",
      description: "",
      weightLimit: 0,
      availability: 1,
      imageUrl: "",
      sortOrder: 0,
    },
  });

  const editForm = useForm<InsertDumpster>({
    resolver: zodResolver(insertDumpsterSchema),
    defaultValues: {
      name: "",
      dimensions: "",
      description: "",
      weightLimit: 0,
      availability: 1,
      imageUrl: "",
      sortOrder: 0,
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: InsertDumpster) => {
      const response = await apiRequest("POST", "/api/dumpsters", {
        ...data,
        sortOrder: dumpsters?.length || 0
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dumpsters"] });
      setIsAddDialogOpen(false);
      addForm.reset();
      toast({
        title: "Success",
        description: "Dumpster added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add dumpster",
        variant: "destructive",
      });
    },
  });

  const editMutation = useMutation({
    mutationFn: async (data: InsertDumpster) => {
      if (!selectedDumpster) throw new Error("No dumpster selected");
      const response = await apiRequest("PUT", `/api/dumpsters/${selectedDumpster.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dumpsters"] });
      setIsEditDialogOpen(false);
      setSelectedDumpster(null);
      editForm.reset();
      toast({
        title: "Success",
        description: "Dumpster updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update dumpster",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/dumpsters/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dumpsters"] });
      toast({
        title: "Success",
        description: "Dumpster deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete dumpster",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (dumpster: Dumpster) => {
    setSelectedDumpster(dumpster);
    editForm.reset({
      name: dumpster.name,
      dimensions: dumpster.dimensions,
      description: dumpster.description,
      weightLimit: dumpster.weightLimit,
      availability: dumpster.availability,
      imageUrl: dumpster.imageUrl || "",
      sortOrder: dumpster.sortOrder,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dumpster Management</h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Dumpster
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Dumpster</DialogTitle>
                <DialogDescription>
                  Create a new dumpster type for your rental inventory.
                </DialogDescription>
              </DialogHeader>
              <Form {...addForm}>
                <form onSubmit={addForm.handleSubmit((data) => addMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={addForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="15 Yard Dumpster" {...field} />
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
                          <Input placeholder="14' L x 8' W x 4' H" {...field} />
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
                          <Textarea placeholder="Perfect for medium-sized projects..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={addForm.control}
                      name="weightLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight Limit (lbs)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="4000" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
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
                            <Input type="number" placeholder="5" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
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
                          <Input placeholder="https://example.com/image.jpg" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="submit" disabled={addMutation.isPending}>
                      {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Dumpster</DialogTitle>
              <DialogDescription>
                Update the dumpster information.
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit((data) => editMutation.mutate(data))} className="space-y-4">
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
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="weightLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight Limit (lbs)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
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
                          <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
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
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit" disabled={editMutation.isPending}>
                    {editMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Dumpster
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Dumpster Grid with Drag and Drop */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDumpsterDragEnd}
        >
          <SortableContext
            items={dumpsters?.map(d => d.id) || []}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dumpsters?.map((dumpster) => (
                <SortableDumpsterCard
                  key={dumpster.id}
                  dumpster={dumpster}
                  getDeployedCount={getDeployedCount}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                  pricingData={pricingData}
                  setPricingData={setPricingData}
                  handleAddPricing={handleAddPricing}
                  handleDeletePricing={handleDeletePricing}
                  addingPricing={addingPricing}
                  setAddingPricing={setAddingPricing}
                  newPricingDays={newPricingDays}
                  setNewPricingDays={setNewPricingDays}
                  newPricingPrice={newPricingPrice}
                  setNewPricingPrice={setNewPricingPrice}
                  handlePricingDragEnd={handlePricingDragEnd}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </AdminLayout>
  );
}