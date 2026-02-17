'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Calendar, Truck, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvailabilityCalendarProps {
  dumpsterId: number;
  pricingId: number;
  selectedDate: string;
  onDateSelect: (date: string) => void;
  rentalDays?: number;
}

interface DateAvailability {
  available: boolean;
  unitsAvailable: number;
  totalUnits: number;
}

export function AvailabilityCalendar({
  dumpsterId,
  pricingId,
  selectedDate,
  onDateSelect,
  rentalDays: propRentalDays,
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [availability, setAvailability] = useState<Record<string, DateAvailability>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [rentalDays, setRentalDays] = useState(propRentalDays || 0);
  const [isOpen, setIsOpen] = useState(false);

  // Update rentalDays when prop changes
  useEffect(() => {
    if (propRentalDays && propRentalDays !== rentalDays) {
      setRentalDays(propRentalDays);
    }
  }, [propRentalDays]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Calculate pickup date based on selected delivery date
  const pickupDate = useMemo(() => {
    if (!selectedDate || !rentalDays) return null;
    const date = new Date(selectedDate + 'T00:00:00');
    date.setDate(date.getDate() + rentalDays);
    return date;
  }, [selectedDate, rentalDays]);

  // Check if a date is within the rental period
  const isInRentalPeriod = (date: Date) => {
    if (!selectedDate || !rentalDays) return false;
    const deliveryDate = new Date(selectedDate + 'T00:00:00');
    const pickup = new Date(deliveryDate);
    pickup.setDate(pickup.getDate() + rentalDays);

    const dateTime = date.getTime();
    return dateTime > deliveryDate.getTime() && dateTime < pickup.getTime();
  };

  // Check if date is the delivery date
  const isDeliveryDate = (date: Date) => {
    if (!selectedDate) return false;
    return date.toISOString().split('T')[0] === selectedDate;
  };

  // Check if date is the pickup date
  const isPickupDate = (date: Date) => {
    if (!pickupDate) return false;
    return date.toISOString().split('T')[0] === pickupDate.toISOString().split('T')[0];
  };

  // Fetch availability when month changes or dumpster/pricing changes
  useEffect(() => {
    if (!dumpsterId || !pricingId) return;

    const fetchAvailability = async () => {
      setIsLoading(true);
      try {
        const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 2, 0); // Get 2 months

        const response = await fetch('/api/availability/date-range', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dumpsterId,
            pricingId,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setAvailability(data.availability);
          if (data.rentalDays) {
            setRentalDays(data.rentalDays);
          }
        }
      } catch (error) {
        console.error('Error fetching availability:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, [dumpsterId, pricingId, currentMonth]);

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysCount = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysCount; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [currentMonth]);

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const goToPreviousMonth = () => {
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    // Don't go before current month
    if (prevMonth >= new Date(today.getFullYear(), today.getMonth(), 1)) {
      setCurrentMonth(prevMonth);
    }
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const canGoPrevious = useMemo(() => {
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    return prevMonth >= new Date(today.getFullYear(), today.getMonth(), 1);
  }, [currentMonth, today]);

  const isDateSelectable = (date: Date) => {
    if (date < today) return false;
    const dateKey = date.toISOString().split('T')[0];
    const dateAvail = availability[dateKey];
    return dateAvail?.available !== false;
  };

  const getDateStatus = (date: Date): 'available' | 'limited' | 'unavailable' | 'past' => {
    if (date < today) return 'past';
    const dateKey = date.toISOString().split('T')[0];
    const dateAvail = availability[dateKey];

    if (!dateAvail) return 'available'; // Default to available if no data yet
    if (!dateAvail.available) return 'unavailable';
    if (dateAvail.unitsAvailable <= 1) return 'limited';
    return 'available';
  };

  const handleDateClick = (date: Date) => {
    if (!isDateSelectable(date)) return;
    const dateStr = date.toISOString().split('T')[0];
    onDateSelect(dateStr);
    setIsOpen(false);
  };

  const formatSelectedDate = (dateStr: string) => {
    if (!dateStr) return 'Select a date';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getPickupDateStr = (deliveryDate: string) => {
    if (!deliveryDate || !rentalDays) return '';
    const date = new Date(deliveryDate + 'T00:00:00');
    date.setDate(date.getDate() + rentalDays);
    return formatDateShort(date);
  };

  return (
    <div className="space-y-4">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 border-2 rounded-lg transition-all text-left",
          selectedDate
            ? "border-primary bg-primary/10"
            : "border-border bg-background hover:border-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
        )}
      >
        <div className="flex items-center gap-3">
          <Calendar className={cn(
            "h-5 w-5",
            selectedDate ? "text-primary" : "text-muted-foreground"
          )} />
          <span className={cn(
            "font-medium",
            selectedDate ? "text-foreground" : "text-muted-foreground"
          )}>
            {selectedDate ? 'Change delivery date' : 'Select a delivery date'}
          </span>
        </div>
        <ChevronRight className={cn(
          "h-5 w-5 text-muted-foreground transition-transform",
          isOpen && "rotate-90"
        )} />
      </button>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="bg-card border border-border rounded-xl shadow-xl p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={goToPreviousMonth}
              disabled={!canGoPrevious}
              className={cn(
                "p-2 rounded-lg transition-colors",
                canGoPrevious
                  ? "hover:bg-accent text-foreground"
                  : "text-muted-foreground/50 cursor-not-allowed"
              )}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h3 className="font-semibold text-foreground">{monthName}</h3>
            <button
              type="button"
              onClick={goToNextMonth}
              className="p-2 rounded-lg hover:bg-accent text-foreground transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {daysInMonth.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="h-10" />;
                }

                const dateStr = date.toISOString().split('T')[0];
                const isDelivery = isDeliveryDate(date);
                const isPickup = isPickupDate(date);
                const isInPeriod = isInRentalPeriod(date);
                const status = getDateStatus(date);
                const selectable = isDateSelectable(date);

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => handleDateClick(date)}
                    disabled={!selectable}
                    className={cn(
                      "h-10 w-full text-sm font-medium transition-all relative",
                      // Delivery date (start)
                      isDelivery && "bg-primary text-primary-foreground rounded-l-lg rounded-r-none",
                      // Pickup date (end)
                      isPickup && "bg-amber-700 text-white rounded-r-lg rounded-l-none",
                      // In rental period (middle)
                      isInPeriod && !isDelivery && !isPickup && "bg-primary/20 text-foreground",
                      // Available (not in rental period)
                      !isDelivery && !isPickup && !isInPeriod && status === 'available' && "bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/30 rounded-lg",
                      // Limited availability
                      !isDelivery && !isPickup && !isInPeriod && status === 'limited' && "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/30 rounded-lg",
                      // Unavailable
                      !isDelivery && !isPickup && !isInPeriod && status === 'unavailable' && "bg-muted text-muted-foreground/50 cursor-not-allowed line-through rounded-lg",
                      // Past dates
                      !isDelivery && !isPickup && !isInPeriod && status === 'past' && "text-muted-foreground/30 cursor-not-allowed rounded-lg"
                    )}
                  >
                    {date.getDate()}
                    {/* Low availability indicator */}
                    {status === 'limited' && !isDelivery && !isPickup && !isInPeriod && (
                      <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-yellow-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-primary" />
              <span className="text-xs text-muted-foreground">Drop-off</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-primary/20" />
              <span className="text-xs text-muted-foreground">Rental</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-amber-700" />
              <span className="text-xs text-muted-foreground">Pickup</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-green-500/30 border border-green-500/50" />
              <span className="text-xs text-muted-foreground">Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-muted" />
              <span className="text-xs text-muted-foreground">Unavailable</span>
            </div>
          </div>
        </div>
      )}

      {/* Selected Dates Display */}
      {selectedDate && rentalDays > 0 && (
        <div className="bg-primary/10 border-2 border-primary rounded-xl p-4">
          <div className="flex items-center justify-between gap-4">
            {/* Delivery */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Truck className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Drop-off</span>
              </div>
              <p className="font-semibold text-foreground ml-10">
                {formatSelectedDate(selectedDate)}
              </p>
            </div>

            {/* Arrow/Duration */}
            <div className="flex flex-col items-center px-2">
              <div className="text-xs text-muted-foreground font-medium">{rentalDays} days</div>
              <div className="w-12 h-0.5 bg-primary my-1" />
              <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z"/>
              </svg>
            </div>

            {/* Pickup */}
            <div className="flex-1 text-right">
              <div className="flex items-center justify-end gap-2 mb-1">
                <span className="text-sm font-medium text-muted-foreground">Pickup</span>
                <div className="w-8 h-8 rounded-full bg-amber-700 flex items-center justify-center">
                  <Package className="h-4 w-4 text-white" />
                </div>
              </div>
              <p className="font-semibold text-foreground mr-10">
                {getPickupDateStr(selectedDate)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
