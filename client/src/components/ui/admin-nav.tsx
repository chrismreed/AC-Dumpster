import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import {
  LayoutDashboard,
  Trash2,
  PlusCircle,
  MapPin,
  Calendar,
  LogOut,
  Home,
  Map,
  Globe,
  CreditCard,
  Settings,
  Menu,
  X
} from "lucide-react";
import { Button } from "./button";

export function AdminNav() {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: <LayoutDashboard className="mr-2 h-4 w-4" />
    },
    {
      title: "Dumpsters",
      href: "/admin/dumpsters",
      icon: <Trash2 className="mr-2 h-4 w-4" />
    },
    {
      title: "Add-ons",
      href: "/admin/add-ons",
      icon: <PlusCircle className="mr-2 h-4 w-4" />
    },
    {
      title: "Service Zones",
      href: "/admin/zones",
      icon: <MapPin className="mr-2 h-4 w-4" />
    },
    {
      title: "Bookings",
      href: "/admin/bookings",
      icon: <Calendar className="mr-2 h-4 w-4" />
    },

    {
      title: "Payment Settings",
      href: "/admin/payment-settings",
      icon: <CreditCard className="mr-2 h-4 w-4" />
    }
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">DumpsterDirect</h1>
          <p className="text-xs text-gray-500">Admin Dashboard</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="bg-white w-64 h-full shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b">
              <h1 className="text-lg font-bold text-gray-900">DumpsterDirect</h1>
              <p className="text-sm text-gray-500">Admin Dashboard</p>
            </div>
            <nav className="mt-2">
              {navItems.map((item, index) => (
                <Link 
                  href={item.href} 
                  key={index}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm",
                    location === item.href
                      ? "bg-gray-100 text-gray-900 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {item.icon}
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="bg-white w-64 min-h-screen hidden lg:block shadow-sm border-r">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900">DumpsterDirect</h1>
          <p className="text-sm text-gray-500 mt-1">Admin Dashboard</p>
        </div>
        <nav className="mt-4">
          {navItems.map((item, index) => (
            <Link 
              href={item.href} 
              key={index}
              className={cn(
                "flex items-center px-6 py-3 text-sm z-10 relative",
                location === item.href
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              {item.icon}
              {item.title}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
