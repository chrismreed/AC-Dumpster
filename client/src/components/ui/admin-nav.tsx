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
  X,
  FileText,
  Shield,
  Wrench,
  RefreshCw
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
      title: "Hub Locations",
      href: "/admin/hubs",
      icon: <Map className="mr-2 h-4 w-4" />
    },
    {
      title: "Services",
      href: "/admin/services",
      icon: <Wrench className="mr-2 h-4 w-4" />
    },
    {
      title: "Bookings",
      href: "/admin/bookings",
      icon: <Calendar className="mr-2 h-4 w-4" />
    },
    {
      title: "Swap Requests",
      href: "/admin/swap-requests",
      icon: <RefreshCw className="mr-2 h-4 w-4" />
    },
    {
      title: "Payment Settings",
      href: "/admin/payment-settings",
      icon: <CreditCard className="mr-2 h-4 w-4" />
    },
    {
      title: "Legal Documents",
      href: "/admin/legal-documents",
      icon: <FileText className="mr-2 h-4 w-4" />
    },
    {
      title: "Business Settings",
      href: "/admin/settings",
      icon: <Settings className="mr-2 h-4 w-4" />
    },
    {
      title: "Account Settings",
      href: "/admin/security",
      icon: <Shield className="mr-2 h-4 w-4" />
    },
    {
      title: "Logout",
      href: "#",
      icon: <LogOut className="mr-2 h-4 w-4" />,
      onClick: () => logoutMutation.mutate()
    }
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b px-3 py-2 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900">DumpsterDirect</h1>
          <p className="text-xs text-gray-500">Admin Dashboard</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1 h-8 w-8"
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}>
          <div 
            className="bg-white w-64 h-full shadow-lg ml-auto transform transition-transform duration-300 ease-in-out" 
            onClick={(e) => e.stopPropagation()}
            style={{
              animation: isMobileMenuOpen ? 'slideInRight 0.3s ease-out' : 'slideOutRight 0.3s ease-in'
            }}
          >
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-lg font-bold text-gray-900">DumpsterDirect</h1>
                  <p className="text-sm text-gray-500">Admin Dashboard</p>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-600 hover:text-gray-900 p-2"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <nav className="mt-1">
              {navItems.map((item, index) => (
                item.onClick ? (
                  <button
                    key={index}
                    onClick={() => {
                      item.onClick();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 active:bg-gray-100"
                  >
                    {item.icon}
                    {item.title}
                  </button>
                ) : (
                  <Link 
                    href={item.href} 
                    key={index}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center px-3 py-2.5 text-sm active:bg-gray-100",
                      location === item.href
                        ? "bg-gray-100 text-gray-900 font-medium"
                        : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {item.icon}
                    {item.title}
                  </Link>
                )
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
            item.onClick ? (
              <button
                key={index}
                onClick={item.onClick}
                className="w-full flex items-center px-6 py-3 text-sm text-gray-600 hover:bg-gray-50"
              >
                {item.icon}
                {item.title}
              </button>
            ) : (
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
            )
          ))}
        </nav>
      </aside>
    </>
  );
}
