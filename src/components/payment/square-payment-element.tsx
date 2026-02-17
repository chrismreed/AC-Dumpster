'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { usePaymentConfig } from '@/hooks/use-payment-config';

interface SquarePaymentElementProps {
  amount: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  bookingId?: number;
}

export function SquarePaymentElement({
  amount,
  onSuccess,
  onError,
  bookingId,
}: SquarePaymentElementProps) {
  const { config, loading: configLoading } = usePaymentConfig();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardReady, setCardReady] = useState(false);
  const cardRef = useRef<any>(null);
  const paymentsRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (configLoading || !config || config.provider !== 'square' || initializedRef.current) return;

    const applicationId = config.squareApplicationId;
    if (!applicationId) {
      setError('Square application ID is not configured');
      return;
    }

    initializedRef.current = true;

    const loadSquare = async () => {
      try {
        // Load Square Web Payments SDK
        if (!document.getElementById('square-web-sdk')) {
          const script = document.createElement('script');
          script.id = 'square-web-sdk';
          script.src = config.testMode
            ? 'https://sandbox.web.squarecdn.com/v1/square.js'
            : 'https://web.squarecdn.com/v1/square.js';
          script.async = true;
          document.head.appendChild(script);
          await new Promise<void>((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Square SDK'));
          });
        }

        const Square = (window as any).Square;
        if (!Square) {
          throw new Error('Square SDK not available');
        }

        const payments = Square.payments(applicationId, config.squareLocationId || undefined);
        paymentsRef.current = payments;

        const card = await payments.card();
        cardRef.current = card;

        if (containerRef.current) {
          await card.attach(containerRef.current);
          setCardReady(true);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize Square payment';
        setError(message);
        onError?.(message);
      }
    };

    loadSquare();

    return () => {
      if (cardRef.current) {
        try {
          cardRef.current.destroy();
        } catch {}
      }
    };
  }, [configLoading, config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cardRef.current || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      const result = await cardRef.current.tokenize();

      if (result.status === 'OK') {
        // Send token to our API to create the payment
        const response = await fetch('/api/square/create-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceId: result.token,
            amount: Math.round(amount * 100), // Convert to cents
            bookingId,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Payment failed');
        }

        onSuccess?.();
      } else {
        const errors = result.errors?.map((e: any) => e.message).join(', ') || 'Card tokenization failed';
        setError(errors);
        onError?.(errors);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed';
      setError(message);
      onError?.(message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (configLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
        <p className="text-sm text-gray-500 mt-3">Initializing payment...</p>
      </div>
    );
  }

  if (error && !cardReady) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-600 font-medium">{error}</p>
        <p className="text-xs text-red-500 mt-2">
          Please check your Square configuration and try again.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm font-bold text-gray-700 mb-2">Amount to Pay</p>
        <p className="text-2xl font-black text-green-600">${amount.toFixed(2)}</p>
      </div>

      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <div ref={containerRef} style={{ minHeight: '90px' }} />
        {!cardReady && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400 mr-2" />
            <span className="text-sm text-gray-500">Loading payment form...</span>
          </div>
        )}
      </div>

      {error && cardReady && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={!cardReady || isProcessing}
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
        Secure payment powered by Square
      </p>
    </form>
  );
}
