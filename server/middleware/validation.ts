import { z } from "zod";

// Environment variables validation schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  STRIPE_SECRET_KEY: z.string().regex(/^sk_/, 'STRIPE_SECRET_KEY must start with sk_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().regex(/^whsec_/, 'STRIPE_WEBHOOK_SECRET must start with whsec_').optional(),
  VITE_GOOGLE_MAPS_API_KEY: z.string().regex(/^AIza/, 'VITE_GOOGLE_MAPS_API_KEY must start with AIza').optional(),
  PORT: z.string().regex(/^\d+$/).transform(Number).default('5000'),
});

// Validate environment variables
export function validateEnvironment() {
  try {
    const env = envSchema.parse(process.env);
    
    // Warn about missing optional but important variables
    const warnings = [];
    if (!env.STRIPE_SECRET_KEY) {
      warnings.push('STRIPE_SECRET_KEY is not set - payment processing will not work');
    }
    if (!env.STRIPE_WEBHOOK_SECRET) {
      warnings.push('STRIPE_WEBHOOK_SECRET is not set - automatic payment updates will not work');
    }
    if (!env.VITE_GOOGLE_MAPS_API_KEY) {
      warnings.push('VITE_GOOGLE_MAPS_API_KEY is not set - map features will not work');
    }
    
    if (warnings.length > 0 && env.NODE_ENV === 'production') {
      console.warn('Environment warnings:', warnings);
    }
    
    return env;
  } catch (error) {
    console.error('Environment validation failed:', error);
    process.exit(1);
  }
}

// Database connection validation
export async function validateDatabaseConnection() {
  try {
    const { db } = await import('../db');
    // Simple query to test connection
    await db.execute('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Health check endpoint data
export async function getHealthStatus() {
  const env = validateEnvironment();
  const dbConnected = await validateDatabaseConnection();
  
  return {
    status: dbConnected ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    database: dbConnected ? 'connected' : 'disconnected',
    services: {
      stripe: !!env.STRIPE_SECRET_KEY,
      googleMaps: !!env.VITE_GOOGLE_MAPS_API_KEY,
    },
  };
}