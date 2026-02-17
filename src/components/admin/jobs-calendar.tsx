'use client';

import { useState, useEffect, useMemo } from 'react';
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
  ArrowUpFromLine,
  RefreshCw,
  Wrench,
} from 'lucide-react';

interface Job {
  id: number;
  jobType: 'delivery' | 'pickup' | 'swap' | 'service';
  customerName: string;
  customerPhone: string;
  address: string;
  city: string;
  zipCode: string;
  scheduledDate: string;
  timePreference: string | null;
  status: string;
  dumpsterId: number | null;
  serviceName: string | null;
  dumpster: {
    id: number;
    name: string;
    dimensions: string;
  } | null;
}

interface Dumpster {
  id: number;
  name: string;
  size: number;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  extendedProps: {
    job: Job;
    dumpsterName: string;
  };
  backgroundColor: string;
  borderColor: string;
  textColor: string;
}

interface JobsCalendarProps {
  jobs: Job[];
  dumpsters: Dumpster[];
}

const jobTypeColors = {
  delivery: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  pickup: { bg: '#f3e8ff', border: '#a855f7', text: '#6b21a8' },
  swap: { bg: '#ffedd5', border: '#f97316', text: '#9a3412' },
  service: { bg: '#dcfce7', border: '#22c55e', text: '#166534' },
};

const jobTypeIcons = {
  delivery: Truck,
  pickup: ArrowUpFromLine,
  swap: RefreshCw,
  service: Wrench,
};

export function JobsCalendar({ jobs, dumpsters }: JobsCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentView, setCurrentView] = useState('timeGridWeek');

  const getDumpsterName = (dumpsterId: number | null) => {
    if (!dumpsterId) return 'No dumpster';
    return dumpsters.find((d) => d.id === dumpsterId)?.name || `Dumpster #${dumpsterId}`;
  };

  // Convert jobs to calendar events
  useEffect(() => {
    const calendarEvents: CalendarEvent[] = jobs.map((job) => {
      const colors = jobTypeColors[job.jobType];
      const dumpsterName = getDumpsterName(job.dumpsterId);
      const jobLabel = job.jobType === 'service' && job.serviceName ? job.serviceName : job.jobType.charAt(0).toUpperCase() + job.jobType.slice(1);

      return {
        id: `job-${job.id}`,
        title: `${jobLabel}: ${job.customerName}`,
        start: job.scheduledDate,
        extendedProps: {
          job,
          dumpsterName,
        },
        backgroundColor: colors.bg,
        borderColor: colors.border,
        textColor: colors.text,
      };
    });

    setEvents(calendarEvents);
  }, [jobs, dumpsters]);

  const handleEventClick = (info: any) => {
    setSelectedEvent(info.event.toPlainObject() as unknown as CalendarEvent);
    setIsDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    const label = status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1);
    return <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>{label}</Badge>;
  };

  const getTypeBadge = (jobType: string, serviceName?: string | null) => {
    const colors = jobTypeColors[jobType as keyof typeof jobTypeColors];
    const Icon = jobTypeIcons[jobType as keyof typeof jobTypeIcons];
    const label = jobType === 'service' && serviceName ? serviceName : jobType.charAt(0).toUpperCase() + jobType.slice(1);
    return (
      <Badge style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="calendar-container">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={currentView}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            events={events}
            eventClick={handleEventClick}
            height="auto"
            eventDisplay="block"
            dayMaxEvents={3}
            viewDidMount={(info) => setCurrentView(info.view.type)}
            eventContent={(eventInfo) => {
              const job = eventInfo.event.extendedProps.job;
              const Icon = jobTypeIcons[job.jobType as keyof typeof jobTypeIcons];
              return (
                <div className="p-1 overflow-hidden">
                  <div className="flex items-center gap-1 text-xs font-medium truncate">
                    <Icon className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{eventInfo.event.title}</span>
                  </div>
                  {job.dumpster && (
                    <div className="text-[10px] opacity-75 truncate">{job.dumpster.name}</div>
                  )}
                </div>
              );
            }}
          />
        </div>

        {/* Event Detail Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedEvent && (
                  <>
                    {getTypeBadge(
                      selectedEvent.extendedProps.job.jobType,
                      selectedEvent.extendedProps.job.serviceName
                    )}
                    <span>{selectedEvent.extendedProps.job.customerName}</span>
                  </>
                )}
              </DialogTitle>
            </DialogHeader>

            {selectedEvent && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedEvent.extendedProps.job.status)}
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <CalendarIcon className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Scheduled</p>
                      <p className="text-gray-600">{formatDate(selectedEvent.extendedProps.job.scheduledDate)}</p>
                      <p className="text-gray-500 text-xs">
                        {selectedEvent.extendedProps.job.timePreference || 'Anytime'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-gray-600">
                        {selectedEvent.extendedProps.job.address}
                        <br />
                        {selectedEvent.extendedProps.job.city}, {selectedEvent.extendedProps.job.zipCode}
                      </p>
                    </div>
                  </div>

                  {selectedEvent.extendedProps.job.dumpster && (
                    <div className="flex items-start gap-2">
                      <Package className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Dumpster</p>
                        <p className="text-gray-600">{selectedEvent.extendedProps.job.dumpster.name}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Contact</p>
                      <a
                        href={`tel:${selectedEvent.extendedProps.job.customerPhone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {selectedEvent.extendedProps.job.customerPhone}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(`tel:${selectedEvent.extendedProps.job.customerPhone}`)}
                  >
                    <Phone className="h-4 w-4 mr-1" />
                    Call
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      const job = selectedEvent.extendedProps.job;
                      const address = `${job.address}, ${job.city}, ${job.zipCode}`;
                      window.open(`https://maps.google.com/maps?daddr=${encodeURIComponent(address)}`, '_blank');
                    }}
                  >
                    <Navigation className="h-4 w-4 mr-1" />
                    Navigate
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
