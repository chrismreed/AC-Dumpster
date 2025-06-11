import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/ui/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Booking, Dumpster } from "@shared/schema";
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
  Loader2
} from "lucide-react";

export default function DashboardPage() {
  // Always initialize state hooks first - never conditionally
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [dumpsterDistribution, setDumpsterDistribution] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
  const activeBookings = bookings?.filter(b => b.status === 'scheduled').length || 0;
  const totalRevenue = bookings?.reduce((sum, booking) => sum + booking.totalPrice, 0) || 0;
  const serviceZoneCount = new Set(bookings?.map(b => b.serviceZoneId)).size || 0;

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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500 text-sm sm:text-base">Overview of your dumpster rental business</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card>
            <CardContent className="p-4 sm:p-6 flex items-center space-x-3 sm:space-x-4">
              <div className="bg-gray-100 p-2 sm:p-3 rounded-full flex-shrink-0">
                <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Total Bookings</p>
                <h3 className="text-xl sm:text-2xl font-bold">{totalBookings}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 sm:p-6 flex items-center space-x-3 sm:space-x-4">
              <div className="bg-gray-100 p-2 sm:p-3 rounded-full flex-shrink-0">
                <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Active Deliveries</p>
                <h3 className="text-xl sm:text-2xl font-bold">{activeBookings}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 sm:p-6 flex items-center space-x-3 sm:space-x-4">
              <div className="bg-yellow-100 p-2 sm:p-3 rounded-full flex-shrink-0">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Total Revenue</p>
                <h3 className="text-lg sm:text-2xl font-bold">${(totalRevenue / 100).toFixed(2)}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 sm:p-6 flex items-center space-x-3 sm:space-x-4">
              <div className="bg-gray-100 p-2 sm:p-3 rounded-full flex-shrink-0">
                <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Service Zones</p>
                <h3 className="text-xl sm:text-2xl font-bold">{serviceZoneCount}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

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
              
              <TabsContent value="today" className="space-y-4 mt-4">
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
                    if (deliveryDate.getTime() === today.getTime() && ['pending', 'confirmed', 'delivered'].includes(booking.status)) {
                      return true;
                    }
                    
                    // Check if pickup is today (delivery date + rental duration)
                    const pricing = allPricing.find(p => p.id === booking.pricingId);
                    const rentalDays = pricing?.days || 3;
                    const pickupDate = new Date(deliveryDate);
                    pickupDate.setDate(deliveryDate.getDate() + rentalDays);
                    pickupDate.setHours(0, 0, 0, 0);
                    
                    return pickupDate.getTime() === today.getTime() && ['pending', 'confirmed', 'delivered'].includes(booking.status);
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
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-full ${isDelivery ? 'bg-blue-100' : 'bg-green-100'}`}>
                            <Truck className={`h-4 w-4 ${isDelivery ? 'text-blue-600' : 'text-green-600'}`} />
                          </div>
                          <div>
                            <h4 className="font-medium">{booking.customerName}</h4>
                            <p className="text-sm text-gray-600">
                              {dumpster?.name || `Dumpster #${booking.dumpsterId}`}
                            </p>
                            <p className="text-sm text-gray-500">{booking.deliveryAddress}</p>
                            <div className="flex items-center gap-2 mt-2">
                              {getStatusBadge(booking.status)}
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
                        <div className="flex items-center gap-2">
                          <Select 
                            value={booking.status} 
                            onValueChange={(value) => updateBookingStatusMutation.mutate({ bookingId: booking.id, status: value })}
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
                    );
                  });
                })()}
              </TabsContent>
              
              <TabsContent value="coming-up" className="space-y-4 mt-4">
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
                  
                  // Get all bookings and create delivery/pickup tasks
                  bookings?.forEach(booking => {
                    if (!booking.deliveryDate) return;
                    
                    const pricing = allPricing.find(p => p.id === booking.pricingId);
                    const rentalDays = pricing?.days || 3;
                    const deliveryDate = new Date(booking.deliveryDate);
                    deliveryDate.setHours(0, 0, 0, 0);
                    
                    const pickupDate = new Date(deliveryDate);
                    pickupDate.setDate(deliveryDate.getDate() + rentalDays);
                    pickupDate.setHours(0, 0, 0, 0);
                    
                    // Add delivery task if it's today or in the future (for active bookings)
                    if (deliveryDate >= today && ['pending', 'confirmed', 'delivered'].includes(booking.status)) {
                      upcomingTasks.push({
                        id: booking.id,
                        customerName: booking.customerName,
                        dumpsterId: booking.dumpsterId,
                        deliveryAddress: booking.deliveryAddress,
                        taskType: 'delivery',
                        taskDate: deliveryDate,
                        sortDate: deliveryDate.getTime()
                      });
                    }
                    
                    // Add pickup task if it's today or in the future (for active bookings)
                    if (pickupDate >= today && ['pending', 'confirmed', 'delivered'].includes(booking.status)) {
                      upcomingTasks.push({
                        id: booking.id + 1000, // Avoid duplicate keys
                        customerName: booking.customerName,
                        dumpsterId: booking.dumpsterId,
                        deliveryAddress: booking.deliveryAddress,
                        taskType: 'pickup',
                        taskDate: pickupDate,
                        sortDate: pickupDate.getTime()
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
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-full ${isDelivery ? 'bg-blue-100' : 'bg-green-100'}`}>
                            <Truck className={`h-4 w-4 ${isDelivery ? 'text-blue-600' : 'text-green-600'}`} />
                          </div>
                          <div>
                            <h4 className="font-medium">{task.customerName}</h4>
                            <p className="text-sm text-gray-600">
                              {dumpster?.name || `Dumpster #${task.dumpsterId}`}
                            </p>
                            <p className="text-sm text-gray-500">{task.deliveryAddress}</p>
                            <div className="flex items-center gap-2 mt-2">
                              {booking && getStatusBadge(booking.status)}
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
                        <div className="flex items-center gap-2">
                          {booking && (
                            <Select 
                              value={booking.status} 
                              onValueChange={(value) => updateBookingStatusMutation.mutate({ bookingId: booking.id, status: value })}
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
                              status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' : 
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
              <DialogHeader>
                <DialogTitle>Booking Details</DialogTitle>
                <DialogDescription>
                  Booking #{selectedBooking.id}
                </DialogDescription>
                <div className="flex items-center gap-2 mt-3">
                  <span className="font-medium">Status:</span>
                  <Select
                    value={selectedBooking.status}
                    onValueChange={(newStatus) => {
                      updateBookingStatusMutation.mutate({
                        bookingId: selectedBooking.id,
                        status: newStatus
                      });
                    }}
                    disabled={updateBookingStatusMutation.isPending}
                  >
                    <SelectTrigger className="w-32">
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
                </div>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Customer Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Name:</span> {selectedBooking.customerName}</p>
                      <p><span className="font-medium">Email:</span> {selectedBooking.customerEmail}</p>
                      <p><span className="font-medium">Phone:</span> {selectedBooking.customerPhone}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Delivery Information</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Address:</span> {selectedBooking.deliveryAddress}</p>
                      <p><span className="font-medium">City:</span> {selectedBooking.deliveryCity}</p>
                      <p><span className="font-medium">Zip Code:</span> {selectedBooking.deliveryZipCode}</p>
                      <p><span className="font-medium">Date:</span> {new Date(selectedBooking.deliveryDate).toLocaleDateString()}</p>
                      <p><span className="font-medium">Time Preference:</span> {selectedBooking.deliveryTimePreference}</p>
                      <div className="mt-3">
                        <Button 
                          onClick={() => {
                            const address = `${selectedBooking.deliveryAddress}, ${selectedBooking.deliveryCity}, ${selectedBooking.deliveryZipCode}`;
                            const mapsUrl = `https://maps.google.com/maps?daddr=${encodeURIComponent(address)}`;
                            window.open(mapsUrl, '_blank');
                          }}
                          className="bg-[#f7c948] hover:bg-[#f7c948]/90 text-black"
                          size="sm"
                        >
                          Navigate to Address
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dumpster & Pricing Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Dumpster Details</h3>
                    <div className="space-y-2">
                      {(() => {
                        const dumpster = dumpsters?.find(d => d.id === selectedBooking.dumpsterId);
                        const pricing = allPricing.find(p => p.id === selectedBooking.pricingId);
                        return (
                          <>
                            <p><span className="font-medium">Type:</span> {dumpster?.name || 'Unknown'}</p>
                            <p><span className="font-medium">Dimensions:</span> {dumpster?.dimensions || 'N/A'}</p>
                            <p><span className="font-medium">Rental Period:</span> {pricing?.days || 'N/A'} days</p>
                            <p><span className="font-medium">Placement:</span> {selectedBooking.placementLocation}</p>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Payment Information</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Total Price:</span> ${(selectedBooking.totalPrice / 100).toFixed(2)}</p>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Payment Status:</span>
                        <Badge variant={selectedBooking.paymentStatus === 'completed' ? 'default' : 'secondary'}>
                          {selectedBooking.paymentStatus.charAt(0).toUpperCase() + selectedBooking.paymentStatus.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                {selectedBooking.deliveryInstructions && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Delivery Instructions</h3>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedBooking.deliveryInstructions}</p>
                  </div>
                )}
              </div>
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
}
