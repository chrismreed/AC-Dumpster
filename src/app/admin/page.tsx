'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  CalendarDays,
  Truck,
  DollarSign,
  MapPin,
  Loader2,
  RefreshCw,
  User,
  Mail,
  Phone,
  ClipboardList,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  ArrowRight,
  Check,
  CheckCircle,
  AlertCircle,
  X,
  Trash2,
  Package,
  ArrowUpFromLine,
} from 'lucide-react';
import { AdditionalCharges } from '@/components/admin/additional-charges';
import { useToast } from '@/hooks/use-toast';
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

interface Booking {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  dumpsterId: number;
  pricingId: number;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryZipCode: string;
  deliveryDate: string;
  deliveryTimePreference: string;
  deliveryInstructions?: string;
  placementLocation?: string;
  serviceZoneId: number;
  totalPrice: number;
  paymentStatus: string;
  status: string;
  createdAt: string;
}

interface Dumpster {
  id: number;
  name: string;
  size: number;
}

interface DumpsterPricing {
  id: number;
  days: number;
  dumpsterId: number;
}

interface Hub {
  id: number;
  name: string;
  address: string;
  city: string;
  zipCode: string;
}

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [expandedPlaybook, setExpandedPlaybook] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);

  // Detail dialog state
  const [selectedRental, setSelectedRental] = useState<RentalGroup | null>(null);
  const [selectedSingleJob, setSelectedSingleJob] = useState<Job | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Return destination dialog state
  const [returnDestinationDialog, setReturnDestinationDialog] = useState<{ jobId: number; rental: RentalGroup } | null>(null);
  const [selectedDropOffType, setSelectedDropOffType] = useState<string>('');
  const [selectedHubId, setSelectedHubId] = useState<string>('');
  const [selectedCustomerBookingId, setSelectedCustomerBookingId] = useState<string>('');

  // Cancel dialog state
  const [cancelConfirm, setCancelConfirm] = useState<{ type: 'rental'; rental: RentalGroup } | { type: 'single'; jobId: number; jobLabel: string } | null>(null);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ─── Data Fetching ─────────────────────────────────────────────────

  // Primary data: jobs (replaces bookings as the main display model)
  const { data: allJobs = [], isLoading: isLoadingJobs } = useQuery<Job[]>({
    queryKey: ['admin-jobs'],
    queryFn: async () => {
      const res = await fetch('/api/admin/jobs');
      if (!res.ok) throw new Error('Failed to fetch jobs');
      return res.json();
    },
  });

  // Secondary: bookings for payment info display
  const { data: bookings = [], isLoading: isLoadingBookings } = useQuery<Booking[]>({
    queryKey: ['admin-bookings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/bookings');
      if (!res.ok) throw new Error('Failed to fetch bookings');
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

  // Fetch hubs (for return destination)
  const { data: hubs = [] } = useQuery<Hub[]>({
    queryKey: ['admin-hubs'],
    queryFn: async () => {
      const res = await fetch('/api/admin/hubs');
      if (!res.ok) throw new Error('Failed to fetch hubs');
      return res.json();
    },
  });

  // ─── Mutations ─────────────────────────────────────────────────────

  // Update job status mutation (primary mutation — replaces booking status)
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
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      toast({ title: 'Status updated', description: 'Job status has been updated.' });

      // Update local state for responsiveness
      if (selectedRental) {
        const newDelivery = selectedRental.deliveryJob.id === variables.jobId
          ? { ...selectedRental.deliveryJob, status: variables.status, completedAt: updatedJobData.completedAt }
          : selectedRental.deliveryJob;
        const newPickup = selectedRental.pickupJob.id === variables.jobId
          ? { ...selectedRental.pickupJob, status: variables.status, completedAt: updatedJobData.completedAt }
          : selectedRental.pickupJob;
        setSelectedRental({
          ...selectedRental,
          deliveryJob: newDelivery,
          pickupJob: newPickup,
          lifecycleStatus: deriveLifecycleStatus(newDelivery, newPickup),
        });
      }
    },
  });

  // Check payment status mutation
  const checkPaymentStatusMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const res = await fetch(`/api/admin/bookings/${bookingId}/check-payment-status`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to check payment status');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      toast({
        title: data.message || 'Payment status checked',
        description: data.updatedCount ? `Updated ${data.updatedCount} booking(s)` : undefined,
      });
    },
    onError: () => {
      toast({ title: 'Failed to check payment status', variant: 'destructive' });
    },
  });

  // ─── Derived Data ──────────────────────────────────────────────────

  const displayItems = useMemo(() => groupJobsIntoDisplayItems(allJobs), [allJobs]);

  const rentalGroups = useMemo(() =>
    displayItems.filter((item): item is RentalGroup => item.kind === 'rental'),
    [displayItems]
  );

  // Helper: get booking for a rental group
  const getBookingForRental = (rental: RentalGroup): Booking | undefined =>
    bookings.find(b => b.id === rental.bookingId);

  // Helper
  const getDumpsterName = (dumpsterId: number) => {
    const dumpster = dumpsters?.find((d) => d.id === dumpsterId);
    return dumpster ? dumpster.name : `Dumpster #${dumpsterId}`;
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // ─── Statistics ────────────────────────────────────────────────────

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeRentals = rentalGroups.filter(r =>
    ['dropoff_scheduled', 'dropoff_en_route', 'rental_active', 'pickup_en_route', 'picked_up', 'dumping'].includes(r.lifecycleStatus)
  ).length;

  const pendingCount = rentalGroups.filter(r => r.lifecycleStatus === 'pending_dropoff').length;

  const todaysJobs = allJobs.filter(j => {
    if (!j.scheduledDate) return false;
    const d = new Date(j.scheduledDate);
    return d.getUTCFullYear() === today.getFullYear() &&
      d.getUTCMonth() === today.getMonth() &&
      d.getUTCDate() === today.getDate() &&
      j.status !== 'completed' && j.status !== 'cancelled';
  }).length;

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  // Playbook sections
  const todaysDeliveries = allJobs.filter(j => {
    if (j.jobType !== 'delivery' || !j.scheduledDate) return false;
    const d = new Date(j.scheduledDate);
    return d.getUTCFullYear() === today.getFullYear() &&
      d.getUTCMonth() === today.getMonth() &&
      d.getUTCDate() === today.getDate() &&
      !['completed', 'cancelled'].includes(j.status);
  });

  const todaysPickups = allJobs.filter(j => {
    if (j.jobType !== 'pickup' || !j.scheduledDate) return false;
    const d = new Date(j.scheduledDate);
    return d.getUTCFullYear() === today.getFullYear() &&
      d.getUTCMonth() === today.getMonth() &&
      d.getUTCDate() === today.getDate() &&
      !['completed', 'cancelled'].includes(j.status);
  });

  const pendingRentals = rentalGroups.filter(r => r.lifecycleStatus === 'pending_dropoff');

  const overduePickups = allJobs.filter(j => {
    if (j.jobType !== 'pickup' || !j.rentalEndDate) return false;
    if (['completed', 'cancelled'].includes(j.status)) return false;
    const endDate = new Date(j.rentalEndDate);
    endDate.setHours(0, 0, 0, 0);
    return endDate < today;
  });

  // ─── Handlers ──────────────────────────────────────────────────────

  const handleStatusChange = (jobId: number, newStatus: string) => {
    // Cancel intercept
    if (newStatus === 'cancelled') {
      const job = allJobs.find(j => j.id === jobId);
      setCancelConfirm({ type: 'single', jobId, jobLabel: job ? `Job #${job.id} (${job.jobType})` : `Job #${jobId}` });
      return;
    }

    // Return destination intercept (pickup dumping → completed)
    if (newStatus === 'completed') {
      const job = allJobs.find(j => j.id === jobId);
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

  const handleRentalOverride = (value: string) => {
    if (!selectedRental) return;
    if (value === 'cancel') {
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

  const handleReturnDestinationConfirm = () => {
    if (!returnDestinationDialog) return;
    let returnDestination;
    if (selectedDropOffType === 'hub' && selectedHubId) {
      returnDestination = { type: 'hub', hubId: parseInt(selectedHubId) };
    } else if (selectedDropOffType === 'customer' && selectedCustomerBookingId) {
      returnDestination = { type: 'customer', bookingId: parseInt(selectedCustomerBookingId) };
    }
    updateStatusMutation.mutate({
      jobId: returnDestinationDialog.jobId,
      status: 'completed',
      returnDestination,
    });
    setReturnDestinationDialog(null);
  };

  const openRentalDetail = (rental: RentalGroup) => {
    setSelectedRental(rental);
    setSelectedSingleJob(null);
    setIsDetailDialogOpen(true);
  };

  // ─── Loading ───────────────────────────────────────────────────────

  const isLoading = isLoadingJobs || isLoadingBookings;

  if (isLoading && allJobs.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto w-full min-w-0 space-y-3 sm:space-y-6">
      <div className="mb-3 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">Overview of your dumpster rental business</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 min-w-0">
        <Card className="min-w-0">
          <CardContent className="p-2.5 sm:p-4 min-w-0">
            <p className="text-[10px] sm:text-sm text-gray-500 truncate">Active Rentals</p>
            <p className="text-lg sm:text-2xl font-bold text-blue-600 truncate">{activeRentals}</p>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardContent className="p-2.5 sm:p-4 min-w-0">
            <p className="text-[10px] sm:text-sm text-gray-500 truncate">Today's Jobs</p>
            <p className="text-lg sm:text-2xl font-bold truncate">{todaysJobs}</p>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardContent className="p-2.5 sm:p-4 min-w-0">
            <p className="text-[10px] sm:text-sm text-gray-500 truncate">Pending</p>
            <p className="text-lg sm:text-2xl font-bold text-yellow-600 truncate">{pendingCount}</p>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardContent className="p-2.5 sm:p-4 min-w-0">
            <p className="text-[10px] sm:text-sm text-gray-500 truncate">Total Revenue</p>
            <p className="text-lg sm:text-2xl font-bold text-green-600 truncate">${(totalRevenue / 100).toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Playbook */}
      <Card className="border-l-4 border-l-[#f7c948]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5 text-[#f7c948]" />
            Today's Playbook
            <span className="text-sm font-normal text-gray-500 ml-2">Click any card to expand</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Deliveries Today */}
          <PlaybookJobSection
            title="Deliveries Today"
            count={todaysDeliveries.length}
            icon={<Truck className="h-5 w-5 text-blue-600" />}
            colorClass="bg-blue-50 hover:bg-blue-100"
            isExpanded={expandedPlaybook === 'deliveries'}
            onToggle={() => setExpandedPlaybook(expandedPlaybook === 'deliveries' ? null : 'deliveries')}
            linkHref="/admin/jobs?status=active&dateRange=today&type=delivery"
            linkText="View in Jobs →"
            jobs={todaysDeliveries}
            allJobs={allJobs}
            onViewRental={(job) => {
              const rental = rentalGroups.find(r => r.deliveryJob.id === job.id || r.pickupJob.id === job.id);
              if (rental) openRentalDetail(rental);
            }}
            emptyMessage="No deliveries today"
          />

          {/* Pickups Today */}
          <PlaybookJobSection
            title="Pickups Today"
            count={todaysPickups.length}
            icon={<ArrowUpFromLine className="h-5 w-5 text-green-600" />}
            colorClass="bg-green-50 hover:bg-green-100"
            isExpanded={expandedPlaybook === 'pickups'}
            onToggle={() => setExpandedPlaybook(expandedPlaybook === 'pickups' ? null : 'pickups')}
            linkHref="/admin/jobs?status=active&dateRange=today&type=pickup"
            linkText="View in Jobs →"
            jobs={todaysPickups}
            allJobs={allJobs}
            onViewRental={(job) => {
              const rental = rentalGroups.find(r => r.deliveryJob.id === job.id || r.pickupJob.id === job.id);
              if (rental) openRentalDetail(rental);
            }}
            emptyMessage="No pickups today"
          />

          {/* Pending Review */}
          <PlaybookRentalSection
            title="Pending Review"
            count={pendingRentals.length}
            icon={<Clock className="h-5 w-5 text-yellow-600" />}
            colorClass="bg-yellow-50 hover:bg-yellow-100"
            isExpanded={expandedPlaybook === 'pending'}
            onToggle={() => setExpandedPlaybook(expandedPlaybook === 'pending' ? null : 'pending')}
            linkHref="/admin/jobs?status=pending"
            linkText="View in Jobs →"
            rentals={pendingRentals}
            onViewRental={openRentalDetail}
            emptyMessage="No pending rentals"
          />

          {/* Overdue Pickups */}
          <PlaybookJobSection
            title="Overdue Pickups"
            count={overduePickups.length}
            subtitle={overduePickups.length > 0 ? 'Requires immediate attention' : undefined}
            icon={
              overduePickups.length > 0 ? (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-gray-500" />
              )
            }
            colorClass={overduePickups.length > 0 ? 'bg-red-50 hover:bg-red-100' : 'bg-gray-50 hover:bg-gray-100'}
            isExpanded={expandedPlaybook === 'overdue'}
            onToggle={() => setExpandedPlaybook(expandedPlaybook === 'overdue' ? null : 'overdue')}
            linkHref="/admin/jobs?status=active&dateRange=overdue&type=pickup"
            linkText="View in Jobs →"
            jobs={overduePickups}
            allJobs={allJobs}
            onViewRental={(job) => {
              const rental = rentalGroups.find(r => r.deliveryJob.id === job.id || r.pickupJob.id === job.id);
              if (rental) openRentalDetail(rental);
            }}
            emptyMessage="No overdue pickups — great job!"
            showOverdue
          />
        </CardContent>
      </Card>

      {/* Active Rentals Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Active Rentals
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isMobileView ? (
            <div className="space-y-3">
              {rentalGroups.filter(r => !['completed', 'cancelled'].includes(r.lifecycleStatus)).length > 0 ? (
                rentalGroups
                  .filter(r => !['completed', 'cancelled'].includes(r.lifecycleStatus))
                  .slice(0, 10)
                  .map((rental) => {
                    const activeJob = getActiveJob(rental);
                    const config = lifecycleConfig[rental.lifecycleStatus];
                    return (
                      <Card
                        key={`rental-${rental.bookingId}`}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => openRentalDetail(rental)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium">{rental.deliveryJob.customerName}</p>
                              <p className="text-xs text-gray-500">Booking #{rental.bookingId}</p>
                            </div>
                            <Badge className={config.color}>{config.label}</Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p className="flex items-center gap-1">
                              <Truck className="h-3 w-3" />
                              {activeJob.dumpster?.name || 'Unassigned'}
                            </p>
                            <p className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {activeJob.address}
                            </p>
                            <p className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {formatDate(activeJob.scheduledDate)}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
              ) : (
                <div className="text-center text-gray-500 py-8">No active rentals</div>
              )}
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Dumpster</th>
                    <th className="px-6 py-3">Next Date</th>
                    <th className="px-6 py-3">Lifecycle Status</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rentalGroups.filter(r => !['completed', 'cancelled'].includes(r.lifecycleStatus)).length > 0 ? (
                    rentalGroups
                      .filter(r => !['completed', 'cancelled'].includes(r.lifecycleStatus))
                      .slice(0, 10)
                      .map((rental) => {
                        const activeJob = getActiveJob(rental);
                        const config = lifecycleConfig[rental.lifecycleStatus];
                        return (
                          <tr
                            key={`rental-${rental.bookingId}`}
                            className="bg-white border-b hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => openRentalDetail(rental)}
                          >
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium">{rental.deliveryJob.customerName}</p>
                                <p className="text-xs text-gray-500">Booking #{rental.bookingId}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">{activeJob.dumpster?.name || 'Unassigned'}</td>
                            <td className="px-6 py-4">{formatDate(activeJob.scheduledDate)}</td>
                            <td className="px-6 py-4">
                              <Badge className={config.color}>{config.label}</Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openRentalDetail(rental)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <a href={`tel:${rental.deliveryJob.customerPhone}`} className="p-1.5 rounded hover:bg-gray-100">
                                  <Phone className="h-4 w-4" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  ) : (
                    <tr className="bg-white border-b">
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        No active rentals
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {rentalGroups.filter(r => !['completed', 'cancelled'].includes(r.lifecycleStatus)).length > 10 && (
            <div className="mt-4 text-center">
              <Link href="/admin/jobs?status=active&type=rental" className="text-sm text-blue-600 hover:underline">
                View all active rentals in Jobs →
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ Rental Detail Dialog ═══ */}
      {selectedRental && (
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto !pt-0" hideClose forceLight>
            {/* HEADER */}
            <div className="sticky top-0 bg-white pb-3 border-b -mx-6 px-6 pt-6 -mt-4 z-10">
              {/* Name + Status Row */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900">{selectedRental.deliveryJob.customerName}</h2>
                  <Badge className={lifecycleConfig[selectedRental.lifecycleStatus].color}>
                    {lifecycleConfig[selectedRental.lifecycleStatus].label}
                  </Badge>
                  {(() => {
                    const booking = getBookingForRental(selectedRental);
                    if (!booking) return null;
                    return (
                      <Badge className={booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {booking.paymentStatus === 'paid' ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                        {booking.paymentStatus}
                      </Badge>
                    );
                  })()}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">Booking #{selectedRental.bookingId}</span>
                  <button
                    onClick={() => setIsDetailDialogOpen(false)}
                    className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </button>
                </div>
              </div>

              {/* Context Banner */}
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border mt-1 mb-2 bg-amber-50 border-amber-200 text-amber-900">
                <Truck className="h-5 w-5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm tracking-wide">DUMPSTER RENTAL</span>
                  <span className="text-xs opacity-75 ml-2">{selectedRental.deliveryJob.dumpster?.name || 'Unassigned'}</span>
                  <div className="flex items-center gap-1 text-xs mt-1 text-amber-700">
                    <span>Delivery: {formatDate(selectedRental.deliveryJob.scheduledDate)}</span>
                    <ArrowRight className="h-3 w-3 mx-0.5" />
                    <span>Pickup: {selectedRental.pickupJob.scheduledDate ? formatDate(selectedRental.pickupJob.scheduledDate) : 'TBD'}</span>
                  </div>
                </div>
              </div>

              {/* Advance Button + Override Dropdown */}
              {(() => {
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
              })()}

              {/* Quick Action Buttons */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open(`tel:${selectedRental.deliveryJob.customerPhone}`)}>
                  <Phone className="h-4 w-4 mr-1" />
                  Call
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    const addr = `${selectedRental.deliveryJob.address}, ${selectedRental.deliveryJob.city}, ${selectedRental.deliveryJob.zipCode}`;
                    window.open(`https://maps.google.com/maps?daddr=${encodeURIComponent(addr)}`, '_blank');
                  }}
                >
                  <MapPin className="h-4 w-4 mr-1" />
                  Navigate
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open(`mailto:${selectedRental.deliveryJob.customerEmail}`)}>
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </Button>
                {(() => {
                  const booking = getBookingForRental(selectedRental);
                  if (!booking) return null;
                  return (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => checkPaymentStatusMutation.mutate(booking.id)}
                      disabled={checkPaymentStatusMutation.isPending}
                    >
                      <RefreshCw className={`h-4 w-4 mr-1 ${checkPaymentStatusMutation.isPending ? 'animate-spin' : ''}`} />
                      Payment
                    </Button>
                  );
                })()}
              </div>
            </div>

            <DialogHeader className="sr-only">
              <DialogTitle>Rental Details</DialogTitle>
              <DialogDescription>View and manage rental information</DialogDescription>
            </DialogHeader>

            {/* Customer & Location */}
            <div className="border rounded-md p-4 bg-white">
              <h3 className="text-sm font-medium flex items-center mb-3 text-gray-900">
                <User className="mr-2 h-4 w-4 text-gray-500" />
                Customer & Location
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <Mail className="mr-2 h-4 w-4" />
                    <a href={`mailto:${selectedRental.deliveryJob.customerEmail}`} className="hover:underline text-gray-700">
                      {selectedRental.deliveryJob.customerEmail}
                    </a>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Phone className="mr-2 h-4 w-4" />
                    <a href={`tel:${selectedRental.deliveryJob.customerPhone}`} className="hover:underline text-gray-700">
                      {selectedRental.deliveryJob.customerPhone}
                    </a>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="block text-gray-500">Address</span>
                    <span className="text-gray-900">{selectedRental.deliveryJob.address}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500">City & ZIP</span>
                    <span className="text-gray-900">{selectedRental.deliveryJob.city}, {selectedRental.deliveryJob.zipCode}</span>
                  </div>
                  {selectedRental.deliveryJob.placementInstructions && (
                    <div>
                      <span className="block text-gray-500">Placement</span>
                      <span className="italic text-gray-900">{selectedRental.deliveryJob.placementInstructions}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Booking Details & Payment */}
            {(() => {
              const booking = getBookingForRental(selectedRental);
              if (!booking) return null;
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-md p-4 bg-white">
                    <h3 className="text-sm font-medium flex items-center mb-2 text-gray-900">
                      <ClipboardList className="mr-2 h-4 w-4 text-gray-500" />
                      Rental Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Dumpster</span>
                        <span className="text-gray-900">{selectedRental.deliveryJob.dumpster?.name || 'Unassigned'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Delivery Date</span>
                        <span className="text-gray-900">{formatDate(selectedRental.deliveryJob.scheduledDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Pickup Date</span>
                        <span className="text-gray-900">{selectedRental.pickupJob.scheduledDate ? formatDate(selectedRental.pickupJob.scheduledDate) : 'TBD'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Time Preference</span>
                        <span className="text-gray-900">{selectedRental.deliveryJob.timePreference || 'Anytime'}</span>
                      </div>
                      {selectedRental.deliveryJob.fleetUnit && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Fleet Unit</span>
                          <span className="text-gray-900">#{selectedRental.deliveryJob.fleetUnit.unitNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border rounded-md p-4 bg-white">
                    <h3 className="text-sm font-medium flex items-center mb-2 text-gray-900">
                      <DollarSign className="mr-2 h-4 w-4 text-gray-500" />
                      Payment Information
                    </h3>
                    <div className="mb-3">
                      <p className="text-2xl font-bold text-gray-900">${(booking.totalPrice / 100).toFixed(2)}</p>
                      <p className="text-xs text-gray-500">Original booking amount</p>
                    </div>
                    <div className="border-t pt-3">
                      <AdditionalCharges
                        bookingId={booking.id}
                        customerName={booking.customerName}
                        customerEmail={booking.customerEmail}
                        customerPhone={booking.customerPhone}
                        onChargesChange={() => {
                          queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 8-Step Lifecycle Progress */}
            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium text-sm text-gray-500 mb-3">RENTAL LIFECYCLE</h3>
              <div className="flex items-center justify-between">
                {rentalLifecycleSteps.map((step, i) => {
                  const currentStep = getRentalStepNumber(selectedRental);
                  const isComplete = currentStep > step.step;
                  const isCurrent = currentStep === step.step;
                  return (
                    <div key={step.key} className="flex flex-col items-center flex-1">
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
                          {isComplete ? <Check className="h-3 w-3 sm:h-4 sm:w-4" /> : step.step}
                        </div>
                        {i < rentalLifecycleSteps.length - 1 && (
                          <div className={`flex-1 h-1 ${isComplete ? 'bg-green-500' : 'bg-gray-200'}`} />
                        )}
                      </div>
                      <span className="text-[10px] sm:text-xs text-gray-500 mt-1 text-center">{step.label}</span>
                      <span className="text-[9px] sm:text-[10px] text-gray-400 hidden sm:block">{step.sublabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

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
                    <RadioGroupItem value="hub" id="dash-return-hub" />
                    <Label htmlFor="dash-return-hub">Return to Hub</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="customer" id="dash-return-customer" />
                    <Label htmlFor="dash-return-customer">Transfer to Another Customer</Label>
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
                      {bookings
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
                : `Are you sure you want to cancel ${(cancelConfirm as any)?.jobLabel}? This action can be undone by changing the status back.`
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
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Playbook Section — Job-based (deliveries, pickups, overdue)
// ═══════════════════════════════════════════════════════════════════════

function PlaybookJobSection({
  title,
  count,
  subtitle,
  icon,
  colorClass,
  isExpanded,
  onToggle,
  linkHref,
  linkText,
  jobs,
  allJobs,
  onViewRental,
  emptyMessage = 'No items',
  showOverdue = false,
}: {
  title: string;
  count: number;
  subtitle?: string;
  icon: React.ReactNode;
  colorClass: string;
  isExpanded: boolean;
  onToggle: () => void;
  linkHref: string;
  linkText: string;
  jobs: Job[];
  allJobs: Job[];
  onViewRental: (job: Job) => void;
  emptyMessage?: string;
  showOverdue?: boolean;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div>
      <div className={`rounded-lg p-4 cursor-pointer transition-colors ${colorClass}`} onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <span className="text-sm font-medium">{title}</span>
              {subtitle && <p className="text-xs text-gray-600">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{count}</span>
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-2 rounded-lg p-3 space-y-2 max-h-64 overflow-y-auto bg-gray-50/50">
          <div className="flex justify-end mb-2">
            <Link href={linkHref} className="text-sm hover:underline text-blue-600">
              {linkText}
            </Link>
          </div>
          {jobs.length === 0 ? (
            <div className="text-center py-4">
              {emptyMessage.includes('great job') ? (
                <>
                  <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">{emptyMessage}</p>
                </>
              ) : (
                <p className="text-sm text-gray-500">{emptyMessage}</p>
              )}
            </div>
          ) : (
            jobs.map((job) => {
              const statusCfg = sharedStatusConfig[job.status] || { label: job.status, color: 'bg-gray-100 text-gray-800' };
              let daysOverdue = 0;
              if (showOverdue && job.rentalEndDate) {
                const endDate = new Date(job.rentalEndDate);
                endDate.setHours(0, 0, 0, 0);
                daysOverdue = Math.floor((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
              }

              return (
                <div
                  key={job.id}
                  className={`flex items-center justify-between p-3 bg-white rounded-lg shadow-sm ${showOverdue && daysOverdue > 0 ? 'border-l-4 border-red-500' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{job.customerName}</p>
                      {showOverdue && daysOverdue > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                          {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {job.dumpster?.name || 'Unassigned'} — {job.address}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onViewRental(job)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <a href={`tel:${job.customerPhone}`} className="p-1.5 rounded hover:bg-gray-100">
                      <Phone className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Playbook Section — Rental-based (pending review)
// ═══════════════════════════════════════════════════════════════════════

function PlaybookRentalSection({
  title,
  count,
  subtitle,
  icon,
  colorClass,
  isExpanded,
  onToggle,
  linkHref,
  linkText,
  rentals,
  onViewRental,
  emptyMessage = 'No items',
}: {
  title: string;
  count: number;
  subtitle?: string;
  icon: React.ReactNode;
  colorClass: string;
  isExpanded: boolean;
  onToggle: () => void;
  linkHref: string;
  linkText: string;
  rentals: RentalGroup[];
  onViewRental: (rental: RentalGroup) => void;
  emptyMessage?: string;
}) {
  return (
    <div>
      <div className={`rounded-lg p-4 cursor-pointer transition-colors ${colorClass}`} onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <span className="text-sm font-medium">{title}</span>
              {subtitle && <p className="text-xs text-gray-600">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{count}</span>
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-2 rounded-lg p-3 space-y-2 max-h-64 overflow-y-auto bg-gray-50/50">
          <div className="flex justify-end mb-2">
            <Link href={linkHref} className="text-sm hover:underline text-blue-600">
              {linkText}
            </Link>
          </div>
          {rentals.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">{emptyMessage}</p>
            </div>
          ) : (
            rentals.map((rental) => {
              const config = lifecycleConfig[rental.lifecycleStatus];
              const timeSinceCreated = (() => {
                const created = new Date(rental.deliveryJob.createdAt);
                const now = new Date();
                const diffMs = now.getTime() - created.getTime();
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                const diffDays = Math.floor(diffHours / 24);
                if (diffDays > 0) return { text: `${diffDays}d ago`, isUrgent: diffDays >= 1 };
                if (diffHours > 0) return { text: `${diffHours}h ago`, isUrgent: diffHours >= 24 };
                return { text: 'Just now', isUrgent: false };
              })();

              return (
                <div key={`rental-${rental.bookingId}`} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{rental.deliveryJob.customerName}</p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${timeSinceCreated.isUrgent ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}
                      >
                        <Clock className="h-3 w-3 inline mr-1" />
                        {timeSinceCreated.text}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {rental.deliveryJob.dumpster?.name || 'Unassigned'} — {rental.deliveryJob.address}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={config.color}>{config.label}</Badge>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onViewRental(rental)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <a href={`tel:${rental.deliveryJob.customerPhone}`} className="p-1.5 rounded hover:bg-gray-100">
                      <Phone className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
