'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Calendar as CalendarIcon,
  MapPin,
  Loader2,
  Truck,
  Phone,
  Mail,
  User,
  CheckCircle2,
  Clock,
  XCircle,
  Navigation,
  Package,
  ArrowUpFromLine,
  RefreshCw,
  Wrench,
  X,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  List,
  Map,
  Eye,
} from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { JobsCalendar } from '@/components/admin/jobs-calendar';
import { JobsMap } from '@/components/admin/jobs-map';
import { AdditionalCharges } from '@/components/admin/additional-charges';
import { JobLoadTracking } from '@/components/admin/job-load-tracking';
import {
  type Job,
  type RentalLifecycleStatus,
  type RentalGroup,
  type SingleJob,
  type DisplayItem,
  lifecycleConfig,
  rentalLifecycleSteps,
  deriveLifecycleStatus,
  getActiveJob,
  getRentalStepNumber,
  getNextRentalAction,
  getRentalOverrideActions,
  statusConfig as sharedStatusConfig,
  groupJobsIntoDisplayItems,
} from '@/lib/rental-lifecycle';

interface FleetUnit {
  id: number;
  unitNumber: string;
  dumpsterId: number;
  status: string;
}

interface Dumpster {
  id: number;
  name: string;
  size: number;
}

interface Hub {
  id: number;
  name: string;
  address: string;
  city: string;
  zipCode: string;
}

interface Booking {
  id: number;
  customerName: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryZipCode: string;
  status: string;
  dumpsterId: number;
}

const jobTypeConfig = {
  delivery: { label: 'Delivery', icon: Truck, color: 'bg-blue-100 text-blue-700' },
  pickup: { label: 'Pickup', icon: ArrowUpFromLine, color: 'bg-purple-100 text-purple-700' },
  swap: { label: 'Swap', icon: RefreshCw, color: 'bg-orange-100 text-orange-700' },
  service: { label: 'Service', icon: Wrench, color: 'bg-green-100 text-green-700' },
};

