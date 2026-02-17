import { db } from '@/lib/db';
import { notificationTemplates, notificationLog, businessSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { sendTemplatedEmail } from '@/lib/email';
import { sendSMS, type TwilioConfig } from '@/lib/sms';

export type NotificationEventType =
  | 'booking_confirmed'
  | 'job_scheduled'
  | 'driver_en_route'
  | 'job_completed'
  | 'swap_request_update';

export interface NotificationContext {
  // Customer info
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  // Booking info
  bookingId?: string;
  deliveryDate?: string;
  dumpsterSize?: string;
  address?: string;
  totalPrice?: string;
  // Job info
  jobId?: string;
  jobType?: string;
  scheduledDate?: string;
  timePreference?: string;
  // Swap info
  swapRequestId?: string;
  requestType?: string;
  swapStatus?: string;
  adminNotes?: string;
  // Allow additional variables
  [key: string]: string | undefined;
}

/**
 * Interpolate template variables: replaces {{variableName}} with context values
 */
function interpolateTemplate(template: string, context: NotificationContext): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return context[key] || '';
  });
}

/**
 * Load SendGrid/Twilio configuration from businessSettings table.
 * Falls back to environment variables.
 */
async function loadProviderConfig(): Promise<{
  sendgridApiKey: string;
  sendgridFromEmail: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioFromNumber: string;
}> {
  try {
    const settings = await db.select().from(businessSettings);
    const settingsMap = new Map(settings.map(s => [s.key, s.value]));

    return {
      sendgridApiKey: settingsMap.get('sendgrid_api_key') || process.env.SENDGRID_API_KEY || '',
      sendgridFromEmail: settingsMap.get('sendgrid_from_email') || process.env.SENDGRID_FROM_EMAIL || 'noreply@alleycatdumpsters.com',
      twilioAccountSid: settingsMap.get('twilio_account_sid') || process.env.TWILIO_ACCOUNT_SID || '',
      twilioAuthToken: settingsMap.get('twilio_auth_token') || process.env.TWILIO_AUTH_TOKEN || '',
      twilioFromNumber: settingsMap.get('twilio_from_number') || process.env.TWILIO_FROM_NUMBER || '',
    };
  } catch (error) {
    console.error('Failed to load provider config from DB, using env vars:', error);
    return {
      sendgridApiKey: process.env.SENDGRID_API_KEY || '',
      sendgridFromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@alleycatdumpsters.com',
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
      twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
      twilioFromNumber: process.env.TWILIO_FROM_NUMBER || '',
    };
  }
}

/**
 * Log a notification attempt to the database.
 */
async function logNotification(entry: {
  eventType: string;
  channel: string;
  recipientEmail?: string;
  recipientPhone?: string;
  subject?: string;
  body: string;
  status: string;
  errorMessage?: string;
  bookingId?: number;
  jobId?: number;
  swapRequestId?: number;
}) {
  try {
    await db.insert(notificationLog).values(entry);
  } catch (error) {
    console.error('Failed to log notification:', error);
  }
}

/**
 * Send a notification for a given event type.
 * This is fire-and-forget safe — it catches all errors and logs them.
 *
 * @param eventType - The notification event type
 * @param context - Template variables for interpolation
 */
export async function sendNotification(
  eventType: NotificationEventType,
  context: NotificationContext
): Promise<void> {
  try {
    // 1. Look up the template
    const [template] = await db
      .select()
      .from(notificationTemplates)
      .where(eq(notificationTemplates.eventType, eventType));

    if (!template) {
      console.warn(`No notification template found for event: ${eventType}`);
      return;
    }

    // 2. Check if both channels are disabled
    if (!template.emailEnabled && !template.smsEnabled) {
      return;
    }

    // 3. Load provider config
    const config = await loadProviderConfig();

    // Parse optional IDs for logging
    const bookingId = context.bookingId ? parseInt(context.bookingId) : undefined;
    const jobId = context.jobId ? parseInt(context.jobId) : undefined;
    const swapRequestId = context.swapRequestId ? parseInt(context.swapRequestId) : undefined;

    // 4. Send email if enabled
    if (template.emailEnabled && context.customerEmail) {
      const subject = interpolateTemplate(template.emailSubject, context);
      const body = interpolateTemplate(template.emailBody, context);

      const emailConfig = config.sendgridApiKey
        ? { apiKey: config.sendgridApiKey, fromEmail: config.sendgridFromEmail }
        : undefined;

      const success = await sendTemplatedEmail(
        context.customerEmail,
        subject,
        body,
        emailConfig
      );

      await logNotification({
        eventType,
        channel: 'email',
        recipientEmail: context.customerEmail,
        subject,
        body,
        status: success ? 'sent' : 'failed',
        errorMessage: success ? undefined : 'Email delivery failed',
        bookingId,
        jobId,
        swapRequestId,
      });
    }

    // 5. Send SMS if enabled
    if (template.smsEnabled && context.customerPhone) {
      const smsBody = interpolateTemplate(template.smsBody, context);

      const twilioConfig: TwilioConfig = {
        accountSid: config.twilioAccountSid,
        authToken: config.twilioAuthToken,
        fromNumber: config.twilioFromNumber,
      };

      const success = await sendSMS(context.customerPhone, smsBody, twilioConfig);

      await logNotification({
        eventType,
        channel: 'sms',
        recipientPhone: context.customerPhone,
        body: smsBody,
        status: success ? 'sent' : 'failed',
        errorMessage: success ? undefined : 'SMS delivery failed',
        bookingId,
        jobId,
        swapRequestId,
      });
    }
  } catch (error) {
    console.error(`Notification error (${eventType}):`, error);
    // Fire-and-forget: never throw from this function
  }
}
