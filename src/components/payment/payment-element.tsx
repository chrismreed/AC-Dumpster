'use client';

import { usePaymentConfig } from '@/hooks/use-payment-config';
import { StripePaymentElement } from './stripe-payment-element';
import { SquarePaymentElement } from './square-payment-element';
import { Loader2 } from 'lucide-react';

interface PaymentElementProps {
  amount: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  bookingId?: number;
  collectBillingAddress?: boolean;
}

export function PaymentElement({
  amount,
  onSuccess,
  onError,
  bookingId,
  collectBillingAddress = false,
}: PaymentElementProps) {
  const { config, loading } = usePaymentConfig();

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
        <p className="text-sm text-gray-500 mt-3">Loading payment configuration...</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-600 font-medium">Payment is not configured</p>
        <p className="text-xs text-red-500 mt-2">
          Please contact the administrator to set up payment processing.
        </p>
      </div>
    );
  }

  if (config.provider === 'square') {
    return (
      <SquarePaymentElement
        amount={amount}
        onSuccess={onSuccess}
        onError={onError}
        bookingId={bookingId}
      />
    );
  }

  // Default to Stripe
  return (
    <StripePaymentElement
      amount={amount}
      bookingId={bookingId}
      onSuccess={onSuccess}
      onError={onError}
      collectBillingAddress={collectBillingAddress}
    />
  );
}
