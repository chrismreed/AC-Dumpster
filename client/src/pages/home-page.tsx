import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { BookingForm } from "@/components/booking/booking-form";
import { formatPrice } from "@/lib/utils";
import { Dumpster, ServiceZone, RentalDuration } from "@shared/schema";
import { Trash2, Truck, Check, Calendar, MapPin, Phone, Mail, Star } from "lucide-react";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("residential");
  const [showBookingForm, setShowBookingForm] = useState(false);

  // Fetch data
  const { data: dumpsters } = useQuery<Dumpster[]>({
    queryKey: ["/api/dumpsters"],
  });

  const { data: durations } = useQuery<RentalDuration[]>({
    queryKey: ["/api/durations"],
  });

  const { data: zones } = useQuery<ServiceZone[]>({
    queryKey: ["/api/zones"],
  });

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-neutral-900 to-neutral-800 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold text-white">
                Local <span className="text-primary">Dumpster Rental</span> Made Simple
              </h1>
              <p className="text-xl text-gray-300">
                Fast delivery, fair prices, and friendly service for all your waste management needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  size="lg" 
                  onClick={() => setShowBookingForm(true)}
                  className="w-full sm:w-auto"
                >
                  Book a Dumpster
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="text-white border-white hover:text-white w-full sm:w-auto"
                  onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  View Pricing
                </Button>
              </div>
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  <span className="text-gray-300">Same-day delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  <span className="text-gray-300">7-day rentals</span>
                </div>
              </div>
            </div>
            <div className="hidden md:block relative h-96">
              <div className="absolute inset-0 bg-primary/10 rounded-xl -rotate-3 transform"></div>
              <div className="absolute inset-0 bg-black/50 rounded-xl rotate-3 transform"></div>
              <img 
                src="https://images.unsplash.com/photo-1586996292898-71f4036c4e07?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
                alt="Dumpster rental" 
                className="rounded-lg h-full w-full object-cover object-center"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Booking Form (Expanded when button is clicked) */}
      {showBookingForm && (
        <section id="booking-form" className="py-12 bg-neutral-100">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold">Book Your Dumpster</h2>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowBookingForm(false)}
                  className="text-neutral-500"
                >
                  Close
                </Button>
              </div>
              <Card className="shadow-md">
                <CardContent className="pt-6">
                  <BookingForm />
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Services Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Dumpster Rental Services</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              We offer a variety of dumpster sizes and services to meet your specific needs,
              whether you're renovating your home or managing a construction site.
            </p>
          </div>

          <Tabs defaultValue="residential" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="grid grid-cols-2 w-full max-w-md">
                <TabsTrigger value="residential">Residential</TabsTrigger>
                <TabsTrigger value="commercial">Commercial</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="residential" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center mb-6 bg-primary/10 w-16 h-16 rounded-full mx-auto">
                      <Trash2 className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-center mb-3">Home Renovation</h3>
                    <p className="text-gray-600 text-center">
                      Perfect for kitchen remodels, bathroom renovations, or basement cleanouts.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center mb-6 bg-primary/10 w-16 h-16 rounded-full mx-auto">
                      <Truck className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-center mb-3">Yard Cleanup</h3>
                    <p className="text-gray-600 text-center">
                      Ideal for landscaping projects, tree removal, or seasonal yard cleanups.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center mb-6 bg-primary/10 w-16 h-16 rounded-full mx-auto">
                      <Calendar className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-center mb-3">Moving Cleanouts</h3>
                    <p className="text-gray-600 text-center">
                      Simplify your move by getting rid of unwanted items before or after moving.
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="text-center mt-8">
                <Button 
                  onClick={() => setShowBookingForm(true)}
                  size="lg"
                >
                  Book a Residential Dumpster
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="commercial" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center mb-6 bg-primary/10 w-16 h-16 rounded-full mx-auto">
                      <Trash2 className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-center mb-3">Construction Sites</h3>
                    <p className="text-gray-600 text-center">
                      Efficient waste management for new construction, renovations, or demolitions.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center mb-6 bg-primary/10 w-16 h-16 rounded-full mx-auto">
                      <Truck className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-center mb-3">Retail & Office</h3>
                    <p className="text-gray-600 text-center">
                      Perfect for store remodels, office cleanouts, or facility upgrades.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center mb-6 bg-primary/10 w-16 h-16 rounded-full mx-auto">
                      <Calendar className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-center mb-3">Event Cleanup</h3>
                    <p className="text-gray-600 text-center">
                      Streamline waste management for corporate events, festivals, or conferences.
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="text-center mt-8">
                <Button 
                  onClick={() => setShowBookingForm(true)}
                  size="lg"
                >
                  Book a Commercial Dumpster
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Dumpster Sizes & Pricing</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Choose the right dumpster size for your project. All prices include delivery, pickup, and standard disposal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {dumpsters?.map((dumpster) => (
              <Card key={dumpster.id} className="border-2 hover:border-primary transition-colors">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-2">{dumpster.name}</h3>
                    <p className="text-gray-500 mb-4">{dumpster.dimensions}</p>
                    <div className="text-3xl font-bold text-primary mb-2">
                      {formatPrice(dumpster.basePrice)}
                    </div>
                    <p className="text-sm text-gray-500 mb-6">Starting price for local delivery</p>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span>Perfect for {dumpster.bestFor || dumpster.description.split('.')[0]}</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span>Weight limit: {dumpster.weightLimit} lbs</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span>7-day standard rental period</span>
                    </li>
                  </ul>
                  
                  <Button 
                    onClick={() => {
                      setShowBookingForm(true);
                      setTimeout(() => {
                        // Add logic to preselect this dumpster in the booking form if needed
                      }, 100);
                    }}
                    className="w-full"
                  >
                    Rent This Dumpster
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What Our Customers Say</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Don't just take our word for it. Here's what our satisfied customers have to say about our service.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 italic mb-4">
                  "The entire process was seamless from start to finish. The delivery was on time, and pickup was prompt. I'll definitely use their services again."
                </p>
                <div className="font-semibold">- Michael R., Homeowner</div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 italic mb-4">
                  "As a contractor, I need reliable dumpster service. These guys deliver on time every time, and their pricing is transparent with no hidden fees."
                </p>
                <div className="font-semibold">- Sarah T., Contractor</div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 italic mb-4">
                  "Customer service was exceptional. They helped me choose the right dumpster size for my renovation project and answered all my questions."
                </p>
                <div className="font-semibold">- David L., DIY Renovator</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Service Areas */}
      <section className="py-16 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Areas We Serve</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              We provide dumpster rental services in the following areas. Contact us if you don't see your location listed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {zones?.map((zone) => (
              <div key={zone.id} className="flex items-center bg-white p-3 rounded-lg shadow-sm">
                <MapPin className="h-5 w-5 text-primary mr-2" />
                <span>{zone.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-neutral-900 to-neutral-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Book your dumpster today and enjoy hassle-free waste management for your project.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => setShowBookingForm(true)}
              className="w-full sm:w-auto"
            >
              Book a Dumpster
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="text-white border-white hover:text-white w-full sm:w-auto"
              onClick={() => {
                // Scroll to contact information or open a contact modal
              }}
            >
              Contact Us
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="shadow-sm">
              <CardContent className="pt-6 text-center">
                <Phone className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Call Us</h3>
                <p className="text-gray-600">(555) 123-4567</p>
                <p className="text-sm text-gray-500 mt-2">Mon-Fri: 7am-7pm</p>
                <p className="text-sm text-gray-500">Sat: 8am-5pm</p>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm">
              <CardContent className="pt-6 text-center">
                <Mail className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Email Us</h3>
                <p className="text-gray-600">info@dumpsterrental.com</p>
                <p className="text-sm text-gray-500 mt-2">We respond within 24 hours</p>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm">
              <CardContent className="pt-6 text-center">
                <MapPin className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Visit Us</h3>
                <p className="text-gray-600">123 Main Street</p>
                <p className="text-gray-600">Effingham, IL 62401</p>
                <p className="text-sm text-gray-500 mt-2">Office hours: 9am-5pm</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}