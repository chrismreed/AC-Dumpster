import sgMail from '@sendgrid/mail';
import { randomBytes } from 'crypto';

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@alleycatdumpsters.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

function isEmailConfigured(): boolean {
  return !!SENDGRID_API_KEY;
}

export async function sendAccountSetupEmail(
  email: string,
  name: string,
  token: string
): Promise<boolean> {
  const setupUrl = `${APP_URL}/account/setup?token=${token}`;

  if (!isEmailConfigured()) {
    console.log('=== EMAIL NOT CONFIGURED (SendGrid) ===');
    console.log(`To: ${email}`);
    console.log(`Subject: Set Up Your Alley Cat Dumpsters Account`);
    console.log(`Setup URL: ${setupUrl}`);
    console.log('========================================');
    return true; // Don't fail the flow if email isn't configured
  }

  try {
    await sgMail.send({
      to: email,
      from: { email: FROM_EMAIL, name: 'Alley Cat Dumpsters' },
      subject: 'Set Up Your Alley Cat Dumpsters Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a1a1a; margin: 0;">Alley Cat Dumpsters</h1>
          </div>

          <h2 style="color: #333;">Welcome, ${name}!</h2>

          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Thank you for your booking! We've created an account for you so you can track your orders
            and manage your rentals.
          </p>

          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Click the button below to set up your password and activate your account:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${setupUrl}"
               style="background-color: #f7c948; color: #1a1a1a; padding: 14px 32px;
                      text-decoration: none; border-radius: 6px; font-weight: bold;
                      font-size: 16px; display: inline-block;">
              Set Up Your Account
            </a>
          </div>

          <p style="color: #888; font-size: 14px;">
            This link will expire in 48 hours. If you didn't place a booking with us,
            you can safely ignore this email.
          </p>

          <p style="color: #888; font-size: 14px;">
            If the button doesn't work, copy and paste this URL into your browser:<br/>
            <a href="${setupUrl}" style="color: #f7c948;">${setupUrl}</a>
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />

          <p style="color: #aaa; font-size: 12px; text-align: center;">
            Alley Cat Dumpsters &mdash; Reliable Dumpster Rentals
          </p>
        </div>
      `,
      text: `Welcome, ${name}!\n\nThank you for your booking! Set up your account password here: ${setupUrl}\n\nThis link expires in 48 hours.\n\n- Alley Cat Dumpsters`,
    });

    console.log(`Account setup email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send account setup email:', error);
    return false;
  }
}

export async function sendResendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<boolean> {
  const setupUrl = `${APP_URL}/account/setup?token=${token}`;

  if (!isEmailConfigured()) {
    console.log('=== EMAIL NOT CONFIGURED (SendGrid) ===');
    console.log(`To: ${email}`);
    console.log(`Subject: Verify Your Alley Cat Dumpsters Account`);
    console.log(`Setup URL: ${setupUrl}`);
    console.log('========================================');
    return true;
  }

  try {
    await sgMail.send({
      to: email,
      from: { email: FROM_EMAIL, name: 'Alley Cat Dumpsters' },
      subject: 'Verify Your Alley Cat Dumpsters Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a1a1a; margin: 0;">Alley Cat Dumpsters</h1>
          </div>

          <h2 style="color: #333;">Hi ${name},</h2>

          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            You requested a new verification link for your account. Click the button below
            to set up your password:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${setupUrl}"
               style="background-color: #f7c948; color: #1a1a1a; padding: 14px 32px;
                      text-decoration: none; border-radius: 6px; font-weight: bold;
                      font-size: 16px; display: inline-block;">
              Set Up Your Account
            </a>
          </div>

          <p style="color: #888; font-size: 14px;">
            This link will expire in 48 hours. If you didn't request this,
            you can safely ignore this email.
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />

          <p style="color: #aaa; font-size: 12px; text-align: center;">
            Alley Cat Dumpsters &mdash; Reliable Dumpster Rentals
          </p>
        </div>
      `,
      text: `Hi ${name},\n\nSet up your account password here: ${setupUrl}\n\nThis link expires in 48 hours.\n\n- Alley Cat Dumpsters`,
    });

    console.log(`Verification email resent to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
}

export function generateVerificationToken(): string {
  // 32 cryptographically random bytes → 43-char URL-safe base64 string
  return randomBytes(32).toString('base64url');
}

export function getTokenExpiryDate(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 48); // 48 hours from now
  return expiry;
}

export interface SendGridConfig {
  apiKey: string;
  fromEmail: string;
}

/**
 * Send a templated email with dynamic SendGrid credentials.
 * Used by the notification system so admin-configured API keys work.
 */
export async function sendTemplatedEmail(
  to: string,
  subject: string,
  htmlBody: string,
  config?: SendGridConfig
): Promise<boolean> {
  const apiKey = config?.apiKey || SENDGRID_API_KEY;
  const fromEmail = config?.fromEmail || FROM_EMAIL;

  if (!apiKey) {
    console.log('=== EMAIL NOT CONFIGURED (SendGrid) ===');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${htmlBody.substring(0, 200)}...`);
    console.log('========================================');
    return true;
  }

  try {
    // If using dynamic config, set the API key for this call
    if (config?.apiKey) {
      sgMail.setApiKey(config.apiKey);
    }

    await sgMail.send({
      to,
      from: { email: fromEmail, name: 'Alley Cat Dumpsters' },
      subject,
      html: htmlBody,
    });

    // Reset to default API key if we used a dynamic one
    if (config?.apiKey && SENDGRID_API_KEY) {
      sgMail.setApiKey(SENDGRID_API_KEY);
    }

    console.log(`Templated email sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error('Failed to send templated email:', error);
    // Reset to default API key on error too
    if (config?.apiKey && SENDGRID_API_KEY) {
      sgMail.setApiKey(SENDGRID_API_KEY);
    }
    return false;
  }
}
