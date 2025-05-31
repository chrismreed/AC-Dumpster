import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
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
  Settings
} from "lucide-react";
import { Button } from "./button";

export function AdminNav() {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();

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
      title: "Zone Map",
      href: "/admin/zones-map",
      icon: <Globe className="mr-2 h-4 w-4" />
    },
    {
      title: "New Zones Layout",
      href: "/admin/zones-new",
      icon: <Settings className="mr-2 h-4 w-4" />
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
    <aside className="bg-white w-64 min-h-screen hidden md:block shadow-sm border-r">
      <div className="p-6">
        <h1 className="text-xl font-bold text-white">DumpsterDirect</h1>
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
                ? "bg-gray-200 bg-opacity-15 text-gray-800 font-medium"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            {item.icon}
            {item.title}
          </Link>
        ))}
      </nav>
      <div className="px-6 py-6 mt-auto border-t w-full fixed bottom-0 left-0 md:w-64 bg-white">
        <div className="flex flex-col space-y-2">
          <Link 
            href="/"
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <Home className="mr-2 h-4 w-4" />
            Back to Website
          </Link>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="flex items-center justify-start text-sm text-gray-600 hover:text-red-500 px-0"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </aside>
  );
}
