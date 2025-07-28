import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, Building, Hammer, Clock, Shield } from "lucide-react";
import { Link } from "wouter";

export default function ConstructionServicePage() {
  const benefits = [
    "Heavy-duty containers for construction debris",
    "Extended rental periods for long projects",
    "High weight capacity for dense materials",
    "Flexible pickup and delivery scheduling",
    "Competitive pricing for commercial accounts",
    "Debris sorting and recycling assistance",
    "Permit assistance when needed",
    "Professional project consultation"
  ];

  const projectTypes = [
    {
      title: "New Construction",
      description: "Complete waste management for new residential and commercial builds",
      materials: ["Lumber scraps", "Drywall", "Packaging materials", "General construction debris"],
      recommended: "20-30 yard"
    },
    {
      title: "Demolition Projects", 
      description: "Safe disposal of demolition debris and hazardous materials handling",
      materials: ["Concrete", "Brick", "Metal", "Structural materials"],
      recommended: "30 yard"
    },
    {
      title: "Commercial Renovations",
      description: "Office buildings, retail spaces, and commercial facility updates",
      materials: ["Carpet/flooring", "Fixtures", "Drywall", "Electrical components"],
      recommended: "20-30 yard"
    },
    {
      title: "Roofing Contractors",
      description: "Specialized service for roofing companies and contractors",
      materials: ["Shingles", "Underlayment", "Gutters", "Flashing"],
      recommended: "20-30 yard"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Building className="h-16 w-16 text-[#f7c948] mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-[#f7c948]">Construction</span> Dumpster Rental
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Heavy-duty dumpster solutions for contractors, builders, and commercial projects. 
              Reliable service you can count on to keep your job site clean and efficient.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-[#f7c948] text-black hover:bg-[#f7c948]/90 font-bold"
                asChild
              >
                <Link href="/#booking-form">
                  Get Commercial Quote
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
                  Call for Volume Pricing
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Contractors Choose Us */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Why Contractors Choose Alley Cat</h2>
              <p className="text-xl text-gray-600">
                Professional service designed for the demands of construction projects
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div>
                <h3 className="text-2xl font-bold mb-6">Construction-Ready Features</h3>
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
                <h3 className="text-2xl font-bold text-black mb-4">Starting at $399</h3>
                <p className="text-black/80 mb-6">
                  Heavy-duty containers with extended rental periods and higher weight limits. 
                  Volume discounts available for regular customers.
                </p>
                <Button 
                  className="w-full bg-black text-white hover:bg-gray-800 font-bold"
                  asChild
                >
                  <Link href="/#booking-form">
                    Get Quote
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Project Types */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Construction Projects We Serve</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {projectTypes.map((project, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Hammer className="h-5 w-5 text-[#f7c948]" />
                      {project.title}
                    </CardTitle>
                    <CardDescription>{project.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Common Materials:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {project.materials.map((material, i) => (
                            <li key={i}>• {material}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-sm text-gray-600">Recommended Size:</span>
                        <Badge className="bg-[#f7c948] text-black">{project.recommended}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Commercial Features */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Commercial-Grade Service</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <Shield className="h-12 w-12 text-[#f7c948] mx-auto mb-4" />
                  <CardTitle>Reliable Scheduling</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Dependable delivery and pickup times that keep your project on schedule
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardHeader>
                  <Clock className="h-12 w-12 text-[#f7c948] mx-auto mb-4" />
                  <CardTitle>Extended Rentals</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Flexible rental periods from 7 days to several weeks for long-term projects
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardHeader>
                  <Building className="h-12 w-12 text-[#f7c948] mx-auto mb-4" />
                  <CardTitle>High Capacity</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Heavy-duty containers designed for dense construction materials and debris
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing & Contracts */}
      <section className="py-16 bg-[#0f172a] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">Commercial Pricing & Contracts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Volume Discounts</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-300">
                    Regular customers and large projects qualify for reduced rates. 
                    Contact us for custom pricing on ongoing work.
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Flexible Terms</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-300">
                    Net 30 payment terms available for established contractors. 
                    Monthly billing options for recurring projects.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
            <Button 
              size="lg"
              className="bg-[#f7c948] text-black hover:bg-[#f7c948]/90 font-bold"
              asChild
            >
              <a href="tel:(217) 994-2582">
                Discuss Commercial Rates
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Safety & Compliance */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">Safety & Compliance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="text-left">
                <h3 className="text-xl font-semibold mb-4">Safety Standards</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Properly maintained and inspected equipment</li>
                  <li>• Trained drivers with commercial licenses</li>
                  <li>• Site safety protocols and procedures</li>
                  <li>• Insurance coverage for peace of mind</li>
                </ul>
              </div>
              <div className="text-left">
                <h3 className="text-xl font-semibold mb-4">Regulatory Compliance</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Proper disposal and recycling procedures</li>
                  <li>• Environmental regulation compliance</li>
                  <li>• Permit assistance and guidance</li>
                  <li>• Documentation for project records</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#f7c948]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-black mb-4">Ready for Professional Service?</h2>
          <p className="text-xl text-black/80 mb-8">
            Get a custom quote for your construction project today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-black text-white hover:bg-gray-800 font-bold"
              asChild
            >
              <Link href="/#booking-form">
                Get Construction Quote
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-black text-black hover:bg-black hover:text-white font-bold"
              asChild
            >
              <a href="tel:(217) 994-2582">
                Call for Commercial Rates
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}