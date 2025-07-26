import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PhoneIcon, MailIcon, MapPinIcon, ClockIcon } from "lucide-react";
import { scrollToSection } from "@/lib/scroll-utils";

export function ContactSection() {
  return (
    <section id="contact" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full mb-4 text-[#111827] bg-[#f7c948]">
            <span className="text-sm font-semibold">Contact Us</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Get in Touch
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Have questions about our services? Need help choosing the right dumpster size? We're here to help.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Information */}
          <div className="space-y-8">
            <div className="bg-gray-50 p-8 rounded-xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h3>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <PhoneIcon className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Phone</h4>
                    <p className="text-gray-600">(217) 555-DUMP</p>
                    <p className="text-sm text-gray-500">Call us for immediate assistance</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <MailIcon className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Email</h4>
                    <p className="text-gray-600">alleycatdumpsters@gmail.com</p>
                    <p className="text-sm text-gray-500">We'll respond within 24 hours</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <MapPinIcon className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Service Area</h4>
                    <p className="text-gray-600">Effingham & Surrounding Areas</p>
                    <p className="text-sm text-gray-500">Including Altamont, Teutopolis, and more</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <ClockIcon className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Business Hours</h4>
                    <p className="text-gray-600">Monday - Friday: 7:00 AM - 6:00 PM</p>
                    <p className="text-gray-600">Saturday: 8:00 AM - 4:00 PM</p>
                    <p className="text-gray-600">Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Button 
                onClick={() => scrollToSection('booking-form')}
                className="bg-primary text-black hover:bg-primary/90 font-bold px-8 py-3"
              >
                Book Your Dumpster Now
              </Button>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-gray-50 p-8 rounded-xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Send Us a Message</h3>
            
            <form className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <Input 
                    id="firstName" 
                    type="text" 
                    placeholder="John"
                    className="w-full"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <Input 
                    id="lastName" 
                    type="text" 
                    placeholder="Doe"
                    className="w-full"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="john@example.com"
                  className="w-full"
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <Input 
                  id="phone" 
                  type="tel" 
                  placeholder="(217) 555-0123"
                  className="w-full"
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <Textarea 
                  id="message" 
                  placeholder="Tell us about your project and how we can help..."
                  rows={4}
                  className="w-full"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-primary text-black hover:bg-primary/90 font-bold py-3"
              >
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}