import { Button } from "@/components/ui/button";
import { ArrowRight, CheckIcon } from "lucide-react";

export function ServicesSection() {
  return (
    <section id="services" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
            Choose the Right Size for Your Project
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We offer a variety of dumpster sizes to fit your specific needs, whether it's a small home cleanout or a major construction project.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 10 Yard Dumpster */}
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-white">
            <div className="bg-slate-800 text-white p-6 text-center">
              <h3 className="text-2xl font-bold">10 Yard Dumpster</h3>
              <p className="text-gray-300 mt-1">Small Projects</p>
            </div>
            <div className="p-8">
              <div className="text-center mb-6">
                <p className="text-4xl font-bold text-black">$299</p>
                <p className="text-gray-500">7 Day Rental</p>
              </div>
              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <div className="bg-primary/10 p-1 rounded-full mr-3 mt-0.5 flex-shrink-0">
                    <CheckIcon className="h-4 w-4 text-primary" />
                  </div>
                  <p>Dimensions: 12' x 8' x 3.5'</p>
                </div>
                <div className="flex items-start">
                  <div className="bg-primary/10 p-1 rounded-full mr-3 mt-0.5 flex-shrink-0">
                    <CheckIcon className="h-4 w-4 text-primary" />
                  </div>
                  <p>Weight Capacity: 2 tons</p>
                </div>
                <div className="flex items-start">
                  <div className="bg-primary/10 p-1 rounded-full mr-3 mt-0.5 flex-shrink-0">
                    <CheckIcon className="h-4 w-4 text-primary" />
                  </div>
                  <p>Perfect for: Small remodels, yard waste, garage cleanouts</p>
                </div>
                <div className="flex items-start">
                  <div className="bg-primary/10 p-1 rounded-full mr-3 mt-0.5 flex-shrink-0">
                    <CheckIcon className="h-4 w-4 text-primary" />
                  </div>
                  <p>Holds approximately: 3 pickup truck loads</p>
                </div>
              </div>
              <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300" asChild>
                <a href="#booking-form">Rent Now</a>
              </Button>
            </div>
          </div>

          {/* 20 Yard Dumpster */}
          <div className="border-2 border-primary rounded-xl overflow-hidden shadow-2xl relative scale-105 z-10 bg-white">
            <div className="absolute -top-1 right-0 bg-primary text-slate-900 font-bold py-2 px-6 text-sm rounded-bl-lg shadow-md">
              POPULAR
            </div>
            <div className="bg-slate-800 text-white p-6 text-center">
              <h3 className="text-2xl font-bold">20 Yard Dumpster</h3>
              <p className="text-gray-300 mt-1">Medium Projects</p>
            </div>
            <div className="p-8">
              <div className="text-center mb-6">
                <p className="text-4xl font-bold text-black">$399</p>
                <p className="text-gray-500">7 Day Rental</p>
              </div>
              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <div className="bg-primary/10 p-1 rounded-full mr-3 mt-0.5 flex-shrink-0">
                    <CheckIcon className="h-4 w-4 text-primary" />
                  </div>
                  <p>Dimensions: 16' x 8' x 5.5'</p>
                </div>
                <div className="flex items-start">
                  <div className="bg-primary/10 p-1 rounded-full mr-3 mt-0.5 flex-shrink-0">
                    <CheckIcon className="h-4 w-4 text-primary" />
                  </div>
                  <p>Weight Capacity: 4 tons</p>
                </div>
                <div className="flex items-start">
                  <div className="bg-primary/10 p-1 rounded-full mr-3 mt-0.5 flex-shrink-0">
                    <CheckIcon className="h-4 w-4 text-primary" />
                  </div>
                  <p>Perfect for: Home renovations, roofing jobs, deck removal</p>
                </div>
                <div className="flex items-start">
                  <div className="bg-primary/10 p-1 rounded-full mr-3 mt-0.5 flex-shrink-0">
                    <CheckIcon className="h-4 w-4 text-primary" />
                  </div>
                  <p>Holds approximately: 6 pickup truck loads</p>
                </div>
              </div>
              <Button className="w-full bg-primary hover:bg-primary/90 text-slate-900 font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300" asChild>
                <a href="#booking-form" className="flex justify-center items-center">
                  Rent Now <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>

          {/* 30 Yard Dumpster */}
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-white">
            <div className="bg-slate-800 text-white p-6 text-center">
              <h3 className="text-2xl font-bold">30 Yard Dumpster</h3>
              <p className="text-gray-300 mt-1">Large Projects</p>
            </div>
            <div className="p-8">
              <div className="text-center mb-6">
                <p className="text-4xl font-bold text-black">$499</p>
                <p className="text-gray-500">7 Day Rental</p>
              </div>
              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <div className="bg-primary/10 p-1 rounded-full mr-3 mt-0.5 flex-shrink-0">
                    <CheckIcon className="h-4 w-4 text-primary" />
                  </div>
                  <p>Dimensions: 20' x 8' x 6'</p>
                </div>
                <div className="flex items-start">
                  <div className="bg-primary/10 p-1 rounded-full mr-3 mt-0.5 flex-shrink-0">
                    <CheckIcon className="h-4 w-4 text-primary" />
                  </div>
                  <p>Weight Capacity: 6 tons</p>
                </div>
                <div className="flex items-start">
                  <div className="bg-primary/10 p-1 rounded-full mr-3 mt-0.5 flex-shrink-0">
                    <CheckIcon className="h-4 w-4 text-primary" />
                  </div>
                  <p>Perfect for: Major renovations, new construction, large cleanouts</p>
                </div>
                <div className="flex items-start">
                  <div className="bg-primary/10 p-1 rounded-full mr-3 mt-0.5 flex-shrink-0">
                    <CheckIcon className="h-4 w-4 text-primary" />
                  </div>
                  <p>Holds approximately: 9 pickup truck loads</p>
                </div>
              </div>
              <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300" asChild>
                <a href="#booking-form">Rent Now</a>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-6 text-lg">
            Not sure which size is right for your project? Give us a call and our experts will help you choose.
          </p>
          <Button className="bg-slate-800 hover:bg-slate-700 text-white py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300" asChild>
            <a href="tel:5551234567" className="font-medium text-lg">Call (555) 123-4567</a>
          </Button>
        </div>
      </div>
    </section>
  );
}