import { db } from '@/lib/db';
import { businessSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import Stripe from 'stripe';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PaymentProvider = 'stripe' | 'square' | 'none';

export interface PaymentConfig {
  provider: PaymentProvider;
  testMode: boolean;
  currency: string;
  // Provider enable flags
  stripeEnabled: boolean;
  squareEnabled: boolean;
  // Stripe
  stripeSecretKey: string;
  stripePublishableKey: string;
  stripeWebhookSecret: string;
  // Square
  squareAccessToken: string;
  squareApplicationId: string;
  squareLocationId: string;
  squareEnvironment: 'sandbox' | 'production';
}

// ─── DB Key Constants ─────────────────────────────────────────────────────────

export const PAYMENT_SETTINGS_KEYS = {
  PROVIDER: 'payment_provider',
  TEST_MODE: 'payment_test_mode',
  CURRENCY: 'payment_currency',
  STRIPE_ENABLED: 'payment_stripe_enabled',
  SQUARE_ENABLED: 'payment_square_enabled',
  STRIPE_SECRET_KEY: 'payment_stripe_secret_key',
  STRIPE_PUBLISHABLE_KEY: 'payment_stripe_publishable_key',
  STRIPE_WEBHOOK_SECRET: 'payment_stripe_webhook_secret',
  SQUARE_ACCESS_TOKEN: 'payment_square_access_token',
  SQUARE_APPLICATION_ID: 'payment_square_application_id',
  SQUARE_LOCATION_ID: 'payment_square_location_id',
  SQUARE_ENVIRONMENT: 'payment_square_environment',
} as const;

// Fields that contain secrets and need encryption
const SECRET_KEYS: Set<string> = new Set([
  PAYMENT_SETTINGS_KEYS.STRIPE_SECRET_KEY,
  PAYMENT_SETTINGS_KEYS.STRIPE_WEBHOOK_SECRET,
  PAYMENT_SETTINGS_KEYS.SQUARE_ACCESS_TOKEN,
]);

// ─── Encryption ───────────────────────────────────────────────────────────────

function getEncryptionKey(): Buffer {
  const keyHex = process.env.PAYMENT_ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error(
      'PAYMENT_ENCRYPTION_KEY is not set or invalid. ' +
      'Generate a 64-char hex key with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return Buffer.from(keyHex, 'hex');
}

export function encrypt(plaintext: string): string {
  if (!plaintext) return '';
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  // Format: iv:authTag:ciphertext
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decrypt(encryptedStr: string): string {
  if (!encryptedStr) return '';
  try {
    const parts = encryptedStr.split(':');
    if (parts.length !== 3) {
      // Not encrypted (legacy plain value), return as-is
      return encryptedStr;
    }
    const [ivHex, authTagHex, ciphertext] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    // If decryption fails, the value might be stored in plain text (legacy)
    return encryptedStr;
  }
}

// ─── Masking ──────────────────────────────────────────────────────────────────

export function maskSecret(value: string): string {
  if (!value) return '';
  if (value.length <= 8) return '••••••••';
  const prefix = value.substring(0, value.startsWith('sk_') || value.startsWith('pk_') || value.startsWith('whsec_') ? value.indexOf('_', 3) + 1 : 4);
  const suffix = value.substring(value.length - 4);
  return `${prefix}••••${suffix}`;
}

// ─── Config Loading ───────────────────────────────────────────────────────────

let configCache: { config: PaymentConfig; timestamp: number } | null = null;
const CACHE_TTL_MS = 60_000; // 60 seconds

export function clearPaymentConfigCache(): void {
  configCache = null;
}

export async function getPaymentConfig(): Promise<PaymentConfig> {
  // Check cache
  if (configCache && Date.now() - configCache.timestamp < CACHE_TTL_MS) {
    return configCache.config;
  }

  try {
    const settings = await db.select().from(businessSettings);
    const settingsMap = new Map(settings.map(s => [s.key, s.value]));

    const getVal = (key: string, envFallback?: string) => {
      const dbVal = settingsMap.get(key);
      if (dbVal && dbVal.trim() !== '') {
        const resolved = SECRET_KEYS.has(key) ? decrypt(dbVal) : dbVal;
        if (resolved && resolved.trim() !== '') return resolved;
      }
      return envFallback || '';
    };

    // Resolve enable flags (default: Stripe enabled, Square disabled)
    const stripeEnabledVal = getVal(PAYMENT_SETTINGS_KEYS.STRIPE_ENABLED);
    const squareEnabledVal = getVal(PAYMENT_SETTINGS_KEYS.SQUARE_ENABLED);
    const stripeEnabled = stripeEnabledVal === 'true'; // default false, opt-in like Square
    const squareEnabled = squareEnabledVal === 'true'; // default false

    // Resolve effective provider: use selected if it's enabled, otherwise fallback
    const selectedProvider = getVal(PAYMENT_SETTINGS_KEYS.PROVIDER) || 'stripe';
    let effectiveProvider: PaymentProvider;
    if (selectedProvider === 'stripe' && stripeEnabled) {
      effectiveProvider = 'stripe';
    } else if (selectedProvider === 'square' && squareEnabled) {
      effectiveProvider = 'square';
    } else if (stripeEnabled) {
      effectiveProvider = 'stripe';
    } else if (squareEnabled) {
      effectiveProvider = 'square';
    } else {
      effectiveProvider = 'none';
    }

    const config: PaymentConfig = {
      provider: effectiveProvider,
      testMode: getVal(PAYMENT_SETTINGS_KEYS.TEST_MODE) === 'true',
      currency: getVal(PAYMENT_SETTINGS_KEYS.CURRENCY) || 'usd',
      stripeEnabled,
      squareEnabled,
      // Stripe - fall back to env vars
      stripeSecretKey: getVal(PAYMENT_SETTINGS_KEYS.STRIPE_SECRET_KEY, process.env.STRIPE_SECRET_KEY),
      stripePublishableKey: getVal(PAYMENT_SETTINGS_KEYS.STRIPE_PUBLISHABLE_KEY, process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
      stripeWebhookSecret: getVal(PAYMENT_SETTINGS_KEYS.STRIPE_WEBHOOK_SECRET, process.env.STRIPE_WEBHOOK_SECRET),
      // Square - no env var fallbacks (new feature)
      squareAccessToken: getVal(PAYMENT_SETTINGS_KEYS.SQUARE_ACCESS_TOKEN),
      squareApplicationId: getVal(PAYMENT_SETTINGS_KEYS.SQUARE_APPLICATION_ID),
      squareLocationId: getVal(PAYMENT_SETTINGS_KEYS.SQUARE_LOCATION_ID),
      squareEnvironment: (getVal(PAYMENT_SETTINGS_KEYS.SQUARE_ENVIRONMENT) || 'sandbox') as 'sandbox' | 'production',
    };

    configCache = { config, timestamp: Date.now() };
    return config;
  } catch (error) {
    console.error('Failed to load payment config from DB, using env vars:', error);
    const config: PaymentConfig = {
      provider: 'stripe',
      testMode: false,
      currency: 'usd',
      stripeEnabled: false,
      squareEnabled: false,
      stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
      stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
      squareAccessToken: '',
      squareApplicationId: '',
      squareLocationId: '',
      squareEnvironment: 'sandbox',
    };
    return config;
  }
}

// ─── Stripe Client Factory ───────────────────────────────────────────────────

let cachedStripeClient: { client: Stripe; key: string } | null = null;

export async function getStripeClient(): Promise<Stripe | null> {
  const config = await getPaymentConfig();
  if (!config.stripeSecretKey) return null;

  // Reuse client if key hasn't changed
  if (cachedStripeClient && cachedStripeClient.key === config.stripeSecretKey) {
    return cachedStripeClient.client;
  }

  const client = new Stripe(config.stripeSecretKey);

  cachedStripeClient = { client, key: config.stripeSecretKey };
  return client;
}

export async function getStripeWebhookSecret(): Promise<string> {
  const config = await getPaymentConfig();
  return config.stripeWebhookSecret;
}

// ─── Square Client Factory ───────────────────────────────────────────────────

export async function getSquareClient(): Promise<any | null> {
  const config = await getPaymentConfig();
  if (!config.squareAccessToken) return null;

  try {
    const { SquareClient, SquareEnvironment } = await import('square');
    const client = new SquareClient({
      token: config.squareAccessToken,
      environment: config.squareEnvironment === 'production'
        ? SquareEnvironment.Production
        : SquareEnvironment.Sandbox,
    });
    return client;
  } catch (error) {
    console.error('Failed to create Square client:', error);
    return null;
  }
}

export async function getSquareLocationId(): Promise<string> {
  const config = await getPaymentConfig();
  return config.squareLocationId;
}

// ─── Save Helpers ─────────────────────────────────────────────────────────────

export async function savePaymentSetting(key: string, value: string): Promise<void> {
  const storeValue = SECRET_KEYS.has(key) ? encrypt(value) : value;
  await db
    .insert(businessSettings)
    .values({ key, value: storeValue })
    .onConflictDoUpdate({
      target: businessSettings.key,
      set: { value: storeValue },
    });
}

export async function savePaymentSettings(settings: Record<string, string>): Promise<void> {
  const updates = Object.entries(settings).map(([key, value]) =>
    savePaymentSetting(key, value)
  );
  await Promise.all(updates);
  clearPaymentConfigCache();
}
