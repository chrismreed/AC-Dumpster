'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

interface BookingDetails {
  id: number;
  customerName: string;
  customerEmail: string;
  deliveryDate: string;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  dumpster?: { id: number; name: string };
  pricing?: { id: number; days: number; price: number };
  serviceZone?: { id: number; name: string; deliveryFee: number };
  selectedAddOns?: Array<{ id: number; name: string; price: number }>;
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bookingId = searchParams.get('booking_id');
  // Stripe appends these to the return_url after confirmPayment()
  const paymentIntentId = searchParams.get('payment_intent');
  const redirectStatus = searchParams.get('redirect_status');

  useEffect(() => {
    const verifyAndFetch = async () => {
      if (!bookingId) {
        setError('Missing booking information');
        setIsLoading(false);
        return;
      }

      try {
        // If Stripe redirected here with a succeeded payment intent, confirm
        // the booking on the server as a safety net (in case webhook is delayed).
        if (paymentIntentId && redirectStatus === 'succeeded') {
          await fetch('/api/confirm-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentIntentId,
              bookingId: Number(bookingId),
            }),
          });
          // Not awaiting the result strictly — if it fails the webhook will
          // handle it. We still proceed to show the booking details.
        }

        // Fetch booking details from the public confirmation endpoint
        const response = await fetch(`/api/booking-confirmation/${bookingId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch booking details');
        }

        const bookingData = await response.json();
        setBooking(bookingData);
      } catch (err) {
        console.error('Error verifying payment:', err);
        setError('Failed to verify payment. Please contact support.');
      } finally {
        setIsLoading(false);
      }
    };

    verifyAndFetch();
  }, [bookingId, paymentIntentId, redirectStatus]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <svg
            className="w-16 h-16 text-red-500 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h1 className="text-2xl font-bold text-foreground mb-2">Payment Verification Failed</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => router.push('/')}>
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-md p-8 max-w-2xl w-full">
        <div className="text-center mb-6">
          <svg
            className="w-20 h-20 text-green-500 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h1 className="text-3xl font-bold text-green-500 mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground">
            Thank you for your booking. Your dumpster rental has been confirmed.
          </p>
        </div>

        {booking && (
          <div className="border-t border-b border-border py-6 my-6 space-y-4">
            {/* Booking Info */}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Booking ID:</span>
              <span className="font-bold text-lg text-foreground">#{booking.id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Customer Name:</span>
              <span className="font-medium text-foreground">{booking.customerName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium text-foreground">{booking.customerEmail}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Delivery Date:</span>
              <span className="font-medium text-foreground">
                {new Date(booking.deliveryDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>

            {/* Price Breakdown */}
            <div className="pt-4 border-t border-border space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Charges</h4>

              {/* Dumpster Rental */}
              {booking.pricing && (
                <div className="flex justify-between items-center">
                  <span className="text-foreground">
                    {booking.dumpster?.name || 'Dumpster Rental'} ({booking.pricing.days} days)
                  </span>
                  <span className="font-medium text-foreground">
                    ${(booking.pricing.price / 100).toFixed(2)}
                  </span>
                </div>
              )}

              {/* Delivery Fee */}
              {booking.serviceZone && booking.serviceZone.deliveryFee > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-foreground">Delivery Fee</span>
                  <span className="font-medium text-foreground">
                    ${(booking.serviceZone.deliveryFee / 100).toFixed(2)}
                  </span>
                </div>
              )}

              {/* Add-ons */}
              {booking.selectedAddOns && booking.selectedAddOns.length > 0 && (
                <>
                  {booking.selectedAddOns.map((addon) => (
                    <div key={addon.id} className="flex justify-between items-center">
                      <span className="text-foreground">{addon.name}</span>
                      <span className="font-medium text-foreground">
                        ${(addon.price / 100).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </>
              )}

              {/* Total */}
              <div className="flex justify-between items-center pt-3 border-t border-border">
                <span className="text-foreground font-semibold text-lg">Total Paid:</span>
                <span className="font-bold text-green-500 text-xl">
                  ${(booking.totalPrice / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-amber-500 mb-2">Check Your Email</h3>
          <p className="text-sm text-amber-400">
            We've sent you an email to set up your account password. Once set up, you can
            log in to track your orders, view job status, and manage your rentals.
          </p>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-400 mb-2">What's Next?</h3>
          <ul className="text-sm text-blue-300 space-y-1">
            <li>✓ Set up your account using the email we just sent</li>
            <li>✓ Our team will contact you to confirm delivery details</li>
            <li>✓ Your dumpster will be delivered on the scheduled date</li>
            <li>✓ Track everything from your account dashboard</li>
          </ul>
        </div>

        <div className="text-center pt-4 mb-4">
          <Button
            variant="ghost"
            onClick={() => window.print()}
            className="text-muted-foreground hover:text-foreground"
          >
            <FileText className="h-4 w-4 mr-2" />
            Print Confirmation
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="flex-1"
          >
            Return to Home
          </Button>
          <Button
            onClick={() => router.push('/booking')}
            className="flex-1"
          >
            Book Another Dumpster
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-md p-8 max-w-md w-full text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
