'use client';

import { useEffect, useState } from 'react';
import { useCustomerAuth } from '@/lib/customer/auth-context';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  LogOut,
  Truck,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Mail,
  Phone,
  Building2,
  Package,
} from 'lucide-react';
import Link from 'next/link';

interface Booking {
  id: number;
  customerName: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryZipCode: string;
  deliveryDate: string;
  deliveryTimePreference: string;
  deliveryInstructions: string | null;
  placementLocation: string;
  totalPrice: number;
  paymentStatus: string;
  status: string;
  rentalDays: number | null;
  bookingPricingMode: string | null;
  createdAt: string;
  dumpsterName: string | null;
  dumpsterDimensions: string | null;
  serviceZoneName: string | null;
  pricingDays: number | null;
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'confirmed':
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'completed':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function getPaymentBadgeClass(status: string): string {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'failed':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function CustomerDashboard() {
  const { customer, logout } = useCustomerAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch('/api/customer/bookings', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setBookings(data.bookings);
        } else {
          setError('Failed to load bookings.');
        }
      } catch {
        setError('Something went wrong loading your bookings.');
      } finally {
        setIsLoadingBookings(false);
      }
    };

    fetchBookings();
  }, []);

  const activeBookings = bookings.filter(
    (b) => b.status === 'pending' || b.status === 'confirmed' || b.status === 'active'
  );
  const pastBookings = bookings.filter(
    (b) => b.status === 'completed' || b.status === 'cancelled'
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {customer?.name ? `Welcome, ${customer.name}` : 'My Account'}
            </h1>
            <p className="text-sm text-muted-foreground">{customer?.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="outline" size="sm">
                Back to Site
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-1.5" />
              Log Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Profile Card */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm text-foreground">{customer?.email}</p>
              </div>
            </div>
            {customer?.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm text-foreground">{customer.phone}</p>
                </div>
              </div>
            )}
            {customer?.companyName && (
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Company</p>
                  <p className="text-sm text-foreground">{customer.companyName}</p>
                </div>
              </div>
            )}
            {customer?.name && (
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="text-sm text-foreground">{customer.name}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active Bookings */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Active Rentals
            {activeBookings.length > 0 && (
              <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
                {activeBookings.length}
              </span>
            )}
          </h2>

          {isLoadingBookings ? (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading bookings...</p>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          ) : activeBookings.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <Package className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No active rentals</p>
              <Link href="/booking">
                <Button className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">
                  Book a Dumpster
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {activeBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </div>

        {/* Past Bookings */}
        {pastBookings.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Past Bookings
            </h2>
            <div className="space-y-3">
              {pastBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} compact />
              ))}
            </div>
          </div>
        )}

        {/* Book Again CTA */}
        {bookings.length > 0 && (
          <div className="text-center pt-4">
            <Link href="/booking">
              <Button variant="outline" size="lg">
                Book Another Dumpster
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

function BookingCard({ booking, compact }: { booking: Booking; compact?: boolean }) {
  const days = booking.rentalDays || booking.pricingDays;

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {booking.dumpsterName && (
              <span className="font-semibold text-foreground">{booking.dumpsterName}</span>
            )}
            {days && (
              <span className="text-xs text-muted-foreground">
                ({days} day{days !== 1 ? 's' : ''})
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Booking #{booking.id}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${getStatusBadgeClass(booking.status)}`}>
            {booking.status}
          </span>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${getPaymentBadgeClass(booking.paymentStatus)}`}>
            {booking.paymentStatus}
          </span>
        </div>
      </div>

      {!compact && (
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-foreground">{booking.deliveryAddress}</p>
              <p className="text-muted-foreground">{booking.deliveryCity}, {booking.deliveryZipCode}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-foreground">{formatDate(booking.deliveryDate)}</p>
              <p className="text-muted-foreground capitalize">{booking.deliveryTimePreference} delivery</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <p className="text-foreground font-medium">${(booking.totalPrice / 100).toFixed(2)}</p>
          </div>
          {booking.serviceZoneName && (
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <p className="text-muted-foreground">{booking.serviceZoneName}</p>
            </div>
          )}
        </div>
      )}

      {compact && (
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span>{formatDate(booking.deliveryDate)}</span>
          <span>{booking.deliveryAddress}, {booking.deliveryCity}</span>
          <span className="font-medium text-foreground">${(booking.totalPrice / 100).toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}
