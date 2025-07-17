import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/ui/admin-layout";
import { Plus, MapPin, Star, Edit, Trash2 } from "lucide-react";
import { Hub, InsertHub } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertHubSchema } from "@shared/schema";
import { z } from "zod";
import { GooglePlacesAutocomplete } from "@/components/booking/google-places-autocomplete";

const hubFormSchema = insertHubSchema.extend({
  name: z.string().min(1, "Hub name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "ZIP code is required"),
});

type HubFormData = z.infer<typeof hubFormSchema>;

interface PlaceData {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates: { lat: number; lng: number };
}

export default function HubsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingHub, setEditingHub] = useState<Hub | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceData | null>(null);

  const { data: hubs = [], isLoading } = useQuery<Hub[]>({
    queryKey: ['/api/hubs'],
  });

  const form = useForm<HubFormData>({
    resolver: zodResolver(hubFormSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      isMainHub: false,
      isActive: true,
    },
  });

  const createHubMutation = useMutation({
    mutationFn: async (data: HubFormData & { lat?: number; lng?: number }) => {
      // Create hub with coordinates (already provided by Google Places)
      return await apiRequest('POST', '/api/hubs', {
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        lat: data.lat,
        lng: data.lng,
        isMainHub: data.isMainHub,
        isActive: data.isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hubs'] });
      toast({
        title: "Hub Created",
        description: "New hub location has been added successfully.",
      });
      setShowAddForm(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create hub. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateHubMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: HubFormData }) => {
      // First geocode the address if it changed
      const geocodeResponse = await apiRequest('POST', '/api/hubs/geocode', {
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
      });
      
      const coordinates = await geocodeResponse.json();
      
      // Update hub with new coordinates
      return await apiRequest('PUT', `/api/hubs/${id}`, {
        ...data,
        lat: coordinates.lat,
        lng: coordinates.lng,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hubs'] });
      toast({
        title: "Hub Updated",
        description: "Hub location has been updated successfully.",
      });
      setEditingHub(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update hub. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteHubMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/hubs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hubs'] });
      toast({
        title: "Hub Deleted",
        description: "Hub location has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete hub. Please try again.",
        variant: "destructive",
      });
    },
  });

  const setMainHubMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('POST', `/api/hubs/${id}/set-main`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hubs'] });
      toast({
        title: "Main Hub Set",
        description: "This hub is now your main location.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to set main hub. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: HubFormData) => {
    if (!selectedPlace && !editingHub) {
      toast({
        title: "Address Required",
        description: "Please select a valid address from the suggestions.",
        variant: "destructive",
      });
      return;
    }

    if (editingHub) {
      updateHubMutation.mutate({ id: editingHub.id, data });
    } else {
      createHubMutation.mutate({
        ...data,
        lat: selectedPlace?.coordinates.lat,
        lng: selectedPlace?.coordinates.lng,
      });
    }
  };

  const handlePlaceSelect = (place: PlaceData) => {
    
    setSelectedPlace(place);
    
    // Use setTimeout to ensure form updates are processed
    setTimeout(() => {
      form.setValue("address", place.address);
      form.setValue("city", place.city);
      form.setValue("state", place.state);
      form.setValue("zipCode", place.zipCode);
      
      // Trigger form validation
      form.trigger(["address", "city", "state", "zipCode"]);
    }, 100);
  };

  const handleEdit = (hub: Hub) => {
    setEditingHub(hub);
    setShowAddForm(true);
    form.reset({
      name: hub.name,
      address: hub.address,
      city: hub.city,
      state: hub.state,
      zipCode: hub.zipCode,
      isMainHub: hub.isMainHub,
      isActive: hub.isActive,
    });
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingHub(null);
    setSelectedPlace(null);
    form.reset();
  };

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Hub Locations</h1>
            <p className="text-muted-foreground">
              Manage your dumpster storage locations
            </p>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Hub Location
          </Button>
        </div>

        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingHub ? "Edit Hub Location" : "Add New Hub Location"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Hub Name</Label>
                    <Input
                      id="name"
                      placeholder="Main Warehouse"
                      {...form.register("name")}
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <GooglePlacesAutocomplete
                      onPlaceSelect={handlePlaceSelect}
                      placeholder="Start typing an address..."
                      value=""
                      className="w-full"
                    />
                    {selectedPlace && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                        <span className="font-medium text-green-800">Selected: </span>
                        <span className="text-green-700">
                          {selectedPlace.address}, {selectedPlace.city}, {selectedPlace.state} {selectedPlace.zipCode}
                        </span>
                      </div>
                    )}
                    {form.formState.errors.address && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.address.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="Auto-filled from address"
                      {...form.register("city")}
                      readOnly
                      className="bg-gray-50"
                    />
                    {form.formState.errors.city && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.city.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      placeholder="Auto-filled"
                      {...form.register("state")}
                      readOnly
                      className="bg-gray-50"
                    />
                    {form.formState.errors.state && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.state.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      placeholder="Auto-filled"
                      {...form.register("zipCode")}
                      readOnly
                      className="bg-gray-50"
                    />
                    {form.formState.errors.zipCode && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.zipCode.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isMainHub"
                        {...form.register("isMainHub")}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="isMainHub">Set as Main Hub</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Set this as your main hub location
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="submit"
                    disabled={createHubMutation.isPending || updateHubMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {editingHub ? "Update Hub" : "Create Hub"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {hubs.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Hub Locations</h3>
                  <p className="text-muted-foreground mb-4">
                    Add your first hub location to track your dumpster storage facilities.
                  </p>
                  <Button onClick={() => setShowAddForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Hub
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            hubs.map((hub) => (
              <Card key={hub.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-medium">{hub.name}</h3>
                        {hub.isMainHub && (
                          <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
                            <Star className="h-3 w-3 mr-1" />
                            Main Hub
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>{hub.address}</p>
                        <p>{hub.city}, {hub.state} {hub.zipCode}</p>
                        {hub.lat && hub.lng && (
                          <p>Coordinates: {hub.lat.toFixed(6)}, {hub.lng.toFixed(6)}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      {!hub.isMainHub && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setMainHubMutation.mutate(hub.id)}
                          disabled={setMainHubMutation.isPending}
                          className="w-full sm:w-auto"
                        >
                          <Star className="h-4 w-4 mr-2" />
                          Set as Main
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(hub)}
                        className="w-full sm:w-auto"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteHubMutation.mutate(hub.id)}
                        disabled={deleteHubMutation.isPending}
                        className="w-full sm:w-auto text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}