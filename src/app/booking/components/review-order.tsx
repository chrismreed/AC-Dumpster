'use client';

import { useState, useEffect } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { usePaymentConfig } from '@/hooks/use-payment-config';
import { SquarePaymentForm } from './square-payment-form';
import {
  Package,
  MapPin,
  Calendar,
  Clock,
  Home,
  FileText,
  User,
  Mail,
  Phone,
  ShoppingCart,
  CreditCard,
  CheckCircle2,
  Loader2
} from 'lucide-react';

// stripePromise is now loaded dynamically via usePaymentConfig hook

// Stripe appearance configuration for dark mode
const stripeAppearance = {
  theme: 'night' as const,
  variables: {
    colorPrimary: '#f7c948',
    colorBackground: '#0f172a',
    colorText: '#f8fafc',
    colorDanger: '#ef4444',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    borderRadius: '8px',
    colorTextPlaceholder: '#64748b',
  },
  rules: {
    '.Input': {
      backgroundColor: '#1e293b',
      border: '1px solid #334155',
      color: '#f8fafc',
    },
    '.Input:focus': {
      border: '2px solid #f7c948',
      boxShadow: '0 0 0 1px #f7c948',
    },
    '.Label': {
      color: '#f8fafc',
    },
    '.Tab': {
      backgroundColor: '#1e293b',
      border: '1px solid #334155',
      color: '#f8fafc',
    },
    '.Tab:hover': {
      backgroundColor: '#334155',
    },
    '.Tab--selected': {
      backgroundColor: '#f7c948',
      color: '#0f172a',
      border: '1px solid #f7c948',
    },
    '.TabIcon--selected': {
      fill: '#0f172a',
    },
    '.Block': {
      backgroundColor: '#1e293b',
      border: '1px solid #334155',
    },
  },
};

interface Dumpster {
  id: number;
  name: string;
  dimensions: string;
  description: string;
  weightLimit: number;
}

interface DumpsterPricing {
  id: number;
  dumpsterId: number;
  days: number;
  price: number;
}

interface Addon {
  id: number;
  name: string;
  description: string;
  price: number;
}

interface ReviewOrderProps {
  bookingData: any;
  onBack: () => void;
  onSubmit: (data: any) => void;
}

