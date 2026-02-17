import Twilio from 'twilio';

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

/**
 * Send an SMS message via Twilio.
 * Returns true on success, false on failure.
 */
export async function sendSMS(
  to: string,
  body: string,
  config: TwilioConfig
): Promise<boolean> {
  if (!config.accountSid || !config.authToken || !config.fromNumber) {
    console.log('=== SMS NOT CONFIGURED (Twilio) ===');
    console.log(`To: ${to}`);
    console.log(`Body: ${body}`);
    console.log('===================================');
    return true; // Don't fail the flow
  }

  try {
    // Clean up phone number — ensure it has country code
    let formattedTo = to.replace(/[^+\d]/g, '');
    if (!formattedTo.startsWith('+')) {
      // Assume US if no country code
      formattedTo = '+1' + formattedTo.replace(/^1/, '');
    }

    const client = Twilio(config.accountSid, config.authToken);

    await client.messages.create({
      body,
      from: config.fromNumber,
      to: formattedTo,
    });

    console.log(`SMS sent to ${formattedTo}`);
    return true;
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return false;
  }
}
