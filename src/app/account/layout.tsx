'use client';

import { usePathname } from 'next/navigation';
import { CustomerAuthProvider } from '@/lib/customer/auth-context';
import { CustomerAuthGuard } from './components/auth-guard';

// Pages that don't require authentication
const PUBLIC_PATHS = ['/account/login', '/account/setup'];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPublicPage = PUBLIC_PATHS.some(path => pathname.startsWith(path));

  // Public pages (login, setup) render without auth wrapper
  if (isPublicPage) {
    return <>{children}</>;
  }

  // Protected pages get the full auth context + guard
  return (
    <CustomerAuthProvider>
      <CustomerAuthGuard>
        {children}
      </CustomerAuthGuard>
    </CustomerAuthProvider>
  );
}
