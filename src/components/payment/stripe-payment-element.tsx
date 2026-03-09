'use client';

import { useEffect, useState, useRef } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { usePaymentConfig } from '@/hooks/use-payment-config';

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

function PaymentForm({ clientSecret, amount, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || 'An error occurred');
        onError?.(error.message || 'An error occurred');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess?.();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed';
      setErrorMessage(message);
      onError?.(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm font-bold text-gray-700 mb-2">Amount to Pay</p>
        <p className="text-2xl font-black text-green-600">${amount.toFixed(2)}</p>
      </div>

      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <PaymentElement />
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errorMessage}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full h-12 text-base font-bold bg-green-600 hover:bg-green-700 rounded-xl"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay $${amount.toFixed(2)}`
        )}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        🔒 Secure payment powered by Stripe
      </p>
    </form>
  );
}

interface StripePaymentElementProps {
  amount: number;
  bookingId?: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  collectBillingAddress?: boolean;
}

export function StripePaymentElement({
  amount,
  bookingId,
  onSuccess,
  onError,
  collectBillingAddress = false
}: StripePaymentElementProps) {
  const { stripePromise, loading: configLoading } = usePaymentConfig();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Only create payment intent once on mount
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;

    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId, // Amount is looked up server-side from the booking record
            collectBillingAddress,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create payment intent');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize payment';
        setError(message);
        onError?.(message);
      } finally {
        setLoading(false);
      }
    };

    if (amount > 0) {
      createPaymentIntent();
    } else {
      setError('Invalid payment amount');
      setLoading(false);
    }
  }, []); // Empty dependency array - only run once on mount

  if (loading || configLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
        <p className="text-sm text-gray-500 mt-3">Initializing payment...</p>
      </div>
    );
  }

  if (error || !clientSecret) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-600 font-medium">
          {error || 'Unable to initialize payment'}
        </p>
        <p className="text-xs text-red-500 mt-2">
          Please check your Stripe configuration and try again.
        </p>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#16a34a',
        borderRadius: '12px',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm
        clientSecret={clientSecret}
        amount={amount}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}
