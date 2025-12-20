import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { AdminLayout } from "@/components/ui/admin-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Booking, Dumpster, AddOn, ServiceZone, RentalDuration, DumpsterPricing, Hub } from "@shared/schema";
import { Loader2, Eye, Package, MapPin, Calendar, Phone, Mail, DollarSign, List, Trash2, Settings, Building2, Users, RefreshCw, User, ClipboardList, Search, Clock, X, Filter, CalendarDays, ChevronRight, Check, Save, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { BookingCalendar } from "@/components/admin/booking-calendar";
import { DeliveryMap } from "@/components/admin/maps/delivery-map";
import { AdditionalCharges } from "@/components/admin/additional-charges";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Saved filter views type
interface SavedView {
  id: string;
  name: string;
  filters: {
    status: string;
    dateRange: string;
    zoneId: string;
  };
}

// Default saved views
const defaultSavedViews: SavedView[] = [
  { id: "today-deliveries", name: "Today's Deliveries", filters: { status: "confirmed", dateRange: "today", zoneId: "all" } },
  { id: "pending-review", name: "Pending Review", filters: { status: "pending", dateRange: "all", zoneId: "all" } },
  { id: "overdue-pickups", name: "Overdue Pickups", filters: { status: "delivered", dateRange: "overdue", zoneId: "all" } },
  { id: "this-week", name: "This Week", filters: { status: "all", dateRange: "week", zoneId: "all" } },
];

export default function BookingsPage() {
  const { toast } = useToast();
  const searchParams = useSearch();
  const [, setLocation] = useLocation();
  
  // Parse URL params for deep linking
  const urlParams = new URLSearchParams(searchParams);
  const initialStatus = urlParams.get("status") || "all";
  const initialDateRange = urlParams.get("dateRange") || "all";
  const initialZone = urlParams.get("zone") || "all";
  
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [dateRangeFilter, setDateRangeFilter] = useState<string>(initialDateRange);
  const [zoneFilter, setZoneFilter] = useState<string>(initialZone);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isDropOffDialogOpen, setIsDropOffDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingToComplete, setBookingToComplete] = useState<Booking | null>(null);
  const [selectedDropOffType, setSelectedDropOffType] = useState<string>("");
  const [selectedHubId, setSelectedHubId] = useState<string>("");
  const [selectedCustomerBookingId, setSelectedCustomerBookingId] = useState<string>("");
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [selectedBookings, setSelectedBookings] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState<string>("deliveryDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [chargesBooking, setChargesBooking] = useState<Booking | null>(null);
  const [isChargesDialogOpen, setIsChargesDialogOpen] = useState(false);
  const [savedViews] = useState<SavedView[]>(defaultSavedViews);
  const [isMobileView, setIsMobileView] = useState(false);

  // Detect mobile view
  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Apply saved view
  const applySavedView = (view: SavedView) => {
    setStatusFilter(view.filters.status);
    setDateRangeFilter(view.filters.dateRange);
    setZoneFilter(view.filters.zoneId);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setStatusFilter("all");
    setDateRangeFilter("all");
    setZoneFilter("all");
    setSearchQuery("");
  };

  // Check if any filters are active
  const hasActiveFilters = statusFilter !== "all" || dateRangeFilter !== "all" || zoneFilter !== "all" || searchQuery !== "";
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
    
    // Don't strike through cancelled status
    if (statusValue === "cancelled") return false;
    
    // Strike through if current step is higher than this status step
    return currentStep > statusStep && statusStep > 0;
  };

  // Fetch bookings and related data
  const { data: bookings, isLoading: isLoadingBookings } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const { data: dumpsters } = useQuery<Dumpster[]>({
    queryKey: ["/api/dumpsters"],
  });

  const { data: addons } = useQuery<AddOn[]>({
    queryKey: ["/api/addons"],
  });

  const { data: zones } = useQuery<ServiceZone[]>({
    queryKey: ["/api/zones"],
  });

  const { data: durations } = useQuery<RentalDuration[]>({
    queryKey: ["/api/durations"],
  });

  const { data: allPricing } = useQuery<DumpsterPricing[]>({
    queryKey: ["/api/dumpster-pricing/all"],
  });

  const { data: hubs } = useQuery<Hub[]>({
    queryKey: ["/api/hubs"],
  });

  // Update booking status mutation
  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      try {
        const response = await apiRequest("PUT", `/api/bookings/${id}`, { status });
        const data = await response.json();
        return data;
      } catch (error) {
        
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      setIsDetailSheetOpen(false);
      toast({
        title: "Booking updated",
        description: "The booking status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      
      toast({
        title: "Error",
        description: `Failed to update booking: ${error?.message || "Unknown error"}`,
        variant: "destructive",
      });
    },
  });

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

  // Delete booking mutation
  const deleteBookingMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/bookings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      setIsDeleteDialogOpen(false);
      setBookingToDelete(null);
      toast({
        title: "Booking deleted",
        description: "The booking has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      
      toast({
        title: "Error",
        description: "Failed to delete booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const promises = ids.map(id => apiRequest("DELETE", `/api/bookings/${id}`));
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      setIsBulkDeleteDialogOpen(false);
      setSelectedBookings(new Set());
      toast({
        title: "Bookings deleted",
        description: `${selectedBookings.size} bookings have been deleted successfully.`,
      });
    },
    onError: (error: any) => {
      
      toast({
        title: "Error",
        description: "Failed to delete some bookings. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Bulk status update mutation
  const bulkStatusUpdateMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: number[]; status: string }) => {
      const promises = ids.map(id => apiRequest("PUT", `/api/bookings/${id}`, { status }));
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      setSelectedBookings(new Set());
      toast({
        title: "Bookings updated",
        description: `${selectedBookings.size} bookings have been updated successfully.`,
      });
    },
    onError: (error: any) => {
      
      toast({
        title: "Error",
        description: "Failed to update some bookings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (id: number, status: string) => {
    try {
      // If changing to "complete", show drop-off location selection dialog
      if (status === "complete") {
        const booking = bookings?.find(b => b.id === id);
        if (booking) {
          setBookingToComplete(booking);
          setSelectedDropOffType("");
          setSelectedHubId("");
          setSelectedCustomerBookingId("");
          setIsDropOffDialogOpen(true);
          return; // Don't update status yet, wait for drop-off selection
        }
      }
      
      updateBookingStatusMutation.mutate({ id, status });
    } catch (error) {
      
      toast({
        title: "Error",
        description: "Failed to update booking status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBooking = (booking: Booking) => {
    setBookingToDelete(booking);
    setIsDeleteDialogOpen(true);
  };

  const handleCompleteBooking = () => {
    if (!bookingToComplete || !selectedDropOffType) {
      toast({
        title: "Selection Required",
        description: "Please select where the dumpster should be dropped off.",
        variant: "destructive",
      });
      return;
    }

    if (selectedDropOffType === "hub" && !selectedHubId) {
      toast({
        title: "Hub Selection Required",
        description: "Please select which hub to drop off the dumpster.",
        variant: "destructive",
      });
      return;
    }

    if (selectedDropOffType === "customer" && !selectedCustomerBookingId) {
      toast({
        title: "Customer Selection Required",
        description: "Please select which customer to deliver the dumpster to.",
        variant: "destructive",
      });
      return;
    }

    // Update booking status to complete
    updateBookingStatusMutation.mutate({ 
      id: bookingToComplete.id, 
      status: "complete" 
    });

    // Close dialog and reset state
    setIsDropOffDialogOpen(false);
    setBookingToComplete(null);
    setSelectedDropOffType("");
    setSelectedHubId("");
    setSelectedCustomerBookingId("");

    toast({
      title: "Booking Completed",
      description: `Dumpster scheduled for drop-off at ${selectedDropOffType === "hub" ? "hub" : "customer location"}.`,
    });
  };

  const confirmDeleteBooking = () => {
    if (bookingToDelete) {
      deleteBookingMutation.mutate(bookingToDelete.id);
    }
  };

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsDetailSheetOpen(true);
  };

  const handleSelectBooking = (bookingId: number, checked: boolean) => {
    const newSelected = new Set(selectedBookings);
    if (checked) {
      newSelected.add(bookingId);
    } else {
      newSelected.delete(bookingId);
    }
    setSelectedBookings(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(sortedAndFilteredBookings.map(booking => booking.id));
      setSelectedBookings(allIds);
    } else {
      setSelectedBookings(new Set());
    }
  };

  const handleBulkStatusChange = (status: string) => {
    const selectedIds = Array.from(selectedBookings);
    if (selectedIds.length > 0) {
      bulkStatusUpdateMutation.mutate({ ids: selectedIds, status });
    }
  };

  const handleBulkDelete = () => {
    if (selectedBookings.size > 0) {
      setIsBulkDeleteDialogOpen(true);
    }
  };

  const confirmBulkDelete = () => {
    const selectedIds = Array.from(selectedBookings);
    if (selectedIds.length > 0) {
      bulkDeleteMutation.mutate(selectedIds);
    }
  };

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

  // Filter and sort bookings with enhanced filtering
  const sortedAndFilteredBookings = useMemo(() => {
    if (!bookings) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);
    
    // First filter by status
    let result = bookings.filter((booking) => {
      if (statusFilter === "all") return true;
      return booking.status === statusFilter;
    });

    // Filter by date range
    if (dateRangeFilter !== "all") {
      result = result.filter((booking) => {
        const deliveryDate = new Date(booking.deliveryDate);
        deliveryDate.setHours(0, 0, 0, 0);
        
        // Calculate pickup date
        const durationDays = allPricing?.find(p => p.id === booking.pricingId)?.days || 7;
        const pickupDate = new Date(deliveryDate);
        pickupDate.setDate(deliveryDate.getDate() + Number(durationDays));
        
        switch (dateRangeFilter) {
          case "today":
            return deliveryDate.getTime() === today.getTime() || 
                   (pickupDate.getTime() === today.getTime() && booking.status === "delivered");
          case "tomorrow":
            const tomorrowDate = new Date(today);
            tomorrowDate.setDate(today.getDate() + 1);
            return deliveryDate.getTime() === tomorrowDate.getTime();
          case "week":
            return deliveryDate >= today && deliveryDate <= weekEnd;
          case "overdue":
            // Overdue means pickup date has passed but status is still "delivered"
            return booking.status === "delivered" && pickupDate < today;
          default:
            return true;
        }
      });
    }

    // Filter by zone (using serviceZoneId if available)
    if (zoneFilter !== "all") {
      result = result.filter((booking) => {
        return (booking as any).serviceZoneId?.toString() === zoneFilter;
      });
    }

    // Then filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((booking) => {
        const searchableFields = [
          booking.customerName,
          booking.customerEmail,
          booking.customerPhone,
          booking.deliveryAddress,
          booking.deliveryCity,
          booking.deliveryZipCode,
          `#${booking.id}`,
          booking.id.toString(),
        ];
        return searchableFields.some(field => 
          field?.toLowerCase().includes(query)
        );
      });
    }

    // Then sort by the selected field
    result = [...result].sort((a, b) => {
      if (sortBy === "deliveryDate") {
        const dateA = new Date(a.deliveryDate).getTime();
        const dateB = new Date(b.deliveryDate).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      } else if (sortBy === "pickupDate") {
        // Calculate pickup dates for comparison
        const durationDaysA = allPricing?.find(p => p.id === a.pricingId)?.days || 7;
        const durationDaysB = allPricing?.find(p => p.id === b.pricingId)?.days || 7;
        
        const deliveryA = new Date(a.deliveryDate);
        const deliveryB = new Date(b.deliveryDate);
        const pickupA = new Date(deliveryA);
        const pickupB = new Date(deliveryB);
        pickupA.setDate(deliveryA.getDate() + Number(durationDaysA));
        pickupB.setDate(deliveryB.getDate() + Number(durationDaysB));
        
        return sortOrder === "asc" ? pickupA.getTime() - pickupB.getTime() : pickupB.getTime() - pickupA.getTime();
      } else if (sortBy === "createdAt") {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      } else if (sortBy === "id") {
        return sortOrder === "asc" ? a.id - b.id : b.id - a.id;
      }
      
      // Default sort by ID
      return sortOrder === "asc" ? a.id - b.id : b.id - a.id;
    });
    
    return result;
  }, [bookings, statusFilter, dateRangeFilter, zoneFilter, searchQuery, sortBy, sortOrder, allPricing]);

  // Get related data for a booking
  const getDumpsterName = (id: number) => {
    return dumpsters?.find(d => d.id === id)?.name || `Dumpster #${id}`;
  };

  const getDurationDays = (pricingId: number) => {
    return allPricing?.find(p => p.id === pricingId)?.days || "N/A";
  };

  const getPickupDate = (deliveryDate: string | Date, pricingId: number) => {
    const durationDays = getDurationDays(pricingId);
    if (durationDays === "N/A") return "N/A";
    
    const delivery = typeof deliveryDate === 'string' ? new Date(deliveryDate) : deliveryDate;
    const pickup = new Date(delivery);
    pickup.setDate(delivery.getDate() + Number(durationDays));
    
    return pickup.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getZoneName = (id: number) => {
    return zones?.find(z => z.id === id)?.name || `Zone #${id}`;
  };

  const getAddonNames = (addonIds: any) => {
    if (!addonIds || !addons) return "None";
    
    try {
      const selectedAddons = Array.isArray(addonIds) 
        ? addonIds.map(item => {
            const addon = addons.find(a => a.id === item.addonId);
            return addon ? `${addon.name}${item.quantity > 1 ? ` (x${item.quantity})` : ''}` : null;
          }).filter(Boolean)
        : [];
      
      return selectedAddons.length > 0 ? selectedAddons.join(", ") : "None";
    } catch (e) {
      return "Error parsing add-ons";
    }
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

  // Get badge style based on booking status to match map colors
  const getBadgeStyle = (status: string): React.CSSProperties => {
    switch (status) {
      case 'pending':
        return { backgroundColor: '#f59e0b', color: 'white', border: 'none' };
      case 'confirmed':
        return { backgroundColor: '#10b981', color: 'white', border: 'none' };
      case 'delivered':
        return { backgroundColor: '#3b82f6', color: 'white', border: 'none' };
      case 'picked_up':
        return { backgroundColor: '#8b5cf6', color: 'white', border: 'none' };
      case 'complete':
        return { backgroundColor: '#059669', color: 'white', border: 'none' };
      case 'cancelled':
        return { backgroundColor: '#ef4444', color: 'white', border: 'none' };
      default:
        return { backgroundColor: '#6b7280', color: 'white', border: 'none' };
    }
  };

  // Get status badge with matching colors
  const getStatusBadge = (status: string) => {
    const displayText = status === 'picked_up' ? 'Picked Up' : status.charAt(0).toUpperCase() + status.slice(1);
    return <Badge style={getBadgeStyle(status)}>{displayText}</Badge>;
  };

  if (isLoadingBookings) {
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
        {/* Header with Search */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Bookings</h1>
            <p className="text-gray-500 text-sm">Manage and track all your dumpster rental bookings</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 w-full sm:w-[280px]"
              data-testid="input-booking-search"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Quick View Buttons */}
        <div className="flex flex-wrap gap-2">
          {savedViews.map((view) => (
            <Button
              key={view.id}
              variant="outline"
              size="sm"
              onClick={() => applySavedView(view)}
              className={`text-xs ${
                statusFilter === view.filters.status && 
                dateRangeFilter === view.filters.dateRange && 
                zoneFilter === view.filters.zoneId 
                  ? 'bg-[#f7c948] text-black border-[#f7c948]' 
                  : ''
              }`}
              data-testid={`quick-view-${view.id}`}
            >
              <Star className="h-3 w-3 mr-1" />
              {view.name}
            </Button>
          ))}
        </div>

        {/* Filter Chips Row */}
        <Card className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            
            {/* Status Filter Chips */}
            <div className="flex flex-wrap gap-1">
              {[
                { value: "all", label: "All" },
                { value: "pending", label: "Pending", color: "bg-amber-100 text-amber-800" },
                { value: "confirmed", label: "Confirmed", color: "bg-green-100 text-green-800" },
                { value: "delivered", label: "Delivered", color: "bg-blue-100 text-blue-800" },
                { value: "picked_up", label: "Picked Up", color: "bg-purple-100 text-purple-800" },
                { value: "complete", label: "Complete", color: "bg-emerald-100 text-emerald-800" },
                { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" },
              ].map((status) => (
                <button
                  key={status.value}
                  onClick={() => setStatusFilter(status.value)}
                  className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                    statusFilter === status.value
                      ? status.color || 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  data-testid={`filter-status-${status.value}`}
                >
                  {status.label}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-gray-300 mx-1" />

            {/* Date Range Filter */}
            <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
              <SelectTrigger className="w-auto h-8 text-xs gap-1">
                <CalendarDays className="h-3 w-3" />
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
            {zones && zones.length > 0 && (
              <Select value={zoneFilter} onValueChange={setZoneFilter}>
                <SelectTrigger className="w-auto h-8 text-xs gap-1">
                  <MapPin className="h-3 w-3" />
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
            )}

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-8 text-xs text-gray-500 hover:text-gray-700"
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
            
            {/* Results count */}
            <span className="ml-auto text-xs text-gray-500">
              {sortedAndFilteredBookings.length} booking{sortedAndFilteredBookings.length !== 1 ? 's' : ''}
            </span>
          </div>
        </Card>
        
        {/* Booking Details Sheet (Slide-out Panel) */}
        <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
            {selectedBooking && (
              <>
                <SheetHeader className="space-y-1">
                  <SheetTitle className="flex items-center justify-between">
                    <span>Booking #{selectedBooking.id}</span>
                    <Badge className={selectedBooking.paymentStatus === 'paid' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}>
                      {selectedBooking.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                    </Badge>
                  </SheetTitle>
                  <SheetDescription>
                    {selectedBooking.customerName} • {getDumpsterName(selectedBooking.dumpsterId)}
                  </SheetDescription>
                </SheetHeader>

                {/* Visual Status Timeline */}
                <div className="my-6">
                  <div className="flex items-center justify-between relative">
                    {/* Progress line */}
                    <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200" />
                    <div 
                      className="absolute top-4 left-0 h-0.5 bg-[#f7c948] transition-all"
                      style={{ 
                        width: selectedBooking.status === 'cancelled' ? '0%' : 
                               `${(getCurrentStep(selectedBooking.status) / 5) * 100}%` 
                      }}
                    />
                    
                    {statusOrder.filter(s => s.step > 0).map((status) => {
                      const isCompleted = getCurrentStep(selectedBooking.status) >= status.step;
                      const isCurrent = selectedBooking.status === status.value;
                      return (
                        <div key={status.value} className="flex flex-col items-center relative z-10">
                          <button
                            onClick={() => handleStatusChange(selectedBooking.id, status.value)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                              isCurrent
                                ? 'bg-[#f7c948] text-black ring-2 ring-[#f7c948] ring-offset-2'
                                : isCompleted
                                ? 'bg-[#f7c948] text-black'
                                : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                            }`}
                          >
                            {isCompleted ? <Check className="h-4 w-4" /> : status.step}
                          </button>
                          <span className={`text-xs mt-2 ${isCurrent ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                            {status.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {selectedBooking.status === 'cancelled' && (
                    <div className="mt-4 text-center">
                      <Badge className="bg-red-500 text-white">Cancelled</Badge>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <Button 
                    onClick={() => {
                      const address = `${selectedBooking.deliveryAddress}, ${selectedBooking.deliveryCity}, ${selectedBooking.deliveryZipCode}`;
                      const mapsUrl = `https://maps.google.com/maps?daddr=${encodeURIComponent(address)}`;
                      window.open(mapsUrl, '_blank');
                    }}
                    className="bg-[#f7c948] hover:bg-[#f7c948]/90 text-black"
                    size="sm"
                  >
                    <MapPin className="h-4 w-4 mr-1" />
                    Navigate
                  </Button>
                  <a href={`tel:${selectedBooking.customerPhone}`}>
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4 mr-1" />
                      Call
                    </Button>
                  </a>
                  <a href={`mailto:${selectedBooking.customerEmail}`}>
                    <Button variant="outline" size="sm">
                      <Mail className="h-4 w-4 mr-1" />
                      Email
                    </Button>
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => checkPaymentStatusMutation.mutate(selectedBooking.id)}
                    disabled={checkPaymentStatusMutation.isPending}
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${checkPaymentStatusMutation.isPending ? 'animate-spin' : ''}`} />
                    Check Payment
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setChargesBooking(selectedBooking);
                      setIsChargesDialogOpen(true);
                    }}
                  >
                    <DollarSign className="h-4 w-4 mr-1" />
                    Add Charges
                  </Button>
                </div>

                {/* Booking Info Cards */}
                <div className="space-y-4">
                  <div className="border rounded-md p-4">
                    <h3 className="text-sm font-medium flex items-center mb-3">
                      <User className="mr-2 h-4 w-4 text-gray-500" />
                      Customer
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p className="font-medium">{selectedBooking.customerName}</p>
                      <p className="text-gray-500">{selectedBooking.customerEmail}</p>
                      <p className="text-gray-500">{selectedBooking.customerPhone}</p>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h3 className="text-sm font-medium flex items-center mb-3">
                      <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                      Delivery Location
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p>{selectedBooking.deliveryAddress}</p>
                      <p>{selectedBooking.deliveryCity}, {selectedBooking.deliveryZipCode}</p>
                      {selectedBooking.deliveryInstructions && (
                        <p className="text-gray-500 italic">{selectedBooking.deliveryInstructions}</p>
                      )}
                      <p className="text-gray-500">Placement: {selectedBooking.placementLocation}</p>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h3 className="text-sm font-medium flex items-center mb-3">
                      <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                      Schedule
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Delivery</p>
                        <p className="font-medium">{formatDate(selectedBooking.deliveryDate)}</p>
                        <p className="text-xs text-gray-500">{selectedBooking.deliveryTimePreference}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Pickup (Est.)</p>
                        <p className="font-medium">{getPickupDate(selectedBooking.deliveryDate, selectedBooking.pricingId)}</p>
                        <p className="text-xs text-gray-500">{getDurationDays(selectedBooking.pricingId)} day rental</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h3 className="text-sm font-medium flex items-center mb-3">
                      <DollarSign className="mr-2 h-4 w-4 text-gray-500" />
                      Payment
                    </h3>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold">${(selectedBooking.totalPrice / 100).toFixed(2)}</span>
                      <Badge className={selectedBooking.paymentStatus === 'paid' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}>
                        {selectedBooking.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* Delete Confirmation Dialog */}
        {bookingToDelete && (
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Booking</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete booking #{bookingToDelete.id}?
                  This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <div className="space-y-2">
                  <p><strong>Customer:</strong> {bookingToDelete.customerName}</p>
                  <p><strong>Email:</strong> {bookingToDelete.customerEmail}</p>
                  <p><strong>Delivery Date:</strong> {formatDate(bookingToDelete.deliveryDate)}</p>
                  <p><strong>Status:</strong> {getStatusBadge(bookingToDelete.status)}</p>
                  <p><strong>Total:</strong> ${(bookingToDelete.totalPrice / 100).toFixed(2)}</p>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDeleteDialogOpen(false)}
                  disabled={deleteBookingMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmDeleteBooking}
                  disabled={deleteBookingMutation.isPending}
                >
                  {deleteBookingMutation.isPending ? "Deleting..." : "Delete Booking"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Bulk Delete Confirmation Dialog */}
        <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Multiple Bookings</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedBookings.size} booking{selectedBookings.size !== 1 ? 's' : ''}?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                This will permanently remove the selected bookings from the system.
              </p>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsBulkDeleteDialogOpen(false)}
                disabled={bulkDeleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmBulkDelete}
                disabled={bulkDeleteMutation.isPending}
              >
                {bulkDeleteMutation.isPending ? "Deleting..." : `Delete ${selectedBookings.size} Booking${selectedBookings.size !== 1 ? 's' : ''}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Tabs defaultValue="list" className="w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <TabsList className="w-full md:w-auto grid grid-cols-3 gap-1 p-1">
              <TabsTrigger value="list" className="flex items-center justify-center px-2 py-2 text-xs md:text-sm">
                <List className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">List View</span>
                <span className="sm:hidden">List</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center justify-center px-2 py-2 text-xs md:text-sm">
                <Calendar className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Calendar View</span>
                <span className="sm:hidden">Calendar</span>
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center justify-center px-2 py-2 text-xs md:text-sm">
                <MapPin className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Delivery Map</span>
                <span className="sm:hidden">Map</span>
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <span className="text-sm whitespace-nowrap">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">ID</SelectItem>
                  <SelectItem value="deliveryDate">Delivery Date</SelectItem>
                  <SelectItem value="createdAt">Booking Date</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline" 
                size="icon" 
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                title={sortOrder === "asc" ? "Ascending" : "Descending"}
              >
                {sortOrder === "asc" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/><path d="M11 12h10"/><path d="M11 16h7"/><path d="M11 20h4"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="M11 12h10"/><path d="M11 16h7"/><path d="M11 20h4"/></svg>
                )}
              </Button>
            </div>
          </div>
          
          <TabsContent value="calendar" className="mt-6">
            {isLoadingBookings || !bookings || !dumpsters || !durations || !allPricing ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <BookingCalendar 
                bookings={bookings} 
                dumpsters={dumpsters} 
                durations={durations}
                allPricing={allPricing}
              />
            )}
          </TabsContent>
          
          <TabsContent value="list" className="mt-6">
            {/* Bulk Actions Toolbar */}
            {selectedBookings.size > 0 && (
              <Card className="mb-4 border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {selectedBookings.size} booking{selectedBookings.size !== 1 ? 's' : ''} selected
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedBookings(new Set())}
                      >
                        Clear Selection
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Select onValueChange={handleBulkStatusChange}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Change Status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOrder.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              <span className="flex items-center gap-2">
                                {status.step > 0 && (
                                  <span className="flex-shrink-0 w-4 h-4 bg-gray-200 text-gray-700 rounded-full text-xs flex items-center justify-center font-medium">
                                    {status.step}
                                  </span>
                                )}
                                <span>{status.label}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={handleBulkDelete}
                        disabled={bulkDeleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete Selected
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mobile Card View */}
            {isMobileView ? (
              <div className="space-y-3">
                {sortedAndFilteredBookings.length === 0 ? (
                  <Card className="p-8 text-center text-gray-500">
                    No bookings found
                  </Card>
                ) : (
                  sortedAndFilteredBookings.map((booking) => {
                    const timePending = getTimePending(booking.createdAt);
                    return (
                      <Card 
                        key={booking.id} 
                        className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
                          selectedBookings.has(booking.id) ? 'ring-2 ring-[#f7c948]' : ''
                        }`}
                        onClick={() => handleViewBooking(booking)}
                        data-testid={`booking-card-${booking.id}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedBookings.has(booking.id)}
                              onCheckedChange={(checked) => {
                                handleSelectBooking(booking.id, checked as boolean);
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div>
                              <p className="font-medium">{booking.customerName}</p>
                              <p className="text-xs text-gray-500">#{booking.id}</p>
                            </div>
                          </div>
                          {getStatusBadge(booking.status)}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          <div>
                            <p className="text-gray-500 text-xs">Dumpster</p>
                            <p className="font-medium">{getDumpsterName(booking.dumpsterId)?.replace('Yard Dumpster', 'yd')}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Delivery</p>
                            <p className="font-medium">{formatDate(booking.deliveryDate)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Location</p>
                            <p className="font-medium truncate">{booking.deliveryZipCode}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Total</p>
                            <p className="font-medium">${(booking.totalPrice / 100).toFixed(2)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            timePending.isUrgent && booking.status === 'pending'
                              ? 'bg-amber-100 text-amber-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            <Clock className="h-3 w-3 inline mr-1" />
                            {timePending.text}
                          </span>
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <a href={`tel:${booking.customerPhone}`}>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <Phone className="h-4 w-4" />
                              </Button>
                            </a>
                            <Button 
                              size="sm" 
                              className="bg-[#f7c948] hover:bg-[#f7c948]/90 text-black h-8 w-8 p-0"
                              onClick={() => {
                                const address = `${booking.deliveryAddress}, ${booking.deliveryCity}, ${booking.deliveryZipCode}`;
                                const mapsUrl = `https://maps.google.com/maps?daddr=${encodeURIComponent(address)}`;
                                window.open(mapsUrl, '_blank');
                              }}
                            >
                              <MapPin className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            ) : (
            /* Desktop Table View */
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {statusFilter === 'all' ? 'All Bookings' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Bookings`}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="rounded-md border max-h-[600px] overflow-auto">
                  <Table className="w-full">
                    <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                      <TableRow>
                        <TableHead className="w-8">
                          <Checkbox
                            checked={selectedBookings.size === sortedAndFilteredBookings.length && sortedAndFilteredBookings.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead 
                          className="w-12 cursor-pointer hover:text-primary"
                          onClick={() => {
                            if (sortBy === "id") {
                              setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                            } else {
                              setSortBy("id");
                              setSortOrder("asc");
                            }
                          }}
                        >
                          <div className="flex items-center">
                            ID
                            {sortBy === "id" && (
                              <span className="ml-1">
                                {sortOrder === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="min-w-[100px]">Customer</TableHead>
                        <TableHead className="hidden lg:table-cell w-16">Size</TableHead>
                        <TableHead 
                          className="w-20 cursor-pointer hover:text-primary"
                          onClick={() => {
                            if (sortBy === "deliveryDate") {
                              setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                            } else {
                              setSortBy("deliveryDate");
                              setSortOrder("asc");
                            }
                          }}
                        >
                          <div className="flex items-center">
                            Date
                            {sortBy === "deliveryDate" && (
                              <span className="ml-1">
                                {sortOrder === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="hidden xl:table-cell w-24">Location</TableHead>
                        <TableHead className="w-20">Status</TableHead>
                        <TableHead className="hidden md:table-cell w-16">Total</TableHead>
                        <TableHead className="w-12">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedAndFilteredBookings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8">
                            <p className="text-muted-foreground">No bookings found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        sortedAndFilteredBookings.map((booking) => (
                          <React.Fragment key={booking.id}>
                            <TableRow 
                              className="md:hover:bg-gray-50 cursor-pointer md:cursor-default"
                              onClick={() => {
                                // Open view modal on mobile
                                if (window.innerWidth < 768) {
                                  handleViewBooking(booking);
                                }
                              }}
                            >
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={selectedBookings.has(booking.id)}
                                  onCheckedChange={(checked) => handleSelectBooking(booking.id, checked as boolean)}
                                />
                              </TableCell>
                              <TableCell className="text-xs">{booking.id}</TableCell>
                              <TableCell className="text-xs">{booking.customerName}</TableCell>
                              <TableCell className="hidden lg:table-cell text-xs">{getDumpsterName(booking.dumpsterId)?.replace('Yard Dumpster', 'yd') || 'N/A'}</TableCell>
                              <TableCell className="text-xs">{formatDate(booking.deliveryDate)}</TableCell>
                              <TableCell className="hidden xl:table-cell text-xs">{booking.deliveryZipCode}</TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                {/* Mobile: Status dropdown */}
                                <div className="md:hidden">
                                  <Select 
                                    value={booking.status} 
                                    onValueChange={(value) => handleStatusChange(booking.id, value)}
                                  >
                                    <SelectTrigger className="w-auto h-auto border-none p-0 shadow-none bg-transparent focus:ring-0">
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
                                
                                {/* Desktop: Status dropdown */}
                                <div className="hidden md:block">
                                  <Select 
                                    value={booking.status} 
                                    onValueChange={(value) => handleStatusChange(booking.id, value)}
                                  >
                                    <SelectTrigger className="w-24 h-7 text-xs">
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
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-xs">${(booking.totalPrice / 100).toFixed(2)}</TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <div className="flex gap-1">
                                  {/* Desktop: Show view, payment check, and map buttons */}
                                  <div className="hidden md:flex gap-1">
                                    <Button 
                                      onClick={() => handleViewBooking(booking)}
                                      variant="outline"
                                      className="h-6 w-6 p-0"
                                      size="sm"
                                      title="View Details"
                                    >
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                    <Button 
                                      onClick={() => checkPaymentStatusMutation.mutate(booking.id)}
                                      variant="outline"
                                      className="h-6 w-6 p-0"
                                      size="sm"
                                      disabled={checkPaymentStatusMutation.isPending}
                                      title="Check Payment Status"
                                    >
                                      <RefreshCw className={`h-3 w-3 ${checkPaymentStatusMutation.isPending ? 'animate-spin' : ''}`} />
                                    </Button>
                                    <Button 
                                      onClick={() => {
                                        const address = `${booking.deliveryAddress}, ${booking.deliveryCity}, ${booking.deliveryZipCode}`;
                                        const mapsUrl = `https://maps.google.com/maps?daddr=${encodeURIComponent(address)}`;
                                        window.open(mapsUrl, '_blank');
                                      }}
                                      className="bg-[#f7c948] hover:bg-[#f7c948]/90 text-black h-6 w-6 p-0"
                                      size="sm"
                                      title="Navigate"
                                    >
                                      <MapPin className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  
                                  {/* Mobile: Show only map button */}
                                  <div className="md:hidden">
                                    <Button 
                                      onClick={() => {
                                        const address = `${booking.deliveryAddress}, ${booking.deliveryCity}, ${booking.deliveryZipCode}`;
                                        const mapsUrl = `https://maps.google.com/maps?daddr=${encodeURIComponent(address)}`;
                                        window.open(mapsUrl, '_blank');
                                      }}
                                      className="bg-[#f7c948] hover:bg-[#f7c948]/90 text-black h-6 w-6 p-0"
                                      size="sm"
                                    >
                                      <MapPin className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          </React.Fragment>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
            )}
          </TabsContent>

          <TabsContent value="map" className="mt-4">
            <DeliveryMap bookings={sortedAndFilteredBookings} dumpsters={dumpsters || []} />
          </TabsContent>
        </Tabs>

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
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="hub-option"
                        name="dropoff-type"
                        value="hub"
                        checked={selectedDropOffType === "hub"}
                        onChange={(e) => setSelectedDropOffType(e.target.value)}
                        className="w-4 h-4 text-[#f7c948] border-gray-300"
                      />
                      <Label htmlFor="hub-option" className="flex items-center cursor-pointer">
                        <Building2 className="mr-2 h-4 w-4" />
                        Return to Hub
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="customer-option"
                        name="dropoff-type"
                        value="customer"
                        checked={selectedDropOffType === "customer"}
                        onChange={(e) => setSelectedDropOffType(e.target.value)}
                        className="w-4 h-4 text-[#f7c948] border-gray-300"
                      />
                      <Label htmlFor="customer-option" className="flex items-center cursor-pointer">
                        <Users className="mr-2 h-4 w-4" />
                        Direct Transfer to Another Customer
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Hub Selection */}
                {selectedDropOffType === "hub" && (
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Select Hub</Label>
                    <Select value={selectedHubId} onValueChange={setSelectedHubId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a hub location" />
                      </SelectTrigger>
                      <SelectContent>
                        {hubs?.map((hub) => (
                          <SelectItem key={hub.id} value={hub.id.toString()}>
                            <div className="flex items-center">
                              <Building2 className="mr-2 h-4 w-4" />
                              {hub.name} - {hub.address}, {hub.city}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Customer Transfer Selection */}
                {selectedDropOffType === "customer" && (
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Select Customer for Direct Transfer</Label>
                    <Select value={selectedCustomerBookingId} onValueChange={setSelectedCustomerBookingId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a customer booking for delivery" />
                      </SelectTrigger>
                      <SelectContent>
                        {bookings?.filter(b => 
                          b.status === "confirmed" && 
                          b.id !== bookingToComplete.id &&
                          b.dumpsterId === bookingToComplete.dumpsterId
                        ).map((booking) => (
                          <SelectItem key={booking.id} value={booking.id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{booking.customerName}</span>
                              <span className="text-sm text-gray-500">
                                {booking.deliveryAddress}, {booking.deliveryCity} - {formatDate(booking.deliveryDate)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedDropOffType === "customer" && bookings?.filter(b => 
                      b.status === "confirmed" && 
                      b.id !== bookingToComplete.id &&
                      b.dumpsterId === bookingToComplete.dumpsterId
                    ).length === 0 && (
                      <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
                        No compatible customer bookings available for direct transfer. 
                        Consider returning to hub instead.
                      </p>
                    )}
                  </div>
                )}

                {/* Efficiency Note */}
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
        {chargesBooking && isChargesDialogOpen && (
          <Dialog open={isChargesDialogOpen} onOpenChange={(open) => {
            if (!open) {
              setIsChargesDialogOpen(false);
              setChargesBooking(null);
            }
          }}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Additional Charges - Booking #{chargesBooking.id}</DialogTitle>
              </DialogHeader>
              <AdditionalCharges
                bookingId={chargesBooking.id}
                customerName={chargesBooking.customerName}
                customerEmail={chargesBooking.customerEmail}
                customerPhone={chargesBooking.customerPhone}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminLayout>
  );
}