'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

function AccountSetupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [alreadyVerified, setAlreadyVerified] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('No setup token provided. Please use the link from your email.');
        setIsValidating(false);
        return;
      }

      try {
        const response = await fetch(`/api/customer/setup-account?token=${token}`);
        const data = await response.json();

        if (data.valid) {
          setIsValid(true);
          setEmail(data.email);
          setName(data.name || '');
        } else if (data.alreadyVerified) {
          setAlreadyVerified(true);
          setEmail(data.email || '');
        } else {
          setError(data.message || 'Invalid or expired setup link.');
        }
      } catch {
        setError('Failed to validate setup link. Please try again.');
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/customer/setup-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
      } else {
        setError(data.message || 'Failed to set up account.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Validating your setup link...</p>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Account Set Up!</h1>
          <p className="text-muted-foreground mb-6">
            Your password has been set and your email has been verified.
            You can now log in to track your orders.
          </p>
          <Button
            onClick={() => router.push('/account/login')}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Already verified state
  if (alreadyVerified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <CheckCircle className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Already Set Up</h1>
          <p className="text-muted-foreground mb-6">
            This account ({email}) has already been set up. You can log in with your email and password.
          </p>
          <Button
            onClick={() => router.push('/account/login')}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Error state (invalid/expired token)
  if (!isValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Invalid Link</h1>
          <p className="text-muted-foreground mb-6">
            {error || 'This setup link is invalid or has expired.'}
          </p>
          <div className="space-y-3">
            <ResendButton />
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="w-full"
            >
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Setup form
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-md p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground">Set Up Your Account</h1>
          <p className="text-muted-foreground mt-2">
            {name ? `Welcome, ${name}! ` : ''}Create a password to access your account.
          </p>
        </div>

        <div className="bg-muted rounded-lg p-3 mb-6">
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="font-medium text-foreground">{email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-1">
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
              minLength={8}
            />
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Setting up...
              </>
            ) : (
              'Set Password & Verify Account'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

function ResendButton() {
  const [email, setEmailInput] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSending(true);
    try {
      await fetch('/api/customer/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <p className="text-sm text-green-600">
        If an account exists with that email, a new setup link has been sent.
      </p>
    );
  }

  if (!showForm) {
    return (
      <Button
        onClick={() => setShowForm(true)}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
      >
        Request New Setup Link
      </Button>
    );
  }

  return (
    <form onSubmit={handleResend} className="space-y-2">
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmailInput(e.target.value)}
        placeholder="Enter your email"
        required
      />
      <Button
        type="submit"
        disabled={sending}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
      >
        {sending ? 'Sending...' : 'Send New Link'}
      </Button>
    </form>
  );
}

export default function AccountSetupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg shadow-md p-8 max-w-md w-full text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <AccountSetupContent />
    </Suspense>
  );
}
