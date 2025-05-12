import { useState } from "react";
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
import { Booking, Dumpster, AddOn, ServiceZone, RentalDuration } from "@shared/schema";
import { Loader2, Eye, Package, MapPin, Calendar, Phone, Mail, DollarSign, List } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { BookingCalendar } from "@/components/admin/booking-calendar";

export default function BookingsPage() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

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

  // Update booking status mutation
  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/bookings/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      setIsViewDialogOpen(false);
      toast({
        title: "Booking updated",
        description: "The booking status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update booking: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsViewDialogOpen(true);
  };

  const handleStatusChange = (id: number, status: string) => {
    updateBookingStatusMutation.mutate({ id, status });
  };

  // Filter bookings by status
  const filteredBookings = bookings?.filter((booking) => {
    if (statusFilter === "all") return true;
    return booking.status === statusFilter;
  });

  // Get related data for a booking
  const getDumpsterName = (id: number) => {
    return dumpsters?.find(d => d.id === id)?.name || `Dumpster #${id}`;
  };

  const getDurationDays = (id: number) => {
    return durations?.find(d => d.id === id)?.days || "N/A";
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

  // Get status badge style
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-500">Scheduled</Badge>;
      case 'delivered':
        return <Badge className="bg-green-500">Delivered</Badge>;
      case 'completed':
        return <Badge className="bg-purple-500">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
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
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Booking Details Dialog */}
        {selectedBooking && (
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Booking Details</DialogTitle>
                <DialogDescription>
                  View and manage booking #{selectedBooking.id}
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="details">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Booking Details</TabsTrigger>
                  <TabsTrigger value="customer">Customer Info</TabsTrigger>
                  <TabsTrigger value="payment">Payment</TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center">
                          <Package className="mr-2 h-4 w-4" />
                          Dumpster Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Dumpster Type:</span>
                            <span className="font-medium">{getDumpsterName(selectedBooking.dumpsterId)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Rental Duration:</span>
                            <span className="font-medium">{getDurationDays(selectedBooking.rentalDurationId)} days</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Service Zone:</span>
                            <span className="font-medium">{getZoneName(selectedBooking.serviceZoneId)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Add-ons:</span>
                            <span className="font-medium">{getAddonNames(selectedBooking.selectedAddOns)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          Delivery Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Delivery Date:</span>
                            <span className="font-medium">{formatDate(selectedBooking.deliveryDate)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Time Preference:</span>
                            <span className="font-medium">{selectedBooking.deliveryTimePreference}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Placement:</span>
                            <span className="font-medium">{selectedBooking.placementLocation}</span>
                          </div>
                          <div className="pt-2">
                            <span className="text-muted-foreground">Status:</span>
                            <div className="flex justify-between items-center mt-1">
                              <span>{getStatusBadge(selectedBooking.status)}</span>
                              <Select
                                value={selectedBooking.status}
                                onValueChange={(value) => handleStatusChange(selectedBooking.id, value)}
                              >
                                <SelectTrigger className="w-[150px]">
                                  <SelectValue placeholder="Change status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="scheduled">Scheduled</SelectItem>
                                  <SelectItem value="delivered">Delivered</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center">
                        <MapPin className="mr-2 h-4 w-4" />
                        Delivery Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p>{selectedBooking.deliveryAddress}</p>
                      <p>{selectedBooking.deliveryCity}, {selectedBooking.deliveryZipCode}</p>
                      {selectedBooking.deliveryInstructions && (
                        <>
                          <p className="mt-2 text-muted-foreground">Delivery Instructions:</p>
                          <p className="italic">{selectedBooking.deliveryInstructions}</p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="customer">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Customer Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-medium">{selectedBooking.customerName}</h3>
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                              <a href={`mailto:${selectedBooking.customerEmail}`} className="text-primary hover:underline">
                                {selectedBooking.customerEmail}
                              </a>
                            </div>
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                              <a href={`tel:${selectedBooking.customerPhone}`} className="text-primary hover:underline">
                                {selectedBooking.customerPhone}
                              </a>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Booking Date</h4>
                          <p>{formatDate(selectedBooking.createdAt)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="payment">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center">
                        <DollarSign className="mr-2 h-4 w-4" />
                        Payment Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                          <span className="text-muted-foreground">Payment Status</span>
                          <Badge className={selectedBooking.paymentStatus === 'paid' ? 'bg-green-500' : 'bg-yellow-500'}>
                            {selectedBooking.paymentStatus.charAt(0).toUpperCase() + selectedBooking.paymentStatus.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Total Amount</span>
                          <span className="text-xl font-bold">${(selectedBooking.totalPrice / 100).toFixed(2)}</span>
                        </div>
                        {selectedBooking.stripePaymentIntentId && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Payment ID</span>
                            <span className="font-mono text-xs">{selectedBooking.stripePaymentIntentId}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
              
              <DialogFooter>
                <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="list" className="flex items-center">
              <List className="mr-2 h-4 w-4" />
              List View
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              Calendar View
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="calendar" className="mt-6">
            {isLoadingBookings || !bookings || !dumpsters || !durations ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <BookingCalendar 
                bookings={bookings} 
                dumpsters={dumpsters} 
                durations={durations} 
              />
            )}
          </TabsContent>
          
          <TabsContent value="list" className="mt-6">
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
                        <TableHead>ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Dumpster</TableHead>
                        <TableHead>Delivery Date</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <p className="text-muted-foreground">No bookings found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredBookings?.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell>{booking.id}</TableCell>
                            <TableCell>{booking.customerName}</TableCell>
                            <TableCell>{getDumpsterName(booking.dumpsterId)}</TableCell>
                            <TableCell>{formatDate(booking.deliveryDate)}</TableCell>
                            <TableCell>{booking.deliveryZipCode}</TableCell>
                            <TableCell>{getStatusBadge(booking.status)}</TableCell>
                            <TableCell>${(booking.totalPrice / 100).toFixed(2)}</TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleViewBooking(booking)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
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
        </Tabs>
      </div>
    </AdminLayout>
  );
}