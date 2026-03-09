'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const routeNames: Record<string, string> = {
  admin: 'Dashboard',
  bookings: 'Bookings',
  customers: 'Customers',
  services: 'Services',
  credits: 'Credits',
  dumpsters: 'Dumpsters',
  fleet: 'Fleet',
  loads: 'Loads',
  zones: 'Zones',
  hubs: 'Hubs',
  'legal-documents': 'Legal',
  settings: 'Settings',
  profile: 'Profile',
  'add-ons': 'Add-ons',
  swaps: 'Swap Requests',
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const paths = pathname.split('/').filter(Boolean);

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        <li>
          <div className="flex items-center">
            <Link
              href="/admin"
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <Home className="h-4 w-4 flex-shrink-0" />
              <span className="sr-only">Home</span>
            </Link>
          </div>
        </li>
        {paths.map((path, index) => {
          if (path === 'admin' && index === 0) return null;
          
          const href = `/${paths.slice(0, index + 1).join('/')}`;
          const isLast = index === paths.length - 1;
          const name = routeNames[path] || path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');

          return (
            <li key={path}>
              <div className="flex items-center">
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-300 mx-1" />
                <Link
                  href={href}
                  className={`text-sm font-medium transition-colors max-w-[120px] truncate ${
                    isLast
                      ? 'text-gray-900 cursor-default'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  aria-current={isLast ? 'page' : undefined}
                  title={name}
                >
                  {name}
                </Link>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
