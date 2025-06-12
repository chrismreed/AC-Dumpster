import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home, Receipt } from "lucide-react";

export default function PaymentSuccess() {
  const [location] = useLocation();
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const bookingId = urlParams.get('booking');

  useEffect(() => {
    // Mark payment as successful for the booking if needed
    if (bookingId) {
      console.log(`Payment successful for booking ${bookingId}`);
    }
  }, [bookingId]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Your payment has been processed successfully.
            {bookingId && ` Your booking #${bookingId} has been updated.`}
          </p>
          
          <div className="space-y-2">
            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full bg-[#f7c948] hover:bg-[#f7c948]/90 text-black"
            >
              <Home className="mr-2 h-4 w-4" />
              Return to Home
            </Button>
            
            {bookingId && (
              <Button 
                variant="outline"
                onClick={() => window.print()}
                className="w-full"
              >
                <Receipt className="mr-2 h-4 w-4" />
                Print Receipt
              </Button>
            )}
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              If you have any questions about your payment or booking, please contact our support team.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}