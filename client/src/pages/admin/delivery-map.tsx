import { useQuery } from "@tanstack/react-query";
import { Booking, Dumpster } from "@shared/schema";
import { AdminLayout } from "@/components/ui/admin-layout";
import { DeliveryMap } from "@/components/admin/maps/delivery-map";
import { Loader2, MapPin } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DeliveryMapPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch bookings and dumpsters data
  const { data: bookings, isLoading: isLoadingBookings } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const { data: dumpsters, isLoading: isLoadingDumpsters } = useQuery<Dumpster[]>({
    queryKey: ["/api/dumpsters"],
  });

  // Filter bookings by status
  const filteredBookings = bookings?.filter((booking) => {
    if (statusFilter === "all") return true;
    return booking.status === statusFilter;
  });

  if (isLoadingBookings || isLoadingDumpsters) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!bookings || !dumpsters) {
    return (
      <AdminLayout>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="mr-2 h-5 w-5" />
              Delivery Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center h-64">
              <p className="text-lg text-muted-foreground">No data available</p>
            </div>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Delivery Locations</h1>
            <p className="text-gray-500">Interactive map of all dumpster delivery locations</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Filter by status:</span>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bookings</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DeliveryMap 
          bookings={filteredBookings || []}
          dumpsters={dumpsters}
        />
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex space-x-4 justify-center">
              <div className="flex items-center">
                <div className="h-4 w-4 rounded-full mr-2" style={{ backgroundColor: "#3B82F6" }}></div>
                <span className="text-sm">Scheduled</span>
              </div>
              <div className="flex items-center">
                <div className="h-4 w-4 rounded-full mr-2" style={{ backgroundColor: "#10B981" }}></div>
                <span className="text-sm">Delivered</span>
              </div>
              <div className="flex items-center">
                <div className="h-4 w-4 rounded-full mr-2" style={{ backgroundColor: "#8B5CF6" }}></div>
                <span className="text-sm">Completed</span>
              </div>
              <div className="flex items-center">
                <div className="h-4 w-4 rounded-full mr-2" style={{ backgroundColor: "#EF4444" }}></div>
                <span className="text-sm">Cancelled</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}