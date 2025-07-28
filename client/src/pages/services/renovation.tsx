import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, Hammer, Home, Calendar, Truck } from "lucide-react";
import { Link } from "wouter";

export default function RenovationServicePage() {
  const benefits = [
    "Mixed debris handling capabilities",
    "Multiple delivery windows available",
    "Professional cleanup assistance",
    "Permit assistance when needed",
    "Flexible scheduling around your project",
    "Driveway protection included",
    "Free electronics recycling",
    "Experienced renovation support team"
  ];

  const renovationTypes = [
    {
      title: "Kitchen Renovations",
      description: "Complete kitchen remodel waste management from demo to finish",
      debris: ["Cabinets and countertops", "Appliances", "Flooring materials", "Tile and fixtures"],
      duration: "7-14 days",
      size: "10-20 yard",
      tips: "Schedule delivery before demo starts. Consider extended rental for phased projects."
    },
    {
      title: "Bathroom Remodels", 
      description: "Full bathroom renovation debris disposal and cleanup",
      debris: ["Vanities and fixtures", "Tile and flooring", "Tub/shower units", "Plumbing fixtures"],
      duration: "7-10 days",
      size: "10 yard",
      tips: "Perfect size for most bathroom projects. Quick turnaround available."
    },
    {
      title: "Whole House Renovations",
      description: "Complete home renovation with staged debris removal",
      debris: ["Drywall and lumber", "Flooring systems", "Windows and doors", "Multiple room contents"],
      duration: "14-30 days",
      size: "20-30 yard",
      tips: "Consider multiple containers or extended rental for large projects."
    },
    {
      title: "Basement Finishing",
      description: "Basement renovation and cleanup services",
      debris: ["Drywall and framing", "Old furnishings", "Carpet and padding", "Storage items"],
      duration: "10-14 days", 
      size: "10-20 yard",
      tips: "Account for existing stored items that need removal."
    }
  ];

  const renovationPhases = [
    {
      phase: "Planning & Prep",
      icon: <Calendar className="h-8 w-8 text-[#f7c948]" />,
      description: "Schedule dumpster delivery before demolition begins",
      tasks: ["Book 3-5 days in advance", "Confirm delivery location", "Prepare access route"]
    },
    {
      phase: "Demolition",
      icon: <Hammer className="h-8 w-8 text-[#f7c948]" />,
      description: "Efficient debris removal during tear-out phase",
      tasks: ["Load heavy items first", "Break down large pieces", "Fill efficiently"]
    },
    {
      phase: "Construction", 
      icon: <Home className="h-8 w-8 text-[#f7c948]" />,
      description: "Ongoing waste management throughout renovation",
      tasks: ["Regular debris removal", "Packaging disposal", "Final cleanup"]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Hammer className="h-16 w-16 text-[#f7c948] mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-[#f7c948]">Home Renovation</span> Dumpster Rental
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Complete waste management solutions for your renovation projects. From kitchen remodels 
              to whole house renovations, we make cleanup simple and efficient.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-[#f7c948] text-black hover:bg-[#f7c948]/90 font-bold"
                asChild
              >
                <Link href="/#booking-form">
                  Get Renovation Quote
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
                  Call for Project Planning
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Renovation-Specific Features */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Renovation-Ready Service</h2>
              <p className="text-xl text-gray-600">
                Specialized features designed specifically for home renovation projects
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div>
                <h3 className="text-2xl font-bold mb-6">What Makes Us Different</h3>
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
                <h3 className="text-2xl font-bold text-black mb-4">Starting at $349</h3>
                <p className="text-black/80 mb-6">
                  Comprehensive renovation support including multiple delivery windows, 
                  extended rentals, and professional cleanup assistance.
                </p>
                <Button 
                  className="w-full bg-black text-white hover:bg-gray-800 font-bold"
                  asChild
                >
                  <Link href="/#booking-form">
                    Plan Your Renovation
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Renovation Types */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Renovation Projects We Support</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {renovationTypes.map((renovation, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Home className="h-5 w-5 text-[#f7c948]" />
                      {renovation.title}
                    </CardTitle>
                    <CardDescription>{renovation.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Common Debris:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {renovation.debris.map((item, i) => (
                            <li key={i}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                        <div>
                          <span className="text-sm text-gray-600">Duration:</span>
                          <Badge variant="outline" className="ml-2">{renovation.duration}</Badge>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Size:</span>
                          <Badge className="bg-[#f7c948] text-black ml-2">{renovation.size}</Badge>
                        </div>
                      </div>
                      <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
                        💡 <strong>Tip:</strong> {renovation.tips}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Renovation Phases */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Renovation Phase Support</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {renovationPhases.map((phase, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-center mb-4">
                      {phase.icon}
                    </div>
                    <CardTitle className="text-xl">{phase.phase}</CardTitle>
                    <CardDescription>{phase.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-2">
                      {phase.tasks.map((task, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          {task}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Renovation Tips */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Pro Renovation Tips</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-[#f7c948]" />
                    Timing & Logistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Schedule delivery 1-2 days before demo starts</li>
                    <li>• Choose accessible location for dumpster placement</li>
                    <li>• Consider traffic patterns and neighbor relations</li>
                    <li>• Plan for permit requirements if using street</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[#f7c948]" />
                    Loading Strategy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Load heaviest items first (tile, concrete)</li>
                    <li>• Break down large pieces to maximize space</li>
                    <li>• Distribute weight evenly throughout container</li>
                    <li>• Keep container level and don't overfill</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Project Planning */}
      <section className="py-16 bg-[#0f172a] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">Need Help Planning Your Project?</h2>
            <p className="text-xl text-gray-300 mb-8">
              Our experienced team can help you choose the right container size and rental period 
              for your specific renovation project.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Free Consultation</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-300">
                    Talk to our renovation specialists about your project timeline, 
                    debris estimates, and optimal container sizing.
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Flexible Scheduling</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-300">
                    Adjust pickup dates as your project progresses. 
                    Extend rentals or schedule early pickup as needed.
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
                Get Project Consultation
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#f7c948]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-black mb-4">Ready to Start Your Renovation?</h2>
          <p className="text-xl text-black/80 mb-8">
            Get the right dumpster solution for your home renovation project
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-black text-white hover:bg-gray-800 font-bold"
              asChild
            >
              <Link href="/#booking-form">
                Book Renovation Service
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
                Plan Your Project
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}