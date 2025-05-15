import { Link } from "wouter";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";

export function ImprovedFooter() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-[#0f172a] text-[#ffffff]">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/">
              <div className="inline-block cursor-pointer">
                <h3 className="text-xl font-bold">ALLEY CAT</h3>
                <p className="text-sm text-gray-400">DUMPSTER RENTAL</p>
              </div>
            </Link>
            <p className="text-gray-400">
              Your trusted partner for reliable waste management solutions in Effingham and surrounding areas.
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#facc15] transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#facc15] transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#facc15] transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/">
                  <div className="text-gray-400 hover:text-[#facc15] transition-colors cursor-pointer">Home</div>
                </Link>
              </li>
              <li>
                <a href="#services" className="text-gray-400 hover:text-[#facc15] transition-colors">Services</a>
              </li>
              <li>
                <a href="#how-it-works" className="text-gray-400 hover:text-[#facc15] transition-colors">How It Works</a>
              </li>
              <li>
                <a href="#about" className="text-gray-400 hover:text-[#facc15] transition-colors">About Us</a>
              </li>
              <li>
                <a href="#testimonials" className="text-gray-400 hover:text-[#facc15] transition-colors">Testimonials</a>
              </li>
              <li>
                <a href="#faq" className="text-gray-400 hover:text-[#facc15] transition-colors">FAQ</a>
              </li>
              <li>
                <a href="#contact" className="text-gray-400 hover:text-[#facc15] transition-colors">Contact</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-lg mb-4">Services</h4>
            <ul className="space-y-2">
              <li>
                <a href="#services" className="text-gray-400 hover:text-[#facc15] transition-colors">Residential Dumpsters</a>
              </li>
              <li>
                <a href="#services" className="text-gray-400 hover:text-[#facc15] transition-colors">Commercial Dumpsters</a>
              </li>
              <li>
                <a href="#services" className="text-gray-400 hover:text-[#facc15] transition-colors">Construction Dumpsters</a>
              </li>
              <li>
                <a href="#services" className="text-gray-400 hover:text-[#facc15] transition-colors">Junk Removal</a>
              </li>
              <li>
                <a href="#services" className="text-gray-400 hover:text-[#facc15] transition-colors">Roll-Off Containers</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-lg mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 text-[#facc15] mr-2 mt-0.5" />
                <span className="text-gray-400">123 Main St, Effingham, IL 62401</span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 text-[#facc15] mr-2" />
                <a href="tel:5551234567" className="text-gray-400 hover:text-[#facc15] transition-colors">(555) 123-4567</a>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 text-[#facc15] mr-2" />
                <a href="mailto:info@alleycatrental.com" className="text-gray-400 hover:text-[#facc15] transition-colors">info@alleycatrental.com</a>
              </li>
            </ul>
            <div className="mt-4">
              <h5 className="font-medium mb-2">Business Hours</h5>
              <p className="text-sm text-gray-400">Monday - Friday: 7am - 6pm</p>
              <p className="text-sm text-gray-400">Saturday: 8am - 4pm</p>
              <p className="text-sm text-gray-400">Sunday: Closed</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-[#d1d5db]/20 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">
            &copy; {currentYear} Alley Cat Dumpster Rental. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacy-policy">
              <div className="text-sm text-gray-500 hover:text-[#facc15] transition-colors cursor-pointer">Privacy Policy</div>
            </Link>
            <Link href="/terms-of-service">
              <div className="text-sm text-gray-500 hover:text-[#facc15] transition-colors cursor-pointer">Terms of Service</div>
            </Link>
            <Link href="/sitemap">
              <div className="text-sm text-gray-500 hover:text-[#facc15] transition-colors cursor-pointer">Sitemap</div>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}