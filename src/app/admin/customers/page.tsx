'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search, Plus, Eye, Mail, Key, Users, Loader2, Phone,
  MapPin, Calendar, DollarSign, Truck, ArrowLeftRight, Package,
  Clock, CheckCircle2, XCircle, AlertCircle, ChevronRight, X,
  Building2, CreditCard, Hash
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface CustomerAccount {
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
  accessCode: string | null; // deprecated
  companyName: string | null;
  isBusinessAccount: boolean | null;
  totalBookings: number | null;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  updatedAt: string;
}

interface CustomerBooking {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryZipCode: string;
  deliveryDate: string;
  deliveryTimePreference: string;
  deliveryInstructions: string | null;
  placementLocation: string;
  totalPrice: number;
  paymentStatus: string;
  status: string;
  createdAt: string;
  dumpster: { id: number; name: string; dimensions: string } | null;
  serviceZone: { id: number; name: string } | null;
  rentalDays: number | null;
}

interface CustomerJob {
  id: number;
  jobType: string;
  bookingId: number | null;
  serviceResponseId: number | null;
  swapRequestId: number | null;
  address: string;
  city: string;
  scheduledDate: string;
  timePreference: string | null;
  status: string;
  priority: number;
  notes: string | null;
  adminNotes: string | null;
  completedAt: string | null;
  createdAt: string;
  dumpster: { id: number; name: string } | null;
}

interface CustomerSwapRequest {
  id: number;
  bookingId: number;
  requestType: string;
  status: string;
  requestedDate: string | null;
  notes: string | null;
  adminNotes: string | null;
  scheduledDate: string | null;
  completedAt: string | null;
  feeAmount: number | null;
  paymentStatus: string | null;
  createdAt: string;
}

interface CustomerDetail {
  customer: CustomerAccount;
  bookings: CustomerBooking[];
  jobs: CustomerJob[];
  swapRequests: CustomerSwapRequest[];
  credits: any[];
  stats: {
    totalBookings: number;
    totalJobs: number;
    totalSpend: number;
    activeBookings: number;
    completedBookings: number;
  };
}

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
  });
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  active: 'bg-green-50 text-green-700 border-green-200',
  scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  in_progress: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  paid: 'bg-green-50 text-green-700 border-green-200',
  not_required: 'bg-gray-50 text-gray-500 border-gray-200',
};

const jobTypeIcons: Record<string, typeof Truck> = {
  delivery: Truck,
  pickup: Package,
  swap: ArrowLeftRight,
  service: Building2,
};

