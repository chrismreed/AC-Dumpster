'use client';

import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MapPin,
  Phone,
  Navigation,
  Package,
  Calendar as CalendarIcon,
  Truck,
} from 'lucide-react';

interface Booking {
  id: number;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryZipCode: string;
  deliveryDate: string;
  deliveryTimePreference: string;
  deliveryInstructions?: string;
  placementLocation?: string;
  status: string;
  totalPrice: number;
  dumpsterId: number;
  pricingId: number;
}

interface Dumpster {
  id: number;
  name: string;
}

interface DumpsterPricing {
  id: number;
  days: number;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  extendedProps: {
    booking: Booking;
    dumpsterName: string;
    eventType: 'delivery' | 'pickup';
    priority: number;
  };
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  classNames?: string[];
}

interface BookingCalendarProps {
  bookings: Booking[];
  dumpsters: Dumpster[];
  allPricing: DumpsterPricing[];
}

export function BookingCalendar({ bookings, dumpsters, allPricing }: BookingCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentView, setCurrentView] = useState('timeGridWeek');

  const getStatusColor = (status: string) => {
    const colors = {
      pending: { bg: '#f59e0b', border: '#f59e0b', text: '#ffffff' },
      confirmed: { bg: '#10b981', border: '#10b981', text: '#ffffff' },
      delivered: { bg: '#3b82f6', border: '#3b82f6', text: '#ffffff' },
      picked_up: { bg: '#8b5cf6', border: '#8b5cf6', text: '#ffffff' },
      complete: { bg: '#059669', border: '#059669', text: '#ffffff' },
      cancelled: { bg: '#ef4444', border: '#ef4444', text: '#ffffff' },
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getDumpsterName = (dumpsterId: number) => {
    const dumpster = dumpsters.find((d) => d.id === dumpsterId);
    return dumpster ? dumpster.name.replace('Yard Dumpster', 'yd') : `${dumpsterId}yd`;
  };

  const getDurationDays = (pricingId: number) => {
    const pricing = allPricing.find((p) => p.id === pricingId);
    return pricing ? pricing.days : 7;
  };

  // Priority: confirmed deliveries > confirmed pickups > pending > delivered > others
  const getPriority = (booking: Booking, eventType: 'delivery' | 'pickup') => {
    if (booking.status === 'confirmed' && eventType === 'delivery') return 1;
    if (booking.status === 'delivered' && eventType === 'pickup') return 2;
    if (booking.status === 'confirmed' && eventType === 'pickup') return 3;
    if (booking.status === 'pending') return 4;
    return 5;
  };

  useEffect(() => {
    if (!bookings || !dumpsters || !allPricing) {
      setEvents([]);
      return;
    }

    const calendarEvents: CalendarEvent[] = [];

    bookings.forEach((booking) => {
      const dumpsterName = getDumpsterName(booking.dumpsterId);
      const durationDays = getDurationDays(booking.pricingId);
      const statusColor = getStatusColor(booking.status);

      const deliveryDate = new Date(booking.deliveryDate);
      const pickupDate = new Date(deliveryDate);
      pickupDate.setDate(deliveryDate.getDate() + durationDays);

      // Get time slot based on preference
      const getTimeSlot = (preference: string) => {
        const slots = {
          morning: { start: '08:00:00', end: '12:00:00' },
          afternoon: { start: '12:00:00', end: '17:00:00' },
          evening: { start: '17:00:00', end: '20:00:00' },
          anytime: { start: '08:00:00', end: '20:00:00' },
        };
        return slots[preference?.toLowerCase() as keyof typeof slots] || slots.anytime;
      };

      const timeSlot = getTimeSlot(booking.deliveryTimePreference);

      if (currentView === 'dayGridMonth') {
        // Month view: Show delivery and pickup separately as all-day events
        calendarEvents.push({
          id: `delivery-${booking.id}`,
          title: `🚚 ${booking.customerName} - ${dumpsterName}`,
          start: deliveryDate.toISOString().split('T')[0],
          extendedProps: {
            booking,
            dumpsterName,
            eventType: 'delivery',
            priority: getPriority(booking, 'delivery'),
          },
          backgroundColor: statusColor.bg,
          borderColor: statusColor.border,
          textColor: statusColor.text,
          classNames: ['font-semibold'],
        });

        calendarEvents.push({
          id: `pickup-${booking.id}`,
          title: `📦 ${booking.customerName} - ${dumpsterName}`,
          start: pickupDate.toISOString().split('T')[0],
          extendedProps: {
            booking,
            dumpsterName,
            eventType: 'pickup',
            priority: getPriority(booking, 'pickup'),
          },
          backgroundColor: statusColor.bg,
          borderColor: statusColor.border,
          textColor: statusColor.text,
          classNames: ['font-semibold'],
        });
      } else {
        // Week/Day view: Show with time slots
        calendarEvents.push({
          id: `delivery-${booking.id}`,
          title: `🚚 ${dumpsterName} → ${booking.customerName}`,
          start: `${deliveryDate.toISOString().split('T')[0]}T${timeSlot.start}`,
          end: `${deliveryDate.toISOString().split('T')[0]}T${timeSlot.end}`,
          extendedProps: {
            booking,
            dumpsterName,
            eventType: 'delivery',
            priority: getPriority(booking, 'delivery'),
          },
          backgroundColor: statusColor.bg,
          borderColor: statusColor.border,
          textColor: statusColor.text,
        });

        calendarEvents.push({
          id: `pickup-${booking.id}`,
          title: `📦 Pickup ${dumpsterName} ← ${booking.customerName}`,
          start: `${pickupDate.toISOString().split('T')[0]}T${timeSlot.start}`,
          end: `${pickupDate.toISOString().split('T')[0]}T${timeSlot.end}`,
          extendedProps: {
            booking,
            dumpsterName,
            eventType: 'pickup',
            priority: getPriority(booking, 'pickup'),
          },
          backgroundColor: statusColor.bg,
          borderColor: statusColor.border,
          textColor: statusColor.text,
        });
      }
    });

    // Sort by priority
    calendarEvents.sort((a, b) => a.extendedProps.priority - b.extendedProps.priority);

    setEvents(calendarEvents);
  }, [bookings, dumpsters, allPricing, currentView]);

  const handleEventClick = (info: any) => {
    setSelectedEvent(info.event.toPlainObject());
    setIsDialogOpen(true);
  };

  const formatAddress = (booking: Booking) => {
    return `${booking.deliveryAddress}, ${booking.deliveryCity}, ${booking.deliveryZipCode}`;
  };

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="h-[700px]">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              events={events}
              eventClick={handleEventClick}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
              slotDuration="01:00:00"
              allDaySlot={currentView === 'dayGridMonth'}
              viewDidMount={(info) => {
                setCurrentView(info.view.type);
              }}
              height="100%"
              nowIndicator={true}
              eventTimeFormat={{
                hour: 'numeric',
                minute: '2-digit',
                meridiem: 'short',
              }}
              dayMaxEvents={3}
              moreLinkClick="popover"
              eventContent={(arg) => (
                <div className="fc-event-main-inner px-2 py-1 text-xs overflow-hidden">
                  <div className="font-semibold truncate">{arg.event.title}</div>
                  {arg.view.type !== 'dayGridMonth' && (
                    <div className="text-[10px] opacity-90 truncate">
                      {arg.event.extendedProps.booking.deliveryCity}
                    </div>
                  )}
                </div>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      {selectedEvent && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedEvent.extendedProps.eventType === 'delivery' ? (
                  <Truck className="h-5 w-5" />
                ) : (
                  <Package className="h-5 w-5" />
                )}
                {selectedEvent.extendedProps.eventType === 'delivery' ? 'Delivery' : 'Pickup'} - Booking #
                {selectedEvent.extendedProps.booking.id}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Customer & Dumpster */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-500">Customer</div>
                <div className="font-semibold text-lg">{selectedEvent.extendedProps.booking.customerName}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {selectedEvent.extendedProps.dumpsterName}
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{formatAddress(selectedEvent.extendedProps.booking)}</div>
                  {selectedEvent.extendedProps.booking.placementLocation && (
                    <div className="text-xs text-gray-500 mt-1">
                      Placement: {selectedEvent.extendedProps.booking.placementLocation}
                    </div>
                  )}
                  {selectedEvent.extendedProps.booking.deliveryInstructions && (
                    <div className="text-xs text-gray-600 mt-1 italic bg-yellow-50 p-2 rounded">
                      "{selectedEvent.extendedProps.booking.deliveryInstructions}"
                    </div>
                  )}
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-gray-400" />
                <div className="text-sm">
                  <span className="font-medium">{selectedEvent.extendedProps.booking.deliveryTimePreference}</span>
                  <span className="text-gray-500 ml-2">
                    {new Date(selectedEvent.start as string).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-gray-500">Status</span>
                <Badge
                  className="capitalize"
                  style={{
                    backgroundColor: getStatusColor(selectedEvent.extendedProps.booking.status).bg,
                    color: '#ffffff',
                  }}
                >
                  {selectedEvent.extendedProps.booking.status.replace('_', ' ')}
                </Badge>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`tel:${selectedEvent.extendedProps.booking.customerPhone}`)}
                >
                  <Phone className="h-4 w-4 mr-1" />
                  Call
                </Button>
                <Button
                  className="bg-[#f7c948] hover:bg-[#e6b83d] text-black"
                  size="sm"
                  onClick={() => {
                    const address = formatAddress(selectedEvent.extendedProps.booking);
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`,
                      '_blank'
                    );
                  }}
                >
                  <Navigation className="h-4 w-4 mr-1" />
                  Navigate
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
