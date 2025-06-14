import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Booking, Dumpster, RentalDuration, DumpsterPricing } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { 
  ClipboardList, 
  Calendar, 
  MapPin, 
  User,
  Phone,
  Mail,
  DollarSign,
  RefreshCw
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BookingCalendarProps {
  bookings: Booking[];
  dumpsters: Dumpster[];
  durations: RentalDuration[];
  allPricing: DumpsterPricing[];
}

// Define the event type compatible with FullCalendar
type CalendarEvent = {
  id: string;
  title: string;
  start: string; // ISO string format
  end: string; // ISO string format
  extendedProps: {
    booking: Booking;
    dumpsterName: string;
    durationDays: number;
  };
  backgroundColor: string;
  borderColor: string;
  textColor: string;
};

export function BookingCalendar({ bookings, dumpsters, durations, allPricing }: BookingCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<string>('dayGridMonth');
  const [bookingToComplete, setBookingToComplete] = useState<Booking | null>(null);
  const [isDropOffDialogOpen, setIsDropOffDialogOpen] = useState(false);
  const [selectedDropOffType, setSelectedDropOffType] = useState<string>("");
  const [selectedHubId, setSelectedHubId] = useState<string>("");
  const [selectedCustomerBookingId, setSelectedCustomerBookingId] = useState<string>("");
  const { toast } = useToast();

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

  // Fetch hubs for drop-off selection
  const { data: hubs = [] } = useQuery({
    queryKey: ['/api/hubs'],
  });

  // Handle status change with drop-off dialog for completion
  const handleStatusChange = (bookingId: number, newStatus: string) => {
    const booking = bookings?.find(b => b.id === bookingId);
    if (!booking) return;

    if (newStatus === "complete") {
      // Set up for drop-off selection
      setBookingToComplete(booking);
      setSelectedDropOffType("");
      setSelectedHubId("");
      setSelectedCustomerBookingId("");
      setIsDropOffDialogOpen(true);
    } else {
      // Direct status update for non-completion statuses
      updateBookingStatusMutation.mutate({ bookingId, status: newStatus });
    }
  };

  // Check payment status mutation
  const checkPaymentStatusMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const response = await apiRequest("POST", `/api/bookings/${bookingId}/check-payment-status`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Payment Status Updated",
        description: "Payment status has been checked and updated if needed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to check payment status: ${error?.message || "Unknown error"}`,
        variant: "destructive",
      });
    },
  });

  // Complete booking mutation
  const completeBookingMutation = useMutation({
    mutationFn: async ({ bookingId, dropOffLocation }: { bookingId: number; dropOffLocation: any }) => {
      return apiRequest("PUT", `/api/bookings/${bookingId}`, {
        status: "complete",
        dropOffLocation,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      setIsDropOffDialogOpen(false);
      setBookingToComplete(null);
      setIsDetailsOpen(false);
      toast({
        title: "Booking Completed",
        description: "The booking has been marked as complete with drop-off location.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete booking",
        variant: "destructive",
      });
    },
  });

  // Handle completing booking with drop-off location
  const handleCompleteBooking = () => {
    if (!bookingToComplete) return;

    let dropOffLocation;
    if (selectedDropOffType === "hub" && selectedHubId) {
      const hub = (hubs as any[]).find((h: any) => h.id === parseInt(selectedHubId));
      dropOffLocation = {
        type: "hub",
        hubId: parseInt(selectedHubId),
        address: `${hub?.address}, ${hub?.city}, ${hub?.zipCode}`,
      };
    } else if (selectedDropOffType === "customer" && selectedCustomerBookingId) {
      const customerBooking = bookings?.find(b => b.id === parseInt(selectedCustomerBookingId));
      dropOffLocation = {
        type: "customer",
        bookingId: parseInt(selectedCustomerBookingId),
        address: `${customerBooking?.deliveryAddress}, ${customerBooking?.deliveryCity}, ${customerBooking?.deliveryZipCode}`,
      };
    }

    if (dropOffLocation) {
      completeBookingMutation.mutate({
        bookingId: bookingToComplete.id,
        dropOffLocation,
      });
    }
  };

  // Update booking status mutation
  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: number; status: string }) => {
      return apiRequest("PATCH", `/api/bookings/${bookingId}`, { status });
    },
    onSuccess: (data, variables) => {
      // Update the selected booking state
      if (selectedBooking && selectedBooking.id === variables.bookingId) {
        setSelectedBooking({ ...selectedBooking, status: variables.status });
      }
      // Invalidate all booking-related queries across the admin site
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings", variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: ["/api/dumpster-pricing/all"] });
      toast({
        title: "Status Updated",
        description: `Booking status changed to ${variables.status}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!bookings || !dumpsters || !allPricing) {
      setEvents([]);
      return;
    }

    const calendarEvents: CalendarEvent[] = [];

    bookings.forEach((booking) => {
      const dumpster = dumpsters.find((d) => d.id === booking.dumpsterId);
      const pricing = allPricing.find((p) => p.id === booking.pricingId);
      const dumpsterName = dumpster ? dumpster.name : `Dumpster #${booking.dumpsterId}`;
      const durationDays = pricing ? pricing.days : 7;
      
      const deliveryDate = new Date(booking.deliveryDate);
      const pickupDate = new Date(deliveryDate);
      pickupDate.setDate(deliveryDate.getDate() + durationDays);
      
      // Get status colors
      let statusColor;
      switch (booking.status) {
        case 'pending':
          statusColor = { background: '#6b7280', border: '#6b7280', text: '#ffffff' };
          break;
        case 'confirmed':
          statusColor = { background: '#f59e0b', border: '#f59e0b', text: '#ffffff' };
          break;
        case 'delivered':
          statusColor = { background: '#3b82f6', border: '#3b82f6', text: '#ffffff' };
          break;
        case 'completed':
          statusColor = { background: '#10b981', border: '#10b981', text: '#ffffff' };
          break;
        case 'cancelled':
          statusColor = { background: '#ef4444', border: '#ef4444', text: '#ffffff' };
          break;
        default:
          statusColor = { background: '#6b7280', border: '#6b7280', text: '#ffffff' };
      }

      if (currentView === 'dayGridMonth') {
        // Monthly view: Show full booking duration as a single bar
        calendarEvents.push({
          id: `booking-${booking.id}`,
          title: `${booking.customerName} - ${dumpsterName}`,
          start: deliveryDate.toISOString().split('T')[0],
          end: pickupDate.toISOString().split('T')[0],
          extendedProps: {
            booking,
            dumpsterName,
            durationDays,
          },
          backgroundColor: statusColor.background,
          borderColor: statusColor.border,
          textColor: statusColor.text
        });
      } else if (currentView === 'timeGridWeek') {
        // Weekly view: Show delivery and pickup in time slots based on preferred time
        let timeSlot = '';
        switch (booking.deliveryTimePreference?.toLowerCase()) {
          case 'morning':
            timeSlot = 'T10:00:00'; // 10 AM for morning
            break;
          case 'afternoon':
            timeSlot = 'T14:00:00'; // 2 PM for afternoon
            break;
          case 'evening':
            timeSlot = 'T18:00:00'; // 6 PM for evening
            break;
          default:
            timeSlot = 'T08:00:00'; // 8 AM for anytime (top of day)
            break;
        }

        // Delivery event
        calendarEvents.push({
          id: `delivery-${booking.id}`,
          title: `🚚 ${booking.customerName} - ${dumpsterName}`,
          start: `${deliveryDate.toISOString().split('T')[0]}${timeSlot}`,
          end: `${deliveryDate.toISOString().split('T')[0]}${timeSlot}`,
          extendedProps: {
            booking,
            dumpsterName,
            durationDays,
          },
          backgroundColor: statusColor.background,
          borderColor: statusColor.border,
          textColor: statusColor.text
        });

        // Pickup event (same time slot as delivery)
        calendarEvents.push({
          id: `pickup-${booking.id}`,
          title: `📦 Pickup - ${booking.customerName}`,
          start: `${pickupDate.toISOString().split('T')[0]}${timeSlot}`,
          end: `${pickupDate.toISOString().split('T')[0]}${timeSlot}`,
          extendedProps: {
            booking,
            dumpsterName,
            durationDays,
          },
          backgroundColor: statusColor.background,
          borderColor: statusColor.border,
          textColor: statusColor.text
        });
      }
    });

    setEvents(calendarEvents);
  }, [bookings, dumpsters, allPricing, currentView]);

  const handleEventClick = (info: any) => {
    setSelectedBooking(info.event.extendedProps.booking);
    setIsDetailsOpen(true);
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

  // Helper function to render status badges
  function getStatusBadge(status: string) {
    const statusColors = {
      confirmed: 'bg-yellow-100 text-yellow-800',
      delivered: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      pending: 'bg-gray-100 text-gray-800',
    };
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || statusColors.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  }

  // Get helper functions for booking details
  const getDumpsterName = (dumpsterId: number) => {
    const dumpster = dumpsters.find(d => d.id === dumpsterId);
    return dumpster ? dumpster.name : `Dumpster #${dumpsterId}`;
  };

  const getDurationDays = (pricingId: number) => {
    const pricing = allPricing.find(p => p.id === pricingId);
    return pricing ? pricing.days : 7;
  };

  const getPickupDate = (deliveryDate: string | Date, pricingId: number) => {
    const durationDays = getDurationDays(pricingId);
    const startDate = typeof deliveryDate === 'string' ? new Date(deliveryDate) : deliveryDate;
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + Number(durationDays));
    
    return formatDate(endDate);
  };

  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Booking Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[700px]">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin]}
              initialView="dayGridMonth"
              events={events}
              eventClick={handleEventClick}
              headerToolbar={{
                left: 'prev,next',
                center: 'title',
                right: 'today dayGridMonth,timeGridWeek'
              }}
              footerToolbar={false}
              viewDidMount={(info) => {
                // Update current view when view changes
                setCurrentView(info.view.type);
              }}
              height="100%"
              eventTimeFormat={{
                hour: 'numeric',
                minute: '2-digit',
                meridiem: 'short'
              }}
              eventContent={(arg) => (
                <div className="fc-event-main-inner px-1 py-1 text-xs">
                  <div className="font-medium truncate">{arg.event.title}</div>
                </div>
              )}
              dayMaxEvents={2}
              moreLinkClick="popover"
              dayHeaderFormat={{ weekday: 'short' }}
              titleFormat={{ year: 'numeric', month: 'short' }}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Booking Details Dialog */}
      {selectedBooking && (
        <Dialog 
          open={isDetailsOpen} 
          onOpenChange={setIsDetailsOpen}
          modal={true}
        >
          <DialogContent 
            className="max-w-3xl max-h-[90vh] overflow-y-auto p-4 md:p-6"
            onEscapeKeyDown={() => setIsDetailsOpen(false)}
            onPointerDownOutside={() => setIsDetailsOpen(false)}
          >
            <DialogHeader className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <DialogTitle className="text-lg">Booking Details</DialogTitle>
                  <span className="text-sm font-medium text-muted-foreground">Booking #{selectedBooking.id}</span>
                </div>
              </div>
              <DialogDescription className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Select 
                    value={selectedBooking.status} 
                    onValueChange={(value) => handleStatusChange(selectedBooking.id, value)}
                  >
                    <SelectTrigger className="w-full sm:w-36 h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOrder.map((status) => (
                        <SelectItem 
                          key={status.value} 
                          value={status.value}
                          className={isStatusCompleted(status.value, selectedBooking.status) ? "line-through text-gray-400" : ""}
                        >
                          <span className="flex items-center gap-2">
                            {status.step > 0 && (
                              <span className="flex-shrink-0 w-4 h-4 bg-gray-200 text-gray-700 rounded-full text-xs flex items-center justify-center font-medium">
                                {status.step}
                              </span>
                            )}
                            <span className={isStatusCompleted(status.value, selectedBooking.status) ? "line-through" : ""}>
                              {status.label}
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={() => {
                      const address = `${selectedBooking.deliveryAddress}, ${selectedBooking.deliveryCity}, ${selectedBooking.deliveryZipCode}`;
                      const mapsUrl = `https://maps.google.com/maps?daddr=${encodeURIComponent(address)}`;
                      window.open(mapsUrl, '_blank');
                    }}
                    className="bg-[#f7c948] hover:bg-[#f7c948]/90 text-black h-9 px-4"
                    size="sm"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Navigate</span>
                    <span className="sm:hidden">Nav</span>
                  </Button>
                </div>
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="border rounded-md p-4">
                  <h3 className="text-sm font-medium flex items-center mb-2">
                    <User className="mr-2 h-4 w-4 text-gray-500" />
                    Customer Information
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium">{selectedBooking.customerName}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Mail className="mr-2 h-4 w-4" />
                      <a href={`mailto:${selectedBooking.customerEmail}`} className="hover:underline">
                        {selectedBooking.customerEmail}
                      </a>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Phone className="mr-2 h-4 w-4" />
                      <a href={`tel:${selectedBooking.customerPhone}`} className="hover:underline">
                        {selectedBooking.customerPhone}
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <h3 className="text-sm font-medium flex items-center mb-2">
                    <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                    Delivery Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="block text-gray-500">Address</span>
                      <span>{selectedBooking.deliveryAddress}</span>
                    </div>
                    <div>
                      <span className="block text-gray-500">City & ZIP</span>
                      <span>{selectedBooking.deliveryCity}, {selectedBooking.deliveryZipCode}</span>
                    </div>
                    {selectedBooking.deliveryInstructions && (
                      <div>
                        <span className="block text-gray-500">Instructions</span>
                        <span className="italic">{selectedBooking.deliveryInstructions}</span>
                      </div>
                    )}
                    <div>
                      <span className="block text-gray-500">Placement</span>
                      <span>{selectedBooking.placementLocation}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="border rounded-md p-4">
                  <h3 className="text-sm font-medium flex items-center mb-2">
                    <ClipboardList className="mr-2 h-4 w-4 text-gray-500" />
                    Booking Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Dumpster</span>
                      <span>{getDumpsterName(selectedBooking.dumpsterId)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Rental Duration</span>
                      <span>{getDurationDays(selectedBooking.pricingId)} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Delivery Date</span>
                      <span>{formatDate(selectedBooking.deliveryDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Pickup Date (Est.)</span>
                      <span>{getPickupDate(selectedBooking.deliveryDate, selectedBooking.pricingId)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Time Preference</span>
                      <span>{selectedBooking.deliveryTimePreference}</span>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <h3 className="text-sm font-medium flex items-center mb-2">
                    <DollarSign className="mr-2 h-4 w-4 text-gray-500" />
                    Payment Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Payment Status</span>
                      <Badge className={selectedBooking.paymentStatus === 'paid' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}>
                        {selectedBooking.paymentStatus.charAt(0).toUpperCase() + selectedBooking.paymentStatus.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Amount</span>
                      <span className="font-medium">${(selectedBooking.totalPrice / 100).toFixed(2)}</span>
                    </div>
                    <div className="pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => checkPaymentStatusMutation.mutate(selectedBooking.id)}
                        disabled={checkPaymentStatusMutation.isPending}
                        className="w-full flex items-center gap-2"
                      >
                        <RefreshCw className={`h-4 w-4 ${checkPaymentStatusMutation.isPending ? 'animate-spin' : ''}`} />
                        Check Payment Status
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Drop-off Location Selection Dialog */}
      {bookingToComplete && (
        <Dialog open={isDropOffDialogOpen} onOpenChange={setIsDropOffDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
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
                <RadioGroup value={selectedDropOffType} onValueChange={setSelectedDropOffType}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hub" id="hub" />
                    <Label htmlFor="hub">Drop off at Hub</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="customer" id="customer" />
                    <Label htmlFor="customer">Transfer to Another Customer</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Hub Selection */}
              {selectedDropOffType === "hub" && (
                <div className="space-y-3">
                  <Label className="text-base font-medium">Select Hub</Label>
                  <Select value={selectedHubId} onValueChange={setSelectedHubId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a hub..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(hubs as any[]).map((hub: any) => (
                        <SelectItem key={hub.id} value={hub.id.toString()}>
                          {hub.name} - {hub.address}, {hub.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Customer Booking Selection */}
              {selectedDropOffType === "customer" && (
                <div className="space-y-3">
                  <Label className="text-base font-medium">Select Customer Booking</Label>
                  <Select value={selectedCustomerBookingId} onValueChange={setSelectedCustomerBookingId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a customer booking..." />
                    </SelectTrigger>
                    <SelectContent>
                      {bookings?.filter(b => 
                        b.id !== bookingToComplete.id && 
                        b.status === "confirmed"
                      ).map((booking) => (
                        <SelectItem key={booking.id} value={booking.id.toString()}>
                          {booking.customerName} - {booking.deliveryAddress}, {booking.deliveryCity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Smart Route Notice */}
              {selectedDropOffType === "customer" && selectedCustomerBookingId && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    <strong>Smart Route:</strong> This direct transfer maximizes efficiency by skipping the hub completely.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsDropOffDialogOpen(false)}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCompleteBooking}
                disabled={!selectedDropOffType || 
                  (selectedDropOffType === "hub" && !selectedHubId) ||
                  (selectedDropOffType === "customer" && !selectedCustomerBookingId)
                }
                className="bg-[#f7c948] hover:bg-[#f7c948]/90 text-black w-full sm:w-auto order-1 sm:order-2"
              >
                Complete Booking
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}