// ---- Customer Detail Panel ----
function CustomerDetailPanel({ customerId, onClose }: { customerId: number; onClose: () => void }) {
  const { data, isLoading, error } = useQuery<CustomerDetail>({
    queryKey: ['admin-customer-detail', customerId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/customer-accounts/${customerId}`);
      if (!res.ok) throw new Error('Failed to fetch customer details');
      return res.json();
    },
    enabled: !!customerId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-yellow-500 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <AlertCircle className="h-10 w-10 mb-3" />
        <p className="font-bold">Failed to load customer details</p>
      </div>
    );
  }

  const { customer, bookings, jobs, swapRequests, credits, stats } = data;

  return (
    <div className="space-y-6">
      {/* Customer Header */}
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 rounded-2xl bg-yellow-500 flex items-center justify-center text-black font-black text-2xl shrink-0">
          {(customer.name || 'U').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-black text-gray-900 truncate">{customer.name || 'No name'}</h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              {customer.email}
            </span>
            {customer.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {customer.phone}
              </span>
            )}
            {customer.companyName && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {customer.companyName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-[10px] font-black uppercase">
              ID #{customer.id}
            </Badge>
            {customer.isBusinessAccount && (
              <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px] font-black uppercase">
                Business
              </Badge>
            )}
            <Badge className={stats.totalBookings > 1 ? 'bg-green-100 text-green-700 text-[10px] font-black uppercase' : 'bg-gray-100 text-gray-500 text-[10px] font-black uppercase'}>
              {stats.totalBookings > 1 ? 'Repeat Customer' : 'New Customer'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Bookings</p>
          <p className="text-2xl font-black text-gray-900">{stats.totalBookings}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Jobs</p>
          <p className="text-2xl font-black text-gray-900">{stats.totalJobs}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Total Spend</p>
          <p className="text-2xl font-black text-green-600">{formatCents(stats.totalSpend)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Active</p>
          <p className="text-2xl font-black text-blue-600">{stats.activeBookings}</p>
        </div>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="bookings" className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-10">
          <TabsTrigger value="bookings" className="text-xs font-bold">
            Bookings ({bookings.length})
          </TabsTrigger>
          <TabsTrigger value="jobs" className="text-xs font-bold">
            Jobs ({jobs.length})
          </TabsTrigger>
          <TabsTrigger value="swaps" className="text-xs font-bold">
            Swaps ({swapRequests.length})
          </TabsTrigger>
        </TabsList>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="mt-4 space-y-3 max-h-[400px] overflow-y-auto">
          {bookings.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="font-bold text-sm">No bookings yet</p>
            </div>
          ) : (
            bookings.map((booking) => (
              <div key={booking.id} className="border border-gray-100 rounded-xl p-4 hover:border-yellow-200 hover:bg-yellow-50/30 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-400 font-bold">#{booking.id}</span>
                    <Badge className={`text-[10px] font-black uppercase border ${statusColors[booking.status] || 'bg-gray-50 text-gray-500'}`}>
                      {booking.status}
                    </Badge>
                    <Badge className={`text-[10px] font-black uppercase border ${statusColors[booking.paymentStatus] || 'bg-gray-50 text-gray-500'}`}>
                      {booking.paymentStatus}
                    </Badge>
                  </div>
                  <span className="font-black text-green-600">{formatCents(booking.totalPrice)}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {booking.dumpster && (
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Truck className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span className="font-semibold">{booking.dumpster.name}</span>
                      {booking.rentalDays && <span className="text-gray-400">({booking.rentalDays} days)</span>}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span>{formatDate(booking.deliveryDate)}</span>
                    <span className="text-gray-400 text-xs capitalize">({booking.deliveryTimePreference})</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-gray-600 sm:col-span-2">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                    <span>{booking.deliveryAddress}, {booking.deliveryCity} {booking.deliveryZipCode}</span>
                  </div>
                  {booking.serviceZone && (
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                      <span>Zone: {booking.serviceZone.name}</span>
                    </div>
                  )}
                </div>
                {booking.deliveryInstructions && (
                  <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                    <span className="font-bold text-gray-400">Notes:</span> {booking.deliveryInstructions}
                  </div>
                )}
                <div className="mt-2 text-[10px] text-gray-400">
                  Booked {formatDateTime(booking.createdAt)}
                </div>
              </div>
            ))
          )}
        </TabsContent>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="mt-4 space-y-3 max-h-[400px] overflow-y-auto">
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Truck className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="font-bold text-sm">No jobs yet</p>
            </div>
          ) : (
            jobs.map((job) => {
              const JobIcon = jobTypeIcons[job.jobType] || Truck;
              return (
                <div key={job.id} className="border border-gray-100 rounded-xl p-4 hover:border-yellow-200 hover:bg-yellow-50/30 transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-gray-100 flex items-center justify-center">
                        <JobIcon className="h-3.5 w-3.5 text-gray-600" />
                      </div>
                      <span className="font-mono text-xs text-gray-400 font-bold">#{job.id}</span>
                      <Badge className="text-[10px] font-black uppercase bg-gray-100 text-gray-600 capitalize">
                        {job.jobType}
                      </Badge>
                      <Badge className={`text-[10px] font-black uppercase border ${statusColors[job.status] || 'bg-gray-50 text-gray-500'}`}>
                        {job.status}
                      </Badge>
                    </div>
                    {job.bookingId && (
                      <span className="text-[10px] text-gray-400 font-mono">Booking #{job.bookingId}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    {job.dumpster && (
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Truck className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span className="font-semibold">{job.dumpster.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span>{formatDate(job.scheduledDate)}</span>
                      {job.timePreference && <span className="text-gray-400 text-xs capitalize">({job.timePreference})</span>}
                    </div>
                    <div className="flex items-start gap-1.5 text-gray-600 sm:col-span-2">
                      <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                      <span>{job.address}, {job.city}</span>
                    </div>
                  </div>
                  {job.notes && (
                    <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                      <span className="font-bold text-gray-400">Notes:</span> {job.notes}
                    </div>
                  )}
                  {job.adminNotes && (
                    <div className="mt-1 text-xs text-indigo-600 bg-indigo-50 rounded-lg p-2">
                      <span className="font-bold text-indigo-400">Admin:</span> {job.adminNotes}
                    </div>
                  )}
                  <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
                    <span>Created {formatDateTime(job.createdAt)}</span>
                    {job.completedAt && (
                      <span className="flex items-center gap-1 text-green-500">
                        <CheckCircle2 className="h-3 w-3" />
                        Completed {formatDate(job.completedAt)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>

        {/* Swap Requests Tab */}
        <TabsContent value="swaps" className="mt-4 space-y-3 max-h-[400px] overflow-y-auto">
          {swapRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <ArrowLeftRight className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="font-bold text-sm">No swap requests</p>
            </div>
          ) : (
            swapRequests.map((swap) => (
              <div key={swap.id} className="border border-gray-100 rounded-xl p-4 hover:border-yellow-200 hover:bg-yellow-50/30 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-400 font-bold">#{swap.id}</span>
                    <Badge className="text-[10px] font-black uppercase bg-gray-100 text-gray-600 capitalize">
                      {swap.requestType}
                    </Badge>
                    <Badge className={`text-[10px] font-black uppercase border ${statusColors[swap.status] || 'bg-gray-50 text-gray-500'}`}>
                      {swap.status}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">Booking #{swap.bookingId}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {swap.requestedDate && (
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span>Requested: {formatDate(swap.requestedDate)}</span>
                    </div>
                  )}
                  {swap.scheduledDate && (
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span>Scheduled: {formatDate(swap.scheduledDate)}</span>
                    </div>
                  )}
                  {swap.feeAmount != null && swap.feeAmount > 0 && (
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <DollarSign className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span>Fee: {formatCents(swap.feeAmount)}</span>
                      {swap.paymentStatus && (
                        <Badge className={`text-[9px] font-bold uppercase border ${statusColors[swap.paymentStatus] || 'bg-gray-50 text-gray-500'}`}>
                          {swap.paymentStatus}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                {swap.notes && (
                  <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                    <span className="font-bold text-gray-400">Customer:</span> {swap.notes}
                  </div>
                )}
                {swap.adminNotes && (
                  <div className="mt-1 text-xs text-indigo-600 bg-indigo-50 rounded-lg p-2">
                    <span className="font-bold text-indigo-400">Admin:</span> {swap.adminNotes}
                  </div>
                )}
                <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
                  <span>Requested {formatDateTime(swap.createdAt)}</span>
                  {swap.completedAt && (
                    <span className="flex items-center gap-1 text-green-500">
                      <CheckCircle2 className="h-3 w-3" />
                      Completed {formatDate(swap.completedAt)}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Account Info Footer */}
      <div className="border-t border-gray-100 pt-4 space-y-2 text-xs text-gray-400">
        <div className="flex items-center justify-between">
          <span>Account Status</span>
          {customer.emailVerified ? (
            <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] font-black uppercase">Verified</Badge>
          ) : (
            <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] font-black uppercase">Pending Setup</Badge>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span>Account Created</span>
          <span className="font-medium text-gray-600">{formatDateTime(customer.createdAt)}</span>
        </div>
        {customer.lastLoginAt && (
          <div className="flex items-center justify-between">
            <span>Last Login</span>
            <span className="font-medium text-gray-600">{formatDateTime(customer.lastLoginAt)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Main Page ----
export default function AdminCustomersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '' });
  const [isMobileView, setIsMobileView] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { data: customers = [], isLoading } = useQuery<CustomerAccount[]>({
    queryKey: ['admin-customers'],
    queryFn: async () => {
      const res = await fetch('/api/admin/customer-accounts');
      if (!res.ok) throw new Error('Failed to fetch customers');
      return res.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newCustomer) => {
      const res = await fetch('/api/admin/customer-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create customer');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      setIsCreateDialogOpen(false);
      setNewCustomer({ name: '', email: '' });
    }
  });

  const resendSetupEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch('/api/customer/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Failed to resend setup email');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
    }
  });

  const filteredCustomers = customers.filter(customer => {
    const customerName = customer.name || '';
    const customerPhone = customer.phone || '';
    const matchesSearch =
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerPhone.includes(searchTerm) ||
      customer.id.toString().includes(searchTerm);

    // Filter by booking count
    const isRepeatCustomer = (customer.totalBookings || 0) > 1;
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'repeat' && isRepeatCustomer) ||
      (statusFilter === 'new' && !isRepeatCustomer);

    return matchesSearch && matchesStatus;
  });

  if (isLoading && customers.length === 0) {
    return (
      <div className="p-10 max-w-[1600px] mx-auto w-full">
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-gray-100 rounded-2xl w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-3xl"></div>)}
          </div>
          <div className="h-96 bg-gray-100 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto w-full min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 sm:mb-6 min-w-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">Manage customer accounts and view booking history</p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-3xl border-none shadow-2xl p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-gray-900">Add Customer</DialogTitle>
                <DialogDescription className="font-medium text-gray-400">
                  Create a new customer account with access code.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(newCustomer); }} className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Customer Name</Label>
                    <Input
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                      className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/10 transition-all font-bold placeholder:font-medium"
                      placeholder="e.g. Christopher Reed"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email</Label>
                    <Input
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                      className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/10 transition-all font-bold placeholder:font-medium"
                      placeholder="chris@alleycat.com"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-black h-14 rounded-2xl shadow-xl shadow-yellow-500/10 transition-all active:scale-95"
                >
                  {createMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Add Customer'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-6 min-w-0">
        <Card className="min-w-0">
          <CardContent className="p-2.5 sm:p-4 min-w-0">
            <p className="text-[10px] sm:text-sm text-gray-500 truncate">Total Customers</p>
            <p className="text-lg sm:text-2xl font-bold truncate">{customers.length}</p>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardContent className="p-2.5 sm:p-4 min-w-0">
            <p className="text-[10px] sm:text-sm text-gray-500 truncate">Repeat Customers</p>
            <p className="text-lg sm:text-2xl font-bold text-green-600 truncate">{customers.filter(c => (c.totalBookings || 0) > 1).length}</p>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardContent className="p-2.5 sm:p-4 min-w-0">
            <p className="text-[10px] sm:text-sm text-gray-500 truncate">This Month</p>
            <p className="text-lg sm:text-2xl font-bold text-blue-600 truncate">{customers.filter(c => {
              const created = new Date(c.createdAt);
              const now = new Date();
              return created.getMonth() === now.getMonth();
            }).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col xl:flex-row gap-4">
            <div className="flex-1 relative min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, phone, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 sm:h-9 w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full xl:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                <SelectItem value="repeat">Repeat Customers</SelectItem>
                <SelectItem value="new">New Customers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table / Cards */}
      {isMobileView ? (
        <div className="space-y-4">
          {filteredCustomers.map((customer) => (
            <Card
              key={customer.id}
              className="border-none shadow-xl shadow-gray-200/40 bg-white rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-all"
              onClick={() => setSelectedCustomerId(customer.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-yellow-500 flex items-center justify-center text-black font-black text-sm shrink-0">
                      {(customer.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{customer.name || 'No name'}</p>
                      <p className="text-xs text-gray-500">{customer.email}</p>
                      {customer.phone && <p className="text-xs text-gray-400">{customer.phone}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={(customer.totalBookings || 0) > 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                      {(customer.totalBookings || 0) > 1 ? `${customer.totalBookings} bookings` : 'New'}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  </div>
                </div>
                <div className="space-y-2 text-sm mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">ID:</span>
                    <span className="font-mono font-bold">#{customer.id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Status:</span>
                    {customer.emailVerified ? (
                      <Badge className="bg-green-100 text-green-700 text-[10px] font-black uppercase">Verified</Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-700 text-[10px] font-black uppercase">Pending Setup</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Created:</span>
                    <span className="font-medium">{formatDate(customer.createdAt)}</span>
                  </div>
                </div>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  {!customer.emailVerified && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => resendSetupEmailMutation.mutate(customer.email)}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Resend Setup Email
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-none shadow-2xl shadow-gray-200/40 bg-white rounded-[32px] overflow-hidden">
          <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-black text-gray-900 tracking-tighter">Customers</CardTitle>
              <CardDescription className="font-bold text-gray-400 mt-1 uppercase text-[10px] tracking-widest italic">{filteredCustomers.length} customers</CardDescription>
            </div>
          </div>
          <CardContent className="p-0">
            <div className="overflow-x-auto no-scrollbar">
              <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="px-10 py-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">ID</TableHead>
                  <TableHead className="py-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Customer</TableHead>
                  <TableHead className="py-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Phone</TableHead>
                  <TableHead className="py-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Account</TableHead>
                  <TableHead className="py-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Bookings</TableHead>
                  <TableHead className="py-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Created</TableHead>
                  <TableHead className="px-10 py-6 text-right font-black text-gray-400 uppercase tracking-widest text-[10px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    className="group hover:bg-gray-50/80 border-gray-50/50 transition-all duration-300 cursor-pointer"
                    onClick={() => setSelectedCustomerId(customer.id)}
                  >
                    <TableCell className="px-10">
                      <span className="font-mono font-black text-xs text-gray-300 group-hover:text-yellow-600 transition-colors">#{customer.id}</span>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="flex items-center">
                        <div className="h-12 w-12 rounded-2xl bg-gray-900/5 border-2 border-white shadow-sm flex items-center justify-center text-gray-900 font-black text-sm mr-4 group-hover:bg-yellow-500 group-hover:text-black transition-all group-hover:rotate-6">
                          {(customer.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-gray-900 tracking-tight group-hover:translate-x-1 transition-transform">{customer.name || 'No name'}</span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{customer.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <span className="text-sm text-gray-500">{customer.phone || '—'}</span>
                    </TableCell>
                    <TableCell className="py-6">
                      {customer.emailVerified ? (
                        <div className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm bg-green-50 text-green-700 border-green-100">
                          <CheckCircle2 className="h-3 w-3 mr-1.5" />
                          Verified
                        </div>
                      ) : (
                        <div className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm bg-amber-50 text-amber-700 border-amber-100">
                          <Clock className="h-3 w-3 mr-1.5" />
                          Pending
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-6">
                      <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${(customer.totalBookings || 0) > 1
                        ? 'bg-green-50 text-green-700 border-green-100 shadow-green-500/5'
                        : 'bg-gray-50 text-gray-400 border-gray-100'
                        }`}>
                        <div className={`h-2 w-2 rounded-full mr-2.5 ${(customer.totalBookings || 0) > 1 ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                        {(customer.totalBookings || 0) > 1 ? `${customer.totalBookings} bookings` : 'New'}
                      </div>
                    </TableCell>
                    <TableCell className="py-6 text-sm font-black text-gray-400 tabular-nums">
                      {formatDate(customer.createdAt)}
                    </TableCell>
                    <TableCell className="px-10 py-6 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedCustomerId(customer.id)}
                          className="h-11 w-11 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-90"
                          title="View Details"
                        >
                          <Eye className="h-5 w-5" />
                        </Button>
                        {!customer.emailVerified && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => resendSetupEmailMutation.mutate(customer.email)}
                            className="h-11 w-11 rounded-2xl hover:bg-yellow-50 hover:text-yellow-600 transition-all active:scale-90"
                            title="Resend Setup Email"
                          >
                            <Mail className="h-5 w-5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11 rounded-2xl hover:bg-black hover:text-white transition-all active:scale-90"
                          title="Email"
                        >
                          <Mail className="h-5 w-5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Customer Detail Dialog */}
      <Dialog open={selectedCustomerId !== null} onOpenChange={(open) => { if (!open) setSelectedCustomerId(null); }}>
        <DialogContent forceLight={true} className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-3xl border-none shadow-2xl p-6 sm:p-8 bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-gray-900">Customer Details</DialogTitle>
            <DialogDescription className="font-medium text-gray-400">
              Full booking and job history
            </DialogDescription>
          </DialogHeader>
          {selectedCustomerId && (
            <CustomerDetailPanel
              customerId={selectedCustomerId}
              onClose={() => setSelectedCustomerId(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