// Inner Payment Form Component that uses Stripe Elements
function CheckoutForm({
  bookingId,
  totalAmount,
  onSuccess,
}: {
  bookingId: number;
  totalAmount: number;
  onSuccess: (bookingId: number) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !bookingId) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success?booking_id=${bookingId}`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || 'Payment failed');
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Confirm payment on backend
        await fetch('/api/confirm-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            bookingId: bookingId,
          }),
        });

        // Success! Redirect to confirmation page
        onSuccess(bookingId);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Payment failed');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-card border-2 border-border rounded-xl p-6">
        <h3 className="font-semibold text-lg mb-4 text-foreground flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Payment Information
        </h3>
        <PaymentElement />
      </div>

      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <p className="text-sm text-red-400">{errorMessage}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full px-8 py-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 font-semibold transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Processing Payment...
          </span>
        ) : (
          `Pay $${(totalAmount / 100).toFixed(2)}`
        )}
      </button>
    </form>
  );
}

// Wrapper Component that initializes booking and payment
function PaymentFormWrapper({
  totalAmount,
  bookingData,
  contactInfo,
  onSuccess
}: {
  totalAmount: number;
  bookingData: any;
  contactInfo: any;
  onSuccess: (bookingId: number) => void;
}) {
  const { config, stripePromise, squareReady, loading: configLoading } = usePaymentConfig();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bookingCreated, setBookingCreated] = useState(false);

  useEffect(() => {
    if (configLoading) return;

    const initializePayment = async () => {
      try {
        // Create the booking first (needed for both Stripe and Square)
        const bookingResponse = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...bookingData,
            ...contactInfo,
            totalPrice: totalAmount,
          }),
        });

        if (!bookingResponse.ok) {
          const error = await bookingResponse.json();
          throw new Error(error.details || error.message || 'Failed to create booking');
        }

        const { bookingId: newBookingId } = await bookingResponse.json();
        setBookingId(newBookingId);
        setBookingCreated(true);

        // For Stripe: also create payment intent
        if (config?.provider === 'stripe') {
          const paymentResponse = await fetch('/api/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: totalAmount,
              bookingId: newBookingId,
            }),
          });

          if (!paymentResponse.ok) {
            throw new Error('Failed to create payment intent');
          }

          const { clientSecret } = await paymentResponse.json();
          setClientSecret(clientSecret);
        }
        // For Square: booking is created, Square form handles payment directly
      } catch (error) {
        console.error('Error initializing payment:', error);
        setErrorMessage(error instanceof Error ? error.message : 'Failed to initialize payment');
      }
    };

    initializePayment();
  }, [configLoading]);

  if (errorMessage) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
        <p className="text-sm text-red-400">{errorMessage}</p>
      </div>
    );
  }

  if (config && !config.enabled) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
        <p className="text-sm text-amber-400 font-medium">Online payments are currently disabled.</p>
        <p className="text-xs text-amber-400/80 mt-1">Please contact us to arrange payment for your booking.</p>
      </div>
    );
  }

  // Square payment path
  if (config?.provider === 'square') {
    if (!squareReady) {
      return (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <p className="text-sm text-red-400 font-medium">Square payment system is not fully configured.</p>
          <p className="text-xs text-red-400/80 mt-1">Please check your Square Application ID and Location ID in admin settings.</p>
        </div>
      );
    }

    if (!bookingCreated || !bookingId) {
      return (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground font-medium">Creating booking...</span>
        </div>
      );
    }

    return (
      <SquarePaymentForm
        bookingId={bookingId}
        totalAmount={totalAmount}
        applicationId={config.squareApplicationId}
        locationId={config.squareLocationId}
        environment={config.squareEnvironment as 'sandbox' | 'production'}
        onSuccess={onSuccess}
      />
    );
  }

  // Stripe payment path
  if (configLoading || !clientSecret || !bookingId) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground font-medium">Initializing payment...</span>
      </div>
    );
  }

  if (!stripePromise) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
        <p className="text-sm text-red-400 font-medium">Stripe payment system is not configured.</p>
        <p className="text-xs text-red-400/80 mt-1">Please check your Stripe keys in the admin dashboard.</p>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: stripeAppearance,
      }}
    >
      <CheckoutForm
        bookingId={bookingId}
        totalAmount={totalAmount}
        onSuccess={onSuccess}
      />
    </Elements>
  );
}

export function ReviewOrder({ bookingData, onBack, onSubmit }: ReviewOrderProps) {
  const [dumpster, setDumpster] = useState<Dumpster | null>(null);
  const [pricing, setPricing] = useState<DumpsterPricing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [contactInfo, setContactInfo] = useState({
    customerName: bookingData.customerName || '',
    customerEmail: bookingData.customerEmail || '',
    customerPhone: bookingData.customerPhone || '',
  });
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        // Fetch dumpster details
        if (bookingData.dumpsterId) {
          const dumpsterResponse = await fetch(`/api/dumpsters/${bookingData.dumpsterId}`);
          if (dumpsterResponse.ok) {
            const dumpsterData = await dumpsterResponse.json();
            setDumpster(dumpsterData);
          }
        }

        // Fetch pricing details
        if (bookingData.pricingId) {
          const pricingResponse = await fetch(`/api/dumpster-pricing/${bookingData.dumpsterId}`);
          if (pricingResponse.ok) {
            const pricingData = await pricingResponse.json();
            const selectedPricing = pricingData.find((p: DumpsterPricing) => p.id === bookingData.pricingId);
            setPricing(selectedPricing);
          }
        }
      } catch (error) {
        console.error('Error fetching booking details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingData.dumpsterId, bookingData.pricingId]);

  const calculateTotal = () => {
    let total = pricing?.price || 0;
    // Add-on prices are stored in cents in the database
    const addonTotal = bookingData.selectedAddOns?.reduce((sum: number, addon: Addon) => sum + addon.price, 0) || 0;
    return total + addonTotal;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not selected';
    try {
      return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const handleContinueToPayment = () => {
    // Validate contact information
    if (!contactInfo.customerName || !contactInfo.customerEmail || !contactInfo.customerPhone) {
      alert('Please fill in all contact information fields');
      return;
    }

    if (!agreeToTerms) {
      alert('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = (bookingId: number) => {
    // Redirect to success page
    window.location.href = `/payment-success?booking_id=${bookingId}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground font-medium">Loading order details...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Review Your Order</h2>
        <p className="text-muted-foreground">Please review your booking details before proceeding to payment.</p>
      </div>

      <div className="space-y-6">
        {/* Dumpster Details */}
        <div className="bg-muted rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Dumpster Selection
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Size</p>
              <p className="font-medium text-foreground">{dumpster?.name || 'Not selected'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Rental Duration</p>
              <p className="font-medium text-foreground">{pricing ? `${pricing.days} days` : 'Not selected'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground mb-1">Base Price</p>
              <p className="font-semibold text-primary text-lg">
                {pricing ? `$${(pricing.price / 100).toFixed(2)}` : '$0.00'}
              </p>
            </div>
          </div>
        </div>

        {/* Delivery Details */}
        <div className="bg-muted rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Delivery Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground mb-1">Address</p>
              <p className="font-medium text-foreground">
                {bookingData.deliveryAddress || 'Not provided'}
                {bookingData.deliveryAddressLine2 && <span className="block text-muted-foreground">{bookingData.deliveryAddressLine2}</span>}
                {bookingData.deliveryCity && bookingData.deliveryZipCode && (
                  <span className="block text-muted-foreground">{bookingData.deliveryCity}, {bookingData.deliveryZipCode}</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Delivery Date
              </p>
              <p className="font-medium text-foreground">{formatDate(bookingData.deliveryDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Time Preference
              </p>
              <p className="font-medium text-foreground capitalize">{bookingData.deliveryTimePreference || 'Not selected'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                <Home className="h-4 w-4" />
                Placement Location
              </p>
              <p className="font-medium text-foreground capitalize">{bookingData.placementLocation || 'Not selected'}</p>
            </div>
          </div>
          {bookingData.deliveryInstructions && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                <FileText className="h-4 w-4" />
                Special Instructions
              </p>
              <p className="text-muted-foreground bg-background p-3 rounded-lg border border-border text-sm">
                {bookingData.deliveryInstructions}
              </p>
            </div>
          )}
        </div>

        {/* Add-ons */}
        {bookingData.selectedAddOns && bookingData.selectedAddOns.length > 0 && (
          <div className="bg-muted rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Additional Services
            </h3>
            <div className="space-y-3">
              {bookingData.selectedAddOns.map((addon: Addon) => (
                <div key={addon.id} className="flex justify-between items-center bg-background p-3 rounded-lg border border-border">
                  <span className="text-foreground font-medium">{addon.name}</span>
                  <span className="font-semibold text-primary">${(addon.price / 100).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order Total */}
        <div className="bg-primary/10 border-2 border-primary rounded-xl p-6">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-foreground">Total Amount</span>
            <span className="text-3xl font-bold text-primary">
              ${(calculateTotal() / 100).toFixed(2)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Includes dumpster rental + delivery & pickup
            {bookingData.selectedAddOns?.length > 0 && ` + ${bookingData.selectedAddOns.length} additional service(s)`}
          </p>
        </div>

        {/* Contact Information */}
        <div className="bg-muted rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Contact Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-1">
                <User className="h-4 w-4 text-muted-foreground" />
                Full Name *
              </label>
              <input
                type="text"
                value={contactInfo.customerName}
                onChange={(e) => setContactInfo(prev => ({ ...prev, customerName: e.target.value }))}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-1">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email Address *
              </label>
              <input
                type="email"
                value={contactInfo.customerEmail}
                onChange={(e) => setContactInfo(prev => ({ ...prev, customerEmail: e.target.value }))}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                placeholder="john@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-1">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Phone Number *
              </label>
              <input
                type="tel"
                value={contactInfo.customerPhone}
                onChange={(e) => setContactInfo(prev => ({ ...prev, customerPhone: e.target.value }))}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                placeholder="(555) 123-4567"
                required
              />
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="bg-muted rounded-xl p-6">
          <label className="flex items-start cursor-pointer">
            <div
              onClick={() => setAgreeToTerms(!agreeToTerms)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all mr-3 mt-0.5 ${
                agreeToTerms
                  ? 'bg-primary border-primary'
                  : 'bg-background border-border'
              }`}
            >
              {agreeToTerms && (
                <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              I agree to the{' '}
              <a href="/legal/terms" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">Terms of Service</a>
              {' '}and{' '}
              <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">Privacy Policy</a>
            </span>
          </label>
        </div>
      </div>

      {/* Payment Form - shown after clicking Proceed to Payment */}
      {showPaymentForm && (
        <div className="mt-6">
          <PaymentFormWrapper
            totalAmount={calculateTotal()}
            bookingData={bookingData}
            contactInfo={contactInfo}
            onSuccess={handlePaymentSuccess}
          />
        </div>
      )}

      {/* Navigation Buttons */}
      {!showPaymentForm && (
        <div className="mt-8 flex gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 px-6 py-3 border-2 border-border text-foreground rounded-xl hover:bg-accent font-medium transition-colors"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleContinueToPayment}
            className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 font-semibold transition-colors shadow-sm"
          >
            Proceed to Payment
          </button>
        </div>
      )}
    </div>
  );
}
