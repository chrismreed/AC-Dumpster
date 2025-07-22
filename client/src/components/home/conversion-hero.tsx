import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";

export function ConversionHero() {
  return (
    <section className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f7c948' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}></div>
      </div>
      <div className="container mx-auto px-4 py-20 md:py-28 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Main content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-[#f7c948]/10 text-[#f7c948] mb-6 border border-[#f7c948]/20">
              <span className="text-sm font-semibold">Effingham's #1 Dumpster Rental</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              <span className="text-white">Driveway-Friendly</span>{" "}
              <span className="text-[#f7c948]">Dumpster Rentals</span>{" "}
              <span className="text-white">Made Simple</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-xl mx-auto lg:mx-0">
              Family-owned business serving Effingham, IL with small roll-off containers designed to protect your property. Get started in just 3 clicks.
            </p>

            {/* Key benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-[#f7c948] mr-3 flex-shrink-0" />
                <span className="text-gray-300">2,000 lbs included</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-[#f7c948] mr-3 flex-shrink-0" />
                <span className="text-gray-300">Same-day delivery available</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-[#f7c948] mr-3 flex-shrink-0" />
                <span className="text-gray-300">Free electronics recycling</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-[#f7c948] mr-3 flex-shrink-0" />
                <span className="text-gray-300">Transparent pricing</span>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                size="lg" 
                className="bg-[#f7c948] text-black hover:bg-[#f7c948]/90 font-bold text-lg px-8 py-4 h-auto"
                asChild
              >
                <a href="#booking-form" className="flex items-center">
                  Get Your Quote Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-gray-400 text-white hover:border-[#f7c948] hover:text-[#f7c948] hover:bg-white/10 font-semibold text-lg px-8 py-4 h-auto bg-transparent transition-colors duration-200"
                asChild
              >
                <a href="tel:(217) 242-5222">Call (217) 994-2582</a>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-gray-400">
              <div className="flex items-center">
                <span className="text-[#f7c948] font-bold text-lg mr-1">★★★★★</span>
                <span>5.0/5 Rating</span>
              </div>
              <div>200+ Happy Customers</div>
              <div>Family-Owned Since 2019</div>
            </div>
          </div>

          {/* Right side - Visual element */}
          <div className="hidden lg:block">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <h3 className="text-2xl font-bold mb-6 text-center">Quick Quote Calculator</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Container Size</label>
                  <select className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white">
                    <option>10-yard (small projects)</option>
                    <option>20-yard (medium projects)</option>
                    <option>30-yard (large projects)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Rental Duration</label>
                  <select className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white">
                    <option>7 days (standard)</option>
                    <option>3 days</option>
                    <option>14 days</option>
                  </select>
                </div>
                <Button className="w-full bg-[#f7c948] text-black hover:bg-[#f7c948]/90 font-bold py-3">
                  Get Instant Quote
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}