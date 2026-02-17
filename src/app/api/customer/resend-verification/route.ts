import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customerAccounts } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { sendResendVerificationEmail, generateVerificationToken, getTokenExpiryDate } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Find the account by email
    const [account] = await db
      .select()
      .from(customerAccounts)
      .where(eq(customerAccounts.email, email.toLowerCase().trim()));

    if (!account) {
      // Don't reveal whether the email exists
      return NextResponse.json({
        message: "If an account with that email exists, a verification link has been sent.",
      });
    }

    // If already verified, don't resend
    if (account.emailVerified) {
      return NextResponse.json({
        message: "If an account with that email exists, a verification link has been sent.",
      });
    }

    // Rate limit: check if token was generated less than 1 minute ago
    if (account.tokenExpiresAt) {
      const tokenCreatedAt = new Date(account.tokenExpiresAt.getTime() - 48 * 60 * 60 * 1000);
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      if (tokenCreatedAt > oneMinuteAgo) {
        return NextResponse.json(
          { message: "Please wait a minute before requesting another email." },
          { status: 429 }
        );
      }
    }

    // Generate new token
    const verificationToken = generateVerificationToken();
    const tokenExpiresAt = getTokenExpiryDate();

    // Update account with new token
    await db
      .update(customerAccounts)
      .set({
        verificationToken,
        tokenExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(customerAccounts.id, account.id));

    // Send the email
    await sendResendVerificationEmail(
      account.email,
      account.name || 'Customer',
      verificationToken
    );

    return NextResponse.json({
      message: "If an account with that email exists, a verification link has been sent.",
    });
  } catch (error) {
    console.error('Error resending verification:', error);
    return NextResponse.json(
      { message: 'Failed to resend verification email' },
      { status: 500 }
    );
  }
}
