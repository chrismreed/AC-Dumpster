import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, TreePine, Leaf, Calendar, Recycle } from "lucide-react";
import { Link } from "wouter";

export default function LandscapingServicePage() {
  const benefits = [
    "Specialized organic waste disposal",
    "Eco-friendly processing and recycling",
    "Seasonal availability for peak times",
    "Brush and tree debris handling",
    "Competitive pricing for yard projects",
    "Multiple container sizes available",
    "Quick delivery and pickup",
    "Environmentally responsible disposal"
  ];

  const acceptedMaterials = [
    {
      category: "Tree & Brush Debris",
      items: ["Tree branches and limbs", "Brush and shrubs", "Small logs and stumps", "Hedge trimmings"],
      note: "Clean wood only, no treated lumber"
    },
    {
      category: "Yard Waste",
      items: ["Grass clippings", "Leaves and mulch", "Garden plants", "Flower bed cleanup"],
      note: "Organic materials only"
    },
    {
      category: "Landscaping Materials",
      items: ["Sod and dirt", "Small rocks and gravel", "Landscape fabric", "Plant containers"],
      note: "Non-hazardous materials only"
    }
  ];

  const seasonalTips = [
    {
      season: "Spring",
      icon: <Leaf className="h-8 w-8 text-green-500" />,
      tasks: ["Garden cleanup", "Pruning debris", "Old mulch removal"],
      tips: "Book early as spring is our busiest season for yard cleanups"
    },
    {
      season: "Summer", 
      icon: <TreePine className="h-8 w-8 text-green-600" />,
      tasks: ["Tree trimming", "Landscape renovation", "Deck/patio projects"],
      tips: "Consider larger containers for major landscaping projects"
    },
    {
      season: "Fall",
      icon: <Leaf className="h-8 w-8 text-orange-500" />,
      tasks: ["Leaf cleanup", "Garden preparation", "Storm cleanup"],
      tips: "Peak season for leaf disposal - book in advance"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <TreePine className="h-16 w-16 text-[#f7c948] mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-[#f7c948]">Landscaping</span> & Yard Waste Disposal
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Eco-friendly disposal solutions for all your landscaping and yard debris. 
              From spring cleanup to major landscaping projects, we handle it responsibly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-[#f7c948] text-black hover:bg-[#f7c948]/90 font-bold"
                asChild
              >
                <Link href="/#booking-form">
                  Get Landscaping Quote
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

      {/* Eco-Friendly Focus */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="bg-green-100 text-green-800 mb-4">Eco-Friendly Service</Badge>
              <h2 className="text-3xl font-bold mb-4">Environmentally Responsible Disposal</h2>
              <p className="text-xl text-gray-600">
                We specialize in organic waste processing and environmentally conscious disposal methods
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
              <div className="bg-green-50 p-8 rounded-lg border border-green-200">
                <Recycle className="h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-2xl font-bold text-green-800 mb-4">Starting at $249</h3>
                <p className="text-green-700 mb-6">
                  Specialized pricing for organic waste disposal. All materials are processed 
                  through environmentally responsible methods including composting and recycling.
                </p>
                <Button 
                  className="w-full bg-green-600 text-white hover:bg-green-700 font-bold"
                  asChild
                >
                  <Link href="/#booking-form">
                    Book Eco-Friendly Service
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Accepted Materials */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">What We Accept</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {acceptedMaterials.map((category, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <TreePine className="h-5 w-5 text-green-600" />
                      {category.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-4">
                      {category.items.map((item, i) => (
                        <li key={i} className="text-sm flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-600 italic">{category.note}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Seasonal Guide */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Seasonal Landscaping Guide</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {seasonalTips.map((season, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-center mb-4">
                      {season.icon}
                    </div>
                    <CardTitle className="text-2xl">{season.season}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Common Tasks:</h4>
                        <ul className="text-sm space-y-1">
                          {season.tasks.map((task, i) => (
                            <li key={i}>• {task}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="pt-4 border-t">
                        <p className="text-sm text-gray-600 italic">{season.tips}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Container Recommendations */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Container Size Guide</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">10-Yard Container</CardTitle>
                  <CardDescription className="text-center">Perfect for Small Yard Projects</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-3xl font-bold text-[#f7c948] mb-4">Best For:</div>
                  <ul className="text-sm space-y-2">
                    <li>• Small garden cleanups</li>
                    <li>• Pruning and trimming projects</li>
                    <li>• Single tree removal</li>
                    <li>• Flower bed renovation</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-green-500">
                <CardHeader>
                  <Badge className="bg-green-100 text-green-800 mb-2 mx-auto">Most Popular</Badge>
                  <CardTitle className="text-center">20-Yard Container</CardTitle>
                  <CardDescription className="text-center">Perfect for Large Yard Projects</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-3xl font-bold text-[#f7c948] mb-4">Best For:</div>
                  <ul className="text-sm space-y-2">
                    <li>• Large landscaping projects</li>
                    <li>• Multiple tree removal</li>
                    <li>• Whole yard cleanup</li>
                    <li>• Storm damage cleanup</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Environmental Commitment */}
      <section className="py-16 bg-green-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">Our Environmental Commitment</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <Recycle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Recycling</h3>
                <p className="text-gray-600">
                  Organic materials are processed into compost and mulch for reuse
                </p>
              </div>
              <div>
                <TreePine className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Responsible Processing</h3>
                <p className="text-gray-600">
                  Wood waste is chipped for biomass fuel or landscaping materials
                </p>
              </div>
              <div>
                <Leaf className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Minimal Landfill</h3>
                <p className="text-gray-600">
                  Less than 5% of landscaping waste goes to landfills
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#f7c948]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-black mb-4">Ready for Your Landscaping Project?</h2>
          <p className="text-xl text-black/80 mb-8">
            Get eco-friendly disposal for your yard waste and landscaping debris
          </p>
          <Button 
            size="lg"
            className="bg-black text-white hover:bg-gray-800 font-bold"
            asChild
          >
            <Link href="/#booking-form">
              Book Landscaping Service
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}