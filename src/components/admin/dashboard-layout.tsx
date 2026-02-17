'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminAuth } from '@/lib/admin/auth-context';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from './breadcrumbs';
import { useQueryClient } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  Wrench,
  CreditCard,
  LogOut,
  Menu,
  X,
  Truck,
  MapPin,
  FileText,
  User,
  Target,
  Weight,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Package,
  RefreshCw,
  Banknote,
  ClipboardList,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigationGroups = [
  {
    title: 'Main',
    items: [
      { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, queryKey: ['admin-bookings', 'admin-customers'] },
      { name: 'Bookings', href: '/admin/bookings', icon: Calendar, queryKey: ['admin-bookings'] },
      { name: 'Jobs', href: '/admin/jobs', icon: ClipboardList, queryKey: ['admin-jobs'] },
      { name: 'Customers', href: '/admin/customers', icon: Users, queryKey: ['admin-customers'] },
    ]
  },
  {
    title: 'Operations',
    items: [
      { name: 'Services', href: '/admin/services', icon: Wrench, queryKey: ['admin-services'] },
      { name: 'Service Requests', href: '/admin/service-requests', icon: FileText, queryKey: ['service-responses'] },
      { name: 'Add-ons', href: '/admin/add-ons', icon: PlusCircle, queryKey: ['admin-add-ons'] },
      { name: 'Loads', href: '/admin/loads', icon: Weight },
      { name: 'Swaps', href: '/admin/swap-requests', icon: Package },
    ]
  },
  {
    title: 'Inventory & Fleet',
    items: [
      { name: 'Dumpster Management', href: '/admin/dumpsters', icon: Truck },
      { name: 'Hubs', href: '/admin/hubs', icon: MapPin },
      { name: 'Zones', href: '/admin/zones', icon: Target },
    ]
  },
  {
    title: 'System',
    items: [
      { name: 'Credits', href: '/admin/credits', icon: CreditCard },
      { name: 'Legal', href: '/admin/legal-documents', icon: FileText },
      { name: 'Settings', href: '/admin/settings', icon: Settings },
    ]
  }
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAdminAuth();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  // Load collapse state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('adminSidebarCollapsed');
    if (saved) setIsCollapsed(JSON.parse(saved));
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('adminSidebarCollapsed', JSON.stringify(newState));
  };

  const prefetchData = (keys?: string[]) => {
    if (!keys) return;

    keys.forEach(key => {
      if (key === 'admin-bookings') {
        queryClient.prefetchQuery({
          queryKey: ['admin-bookings'],
          queryFn: async () => {
            const res = await fetch('/api/admin/bookings');
            return res.json();
          }
        });
      }
      if (key === 'admin-customers') {
        queryClient.prefetchQuery({
          queryKey: ['admin-customers'],
          queryFn: async () => {
            const res = await fetch('/api/admin/customer-accounts');
            return res.json();
          }
        });
      }
      // Add more as needed
    });
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="light min-h-screen bg-gray-50 flex overflow-x-hidden w-full" style={{ colorScheme: 'light' }}>
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed left-0 top-0 bottom-0 w-[85vw] max-w-xs bg-white shadow-2xl transition-transform duration-300 ease-in-out">
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100">
            <div className="flex items-center">
              <div className="bg-yellow-500 p-1.5 rounded-lg mr-3">
                <Truck className="h-6 w-6 text-black" />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">Alley Cat</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="mt-6 px-4 pb-4 overflow-y-auto max-h-[calc(100vh-120px)]">
            {navigationGroups.map((group) => (
              <div key={group.title} className="mb-6">
                <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {group.title}
                </h3>
                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={`flex items-center px-3 py-3 min-h-[44px] rounded-xl text-sm font-medium transition-all group ${isActive
                            ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                          onClick={() => setSidebarOpen(false)}
                          onMouseEnter={() => prefetchData((item as any).queryKey)}
                          onTouchStart={() => prefetchData((item as any).queryKey)}
                        >
                          <item.icon className={`h-5 w-5 mr-3 ${isActive ? 'text-black' : 'text-gray-400 group-hover:text-gray-600'}`} />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div
        className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:flex-col transition-all duration-300 ease-in-out z-30 shadow-xl bg-white border-r border-gray-100 ${isCollapsed ? 'lg:w-20' : 'lg:w-64'
          }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100 shrink-0">
          {!isCollapsed && (
            <div className="flex items-center overflow-hidden">
              <div className="bg-yellow-500 p-1.5 rounded-lg mr-3 shrink-0">
                <Truck className="h-5 w-5 text-black" />
              </div>
              <span className="text-lg font-bold text-gray-900 tracking-tight whitespace-nowrap">Alley Cat</span>
            </div>
          )}
          {isCollapsed && (
            <div className="mx-auto bg-yellow-500 p-1.5 rounded-lg shrink-0 scale-110">
              <Truck className="h-5 w-5 text-black" />
            </div>
          )}
        </div>

        <nav className="flex-1 mt-6 px-3 overflow-y-auto no-scrollbar">
          {navigationGroups.map((group) => (
            <div key={group.title} className="mb-6 last:mb-20">
              {!isCollapsed && (
                <h3 className="px-3 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                  {group.title}
                </h3>
              )}
              {isCollapsed && <div className="h-px bg-gray-100 mx-2 mb-4" />}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        title={isCollapsed ? item.name : undefined}
                        className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${isActive
                          ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                        onMouseEnter={() => prefetchData((item as any).queryKey)}
                        onTouchStart={() => prefetchData((item as any).queryKey)}
                      >
                        <item.icon className={`h-5 w-5 shrink-0 ${isCollapsed ? 'mx-auto' : 'mr-3'} ${isActive ? 'text-black' : 'text-gray-400 group-hover:text-gray-600'}`} />
                        {!isCollapsed && <span className="truncate">{item.name}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          {!isCollapsed ? (
            <div className="space-y-4">
              <div className="flex items-center px-2 py-1">
                <div className="h-9 w-9 rounded-full bg-yellow-100 border-2 border-yellow-200 flex items-center justify-center text-yellow-700 font-bold shrink-0">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3 overflow-hidden">
                  <p className="text-sm font-bold text-gray-900 truncate tracking-tight">{user?.username}</p>
                  <p className="text-[10px] text-gray-500 truncate uppercase tracking-wider">{user?.email}</p>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="w-full justify-start rounded-xl border-gray-200 hover:bg-white hover:text-red-600 hover:border-red-200 transition-all font-semibold"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="rounded-xl h-10 w-10 text-gray-400 hover:text-red-600 hover:bg-red-50"
                title="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={toggleCollapse}
          className="absolute -right-3 top-20 bg-white border border-gray-100 shadow-md rounded-full p-1 text-gray-400 hover:text-gray-900 hover:scale-110 transition-all hidden lg:block"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Main content */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'} min-w-0 w-full`}>
        {/* Top bar (Mobile & Desktop) */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 h-16 w-full">
          <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden rounded-lg"
              >
                <Menu className="h-6 w-6" />
              </Button>

              {/* Desktop Breadcrumbs */}
              <div className="hidden lg:block">
                <Breadcrumbs />
              </div>

              {/* Mobile Mobile Logo */}
              <div className="flex lg:hidden items-center">
                <div className="bg-yellow-500 p-1 rounded-md mr-2">
                  <Truck className="h-5 w-5 text-black" />
                </div>
                <span className="font-bold text-gray-900">Alley Cat</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-xs font-bold text-gray-900">{user?.username}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-tighter">Admin</span>
              </div>
              <div className="h-9 w-9 sm:h-8 sm:w-8 rounded-full bg-yellow-500 flex items-center justify-center font-bold text-black border-2 border-yellow-200">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-[calc(100vh-64px)] w-full overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}
