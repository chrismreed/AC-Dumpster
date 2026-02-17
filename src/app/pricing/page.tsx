import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Check, Info, Phone } from 'lucide-react';

export default function PricingPage() {
  return (
    <>
      <Navigation />
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-gray-50 to-gray-100 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Transparent Pricing
              </h1>
              <p className="text-xl text-gray-600">
                No hidden fees - see exactly what you'll pay upfront
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Tables */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
                Dumpster Rental Pricing
              </h2>

              <div className="grid md:grid-cols-2 gap-8 mb-12">
                {/* 15 Yard Dumpster */}
                <div className="bg-white rounded-lg border-2 border-gray-200 hover:border-[#f7c948] transition-all shadow-lg">
                  <div className="bg-gray-50 p-6 border-b border-gray-200">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">15 Yard Dumpster</h3>
                    <p className="text-gray-600">Ideal for small to medium projects</p>
                  </div>
                  <div className="p-8">
                    <div className="space-y-4 mb-8">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-semibold text-gray-900">24 Hour Rental</span>
                          <p className="text-sm text-gray-500">Quick project turnaround</p>
                        </div>
                        <span className="text-3xl font-bold text-gray-900">$340</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-semibold text-gray-900">3 Day Rental</span>
                          <p className="text-sm text-gray-500">Most popular option</p>
                        </div>
                        <span className="text-3xl font-bold text-gray-900">$360</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-semibold text-gray-900">7 Day Rental</span>
                          <p className="text-sm text-gray-500">Extended project time</p>
                        </div>
                        <span className="text-3xl font-bold text-gray-900">$415</span>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-8">
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">Includes up to 2,000 lbs of waste</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">Driveway-safe delivery</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">Free pickup at end of rental</span>
                      </li>
                    </ul>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <p className="text-sm text-gray-700">
                        <strong>Perfect for:</strong> Home cleanouts, garage cleanups, small renovations
                      </p>
                    </div>

                    <Link
                      href="/booking"
                      className="block w-full text-center px-6 py-3 bg-[#f7c948] text-black rounded-md hover:bg-[#f7c948]/90 font-semibold transition-colors"
                    >
                      Book 15 Yard Dumpster
                    </Link>
                  </div>
                </div>

                {/* 20 Yard Dumpster */}
                <div className="bg-white rounded-lg border-2 border-[#f7c948] hover:shadow-xl transition-all shadow-lg relative">
                  <div className="absolute top-0 right-0 bg-[#f7c948] text-black px-4 py-1 rounded-bl-lg rounded-tr-lg font-semibold text-sm">
                    Most Popular
                  </div>
                  <div className="bg-gray-50 p-6 border-b border-gray-200">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">20 Yard Dumpster</h3>
                    <p className="text-gray-600">Perfect for larger projects</p>
                  </div>
                  <div className="p-8">
                    <div className="space-y-4 mb-8">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-semibold text-gray-900">24 Hour Rental</span>
                          <p className="text-sm text-gray-500">Quick project turnaround</p>
                        </div>
                        <span className="text-3xl font-bold text-gray-900">$375</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-semibold text-gray-900">3 Day Rental</span>
                          <p className="text-sm text-gray-500">Most popular option</p>
                        </div>
                        <span className="text-3xl font-bold text-gray-900">$420</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-semibold text-gray-900">7 Day Rental</span>
                          <p className="text-sm text-gray-500">Extended project time</p>
                        </div>
                        <span className="text-3xl font-bold text-gray-900">$460</span>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-8">
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">Includes up to 2,000 lbs of waste</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">Driveway-safe delivery</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">Free pickup at end of rental</span>
                      </li>
                    </ul>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <p className="text-sm text-gray-700">
                        <strong>Perfect for:</strong> Renovations, construction debris, large cleanouts
                      </p>
                    </div>

                    <Link
                      href="/booking"
                      className="block w-full text-center px-6 py-3 bg-[#f7c948] text-black rounded-md hover:bg-[#f7c948]/90 font-semibold transition-colors"
                    >
                      Book 20 Yard Dumpster
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Additional Fees */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
                Additional Information
              </h2>

              <div className="space-y-6">
                {/* Weight Limits */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <div className="flex items-start">
                    <Info className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Weight Limits & Overages</h3>
                      <p className="text-gray-600 mb-2">
                        All rental prices include up to 2,000 lbs of waste. Additional weight is charged at:
                      </p>
                      <p className="text-2xl font-bold text-[#f7c948]">$80 per ton over 2,000 lbs</p>
                    </div>
                  </div>
                </div>

                {/* Service Area */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <div className="flex items-start">
                    <Info className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Service Area</h3>
                      <p className="text-gray-600 mb-2">
                        We service Effingham and up to 10 miles outside the city.
                      </p>
                      <p className="text-gray-600">
                        <strong>Note:</strong> Additional fuel surcharge may apply for locations beyond 10 miles from Effingham.
                      </p>
                    </div>
                  </div>
                </div>

                {/* What's Included */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <div className="flex items-start">
                    <Info className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">What's Included</h3>
                      <ul className="space-y-2 text-gray-600">
                        <li className="flex items-center">
                          <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                          <span>Delivery to your location</span>
                        </li>
                        <li className="flex items-center">
                          <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                          <span>Rental for your chosen period</span>
                        </li>
                        <li className="flex items-center">
                          <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                          <span>Pickup and disposal fees</span>
                        </li>
                        <li className="flex items-center">
                          <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                          <span>Up to 2,000 lbs of waste</span>
                        </li>
                        <li className="flex items-center">
                          <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                          <span>Driveway protection boards</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                Pricing FAQs
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">How do I know which size to choose?</h3>
                  <p className="text-gray-600">
                    The 15-yard dumpster is great for small to medium projects like garage cleanouts or minor renovations. The 20-yard is better for larger projects, full home cleanouts, or construction work. If you're unsure, give us a call at 217-994-2582 and we'll help you choose!
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Can I extend my rental period?</h3>
                  <p className="text-gray-600">
                    Yes! Just call us before your rental period ends and we can arrange an extension for an additional fee.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">How do I estimate the weight of my debris?</h3>
                  <p className="text-gray-600">
                    Most household items and construction debris will stay under the 2,000 lb limit. Heavy materials like dirt, concrete, or roofing shingles can add up quickly. Contact us if you're concerned about weight limits.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">What payment methods do you accept?</h3>
                  <p className="text-gray-600">
                    We accept all major credit cards, debit cards, and cash payments.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gray-900 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Book your dumpster online or call us for a custom quote
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/booking"
                className="w-full sm:w-auto px-8 py-4 bg-[#f7c948] text-black rounded-md hover:bg-[#f7c948]/90 font-semibold text-lg transition-colors"
              >
                Book Online Now
              </Link>
              <a
                href="tel:217-994-2582"
                className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-white text-white rounded-md hover:bg-white hover:text-gray-900 font-semibold text-lg transition-colors flex items-center justify-center space-x-2"
              >
                <Phone className="h-5 w-5" />
                <span>Call 217-994-2582</span>
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
