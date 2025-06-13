import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DollarSign, CreditCard, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PaymentPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch payment link details
  const { data: paymentLink, isLoading, error } = useQuery({
    queryKey: [`/api/payment-links/${id}`],
    enabled: !!id,
  });

  const handlePayment = async () => {
    if (!paymentLink?.stripePaymentLinkId) {
      toast({
        title: "Error",
        description: "Payment link not available",
        variant: "destructive",
      });
      return;
    }

    try {
      // Redirect to Stripe payment link
      const response = await fetch(`https://api.stripe.com/v1/payment_links/${paymentLink.stripePaymentLinkId}`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_STRIPE_PUBLIC_KEY}`,
        },
      });

      if (response.ok) {
        const stripePaymentLink = await response.json();
        window.location.href = stripePaymentLink.url;
      } else {
        // Fallback: try to process payment through our backend
        const backendResponse = await fetch(`/api/payment-links/${id}/process`);
        if (backendResponse.ok) {
          const data = await backendResponse.json();
          if (data.url) {
            window.location.href = data.url;
          }
        } else {
          throw new Error('Payment processing failed');
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: "Unable to process payment. Please contact support.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !paymentLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Payment Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              This payment link is invalid or has expired.
            </p>
            <Button onClick={() => setLocation("/")} variant="outline">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = paymentLink.status === 'expired';
  const isPaid = paymentLink.status === 'paid';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <DollarSign className="h-6 w-6" />
              Payment Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Payment Status */}
            <div className="text-center">
              <Badge 
                variant={isPaid ? "default" : isExpired ? "destructive" : "secondary"}
                className="text-sm"
              >
                {paymentLink.status}
              </Badge>
            </div>

            {/* Amount */}
            <div className="text-center">
              <p className="text-3xl font-bold">
                ${(paymentLink.totalAmount / 100).toFixed(2)}
              </p>
              <p className="text-muted-foreground mt-2">
                Additional charges for your dumpster rental
              </p>
            </div>

            <Separator />

            {/* Booking Details */}
            <div className="space-y-3">
              <h3 className="font-semibold">Payment Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Booking ID:</span>
                  <span>#{paymentLink.bookingId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium">${(paymentLink.totalAmount / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(paymentLink.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Payment Action */}
            <div className="space-y-4">
              {isPaid ? (
                <div className="text-center space-y-3">
                  <p className="text-green-600 font-medium">Payment Completed</p>
                  <p className="text-sm text-muted-foreground">
                    This payment has already been processed.
                  </p>
                </div>
              ) : isExpired ? (
                <div className="text-center space-y-3">
                  <p className="text-red-600 font-medium">Payment Link Expired</p>
                  <p className="text-sm text-muted-foreground">
                    Please contact us for a new payment link.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button 
                    onClick={handlePayment}
                    className="w-full"
                    size="lg"
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Pay Now
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Secure payment processed by Stripe
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center pt-4">
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/")}
                className="text-sm"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit Our Website
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}