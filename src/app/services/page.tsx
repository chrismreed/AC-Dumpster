'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Trash2, CheckCircle, XCircle, Recycle, Loader2 } from 'lucide-react';

interface Service {
  id: number;
  name: string;
  description: string;
  imageUrl?: string;
  basePrice?: number | null;
  priceUnit?: string | null;
  serviceType: string;
  isFeatured: boolean;
}

export default function ServicesPage() {
  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ['public-services', 'services-page'],
    queryFn: async () => {
      const response = await fetch('/api/services?page=services');
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      return response.json();
    },
  });

  return (
    <>
      <Navigation />
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-gray-50 to-gray-100 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Our Services
              </h1>
              <p className="text-xl text-gray-600">
                Comprehensive waste management solutions for residential and commercial projects
              </p>
            </div>
          </div>
        </section>

        {/* Services from Database */}
        {isLoading ? (
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <span className="ml-3 text-gray-600">Loading services...</span>
              </div>
            </div>
          </section>
        ) : services && services.length > 0 ? (
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto space-y-16">
                {services.map((service, index) => (
                  <div
                    key={service.id}
                    className={`grid md:grid-cols-2 gap-8 items-center ${
                      index % 2 === 1 ? 'md:flex-row-reverse' : ''
                    }`}
                  >
                    {/* Content */}
                    <div className={index % 2 === 1 ? 'md:order-2' : ''}>
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#f7c948]/20 mb-4">
                        <Trash2 className="h-8 w-8 text-[#f7c948]" />
                      </div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-4">{service.name}</h2>
                      <p className="text-gray-600 mb-4 whitespace-pre-wrap">{service.description}</p>
                      {service.basePrice && (
                        <div className="mt-4 p-4 bg-[#f7c948]/10 rounded-lg">
                          <p className="text-sm text-gray-600">Starting at</p>
                          <p className="text-2xl font-bold text-gray-900">
                            ${service.basePrice.toFixed(2)}
                            {service.priceUnit && (
                              <span className="text-sm font-normal text-gray-600 ml-2">
                                {service.priceUnit}
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                      <div className="mt-6">
                        <Link href={`/services/${service.id}`}>
                          <Button className="bg-[#f7c948] hover:bg-[#f7c948]/90 text-black font-semibold px-8 py-3 rounded-lg">
                            Request This Service
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Image or Placeholder */}
                    <div className={index % 2 === 1 ? 'md:order-1' : ''}>
                      {service.imageUrl ? (
                        <img
                          src={service.imageUrl}
                          alt={service.name}
                          className="w-full h-64 object-cover rounded-lg shadow-md"
                        />
                      ) : (
                        <div className="bg-gray-100 rounded-lg p-8 h-64 flex items-center justify-center">
                          <Trash2 className="h-24 w-24 text-gray-300" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4 text-center">
              <p className="text-gray-500">No services available at this time.</p>
            </div>
          </section>
        )}

        {/* What We Accept / Don't Accept */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
                Waste Guidelines
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Accepted Items */}
                <div className="bg-white rounded-lg p-8 shadow-sm border-2 border-green-200">
                  <div className="flex items-center mb-6">
                    <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                    <h3 className="text-2xl font-bold text-gray-900">We Accept</h3>
                  </div>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span>General household waste</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span>Furniture and mattresses</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span>Construction debris (wood, drywall, etc.)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span>Yard waste and branches</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span>Scrap metal</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span>Cardboard and paper</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span>Carpet and flooring</span>
                    </li>
                  </ul>
                </div>

                {/* Prohibited Items */}
                <div className="bg-white rounded-lg p-8 shadow-sm border-2 border-red-200">
                  <div className="flex items-center mb-6">
                    <XCircle className="h-8 w-8 text-red-600 mr-3" />
                    <h3 className="text-2xl font-bold text-gray-900">Not Accepted</h3>
                  </div>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2">✗</span>
                      <span>Tires</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2">✗</span>
                      <span>Batteries (recyclable separately)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2">✗</span>
                      <span>Electronics (recyclable separately)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2">✗</span>
                      <span>Appliances (recyclable separately)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2">✗</span>
                      <span>Wet paint</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2">✗</span>
                      <span>Dirt, rock, and concrete</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2">✗</span>
                      <span>Hazardous materials</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Recycling Note */}
              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start">
                  <Recycle className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Recycling Services Available</h4>
                    <p className="text-gray-600 text-sm">
                      We offer recycling services for batteries, electronics, and appliances. Simply place these items separately and let us know - we'll handle the rest responsibly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Ready to Book Your Dumpster?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Get started with your project today
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/booking"
                className="w-full sm:w-auto px-8 py-4 bg-[#f7c948] text-black rounded-md hover:bg-[#f7c948]/90 font-semibold text-lg transition-colors"
              >
                Book Online Now
              </Link>
              <Link
                href="/pricing"
                className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-gray-300 text-gray-900 rounded-md hover:border-[#f7c948] font-semibold text-lg transition-colors"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
