import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/ui/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Booking, Dumpster } from "@shared/schema";
import { AdditionalCharges } from "@/components/admin/additional-charges";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { 
  CalendarDays, 
  Truck, 
  DollarSign, 
  MapPin,
  Loader2,
  CreditCard,
  RefreshCw,
  User,
  Mail,
  Phone,
  ClipboardList,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Eye
} from "lucide-react";

export default function DashboardPage() {
  // Always initialize state hooks first - never conditionally
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [dumpsterDistribution, setDumpsterDistribution] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [bookingToComplete, setBookingToComplete] = useState<Booking | null>(null);
  const [isDropOffDialogOpen, setIsDropOffDialogOpen] = useState(false);
  const [selectedDropOffType, setSelectedDropOffType] = useState<string>("");
  const [selectedHubId, setSelectedHubId] = useState<string>("");
  const [selectedCustomerBookingId, setSelectedCustomerBookingId] = useState<string>("");
  const [chargesBooking, setChargesBooking] = useState<Booking | null>(null);
  const [isChargesDialogOpen, setIsChargesDialogOpen] = useState(false);
  const [expandedPlaybook, setExpandedPlaybook] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
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
    
    return statusStep > 0 && statusStep < currentStep;
  };

  // Helper functions for booking details
  const getDumpsterName = (dumpsterId: number) => {
    const dumpster = dumpsters?.find(d => d.id === dumpsterId);
    return dumpster ? dumpster.name : `Dumpster #${dumpsterId}`;
  };

  const getDurationDays = (pricingId: number) => {
    const pricing = allPricing?.find(p => p.id === pricingId);
    return pricing ? pricing.days : 7;
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPickupDate = (deliveryDate: string | Date, pricingId: number) => {
    const durationDays = getDurationDays(pricingId);
    const delivery = typeof deliveryDate === 'string' ? new Date(deliveryDate) : deliveryDate;
    const pickup = new Date(delivery);
    pickup.setDate(delivery.getDate() + Number(durationDays));
    
    return pickup.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Always call all query hooks - no early returns or conditions
  // Fetch bookings
  const { data: bookings = [], isLoading: isLoadingBookings } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  // Fetch dumpsters
  const { data: dumpsters = [], isLoading: isLoadingDumpsters } = useQuery<Dumpster[]>({
    queryKey: ["/api/dumpsters"],
  });

  // Fetch all pricing data to get rental durations
  const { data: allPricing = [], isLoading: isLoadingPricing } = useQuery<any[]>({
    queryKey: ["/api/dumpster-pricing/all"],
  });

  // Fetch add-ons for dialog details
  const { data: addOns = [] } = useQuery({
    queryKey: ['/api/addons'],
  });

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
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Payment Status Check Complete",
        description: data.message || "Payment status has been checked and updated if needed.",
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

  // Mutation for updating booking status
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
      // Also invalidate any dashboard-specific queries that might depend on booking status
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
    if (!bookings || !dumpsters || bookings.length === 0 || dumpsters.length === 0) {
      return;
    }

    // Process bookings data for revenue chart (last 7 days)
    const today = new Date();
    const revenueByDay: { [key: string]: number } = {};
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      revenueByDay[dateStr] = 0;
    }

    // Sum up revenue by day
    bookings.forEach(booking => {
      if (booking.createdAt) {
        const bookingDate = new Date(booking.createdAt);
        // Check if booking is within last 7 days
        const daysDiff = Math.floor((today.getTime() - bookingDate.getTime()) / (1000 * 3600 * 24));
        if (daysDiff <= 6) {
          const dateStr = bookingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          revenueByDay[dateStr] = (revenueByDay[dateStr] || 0) + booking.totalPrice;
        }
      }
    });

    // Convert to array for chart
    const revenueChartData = Object.entries(revenueByDay).map(([date, amount]) => ({
      date,
      amount: amount / 100, // Convert cents to dollars
    }));

    // Process dumpster distribution data
    const dumpsterCounts: { [key: string]: number } = {};
    const dumpsterMap: { [key: number]: string } = {};
    
    // Create mapping of dumpster ids to names
    dumpsters.forEach(dumpster => {
      dumpsterMap[dumpster.id] = dumpster.name;
      dumpsterCounts[dumpster.name] = 0;
    });

    // Count bookings by dumpster type
    bookings.forEach(booking => {
      const dumpsterName = dumpsterMap[booking.dumpsterId] || 'Unknown';
      dumpsterCounts[dumpsterName] = (dumpsterCounts[dumpsterName] || 0) + 1;
    });

    // Convert to array for chart
    const dumpsterDistributionData = Object.entries(dumpsterCounts).map(([name, count]) => ({
      name,
      value: count,
    }));

    // Only update state if data has actually changed
    setRevenueData(prevData => {
      const dataChanged = JSON.stringify(prevData) !== JSON.stringify(revenueChartData);
      return dataChanged ? revenueChartData : prevData;
    });

    setDumpsterDistribution(prevData => {
      const dataChanged = JSON.stringify(prevData) !== JSON.stringify(dumpsterDistributionData);
      return dataChanged ? dumpsterDistributionData : prevData;
    });
  }, [bookings, dumpsters]);

  // Chart colors in blue/teal palette that shows better against white background
  const COLORS = ['#3b82f6', '#0d9488', '#6366f1', '#8b5cf6'];
  
  // Calculate summary statistics before any return statements to avoid hook order issues
  const totalBookings = bookings?.length || 0;
  const activeBookings = bookings?.filter(b => b.status === 'pending').length || 0;
  const totalRevenue = bookings?.reduce((sum, booking) => sum + booking.totalPrice, 0) || 0;
  const serviceZoneCount = new Set(bookings?.map(b => b.serviceZoneId)).size || 0;

  // Helper function to calculate time since booking creation
  const getTimePending = (createdAt: Date | string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return { text: `${diffDays}d ago`, isUrgent: diffDays >= 1 };
    if (diffHours > 0) return { text: `${diffHours}h ago`, isUrgent: diffHours >= 24 };
    return { text: 'Just now', isUrgent: false };
  };

  // Calculate "Today's Playbook" data
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Pending bookings requiring attention (older than 24h get flagged)
  const pendingBookings = bookings?.filter(b => b.status === 'pending') || [];
  const urgentPendingCount = pendingBookings.filter(b => {
    const created = new Date(b.createdAt);
    const hoursSince = (new Date().getTime() - created.getTime()) / (1000 * 60 * 60);
    return hoursSince >= 24;
  }).length;

  // Overdue pickups (delivered status but pickup date has passed)
  const overduePickups = bookings?.filter(booking => {
    if (booking.status !== 'delivered') return false;
    const pricing = allPricing?.find(p => p.id === booking.pricingId);
    const rentalDays = pricing?.days || 7;
    const deliveryDate = new Date(booking.deliveryDate);
    const pickupDate = new Date(deliveryDate);
    pickupDate.setDate(deliveryDate.getDate() + rentalDays);
    pickupDate.setHours(0, 0, 0, 0);
    return pickupDate < today;
  }) || [];

  // Today's deliveries
  const todaysDeliveries = bookings?.filter(booking => {
    if (!booking.deliveryDate) return false;
    const deliveryDate = new Date(booking.deliveryDate);
    deliveryDate.setHours(0, 0, 0, 0);
    return deliveryDate.getTime() === today.getTime() && ['pending', 'confirmed'].includes(booking.status);
  }) || [];

  // Today's pickups
  const todaysPickups = bookings?.filter(booking => {
    if (!booking.deliveryDate || booking.status === 'complete' || booking.status === 'cancelled') return false;
    const pricing = allPricing?.find(p => p.id === booking.pricingId);
    const rentalDays = pricing?.days || 7;
    const deliveryDate = new Date(booking.deliveryDate);
    const pickupDate = new Date(deliveryDate);
    pickupDate.setDate(deliveryDate.getDate() + rentalDays);
    pickupDate.setHours(0, 0, 0, 0);
    return pickupDate.getTime() === today.getTime() && booking.status === 'delivered';
  }) || [];

  if (isLoadingBookings || isLoadingDumpsters || isLoadingPricing) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500 text-sm">Overview of your dumpster rental business</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center space-x-2 sm:space-x-3">
              <div className="bg-gray-100 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-500">Total Bookings</p>
                <h3 className="text-lg sm:text-xl font-bold">{totalBookings}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center space-x-2 sm:space-x-3">
              <div className="bg-gray-100 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-500">Active Deliveries</p>
                <h3 className="text-lg sm:text-xl font-bold">{activeBookings}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center space-x-2 sm:space-x-3">
              <div className="bg-yellow-100 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-500">Total Revenue</p>
                <h3 className="text-lg sm:text-xl font-bold">${(totalRevenue / 100).toFixed(2)}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center space-x-2 sm:space-x-3">
              <div className="bg-gray-100 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-500">Service Zones</p>
                <h3 className="text-lg sm:text-xl font-bold">{serviceZoneCount}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Playbook - Actionable Items with Expandable Sections */}
        <Card className="border-l-4 border-l-[#f7c948]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5 text-[#f7c948]" />
              Today's Playbook
              <span className="text-sm font-normal text-gray-500 ml-2">Click any card to expand</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Deliveries Today - Collapsible */}
            <Collapsible 
              open={expandedPlaybook === 'deliveries'} 
              onOpenChange={(open) => setExpandedPlaybook(open ? 'deliveries' : null)}
            >
              <CollapsibleTrigger asChild>
                <div 
                  className="bg-blue-50 rounded-lg p-4 cursor-pointer hover:bg-blue-100 transition-colors" 
                  data-testid="playbook-deliveries"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Truck className="h-5 w-5 text-blue-600" />
                      <div>
                        <span className="text-sm font-medium text-blue-700">Deliveries Today</span>
                        {todaysDeliveries.length > 0 && (
                          <p className="text-xs text-blue-600">
                            {todaysDeliveries.filter(b => b.status === 'confirmed').length} confirmed
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-blue-900">{todaysDeliveries.length}</span>
                      {expandedPlaybook === 'deliveries' ? (
                        <ChevronUp className="h-5 w-5 text-blue-600" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="bg-blue-50/50 rounded-lg p-3 space-y-2 max-h-64 overflow-y-auto">
                  {todaysDeliveries.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No deliveries scheduled for today</p>
                  ) : (
                    todaysDeliveries.map((booking) => {
                      const dumpster = dumpsters?.find(d => d.id === booking.dumpsterId);
                      return (
                        <div key={booking.id} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{booking.customerName}</p>
                            <p className="text-xs text-gray-500 truncate">{dumpster?.name} - {booking.deliveryAddress}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Select 
                              value={booking.status} 
                              onValueChange={(value) => handleStatusChange(booking.id, value)}
                            >
                              <SelectTrigger className="w-28 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="picked_up">Picked Up</SelectItem>
                                <SelectItem value="complete">Complete</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { setSelectedBooking(booking); setIsBookingDialogOpen(true); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <a href={`tel:${booking.customerPhone}`} className="p-1.5 rounded hover:bg-blue-100 text-blue-600"><Phone className="h-4 w-4" /></a>
                            <a href={`mailto:${booking.customerEmail}`} className="p-1.5 rounded hover:bg-blue-100 text-blue-600"><Mail className="h-4 w-4" /></a>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Pickups Today - Collapsible */}
            <Collapsible 
              open={expandedPlaybook === 'pickups'} 
              onOpenChange={(open) => setExpandedPlaybook(open ? 'pickups' : null)}
            >
              <CollapsibleTrigger asChild>
                <div 
                  className="bg-green-50 rounded-lg p-4 cursor-pointer hover:bg-green-100 transition-colors" 
                  data-testid="playbook-pickups"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Truck className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Pickups Today</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-green-900">{todaysPickups.length}</span>
                      {expandedPlaybook === 'pickups' ? (
                        <ChevronUp className="h-5 w-5 text-green-600" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="bg-green-50/50 rounded-lg p-3 space-y-2 max-h-64 overflow-y-auto">
                  {todaysPickups.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No pickups scheduled for today</p>
                  ) : (
                    todaysPickups.map((booking) => {
                      const dumpster = dumpsters?.find(d => d.id === booking.dumpsterId);
                      return (
                        <div key={booking.id} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{booking.customerName}</p>
                            <p className="text-xs text-gray-500 truncate">{dumpster?.name} - {booking.deliveryAddress}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Select 
                              value={booking.status} 
                              onValueChange={(value) => handleStatusChange(booking.id, value)}
                            >
                              <SelectTrigger className="w-28 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="picked_up">Picked Up</SelectItem>
                                <SelectItem value="complete">Complete</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { setSelectedBooking(booking); setIsBookingDialogOpen(true); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <a href={`tel:${booking.customerPhone}`} className="p-1.5 rounded hover:bg-green-100 text-green-600"><Phone className="h-4 w-4" /></a>
                            <a href={`mailto:${booking.customerEmail}`} className="p-1.5 rounded hover:bg-green-100 text-green-600"><Mail className="h-4 w-4" /></a>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Pending Review - Collapsible */}
            <Collapsible 
              open={expandedPlaybook === 'pending'} 
              onOpenChange={(open) => setExpandedPlaybook(open ? 'pending' : null)}
            >
              <CollapsibleTrigger asChild>
                <div 
                  className={`rounded-lg p-4 cursor-pointer transition-colors ${urgentPendingCount > 0 ? 'bg-amber-50 hover:bg-amber-100' : 'bg-gray-50 hover:bg-gray-100'}`} 
                  data-testid="playbook-pending"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {urgentPendingCount > 0 ? (
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-gray-500" />
                      )}
                      <div>
                        <span className={`text-sm font-medium ${urgentPendingCount > 0 ? 'text-amber-700' : 'text-gray-700'}`}>
                          Pending Review
                        </span>
                        {urgentPendingCount > 0 && (
                          <p className="text-xs text-amber-600">{urgentPendingCount} waiting 24h+</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-bold ${urgentPendingCount > 0 ? 'text-amber-900' : 'text-gray-900'}`}>
                        {pendingBookings.length}
                      </span>
                      {expandedPlaybook === 'pending' ? (
                        <ChevronUp className={`h-5 w-5 ${urgentPendingCount > 0 ? 'text-amber-600' : 'text-gray-500'}`} />
                      ) : (
                        <ChevronDown className={`h-5 w-5 ${urgentPendingCount > 0 ? 'text-amber-600' : 'text-gray-500'}`} />
                      )}
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="bg-amber-50/50 rounded-lg p-3 space-y-2 max-h-64 overflow-y-auto">
                  {pendingBookings.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No pending bookings</p>
                  ) : (
                    pendingBookings.map((booking) => {
                      const dumpster = dumpsters?.find(d => d.id === booking.dumpsterId);
                      const timePending = getTimePending(booking.createdAt);
                      return (
                        <div key={booking.id} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{booking.customerName}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${timePending.isUrgent ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                                <Clock className="h-3 w-3 inline mr-1" />{timePending.text}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 truncate">{dumpster?.name} - {booking.deliveryAddress}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Select 
                              value={booking.status} 
                              onValueChange={(value) => handleStatusChange(booking.id, value)}
                            >
                              <SelectTrigger className="w-28 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="picked_up">Picked Up</SelectItem>
                                <SelectItem value="complete">Complete</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { setSelectedBooking(booking); setIsBookingDialogOpen(true); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <a href={`tel:${booking.customerPhone}`} className="p-1.5 rounded hover:bg-amber-100 text-amber-600"><Phone className="h-4 w-4" /></a>
                            <a href={`mailto:${booking.customerEmail}`} className="p-1.5 rounded hover:bg-amber-100 text-amber-600"><Mail className="h-4 w-4" /></a>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Overdue Pickups - Collapsible */}
            <Collapsible 
              open={expandedPlaybook === 'overdue'} 
              onOpenChange={(open) => setExpandedPlaybook(open ? 'overdue' : null)}
            >
              <CollapsibleTrigger asChild>
                <div 
                  className={`rounded-lg p-4 cursor-pointer transition-colors ${overduePickups.length > 0 ? 'bg-red-50 hover:bg-red-100' : 'bg-gray-50 hover:bg-gray-100'}`} 
                  data-testid="playbook-overdue"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {overduePickups.length > 0 ? (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-gray-500" />
                      )}
                      <div>
                        <span className={`text-sm font-medium ${overduePickups.length > 0 ? 'text-red-700' : 'text-gray-700'}`}>
                          Overdue Pickups
                        </span>
                        {overduePickups.length > 0 && (
                          <p className="text-xs text-red-600">Requires immediate attention</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-bold ${overduePickups.length > 0 ? 'text-red-900' : 'text-gray-900'}`}>
                        {overduePickups.length}
                      </span>
                      {expandedPlaybook === 'overdue' ? (
                        <ChevronUp className={`h-5 w-5 ${overduePickups.length > 0 ? 'text-red-600' : 'text-gray-500'}`} />
                      ) : (
                        <ChevronDown className={`h-5 w-5 ${overduePickups.length > 0 ? 'text-red-600' : 'text-gray-500'}`} />
                      )}
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="bg-red-50/50 rounded-lg p-3 space-y-2 max-h-64 overflow-y-auto">
                  {overduePickups.length === 0 ? (
                    <div className="text-center py-4">
                      <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No overdue pickups - great job!</p>
                    </div>
                  ) : (
                    overduePickups.map((booking) => {
                      const dumpster = dumpsters?.find(d => d.id === booking.dumpsterId);
                      const pricing = allPricing?.find(p => p.id === booking.pricingId);
                      const rentalDays = pricing?.days || 7;
                      const deliveryDate = new Date(booking.deliveryDate);
                      const pickupDate = new Date(deliveryDate);
                      pickupDate.setDate(deliveryDate.getDate() + rentalDays);
                      const daysOverdue = Math.floor((today.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24));
                      
                      return (
                        <div key={booking.id} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border-l-4 border-red-500">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{booking.customerName}</p>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 truncate">{dumpster?.name} - {booking.deliveryAddress}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Select 
                              value={booking.status} 
                              onValueChange={(value) => handleStatusChange(booking.id, value)}
                            >
                              <SelectTrigger className="w-28 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="picked_up">Picked Up</SelectItem>
                                <SelectItem value="complete">Complete</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { setSelectedBooking(booking); setIsBookingDialogOpen(true); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <a href={`tel:${booking.customerPhone}`} className="p-1.5 rounded hover:bg-red-100 text-red-600"><Phone className="h-4 w-4" /></a>
                            <a href={`mailto:${booking.customerEmail}`} className="p-1.5 rounded hover:bg-red-100 text-red-600"><Mail className="h-4 w-4" /></a>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        {/* Deliveries & Pickups */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Deliveries & Pickups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="today" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="coming-up">Coming Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="today" className="space-y-3 mt-4">
                {(() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const tomorrow = new Date(today);
                  tomorrow.setDate(today.getDate() + 1);
                  
                  const todayBookings = bookings?.filter(booking => {
                    if (!booking.deliveryDate) return false;
                    const deliveryDate = new Date(booking.deliveryDate);
                    deliveryDate.setHours(0, 0, 0, 0);
                    
                    // Check if delivery is today
                    if (deliveryDate.getTime() === today.getTime() && ['pending', 'confirmed', 'delivered', 'picked_up'].includes(booking.status)) {
                      return true;
                    }
                    
                    // Check if pickup is today (delivery date + rental duration)
                    const pricing = allPricing.find(p => p.id === booking.pricingId);
                    const rentalDays = pricing?.days || 3;
                    const pickupDate = new Date(deliveryDate);
                    pickupDate.setDate(deliveryDate.getDate() + rentalDays);
                    pickupDate.setHours(0, 0, 0, 0);
                    
                    return pickupDate.getTime() === today.getTime() && ['pending', 'confirmed', 'delivered', 'picked_up'].includes(booking.status);
                  }) || [];

                  if (todayBookings.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <Truck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>No deliveries or pickups scheduled for today</p>
                      </div>
                    );
                  }

                  return todayBookings.map((booking) => {
                    const dumpster = dumpsters?.find(d => d.id === booking.dumpsterId);
                    const pricing = allPricing.find(p => p.id === booking.pricingId);
                    const rentalDays = pricing?.days || 3;
                    const deliveryDate = new Date(booking.deliveryDate!);
                    const pickupDate = new Date(deliveryDate);
                    pickupDate.setDate(deliveryDate.getDate() + rentalDays);
                    
                    const isDelivery = deliveryDate.getTime() === today.getTime();
                    
                    return (
                      <div 
                        key={booking.id} 
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer md:cursor-default"
                        onClick={() => {
                          // Mobile: Make entire card clickable
                          if (window.innerWidth < 768) {
                            setSelectedBooking(booking);
                            setIsBookingDialogOpen(true);
                          }
                        }}
                      >
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          <div className={`p-2 rounded-full ${isDelivery ? 'bg-blue-100' : 'bg-green-100'}`}>
                            <Truck className={`h-4 w-4 ${isDelivery ? 'text-blue-600' : 'text-green-600'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium">{booking.customerName}</h4>
                            <p className="text-sm text-gray-600">
                              {dumpster?.name || `Dumpster #${booking.dumpsterId}`}
                            </p>
                            <p className="text-sm text-gray-500">{booking.deliveryAddress}</p>
                            <div className="flex items-center gap-2 mt-2">
                              {/* Mobile: Status dropdown */}
                              <div 
                                className="md:hidden"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Select 
                                  value={booking.status} 
                                  onValueChange={(value) => updateBookingStatusMutation.mutate({ bookingId: booking.id, status: value })}
                                >
                                  <SelectTrigger 
                                    className="w-auto h-auto border-none p-0 shadow-none bg-transparent focus:ring-0"
                                  >
                                    {getStatusBadge(booking.status)}
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                    <SelectItem value="delivered">Delivered</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              {/* Desktop: Regular status badge */}
                              <div className="hidden md:block">
                                {getStatusBadge(booking.status)}
                              </div>
                              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                isDelivery 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {isDelivery ? 'Delivery' : 'Pickup'}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                          {/* Mobile: Navigation and charges buttons */}
                          <div className="md:hidden flex gap-1">
                            <Button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setChargesBooking(booking);
                                setIsChargesDialogOpen(true);
                              }}
                              variant="outline"
                              className="h-8 w-8 p-0"
                              size="sm"
                              title="Additional Charges"
                            >
                              <CreditCard className="h-3 w-3" />
                            </Button>
                            <Button 
                              onClick={(e) => {
                                e.stopPropagation();
                                const address = `${booking.deliveryAddress}, ${booking.deliveryCity}, ${booking.deliveryZipCode}`;
                                const mapsUrl = `https://maps.google.com/maps?daddr=${encodeURIComponent(address)}`;
                                window.open(mapsUrl, '_blank');
                              }}
                              className="bg-[#f7c948] hover:bg-[#f7c948]/90 text-black h-8 w-8 p-0"
                              size="sm"
                            >
                              <MapPin className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          {/* Desktop: Full controls */}
                          <div className="hidden md:flex md:items-center md:gap-2">
                            <Select 
                              value={booking.status} 
                              onValueChange={(value) => updateBookingStatusMutation.mutate({ bookingId: booking.id, status: value })}
                            >
                              <SelectTrigger className="w-36 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {statusOrder.map((status) => (
                                  <SelectItem 
                                    key={status.value} 
                                    value={status.value}
                                    className={isStatusCompleted(status.value, booking.status) ? "line-through text-gray-400" : ""}
                                  >
                                    <span className="flex items-center gap-2">
                                      {status.step > 0 && (
                                        <span className="flex-shrink-0 w-4 h-4 bg-gray-200 text-gray-700 rounded-full text-xs flex items-center justify-center font-medium">
                                          {status.step}
                                        </span>
                                      )}
                                      <span className={isStatusCompleted(status.value, booking.status) ? "line-through" : ""}>
                                        {status.label}
                                      </span>
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button 
                              onClick={() => {
                                const address = `${booking.deliveryAddress}, ${booking.deliveryCity}, ${booking.deliveryZipCode}`;
                                const mapsUrl = `https://maps.google.com/maps?daddr=${encodeURIComponent(address)}`;
                                window.open(mapsUrl, '_blank');
                              }}
                              className="bg-[#f7c948] hover:bg-[#f7c948]/90 text-black h-8 px-3"
                              size="sm"
                            >
                              <MapPin className="h-3 w-3" />
                            </Button>
                            <Button 
                              onClick={() => {
                                setChargesBooking(booking);
                                setIsChargesDialogOpen(true);
                              }}
                              variant="outline"
                              className="h-8 px-2"
                              size="sm"
                              title="Additional Charges"
                            >
                              <CreditCard className="h-3 w-3" />
                            </Button>
                            <Button 
                              onClick={() => {
                                setSelectedBooking(booking);
                                setIsBookingDialogOpen(true);
                              }}
                              variant="outline"
                              className="h-8 px-3"
                              size="sm"
                            >
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </TabsContent>
              
              <TabsContent value="coming-up" className="space-y-3 mt-4">
                {(() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  const upcomingTasks: Array<{
                    id: number;
                    customerName: string;
                    dumpsterId: number;
                    deliveryAddress: string;
                    taskType: 'delivery' | 'pickup';
                    taskDate: Date;
                    sortDate: number;
                  }> = [];
                  
                  // Get all bookings and create only the NEXT task for each booking
                  bookings?.forEach(booking => {
                    if (!booking.deliveryDate) return;
                    
                    const pricing = allPricing.find(p => p.id === booking.pricingId);
                    const rentalDays = pricing?.days || 3;
                    const deliveryDate = new Date(booking.deliveryDate);
                    deliveryDate.setHours(0, 0, 0, 0);
                    
                    // Determine what the next task should be based on current status
                    let nextTask: 'delivery' | 'pickup' | null = null;
                    let nextTaskDate: Date | null = null;
                    
                    if (['pending', 'confirmed'].includes(booking.status)) {
                      // Next task is delivery
                      nextTask = 'delivery';
                      nextTaskDate = deliveryDate;
                    } else if (['delivered', 'picked_up'].includes(booking.status)) {
                      // Next task is pickup (or showing current pickup task if picked_up)
                      nextTask = 'pickup';
                      nextTaskDate = new Date(deliveryDate);
                      nextTaskDate.setDate(deliveryDate.getDate() + rentalDays);
                      nextTaskDate.setHours(0, 0, 0, 0);
                    }
                    // If status is 'complete', no next task needed
                    
                    if (nextTask && nextTaskDate && nextTaskDate > today) {
                      upcomingTasks.push({
                        id: booking.id,
                        customerName: booking.customerName,
                        dumpsterId: booking.dumpsterId,
                        deliveryAddress: booking.deliveryAddress,
                        taskType: nextTask,
                        taskDate: nextTaskDate,
                        sortDate: nextTaskDate.getTime()
                      });
                    }
                  });
                  
                  // Sort by date and take first 10
                  const sortedTasks = upcomingTasks
                    .sort((a, b) => a.sortDate - b.sortDate)
                    .slice(0, 10);

                  if (sortedTasks.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <Truck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>No upcoming deliveries or pickups scheduled</p>
                        <p className="text-xs mt-2">
                          {bookings?.length ? `Found ${bookings.length} total bookings` : 'No bookings found'}
                        </p>
                      </div>
                    );
                  }

                  return sortedTasks.map((task, index) => {
                    const dumpster = dumpsters?.find(d => d.id === task.dumpsterId);
                    const isDelivery = task.taskType === 'delivery';
                    const booking = bookings?.find(b => b.id === (task.id > 1000 ? task.id - 1000 : task.id));
                    
                    return (
                      <div 
                        key={`${task.id}-${task.taskType}`} 
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer md:cursor-default"
                        onClick={() => {
                          // Mobile: Make entire card clickable
                          if (booking && window.innerWidth < 768) {
                            setSelectedBooking(booking);
                            setIsBookingDialogOpen(true);
                          }
                        }}
                      >
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          <div className={`p-2 rounded-full ${isDelivery ? 'bg-blue-100' : 'bg-green-100'}`}>
                            <Truck className={`h-4 w-4 ${isDelivery ? 'text-blue-600' : 'text-green-600'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium">{task.customerName}</h4>
                            <p className="text-sm text-gray-600">
                              {dumpster?.name || `Dumpster #${task.dumpsterId}`}
                            </p>
                            <p className="text-sm text-gray-500">{task.deliveryAddress}</p>
                            <div className="flex items-center gap-2 mt-2">
                              {booking && (
                                <>
                                  {/* Mobile: Status dropdown */}
                                  <div 
                                    className="md:hidden"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Select 
                                      value={booking.status} 
                                      onValueChange={(value) => handleStatusChange(booking.id, value)}
                                    >
                                      <SelectTrigger 
                                        className="w-auto h-auto border-none p-0 shadow-none bg-transparent focus:ring-0"
                                      >
                                        {getStatusBadge(booking.status)}
                                      </SelectTrigger>
                                      <SelectContent>
                                        {statusOrder.map((status) => (
                                          <SelectItem 
                                            key={status.value} 
                                            value={status.value}
                                            className={isStatusCompleted(status.value, booking.status) ? "line-through text-gray-400" : ""}
                                          >
                                            <span className="flex items-center gap-2">
                                              {status.step > 0 && (
                                                <span className="flex-shrink-0 w-4 h-4 bg-gray-200 text-gray-700 rounded-full text-xs flex items-center justify-center font-medium">
                                                  {status.step}
                                                </span>
                                              )}
                                              <span className={isStatusCompleted(status.value, booking.status) ? "line-through" : ""}>
                                                {status.label}
                                              </span>
                                            </span>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  {/* Desktop: Regular status badge */}
                                  <div className="hidden md:block">
                                    {getStatusBadge(booking.status)}
                                  </div>
                                </>
                              )}
                              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                isDelivery 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {isDelivery ? 'Delivery' : 'Pickup'}
                              </div>
                              <span className="text-xs text-gray-500">
                                {task.taskDate.toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                          {/* Mobile: Navigation and charges buttons */}
                          <div className="md:hidden flex gap-1">
                            {booking && (
                              <Button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setChargesBooking(booking);
                                  setIsChargesDialogOpen(true);
                                }}
                                variant="outline"
                                className="h-8 w-8 p-0"
                                size="sm"
                                title="Additional Charges"
                              >
                                <CreditCard className="h-3 w-3" />
                              </Button>
                            )}
                            <Button 
                              onClick={(e) => {
                                e.stopPropagation();
                                const address = `${task.deliveryAddress}`;
                                const mapsUrl = `https://maps.google.com/maps?daddr=${encodeURIComponent(address)}`;
                                window.open(mapsUrl, '_blank');
                              }}
                              className="bg-[#f7c948] hover:bg-[#f7c948]/90 text-black h-8 w-8 p-0"
                              size="sm"
                            >
                              <MapPin className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          {/* Desktop: Full controls */}
                          <div className="hidden md:flex md:items-center md:gap-2">
                            {booking && (
                              <Select 
                                value={booking.status} 
                                onValueChange={(value) => handleStatusChange(booking.id, value)}
                              >
                                <SelectTrigger className="w-32 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="confirmed">Confirmed</SelectItem>
                                  <SelectItem value="delivered">Delivered</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            <Button 
                              onClick={() => {
                                const address = `${task.deliveryAddress}`;
                                const mapsUrl = `https://maps.google.com/maps?daddr=${encodeURIComponent(address)}`;
                                window.open(mapsUrl, '_blank');
                              }}
                              className="bg-[#f7c948] hover:bg-[#f7c948]/90 text-black h-8 px-3"
                              size="sm"
                            >
                              <MapPin className="h-3 w-3" />
                            </Button>
                            {booking && (
                              <Button 
                                onClick={() => {
                                  setChargesBooking(booking);
                                  setIsChargesDialogOpen(true);
                                }}
                                variant="outline"
                                className="h-8 px-2"
                                size="sm"
                                title="Additional Charges"
                              >
                                <CreditCard className="h-3 w-3" />
                              </Button>
                            )}
                            <Button 
                              onClick={() => {
                                if (booking) {
                                  setSelectedBooking(booking);
                                  setIsBookingDialogOpen(true);
                                }
                              }}
                              variant="outline"
                              className="h-8 px-3"
                              size="sm"
                            >
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl">Revenue (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={revenueData || []}
                    margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`$${(value || 0).toFixed(2)}`, 'Revenue']}
                      wrapperClassName="recharts-tooltip-custom"
                      itemStyle={{ color: "#333" }}
                      contentStyle={{ background: "white", border: "1px solid #ddd" }}
                      labelStyle={{ fontWeight: "bold" }}
                    />
                    <Bar dataKey="amount" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl">Dumpster Type Distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dumpsterDistribution.length ? dumpsterDistribution : [{ name: 'No Data', value: 1 }]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => name ? `${name} (${((percent || 0) * 100).toFixed(0)}%)` : ''}
                      outerRadius="80%"
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(dumpsterDistribution || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [value, 'Bookings']} 
                      wrapperClassName="recharts-tooltip-custom"
                      contentStyle={{ background: "white", border: "1px solid #ddd" }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings (placeholder) */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3">Customer</th>
                    <th scope="col" className="px-6 py-3">Dumpster</th>
                    <th scope="col" className="px-6 py-3">Delivery Date</th>
                    <th scope="col" className="px-6 py-3">Status</th>
                    <th scope="col" className="px-6 py-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings && bookings.length > 0 ? (
                    bookings.slice(0, 5).map((booking) => {
                      const dumpster = dumpsters?.find(d => d.id === booking.dumpsterId);
                      const status = booking.status || 'pending';
                      const deliveryDate = booking.deliveryDate ? new Date(booking.deliveryDate).toLocaleDateString() : 'Not scheduled';
                      
                      return (
                        <tr key={booking.id} className="bg-white border-b">
                          <td className="px-6 py-4">{booking.customerName || 'Unknown'}</td>
                          <td className="px-6 py-4">{dumpster?.name || `Dumpster #${booking.dumpsterId || 'Unknown'}`}</td>
                          <td className="px-6 py-4">{deliveryDate}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                              status === 'completed' ? 'bg-gray-100 text-gray-800' : 
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4">${((booking.totalPrice || 0) / 100).toFixed(2)}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr className="bg-white border-b">
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No recent bookings</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Booking Details Dialog */}
        {selectedBooking && (
          <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
                      className="bg-[#f7c948] hover:bg-[#f7c948]/90 text-black h-9 text-sm"
                      size="sm"
                    >
                      <MapPin className="h-4 w-4 mr-1" />
                      Navigate
                    </Button>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setChargesBooking(selectedBooking);
                      setIsChargesDialogOpen(true);
                    }}
                    className="text-sm"
                  >
                    <DollarSign className="h-4 w-4 mr-1" />
                    Additional Charges
                  </Button>
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
                  
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setChargesBooking(selectedBooking);
                        setIsChargesDialogOpen(true);
                      }}
                      className="text-sm"
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      Additional Charges
                    </Button>
                    <Button variant="outline" onClick={() => setIsBookingDialogOpen(false)}>
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

        {/* Additional Charges Dialog */}
        {chargesBooking && (
          <Dialog open={isChargesDialogOpen} onOpenChange={setIsChargesDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Additional Charges</DialogTitle>
                <DialogDescription>
                  Manage additional charges for booking #{chargesBooking.id} - {chargesBooking.customerName}
                </DialogDescription>
              </DialogHeader>
              
              <AdditionalCharges 
                bookingId={chargesBooking.id}
                customerName={chargesBooking.customerName}
                customerEmail={chargesBooking.customerEmail}
                customerPhone={chargesBooking.customerPhone}
              />
              
              <DialogFooter>
                <Button 
                  onClick={() => setIsChargesDialogOpen(false)}
                  variant="outline"
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminLayout>
  );

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

  if (isLoadingBookings || isLoadingDumpsters || isLoadingPricing) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="deliveries">Today's Deliveries</TabsTrigger>
            <TabsTrigger value="pickups">Scheduled Pickups</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Overview content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{bookings.length}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Booking Details Dialog */}
        {selectedBooking && (
          <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
              <DialogHeader className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <DialogTitle className="text-lg">Booking Details</DialogTitle>
                    <span className="text-sm font-medium text-muted-foreground">Booking #{selectedBooking.id}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => checkPaymentStatusMutation.mutate(selectedBooking.id)}
                    disabled={checkPaymentStatusMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${checkPaymentStatusMutation.isPending ? 'animate-spin' : ''}`} />
                    Check Payment Status
                  </Button>
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
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="picked_up">Picked Up</SelectItem>
                        <SelectItem value="complete">Complete</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={() => {
                        const address = `${selectedBooking.deliveryAddress}, ${selectedBooking.deliveryCity}, ${selectedBooking.deliveryZipCode}`;
                        const mapsUrl = `https://maps.google.com/maps?daddr=${encodeURIComponent(address)}`;
                        window.open(mapsUrl, '_blank');
                      }}
                      className="bg-[#f7c948] hover:bg-[#f7c948]/90 text-black h-9 text-sm"
                      size="sm"
                    >
                      <MapPin className="h-4 w-4 mr-1" />
                      Navigate
                    </Button>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setChargesBooking(selectedBooking);
                      setIsChargesDialogOpen(true);
                    }}
                    className="text-sm"
                  >
                    <DollarSign className="h-4 w-4 mr-1" />
                    Additional Charges
                  </Button>
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
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" onClick={() => setIsBookingDialogOpen(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Additional Charges Dialog */}
        {chargesBooking && (
          <AdditionalCharges
            booking={chargesBooking}
            isOpen={isChargesDialogOpen}
            onClose={() => {
              setIsChargesDialogOpen(false);
              setChargesBooking(null);
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}
