import { Button } from "@/components/ui/button";
import { ArrowRight, TruckIcon, MapPinIcon, CheckCircleIcon } from "lucide-react";

export function ImprovedHero() {
  return (
    <section className="relative bg-black text-white">
      {/* Background with overlay */}
      <div className="absolute inset-0 bg-black/80 z-0"></div>
      
      {/* Hero content */}
      <div className="relative z-10 pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="text-primary">Fast</span> &{" "}
                <span className="text-primary">Reliable</span>{" "}
                Dumpster Rental
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mt-4 max-w-xl">
                The right dumpster for your project, delivered when you need it. Simple online booking with transparent pricing.
              </p>
              <div className="pt-6 flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  className="bg-primary text-black hover:bg-primary/90 font-bold text-lg px-7 py-6 rounded-lg shadow-lg"
                  asChild
                >
                  <a href="#booking-form" className="inline-flex items-center">
                    RENT NOW <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-white text-white hover:bg-white/20 font-bold text-lg px-7 py-6 rounded-lg"
                  asChild
                >
                  <a href="#services">VIEW SIZES</a>
                </Button>
              </div>
            </div>
            <div className="bg-black/50 backdrop-blur-md p-8 rounded-xl border border-white/10 shadow-lg">
              <h3 className="font-bold text-2xl mb-6 flex items-center">
                <span className="text-primary mr-3">★</span> 
                Proudly Serving Effingham & Surrounding Areas
              </h3>
              <ul className="space-y-5">
                <li className="flex items-start">
                  <div className="mr-4 mt-1 text-primary">
                    <CheckCircleIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium text-lg">Same-day or next-day delivery available</p>
                    <p className="text-gray-400 text-sm">Get your dumpster when you need it</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="mr-4 mt-1 text-primary">
                    <CheckCircleIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium text-lg">No hidden fees, transparent pricing</p>
                    <p className="text-gray-400 text-sm">Pay only for what you need</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="mr-4 mt-1 text-primary">
                    <CheckCircleIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium text-lg">7-day standard rental period</p>
                    <p className="text-gray-400 text-sm">Extensions available if needed</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="mr-4 mt-1 text-primary">
                    <CheckCircleIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium text-lg">Multiple sizes available (10-30 yards)</p>
                    <p className="text-gray-400 text-sm">For any project, big or small</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Trust bar */}
      <div className="bg-black/90 backdrop-blur-sm border-y border-white/10 shadow-md">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-center md:justify-start">
              <div className="mr-4 text-primary bg-primary/10 p-3 rounded-full">
                <TruckIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium text-lg">Fast Delivery</p>
                <p className="text-sm text-gray-400">Within 24 hours in most areas</p>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="mr-4 text-primary bg-primary/10 p-3 rounded-full">
                <MapPinIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium text-lg">Serving All of Effingham</p>
                <p className="text-sm text-gray-400">And surrounding communities</p>
              </div>
            </div>
            <div className="flex items-center justify-center md:justify-end">
              <div className="mr-4 text-primary bg-primary/10 p-3 rounded-full">
                <div className="flex">
                  <span className="text-primary">★</span>
                </div>
              </div>
              <div>
                <p className="font-medium text-lg">5-Star Service</p>
                <p className="text-sm text-gray-400">Based on 200+ reviews</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}