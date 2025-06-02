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
} from "@/components/ui/dialog";
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
  DollarSign
} from "lucide-react";

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

  useEffect(() => {
    if (bookings && dumpsters && allPricing) {
      const calendarEvents: CalendarEvent[] = [];
      
      bookings.forEach((booking) => {
        const dumpster = dumpsters.find((d) => d.id === booking.dumpsterId);
        const pricing = allPricing.find((p) => p.id === booking.pricingId);
        const dumpsterName = dumpster ? dumpster.name : `Dumpster #${booking.dumpsterId}`;
        const durationDays = pricing ? pricing.days : 7; // Default to 7 days if not found
        
        const deliveryDate = new Date(booking.deliveryDate);
        const pickupDate = new Date(deliveryDate);
        pickupDate.setDate(deliveryDate.getDate() + durationDays);
        
        let dropOffColor, pickupColor;
        
        // Set colors based on booking status
        switch (booking.status) {
          case 'scheduled':
            dropOffColor = '#3b82f6'; // Blue for drop-off
            pickupColor = '#f59e0b'; // Amber for pickup
            break;
          case 'delivered':
            dropOffColor = '#10b981'; // Green for delivered
            pickupColor = '#f59e0b'; // Amber for pending pickup
            break;
          case 'completed':
            dropOffColor = '#10b981'; // Green for delivered
            pickupColor = '#8b5cf6'; // Purple for completed pickup
            break;
          case 'cancelled':
            dropOffColor = '#ef4444'; // Red for cancelled
            pickupColor = '#ef4444'; // Red for cancelled
            break;
          default:
            dropOffColor = '#6b7280';
            pickupColor = '#6b7280';
        }
        
        // Drop-off event
        calendarEvents.push({
          id: `${booking.id}-dropoff`,
          title: `Drop-off: ${dumpsterName} - ${booking.customerName}`,
          start: deliveryDate.toISOString().split('T')[0],
          end: deliveryDate.toISOString().split('T')[0],
          extendedProps: {
            booking,
            dumpsterName,
            durationDays,
            eventType: 'dropoff'
          },
          backgroundColor: dropOffColor,
          borderColor: dropOffColor,
          textColor: '#ffffff',
        });
        
        // Pickup event
        calendarEvents.push({
          id: `${booking.id}-pickup`,
          title: `Pickup: ${dumpsterName} - ${booking.customerName}`,
          start: pickupDate.toISOString().split('T')[0],
          end: pickupDate.toISOString().split('T')[0],
          extendedProps: {
            booking,
            dumpsterName,
            durationDays,
            eventType: 'pickup'
          },
          backgroundColor: pickupColor,
          borderColor: pickupColor,
          textColor: '#ffffff',
        });
      });
      
      setEvents(calendarEvents);
    }
  }, [bookings, dumpsters, allPricing]);

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

  // Get dumpster name
  const getDumpsterName = (id: number) => {
    return dumpsters?.find(d => d.id === id)?.name || `Dumpster #${id}`;
  };

  // Get duration days from pricing
  const getDurationDays = (pricingId: number) => {
    return allPricing?.find(p => p.id === pricingId)?.days || "N/A";
  };

  // Calculate pickup date
  const getPickupDate = (deliveryDate: string | Date, pricingId: number) => {
    const durationDays = getDurationDays(pricingId);
    if (durationDays === "N/A") return "N/A";
    
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
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek'
              }}
              height="100%"
              eventTimeFormat={{
                hour: 'numeric',
                minute: '2-digit',
                meridiem: 'short'
              }}
              eventContent={(arg) => (
                <div className="fc-event-main-inner px-2 py-1 text-xs">
                  <div className="font-medium">{arg.event.title}</div>
                </div>
              )}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Booking Details Dialog */}
      {selectedBooking && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
              <DialogDescription>
                Booking #{selectedBooking.id} - {getStatusBadge(selectedBooking.status)}
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
                      <Badge className={selectedBooking.paymentStatus === 'paid' ? 'bg-green-500' : 'bg-yellow-500'}>
                        {selectedBooking.paymentStatus.charAt(0).toUpperCase() + selectedBooking.paymentStatus.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Amount</span>
                      <span className="font-medium">${(selectedBooking.totalPrice / 100).toFixed(2)}</span>
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
    </>
  );
}