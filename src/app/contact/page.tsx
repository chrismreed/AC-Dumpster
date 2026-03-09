'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { ServiceAreaMap } from '@/components/ServiceAreaMap';
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Send } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission - replace with actual API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus('success');
      setFormData({ name: '', email: '', phone: '', message: '' });

      // Reset success message after 5 seconds
      setTimeout(() => setSubmitStatus('idle'), 5000);
    }, 1000);
  };

  return (
    <>
      <Navigation />
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-gray-50 to-gray-100 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Get In Touch
              </h1>
              <p className="text-xl text-gray-600">
                We're here to help with all your dumpster rental needs
              </p>
            </div>
          </div>
        </section>

        {/* Contact Info & Form */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
              {/* Contact Information */}
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-8">Contact Information</h2>

                <div className="space-y-6 mb-8">
                  {/* Phone */}
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#f7c948]/20 flex items-center justify-center mr-4">
                      <Phone className="h-6 w-6 text-[#f7c948]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                      <a href="tel:217-994-2582" className="text-lg text-gray-600 hover:text-[#f7c948] transition-colors">
                        217-994-2582
                      </a>
                      <p className="text-sm text-gray-500 mt-1">Call us for immediate assistance</p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#f7c948]/20 flex items-center justify-center mr-4">
                      <Mail className="h-6 w-6 text-[#f7c948]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                      <a href="mailto:[email protected]" className="text-lg text-gray-600 hover:text-[#f7c948] transition-colors break-all">
                        [email protected]
                      </a>
                      <p className="text-sm text-gray-500 mt-1">Send us an email anytime</p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#f7c948]/20 flex items-center justify-center mr-4">
                      <MapPin className="h-6 w-6 text-[#f7c948]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Service Area</h3>
                      <p className="text-lg text-gray-600">Effingham, IL</p>
                      <p className="text-sm text-gray-500 mt-1">Serving Effingham and up to 10 miles outside the city</p>
                    </div>
                  </div>

                  {/* Business Hours */}
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#f7c948]/20 flex items-center justify-center mr-4">
                      <Clock className="h-6 w-6 text-[#f7c948]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Business Hours</h3>
                      <div className="text-gray-600">
                        <p>Monday - Friday: 7:00 AM - 6:00 PM</p>
                        <p>Saturday: 8:00 AM - 4:00 PM</p>
                        <p>Sunday: Closed</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Social Media */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Follow Us</h3>
                  <div className="flex space-x-4">
                    <a
                      href="https://facebook.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-gray-100 hover:bg-[#f7c948]/20 flex items-center justify-center transition-colors"
                    >
                      <Facebook className="h-5 w-5 text-gray-700" />
                    </a>
                    <a
                      href="https://instagram.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-gray-100 hover:bg-[#f7c948]/20 flex items-center justify-center transition-colors"
                    >
                      <Instagram className="h-5 w-5 text-gray-700" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-8">Send Us a Message</h2>

                {submitStatus === 'success' && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                    <p className="font-semibold">Message sent successfully!</p>
                    <p className="text-sm">We'll get back to you as soon as possible.</p>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                    <p className="font-semibold">Something went wrong.</p>
                    <p className="text-sm">Please try again or call us directly.</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f7c948] focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f7c948] focus:border-transparent"
                      placeholder="[email protected]"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f7c948] focus:border-transparent"
                      placeholder="217-994-2582"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f7c948] focus:border-transparent"
                      placeholder="Tell us about your project..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-8 py-4 bg-[#f7c948] text-black rounded-md hover:bg-[#f7c948]/90 font-semibold text-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Service Area Map Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Check Service Availability
                </h2>
                <p className="text-xl text-gray-600">
                  We proudly serve Effingham and surrounding communities. Click on any zone to see details.
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 h-[600px] mb-8">
                <ServiceAreaMap />
              </div>
              <div className="text-center">
                <p className="text-gray-600 mb-6">
                  Not sure if we service your area? Give us a call and we'll let you know!
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/booking"
                    className="w-full sm:w-auto px-8 py-3 bg-[#f7c948] text-black rounded-md hover:bg-[#f7c948]/90 font-semibold transition-colors"
                  >
                    Book Your Dumpster
                  </Link>
                  <a
                    href="tel:217-994-2582"
                    className="w-full sm:w-auto px-8 py-3 bg-white border-2 border-gray-300 text-gray-900 rounded-md hover:border-[#f7c948] font-semibold transition-colors flex items-center justify-center space-x-2"
                  >
                    <Phone className="h-5 w-5" />
                    <span>Call 217-994-2582</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
