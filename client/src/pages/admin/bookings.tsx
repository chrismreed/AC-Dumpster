import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/ui/admin-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Booking, Dumpster, AddOn, ServiceZone, RentalDuration, DumpsterPricing, Hub } from "@shared/schema";
import { Loader2, Eye, Package, MapPin, Calendar, Phone, Mail, DollarSign, List, Trash2, Settings, Building2, Users } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { BookingCalendar } from "@/components/admin/booking-calendar";
import { DeliveryMap } from "@/components/admin/maps/delivery-map";
import { Label } from "@/components/ui/label";

export default function BookingsPage() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isDropOffDialogOpen, setIsDropOffDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingToComplete, setBookingToComplete] = useState<Booking | null>(null);
  const [selectedDropOffType, setSelectedDropOffType] = useState<string>("");
  const [selectedHubId, setSelectedHubId] = useState<string>("");
  const [selectedCustomerBookingId, setSelectedCustomerBookingId] = useState<string>("");
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [selectedBookings, setSelectedBookings] = useState<Set<number>>(new Set());
  const [expandedBookings, setExpandedBookings] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState<string>("deliveryDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  // Define status progression order
  const statusOrder = [
    { value: "pending", label: "Pending", step: 1 },
    { value: "confirmed", label: "Confirmed", step: 2 },
    { value: "delivered", label: "Delivered", step: 3 },
    { value: "picked_up", label: "Picked Up", step: 4 },
    { value: "complete", label: "Complete", step: 5 },
    { value: "cancelled", label: "Cancelled", step: 0 }, // Special case - can happen at any time
  ];

  // Helper function to get current step number for a status
  const getCurrentStep = (status: string) => {
    return statusOrder.find(s => s.value === status)?.step || 0;
  };

  // Helper function to determine if a status should be struck through
  const isStatusCompleted = (statusValue: string, currentStatus: string) => {
    const statusStep = statusOrder.find(s => s.value === statusValue)?.step || 0;
    const currentStep = getCurrentStep(currentStatus);
    
    // Don't strike through cancelled status
    if (statusValue === "cancelled") return false;
    
    // Strike through if current step is higher than this status step
    return currentStep > statusStep && statusStep > 0;
  };

  // Fetch bookings and related data
  const { data: bookings, isLoading: isLoadingBookings } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const { data: dumpsters } = useQuery<Dumpster[]>({
    queryKey: ["/api/dumpsters"],
  });

  const { data: addons } = useQuery<AddOn[]>({
    queryKey: ["/api/addons"],
  });

  const { data: zones } = useQuery<ServiceZone[]>({
    queryKey: ["/api/zones"],
  });

  const { data: durations } = useQuery<RentalDuration[]>({
    queryKey: ["/api/durations"],
  });

  const { data: allPricing } = useQuery<DumpsterPricing[]>({
    queryKey: ["/api/dumpster-pricing/all"],
  });

  const { data: hubs } = useQuery<Hub[]>({
    queryKey: ["/api/hubs"],
  });

  // Update booking status mutation
  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      try {
        const response = await apiRequest("PUT", `/api/bookings/${id}`, { status });
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error updating booking:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      setIsViewDialogOpen(false);
      toast({
        title: "Booking updated",
        description: "The booking status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Mutation error:", error);
      toast({
        title: "Error",
        description: `Failed to update booking: ${error?.message || "Unknown error"}`,
        variant: "destructive",
      });
    },
  });

  // Delete booking mutation
  const deleteBookingMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/bookings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      setIsDeleteDialogOpen(false);
      setBookingToDelete(null);
      toast({
        title: "Booking deleted",
        description: "The booking has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const promises = ids.map(id => apiRequest("DELETE", `/api/bookings/${id}`));
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      setIsBulkDeleteDialogOpen(false);
      setSelectedBookings(new Set());
      toast({
        title: "Bookings deleted",
        description: `${selectedBookings.size} bookings have been deleted successfully.`,
      });
    },
    onError: (error: any) => {
      console.error("Bulk delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete some bookings. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Bulk status update mutation
  const bulkStatusUpdateMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: number[]; status: string }) => {
      const promises = ids.map(id => apiRequest("PUT", `/api/bookings/${id}`, { status }));
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      setSelectedBookings(new Set());
      toast({
        title: "Bookings updated",
        description: `${selectedBookings.size} bookings have been updated successfully.`,
      });
    },
    onError: (error: any) => {
      console.error("Bulk status update error:", error);
      toast({
        title: "Error",
        description: "Failed to update some bookings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsViewDialogOpen(true);
  };

  const handleStatusChange = (id: number, status: string) => {
    try {
      // If changing to "complete", show drop-off location selection dialog
      if (status === "complete") {
        const booking = bookings?.find(b => b.id === id);
        if (booking) {
          setBookingToComplete(booking);
          setSelectedDropOffType("");
          setSelectedHubId("");
          setSelectedCustomerBookingId("");
          setIsDropOffDialogOpen(true);
          return; // Don't update status yet, wait for drop-off selection
        }
      }
      
      updateBookingStatusMutation.mutate({ id, status });
    } catch (error) {
      console.error("Error in handleStatusChange:", error);
      toast({
        title: "Error",
        description: "Failed to update booking status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBooking = (booking: Booking) => {
    setBookingToDelete(booking);
    setIsDeleteDialogOpen(true);
  };

  const handleCompleteBooking = () => {
    if (!bookingToComplete || !selectedDropOffType) {
      toast({
        title: "Selection Required",
        description: "Please select where the dumpster should be dropped off.",
        variant: "destructive",
      });
      return;
    }

    if (selectedDropOffType === "hub" && !selectedHubId) {
      toast({
        title: "Hub Selection Required",
        description: "Please select which hub to drop off the dumpster.",
        variant: "destructive",
      });
      return;
    }

    if (selectedDropOffType === "customer" && !selectedCustomerBookingId) {
      toast({
        title: "Customer Selection Required",
        description: "Please select which customer to deliver the dumpster to.",
        variant: "destructive",
      });
      return;
    }

    // Update booking status to complete
    updateBookingStatusMutation.mutate({ 
      id: bookingToComplete.id, 
      status: "complete" 
    });

    // Close dialog and reset state
    setIsDropOffDialogOpen(false);
    setBookingToComplete(null);
    setSelectedDropOffType("");
    setSelectedHubId("");
    setSelectedCustomerBookingId("");

    toast({
      title: "Booking Completed",
      description: `Dumpster scheduled for drop-off at ${selectedDropOffType === "hub" ? "hub" : "customer location"}.`,
    });
  };

  const confirmDeleteBooking = () => {
    if (bookingToDelete) {
      deleteBookingMutation.mutate(bookingToDelete.id);
    }
  };

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsViewDialogOpen(true);
  };

  const handleSelectBooking = (bookingId: number, checked: boolean) => {
    const newSelected = new Set(selectedBookings);
    if (checked) {
      newSelected.add(bookingId);
    } else {
      newSelected.delete(bookingId);
    }
    setSelectedBookings(newSelected);
  };

  const toggleExpandedBooking = (bookingId: number) => {
    const newExpanded = new Set(expandedBookings);
    if (newExpanded.has(bookingId)) {
      newExpanded.delete(bookingId);
    } else {
      newExpanded.add(bookingId);
    }
    setExpandedBookings(newExpanded);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(sortedAndFilteredBookings.map(booking => booking.id));
      setSelectedBookings(allIds);
    } else {
      setSelectedBookings(new Set());
    }
  };

  const handleBulkStatusChange = (status: string) => {
    const selectedIds = Array.from(selectedBookings);
    if (selectedIds.length > 0) {
      bulkStatusUpdateMutation.mutate({ ids: selectedIds, status });
    }
  };

  const handleBulkDelete = () => {
    if (selectedBookings.size > 0) {
      setIsBulkDeleteDialogOpen(true);
    }
  };

  const confirmBulkDelete = () => {
    const selectedIds = Array.from(selectedBookings);
    if (selectedIds.length > 0) {
      bulkDeleteMutation.mutate(selectedIds);
    }
  };

  // Filter and sort bookings
  const sortedAndFilteredBookings = useMemo(() => {
    if (!bookings) return [];
    
    // First filter by status
    let result = bookings.filter((booking) => {
      if (statusFilter === "all") return true;
      return booking.status === statusFilter;
    });

    // Then sort by the selected field
    result = [...result].sort((a, b) => {
      if (sortBy === "deliveryDate") {
        const dateA = new Date(a.deliveryDate).getTime();
        const dateB = new Date(b.deliveryDate).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      } else if (sortBy === "pickupDate") {
        // Calculate pickup dates for comparison
        const durationDaysA = allPricing?.find(p => p.id === a.pricingId)?.days || 7;
        const durationDaysB = allPricing?.find(p => p.id === b.pricingId)?.days || 7;
        
        const deliveryA = new Date(a.deliveryDate);
        const deliveryB = new Date(b.deliveryDate);
        const pickupA = new Date(deliveryA);
        const pickupB = new Date(deliveryB);
        pickupA.setDate(deliveryA.getDate() + Number(durationDaysA));
        pickupB.setDate(deliveryB.getDate() + Number(durationDaysB));
        
        return sortOrder === "asc" ? pickupA.getTime() - pickupB.getTime() : pickupB.getTime() - pickupA.getTime();
      } else if (sortBy === "createdAt") {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      } else if (sortBy === "id") {
        return sortOrder === "asc" ? a.id - b.id : b.id - a.id;
      }
      
      // Default sort by ID
      return sortOrder === "asc" ? a.id - b.id : b.id - a.id;
    });
    
    return result;
  }, [bookings, statusFilter, sortBy, sortOrder, allPricing]);

  // Get related data for a booking
  const getDumpsterName = (id: number) => {
    return dumpsters?.find(d => d.id === id)?.name || `Dumpster #${id}`;
  };

  const getDurationDays = (pricingId: number) => {
    return allPricing?.find(p => p.id === pricingId)?.days || "N/A";
  };

  const getPickupDate = (deliveryDate: string | Date, pricingId: number) => {
    const durationDays = getDurationDays(pricingId);
    if (durationDays === "N/A") return "N/A";
    
    const delivery = typeof deliveryDate === 'string' ? new Date(deliveryDate) : deliveryDate;
    const pickup = new Date(delivery);
    pickup.setDate(delivery.getDate() + Number(durationDays));
    
    return pickup.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getZoneName = (id: number) => {
    return zones?.find(z => z.id === id)?.name || `Zone #${id}`;
  };

  const getAddonNames = (addonIds: any) => {
    if (!addonIds || !addons) return "None";
    
    try {
      const selectedAddons = Array.isArray(addonIds) 
        ? addonIds.map(item => {
            const addon = addons.find(a => a.id === item.addonId);
            return addon ? `${addon.name}${item.quantity > 1 ? ` (x${item.quantity})` : ''}` : null;
          }).filter(Boolean)
        : [];
      
      return selectedAddons.length > 0 ? selectedAddons.join(", ") : "None";
    } catch (e) {
      return "Error parsing add-ons";
    }
  };

  // Format date for display
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get badge style based on booking status to match map colors
  const getBadgeStyle = (status: string): React.CSSProperties => {
    switch (status) {
      case 'pending':
        return { backgroundColor: '#f59e0b', color: 'white', border: 'none' };
      case 'confirmed':
        return { backgroundColor: '#10b981', color: 'white', border: 'none' };
      case 'delivered':
        return { backgroundColor: '#3b82f6', color: 'white', border: 'none' };
      case 'picked_up':
        return { backgroundColor: '#8b5cf6', color: 'white', border: 'none' };
      case 'complete':
        return { backgroundColor: '#059669', color: 'white', border: 'none' };
      case 'cancelled':
        return { backgroundColor: '#ef4444', color: 'white', border: 'none' };
      default:
        return { backgroundColor: '#6b7280', color: 'white', border: 'none' };
    }
  };

  // Get status badge with matching colors
  const getStatusBadge = (status: string) => {
    const displayText = status === 'picked_up' ? 'Picked Up' : status.charAt(0).toUpperCase() + status.slice(1);
    return <Badge style={getBadgeStyle(status)}>{displayText}</Badge>;
  };

  if (isLoadingBookings) {
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
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Bookings</h1>
            <p className="text-gray-500 text-sm">Manage and track all your dumpster rental bookings</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Filter by status:</span>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bookings</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="picked_up">Picked Up</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Booking Details Dialog */}
        {selectedBooking && (
          <Dialog 
            open={isViewDialogOpen} 
            onOpenChange={setIsViewDialogOpen}
            modal={true}
          >
            <DialogContent 
              className="max-w-4xl max-h-[90vh] overflow-y-auto"
              onEscapeKeyDown={() => setIsViewDialogOpen(false)}
              onPointerDownOutside={() => setIsViewDialogOpen(false)}
            >
              <DialogHeader>
                <DialogTitle>Booking Details</DialogTitle>
                <DialogDescription>
                  View and manage booking #{selectedBooking.id}
                </DialogDescription>
              </DialogHeader>
              
              {/* Consolidated booking information in a single comprehensive view */}
              <div className="space-y-4">
                {/* Customer & Contact and Service Order - Top Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center">
                        <Phone className="mr-2 h-4 w-4" />
                        Customer & Contact
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <h3 className="font-semibold">{selectedBooking.customerName}</h3>
                      </div>
                      <div className="flex items-center text-sm">
                        <Mail className="h-3 w-3 mr-2 text-muted-foreground" />
                        <a href={`mailto:${selectedBooking.customerEmail}`} className="text-primary hover:underline text-xs">
                          {selectedBooking.customerEmail}
                        </a>
                      </div>
                      <div className="flex items-center text-sm">
                        <Phone className="h-3 w-3 mr-2 text-muted-foreground" />
                        <a href={`tel:${selectedBooking.customerPhone}`} className="text-primary hover:underline text-xs">
                          {selectedBooking.customerPhone}
                        </a>
                      </div>
                      <div className="pt-1 border-t">
                        <div className="text-xs text-muted-foreground">Booked: {formatDate(selectedBooking.createdAt)}</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center">
                        <Package className="mr-2 h-4 w-4" />
                        Service Order
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dumpster:</span>
                        <span className="font-medium">{getDumpsterName(selectedBooking.dumpsterId)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="font-medium">{getDurationDays(selectedBooking.pricingId)} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Service Zone:</span>
                        <span className="font-medium">{getZoneName(selectedBooking.serviceZoneId)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Add-ons:</span>
                        <span className="font-medium">{getAddonNames(selectedBooking.selectedAddOns)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Logistics - Middle Row */}
                <div className="grid grid-cols-1 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center">
                        <MapPin className="mr-2 h-4 w-4" />
                        Logistics & Delivery
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <span className="text-muted-foreground text-xs">Delivery Date:</span>
                          <div className="font-medium text-sm">{formatDate(selectedBooking.deliveryDate)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">Pickup Date:</span>
                          <div className="font-medium text-sm">{getPickupDate(selectedBooking.deliveryDate, selectedBooking.pricingId)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">Time Preference:</span>
                          <div className="font-medium text-sm">{selectedBooking.deliveryTimePreference}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">Placement:</span>
                          <div className="font-medium text-sm">{selectedBooking.placementLocation}</div>
                        </div>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Delivery Address</div>
                            <div className="font-medium text-sm">{selectedBooking.deliveryAddress}</div>
                            <div className="text-muted-foreground text-xs">{selectedBooking.deliveryCity}, {selectedBooking.deliveryZipCode}</div>
                          </div>
                          <div className="flex items-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full h-8 text-xs"
                              onClick={() => {
                                const address = `${selectedBooking.deliveryAddress}, ${selectedBooking.deliveryCity}, ${selectedBooking.deliveryZipCode}`;
                                const encodedAddress = encodeURIComponent(address);
                                window.open(`https://maps.google.com/maps?q=${encodedAddress}`, '_blank');
                              }}
                            >
                              <MapPin className="h-3 w-3 mr-1" />
                              Navigate to Address
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Operations and Financial - Bottom Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center">
                        <Eye className="mr-2 h-4 w-4" />
                        Operations & Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Current Status:</span>
                        <span>{getStatusBadge(selectedBooking.status)}</span>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-2">Update Status</div>
                        <Select
                          value={selectedBooking.status}
                          onValueChange={(value) => handleStatusChange(selectedBooking.id, value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Change status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="picked_up">Picked Up</SelectItem>
                            <SelectItem value="complete">Complete</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center">
                        <DollarSign className="mr-2 h-4 w-4" />
                        Financial Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Payment Status:</span>
                        <Badge className={selectedBooking.paymentStatus === 'paid' ? 'bg-green-500' : 'bg-yellow-500'}>
                          {selectedBooking.paymentStatus.charAt(0).toUpperCase() + selectedBooking.paymentStatus.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Total Amount:</span>
                        <span className="text-xl font-bold">${(selectedBooking.totalPrice / 100).toFixed(2)}</span>
                      </div>
                      {selectedBooking.stripePaymentIntentId && (
                        <div className="pt-2 border-t">
                          <div className="text-xs text-muted-foreground mb-1">Payment ID</div>
                          <div className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
                            {selectedBooking.stripePaymentIntentId}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Delivery Instructions if present */}
                {selectedBooking.deliveryInstructions && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Delivery Instructions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm italic bg-gray-50 p-2 rounded">{selectedBooking.deliveryInstructions}</div>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              <DialogFooter>
                <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Confirmation Dialog */}
        {bookingToDelete && (
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Booking</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete booking #{bookingToDelete.id}?
                  This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <div className="space-y-2">
                  <p><strong>Customer:</strong> {bookingToDelete.customerName}</p>
                  <p><strong>Email:</strong> {bookingToDelete.customerEmail}</p>
                  <p><strong>Delivery Date:</strong> {formatDate(bookingToDelete.deliveryDate)}</p>
                  <p><strong>Status:</strong> {getStatusBadge(bookingToDelete.status)}</p>
                  <p><strong>Total:</strong> ${(bookingToDelete.totalPrice / 100).toFixed(2)}</p>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDeleteDialogOpen(false)}
                  disabled={deleteBookingMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmDeleteBooking}
                  disabled={deleteBookingMutation.isPending}
                >
                  {deleteBookingMutation.isPending ? "Deleting..." : "Delete Booking"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Bulk Delete Confirmation Dialog */}
        <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Multiple Bookings</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedBookings.size} booking{selectedBookings.size !== 1 ? 's' : ''}?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                This will permanently remove the selected bookings from the system.
              </p>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsBulkDeleteDialogOpen(false)}
                disabled={bulkDeleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmBulkDelete}
                disabled={bulkDeleteMutation.isPending}
              >
                {bulkDeleteMutation.isPending ? "Deleting..." : `Delete ${selectedBookings.size} Booking${selectedBookings.size !== 1 ? 's' : ''}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Tabs defaultValue="list" className="w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <TabsList className="w-full md:w-auto grid grid-cols-3 gap-1 p-1">
              <TabsTrigger value="list" className="flex items-center justify-center px-2 py-2 text-xs md:text-sm">
                <List className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">List View</span>
                <span className="sm:hidden">List</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center justify-center px-2 py-2 text-xs md:text-sm">
                <Calendar className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Calendar View</span>
                <span className="sm:hidden">Calendar</span>
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center justify-center px-2 py-2 text-xs md:text-sm">
                <MapPin className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Delivery Map</span>
                <span className="sm:hidden">Map</span>
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <span className="text-sm whitespace-nowrap">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">ID</SelectItem>
                  <SelectItem value="deliveryDate">Delivery Date</SelectItem>
                  <SelectItem value="createdAt">Booking Date</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline" 
                size="icon" 
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                title={sortOrder === "asc" ? "Ascending" : "Descending"}
              >
                {sortOrder === "asc" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/><path d="M11 12h10"/><path d="M11 16h7"/><path d="M11 20h4"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="M11 12h10"/><path d="M11 16h7"/><path d="M11 20h4"/></svg>
                )}
              </Button>
            </div>
          </div>
          
          <TabsContent value="calendar" className="mt-6">
            {isLoadingBookings || !bookings || !dumpsters || !durations || !allPricing ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <BookingCalendar 
                bookings={bookings} 
                dumpsters={dumpsters} 
                durations={durations}
                allPricing={allPricing}
              />
            )}
          </TabsContent>
          
          <TabsContent value="list" className="mt-6">
            {/* Bulk Actions Toolbar */}
            {selectedBookings.size > 0 && (
              <Card className="mb-4 border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {selectedBookings.size} booking{selectedBookings.size !== 1 ? 's' : ''} selected
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedBookings(new Set())}
                      >
                        Clear Selection
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Select onValueChange={handleBulkStatusChange}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Change Status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOrder.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              <span className="flex items-center gap-2">
                                {status.step > 0 && (
                                  <span className="flex-shrink-0 w-4 h-4 bg-gray-200 text-gray-700 rounded-full text-xs flex items-center justify-center font-medium">
                                    {status.step}
                                  </span>
                                )}
                                <span>{status.label}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={handleBulkDelete}
                        disabled={bulkDeleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete Selected
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {statusFilter === 'all' ? 'All Bookings' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Bookings`}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="rounded-md border">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8">
                          <Checkbox
                            checked={selectedBookings.size === sortedAndFilteredBookings.length && sortedAndFilteredBookings.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead 
                          className="w-12 cursor-pointer hover:text-primary"
                          onClick={() => {
                            if (sortBy === "id") {
                              setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                            } else {
                              setSortBy("id");
                              setSortOrder("asc");
                            }
                          }}
                        >
                          <div className="flex items-center">
                            ID
                            {sortBy === "id" && (
                              <span className="ml-1">
                                {sortOrder === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="min-w-[100px]">Customer</TableHead>
                        <TableHead className="hidden lg:table-cell w-16">Size</TableHead>
                        <TableHead 
                          className="w-20 cursor-pointer hover:text-primary"
                          onClick={() => {
                            if (sortBy === "deliveryDate") {
                              setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                            } else {
                              setSortBy("deliveryDate");
                              setSortOrder("asc");
                            }
                          }}
                        >
                          <div className="flex items-center">
                            Date
                            {sortBy === "deliveryDate" && (
                              <span className="ml-1">
                                {sortOrder === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="hidden xl:table-cell w-24">Location</TableHead>
                        <TableHead className="w-20">Status</TableHead>
                        <TableHead className="hidden md:table-cell w-16">Total</TableHead>
                        <TableHead className="w-12">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedAndFilteredBookings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8">
                            <p className="text-muted-foreground">No bookings found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        sortedAndFilteredBookings.map((booking) => (
                          <React.Fragment key={booking.id}>
                            <TableRow 
                              className="md:hover:bg-gray-50 cursor-pointer md:cursor-default"
                              onClick={() => {
                                // Only expand on mobile
                                if (window.innerWidth < 768) {
                                  toggleExpandedBooking(booking.id);
                                }
                              }}
                            >
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={selectedBookings.has(booking.id)}
                                  onCheckedChange={(checked) => handleSelectBooking(booking.id, checked as boolean)}
                                />
                              </TableCell>
                              <TableCell className="text-xs">{booking.id}</TableCell>
                              <TableCell className="text-xs">{booking.customerName}</TableCell>
                              <TableCell className="hidden lg:table-cell text-xs">{getDumpsterName(booking.dumpsterId)?.replace('Yard Dumpster', 'yd') || 'N/A'}</TableCell>
                              <TableCell className="text-xs">{formatDate(booking.deliveryDate)}</TableCell>
                              <TableCell className="hidden xl:table-cell text-xs">{booking.deliveryZipCode}</TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                {/* Mobile: Status dropdown */}
                                <div className="md:hidden">
                                  <Select 
                                    value={booking.status} 
                                    onValueChange={(value) => updateBookingStatusMutation.mutate({ id: booking.id, status: value })}
                                  >
                                    <SelectTrigger className="w-auto h-auto border-none p-0 shadow-none bg-transparent focus:ring-0">
                                      {getStatusBadge(booking.status)}
                                    </SelectTrigger>
                                    <SelectContent>
                                      {statusOrder.map((status) => (
                                        <SelectItem 
                                          key={status.value} 
                                          value={status.value}
                                          className={isStatusCompleted(status.value, booking.status) ? "line-through text-gray-400" : ""}
                                        >
                                          <span className="flex items-center gap-2">
                                            {status.step > 0 && (
                                              <span className="flex-shrink-0 w-4 h-4 bg-gray-200 text-gray-700 rounded-full text-xs flex items-center justify-center font-medium">
                                                {status.step}
                                              </span>
                                            )}
                                            <span className={isStatusCompleted(status.value, booking.status) ? "line-through" : ""}>
                                              {status.label}
                                            </span>
                                          </span>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                {/* Desktop: Status dropdown */}
                                <div className="hidden md:block">
                                  <Select 
                                    value={booking.status} 
                                    onValueChange={(value) => handleStatusChange(booking.id, value)}
                                  >
                                    <SelectTrigger className="w-24 h-7 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {statusOrder.map((status) => (
                                        <SelectItem 
                                          key={status.value} 
                                          value={status.value}
                                          className={isStatusCompleted(status.value, booking.status) ? "line-through text-gray-400" : ""}
                                        >
                                          <span className="flex items-center gap-2">
                                            {status.step > 0 && (
                                              <span className="flex-shrink-0 w-4 h-4 bg-gray-200 text-gray-700 rounded-full text-xs flex items-center justify-center font-medium">
                                                {status.step}
                                              </span>
                                            )}
                                            <span className={isStatusCompleted(status.value, booking.status) ? "line-through" : ""}>
                                              {status.label}
                                            </span>
                                          </span>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-xs">${(booking.totalPrice / 100).toFixed(2)}</TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <div className="flex gap-1">
                                  <Button 
                                    onClick={() => handleViewBooking(booking)}
                                    variant="outline"
                                    className="h-6 w-6 p-0"
                                    size="sm"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    onClick={() => {
                                      const address = `${booking.deliveryAddress}, ${booking.deliveryCity}, ${booking.deliveryZipCode}`;
                                      const mapsUrl = `https://maps.google.com/maps?daddr=${encodeURIComponent(address)}`;
                                      window.open(mapsUrl, '_blank');
                                    }}
                                    className="bg-[#f7c948] hover:bg-[#f7c948]/90 text-black h-6 w-6 p-0"
                                    size="sm"
                                  >
                                    <MapPin className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                            {/* Mobile Expanded Details */}
                            {expandedBookings.has(booking.id) && (
                              <TableRow className="md:hidden bg-gray-50">
                                <TableCell colSpan={8} className="p-4">
                                  <div className="space-y-3">
                                    {/* Customer Info */}
                                    <div>
                                      <h4 className="font-medium text-sm mb-2">Customer Information</h4>
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                          <span className="text-gray-500">Email:</span>
                                          <div>{booking.customerEmail}</div>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Phone:</span>
                                          <div>{booking.customerPhone}</div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Delivery Info */}
                                    <div>
                                      <h4 className="font-medium text-sm mb-2">Delivery Details</h4>
                                      <div className="text-xs space-y-1">
                                        <div>
                                          <span className="text-gray-500">Address:</span>
                                          <div>{booking.deliveryAddress}</div>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">City & ZIP:</span>
                                          <div>{booking.deliveryCity}, {booking.deliveryZipCode}</div>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Dumpster:</span>
                                          <div>{getDumpsterName(booking.dumpsterId)}</div>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Pickup Date:</span>
                                          <div>{getPickupDate(booking.deliveryDate, booking.pricingId)}</div>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Total:</span>
                                          <div className="font-medium">${(booking.totalPrice / 100).toFixed(2)}</div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="map" className="mt-4">
            <DeliveryMap bookings={sortedAndFilteredBookings} dumpsters={dumpsters || []} />
          </TabsContent>
        </Tabs>

        {/* Drop-off Location Selection Dialog */}
        {bookingToComplete && (
          <Dialog open={isDropOffDialogOpen} onOpenChange={setIsDropOffDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Complete Booking - Select Drop-off Location</DialogTitle>
                <DialogDescription>
                  Booking #{bookingToComplete.id} - {bookingToComplete.customerName}
                  <br />
                  Where should the dumpster be dropped off after pickup?
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Drop-off Type Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Drop-off Destination</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="hub-option"
                        name="dropoff-type"
                        value="hub"
                        checked={selectedDropOffType === "hub"}
                        onChange={(e) => setSelectedDropOffType(e.target.value)}
                        className="w-4 h-4 text-[#f7c948] border-gray-300"
                      />
                      <Label htmlFor="hub-option" className="flex items-center cursor-pointer">
                        <Building2 className="mr-2 h-4 w-4" />
                        Return to Hub
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="customer-option"
                        name="dropoff-type"
                        value="customer"
                        checked={selectedDropOffType === "customer"}
                        onChange={(e) => setSelectedDropOffType(e.target.value)}
                        className="w-4 h-4 text-[#f7c948] border-gray-300"
                      />
                      <Label htmlFor="customer-option" className="flex items-center cursor-pointer">
                        <Users className="mr-2 h-4 w-4" />
                        Direct Transfer to Another Customer
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Hub Selection */}
                {selectedDropOffType === "hub" && (
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Select Hub</Label>
                    <Select value={selectedHubId} onValueChange={setSelectedHubId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a hub location" />
                      </SelectTrigger>
                      <SelectContent>
                        {hubs?.map((hub) => (
                          <SelectItem key={hub.id} value={hub.id.toString()}>
                            <div className="flex items-center">
                              <Building2 className="mr-2 h-4 w-4" />
                              {hub.name} - {hub.address}, {hub.city}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Customer Transfer Selection */}
                {selectedDropOffType === "customer" && (
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Select Customer for Direct Transfer</Label>
                    <Select value={selectedCustomerBookingId} onValueChange={setSelectedCustomerBookingId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a customer booking for delivery" />
                      </SelectTrigger>
                      <SelectContent>
                        {bookings?.filter(b => 
                          b.status === "confirmed" && 
                          b.id !== bookingToComplete.id &&
                          b.dumpsterId === bookingToComplete.dumpsterId
                        ).map((booking) => (
                          <SelectItem key={booking.id} value={booking.id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{booking.customerName}</span>
                              <span className="text-sm text-gray-500">
                                {booking.deliveryAddress}, {booking.deliveryCity} - {formatDate(booking.deliveryDate)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedDropOffType === "customer" && bookings?.filter(b => 
                      b.status === "confirmed" && 
                      b.id !== bookingToComplete.id &&
                      b.dumpsterId === bookingToComplete.dumpsterId
                    ).length === 0 && (
                      <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
                        No compatible customer bookings available for direct transfer. 
                        Consider returning to hub instead.
                      </p>
                    )}
                  </div>
                )}

                {/* Efficiency Note */}
                {selectedDropOffType === "customer" && selectedCustomerBookingId && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800">
                      <strong>Smart Route:</strong> This direct transfer maximizes efficiency by skipping the hub completely.
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDropOffDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCompleteBooking}
                  disabled={!selectedDropOffType || 
                    (selectedDropOffType === "hub" && !selectedHubId) ||
                    (selectedDropOffType === "customer" && !selectedCustomerBookingId)
                  }
                  className="bg-[#f7c948] hover:bg-[#f7c948]/90 text-black"
                >
                  Complete Booking
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminLayout>
  );
}