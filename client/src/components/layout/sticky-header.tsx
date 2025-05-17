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
              className="font-bold bg-primary text-dark hover:bg-[#fde68a] px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
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
        <div className="md:hidden bg-[#0f172a]/95 shadow-lg backdrop-blur-sm border-t border-[#d1d5db]">
          <div className="container mx-auto px-4 py-5">
            <nav className="flex flex-col space-y-4">
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
              
              <div className="pt-4">
                <Button 
                  asChild 
                  className="w-full font-bold bg-primary text-[#111827] hover:bg-[#eab308] py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
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
        className={`px-4 py-3 mx-1 rounded-md text-sm font-medium hover:text-[#facc15] hover:bg-white/5 transition-all duration-300 cursor-pointer ${
          isActive 
            ? 'text-[#facc15] font-semibold' 
            : isScrolled 
              ? 'text-[#ffffff]' 
              : 'text-[#ffffff]'
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
        className="block px-4 py-3 text-base font-medium text-[#ffffff] hover:text-[#facc15] hover:bg-white/5 rounded-lg transition-all duration-300 cursor-pointer"
        onClick={onClick}
      >
        {label}
      </div>
    </Link>
  );
}