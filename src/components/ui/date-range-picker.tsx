'use client';

import { useState, useEffect, useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import type { DateRange } from 'react-day-picker';
import { Loader2, Truck, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  dumpsterId: number;
  minDays?: number;
  maxDays?: number;
  onRangeSelect: (startDate: string, endDate: string, days: number) => void;
}

interface DateAvailability {
  available: boolean;
  unitsAvailable: number;
  totalUnits: number;
}

/** Local-date ISO string — avoids UTC midnight timezone shifts */
function toYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateFull(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function DateRangePicker({
  dumpsterId,
  minDays = 1,
  maxDays = 90,
  onRangeSelect,
}: DateRangePickerProps) {
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [availability, setAvailability] = useState<Record<string, DateAvailability>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  // Earliest selectable date = tomorrow
  const fromDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 1);
    return d;
  }, []);

  // Fetch availability for the current 2-month view window
  useEffect(() => {
    if (!dumpsterId) return;
    const controller = new AbortController();

    (async () => {
      setIsLoading(true);
      try {
        const startDate = toYMD(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1));
        const endDate = toYMD(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 2, 0));

        const res = await fetch('/api/availability/date-range', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dumpsterId, startDate, endDate, rentalDays: minDays }),
          signal: controller.signal,
        });

        if (res.ok) {
          const data = await res.json();
          // Merge so we keep data from previous months that are still in view
          setAvailability(prev => ({ ...prev, ...data.availability }));
        }
      } catch (e) {
        if (!(e instanceof Error && e.name === 'AbortError')) {
          console.error('Error fetching availability:', e);
        }
      } finally {
        setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [dumpsterId, minDays, viewMonth]);

  // Build list of disabled (unavailable) dates for react-day-picker
  const disabledDates = useMemo<Date[]>(() =>
    Object.entries(availability)
      .filter(([, a]) => !a.available)
      .map(([s]) => {
        const [y, mo, d] = s.split('-').map(Number);
        return new Date(y, mo - 1, d);
      }),
  [availability]);

  // Dates with exactly 1 unit remaining — shown in yellow with a dot
  const limitedDates = useMemo<Date[]>(() =>
    Object.entries(availability)
      .filter(([, a]) => a.available && a.unitsAvailable <= 1)
      .map(([s]) => { const [y, mo, d] = s.split('-').map(Number); return new Date(y, mo - 1, d); }),
  [availability]);

  // Dates with 2+ units — shown in green
  const availableDates = useMemo<Date[]>(() =>
    Object.entries(availability)
      .filter(([, a]) => a.available && a.unitsAvailable > 1)
      .map(([s]) => { const [y, mo, d] = s.split('-').map(Number); return new Date(y, mo - 1, d); }),
  [availability]);

  // Compute rental days from selected range
  const computedDays = useMemo(() => {
    if (!range?.from || !range?.to) return 0;
    return Math.ceil((range.to.getTime() - range.from.getTime()) / 86400000);
  }, [range]);

  const isValid = !!range?.from && !!range?.to && computedDays >= minDays && computedDays <= maxDays;

  const handleSelect = (sel: DateRange | undefined) => {
    setRange(sel);
    if (sel?.from && sel?.to) {
      const days = Math.ceil((sel.to.getTime() - sel.from.getTime()) / 86400000);
      if (days >= minDays && days <= maxDays) {
        onRangeSelect(toYMD(sel.from), toYMD(sel.to), days);
      }
    }
  };

  // Instructional hint shown below the calendar
  const hintText = !range?.from
    ? 'Click a start date for your drop-off'
    : !range?.to
    ? 'Now click an end (pickup) date'
    : computedDays < minDays
    ? `Minimum rental is ${minDays} day${minDays !== 1 ? 's' : ''}`
    : computedDays > maxDays
    ? `Maximum rental is ${maxDays} day${maxDays !== 1 ? 's' : ''}`
    : null;

  const hintIsError = !!range?.from && !!range?.to && !isValid;

  return (
    <div className="space-y-3">
      {/* Calendar */}
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        {isLoading && (
          <div className="flex items-center gap-2 justify-center px-4 py-2 text-sm text-muted-foreground border-b border-border">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Checking availability…
          </div>
        )}
        <DayPicker
          mode="range"
          numberOfMonths={2}
          selected={range}
          onSelect={handleSelect}
          fromDate={fromDate}
          disabled={[{ before: fromDate }, ...disabledDates]}
          onMonthChange={(m) =>
            setViewMonth(new Date(m.getFullYear(), m.getMonth(), 1))
          }
          classNames={{
            months: 'flex flex-wrap gap-6 p-4',
            month: 'space-y-1',
            caption: 'flex justify-between items-center px-2 mb-3',
            caption_label: 'text-sm font-semibold text-foreground',
            nav: 'flex items-center gap-1',
            nav_button: cn(
              'h-7 w-7 flex items-center justify-center rounded-md',
              'hover:bg-accent transition-colors text-foreground',
              'disabled:opacity-30 disabled:pointer-events-none'
            ),
            nav_button_previous: '',
            nav_button_next: '',
            table: 'w-full border-collapse',
            head_row: 'flex',
            head_cell:
              'text-muted-foreground/60 text-xs font-medium w-9 text-center py-2',
            row: 'flex w-full mt-0.5',
            cell: 'w-9 h-9 text-center p-0 relative',
            day: cn(
              'w-full h-9 text-sm font-medium flex items-center justify-center',
              'transition-colors rounded-md hover:bg-accent text-foreground',
              'focus:outline-none focus:ring-1 focus:ring-primary'
            ),
            day_selected:
              'bg-primary text-primary-foreground hover:bg-primary/90 rounded-md',
            day_range_start:
              '!rounded-r-none !rounded-l-md bg-primary text-primary-foreground hover:bg-primary/90',
            day_range_end:
              '!rounded-l-none !rounded-r-md bg-amber-700 text-white hover:bg-amber-700/90',
            day_range_middle:
              '!rounded-none bg-primary/20 text-foreground hover:bg-primary/30',
            day_disabled:
              'text-muted-foreground/30 line-through pointer-events-none opacity-40',
            day_outside: 'text-muted-foreground/20 pointer-events-none',
            day_today: 'font-extrabold underline underline-offset-2',
          }}
          modifiers={{
            limited: limitedDates,
            available: availableDates,
          }}
          modifiersClassNames={{
            limited: 'bg-yellow-500/20 !text-yellow-700 dark:!text-yellow-400 hover:bg-yellow-500/30',
            available: 'bg-green-500/20 !text-green-700 dark:!text-green-400 hover:bg-green-500/30',
          }}
          components={{
            DayContent: ({ date, activeModifiers }) => (
              <span className="relative flex items-center justify-center w-full h-full">
                {date.getDate()}
                {activeModifiers.limited && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-yellow-500 rounded-full" />
                )}
              </span>
            ),
          }}
        />

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 pb-3 pt-2 border-t border-border mt-1">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-500/30 border border-green-500/50" />
            <span className="text-xs text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="relative w-3 h-3 rounded bg-yellow-500/30 border border-yellow-500/50">
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-yellow-500 rounded-full" />
            </div>
            <span className="text-xs text-muted-foreground">Limited</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-muted" />
            <span className="text-xs text-muted-foreground">Unavailable</span>
          </div>
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
        </div>
      </div>

      {/* Hint / validation message */}
      {hintText && (
        <p
          className={cn(
            'text-sm text-center',
            hintIsError ? 'text-destructive' : 'text-muted-foreground'
          )}
        >
          {hintText}
        </p>
      )}

      {/* Drop-off → Pickup summary card (appears once range is valid) */}
      {isValid && range?.from && range?.to && (
        <div className="bg-primary/10 border-2 border-primary rounded-xl p-4">
          <div className="flex items-center justify-between gap-4">
            {/* Drop-off */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Truck className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Drop-off</span>
              </div>
              <p className="font-semibold text-foreground ml-10">
                {formatDateFull(range.from)}
              </p>
            </div>

            {/* Arrow / duration */}
            <div className="flex flex-col items-center px-2 shrink-0">
              <div className="text-xs text-muted-foreground font-medium">
                {computedDays} day{computedDays !== 1 ? 's' : ''}
              </div>
              <div className="w-12 h-0.5 bg-primary my-1" />
              <svg
                className="w-3 h-3 text-primary"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z" />
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
                {formatDateFull(range.to)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
