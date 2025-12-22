import axios from 'axios';
import { storage } from '../storage';

interface EmailRecipient {
  email: string;
  name?: string;
}

interface SendEmailOptions {
  to: EmailRecipient[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  replyTo?: EmailRecipient;
  params?: Record<string, string>;
}

interface BookingEmailData {
  customerName: string;
  customerEmail: string;
  dumpsterName: string;
  dumpsterSize: string;
  deliveryAddress: string;
  deliveryDate: string;
  pickupDate: string;
  rentalDays: number;
  totalPrice: number;
  bookingId: number;
}

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

async function getEmailSettings(): Promise<{ fromEmail: string; fromName: string; businessName: string }> {
  const settings = await storage.getAllBusinessSettings();
  
  return {
    fromEmail: settings.senderEmail || process.env.BREVO_FROM_EMAIL || 'noreply@alleycatdumpsters.com',
    fromName: settings.senderName || process.env.BREVO_FROM_NAME || 'Alley Cat Dumpster Rentals',
    businessName: settings.businessName || 'Alley Cat Dumpster Rentals',
  };
}

async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  
  if (!apiKey) {
    console.warn('BREVO_API_KEY not configured - email not sent');
    return { success: false, error: 'Email service not configured' };
  }

  const { fromEmail, fromName } = await getEmailSettings();

