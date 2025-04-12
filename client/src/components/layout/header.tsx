import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, X } from "lucide-react";

export function Header() {
  const { user, logoutMutation } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/">
          <a className="flex items-center space-x-2">
            <span className="text-primary font-bold text-2xl">DumpsterDirect</span>
          </a>
        </Link>
        
        <nav className="hidden md:flex space-x-8">
          <Link href="/">
            <a className="text-neutral-600 hover:text-primary font-medium">Home</a>
          </Link>
          <Link href="/#services">
            <a className="text-neutral-600 hover:text-primary font-medium">Services</a>
          </Link>
          <Link href="/#pricing">
            <a className="text-neutral-600 hover:text-primary font-medium">Pricing</a>
          </Link>
          <Link href="/#faq">
            <a className="text-neutral-600 hover:text-primary font-medium">FAQs</a>
          </Link>
          <Link href="/#contact">
            <a className="text-neutral-600 hover:text-primary font-medium">Contact</a>
          </Link>
        </nav>
        
        {user ? (
          user.isAdmin ? (
            <div className="hidden md:flex space-x-4">
              <Link href="/admin/dashboard">
                <a className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                  Admin Dashboard
                </a>
              </Link>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="text-sm"
              >
                Logout
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={handleLogout}
              className="hidden md:inline-flex text-sm"
            >
              Logout
            </Button>
          )
        ) : (
          <Link href="/auth">
            <a className="hidden md:inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              Admin Login
            </a>
          </Link>
        )}
        
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[80%] sm:w-[385px]">
            <div className="flex flex-col h-full">
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={closeMenu}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="flex flex-col space-y-4 mt-8">
                <Link href="/" onClick={closeMenu}>
                  <a className="text-xl font-medium py-2">Home</a>
                </Link>
                <Link href="/#services" onClick={closeMenu}>
                  <a className="text-xl font-medium py-2">Services</a>
                </Link>
                <Link href="/#pricing" onClick={closeMenu}>
                  <a className="text-xl font-medium py-2">Pricing</a>
                </Link>
                <Link href="/#faq" onClick={closeMenu}>
                  <a className="text-xl font-medium py-2">FAQs</a>
                </Link>
                <Link href="/#contact" onClick={closeMenu}>
                  <a className="text-xl font-medium py-2">Contact</a>
                </Link>
                
                {user ? (
                  <>
                    {user.isAdmin && (
                      <Link href="/admin/dashboard" onClick={closeMenu}>
                        <a className="text-xl font-medium text-primary py-2">Admin Dashboard</a>
                      </Link>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleLogout();
                        closeMenu();
                      }}
                      className="mt-4"
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <Link href="/auth" onClick={closeMenu}>
                    <a className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary mt-4">
                      Admin Login
                    </a>
                  </Link>
                )}
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
