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

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="text-xl font-bold">
              <span className="text-primary">ALLEY CAT</span>
              <span className={`${isScrolled ? 'text-neutral-800' : 'text-white'} ml-1 hidden sm:inline`}>
                DUMPSTER RENTAL
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavLink href="/" label="Home" isActive={location === '/'} isScrolled={isScrolled} />
            <NavLink href="/#services" label="Services" isScrolled={isScrolled} />
            <NavLink href="/#how-it-works" label="How It Works" isScrolled={isScrolled} />
            <NavLink href="/#about" label="About Us" isScrolled={isScrolled} />
            <NavLink href="/#testimonials" label="Testimonials" isScrolled={isScrolled} />
            <NavLink href="/#faq" label="FAQ" isScrolled={isScrolled} />
            <NavLink href="/#contact" label="Contact" isScrolled={isScrolled} />
            
            {user && (
              <NavLink href="/admin/dashboard" label="Dashboard" isActive={location.startsWith('/admin')} isScrolled={isScrolled} />
            )}
          </nav>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Button 
              asChild 
              size="lg"
              className="font-bold"
            >
              <a href="#booking-form">RENT NOW</a>
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
        <div className="md:hidden bg-white shadow-lg">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex flex-col space-y-3">
              <MobileNavLink href="/" label="Home" onClick={() => setIsMobileMenuOpen(false)} />
              <MobileNavLink href="/#services" label="Services" onClick={() => setIsMobileMenuOpen(false)} />
              <MobileNavLink href="/#how-it-works" label="How It Works" onClick={() => setIsMobileMenuOpen(false)} />
              <MobileNavLink href="/#about" label="About Us" onClick={() => setIsMobileMenuOpen(false)} />
              <MobileNavLink href="/#testimonials" label="Testimonials" onClick={() => setIsMobileMenuOpen(false)} />
              <MobileNavLink href="/#faq" label="FAQ" onClick={() => setIsMobileMenuOpen(false)} />
              <MobileNavLink href="/#contact" label="Contact" onClick={() => setIsMobileMenuOpen(false)} />
              
              {user && (
                <MobileNavLink href="/admin/dashboard" label="Dashboard" onClick={() => setIsMobileMenuOpen(false)} />
              )}
              
              <div className="pt-2">
                <Button 
                  asChild 
                  className="w-full font-bold"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <a href="#booking-form">RENT NOW</a>
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
        className={`px-3 py-2 rounded-md text-sm font-medium hover:text-primary transition-colors cursor-pointer ${
          isActive 
            ? 'text-primary' 
            : isScrolled 
              ? 'text-neutral-800' 
              : 'text-white'
        }`}
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
        className="block px-3 py-2 text-base font-medium text-neutral-800 hover:text-primary hover:bg-neutral-50 rounded-md transition-colors cursor-pointer"
        onClick={onClick}
      >
        {label}
      </div>
    </Link>
  );
}