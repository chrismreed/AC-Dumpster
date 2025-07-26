import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Booking, Dumpster, AddOn, ServiceZone, DumpsterPricing } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, CheckCircle, MapPin, Calendar, Package, Clock, DollarSign, Mail, FileText, Truck, Home } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function BookingConfirmationPage() {
  const [location, setLocation] = useLocation();
  const [bookingId, setBookingId] = useState<number | null>(null);
  
  useEffect(() => {
    // Extract booking ID from URL if present (e.g., /booking-confirmation?id=123)
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id && !isNaN(parseInt(id))) {
      setBookingId(parseInt(id));
    }
  }, []);

  const { data: booking, isLoading: isLoadingBooking } = useQuery<Booking>({
    queryKey: [`/api/bookings/${bookingId}`],
    enabled: !!bookingId,
  });

  const { data: dumpster } = useQuery<Dumpster>({
    queryKey: [`/api/dumpsters/${booking?.dumpsterId}`],
    enabled: !!booking?.dumpsterId,
  });
  
  const { data: pricingOption } = useQuery<DumpsterPricing>({
    queryKey: [`/api/dumpster-pricing/item/${booking?.pricingId}`],
    enabled: !!booking?.pricingId,
  });
  
  const { data: serviceZone } = useQuery<ServiceZone>({
    queryKey: [`/api/zones/${booking?.serviceZoneId}`],
    enabled: !!booking?.serviceZoneId,
  });
  
  const { data: addOns } = useQuery<AddOn[]>({
    queryKey: ["/api/addons"],
    enabled: !!booking?.selectedAddOns,
  });
  
  // Calculate total price in dollars
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };
  
  const getSelectedAddOns = () => {
    if (!booking?.selectedAddOns || !addOns) return [];
    
    let selectedAddOnData: any[] = [];
    
    if (typeof booking.selectedAddOns === 'string') {
      try {
        selectedAddOnData = JSON.parse(booking.selectedAddOns);
      } catch {
        return [];
      }
    } else if (Array.isArray(booking.selectedAddOns)) {
      selectedAddOnData = booking.selectedAddOns;
    }
    
    // selectedAddOns is an array of objects like [{ addonId: 1, quantity: 2 }, { addonId: 4, quantity: 1 }]
    return addOns.filter(addon => 
      selectedAddOnData.some((selected: any) => selected.addonId === addon.id)
    );
  };
  
  // Calculate pickup date based on delivery date and rental duration
  const getPickupDate = () => {
    if (!booking?.deliveryDate || !pricingOption) return null;
    
    const deliveryDate = new Date(booking.deliveryDate);
    const pickupDate = new Date(deliveryDate);
    pickupDate.setDate(deliveryDate.getDate() + pricingOption.days);
    
    return pickupDate;
  };
  
  if (isLoadingBooking) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-lg text-gray-600">Loading your booking details...</p>
        </div>
      </div>
    );
  }
  
  if (!booking || !bookingId) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Booking Not Found</h1>
            <p className="text-gray-600 mb-8">We couldn't find the booking details you're looking for.</p>
            <Button 
              onClick={() => setLocation("/")}
              className="bg-primary hover:bg-primary/90 text-slate-900 font-medium shadow-md hover:shadow-lg transition-all duration-300"
            >
              Return to Homepage
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4 shadow-md">
          <CheckCircle className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Booking Confirmed!</h1>
        <p className="text-gray-600 mt-2">
          Thank you for your booking. We've sent a confirmation email to {booking.customerEmail}.
        </p>
      </div>
      <Card className="mb-8 shadow-xl border-gray-200 rounded-xl overflow-hidden">
        <CardHeader>
          <CardTitle>Booking Details</CardTitle>
          <CardDescription>Reference number: #{booking.id}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium">Dumpster</h3>
                  <p>{dumpster?.name}</p>
                  <p className="text-sm text-gray-500">{dumpster?.dimensions}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium">Rental Duration</h3>
                  <p>{pricingOption?.days} Days</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium">Delivery Date</h3>
                  <p>{formatDate(booking.deliveryDate)}</p>
                  <p className="text-sm text-gray-500">{booking.deliveryTimePreference}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium">Estimated Pickup</h3>
                  <p>{getPickupDate() ? formatDate(getPickupDate()!) : 'Not available'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Badge className="capitalize py-0.5">{booking.status}</Badge>
                <Badge variant="outline" className="py-0.5">
                  {booking.paymentStatus === 'paid' ? 'Paid' : 'Payment Pending'}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Home className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium">Customer</h3>
                  <p>{booking.customerName}</p>
                  <p className="text-sm text-gray-500">{booking.customerEmail}</p>
                  <p className="text-sm text-gray-500">{booking.customerPhone}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium">Delivery Location</h3>
                  <p>{booking.deliveryAddress}</p>
                  <p className="text-sm text-gray-500">
                    {booking.deliveryCity}, {booking.deliveryZipCode}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Placement: </span>
                    {booking.placementLocation}
                  </p>
                  {booking.deliveryInstructions && (
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Instructions: </span>
                      {booking.deliveryInstructions}
                    </p>
                  )}
                </div>
              </div>
              
              {getSelectedAddOns().length > 0 && (
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Add-ons</h3>
                    <ul className="text-sm mt-1 space-y-1">
                      {getSelectedAddOns().map(addon => (
                        <li key={addon.id}>
                          {addon.name} - {formatPrice(addon.price)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="border-t pt-6">
            <h3 className="font-semibold text-lg mb-4">Cost Breakdown</h3>
            <div className="space-y-3">
              {/* Base rental price */}
              <div className="flex justify-between">
                <span className="text-gray-600">
                  {dumpster?.name} ({pricingOption?.days} day rental)
                </span>
                <span>{formatPrice(pricingOption?.price || 0)}</span>
              </div>
              
              {/* Add-ons */}
              {getSelectedAddOns().map(addon => {
                let selectedAddOnData: any[] = [];
                
                if (typeof booking.selectedAddOns === 'string') {
                  try {
                    selectedAddOnData = JSON.parse(booking.selectedAddOns);
                  } catch {
                    selectedAddOnData = [];
                  }
                } else if (Array.isArray(booking.selectedAddOns)) {
                  selectedAddOnData = booking.selectedAddOns;
                }
                
                const quantity = selectedAddOnData.find((selected: any) => selected.addonId === addon.id)?.quantity || 1;
                return (
                  <div key={addon.id} className="flex justify-between">
                    <span className="text-gray-600">
                      {addon.name} {quantity > 1 && `(x${quantity})`}
                    </span>
                    <span>{formatPrice(addon.price * quantity)}</span>
                  </div>
                );
              })}
              
              {/* Delivery fee */}
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Delivery fee ({serviceZone?.name})
                </span>
                <span>{formatPrice(serviceZone?.deliveryFee || 0)}</span>
              </div>
              
              {/* Total */}
              <div className="border-t pt-3 flex justify-between items-center font-semibold text-lg">
                <span>Total Amount</span>
                <span className="text-primary">{formatPrice(booking.totalPrice)}</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4 justify-between border-t pt-6">
          <Button 
            variant="outline" 
            className="flex items-center gap-2 w-full sm:w-auto shadow-sm hover:shadow transition-all duration-300" 
            onClick={() => window.print()}
          >
            <FileText className="h-4 w-4" />
            Print Receipt
          </Button>
          <Button 
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-slate-900 font-medium shadow-md hover:shadow-lg transition-all duration-300"
            onClick={() => setLocation("/")}
          >
            Return to Homepage
          </Button>
        </CardFooter>
      </Card>
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>If you have any questions about your booking, please contact us at</p>
        <p className="font-medium">alleycatdumpsters@gmail.com or (217) 994-2582</p>
      </div>
    </div>
  );
}