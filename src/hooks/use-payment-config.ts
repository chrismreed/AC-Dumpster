'use client';

import { useState, useEffect, useRef } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';

interface PaymentClientConfig {
  provider: 'stripe' | 'square' | 'none';
  enabled: boolean;
  testMode: boolean;
  currency: string;
  stripePublishableKey: string;
  squareApplicationId: string;
  squareLocationId: string;
  squareEnvironment: string;
}

interface UsePaymentConfigReturn {
  config: PaymentClientConfig | null;
  stripePromise: Promise<Stripe | null> | null;
  squareReady: boolean;
  loading: boolean;
  error: string | null;
}

// Module-level cache so we don't refetch across components
let cachedConfig: PaymentClientConfig | null = null;
let cachedStripePromise: Promise<Stripe | null> | null = null;
let fetchPromise: Promise<PaymentClientConfig> | null = null;

async function fetchPaymentConfig(): Promise<PaymentClientConfig> {
  if (cachedConfig) return cachedConfig;
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch('/api/payment-config')
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch payment config');
      return res.json();
    })
    .then((data: PaymentClientConfig) => {
      cachedConfig = data;
      fetchPromise = null;
      return data;
    })
    .catch(err => {
      fetchPromise = null;
      throw err;
    });

  return fetchPromise;
}

function getStripePromise(publishableKey: string): Promise<Stripe | null> {
  if (cachedStripePromise) return cachedStripePromise;
  if (!publishableKey) return Promise.resolve(null);
  cachedStripePromise = loadStripe(publishableKey);
  return cachedStripePromise;
}

export function usePaymentConfig(): UsePaymentConfigReturn {
  const [config, setConfig] = useState<PaymentClientConfig | null>(cachedConfig);
  const [loading, setLoading] = useState(!cachedConfig);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current || cachedConfig) {
      if (cachedConfig && !config) setConfig(cachedConfig);
      return;
    }
    fetchedRef.current = true;

    fetchPaymentConfig()
      .then(data => {
        setConfig(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const stripePromise = config?.provider === 'stripe' && config.stripePublishableKey
    ? getStripePromise(config.stripePublishableKey)
    : null;

  const squareReady = !!(
    config?.provider === 'square' &&
    config.squareApplicationId &&
    config.squareLocationId
  );

  return { config, stripePromise, squareReady, loading, error };
}

// Reset cache (useful for testing or after admin changes config)
export function clearPaymentConfigClientCache(): void {
  cachedConfig = null;
  cachedStripePromise = null;
  fetchPromise = null;
}
