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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Search,
  Eye,
  Calendar as CalendarIcon,
  DollarSign,
  MapPin,
  Trash2,
  Loader2,
  Truck,
  Phone,
  Mail,
  User,
  X,
  Check,
  RefreshCw,
  ClipboardList,
  Building2,
  Navigation,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  List,
  Map,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdditionalCharges } from '@/components/admin/additional-charges';
import { BookingCalendar } from '@/components/admin/booking-calendar';
import { DeliveryMap } from '@/components/admin/delivery-map';
import { useToast } from '@/hooks/use-toast';

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

interface ServiceZone {
  id: number;
  name: string;
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

// Quick view presets
interface QuickView {
  id: string;
  name: string;
  filters: {
    status: string;
    dateRange: string;
    zoneId: string;
  };
}

const quickViews: QuickView[] = [
  { id: 'today-deliveries', name: "Today's Deliveries", filters: { status: 'confirmed', dateRange: 'today', zoneId: 'all' } },
  { id: 'pending-review', name: 'Pending Review', filters: { status: 'pending', dateRange: 'all', zoneId: 'all' } },
  { id: 'overdue-pickups', name: 'Overdue Pickups', filters: { status: 'delivered', dateRange: 'overdue', zoneId: 'all' } },
  { id: 'this-week', name: 'This Week', filters: { status: 'all', dateRange: 'week', zoneId: 'all' } },
];

// Status progression
const statusOptions = [
  { value: 'pending', label: 'Pending', step: 1 },
  { value: 'confirmed', label: 'Confirmed', step: 2 },
  { value: 'delivered', label: 'Delivered', step: 3 },
  { value: 'picked_up', label: 'Picked Up', step: 4 },
  { value: 'complete', label: 'Complete', step: 5 },
  { value: 'cancelled', label: 'Cancelled', step: 0 },
];

export default function BookingsPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // URL params for deep linking
  const initialStatus = searchParams.get('status') || 'all';
  const initialDateRange = searchParams.get('dateRange') || 'all';

  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [dateRangeFilter, setDateRangeFilter] = useState<string>(initialDateRange);
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [sortBy, setSortBy] = useState<string>('deliveryDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isMobileView, setIsMobileView] = useState(false);

  // Drop-off dialog state
  const [bookingToComplete, setBookingToComplete] = useState<Booking | null>(null);
  const [isDropOffDialogOpen, setIsDropOffDialogOpen] = useState(false);
  const [selectedDropOffType, setSelectedDropOffType] = useState<string>('');
  const [selectedHubId, setSelectedHubId] = useState<string>('');



  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch bookings
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

  // Fetch zones
  const { data: zones = [] } = useQuery<ServiceZone[]>({
    queryKey: ['admin-zones'],
    queryFn: async () => {
      const res = await fetch('/api/admin/zones');
      if (!res.ok) throw new Error('Failed to fetch zones');
      return res.json();
    },
  });

  // Fetch pricing
  const { data: allPricing = [] } = useQuery<DumpsterPricing[]>({
    queryKey: ['admin-pricing'],
    queryFn: async () => {
      const res = await fetch('/api/dumpster-pricing/all');
      if (!res.ok) throw new Error('Failed to fetch pricing');
      return res.json();
    },
  });

  // Fetch hubs
  const { data: hubs = [] } = useQuery<Hub[]>({
    queryKey: ['admin-hubs'],
    queryFn: async () => {
      const res = await fetch('/api/admin/hubs');
      if (!res.ok) throw new Error('Failed to fetch hubs');
      return res.json();
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/admin/bookings/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      // Update the selected booking in state
      if (selectedBooking && selectedBooking.id === variables.id) {
        setSelectedBooking({ ...selectedBooking, status: variables.status });
      }
    },
  });

  // Delete mutation
  const deleteBookingMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/bookings/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete booking');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      setIsDeleteDialogOpen(false);
      setBookingToDelete(null);
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
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      toast({
        title: 'Payment Status Check Complete',
        description: data.message || 'Payment status has been checked and updated if needed.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to check payment status: ${error?.message || 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  // Helper functions
  const getDumpsterName = (id: number) => dumpsters?.find((d) => d.id === id)?.name || `Dumpster #${id}`;

  const getDurationDays = (pricingId: number) => allPricing?.find((p) => p.id === pricingId)?.days || 7;

  const getPickupDate = (deliveryDate: string, pricingId: number) => {
    const days = getDurationDays(pricingId);
    const delivery = new Date(deliveryDate);
    delivery.setDate(delivery.getDate() + days);
    return delivery.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getCurrentStep = (status: string) => statusOptions.find((s) => s.value === status)?.step || 0;

  const getNextStatus = (currentStatus: string) => {
    const currentStep = getCurrentStep(currentStatus);
    const nextOption = statusOptions.find((s) => s.step === currentStep + 1);
    return nextOption || null;
  };

  const getStatusBadge = (status: string, size: 'sm' | 'lg' = 'sm') => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      delivered: 'bg-blue-100 text-blue-800',
      picked_up: 'bg-purple-100 text-purple-800',
      complete: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    const label = status === 'picked_up' ? 'Picked Up' : status.charAt(0).toUpperCase() + status.slice(1);
    return (
      <Badge className={`${colors[status] || 'bg-gray-100 text-gray-800'} ${size === 'lg' ? 'text-sm px-3 py-1' : ''}`}>
        {label}
      </Badge>
    );
  };

  // Handle status change
  const handleStatusChange = (id: number, status: string) => {
    if (status === 'complete') {
      const booking = bookings.find((b) => b.id === id) || selectedBooking;
      if (booking) {
        setBookingToComplete(booking);
        setSelectedDropOffType('');
        setSelectedHubId('');
        setIsDropOffDialogOpen(true);
        return;
      }
    }
    updateStatusMutation.mutate({ id, status });
  };

  // Complete booking with drop-off
  const handleCompleteBooking = () => {
    if (!bookingToComplete || !selectedDropOffType) return;
    updateStatusMutation.mutate({ id: bookingToComplete.id, status: 'complete' });
    setIsDropOffDialogOpen(false);
    setBookingToComplete(null);
  };

  // Apply quick view
  const applyQuickView = (view: QuickView) => {
    setStatusFilter(view.filters.status);
    setDateRangeFilter(view.filters.dateRange);
    setZoneFilter(view.filters.zoneId);
  };

  // Clear filters
  const clearAllFilters = () => {
    setStatusFilter('all');
    setDateRangeFilter('all');
    setZoneFilter('all');
    setSearchQuery('');
  };

  const hasActiveFilters = statusFilter !== 'all' || dateRangeFilter !== 'all' || zoneFilter !== 'all' || searchQuery !== '';

  // Filter and sort bookings
  const filteredBookings = useMemo(() => {
    if (!bookings) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);

    let result = [...bookings];

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((b) => b.status === statusFilter);
    }

    // Date range filter
    if (dateRangeFilter !== 'all') {
      result = result.filter((booking) => {
        const deliveryDate = new Date(booking.deliveryDate);
        deliveryDate.setHours(0, 0, 0, 0);
        const days = allPricing?.find((p) => p.id === booking.pricingId)?.days || 7;
        const pickupDate = new Date(deliveryDate);
        pickupDate.setDate(deliveryDate.getDate() + days);

        switch (dateRangeFilter) {
          case 'today':
            return deliveryDate.getTime() === today.getTime();
          case 'tomorrow':
            return deliveryDate.getTime() === tomorrow.getTime();
          case 'week':
            return deliveryDate >= today && deliveryDate <= weekEnd;
          case 'overdue':
            return booking.status === 'delivered' && pickupDate < today;
          default:
            return true;
        }
      });
    }

    // Zone filter
    if (zoneFilter !== 'all') {
      result = result.filter((b) => b.serviceZoneId === parseInt(zoneFilter));
    }

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.customerName.toLowerCase().includes(query) ||
          b.customerEmail.toLowerCase().includes(query) ||
          b.customerPhone.includes(query) ||
          b.deliveryAddress.toLowerCase().includes(query) ||
          b.id.toString().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'id':
          comparison = a.id - b.id;
          break;
        case 'deliveryDate':
          comparison = new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime();
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [bookings, statusFilter, dateRangeFilter, zoneFilter, searchQuery, sortBy, sortOrder, allPricing]);

  // Stats
  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    active: bookings.filter((b) => ['confirmed', 'delivered'].includes(b.status)).length,
    revenue: bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0),
  };

