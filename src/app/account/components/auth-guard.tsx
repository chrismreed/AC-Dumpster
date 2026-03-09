'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomerAuth } from '@/lib/customer/auth-context';
import { Loader2 } from 'lucide-react';

export function CustomerAuthGuard({ children }: { children: React.ReactNode }) {
  const { customer, isLoading } = useCustomerAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !customer) {
      router.push('/account/login');
    }
  }, [isLoading, customer, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  return <>{children}</>;
}
