'use client';

import { useState, useCallback } from 'react';
import { PaymentForm, CreditCard } from 'react-square-web-payments-sdk';
import { Loader2 } from 'lucide-react';

interface SquarePaymentFormProps {
  bookingId: number;
  totalAmount: number;
  applicationId: string;
  locationId: string;
  environment: 'sandbox' | 'production';
  onSuccess: (bookingId: number) => void;
}

export function SquarePaymentForm({
  bookingId,
  totalAmount,
  applicationId,
  locationId,
  environment,
  onSuccess,
}: SquarePaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleTokenize = useCallback(async (token: any) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      if (token.status !== 'OK' || !token.token) {
        const errorDetail = token.errors?.[0]?.message || 'Card verification failed. Please check your card details.';
        setErrorMessage(errorDetail);
        setIsProcessing(false);
        return;
      }

      // Send payment to Square via our API
      const paymentResponse = await fetch('/api/square/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: token.token,
          amount: totalAmount,
          bookingId,
          note: `Dumpster rental booking #${bookingId}`,
        }),
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.error || 'Payment failed');
      }

      const paymentData = await paymentResponse.json();

      if (paymentData.status === 'COMPLETED') {
        onSuccess(bookingId);
      } else {
        setErrorMessage(`Payment status: ${paymentData.status}. Please contact support if this persists.`);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Square payment error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Payment failed. Please try again.');
      setIsProcessing(false);
    }
  }, [isProcessing, totalAmount, bookingId, onSuccess]);

  return (
    <div className="space-y-4">
      <PaymentForm
        applicationId={applicationId}
        locationId={locationId}
        cardTokenizeResponseReceived={handleTokenize}
        createPaymentRequest={() => ({
          countryCode: 'US',
          currencyCode: 'USD',
          total: {
            amount: (totalAmount / 100).toFixed(2),
            label: 'Total',
          },
        })}
        overrides={{
          scriptSrc: environment === 'sandbox'
            ? 'https://sandbox.web.squarecdn.com/v1/square.js'
            : 'https://web.squarecdn.com/v1/square.js',
        }}
      >
        <div className="bg-card border-2 border-border rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-4 text-foreground flex items-center gap-2">
            Payment Information
          </h3>
          <CreditCard
            buttonProps={{
              css: {
                background: '#f7c948',
                color: '#0f172a',
                '&:hover': {
                  background: '#e5b83a',
                },
              },
            }}
          />
        </div>

        {isProcessing && (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Processing payment...</span>
          </div>
        )}
      </PaymentForm>

      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <p className="text-sm text-red-400">{errorMessage}</p>
        </div>
      )}
    </div>
  );
}
