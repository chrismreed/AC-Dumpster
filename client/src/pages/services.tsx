import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, Truck, Clock, Home, Building, TreePine, Hammer } from "lucide-react";
import { Link } from "wouter";

export default function ServicesPage() {
  const services = [
    {
      title: "Residential Dumpster Rental",
      slug: "residential",
      description: "Perfect for home renovations, cleanouts, and yard work projects.",
      icon: <Home className="h-8 w-8 text-[#f7c948]" />,
      features: [
        "Multiple sizes available (10, 20, 30-yard)",
        "Driveway-safe containers",
        "Same-day delivery available",
        "Free electronics recycling"
      ],
      pricing: "Starting at $299",
      popular: true
    },
    {
      title: "Construction Dumpster Rental",
      slug: "construction",
      description: "Heavy-duty containers for commercial construction and demolition projects.",
      icon: <Building className="h-8 w-8 text-[#f7c948]" />,
      features: [
        "High-capacity containers",
        "Extended rental periods",
        "Flexible pickup scheduling",
        "Debris sorting assistance"
      ],
      pricing: "Starting at $399",
      popular: false
    },
    {
      title: "Landscaping & Yard Waste",
      slug: "landscaping",
      description: "Specialized disposal for organic waste, brush, and landscaping debris.",
      icon: <TreePine className="h-8 w-8 text-[#f7c948]" />,
      features: [
        "Organic waste disposal",
        "Brush and tree debris",
        "Eco-friendly processing",
        "Seasonal availability"
      ],
      pricing: "Starting at $249",
      popular: false
    },
    {
      title: "Home Renovation",
      slug: "renovation",
      description: "Complete waste management solutions for kitchen, bathroom, and whole home renovations.",
      icon: <Hammer className="h-8 w-8 text-[#f7c948]" />,
      features: [
        "Mixed debris handling",
        "Multiple delivery windows",
        "Clean-up assistance",
        "Permit assistance available"
      ],
      pricing: "Starting at $349",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Our <span className="text-[#f7c948]">Services</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Comprehensive dumpster rental solutions for every project type and size. 
              From residential cleanouts to large construction projects.
            </p>
            <Button 
              size="lg"
              className="bg-[#f7c948] text-black hover:bg-[#f7c948]/90 font-bold"
              asChild
            >
              <Link href="/#booking-form">
                Get Your Quote Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service) => (
              <Card key={service.slug} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                {service.popular && (
                  <Badge className="absolute top-4 right-4 bg-[#f7c948] text-black">
                    Most Popular
                  </Badge>
                )}
                <CardHeader>
                  <div className="flex items-center gap-4">
                    {service.icon}
                    <div>
                      <CardTitle className="text-xl">{service.title}</CardTitle>
                      <CardDescription className="mt-2">{service.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-2xl font-bold text-[#f7c948]">{service.pricing}</div>
                    <ul className="space-y-2">
                      {service.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="pt-4">
                      <Button 
                        className="w-full bg-[#f7c948] text-black hover:bg-[#f7c948]/90"
                        asChild
                      >
                        <Link href={`/services/${service.slug}`}>
                          Learn More
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">Why Choose Alley Cat Dumpster Rental?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <Truck className="h-12 w-12 text-[#f7c948] mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
                <p className="text-gray-600">Same-day delivery available throughout the Effingham area</p>
              </div>
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-[#f7c948] mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Transparent Pricing</h3>
                <p className="text-gray-600">No hidden fees or surprise charges - what you see is what you pay</p>
              </div>
              <div className="text-center">
                <Clock className="h-12 w-12 text-[#f7c948] mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Flexible Scheduling</h3>
                <p className="text-gray-600">Convenient pickup and delivery times that work with your schedule</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#f7c948]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-black mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-black/80 mb-8">
            Get an instant quote and book your dumpster rental in minutes
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