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
    <header className="bg-[#2c2c2c] sticky top-0 z-50">
      {/* Top yellow bar with contact info */}
      <div className="bg-[#ffdd33] py-2 px-4 text-black flex justify-center md:justify-between">
        <div className="container mx-auto flex flex-col md:flex-row justify-center md:justify-between items-center">
          <a href="tel:+12179942582" className="text-sm font-medium flex items-center">
            <span className="mr-2">📞</span> 217-994-2582
          </a>
          <a href="mailto:alleycatdumpsters@gmail.com" className="text-sm font-medium flex items-center">
            <span className="mr-2">✉️</span> alleycatdumpsters@gmail.com
          </a>
        </div>
      </div>
      
      {/* Main navigation */}
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/">
          <a className="flex flex-col items-start">
            <span className="text-[#ffdd33] font-bold text-2xl tracking-wide">ALLEY CAT</span>
            <span className="text-[#ffdd33] text-xs font-medium">DUMPSTER RENTAL</span>
          </a>
        </Link>
        
        <nav className="hidden md:flex space-x-6">
          <Link href="/#pricing">
            <a className="text-[#ffdd33] hover:text-white font-medium uppercase">Pricing</a>
          </Link>
          <Link href="/#faq">
            <a className="text-[#ffdd33] hover:text-white font-medium uppercase">FAQ</a>
          </Link>
          <Link href="/#contact">
            <a className="text-[#ffdd33] hover:text-white font-medium uppercase">Contact</a>
          </Link>
          <Link href="/#about">
            <a className="text-[#ffdd33] hover:text-white font-medium uppercase">About</a>
          </Link>
        </nav>
        
        {user && user.isAdmin ? (
          <div className="hidden md:flex space-x-4">
            <Link href="/admin/dashboard">
              <a className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-sm text-sm font-medium text-[#2c2c2c] bg-[#ffdd33] hover:bg-[#ffd700] focus:outline-none">
                Admin Dashboard
              </a>
            </Link>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="text-sm text-[#ffdd33] border-[#ffdd33]"
            >
              Logout
            </Button>
          </div>
        ) : (
          <Link href="/#rent">
            <a className="hidden md:inline-flex items-center justify-center px-6 py-2 border border-transparent rounded-sm text-sm font-bold text-[#2c2c2c] bg-[#ffdd33] hover:bg-[#ffd700] focus:outline-none uppercase">
              Rent Now
            </a>
          </Link>
        )}
        
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="md:hidden text-[#ffdd33]">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[80%] sm:w-[385px] bg-[#2c2c2c] border-l border-[#ffdd33] text-white">
            <div className="flex flex-col h-full">
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={closeMenu} className="text-[#ffdd33]">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="flex flex-col space-y-4 mt-8">
                <Link href="/" onClick={closeMenu}>
                  <a className="text-lg font-medium py-2 text-[#ffdd33]">HOME</a>
                </Link>
                <Link href="/#pricing" onClick={closeMenu}>
                  <a className="text-lg font-medium py-2 text-[#ffdd33]">PRICING</a>
                </Link>
                <Link href="/#faq" onClick={closeMenu}>
                  <a className="text-lg font-medium py-2 text-[#ffdd33]">FAQ</a>
                </Link>
                <Link href="/#contact" onClick={closeMenu}>
                  <a className="text-lg font-medium py-2 text-[#ffdd33]">CONTACT</a>
                </Link>
                <Link href="/#about" onClick={closeMenu}>
                  <a className="text-lg font-medium py-2 text-[#ffdd33]">ABOUT</a>
                </Link>
                
                {user && user.isAdmin ? (
                  <>
                    <Link href="/admin/dashboard" onClick={closeMenu}>
                      <a className="text-lg font-medium text-[#ffdd33] py-2">ADMIN DASHBOARD</a>
                    </Link>
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleLogout();
                        closeMenu();
                      }}
                      className="mt-4 text-[#ffdd33] border-[#ffdd33]"
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <Link href="/#rent" onClick={closeMenu}>
                    <a className="inline-flex items-center justify-center px-6 py-2 border border-transparent rounded-sm text-sm font-bold text-[#2c2c2c] bg-[#ffdd33] hover:bg-[#ffd700] focus:outline-none uppercase mt-4">
                      Rent Now
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
