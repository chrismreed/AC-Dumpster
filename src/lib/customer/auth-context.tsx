'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface CustomerUser {
  id: number;
  email: string;
  name: string | null;
  companyName: string | null;
  isBusinessAccount: boolean | null;
  phone: string | null;
}

interface CustomerAuthContextType {
  customer: CustomerUser | null;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check session on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/customer/me', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setCustomer(data);
      }
    } catch (error) {
      console.error('Customer auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/customer/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setCustomer(null);
      router.push('/account/login');
    }
  };

  return (
    <CustomerAuthContext.Provider value={{ customer, logout, isLoading }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (context === undefined) {
    throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  }
  return context;
}
