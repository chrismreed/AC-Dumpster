import { useState, useMemo } from "react";
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
import { Booking, Dumpster, AddOn, ServiceZone, RentalDuration, DumpsterPricing } from "@shared/schema";
import { Loader2, Eye, Package, MapPin, Calendar, Phone, Mail, DollarSign, List, Trash2, Settings } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { BookingCalendar } from "@/components/admin/booking-calendar";
import { DeliveryMap } from "@/components/admin/maps/delivery-map";

export default function BookingsPage() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [selectedBookings, setSelectedBookings] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState<string>("deliveryDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

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

  const confirmDeleteBooking = () => {
    if (bookingToDelete) {
      deleteBookingMutation.mutate(bookingToDelete.id);
    }
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
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Bookings</h1>
            <p className="text-gray-500">Manage and track all your dumpster rental bookings</p>
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
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Booking Details Dialog */}
        {selectedBooking && (
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Booking Details</DialogTitle>
                <DialogDescription>
                  View and manage booking #{selectedBooking.id}
                </DialogDescription>
              </DialogHeader>
              
              {/* Consolidated booking information in a single comprehensive view */}
              <div className="space-y-4">
                {/* Customer & Service Information - Top Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center">
                        <Mail className="mr-2 h-4 w-4" />
                        Customer Information
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
                        Service Details
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
                        <span className="text-muted-foreground">Zone:</span>
                        <span className="font-medium">{getZoneName(selectedBooking.serviceZoneId)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Add-ons:</span>
                        <span className="font-medium">{getAddonNames(selectedBooking.selectedAddOns)}</span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="text-xs text-muted-foreground mb-1">Delivery Address</div>
                        <div className="font-medium text-xs">{selectedBooking.deliveryAddress}</div>
                        <div className="text-muted-foreground text-xs">{selectedBooking.deliveryCity}, {selectedBooking.deliveryZipCode}</div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2 h-6 text-xs"
                          onClick={() => {
                            const address = `${selectedBooking.deliveryAddress}, ${selectedBooking.deliveryCity}, ${selectedBooking.deliveryZipCode}`;
                            const encodedAddress = encodeURIComponent(address);
                            window.open(`https://maps.google.com/maps?q=${encodedAddress}`, '_blank');
                          }}
                        >
                          <MapPin className="h-3 w-3 mr-1" />
                          Navigate
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Schedule & Status Information - Middle Row */}
                <div className="grid grid-cols-1 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        Schedule & Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <span className="text-muted-foreground">Delivery:</span>
                          <div className="font-medium">{formatDate(selectedBooking.deliveryDate)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Pickup:</span>
                          <div className="font-medium">{getPickupDate(selectedBooking.deliveryDate, selectedBooking.pricingId)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Time:</span>
                          <div className="font-medium">{selectedBooking.deliveryTimePreference}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Placement:</span>
                          <div className="font-medium">{selectedBooking.placementLocation}</div>
                        </div>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-muted-foreground">Current Status:</span>
                              <span>{getStatusBadge(selectedBooking.status)}</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Update Status</div>
                            <Select
                              value={selectedBooking.status}
                              onValueChange={(value) => handleStatusChange(selectedBooking.id, value)}
                            >
                              <SelectTrigger className="w-full h-7 text-xs">
                                <SelectValue placeholder="Change status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="picked_up">Picked Up</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Payment Information - Bottom Row */}
                <div className="grid grid-cols-1 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center">
                        <DollarSign className="mr-2 h-4 w-4" />
                        Payment Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground text-xs">Status</span>
                          <Badge className={selectedBooking.paymentStatus === 'paid' ? 'bg-green-500' : 'bg-yellow-500'}>
                            {selectedBooking.paymentStatus.charAt(0).toUpperCase() + selectedBooking.paymentStatus.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground text-xs">Total</span>
                          <span className="text-lg font-bold">${(selectedBooking.totalPrice / 100).toFixed(2)}</span>
                        </div>
                        {selectedBooking.stripePaymentIntentId && (
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Payment ID</div>
                            <div className="font-mono text-xs bg-gray-100 p-1 rounded break-all">
                              {selectedBooking.stripePaymentIntentId}
                            </div>
                          </div>
                        )}
                      </div>
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
            <TabsList className="w-full md:w-auto">
              <TabsTrigger value="list" className="flex items-center">
                <List className="mr-2 h-4 w-4" />
                List View
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                Calendar View
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center">
                <MapPin className="mr-2 h-4 w-4" />
                Delivery Map
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
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Change Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="picked_up">Picked Up</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
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
              <CardHeader>
                <CardTitle>
                  {statusFilter === 'all' ? 'All Bookings' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Bookings`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedBookings.size === sortedAndFilteredBookings.length && sortedAndFilteredBookings.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:text-primary"
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
                        <TableHead>Customer</TableHead>
                        <TableHead>Dumpster</TableHead>
                        <TableHead 
                          className="cursor-pointer hover:text-primary"
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
                            Delivery Date
                            {sortBy === "deliveryDate" && (
                              <span className="ml-1">
                                {sortOrder === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:text-primary"
                          onClick={() => {
                            if (sortBy === "pickupDate") {
                              setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                            } else {
                              setSortBy("pickupDate");
                              setSortOrder("asc");
                            }
                          }}
                        >
                          <div className="flex items-center">
                            Pickup Date
                            {sortBy === "pickupDate" && (
                              <span className="ml-1">
                                {sortOrder === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Actions</TableHead>
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
                          <TableRow key={booking.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedBookings.has(booking.id)}
                                onCheckedChange={(checked) => handleSelectBooking(booking.id, checked as boolean)}
                              />
                            </TableCell>
                            <TableCell>{booking.id}</TableCell>
                            <TableCell>{booking.customerName}</TableCell>
                            <TableCell>{getDumpsterName(booking.dumpsterId)}</TableCell>
                            <TableCell>{formatDate(booking.deliveryDate)}</TableCell>
                            <TableCell>{getPickupDate(booking.deliveryDate, booking.pricingId)}</TableCell>
                            <TableCell>{booking.deliveryZipCode}</TableCell>
                            <TableCell>{getStatusBadge(booking.status)}</TableCell>
                            <TableCell>${(booking.totalPrice / 100).toFixed(2)}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleViewBooking(booking)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDeleteBooking(booking)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="map" className="mt-6">
            <DeliveryMap bookings={sortedAndFilteredBookings} dumpsters={dumpsters || []} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}