// statusConfig with icons (extends shared config)
const statusConfig = {
  pending: { label: 'Pending', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
  scheduled: { label: 'Scheduled', icon: CalendarIcon, color: 'bg-blue-100 text-blue-800' },
  en_route: { label: 'En Route', icon: Navigation, color: 'bg-sky-100 text-sky-800' },
  picked_up: { label: 'Picked Up', icon: Package, color: 'bg-purple-100 text-purple-800' },
  dumping: { label: 'Dump/Load', icon: Truck, color: 'bg-amber-100 text-amber-800' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'bg-red-100 text-red-800' },
  // Legacy
  in_progress: { label: 'In Progress', icon: Truck, color: 'bg-orange-100 text-orange-800' },
};

const statusOrder = [
  { value: 'pending', label: 'Pending', step: 1 },
  { value: 'scheduled', label: 'Scheduled', step: 2 },
  { value: 'en_route', label: 'En Route', step: 3 },
  { value: 'completed', label: 'Completed', step: 4 },
];

// deriveLifecycleStatus, getActiveJob, rentalLifecycleSteps, getRentalStepNumber,
// getNextRentalAction, getRentalOverrideActions are all imported from @/lib/rental-lifecycle

// Quick view presets
interface QuickView {
  id: string;
  name: string;
  filters: {
    status: string;
    dateRange: string;
    type: string;
  };
}

const quickViews: QuickView[] = [
  { id: 'today-all', name: "Today's Jobs", filters: { status: 'active', dateRange: 'today', type: 'all' } },
  { id: 'today-deliveries', name: "Today's Deliveries", filters: { status: 'active', dateRange: 'today', type: 'delivery' } },
  { id: 'today-pickups', name: "Today's Pickups", filters: { status: 'active', dateRange: 'today', type: 'pickup' } },
  { id: 'pending', name: 'Pending Jobs', filters: { status: 'pending', dateRange: 'all', type: 'all' } },
  { id: 'active-rentals', name: 'Active Rentals', filters: { status: 'active', dateRange: 'all', type: 'rental' } },
  { id: 'services', name: 'Service Jobs', filters: { status: 'active', dateRange: 'all', type: 'service' } },
  { id: 'overdue', name: 'Overdue', filters: { status: 'active', dateRange: 'overdue', type: 'all' } },
];

export default function JobsPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // URL params for deep linking
  const initialStatus = searchParams.get('status') || 'active';
  const initialDateRange = searchParams.get('dateRange') || 'all';
  const initialType = searchParams.get('type') || 'all';

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>(initialType);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [dateFilter, setDateFilter] = useState<string>(initialDateRange);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [sortBy, setSortBy] = useState<string>('scheduledDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isMobileView, setIsMobileView] = useState(false);
  const [isEditingAdminNotes, setIsEditingAdminNotes] = useState(false);
  const [adminNotesValue, setAdminNotesValue] = useState('');
  const [selectedRental, setSelectedRental] = useState<RentalGroup | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<{ type: 'rental'; rental: RentalGroup } | { type: 'single'; jobId: number; jobLabel: string } | null>(null);

  // Return destination dialog state
  const [returnDestinationDialog, setReturnDestinationDialog] = useState<{ jobId: number; rental: RentalGroup } | null>(null);
  const [selectedDropOffType, setSelectedDropOffType] = useState<string>('');
  const [selectedHubId, setSelectedHubId] = useState<string>('');
  const [selectedCustomerBookingId, setSelectedCustomerBookingId] = useState<string>('');

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch jobs
  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ['admin-jobs'],
    queryFn: async () => {
      const res = await fetch('/api/admin/jobs');
      if (!res.ok) throw new Error('Failed to fetch jobs');
      return res.json();
    },
  });

  // Fetch fleet units for assignment
  const { data: fleetUnits = [] } = useQuery<FleetUnit[]>({
    queryKey: ['fleet-units'],
    queryFn: async () => {
      const res = await fetch('/api/admin/fleet-units');
      if (!res.ok) throw new Error('Failed to fetch fleet units');
      return res.json();
    },
  });

  // Fetch dumpsters
  const { data: dumpsters = [] } = useQuery<Dumpster[]>({
    queryKey: ['admin-dumpsters'],
    queryFn: async () => {
      const res = await fetch('/api/admin/dumpsters');
      if (!res.ok) throw new Error('Failed to fetch dumpsters');
      return res.json();
    },
  });

  // Fetch hubs (for return destination dialog)
  const { data: hubs = [] } = useQuery<Hub[]>({
    queryKey: ['admin-hubs'],
    queryFn: async () => {
      const res = await fetch('/api/admin/hubs');
      if (!res.ok) throw new Error('Failed to fetch hubs');
      return res.json();
    },
  });

  // Fetch bookings (for transfer-to-customer option)
  const { data: bookingsData = [] } = useQuery<Booking[]>({
    queryKey: ['admin-bookings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/bookings');
      if (!res.ok) throw new Error('Failed to fetch bookings');
      return res.json();
    },
  });

  // Update job status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ jobId, status, returnDestination }: { jobId: number; status: string; returnDestination?: any }) => {
      const res = await fetch(`/api/admin/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, returnDestination }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: (updatedJobData, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
      toast({ title: 'Status updated', description: 'Job status has been updated.' });

      // Update local state immediately for responsiveness
      if (selectedRental) {
        // Update the correct job in the rental group
        const newDelivery = selectedRental.deliveryJob.id === variables.jobId
          ? { ...selectedRental.deliveryJob, status: variables.status as Job['status'], completedAt: updatedJobData.completedAt }
          : selectedRental.deliveryJob;
        const newPickup = selectedRental.pickupJob.id === variables.jobId
          ? { ...selectedRental.pickupJob, status: variables.status as Job['status'], completedAt: updatedJobData.completedAt }
          : selectedRental.pickupJob;
        const updatedRental: RentalGroup = {
          ...selectedRental,
          deliveryJob: newDelivery,
          pickupJob: newPickup,
          lifecycleStatus: deriveLifecycleStatus(newDelivery, newPickup),
        };
        setSelectedRental(updatedRental);
        setSelectedJob(newDelivery); // always show delivery job data
      } else if (selectedJob && selectedJob.id === variables.jobId) {
        setSelectedJob({ ...selectedJob, status: variables.status as Job['status'] });
      }
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update status.', variant: 'destructive' });
    },
  });

  // Update job mutation
  const updateJobMutation = useMutation({
    mutationFn: async ({ jobId, data }: { jobId: number; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/admin/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update job');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
      toast({ title: 'Job updated', description: 'Job has been updated successfully.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update job.', variant: 'destructive' });
    },
  });

  // Apply quick view
  const applyQuickView = (view: QuickView) => {
    setStatusFilter(view.filters.status);
    setDateFilter(view.filters.dateRange);
    setTypeFilter(view.filters.type);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setStatusFilter('all');
    setDateFilter('all');
    setTypeFilter('all');
    setSearchQuery('');
  };

  const hasActiveFilters = statusFilter !== 'all' || dateFilter !== 'all' || typeFilter !== 'all' || searchQuery !== '';

  // Group and filter jobs into display items
  const displayItems = useMemo(() => {
    // Step A: Group delivery+pickup pairs by bookingId
    const rentalMap: Record<number, { delivery?: Job; pickup?: Job }> = {};
    const singles: Job[] = [];

    for (const job of jobs) {
      if (job.bookingId != null && (job.jobType === 'delivery' || job.jobType === 'pickup')) {
        const entry = rentalMap[job.bookingId] || {};
        if (job.jobType === 'delivery') entry.delivery = job;
        else entry.pickup = job;
        rentalMap[job.bookingId] = entry;
      } else {
        singles.push(job);
      }
    }

    let items: DisplayItem[] = [];

    // Create RentalGroups for complete pairs, singles for incomplete
    for (const [bookingIdStr, pair] of Object.entries(rentalMap)) {
      const bookingId = Number(bookingIdStr);
      if (pair.delivery && pair.pickup) {
        items.push({
          kind: 'rental',
          bookingId,
          deliveryJob: pair.delivery,
          pickupJob: pair.pickup,
          lifecycleStatus: deriveLifecycleStatus(pair.delivery, pair.pickup),
        });
      } else {
        if (pair.delivery) singles.push(pair.delivery);
        if (pair.pickup) singles.push(pair.pickup);
      }
    }

    // Add remaining singles
    for (const job of singles) {
      items.push({ kind: 'single', job });
    }

    // Step B: Apply filters
    // Type filter
    if (typeFilter !== 'all') {
      items = items.filter((item) => {
        if (typeFilter === 'rental') return item.kind === 'rental';
        if (item.kind === 'rental') {
          // Show rental groups when filtering by delivery or pickup
          return typeFilter === 'delivery' || typeFilter === 'pickup';
        }
        return item.job.jobType === typeFilter;
      });
    }

    // Status filter
    if (statusFilter === 'active') {
      items = items.filter((item) => {
        if (item.kind === 'rental') {
          return !['completed', 'cancelled'].includes(item.lifecycleStatus);
        }
        return !['completed', 'cancelled'].includes(item.job.status);
      });
    } else if (statusFilter !== 'all') {
      items = items.filter((item) => {
        if (item.kind === 'rental') {
          const activeJob = getActiveJob(item);
          return activeJob.status === statusFilter;
        }
        return item.job.status === statusFilter;
      });
    }

    // Date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() + 7);

      const matchesDateFilter = (job: Job) => {
        const jobDate = new Date(job.scheduledDate);
        jobDate.setHours(0, 0, 0, 0);
        switch (dateFilter) {
          case 'today': return jobDate.getTime() === today.getTime();
          case 'tomorrow': return jobDate.getTime() === tomorrow.getTime();
          case 'week': return jobDate >= today && jobDate <= weekEnd;
          case 'overdue': return jobDate < today && !['completed', 'cancelled'].includes(job.status);
          default: return true;
        }
      };

      items = items.filter((item) => {
        if (item.kind === 'rental') {
          return matchesDateFilter(getActiveJob(item));
        }
        return matchesDateFilter(item.job);
      });
    }

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const jobMatchesSearch = (job: Job) =>
        job.customerName.toLowerCase().includes(query) ||
        job.customerPhone.includes(query) ||
        job.address.toLowerCase().includes(query) ||
        job.city.toLowerCase().includes(query) ||
        job.id.toString().includes(query);

      items = items.filter((item) => {
        if (item.kind === 'rental') {
          return jobMatchesSearch(item.deliveryJob) || jobMatchesSearch(item.pickupJob);
        }
        return jobMatchesSearch(item.job);
      });
    }

    // Sort
    const getSortJob = (item: DisplayItem): Job =>
      item.kind === 'rental' ? getActiveJob(item) : item.job;

    items.sort((a, b) => {
      const jobA = getSortJob(a);
      const jobB = getSortJob(b);
      let comparison = 0;
      switch (sortBy) {
        case 'id':
          comparison = jobA.id - jobB.id;
          break;
        case 'scheduledDate':
          comparison = new Date(jobA.scheduledDate).getTime() - new Date(jobB.scheduledDate).getTime();
          break;
        case 'createdAt':
          comparison = new Date(jobA.createdAt).getTime() - new Date(jobB.createdAt).getTime();
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return items;
  }, [jobs, typeFilter, statusFilter, dateFilter, searchQuery, sortBy, sortOrder]);

  // Flatten display items back to jobs for calendar/map
  const flattenedJobs = useMemo(() => {
    return displayItems.flatMap(item =>
      item.kind === 'rental' ? [item.deliveryJob, item.pickupJob] : [item.job]
    );
  }, [displayItems]);

  // Stats
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeRentals = displayItems.filter(
      (item) => item.kind === 'rental' && ['rental_active', 'pickup_en_route', 'picked_up', 'dumping'].includes(item.lifecycleStatus)
    ).length;

    return {
      total: jobs.length,
      todaysJobs: jobs.filter((j) => {
        const jobDate = new Date(j.scheduledDate);
        jobDate.setHours(0, 0, 0, 0);
        return jobDate.getTime() === today.getTime() && !['completed', 'cancelled'].includes(j.status);
      }).length,
      pending: jobs.filter((j) => j.status === 'pending').length,
      inProgress: jobs.filter((j) => j.status === 'en_route' || j.status === 'in_progress').length,
      activeRentals,
    };
  }, [jobs, displayItems]);

  const openJobDetail = (job: Job) => {
    setSelectedJob(job);
    setSelectedRental(null);
    setShowDetailDialog(true);
    setIsEditingAdminNotes(false);
    setAdminNotesValue(job.adminNotes || '');
  };

  const openRentalDetail = (rental: RentalGroup) => {
    // Always use delivery job — customer, location, dumpster, fleet unit data is the same
    setSelectedJob(rental.deliveryJob);
    setSelectedRental(rental);
    setShowDetailDialog(true);
    setIsEditingAdminNotes(false);
    setAdminNotesValue(rental.deliveryJob.adminNotes || '');
  };

  const handleStatusChange = (jobId: number, newStatus: string, skipConfirm = false) => {
    // Intercept cancellation — require confirmation
    if (newStatus === 'cancelled' && !skipConfirm) {
      const job = jobs.find(j => j.id === jobId);
      setCancelConfirm({ type: 'single', jobId, jobLabel: job ? `Job #${job.id} (${job.jobType})` : `Job #${jobId}` });
      return;
    }

    // Intercept pickup "Complete & Return" — show return destination dialog
    if (newStatus === 'completed') {
      const job = jobs.find(j => j.id === jobId);
      if (job?.jobType === 'pickup' && job.status === 'dumping' && selectedRental) {
        setReturnDestinationDialog({ jobId, rental: selectedRental });
        setSelectedDropOffType('');
        setSelectedHubId('');
        setSelectedCustomerBookingId('');
        return;
      }
    }

    updateStatusMutation.mutate({ jobId, status: newStatus });
  };

  // Handle return destination confirmation
  const handleReturnDestinationConfirm = () => {
    if (!returnDestinationDialog) return;

    let returnDestination;
    if (selectedDropOffType === 'hub' && selectedHubId) {
      returnDestination = {
        type: 'hub',
        hubId: parseInt(selectedHubId),
      };
    } else if (selectedDropOffType === 'customer' && selectedCustomerBookingId) {
      returnDestination = {
        type: 'customer',
        bookingId: parseInt(selectedCustomerBookingId),
      };
    }

    updateStatusMutation.mutate({
      jobId: returnDestinationDialog.jobId,
      status: 'completed',
      returnDestination,
    });

    setReturnDestinationDialog(null);
  };

  const handleRentalOverride = (value: string) => {
    if (!selectedRental) return;
    if (value === 'cancel') {
      // Show confirmation before cancelling
      setCancelConfirm({ type: 'rental', rental: selectedRental });
    } else {
      const [jobIdStr, newStatus] = value.split(':');
      handleStatusChange(parseInt(jobIdStr), newStatus);
    }
  };

  const confirmCancel = () => {
    if (!cancelConfirm) return;
    if (cancelConfirm.type === 'rental') {
      updateStatusMutation.mutate({ jobId: cancelConfirm.rental.deliveryJob.id, status: 'cancelled' });
      updateStatusMutation.mutate({ jobId: cancelConfirm.rental.pickupJob.id, status: 'cancelled' });
    } else {
      updateStatusMutation.mutate({ jobId: cancelConfirm.jobId, status: 'cancelled' });
    }
    setCancelConfirm(null);
  };

  const handleAssignFleetUnit = (jobId: number, fleetUnitId: number | null) => {
    updateJobMutation.mutate({ jobId, data: { assignedFleetUnitId: fleetUnitId } });
  };

  const saveAdminNotes = () => {
    if (!selectedJob) return;
    updateJobMutation.mutate(
      { jobId: selectedJob.id, data: { adminNotes: adminNotesValue } },
      {
        onSuccess: () => {
          setSelectedJob({ ...selectedJob, adminNotes: adminNotesValue });
          setIsEditingAdminNotes(false);
          toast({ title: 'Admin notes saved' });
        },
      }
    );
  };

  const getNextStatus = (currentStatus: string) => {
    const currentIndex = statusOrder.findIndex((s) => s.value === currentStatus);
    if (currentIndex >= 0 && currentIndex < statusOrder.length - 1) {
      return statusOrder[currentIndex + 1];
    }
    return null;
  };

  const getCurrentStep = (status: string) => {
    const found = statusOrder.find((s) => s.value === status);
    return found?.step || 0;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return <Badge>{status}</Badge>;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getTypeBadge = (jobType: string, serviceName?: string | null) => {
    const config = jobTypeConfig[jobType as keyof typeof jobTypeConfig];
    if (!config) return <Badge>{jobType}</Badge>;
    const Icon = config.icon;
    const label = jobType === 'service' && serviceName ? serviceName : config.label;
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const getJobContextBanner = (job: Job) => {
    switch (job.jobType) {
      case 'delivery':
        return {
          title: 'DUMPSTER DROP-OFF',
          subtitle: job.dumpster?.name || null,
          icon: Truck,
          colorClasses: 'bg-blue-50 border-blue-200 text-blue-800',
          linkedHref: job.bookingId ? `/admin/bookings?id=${job.bookingId}` : null,
          linkedLabel: job.bookingId ? `Booking #${job.bookingId}` : null,
        };
      case 'pickup':
        return {
          title: 'DUMPSTER PICK-UP',
          subtitle: job.dumpster?.name || null,
          icon: ArrowUpFromLine,
          colorClasses: 'bg-purple-50 border-purple-200 text-purple-800',
          linkedHref: job.bookingId ? `/admin/bookings?id=${job.bookingId}` : null,
          linkedLabel: job.bookingId ? `Booking #${job.bookingId}` : null,
        };
      case 'swap':
        return {
          title: 'DUMPSTER SWAP',
          subtitle: job.dumpster?.name || null,
          icon: RefreshCw,
          colorClasses: 'bg-orange-50 border-orange-200 text-orange-800',
          linkedHref: job.swapRequestId ? `/admin/swap-requests?id=${job.swapRequestId}` : null,
          linkedLabel: job.swapRequestId ? `Swap Request #${job.swapRequestId}` : null,
        };
      case 'service':
        return {
          title: job.serviceName?.toUpperCase() || 'SERVICE JOB',
          subtitle: null,
          icon: Wrench,
          colorClasses: 'bg-green-50 border-green-200 text-green-800',
          linkedHref: job.serviceResponseId ? `/admin/service-requests?id=${job.serviceResponseId}` : null,
          linkedLabel: job.serviceResponseId ? `Service Request #${job.serviceResponseId}` : null,
        };
    }
  };

  const getScheduledDateLabel = (jobType: Job['jobType']) => {
    switch (jobType) {
      case 'delivery': return 'Drop-off Date';
      case 'pickup': return 'Pick-up Date';
      case 'swap': return 'Swap Date';
      case 'service': return 'Service Date';
    }
  };

  const getRequestedDateLabel = (jobType: Job['jobType']) => {
    switch (jobType) {
      case 'delivery': return 'Requested Drop-off';
      case 'pickup': return 'Requested Pick-up';
      default: return 'Requested Date';
    }
  };

  if (isLoading && jobs.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-100 rounded w-48"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 sm:mb-6 min-w-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Jobs</h1>
          <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">Unified view of all deliveries, pickups, swaps, and service jobs</p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />}
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-jobs'] })}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-3 sm:mb-6 min-w-0">
        <Card className="min-w-0">
          <CardContent className="p-2.5 sm:p-4 min-w-0">
            <p className="text-[10px] sm:text-sm text-gray-500 truncate">Total Jobs</p>
            <p className="text-lg sm:text-2xl font-bold truncate">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="min-w-0 bg-yellow-50">
          <CardContent className="p-2.5 sm:p-4 min-w-0">
            <p className="text-[10px] sm:text-sm text-yellow-600 truncate">Today's Jobs</p>
            <p className="text-lg sm:text-2xl font-bold text-yellow-700 truncate">{stats.todaysJobs}</p>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardContent className="p-2.5 sm:p-4 min-w-0">
            <p className="text-[10px] sm:text-sm text-gray-500 truncate">Pending</p>
            <p className="text-lg sm:text-2xl font-bold truncate">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardContent className="p-2.5 sm:p-4 min-w-0">
            <p className="text-[10px] sm:text-sm text-gray-500 truncate">In Progress</p>
            <p className="text-lg sm:text-2xl font-bold text-blue-600 truncate">{stats.inProgress}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Views */}
      <div className="mb-3 sm:mb-4 min-w-0 overflow-x-auto">
        <span className="text-xs sm:text-sm text-gray-500 block mb-2">Quick views:</span>
        <div className="flex flex-nowrap sm:flex-wrap gap-2 pb-2">
          {quickViews.map((view) => (
            <Button
              key={view.id}
              variant="outline"
              size="sm"
              onClick={() => applyQuickView(view)}
              className="text-[11px] sm:text-xs px-2 py-1 h-auto whitespace-nowrap flex-shrink-0"
            >
              {view.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col xl:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 sm:h-9 w-full"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full xl:w-40">
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="rental">Rentals</SelectItem>
                <SelectItem value="delivery">Deliveries</SelectItem>
                <SelectItem value="pickup">Pickups</SelectItem>
                <SelectItem value="swap">Swaps</SelectItem>
                <SelectItem value="service">Services</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full xl:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="en_route">En Route</SelectItem>
                <SelectItem value="picked_up">Picked Up</SelectItem>
                <SelectItem value="dumping">Dump/Load</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range Filter */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full xl:w-40">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="tomorrow">Tomorrow</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for List, Calendar, and Map Views */}
      <Tabs defaultValue="list" className="mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 min-w-0">
          <TabsList className="flex-shrink-0 h-auto">
            <TabsTrigger value="list" className="flex items-center gap-2 h-10 px-4">
              <List className="h-5 w-5" />
              <span className="hidden sm:inline">List</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2 h-10 px-4">
              <CalendarIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2 h-10 px-4">
              <Map className="h-5 w-5" />
              <span className="hidden sm:inline">Map</span>
            </TabsTrigger>
          </TabsList>

          {/* Sort controls */}
          <div className="flex items-center gap-2 min-w-0 flex-shrink">
            <p className="text-xs sm:text-sm text-gray-500 whitespace-nowrap flex-shrink-0">{displayItems.length} jobs</p>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-28 sm:w-36 h-8 text-xs sm:text-sm flex-shrink">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduledDate">Service Date</SelectItem>
                <SelectItem value="createdAt">Created Date</SelectItem>
                <SelectItem value="id">ID</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex-shrink-0"
            >
              {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <TabsContent value="list">
          {/* Mobile Card View */}
          {isMobileView ? (
            <div className="space-y-3">
              {displayItems.map((item) => {
                if (item.kind === 'rental') {
                  const { deliveryJob, pickupJob, lifecycleStatus } = item;
                  const lcConfig = lifecycleConfig[lifecycleStatus];
                  return (
                    <Card
                      key={`rental-${item.bookingId}`}
                      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow min-w-0 border-l-4 border-amber-400"
                      onClick={() => openRentalDetail(item)}
                    >
                      <CardContent className="p-3 min-w-0">
                        <div className="flex items-start justify-between mb-2 gap-2 min-w-0">
                          <div className="min-w-0 flex-shrink">
                            <p className="font-medium truncate">{deliveryJob.customerName}</p>
                            <p className="text-xs text-gray-500">Booking #{item.bookingId}</p>
                          </div>
                          <Badge className="bg-amber-100 text-amber-800 flex-shrink-0">
                            <Truck className="h-3 w-3 mr-1" />
                            Rental
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{deliveryJob.address}</span>
                          </p>
                          <p className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {formatDate(deliveryJob.scheduledDate)}
                            <ArrowRight className="h-3 w-3 mx-0.5" />
                            {formatDate(pickupJob.scheduledDate)}
                          </p>
                          {deliveryJob.dumpster && (
                            <p className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {deliveryJob.dumpster.name}
                            </p>
                          )}
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <Badge className={lcConfig.color}>{lcConfig.label}</Badge>
                          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button variant="outline" size="sm" onClick={() => window.open(`tel:${deliveryJob.customerPhone}`)}>
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${deliveryJob.address}, ${deliveryJob.city}`)}`)}>
                              <Navigation className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }

                const job = item.job;
                return (
                  <Card
                    key={job.id}
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow min-w-0"
                    onClick={() => openJobDetail(job)}
                  >
                    <CardContent className="p-3 min-w-0">
                      <div className="flex items-start justify-between mb-2 gap-2 min-w-0">
                        <div className="min-w-0 flex-shrink">
                          <p className="font-medium truncate">{job.customerName}</p>
                          <p className="text-xs text-gray-500">#{job.id}</p>
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-1">
                          {getTypeBadge(job.jobType, job.serviceName)}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{job.address}</span>
                        </p>
                        <p className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {formatDate(job.scheduledDate)}
                        </p>
                        {job.bookingDeliveryDate &&
                          formatDate(job.bookingDeliveryDate) !== formatDate(job.scheduledDate) && (
                          <p className="text-xs text-amber-600">
                            Requested: {formatDate(job.bookingDeliveryDate)}
                          </p>
                        )}
                        {job.dumpster && (
                          <p className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {job.dumpster.name}
                          </p>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={job.status}
                            onValueChange={(newStatus) => handleStatusChange(job.id, newStatus)}
                          >
                            <SelectTrigger className="w-[120px] h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOrder.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                  {s.label}
                                </SelectItem>
                              ))}
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="outline" size="sm" onClick={() => window.open(`tel:${job.customerPhone}`)}>
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${job.address}, ${job.city}`)}`)}>
                            <Navigation className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* Desktop Table View */
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Dumpster</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayItems.map((item) => {
                      if (item.kind === 'rental') {
                        const { deliveryJob, pickupJob, lifecycleStatus } = item;
                        const lcConfig = lifecycleConfig[lifecycleStatus];
                        return (
                          <TableRow
                            key={`rental-${item.bookingId}`}
                            className="cursor-pointer hover:bg-amber-50/50 border-l-4 border-amber-400"
                            onClick={() => openRentalDetail(item)}
                          >
                            <TableCell className="font-mono text-xs">
                              <span className="text-gray-500">D#{deliveryJob.id}</span>
                              <span className="text-gray-300 mx-0.5">/</span>
                              <span className="text-gray-500">P#{pickupJob.id}</span>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-amber-100 text-amber-800">
                                <Truck className="h-3 w-3 mr-1" />
                                Rental
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{deliveryJob.customerName}</p>
                                <p className="text-xs text-gray-500">{deliveryJob.customerPhone}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-[200px]">
                                <p className="truncate" title={deliveryJob.address}>{deliveryJob.address}</p>
                                <p className="text-xs text-gray-500">{deliveryJob.city}, {deliveryJob.zipCode}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <span>{formatDate(deliveryJob.scheduledDate)}</span>
                                <ArrowRight className="h-3 w-3 text-gray-400" />
                                <span>{formatDate(pickupJob.scheduledDate)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {deliveryJob.dumpster ? (
                                <div>
                                  <p>{deliveryJob.dumpster.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {deliveryJob.fleetUnit ? deliveryJob.fleetUnit.unitNumber : 'Unassigned'}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={lcConfig.color}>{lcConfig.label}</Badge>
                            </TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="sm" onClick={() => openRentalDetail(item)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => window.open(`tel:${deliveryJob.customerPhone}`)}>
                                  <Phone className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${deliveryJob.address}, ${deliveryJob.city}`)}`)}>
                                  <Navigation className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      }

                      const job = item.job;
                      return (
                        <TableRow
                          key={job.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => openJobDetail(job)}
                        >
                          <TableCell className="font-mono text-sm">#{job.id}</TableCell>
                          <TableCell>{getTypeBadge(job.jobType, job.serviceName)}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{job.customerName}</p>
                              <p className="text-xs text-gray-500">{job.customerPhone}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[200px]">
                              <p className="truncate" title={job.address}>{job.address}</p>
                              <p className="text-xs text-gray-500">{job.city}, {job.zipCode}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p>{formatDate(job.scheduledDate)}</p>
                            <p className="text-xs text-gray-500">{job.timePreference || 'Anytime'}</p>
                          </TableCell>
                          <TableCell>
                            {job.dumpster ? (
                              <div>
                                <p>{job.dumpster.name}</p>
                                <p className="text-xs text-gray-500">
                                  {job.fleetUnit ? job.fleetUnit.unitNumber : 'Unassigned'}
                                </p>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Select
                              value={job.status}
                              onValueChange={(newStatus) => handleStatusChange(job.id, newStatus)}
                            >
                              <SelectTrigger className="w-[130px] h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {statusOrder.map((s) => (
                                  <SelectItem key={s.value} value={s.value}>
                                    {s.label}
                                  </SelectItem>
                                ))}
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openJobDetail(job)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => window.open(`tel:${job.customerPhone}`)}>
                                <Phone className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${job.address}, ${job.city}`)}`)}>
                                <Navigation className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {displayItems.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No jobs found</p>
              {hasActiveFilters && (
                <Button variant="link" onClick={clearAllFilters} className="mt-2">
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <JobsCalendar jobs={flattenedJobs} dumpsters={dumpsters} />
        </TabsContent>

        <TabsContent value="map">
          <JobsMap jobs={flattenedJobs} dumpsters={dumpsters} />
        </TabsContent>
      </Tabs>

      {/* Job Detail Dialog */}
      {selectedJob && (
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto !pt-0" hideClose forceLight>
            {/* HEADER */}
            <div className="sticky top-0 bg-white pb-3 border-b -mx-6 px-6 pt-6 -mt-4 z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-gray-900">{selectedJob.customerName}</h2>
                  {selectedRental ? (
                    <Badge className={lifecycleConfig[selectedRental.lifecycleStatus].color}>
                      {lifecycleConfig[selectedRental.lifecycleStatus].label}
                    </Badge>
                  ) : (
                    getStatusBadge(selectedJob.status)
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">#{selectedJob.id}</span>
                  <button
                    onClick={() => setShowDetailDialog(false)}
                    className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </button>
                </div>
              </div>

              {/* Job Context Banner or Rental Lifecycle Banner */}
              {selectedRental ? (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border mt-1 mb-2 bg-amber-50 border-amber-200 text-amber-900">
                  <Truck className="h-5 w-5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm tracking-wide">DUMPSTER RENTAL</span>
                      {selectedRental.deliveryJob.dumpster && (
                        <span className="text-xs opacity-75">({selectedRental.deliveryJob.dumpster.name})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs mt-1 text-amber-700">
                      <span>Drop-off: {formatDate(selectedRental.deliveryJob.scheduledDate)}</span>
                      <ArrowRight className="h-3 w-3 mx-0.5" />
                      <span>Pick-up: {formatDate(selectedRental.pickupJob.scheduledDate)}</span>
                    </div>
                  </div>
                  <a
                    href={`/admin/bookings?id=${selectedRental.bookingId}`}
                    className="text-xs underline hover:no-underline shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Booking #{selectedRental.bookingId}
                  </a>
                </div>
              ) : (
                (() => {
                  const banner = getJobContextBanner(selectedJob);
                  const BannerIcon = banner.icon;
                  return (
                    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border mt-1 mb-2 ${banner.colorClasses}`}>
                      <BannerIcon className="h-5 w-5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-sm tracking-wide">
                          {banner.title}
                        </span>
                        {banner.subtitle && (
                          <span className="text-xs ml-2 opacity-75">({banner.subtitle})</span>
                        )}
                      </div>
                      {banner.linkedHref && (
                        <a
                          href={banner.linkedHref}
                          className="text-xs underline hover:no-underline shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {banner.linkedLabel}
                        </a>
                      )}
                    </div>
                  );
                })()
              )}

              {/* Quick Status Advance Button */}
              {selectedRental ? (
                // Unified rental advance button + override dropdown
                (() => {
                  const action = getNextRentalAction(selectedRental);
                  const overrides = getRentalOverrideActions(selectedRental);
                  if (!action && overrides.length === 0) return null;
                  return (
                    <div className="flex items-center gap-2 mb-2">
                      {action && (
                        <Button
                          className="flex-1 bg-[#f7c948] hover:bg-[#e6b83d] text-black"
                          onClick={() => handleStatusChange(action.jobId, action.newStatus)}
                          disabled={updateStatusMutation.isPending}
                        >
                          {updateStatusMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <ArrowRight className="h-4 w-4 mr-2" />
                          )}
                          {action.label}
                        </Button>
                      )}
                      {overrides.length > 0 && (
                        <Select onValueChange={handleRentalOverride}>
                          <SelectTrigger className="w-auto">
                            <ChevronDown className="h-4 w-4" />
                          </SelectTrigger>
                          <SelectContent>
                            {overrides.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  );
                })()
              ) : (
                // Single job advance button
                selectedJob.status !== 'completed' && selectedJob.status !== 'cancelled' && (
                  <div className="flex items-center gap-2 mb-2">
                    {getNextStatus(selectedJob.status) && (
                      <Button
                        className="flex-1 bg-[#f7c948] hover:bg-[#e6b83d] text-black"
                        onClick={() => {
                          const next = getNextStatus(selectedJob.status);
                          if (next) handleStatusChange(selectedJob.id, next.value);
                        }}
                        disabled={updateStatusMutation.isPending}
                      >
                        {updateStatusMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <ArrowRight className="h-4 w-4 mr-2" />
                        )}
                        Mark as {getNextStatus(selectedJob.status)?.label}
                      </Button>
                    )}
                    <Select
                      value={selectedJob.status}
                      onValueChange={(val) => handleStatusChange(selectedJob.id, val)}
                    >
                      <SelectTrigger className="w-auto">
                        <ChevronDown className="h-4 w-4" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOrder.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )
              )}

              {/* Quick Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => window.open(`tel:${selectedJob.customerPhone}`)}
                >
                  <Phone className="h-4 w-4 mr-1" />
                  Call
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    const address = `${selectedJob.address}, ${selectedJob.city}, ${selectedJob.zipCode}`;
                    window.open(`https://maps.google.com/maps?daddr=${encodeURIComponent(address)}`, '_blank');
                  }}
                >
                  <Navigation className="h-4 w-4 mr-1" />
                  Navigate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => window.open(`mailto:${selectedJob.customerEmail}`)}
                >
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </Button>
              </div>
            </div>

            <DialogHeader className="sr-only">
              <DialogTitle>Job Details</DialogTitle>
              <DialogDescription>View and manage job information</DialogDescription>
            </DialogHeader>

            {/* Customer & Location - full width */}
            <div className="border rounded-md p-4 bg-white mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer */}
                <div>
                  <h3 className="text-sm font-medium flex items-center mb-2 text-gray-900">
                    <User className="mr-2 h-4 w-4 text-gray-500" />
                    Customer
                  </h3>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center">
                      <Mail className="mr-2 h-3.5 w-3.5 text-gray-400" />
                      <a href={`mailto:${selectedJob.customerEmail}`} className="hover:underline text-gray-900">
                        {selectedJob.customerEmail}
                      </a>
                    </div>
                    <div className="flex items-center">
                      <Phone className="mr-2 h-3.5 w-3.5 text-gray-400" />
                      <a href={`tel:${selectedJob.customerPhone}`} className="hover:underline text-gray-900">
                        {selectedJob.customerPhone}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <h3 className="text-sm font-medium flex items-center mb-2 text-gray-900">
                    <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                    Location
                  </h3>
                  <div className="space-y-1.5 text-sm">
                    <p className="text-gray-900">{selectedJob.address}</p>
                    <p className="text-gray-500">{selectedJob.city}, {selectedJob.zipCode}</p>
                    {selectedJob.placementInstructions && (
                      <p className="text-xs italic text-amber-700 bg-amber-50 px-2 py-1 rounded mt-1">
                        Placement: {selectedJob.placementInstructions}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline + Dumpster grid */}
            <div className={`grid gap-4 mt-4 ${
              selectedJob.jobType === 'service' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
            }`}>
              {/* Dates & Timeline */}
              <div className="border rounded-md p-4 bg-white">
                <h3 className="text-sm font-medium flex items-center mb-3 text-gray-900">
                  <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                  {selectedRental ? 'Rental Timeline' : 'Dates & Timeline'}
                </h3>
                <div className="relative space-y-3 text-sm">
                  {/* Vertical timeline line */}
                  <div className="absolute left-[5px] top-2 bottom-2 w-px bg-gray-200" />

                  {selectedRental ? (
                    <>
                      {/* Rental Created */}
                      <div className="flex items-start gap-3 relative">
                        <div className="w-[11px] h-[11px] rounded-full bg-gray-400 mt-0.5 z-10 shrink-0" />
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-500">Booking Created</span>
                          <span className="text-gray-900">{formatDate(selectedRental.deliveryJob.createdAt)}</span>
                        </div>
                      </div>

                      {/* Drop-off Date */}
                      <div className="flex items-start gap-3 relative">
                        <div className={`w-[11px] h-[11px] rounded-full mt-0.5 z-10 shrink-0 ${
                          selectedRental.deliveryJob.completedAt ? 'bg-green-500' : 'bg-blue-500'
                        }`} />
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-500">
                            Drop-off Date
                            {selectedRental.deliveryJob.completedAt && (
                              <CheckCircle2 className="h-3 w-3 inline ml-1 text-green-500" />
                            )}
                          </span>
                          <span className="text-gray-900 font-medium">
                            {formatDate(selectedRental.deliveryJob.scheduledDate)}
                          </span>
                        </div>
                      </div>

                      {/* Drop-off Completed */}
                      {selectedRental.deliveryJob.completedAt && (
                        <div className="flex items-start gap-3 relative">
                          <div className="w-[11px] h-[11px] rounded-full bg-green-400 mt-0.5 z-10 shrink-0" />
                          <div className="flex-1 flex justify-between">
                            <span className="text-gray-500">Drop-off Completed</span>
                            <span className="text-green-600">{formatDate(selectedRental.deliveryJob.completedAt)}</span>
                          </div>
                        </div>
                      )}

                      {/* Pick-up Date */}
                      <div className="flex items-start gap-3 relative">
                        <div className={`w-[11px] h-[11px] rounded-full mt-0.5 z-10 shrink-0 ${
                          selectedRental.pickupJob.completedAt ? 'bg-green-500' : 'bg-purple-500'
                        }`} />
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-500">
                            Pick-up Date
                            {selectedRental.pickupJob.completedAt && (
                              <CheckCircle2 className="h-3 w-3 inline ml-1 text-green-500" />
                            )}
                          </span>
                          <span className="text-gray-900 font-medium">
                            {formatDate(selectedRental.pickupJob.scheduledDate)}
                          </span>
                        </div>
                      </div>

                      {/* Pick-up Completed */}
                      {selectedRental.pickupJob.completedAt && (
                        <div className="flex items-start gap-3 relative">
                          <div className="w-[11px] h-[11px] rounded-full bg-green-400 mt-0.5 z-10 shrink-0" />
                          <div className="flex-1 flex justify-between">
                            <span className="text-gray-500">Pick-up Completed</span>
                            <span className="text-green-600">{formatDate(selectedRental.pickupJob.completedAt)}</span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Job Created */}
                      <div className="flex items-start gap-3 relative">
                        <div className="w-[11px] h-[11px] rounded-full bg-gray-400 mt-0.5 z-10 shrink-0" />
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-500">Job Created</span>
                          <span className="text-gray-900">{formatDate(selectedJob.createdAt)}</span>
                        </div>
                      </div>

                      {/* Requested Date — only for booking-linked jobs */}
                      {selectedJob.bookingDeliveryDate && (
                        <div className="flex items-start gap-3 relative">
                          <div className={`w-[11px] h-[11px] rounded-full mt-0.5 z-10 shrink-0 ${
                            formatDate(selectedJob.bookingDeliveryDate) !== formatDate(selectedJob.scheduledDate)
                              ? 'bg-amber-400' : 'bg-blue-400'
                          }`} />
                          <div className="flex-1 flex justify-between">
                            <span className="text-gray-500">{getRequestedDateLabel(selectedJob.jobType)}</span>
                            <span className={formatDate(selectedJob.bookingDeliveryDate) !== formatDate(selectedJob.scheduledDate) ? 'text-amber-600 font-medium' : 'text-gray-900'}>
                              {formatDate(selectedJob.bookingDeliveryDate)}
                              {formatDate(selectedJob.bookingDeliveryDate) !== formatDate(selectedJob.scheduledDate) && (
                                <span className="text-xs text-amber-500 ml-1">(changed)</span>
                              )}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Scheduled Date (contextual label) */}
                      <div className="flex items-start gap-3 relative">
                        <div className="w-[11px] h-[11px] rounded-full bg-blue-500 mt-0.5 z-10 shrink-0" />
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-500">{getScheduledDateLabel(selectedJob.jobType)}</span>
                          <span className="text-gray-900 font-medium">
                            {formatDate(selectedJob.scheduledDate)}
                            {selectedJob.timePreference && (
                              <span className="text-xs text-gray-400 ml-1">({selectedJob.timePreference})</span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Rental End Date — only for rentals */}
                      {selectedJob.rentalEndDate && (
                        <div className="flex items-start gap-3 relative">
                          <div className="w-[11px] h-[11px] rounded-full bg-purple-400 mt-0.5 z-10 shrink-0" />
                          <div className="flex-1 flex justify-between">
                            <span className="text-gray-500">Rental End Date</span>
                            <span className="text-gray-900">{formatDate(selectedJob.rentalEndDate)}</span>
                          </div>
                        </div>
                      )}

                      {/* Completed — only when completed */}
                      {selectedJob.completedAt && (
                        <div className="flex items-start gap-3 relative">
                          <div className="w-[11px] h-[11px] rounded-full bg-green-500 mt-0.5 z-10 shrink-0" />
                          <div className="flex-1 flex justify-between">
                            <span className="text-gray-500">Completed</span>
                            <span className="text-green-600 font-medium">{formatDate(selectedJob.completedAt)}</span>
                          </div>
                        </div>
                      )}

                      {/* Last Updated — only show if different from created */}
                      {selectedJob.updatedAt && formatDate(selectedJob.updatedAt) !== formatDate(selectedJob.createdAt) && (
                        <div className="flex items-start gap-3 relative">
                          <div className="w-[11px] h-[11px] rounded-full bg-gray-300 mt-0.5 z-10 shrink-0" />
                          <div className="flex-1 flex justify-between">
                            <span className="text-gray-500">Last Updated</span>
                            <span className="text-gray-500 text-xs">{formatDate(selectedJob.updatedAt)}</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Dumpster & Fleet Assignment - hidden for service jobs */}
              {selectedJob.jobType !== 'service' && (
                <div className="border rounded-md p-4 bg-white">
                  <h3 className="text-sm font-medium flex items-center mb-2 text-gray-900">
                    <Package className="mr-2 h-4 w-4 text-gray-500" />
                    Dumpster & Assignment
                  </h3>
                  {selectedJob.dumpster ? (
                    <div className="space-y-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Dumpster Type</span>
                          <span className="font-medium text-gray-900">{selectedJob.dumpster.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Dimensions</span>
                          <span className="text-gray-900">{selectedJob.dumpster.dimensions}</span>
                        </div>
                      </div>

                      {/* Fleet Unit Assignment */}
                      <div className="pt-3 border-t">
                        <Label className="text-sm font-medium text-gray-500">Assigned Unit</Label>
                        <Select
                          value={selectedJob.assignedFleetUnitId?.toString() || 'unassigned'}
                          onValueChange={(value) => {
                            const fleetUnitId = value === 'unassigned' ? null : parseInt(value);
                            handleAssignFleetUnit(selectedJob.id, fleetUnitId);
                            setSelectedJob({ ...selectedJob, assignedFleetUnitId: fleetUnitId });
                          }}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Assign a fleet unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {fleetUnits
                              .filter((u) => u.dumpsterId === selectedJob.dumpsterId)
                              .map((unit) => (
                                <SelectItem key={unit.id} value={unit.id.toString()}>
                                  {unit.unitNumber} ({unit.status})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No dumpster assigned to this job</p>
                  )}
                </div>
              )}
            </div>

            {/* Notes Section */}
            <div className="border rounded-md p-4 mt-4 space-y-3">
              <h3 className="text-sm font-medium text-gray-900">Notes</h3>

              {/* Customer Notes */}
              {selectedJob.notes && (
                <div className="bg-yellow-50 border border-yellow-100 rounded p-3">
                  <span className="text-xs font-medium text-yellow-700 uppercase tracking-wide">
                    Customer Note
                  </span>
                  <p className="text-sm text-yellow-900 mt-1">{selectedJob.notes}</p>
                </div>
              )}

              {/* Admin Notes - editable inline */}
              <div className="bg-gray-50 border border-gray-200 rounded p-3">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Admin Note
                </span>
                {isEditingAdminNotes ? (
                  <div className="mt-1 space-y-2">
                    <Textarea
                      value={adminNotesValue}
                      onChange={(e) => setAdminNotesValue(e.target.value)}
                      className="text-sm min-h-[60px]"
                      placeholder="Add internal notes about this job..."
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveAdminNotes} disabled={updateJobMutation.isPending}>
                        {updateJobMutation.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setIsEditingAdminNotes(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="mt-1 text-sm text-gray-700 cursor-pointer hover:bg-gray-100 rounded p-1 -m-1 min-h-[24px]"
                    onClick={() => {
                      setAdminNotesValue(selectedJob.adminNotes || '');
                      setIsEditingAdminNotes(true);
                    }}
                  >
                    {selectedJob.adminNotes || (
                      <span className="text-gray-400 italic">Click to add admin notes...</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Additional Charges & Payment Links - Only for jobs with a booking */}
            {selectedJob.bookingId && (
              <>
                <div className="border rounded-md p-4 mt-4">
                  <AdditionalCharges
                    bookingId={selectedJob.bookingId}
                    customerName={selectedJob.customerName}
                    customerEmail={selectedJob.customerEmail}
                    customerPhone={selectedJob.customerPhone}
                    onChargesChange={() => {
                      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
                    }}
                  />
                </div>
                {/* Load Tracking - for delivery, pickup, swap jobs */}
                <div className="mt-4">
                  <JobLoadTracking
                    bookingId={selectedJob.bookingId}
                    swapRequestId={selectedJob.swapRequestId}
                    dumpsterId={selectedJob.dumpsterId}
                    jobType={selectedJob.jobType}
                    onLoadsChange={() => {
                      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
                    }}
                  />
                </div>
              </>
            )}

            {/* Status Progress */}
            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium text-sm text-gray-500 mb-3">
                {selectedRental ? 'RENTAL LIFECYCLE' : 'STATUS PROGRESS'}
              </h3>
              {selectedRental ? (
                // 6-step rental lifecycle bar
                <div className="flex items-center justify-between">
                  {rentalLifecycleSteps.map((s, i) => {
                    const currentStep = getRentalStepNumber(selectedRental);
                    const isComplete = currentStep > s.step;
                    const isCurrent = currentStep === s.step;
                    return (
                      <div key={s.key} className="flex flex-col items-center flex-1">
                        <div className="flex items-center w-full">
                          <div
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-medium mx-auto ${
                              isComplete
                                ? 'bg-green-500 text-white'
                                : isCurrent
                                ? 'bg-[#f7c948] text-black'
                                : 'bg-gray-200 text-gray-500'
                            }`}
                          >
                            {isComplete ? <CheckCircle2 className="h-4 w-4" /> : s.step}
                          </div>
                          {i < rentalLifecycleSteps.length - 1 && (
                            <div className={`flex-1 h-1 ${isComplete ? 'bg-green-500' : 'bg-gray-200'}`} />
                          )}
                        </div>
                        <span className="text-[10px] sm:text-xs text-gray-500 mt-1 text-center leading-tight">{s.label}</span>
                        <span className="text-[9px] sm:text-[10px] text-gray-400 text-center leading-tight">{s.sublabel}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Standard 4-step job progress
                <div className="flex items-center justify-between">
                  {statusOrder.map((s, i) => {
                    const currentStep = getCurrentStep(selectedJob.status);
                    const isComplete = currentStep > s.step;
                    const isCurrent = currentStep === s.step;
                    return (
                      <div key={s.value} className="flex flex-col items-center flex-1">
                        <div className="flex items-center w-full">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium mx-auto ${
                              isComplete
                                ? 'bg-green-500 text-white'
                                : isCurrent
                                ? 'bg-[#f7c948] text-black'
                                : 'bg-gray-200 text-gray-500'
                            }`}
                          >
                            {isComplete ? <CheckCircle2 className="h-4 w-4" /> : s.step}
                          </div>
                          {i < statusOrder.length - 1 && (
                            <div className={`flex-1 h-1 ${isComplete ? 'bg-green-500' : 'bg-gray-200'}`} />
                          )}
                        </div>
                        <span className="text-xs text-gray-500 mt-1">{s.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!cancelConfirm} onOpenChange={() => setCancelConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {cancelConfirm?.type === 'rental' ? 'Cancel Rental' : 'Cancel Job'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {cancelConfirm?.type === 'rental'
                ? `Are you sure you want to cancel this entire rental (delivery + pickup)? This will cancel both jobs for ${cancelConfirm.rental.deliveryJob.customerName}.`
                : `Are you sure you want to cancel ${cancelConfirm?.jobLabel}? This action can be undone by changing the status back.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Keep It</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, Cancel {cancelConfirm?.type === 'rental' ? 'Rental' : 'Job'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Return Destination Dialog */}
      {returnDestinationDialog && (
        <Dialog open={!!returnDestinationDialog} onOpenChange={() => setReturnDestinationDialog(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto" forceLight>
            <DialogHeader>
              <DialogTitle>Complete & Return — Select Destination</DialogTitle>
              <DialogDescription>
                {returnDestinationDialog.rental.deliveryJob.customerName} — Booking #{returnDestinationDialog.rental.bookingId}
                <br />
                Where should the dumpster go after the dump/load is complete?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">Return Destination</Label>
                <RadioGroup value={selectedDropOffType} onValueChange={setSelectedDropOffType}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hub" id="return-hub" />
                    <Label htmlFor="return-hub">Return to Hub</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="customer" id="return-customer" />
                    <Label htmlFor="return-customer">Transfer to Another Customer</Label>
                  </div>
                </RadioGroup>
              </div>

              {selectedDropOffType === 'hub' && (
                <div className="space-y-3">
                  <Label className="text-base font-medium">Select Hub</Label>
                  <Select value={selectedHubId} onValueChange={setSelectedHubId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a hub..." />
                    </SelectTrigger>
                    <SelectContent>
                      {hubs.map((hub) => (
                        <SelectItem key={hub.id} value={hub.id.toString()}>
                          {hub.name} — {hub.address}, {hub.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedDropOffType === 'customer' && (
                <div className="space-y-3">
                  <Label className="text-base font-medium">Select Customer Booking</Label>
                  <Select value={selectedCustomerBookingId} onValueChange={setSelectedCustomerBookingId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a customer booking..." />
                    </SelectTrigger>
                    <SelectContent>
                      {bookingsData
                        .filter((b) => b.id !== returnDestinationDialog.rental.bookingId && ['pending', 'confirmed'].includes(b.status))
                        .map((booking) => (
                          <SelectItem key={booking.id} value={booking.id.toString()}>
                            {booking.customerName} — {booking.deliveryAddress}, {booking.deliveryCity}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedDropOffType === 'customer' && selectedCustomerBookingId && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    <strong>Smart Route:</strong> Direct transfer skips the hub — maximizes efficiency.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={() => setReturnDestinationDialog(null)} className="w-full sm:w-auto order-2 sm:order-1">
                Cancel
              </Button>
              <Button
                onClick={handleReturnDestinationConfirm}
                disabled={
                  !selectedDropOffType ||
                  (selectedDropOffType === 'hub' && !selectedHubId) ||
                  (selectedDropOffType === 'customer' && !selectedCustomerBookingId) ||
                  updateStatusMutation.isPending
                }
                className="bg-[#f7c948] hover:bg-[#f7c948]/90 text-black w-full sm:w-auto order-1 sm:order-2"
              >
                {updateStatusMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Complete & Return
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
