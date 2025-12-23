import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Truck, LogOut, Calendar, MapPin, Package, 
  AlertTriangle, CheckCircle2, Clock, ArrowRight,
  CreditCard, RefreshCw, Download, Receipt
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface CustomerData {
  id: number;
  email: string;
  companyName: string | null;
  isBusinessAccount: boolean;
}

interface EnrichedBooking {
  id: number;
  customerName: string;
  customerEmail: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryDate: string;
  status: string;
  totalPrice: number;
  dumpsterName: string;
  dumpsterDimensions: string;
  rentalDays: number;
}

interface SwapRequest {
  id: number;
  bookingId: number;
  requestType: string;
  status: string;
  notes: string | null;
  adminNotes: string | null;
  createdAt: string;
  feeAmount: number | null;
  paymentStatus: string | null;
  stripePaymentLinkUrl: string | null;
  receiptUrl: string | null;
}

interface CustomerCredits {
  credits: Array<{
    id: number;
    amount: number;
    type: string;
    description: string;
  }>;
  totalCredit: number;
}

export default function CustomerDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedBooking, setSelectedBooking] = useState<EnrichedBooking | null>(null);
  const [requestType, setRequestType] = useState<string>("");
  const [requestNotes, setRequestNotes] = useState("");
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);

  const { data: customer, isLoading: loadingCustomer, error: customerError } = useQuery<CustomerData>({
    queryKey: ["/api/customer/me"],
  });

  const { data: bookings, isLoading: loadingBookings } = useQuery<EnrichedBooking[]>({
    queryKey: ["/api/customer/bookings"],
    enabled: !!customer,
  });

  const { data: swapRequests } = useQuery<SwapRequest[]>({
    queryKey: ["/api/customer/swap-requests"],
    enabled: !!customer,
  });

  const { data: creditsData } = useQuery<CustomerCredits>({
    queryKey: ["/api/customer/credits"],
    enabled: !!customer,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/customer/logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/me"] });
      setLocation("/customer/login");
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: { bookingId: number; requestType: string; notes: string }) => {
      const response = await apiRequest("POST", "/api/customer/swap-request", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create request");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Request Submitted",
        description: "Your request has been sent. We'll contact you shortly.",
      });
      setIsRequestDialogOpen(false);
      setSelectedBooking(null);
      setRequestType("");
      setRequestNotes("");
      queryClient.invalidateQueries({ queryKey: ["/api/customer/swap-requests"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Request Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (customerError) {
      setLocation("/customer/login");
    }
  }, [customerError, setLocation]);

  if (loadingCustomer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f7c948]"></div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  const activeBookings = bookings?.filter(b => 
    ['pending', 'confirmed', 'delivered'].includes(b.status)
  ) || [];

  const completedBookings = bookings?.filter(b => 
    ['picked_up', 'complete'].includes(b.status)
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'picked_up': return 'bg-purple-100 text-purple-800';
      case 'complete': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'delivered': return 'At Your Location';
      case 'picked_up': return 'Picked Up';
      case 'complete': return 'Complete';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const openRequestDialog = (booking: EnrichedBooking, type: string) => {
    setSelectedBooking(booking);
    setRequestType(type);
    setIsRequestDialogOpen(true);
  };

  const handleSubmitRequest = () => {
    if (!selectedBooking || !requestType) return;
    
    createRequestMutation.mutate({
      bookingId: selectedBooking.id,
      requestType,
      notes: requestNotes,
    });
  };

  const getBookingPendingRequests = (bookingId: number) => {
    return swapRequests?.filter(r => r.bookingId === bookingId && r.status === 'pending') || [];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#f7c948]/10 rounded-lg">
              <Truck className="h-6 w-6 text-[#f7c948]" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Customer Portal</h1>
              <p className="text-sm text-gray-500">{customer.companyName || customer.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {creditsData && creditsData.totalCredit > 0 && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">
                    You have {formatPrice(creditsData.totalCredit)} in available credits
                  </p>
                  <p className="text-sm text-green-600">
                    Credits will be automatically applied to your next rental
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {swapRequests && swapRequests.filter(r => r.status === 'awaiting_payment' && r.stripePaymentLinkUrl).length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Outstanding Invoices
            </h2>
            <div className="grid gap-4">
              {swapRequests
                .filter(r => r.status === 'awaiting_payment' && r.stripePaymentLinkUrl)
                .map((request) => {
                  const booking = bookings?.find(b => b.id === request.bookingId);
                  const getRequestTypeLabel = (type: string) => {
                    switch (type) {
                      case 'swap': return 'Dumpster Swap';
                      case 'pickup': return 'Early Pickup';
                      case 'early_complete': return 'Early Completion';
                      default: return type;
                    }
                  };
                  return (
                    <Card 
                      key={request.id} 
                      className="border-orange-200 bg-orange-50"
                      data-testid={`card-invoice-${request.id}`}
                    >
                      <CardContent className="py-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <p className="font-medium text-orange-800">
                              {getRequestTypeLabel(request.requestType)} Fee
                            </p>
                            <p className="text-sm text-orange-600">
                              Booking #{request.bookingId}
                              {booking && ` - ${booking.dumpsterName}`}
                            </p>
                            {request.adminNotes && (
                              <p className="text-sm text-gray-600 mt-1">
                                Note: {request.adminNotes}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-lg text-orange-800">
                              {request.feeAmount ? formatPrice(request.feeAmount) : 'View Details'}
                            </span>
                            <Button
                              className="bg-[#f7c948] text-black hover:bg-[#f7c948]/90"
                              onClick={() => window.open(request.stripePaymentLinkUrl!, '_blank')}
                              data-testid={`button-pay-${request.id}`}
                            >
                              Pay Now
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </div>
        )}

        {swapRequests && swapRequests.filter(r => r.paymentStatus === 'paid' && r.receiptUrl).length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-green-500" />
              Payment Receipts
            </h2>
            <div className="grid gap-4">
              {swapRequests
                .filter(r => r.paymentStatus === 'paid' && r.receiptUrl)
                .map((request) => {
                  const booking = bookings?.find(b => b.id === request.bookingId);
                  const getRequestTypeLabel = (type: string) => {
                    switch (type) {
                      case 'swap': return 'Dumpster Swap';
                      case 'pickup': return 'Early Pickup';
                      case 'early_complete': return 'Early Completion';
                      default: return type;
                    }
                  };
                  return (
                    <Card 
                      key={request.id} 
                      className="border-green-200 bg-green-50"
                      data-testid={`card-receipt-${request.id}`}
                    >
                      <CardContent className="py-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <p className="font-medium text-green-800">
                              {getRequestTypeLabel(request.requestType)} - Paid
                            </p>
                            <p className="text-sm text-green-600">
                              Booking #{request.bookingId}
                              {booking && ` - ${booking.dumpsterName}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-lg text-green-800">
                              {request.feeAmount ? formatPrice(request.feeAmount) : ''}
                            </span>
                            <Button
                              variant="outline"
                              className="border-green-500 text-green-700 hover:bg-green-100"
                              onClick={() => window.open(request.receiptUrl!, '_blank')}
                              data-testid={`button-receipt-${request.id}`}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download Receipt
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-[#f7c948]" />
            Active Rentals
          </h2>
          
          {loadingBookings ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f7c948]"></div>
            </div>
          ) : activeBookings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Truck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No active rentals</p>
                <Button
                  className="mt-4 bg-[#f7c948] text-black hover:bg-[#f7c948]/90"
                  onClick={() => setLocation("/")}
                  data-testid="button-book-new"
                >
                  Book a Dumpster
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {activeBookings.map((booking) => {
                const pendingRequests = getBookingPendingRequests(booking.id);
                return (
                  <Card key={booking.id} className="overflow-hidden" data-testid={`card-booking-${booking.id}`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-lg">{booking.dumpsterName}</h3>
                            <Badge className={getStatusColor(booking.status)}>
                              {getStatusLabel(booking.status)}
                            </Badge>
                          </div>
                          
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{booking.deliveryAddress}, {booking.deliveryCity}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>Delivered: {formatDate(booking.deliveryDate)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{booking.rentalDays}-day rental</span>
                            </div>
                          </div>

                          {pendingRequests.length > 0 && (
                            <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                              <div className="flex items-center gap-2 text-yellow-800">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                  {pendingRequests.length} pending request(s)
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 md:items-end">
                          <p className="font-bold text-lg">{formatPrice(booking.totalPrice)}</p>
                          
                          {booking.status === 'delivered' && pendingRequests.length === 0 && (
                            <div className="flex flex-col gap-2 mt-2">
                              <Button
                                variant="outline"
                                className="border-[#f7c948] text-[#f7c948] hover:bg-[#f7c948]/10"
                                onClick={() => openRequestDialog(booking, 'swap')}
                                data-testid={`button-swap-${booking.id}`}
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Dumpster Full - Request Swap
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => openRequestDialog(booking, 'early_complete')}
                                data-testid={`button-complete-${booking.id}`}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Job Complete - Request Pickup
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {completedBookings.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-gray-400" />
              Past Rentals
            </h2>
            <div className="grid gap-4">
              {completedBookings.map((booking) => (
                <Card key={booking.id} className="opacity-75" data-testid={`card-past-booking-${booking.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{booking.dumpsterName}</h3>
                        <p className="text-sm text-gray-500">
                          {booking.deliveryAddress} • {formatDate(booking.deliveryDate)}
                        </p>
                      </div>
                      <Badge className={getStatusColor(booking.status)}>
                        {getStatusLabel(booking.status)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {requestType === 'swap' ? 'Request Dumpster Swap' : 'Request Pickup'}
            </DialogTitle>
            <DialogDescription>
              {requestType === 'swap' 
                ? "We'll pick up your full dumpster and deliver an empty one."
                : "We'll pick up your dumpster and complete your rental."
              }
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="py-4 space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedBooking.dumpsterName}</p>
                <p className="text-sm text-gray-500">{selectedBooking.deliveryAddress}</p>
              </div>

              {requestType === 'early_complete' && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    Finishing early? You may be eligible for a credit on your next rental.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Additional Notes (optional)</Label>
                <Textarea
                  placeholder="Any special instructions or notes..."
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  data-testid="textarea-notes"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRequestDialogOpen(false)}
              data-testid="button-cancel-request"
            >
              Cancel
            </Button>
            <Button
              className="bg-[#f7c948] text-black hover:bg-[#f7c948]/90"
              onClick={handleSubmitRequest}
              disabled={createRequestMutation.isPending}
              data-testid="button-submit-request"
            >
              {createRequestMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