  if (isLoadingBookings && bookings.length === 0) {
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">Manage all dumpster rental bookings</p>
        </div>
        <div className="flex items-center gap-2">
          {isLoadingBookings && <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />}
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })}
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
            <p className="text-[10px] sm:text-sm text-gray-500 truncate">Total Bookings</p>
            <p className="text-lg sm:text-2xl font-bold truncate">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardContent className="p-2.5 sm:p-4 min-w-0">
            <p className="text-[10px] sm:text-sm text-gray-500 truncate">Pending Review</p>
            <p className="text-lg sm:text-2xl font-bold text-yellow-600 truncate">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardContent className="p-2.5 sm:p-4 min-w-0">
            <p className="text-[10px] sm:text-sm text-gray-500 truncate">Active Rentals</p>
            <p className="text-lg sm:text-2xl font-bold text-blue-600 truncate">{stats.active}</p>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardContent className="p-2.5 sm:p-4 min-w-0">
            <p className="text-[10px] sm:text-sm text-gray-500 truncate">Total Revenue</p>
            <p className="text-lg sm:text-2xl font-bold text-green-600 truncate">${(stats.revenue / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
                placeholder="Search bookings..."
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

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full xl:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="picked_up">Picked Up</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range Filter */}
            <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
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

            {/* Zone Filter */}
            <Select value={zoneFilter} onValueChange={setZoneFilter}>
              <SelectTrigger className="w-full xl:w-40">
                <SelectValue placeholder="Zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                {zones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id.toString()}>
                    {zone.name}
                  </SelectItem>
                ))}
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

          {/* Sort controls (only show on list view) */}
          <div className="flex items-center gap-2 min-w-0 flex-shrink">
            <p className="text-xs sm:text-sm text-gray-500 whitespace-nowrap flex-shrink-0">{filteredBookings.length} bookings</p>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-28 sm:w-36 h-8 text-xs sm:text-sm flex-shrink">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deliveryDate">Delivery Date</SelectItem>
                <SelectItem value="createdAt">Booking Date</SelectItem>
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
      {/* Bookings Table (Desktop) / Cards (Mobile) */}
      {isMobileView ? (
        <div className="space-y-3">
          {filteredBookings.map((booking) => (
            <Card
              key={booking.id}
              className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow min-w-0"
              onClick={() => {
                setSelectedBooking(booking);
                setIsDetailDialogOpen(true);
              }}
            >
              <CardContent className="p-3 min-w-0">
                <div className="flex items-start justify-between mb-2 gap-2 min-w-0">
                  <div className="min-w-0 flex-shrink">
                    <p className="font-medium truncate">{booking.customerName}</p>
                    <p className="text-xs text-gray-500">#{booking.id}</p>
                  </div>
                  <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                    <Select
                      value={booking.status}
                      onValueChange={(newStatus) => {
                        updateStatusMutation.mutate({
                          bookingId: booking.id,
                          status: newStatus
                        });
                      }}
                    >
                      <SelectTrigger className="w-[110px] h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="picked_up">Picked Up</SelectItem>
                        <SelectItem value="complete">Complete</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {booking.deliveryAddress}
                  </p>
                  <p className="flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    {formatDate(booking.deliveryDate)}
                  </p>
                  <p className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    ${(booking.totalPrice / 100).toFixed(2)}
                  </p>
                </div>
                <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedBooking(booking);
                      setIsDetailDialogOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`tel:${booking.customerPhone}`)}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Delivery Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow
                    key={booking.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      setSelectedBooking(booking);
                      setIsDetailDialogOpen(true);
                    }}
                  >
                    <TableCell className="font-mono text-sm">#{booking.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{booking.customerName}</p>
                        <p className="text-xs text-gray-500">{booking.customerPhone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="truncate max-w-[200px]" title={booking.deliveryAddress}>
                        {booking.deliveryAddress}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p>{formatDate(booking.deliveryDate)}</p>
                      <p className="text-xs text-gray-500">{booking.deliveryTimePreference}</p>
                    </TableCell>
                    <TableCell className="font-medium">${(booking.totalPrice / 100).toFixed(2)}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={booking.status}
                        onValueChange={(newStatus) => {
                          updateStatusMutation.mutate({
                            bookingId: booking.id,
                            status: newStatus
                          });
                        }}
                      >
                        <SelectTrigger className="w-[140px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="picked_up">Picked Up</SelectItem>
                          <SelectItem value="complete">Complete</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setIsDetailDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`tel:${booking.customerPhone}`)}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            window.open(
                              `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                                `${booking.deliveryAddress}, ${booking.deliveryCity}`
                              )}`
                            )
                          }
                        >
                          <Navigation className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {filteredBookings.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No bookings found</p>
          {hasActiveFilters && (
            <Button variant="link" onClick={clearAllFilters} className="mt-2">
              Clear filters
            </Button>
          )}
        </div>
      )}
        </TabsContent>

        <TabsContent value="calendar">
          <BookingCalendar
            bookings={filteredBookings}
            dumpsters={dumpsters}
            allPricing={allPricing}
          />
        </TabsContent>

        <TabsContent value="map">
          <DeliveryMap bookings={filteredBookings} dumpsters={dumpsters} dateFilter="all" />
        </TabsContent>
      </Tabs>

      {/* REDESIGNED Booking Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto !pt-0" hideClose forceLight>
          {selectedBooking && (
            <>
              {/* HEADER: Customer Name + Status + Quick Actions (Always visible at top) */}
              <div className="sticky top-0 bg-white pb-3 border-b -mx-6 px-6 pt-6 -mt-4">
                {/* Name and Status Badges Row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900">{selectedBooking.customerName}</h2>
                    {getStatusBadge(selectedBooking.status)}
                    {selectedBooking.paymentStatus === 'paid' ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Paid
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {selectedBooking.paymentStatus}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">#{selectedBooking.id}</span>
                    <button
                      onClick={() => setIsDetailDialogOpen(false)}
                      className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Close</span>
                    </button>
                  </div>
                </div>

                {/* Quick Status Advance Button */}
                {selectedBooking.status !== 'complete' && selectedBooking.status !== 'cancelled' && (
                  <div className="flex items-center gap-2 mb-2">
                    {getNextStatus(selectedBooking.status) && (
                      <Button
                        className="flex-1 bg-[#f7c948] hover:bg-[#e6b83d] text-black"
                        onClick={() => {
                          const next = getNextStatus(selectedBooking.status);
                          if (next) handleStatusChange(selectedBooking.id, next.value);
                        }}
                        disabled={updateStatusMutation.isPending}
                      >
                        {updateStatusMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <ArrowRight className="h-4 w-4 mr-2" />
                        )}
                        Mark as {getNextStatus(selectedBooking.status)?.label}
                      </Button>
                    )}
                    <Select
                      value={selectedBooking.status}
                      onValueChange={(val) => handleStatusChange(selectedBooking.id, val)}
                    >
                      <SelectTrigger className="w-auto">
                        <ChevronDown className="h-4 w-4" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Quick Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(`tel:${selectedBooking.customerPhone}`)}
                  >
                    <Phone className="h-4 w-4 mr-1" />
                    Call
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      window.open(
                        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                          `${selectedBooking.deliveryAddress}, ${selectedBooking.deliveryCity}`
                        )}`
                      )
                    }
                  >
                    <Navigation className="h-4 w-4 mr-1" />
                    Navigate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(`mailto:${selectedBooking.customerEmail}`)}
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Email
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => checkPaymentStatusMutation.mutate(selectedBooking.id)}
                    disabled={checkPaymentStatusMutation.isPending}
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${checkPaymentStatusMutation.isPending ? 'animate-spin' : ''}`} />
                    Payment
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="border rounded-md p-4 bg-white">
                    <h3 className="text-sm font-medium flex items-center mb-2 text-gray-900">
                      <User className="mr-2 h-4 w-4 text-gray-500" />
                      Customer Information
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <Mail className="mr-2 h-4 w-4" />
                        <a href={`mailto:${selectedBooking.customerEmail}`} className="hover:underline text-gray-700">
                          {selectedBooking.customerEmail}
                        </a>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Phone className="mr-2 h-4 w-4" />
                        <a href={`tel:${selectedBooking.customerPhone}`} className="hover:underline text-gray-700">
                          {selectedBooking.customerPhone}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-md p-4 bg-white">
                    <h3 className="text-sm font-medium flex items-center mb-2 text-gray-900">
                      <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                      Delivery Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="block text-gray-500">Address</span>
                        <span className="text-gray-900">{selectedBooking.deliveryAddress}</span>
                      </div>
                      <div>
                        <span className="block text-gray-500">City & ZIP</span>
                        <span className="text-gray-900">
                          {selectedBooking.deliveryCity}, {selectedBooking.deliveryZipCode}
                        </span>
                      </div>
                      {selectedBooking.deliveryInstructions && (
                        <div>
                          <span className="block text-gray-500">Instructions</span>
                          <span className="italic text-gray-900">{selectedBooking.deliveryInstructions}</span>
                        </div>
                      )}
                      {selectedBooking.placementLocation && (
                        <div>
                          <span className="block text-gray-500">Placement</span>
                          <span className="text-gray-900">{selectedBooking.placementLocation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border rounded-md p-4 bg-white">
                    <h3 className="text-sm font-medium flex items-center mb-2 text-gray-900">
                      <ClipboardList className="mr-2 h-4 w-4 text-gray-500" />
                      Booking Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Dumpster</span>
                        <span className="text-gray-900">{getDumpsterName(selectedBooking.dumpsterId)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Rental Duration</span>
                        <span className="text-gray-900">{getDurationDays(selectedBooking.pricingId)} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Delivery Date</span>
                        <span className="text-gray-900">{formatDate(selectedBooking.deliveryDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Pickup Date (Est.)</span>
                        <span className="text-gray-900">{getPickupDate(selectedBooking.deliveryDate, selectedBooking.pricingId)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Time Preference</span>
                        <span className="text-gray-900">{selectedBooking.deliveryTimePreference}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-md p-4 bg-white">
                    <h3 className="text-sm font-medium flex items-center mb-2 text-gray-900">
                      <DollarSign className="mr-2 h-4 w-4 text-gray-500" />
                      Payment Information
                    </h3>
                    <div className="mb-3">
                      <p className="text-2xl font-bold text-gray-900">${(selectedBooking.totalPrice / 100).toFixed(2)}</p>
                      <p className="text-xs text-gray-500">Original booking amount</p>
                    </div>

                    {/* Additional Charges Component */}
                    <div className="border-t pt-3">
                      <AdditionalCharges
                        bookingId={selectedBooking.id}
                        customerName={selectedBooking.customerName}
                        customerEmail={selectedBooking.customerEmail}
                        customerPhone={selectedBooking.customerPhone}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Progress */}
              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium text-sm text-gray-500 mb-3">STATUS PROGRESS</h3>
                <div className="flex items-center justify-between">
                  {statusOptions
                    .filter((s) => s.step > 0)
                    .map((s, i) => {
                      const currentStep = getCurrentStep(selectedBooking.status);
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
                              {isComplete ? <Check className="h-4 w-4" /> : s.step}
                            </div>
                            {i < 4 && (
                              <div
                                className={`flex-1 h-1 ${isComplete ? 'bg-green-500' : 'bg-gray-200'}`}
                              />
                            )}
                          </div>
                          <span className="text-xs text-gray-500 mt-1">{s.label}</span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Footer Actions */}
              <DialogFooter className="border-t pt-4 mt-4">
                <Button
                  variant="ghost"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    setBookingToDelete(selectedBooking);
                    setIsDetailDialogOpen(false);
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent forceLight>
          <DialogHeader>
            <DialogTitle>Delete Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete booking #{bookingToDelete?.id}? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => bookingToDelete && deleteBookingMutation.mutate(bookingToDelete.id)}
              disabled={deleteBookingMutation.isPending}
            >
              {deleteBookingMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Trash2 className="h-4 w-4 mr-1" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Drop-off Location Dialog */}
      <Dialog open={isDropOffDialogOpen} onOpenChange={setIsDropOffDialogOpen}>
        <DialogContent forceLight>
          <DialogHeader>
            <DialogTitle>Complete Booking - Drop-off Location</DialogTitle>
            <DialogDescription>
              Where will the dumpster be dropped off after pickup from{' '}
              {bookingToComplete?.customerName}?
            </DialogDescription>
          </DialogHeader>

          <RadioGroup value={selectedDropOffType} onValueChange={setSelectedDropOffType}>
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="hub" id="hub" />
              <Label htmlFor="hub" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>Return to Hub</span>
                </div>
                <p className="text-xs text-gray-500">Bring back to a storage hub</p>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="customer" id="customer" />
              <Label htmlFor="customer" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Transfer to Another Customer</span>
                </div>
                <p className="text-xs text-gray-500">Deliver directly to next booking</p>
              </Label>
            </div>
          </RadioGroup>

          {selectedDropOffType === 'hub' && (
            <Select value={selectedHubId} onValueChange={setSelectedHubId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a hub" />
              </SelectTrigger>
              <SelectContent>
                {hubs.map((hub) => (
                  <SelectItem key={hub.id} value={hub.id.toString()}>
                    {hub.name} - {hub.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDropOffDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCompleteBooking}
              disabled={
                !selectedDropOffType ||
                (selectedDropOffType === 'hub' && !selectedHubId) ||
                updateStatusMutation.isPending
              }
            >
              {updateStatusMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              Complete Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  );
}
