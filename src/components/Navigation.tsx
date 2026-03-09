'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Phone } from 'lucide-react';

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-50 transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <span className="text-2xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors">Alley Cat Dumpsters</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            <Link href="/" className="text-muted-foreground hover:text-primary font-medium transition-colors whitespace-nowrap">
              Home
            </Link>
            <Link href="/services" className="text-muted-foreground hover:text-primary font-medium transition-colors whitespace-nowrap">
              Services
            </Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-primary font-medium transition-colors whitespace-nowrap">
              Pricing
            </Link>
            <Link href="/contact" className="text-muted-foreground hover:text-primary font-medium transition-colors whitespace-nowrap">
              Contact
            </Link>
            <a href="tel:217-994-2582" className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">
              <Phone className="h-4 w-4" />
              <span className="font-bold">217-994-2582</span>
            </a>
            <Link
              href="/booking"
              className="px-6 py-2 bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 btn-angled whitespace-nowrap"
            >
              <span className="inline-block">Book Now</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-foreground hover:text-primary transition-colors"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border py-4 space-y-4 animate-in slide-in-from-top-5">
            <Link
              href="/"
              className="block text-foreground hover:text-primary font-medium transition-colors px-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/services"
              className="block text-foreground hover:text-primary font-medium transition-colors px-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Services
            </Link>
            <Link
              href="/pricing"
              className="block text-foreground hover:text-primary font-medium transition-colors px-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/contact"
              className="block text-foreground hover:text-primary font-medium transition-colors px-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            <a
              href="tel:217-994-2582"
              className="flex items-center space-x-2 text-foreground hover:text-primary font-bold px-2"
            >
              <Phone className="h-4 w-4" />
              <span>217-994-2582</span>
            </a>
            <Link
              href="/booking"
              className="block w-full text-center px-6 py-3 bg-primary text-primary-foreground font-black btn-angled"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="inline-block">Book Now</span>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
