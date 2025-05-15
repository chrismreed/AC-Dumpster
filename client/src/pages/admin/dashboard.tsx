import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/ui/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [dumpsterDistribution, setDumpsterDistribution] = useState<any[]>([]);

  // Fetch bookings
  const { data: bookings, isLoading: isLoadingBookings } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  // Fetch dumpsters
  const { data: dumpsters, isLoading: isLoadingDumpsters } = useQuery<Dumpster[]>({
    queryKey: ["/api/dumpsters"],
  });

  useEffect(() => {
    // Always run this effect, with proper conditional checks inside
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

    // Only process booking data if it exists
    if (bookings && dumpsters) {
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

      setRevenueData(revenueChartData);

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

      setDumpsterDistribution(dumpsterDistributionData);
    } else {
      // Set default data when bookings/dumpsters aren't available
      setRevenueData(Object.entries(revenueByDay).map(([date, amount]) => ({ date, amount: 0 })));
      setDumpsterDistribution([]);
    }
  }, [bookings, dumpsters]);

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  if (isLoadingBookings || isLoadingDumpsters) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  // Calculate summary statistics
  const totalBookings = bookings?.length || 0;
  const activeBookings = bookings?.filter(b => b.status === 'scheduled').length || 0;
  const totalRevenue = bookings?.reduce((sum, booking) => sum + booking.totalPrice, 0) || 0;
  const serviceZoneCount = new Set(bookings?.map(b => b.serviceZoneId)).size || 0;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500">Overview of your dumpster rental business</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <CalendarDays className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                <h3 className="text-2xl font-bold">{totalBookings}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-full">
                <Truck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Active Deliveries</p>
                <h3 className="text-2xl font-bold">{activeBookings}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="bg-amber-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <h3 className="text-2xl font-bold">${(totalRevenue / 100).toFixed(2)}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Service Zones</p>
                <h3 className="text-2xl font-bold">{serviceZoneCount}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Revenue (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={revenueData || []}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
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
                    <Bar dataKey="amount" fill="#2563EB" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dumpster Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dumpsterDistribution || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name || 'Unknown'} (${((percent || 0) * 100).toFixed(0)}%)`}
                      outerRadius={80}
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
                              status === 'scheduled' ? 'bg-green-100 text-green-800' : 
                              status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                              'bg-gray-100 text-gray-800'
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
      </div>
    </AdminLayout>
  );
}
