import { Link } from "wouter";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock,
  Facebook,
  Twitter,
  Instagram,
  Linkedin
} from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#2c2c2c] text-neutral-300 pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-[#ffdd33] font-bold text-xl mb-4">ALLEY CAT</h3>
            <p className="mb-4">Your trusted partner for efficient, affordable dumpster rentals. Serving the community with pride since 2015.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-neutral-300 hover:text-[#ffdd33]">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-300 hover:text-[#ffdd33]">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-300 hover:text-[#ffdd33]">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-300 hover:text-[#ffdd33]">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-[#ffdd33] font-medium mb-4">Services</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-[#ffdd33]">Residential Dumpsters</a></li>
              <li><a href="#" className="hover:text-[#ffdd33]">Commercial Dumpsters</a></li>
              <li><a href="#" className="hover:text-[#ffdd33]">Construction Waste</a></li>
              <li><a href="#" className="hover:text-[#ffdd33]">Junk Removal</a></li>
              <li><a href="#" className="hover:text-[#ffdd33]">Recycling Services</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-[#ffdd33] font-medium mb-4">Company</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-[#ffdd33]">About Us</a></li>
              <li><a href="#" className="hover:text-[#ffdd33]">Service Areas</a></li>
              <li><a href="#" className="hover:text-[#ffdd33]">Careers</a></li>
              <li><a href="#" className="hover:text-[#ffdd33]">Blog</a></li>
              <li><a href="#" className="hover:text-[#ffdd33]">Contact Us</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-[#ffdd33] font-medium mb-4">Contact</h4>
            <ul className="space-y-2">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mr-3 mt-1 flex-shrink-0 text-[#ffdd33]" />
                <span>123 Waste Management Way<br />Effingham, IL 62401</span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-3 flex-shrink-0 text-[#ffdd33]" />
                <span>217-994-2582</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-3 flex-shrink-0 text-[#ffdd33]" />
                <span>alleycatdumpsters@gmail.com</span>
              </li>
              <li className="flex items-start">
                <Clock className="h-5 w-5 mr-3 mt-1 flex-shrink-0 text-[#ffdd33]" />
                <span>Mon-Fri: 7am-7pm<br />Sat: 8am-5pm</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-neutral-700 pt-6 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm">© {new Date().getFullYear()} Alley Cat Dumpster Rental. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-sm hover:text-[#ffdd33]">Privacy Policy</a>
              <a href="#" className="text-sm hover:text-[#ffdd33]">Terms of Service</a>
              <a href="#" className="text-sm hover:text-[#ffdd33]">Cookie Policy</a>
              <a href="#" className="text-sm hover:text-[#ffdd33]">Sitemap</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
