import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, Home, Trash2, Calendar, Shield } from "lucide-react";
import { Link } from "wouter";

export default function ResidentialServicePage() {
  const benefits = [
    "Multiple dumpster sizes (10, 20, 30-yard)",
    "Driveway-safe containers with protective boards",
    "Same-day delivery available",
    "Free electronics recycling included",
    "Transparent pricing with no hidden fees",
    "Flexible rental periods (3, 7, or 14 days)",
    "2,000 lbs of debris included",
    "Local family-owned business"
  ];

  const projects = [
    {
      title: "Home Cleanouts",
      description: "Basement, attic, garage, or whole house cleanouts. Perfect for decluttering and organizing projects.",
      size: "10-20 yard",
      duration: "3-7 days"
    },
    {
      title: "Kitchen Renovations",
      description: "Cabinet removal, countertop replacement, and flooring projects. Handle all renovation debris.",
      size: "10-20 yard", 
      duration: "7-14 days"
    },
    {
      title: "Bathroom Remodels",
      description: "Tile, fixtures, vanities, and tub removal. Complete bathroom renovation waste management.",
      size: "10 yard",
      duration: "7 days"
    },
    {
      title: "Roofing Projects",
      description: "Shingle removal and roofing materials disposal. Heavy-duty containers for roofing debris.",
      size: "20-30 yard",
      duration: "3-7 days"
    },
    {
      title: "Yard Cleanup",
      description: "Landscaping debris, tree removal, and seasonal yard work. Organic waste disposal available.",
      size: "10-20 yard",
      duration: "3-7 days"
    },
    {
      title: "Moving & Downsizing",
      description: "Furniture, appliances, and household items disposal. Make your move easier and cleaner.",
      size: "20-30 yard",
      duration: "7 days"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Home className="h-16 w-16 text-[#f7c948] mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-[#f7c948]">Residential</span> Dumpster Rental
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Perfect dumpster solutions for homeowners in Effingham and surrounding areas. 
              From small cleanouts to major renovations, we've got you covered.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-[#f7c948] text-black hover:bg-[#f7c948]/90 font-bold"
                asChild
              >
                <Link href="/#booking-form">
                  Get Instant Quote
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-black font-bold"
                asChild
              >
                <a href="tel:(217) 994-2582">
                  Call (217) 994-2582
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Residential Service */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="bg-[#f7c948] text-black mb-4">Most Popular Service</Badge>
              <h2 className="text-3xl font-bold mb-4">Why Homeowners Choose Us</h2>
              <p className="text-xl text-gray-600">
                Trusted by hundreds of homeowners for reliable, affordable dumpster rentals
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div>
                <h3 className="text-2xl font-bold mb-6">What's Included</h3>
                <ul className="space-y-3">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-[#f7c948] p-8 rounded-lg">
                <h3 className="text-2xl font-bold text-black mb-4">Starting at $299</h3>
                <p className="text-black/80 mb-6">
                  Includes delivery, pickup, 2,000 lbs of debris, and up to 7 days rental. 
                  No hidden fees or surprise charges.
                </p>
                <Button 
                  className="w-full bg-black text-white hover:bg-gray-800 font-bold"
                  asChild
                >
                  <Link href="/#booking-form">
                    Book Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Perfect For These Projects */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Perfect for These Home Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((project, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Trash2 className="h-5 w-5 text-[#f7c948]" />
                      {project.title}
                    </CardTitle>
                    <CardDescription>{project.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Recommended Size:</span>
                        <Badge variant="outline">{project.size}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Typical Duration:</span>
                        <Badge variant="outline">{project.duration}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dumpster Sizes */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Choose the Right Size</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">10-Yard Dumpster</CardTitle>
                  <CardDescription className="text-center">Perfect for Small Projects</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-3xl font-bold text-[#f7c948] mb-4">12' × 8' × 3.5'</div>
                  <p className="text-sm text-gray-600 mb-4">
                    Equivalent to about 3 pickup truck loads
                  </p>
                  <ul className="text-sm space-y-1">
                    <li>• Bathroom renovations</li>
                    <li>• Small basement cleanouts</li>
                    <li>• Garage organization</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-[#f7c948]">
                <CardHeader>
                  <Badge className="bg-[#f7c948] text-black mb-2 mx-auto">Most Popular</Badge>
                  <CardTitle className="text-center">20-Yard Dumpster</CardTitle>
                  <CardDescription className="text-center">Perfect for Medium Projects</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-3xl font-bold text-[#f7c948] mb-4">22' × 8' × 4'</div>
                  <p className="text-sm text-gray-600 mb-4">
                    Equivalent to about 6 pickup truck loads
                  </p>
                  <ul className="text-sm space-y-1">
                    <li>• Kitchen renovations</li>
                    <li>• Large cleanouts</li>
                    <li>• Flooring removal</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">30-Yard Dumpster</CardTitle>
                  <CardDescription className="text-center">Perfect for Large Projects</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-3xl font-bold text-[#f7c948] mb-4">22' × 8' × 6'</div>
                  <p className="text-sm text-gray-600 mb-4">
                    Equivalent to about 9 pickup truck loads
                  </p>
                  <ul className="text-sm space-y-1">
                    <li>• Roofing projects</li>
                    <li>• Whole house cleanouts</li>
                    <li>• Major renovations</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 bg-[#0f172a] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-12">Simple 3-Step Process</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="w-16 h-16 bg-[#f7c948] rounded-full flex items-center justify-center text-black text-2xl font-bold mx-auto mb-4">1</div>
                <h3 className="text-xl font-semibold mb-2">Book Online</h3>
                <p className="text-gray-300">Get instant pricing and schedule delivery in minutes</p>
              </div>
              <div>
                <div className="w-16 h-16 bg-[#f7c948] rounded-full flex items-center justify-center text-black text-2xl font-bold mx-auto mb-4">2</div>
                <h3 className="text-xl font-semibold mb-2">We Deliver</h3>
                <p className="text-gray-300">Fast delivery with driveway protection included</p>
              </div>
              <div>
                <div className="w-16 h-16 bg-[#f7c948] rounded-full flex items-center justify-center text-black text-2xl font-bold mx-auto mb-4">3</div>
                <h3 className="text-xl font-semibold mb-2">We Pick Up</h3>
                <p className="text-gray-300">Scheduled pickup when you're done or rental period ends</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#f7c948]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-black mb-4">Start Your Home Project Today</h2>
          <p className="text-xl text-black/80 mb-8">
            Get an instant quote and schedule delivery for your residential project
          </p>
          <Button 
            size="lg"
            className="bg-black text-white hover:bg-gray-800 font-bold"
            asChild
          >
            <Link href="/#booking-form">
              Book Your Dumpster Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}