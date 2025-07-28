import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronDown } from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { scrollToSection } from '@/lib/scroll-utils';
import logoImage from "@assets/ACD Logo_1749926708871.png";

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
        isScrolled ? 'bg-[#0f172a] shadow-lg py-4' : 'bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] py-6'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img 
              src={logoImage} 
              alt="Alley Cat Dumpster Rental" 
              className="h-16 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-[#ffffff] hover:text-white hover:bg-white/5 data-[state=open]:bg-white/5 data-[active]:bg-white/5">
                    Services
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid gap-3 p-6 w-[400px] lg:w-[500px] lg:grid-cols-2">
                      <div className="row-span-3">
                        <NavigationMenuLink asChild>
                          <Link
                            className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-[#f7c948]/20 to-[#f7c948]/40 p-6 no-underline outline-none focus:shadow-md"
                            href="/services"
                          >
                            <div className="mb-2 mt-4 text-lg font-medium">
                              All Services
                            </div>
                            <p className="text-sm leading-tight text-muted-foreground">
                              Complete overview of our dumpster rental solutions
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </div>
                      <NavigationMenuLink asChild>
                        <Link href="/services/residential" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div className="text-sm font-medium leading-none">Residential</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Home cleanouts and renovations
                          </p>
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link href="/services/construction" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div className="text-sm font-medium leading-none">Construction</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Commercial and demolition projects
                          </p>
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link href="/services/landscaping" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div className="text-sm font-medium leading-none">Landscaping</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Yard waste and organic debris
                          </p>
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link href="/services/renovation" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div className="text-sm font-medium leading-none">Renovation</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Kitchen, bathroom, and home remodels
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            
            <Link 
              href="/about"
              className="px-4 py-3 mx-1 rounded-md text-sm hover:text-white hover:bg-white/5 transition-all duration-300 cursor-pointer text-[#ffffff] text-center font-medium"
            >
              About Us
            </Link>
            <Link 
              href="/faq"
              className="px-4 py-3 mx-1 rounded-md text-sm hover:text-white hover:bg-white/5 transition-all duration-300 cursor-pointer text-[#ffffff] text-center font-medium"
            >
              FAQ
            </Link>
            <Link 
              href="/contact"
              className="px-4 py-3 mx-1 rounded-md text-sm hover:text-white hover:bg-white/5 transition-all duration-300 cursor-pointer text-[#ffffff] text-center font-medium"
            >
              Contact
            </Link>
            
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

      {/* Mobile Menu Portal - Completely isolated */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-[100]" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Menu Panel - Completely isolated with its own stacking context */}
          <div 
            className="fixed top-0 right-0 h-screen w-80 z-[101] slide-in-right"
            style={{ 
              backgroundColor: '#0f172a',
              boxShadow: '-4px 0 8px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div 
              className="w-full h-full px-4 py-5 overflow-y-auto"
              style={{ backgroundColor: '#0f172a' }}
            >
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
                {/* Services with dropdown */}
                <div>
                  <MobileNavLink href="/services" label="Services" onClick={() => setIsMobileMenuOpen(false)} />
                  <div className="ml-4 mt-2 space-y-2">
                    <MobileNavLink href="/services/residential" label="→ Residential" onClick={() => setIsMobileMenuOpen(false)} />
                    <MobileNavLink href="/services/construction" label="→ Construction" onClick={() => setIsMobileMenuOpen(false)} />
                    <MobileNavLink href="/services/landscaping" label="→ Landscaping" onClick={() => setIsMobileMenuOpen(false)} />
                    <MobileNavLink href="/services/renovation" label="→ Renovation" onClick={() => setIsMobileMenuOpen(false)} />
                  </div>
                </div>
                
                <MobileNavLink href="/about" label="About Us" onClick={() => setIsMobileMenuOpen(false)} />
                <MobileNavLink href="/faq" label="FAQ" onClick={() => setIsMobileMenuOpen(false)} />
                <MobileNavLink href="/contact" label="Contact" onClick={() => setIsMobileMenuOpen(false)} />
                
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
        </div>
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
        className="block px-2 py-2 text-base font-medium text-[#ffffff] hover:text-white hover:bg-white/5 rounded-lg transition-all duration-300 cursor-pointer"
        onClick={onClick}
      >
        {label}
      </div>
    </Link>
  );
}