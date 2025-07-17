import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminLayout } from "@/components/ui/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit2, Trash2, Settings, DollarSign, Calculator } from "lucide-react";

const serviceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  description: z.string().min(1, "Description is required"),
  pricingType: z.enum(["flat", "variable"], {
    required_error: "Please select a pricing type",
  }),
  flatPrice: z.coerce.number().min(0, "Price must be positive").optional(),
  variableConfig: z.object({
    basePrice: z.coerce.number().min(0, "Base price must be positive").optional(),
    multiplierField: z.string().optional(),
    multiplierRate: z.coerce.number().min(0, "Multiplier rate must be positive").optional(),
    conditions: z.array(z.object({
      field: z.string(),
      operator: z.enum(["equals", "greater_than", "less_than", "contains"]),
      value: z.string(),
      additionalPrice: z.coerce.number(),
    })).optional(),
  }).optional(),
  isActive: z.boolean().default(true),
  category: z.string().optional(),
  sortOrder: z.coerce.number().default(0),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

interface Service {
  id: number;
  name: string;
  description: string;
  pricingType: "flat" | "variable";
  flatPrice?: number;
  variableConfig?: {
    basePrice?: number;
    multiplierField?: string;
    multiplierRate?: number;
    conditions?: Array<{
      field: string;
      operator: "equals" | "greater_than" | "less_than" | "contains";
      value: string;
      additionalPrice: number;
    }>;
  };
  isActive: boolean;
  category?: string;
  sortOrder: number;
  createdAt: string;
}

export default function ServicesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["/api/admin/services"],
  });

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      description: "",
      pricingType: "flat",
      flatPrice: 0,
      variableConfig: {
        basePrice: 0,
        multiplierField: "",
        multiplierRate: 1,
        conditions: [],
      },
      isActive: true,
      category: "",
      sortOrder: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ServiceFormData) => {
      await apiRequest("POST", "/api/admin/services", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Service Created",
        description: "The service has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create service. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ServiceFormData & { id: number }) => {
      await apiRequest("PUT", `/api/admin/services/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      setIsEditDialogOpen(false);
      setEditingService(null);
      form.reset();
      toast({
        title: "Service Updated",
        description: "The service has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update service. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/services/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      toast({
        title: "Service Deleted",
        description: "The service has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete service. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ServiceFormData) => {
    if (editingService) {
      updateMutation.mutate({ ...data, id: editingService.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    form.reset({
      name: service.name,
      description: service.description,
      pricingType: service.pricingType,
      flatPrice: service.flatPrice || 0,
      variableConfig: service.variableConfig || {
        basePrice: 0,
        multiplierField: "",
        multiplierRate: 1,
        conditions: [],
      },
      isActive: service.isActive,
      category: service.category || "",
      sortOrder: service.sortOrder,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const watchPricingType = form.watch("pricingType");

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Services</h1>
            <p className="text-muted-foreground">
              Manage additional services with flexible pricing options.
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Service</DialogTitle>
                <DialogDescription>
                  Create a new service with customizable pricing options.
                </DialogDescription>
              </DialogHeader>
              <ServiceForm
                form={form}
                onSubmit={onSubmit}
                isSubmitting={createMutation.isPending}
                watchPricingType={watchPricingType}
              />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Services Overview</CardTitle>
            <CardDescription>
              Manage your additional services and their pricing configurations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {services && services.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Pricing Type</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{service.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {service.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={service.pricingType === "flat" ? "default" : "secondary"}>
                          {service.pricingType === "flat" ? "Flat Rate" : "Variable"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {service.pricingType === "flat" ? (
                          `$${((service.flatPrice || 0) / 100).toFixed(2)}`
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Base: ${((service.variableConfig?.basePrice || 0) / 100).toFixed(2)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={service.isActive ? "default" : "secondary"}>
                          {service.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {service.category && (
                          <Badge variant="outline">{service.category}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(service)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Service</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{service.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(service.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <Settings className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium">No services</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Get started by creating your first service.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Service</DialogTitle>
              <DialogDescription>
                Update the service details and pricing configuration.
              </DialogDescription>
            </DialogHeader>
            <ServiceForm
              form={form}
              onSubmit={onSubmit}
              isSubmitting={updateMutation.isPending}
              watchPricingType={watchPricingType}
            />
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

interface ServiceFormProps {
  form: any;
  onSubmit: (data: ServiceFormData) => void;
  isSubmitting: boolean;
  watchPricingType: "flat" | "variable";
}

function ServiceForm({ form, onSubmit, isSubmitting, watchPricingType }: ServiceFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Priority Pickup" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Delivery, Pickup" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe what this service provides..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pricingType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pricing Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pricing type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="flat">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Flat Rate - Fixed price
                    </div>
                  </SelectItem>
                  <SelectItem value="variable">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Variable - Based on form selections
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Choose how this service should be priced for customers.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {watchPricingType === "flat" && (
          <FormField
            control={form.control}
            name="flatPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (in cents)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g., 2500 for $25.00"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Enter the price in cents (e.g., 2500 for $25.00).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {watchPricingType === "variable" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Variable Pricing Configuration</CardTitle>
              <CardDescription>
                Set up dynamic pricing based on customer form selections.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="variableConfig.basePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Price (in cents)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 1000 for $10.00 base"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The starting price before any multipliers or conditions.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="variableConfig.multiplierField"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Multiplier Field (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="dumpster_size">Dumpster Size</SelectItem>
                          <SelectItem value="rental_duration">Rental Duration</SelectItem>
                          <SelectItem value="delivery_distance">Delivery Distance</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Field to use for price multiplication.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="variableConfig.multiplierRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Multiplier Rate</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="e.g., 1.5"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Rate to multiply the base price.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="sortOrder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sort Order</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Lower numbers appear first in the list.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active</FormLabel>
                  <FormDescription>
                    Make this service available to customers.
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
        </div>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Service"}
          </Button>
        </div>
      </form>
    </Form>
  );
}