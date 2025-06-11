import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronDown } from 'lucide-react';
import { scrollToSection } from '@/lib/scroll-utils';

export function StickyHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();

  // Track scroll position to add background on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle section scrolling and close mobile menu
  const handleScrollToSection = (sectionId: string) => {
    scrollToSection(sectionId);
    setIsMobileMenuOpen(false);
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-dark backdrop-blur-sm shadow-lg py-4' : 'bg-dark py-6'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="text-xl font-bold">
              <span className="text-white">ALLEY CAT</span>
              <span className="text-primary ml-1 hidden sm:inline font-semibold">
                DUMPSTER RENTAL
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            <button 
              onClick={() => scrollToSection('services')} 
              className="px-4 py-3 mx-1 rounded-md text-sm hover:text-white hover:bg-white/5 transition-all duration-300 cursor-pointer text-[#ffffff] text-center font-medium"
            >
              Services
            </button>
            <button 
              onClick={() => scrollToSection('about')} 
              className="px-4 py-3 mx-1 rounded-md text-sm hover:text-white hover:bg-white/5 transition-all duration-300 cursor-pointer text-[#ffffff] text-center font-medium"
            >
              About Us
            </button>
            <button 
              onClick={() => scrollToSection('faq')} 
              className="px-4 py-3 mx-1 rounded-md text-sm hover:text-white hover:bg-white/5 transition-all duration-300 cursor-pointer text-[#ffffff] text-center font-medium"
            >
              FAQ
            </button>
            <button 
              onClick={() => scrollToSection('contact')} 
              className="px-4 py-3 mx-1 rounded-md text-sm hover:text-white hover:bg-white/5 transition-all duration-300 cursor-pointer text-[#ffffff] text-center font-medium"
            >
              Contact
            </button>
            
            {user && (
              <Link href="/admin/dashboard" className="px-4 py-3 mx-1 rounded-md text-sm hover:text-white hover:bg-white/5 transition-all duration-300 cursor-pointer text-[#ffffff] text-center font-medium">
                Dashboard
              </Link>
            )}
          </nav>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Button 
              onClick={() => scrollToSection('booking-form')}
              size="lg"
              className="font-bold bg-[#f7c948] text-dark hover:bg-[#f8d468] px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            >
              RENT NOW
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-primary p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Menu Panel */}
          <div className="md:hidden fixed top-0 right-0 h-full w-80 bg-[#0f172a] shadow-lg z-50 slide-in-right">
            <div className="px-4 py-5">
              {/* Close button */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Menu</h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-white hover:text-primary p-2"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <nav className="flex flex-col space-y-4">
                <button onClick={() => handleScrollToSection('services')} className="text-left text-white hover:text-primary transition-colors py-2 text-lg font-medium">
                  Services
                </button>
                <button onClick={() => handleScrollToSection('about')} className="text-left text-white hover:text-primary transition-colors py-2 text-lg font-medium">
                  About Us
                </button>
                <button onClick={() => handleScrollToSection('faq')} className="text-left text-white hover:text-primary transition-colors py-2 text-lg font-medium">
                  FAQ
                </button>
                <button onClick={() => handleScrollToSection('contact')} className="text-left text-white hover:text-primary transition-colors py-2 text-lg font-medium">
                  Contact
                </button>
                
                {user && (
                  <MobileNavLink href="/admin/dashboard" label="Dashboard" onClick={() => setIsMobileMenuOpen(false)} />
                )}
                
                <div className="pt-4">
                  <Button 
                    onClick={() => handleScrollToSection('booking-form')}
                    className="w-full font-bold bg-white text-[#111827] hover:bg-gray-100 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    RENT NOW
                  </Button>
                </div>
              </nav>
            </div>
          </div>
        </>
      )}
    </header>
  );
}

// Mobile navigation link
function MobileNavLink({ 
  href, 
  label, 
  onClick 
}: { 
  href: string; 
  label: string; 
  onClick: () => void;
}) {
  return (
    <Link href={href}>
      <div 
        className="block px-4 py-3 text-base font-medium text-[#ffffff] hover:text-white hover:bg-white/5 rounded-lg transition-all duration-300 cursor-pointer"
        onClick={onClick}
      >
        {label}
      </div>
    </Link>
  );
}