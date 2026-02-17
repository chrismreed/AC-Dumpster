import Link from 'next/link';
import { Phone, Mail, MapPin, Facebook, Instagram } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Alley Cat Dumpsters</h3>
            <p className="text-sm mb-4">
              Family-owned dumpster rental service serving Effingham and surrounding areas.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#f7c948] transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#f7c948] transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-[#f7c948] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-[#f7c948] transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-[#f7c948] transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#f7c948] transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/booking" className="hover:text-[#f7c948] transition-colors">
                  Book Now
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Services</h3>
            <ul className="space-y-2 text-sm">
              <li>Roll-off Dumpster Rentals</li>
              <li>Junk Removal</li>
              <li>Demolition Services</li>
              <li>Property Cleanup</li>
              <li>Estate Cleanouts</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-2">
                <Phone className="h-5 w-5 text-[#f7c948] flex-shrink-0 mt-0.5" />
                <a href="tel:217-994-2582" className="hover:text-[#f7c948] transition-colors">
                  217-994-2582
                </a>
              </li>
              <li className="flex items-start space-x-2">
                <Mail className="h-5 w-5 text-[#f7c948] flex-shrink-0 mt-0.5" />
                <a href="mailto:[email protected]" className="hover:text-[#f7c948] transition-colors">
                  [email protected]
                </a>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="h-5 w-5 text-[#f7c948] flex-shrink-0 mt-0.5" />
                <span>Effingham, IL</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          <p>&copy; {new Date().getFullYear()} Alley Cat Dumpsters. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