  try {
    const response = await axios.post(
      BREVO_API_URL,
      {
        sender: { name: fromName, email: fromEmail },
        to: options.to,
        subject: options.subject,
        htmlContent: options.htmlContent,
        textContent: options.textContent,
        cc: options.cc,
        bcc: options.bcc,
        replyTo: options.replyTo,
        params: options.params,
      },
      {
        headers: {
          'api-key': apiKey,
          'content-type': 'application/json',
          'accept': 'application/json',
        },
      }
    );

    console.log('Email sent successfully:', response.data.messageId);
    return { success: true, messageId: response.data.messageId };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
    console.error('Failed to send email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

export async function sendBookingConfirmationEmail(data: BookingEmailData): Promise<{ success: boolean; error?: string }> {
  const formattedPrice = (data.totalPrice / 100).toFixed(2);
  const { businessName, fromEmail } = await getEmailSettings();
  const supportEmail = (await storage.getBusinessSetting('supportEmail')) || fromEmail;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background-color: #f7c948; padding: 20px; text-align: center; }
        .header h1 { margin: 0; color: #1a1a1a; font-size: 24px; }
        .content { padding: 30px 20px; }
        .booking-details { background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .booking-details h2 { margin-top: 0; color: #1a1a1a; font-size: 18px; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .detail-row:last-child { border-bottom: none; }
        .label { color: #666; }
        .value { font-weight: 600; color: #1a1a1a; }
        .total-row { background-color: #f7c948; padding: 15px; border-radius: 4px; margin-top: 15px; }
        .total-row .label, .total-row .value { color: #1a1a1a; font-size: 18px; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #eee; }
        .cta-button { display: inline-block; background-color: #f7c948; color: #1a1a1a; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: 600; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Booking Confirmation</h1>
      </div>
      <div class="content">
        <p>Hi ${data.customerName},</p>
        <p>Thank you for your dumpster rental booking! We're excited to serve you. Here are your booking details:</p>
        
        <div class="booking-details">
          <h2>Booking #${data.bookingId}</h2>
          <div class="detail-row">
            <span class="label">Dumpster</span>
            <span class="value">${data.dumpsterName} (${data.dumpsterSize})</span>
          </div>
          <div class="detail-row">
            <span class="label">Delivery Address</span>
            <span class="value">${data.deliveryAddress}</span>
          </div>
          <div class="detail-row">
            <span class="label">Delivery Date</span>
            <span class="value">${data.deliveryDate}</span>
          </div>
          <div class="detail-row">
            <span class="label">Pickup Date</span>
            <span class="value">${data.pickupDate}</span>
          </div>
          <div class="detail-row">
            <span class="label">Rental Period</span>
            <span class="value">${data.rentalDays} day${data.rentalDays === 1 ? '' : 's'}</span>
          </div>
          <div class="total-row">
            <div class="detail-row" style="border-bottom: none;">
              <span class="label">Total Paid</span>
              <span class="value">$${formattedPrice}</span>
            </div>
          </div>
        </div>
        
        <p><strong>What's Next?</strong></p>
        <ul>
          <li>Our team will deliver the dumpster on your scheduled delivery date</li>
          <li>Please ensure the delivery area is accessible</li>
          <li>We'll pick up the dumpster on the scheduled pickup date</li>
        </ul>
        
        <p>If you have any questions or need to make changes to your booking, please don't hesitate to contact us.</p>
        
        <p>Thank you for choosing ${businessName}!</p>
      </div>
      <div class="footer">
        <p>${businessName}</p>
        <p>Questions? Contact us at ${supportEmail}</p>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Booking Confirmation - ${businessName}

Hi ${data.customerName},

Thank you for your dumpster rental booking! Here are your booking details:

Booking #${data.bookingId}
- Dumpster: ${data.dumpsterName} (${data.dumpsterSize})
- Delivery Address: ${data.deliveryAddress}
- Delivery Date: ${data.deliveryDate}
- Pickup Date: ${data.pickupDate}
- Rental Period: ${data.rentalDays} day${data.rentalDays === 1 ? '' : 's'}
- Total Paid: $${formattedPrice}

What's Next?
- Our team will deliver the dumpster on your scheduled delivery date
- Please ensure the delivery area is accessible
- We'll pick up the dumpster on the scheduled pickup date

If you have any questions, please contact us.

Thank you for choosing ${businessName}!
  `.trim();

  return sendEmail({
    to: [{ email: data.customerEmail, name: data.customerName }],
    subject: `Booking Confirmation #${data.bookingId} - ${businessName}`,
    htmlContent,
    textContent,
  });
}

export async function sendPaymentReceiptEmail(data: {
  customerName: string;
  customerEmail: string;
  bookingId: number;
  amount: number;
  description: string;
}): Promise<{ success: boolean; error?: string }> {
  const formattedAmount = (data.amount / 100).toFixed(2);
  const { businessName } = await getEmailSettings();
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background-color: #f7c948; padding: 20px; text-align: center; }
        .header h1 { margin: 0; color: #1a1a1a; font-size: 24px; }
        .content { padding: 30px 20px; }
        .amount-box { background-color: #22c55e; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .amount-box .amount { font-size: 32px; font-weight: 700; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Payment Received</h1>
      </div>
      <div class="content">
        <p>Hi ${data.customerName},</p>
        <p>We've received your payment. Thank you!</p>
        
        <div class="amount-box">
          <div class="amount">$${formattedAmount}</div>
          <div>Payment Successful</div>
        </div>
        
        <p><strong>Details:</strong></p>
        <p>Booking #${data.bookingId}<br>${data.description}</p>
        
        <p>Thank you for your business!</p>
      </div>
      <div class="footer">
        <p>${businessName}</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: [{ email: data.customerEmail, name: data.customerName }],
    subject: `Payment Received - Booking #${data.bookingId}`,
    htmlContent,
  });
}

export async function sendAccountCredentialsEmail(data: {
  email: string;
  companyName?: string;
  accessCode: string;
  portalUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { businessName, fromEmail } = await getEmailSettings();
  const supportEmail = (await storage.getBusinessSetting('supportEmail')) || fromEmail;
  const phoneNumber = (await storage.getBusinessSetting('phoneNumber')) || '';
  
  const portalUrl = data.portalUrl || '/customer/login';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background-color: #f7c948; padding: 20px; text-align: center; }
        .header h1 { margin: 0; color: #1a1a1a; font-size: 24px; }
        .content { padding: 30px 20px; }
        .credentials-box { background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
        .credentials-box h2 { margin-top: 0; color: #1a1a1a; font-size: 18px; }
        .access-code { font-size: 32px; font-weight: 700; letter-spacing: 4px; font-family: monospace; color: #1a1a1a; background: #fff; padding: 15px 25px; border-radius: 8px; display: inline-block; margin: 10px 0; border: 2px dashed #f7c948; }
        .email-display { font-size: 16px; color: #666; margin-bottom: 15px; }
        .cta-button { display: inline-block; background-color: #f7c948; color: #1a1a1a; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: 600; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #eee; }
        .steps { text-align: left; background: #f0f9ff; padding: 15px 20px; border-radius: 8px; margin: 20px 0; }
        .steps h3 { margin-top: 0; color: #1a1a1a; }
        .steps ol { margin: 0; padding-left: 20px; }
        .steps li { margin: 8px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Your Customer Portal Account</h1>
      </div>
      <div class="content">
        <p>Hi${data.companyName ? ` ${data.companyName}` : ''},</p>
        <p>Welcome to the ${businessName} customer portal! You can now view your rental bookings, request pickups or dumpster swaps, and manage your account online.</p>
        
        <div class="credentials-box">
          <h2>Your Login Credentials</h2>
          <div class="email-display"><strong>Email:</strong> ${data.email}</div>
          <div><strong>Access Code:</strong></div>
          <div class="access-code">${data.accessCode}</div>
        </div>
        
        <div class="steps">
          <h3>How to Log In:</h3>
          <ol>
            <li>Click the button below or visit our customer portal</li>
            <li>Enter your email address</li>
            <li>Enter the 6-digit access code above</li>
            <li>You're in! View your rentals and make requests.</li>
          </ol>
        </div>
        
        <div style="text-align: center;">
          <a href="${portalUrl}" class="cta-button" style="display: inline-block; background-color: #f7c948; color: #1a1a1a; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: 600;">Log In to Customer Portal</a>
        </div>
        
        <p><strong>Important:</strong> Keep this code secure. If you lose it, contact us and we'll generate a new one for you.</p>
        
        <p>Thank you for choosing ${businessName}!</p>
      </div>
      <div class="footer">
        <p>${businessName}</p>
        ${phoneNumber ? `<p>Phone: ${phoneNumber}</p>` : ''}
        <p>Questions? Contact us at ${supportEmail}</p>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Your Customer Portal Account - ${businessName}

Hi${data.companyName ? ` ${data.companyName}` : ''},

Welcome to the ${businessName} customer portal! You can now view your rental bookings, request pickups or dumpster swaps, and manage your account online.

YOUR LOGIN CREDENTIALS
----------------------
Email: ${data.email}
Access Code: ${data.accessCode}

HOW TO LOG IN:
1. Visit our customer portal
2. Enter your email address
3. Enter the 6-digit access code above
4. You're in! View your rentals and make requests.

Important: Keep this code secure. If you lose it, contact us and we'll generate a new one for you.

Thank you for choosing ${businessName}!
${phoneNumber ? `Phone: ${phoneNumber}` : ''}
Questions? Contact us at ${supportEmail}
  `.trim();

  return sendEmail({
    to: [{ email: data.email, name: data.companyName }],
    subject: `Your ${businessName} Customer Portal Login`,
    htmlContent,
    textContent,
  });
}

export async function sendAdminNotificationEmail(data: {
  subject: string;
  message: string;
  bookingId?: number;
}): Promise<{ success: boolean; error?: string }> {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  
  if (!adminEmail) {
    console.warn('ADMIN_NOTIFICATION_EMAIL not configured');
    return { success: false, error: 'Admin notification email not configured' };
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .content { padding: 20px; }
      </style>
    </head>
    <body>
      <div class="content">
        <h2>${data.subject}</h2>
        ${data.bookingId ? `<p><strong>Booking ID:</strong> #${data.bookingId}</p>` : ''}
        <p>${data.message}</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: [{ email: adminEmail }],
    subject: data.subject,
    htmlContent,
  });
}

export { sendEmail };
