import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronDown } from 'lucide-react';

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

  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 80; // Account for fixed header
      const elementPosition = element.offsetTop;
      const offsetPosition = elementPosition - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
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
          <nav className="hidden md:flex items-center space-x-1">
            <button onClick={() => scrollToSection('services')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isScrolled ? 'text-white hover:bg-white/10' : 'text-white hover:bg-white/10'}`}>
              Services
            </button>
            <button onClick={() => scrollToSection('about')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isScrolled ? 'text-white hover:bg-white/10' : 'text-white hover:bg-white/10'}`}>
              About Us
            </button>
            <button onClick={() => scrollToSection('faq')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isScrolled ? 'text-white hover:bg-white/10' : 'text-white hover:bg-white/10'}`}>
              FAQ
            </button>
            <button onClick={() => scrollToSection('contact')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isScrolled ? 'text-white hover:bg-white/10' : 'text-white hover:bg-white/10'}`}>
              Contact
            </button>
            
            {user && (
              <NavLink href="/admin/dashboard" label="Dashboard" isActive={location.startsWith('/admin')} isScrolled={isScrolled} />
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
        <div className="md:hidden bg-[#0f172a]/95 shadow-lg backdrop-blur-sm border-t border-[#d1d5db]">
          <div className="container mx-auto px-4 py-5">
            <nav className="flex flex-col space-y-4">
              <button onClick={() => scrollToSection('services')} className="text-left text-white hover:text-primary transition-colors py-2 text-lg font-medium">
                Services
              </button>
              <button onClick={() => scrollToSection('about')} className="text-left text-white hover:text-primary transition-colors py-2 text-lg font-medium">
                About Us
              </button>
              <button onClick={() => scrollToSection('faq')} className="text-left text-white hover:text-primary transition-colors py-2 text-lg font-medium">
                FAQ
              </button>
              <button onClick={() => scrollToSection('contact')} className="text-left text-white hover:text-primary transition-colors py-2 text-lg font-medium">
                Contact
              </button>
              
              {user && (
                <MobileNavLink href="/admin/dashboard" label="Dashboard" onClick={() => setIsMobileMenuOpen(false)} />
              )}
              
              <div className="pt-4">
                <Button 
                  onClick={() => scrollToSection('booking-form')}
                  className="w-full font-bold bg-white text-[#111827] hover:bg-gray-100 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                >
                  RENT NOW
                </Button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

// Desktop navigation link
function NavLink({ 
  href, 
  label, 
  isActive = false, 
  isScrolled = false 
}: { 
  href: string; 
  label: string; 
  isActive?: boolean; 
  isScrolled: boolean;
}) {
  return (
    <Link href={href}>
      <div 
        className="px-4 py-3 mx-1 rounded-md text-sm hover:text-white hover:bg-white/5 transition-all duration-300 cursor-pointer text-[#ffffff] text-center font-medium"
      >
        {label}
      </div>
    </Link>
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