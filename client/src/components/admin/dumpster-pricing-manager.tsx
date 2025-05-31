import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { PriceInput } from "@/components/ui/price-input";
import { DumpsterPricing, InsertDumpsterPricing } from "@shared/schema";
import { Loader2, Plus, Edit, Trash } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
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

const pricingSchema = z.object({
  days: z.number().min(1).max(365),
  price: z.number().min(0),
});

type PricingFormData = z.infer<typeof pricingSchema>;

interface DumpsterPricingManagerProps {
  dumpsterId: number;
  dumpsterName: string;
}

export function DumpsterPricingManager({ dumpsterId, dumpsterName }: DumpsterPricingManagerProps) {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPricing, setSelectedPricing] = useState<DumpsterPricing | null>(null);

  // Fetch pricing for this dumpster
  const { data: pricing, isLoading } = useQuery<DumpsterPricing[]>({
    queryKey: ["/api/dumpster-pricing", dumpsterId],
  });

  // Create form for adding new pricing
  const addForm = useForm<PricingFormData>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      days: 7,
      price: 0,
    },
  });

  // Create form for editing pricing
  const editForm = useForm<PricingFormData>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      days: 7,
      price: 0,
    },
  });

  // Add pricing mutation
  const addPricingMutation = useMutation({
    mutationFn: async (data: PricingFormData) => {
      const formattedData: InsertDumpsterPricing = {
        dumpsterId,
        days: data.days,
        price: data.price * 100, // Convert to cents
      };
      
      const response = await apiRequest("POST", "/api/dumpster-pricing", formattedData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dumpster-pricing", dumpsterId] });
      setIsAddDialogOpen(false);
      addForm.reset();
      toast({
        title: "Pricing added",
        description: "The pricing option has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add pricing: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Edit pricing mutation
  const editPricingMutation = useMutation({
    mutationFn: async (data: PricingFormData & { id: number }) => {
      const { id, ...rest } = data;
      const formattedData = {
        ...rest,
        price: rest.price * 100, // Convert to cents
      };
      
      const response = await apiRequest("PUT", `/api/dumpster-pricing/${id}`, formattedData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dumpster-pricing", dumpsterId] });
      setIsEditDialogOpen(false);
      setSelectedPricing(null);
      toast({
        title: "Pricing updated",
        description: "The pricing option has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update pricing: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete pricing mutation
  const deletePricingMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/dumpster-pricing/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dumpster-pricing", dumpsterId] });
      toast({
        title: "Pricing deleted",
        description: "The pricing option has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete pricing: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onAddSubmit = (data: PricingFormData) => {
    addPricingMutation.mutate(data);
  };

  const onEditSubmit = (data: PricingFormData) => {
    if (selectedPricing) {
      editPricingMutation.mutate({ ...data, id: selectedPricing.id });
    }
  };

  const handleEdit = (pricingItem: DumpsterPricing) => {
    setSelectedPricing(pricingItem);
    editForm.reset({
      days: pricingItem.days,
      price: pricingItem.price / 100, // Convert from cents
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deletePricingMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">Pricing Options</CardTitle>
            <CardDescription>
              Set custom rental duration pricing for {dumpsterName}
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> Add Pricing
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Pricing Option</DialogTitle>
                <DialogDescription>
                  Set a custom price for a specific rental duration.
                </DialogDescription>
              </DialogHeader>
              <Form {...addForm}>
                <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
                  <FormField
                    control={addForm.control}
                    name="days"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rental Duration (Days)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            max="365"
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
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
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={addPricingMutation.isPending}
                    >
                      {addPricingMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Add Pricing
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {pricing && pricing.length > 0 ? (
          <div className="space-y-3">
            {pricing
              .sort((a, b) => a.days - b.days)
              .map((pricingItem) => (
                <div 
                  key={pricingItem.id} 
                  className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                >
                  <div>
                    <p className="font-medium">
                      {pricingItem.days} day{pricingItem.days !== 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-gray-600">
                      ${(pricingItem.price / 100).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEdit(pricingItem)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the {pricingItem.days}-day pricing option. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(pricingItem.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No custom pricing options set. Using base price for all durations.
          </p>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Pricing Option</DialogTitle>
              <DialogDescription>
                Update the pricing for this rental duration.
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rental Duration (Days)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          max="365"
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
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
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={editPricingMutation.isPending}
                  >
                    {editPricingMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Update Pricing
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}