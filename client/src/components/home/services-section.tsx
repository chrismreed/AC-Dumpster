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
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105">
            <div className="bg-black text-white p-6 text-center">
              <h3 className="text-2xl font-bold">10 Yard Dumpster</h3>
              <p className="text-gray-300 mt-1">Small Projects</p>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-4xl font-bold text-black">$299</p>
                <p className="text-gray-500">7 Day Rental</p>
              </div>
              <div className="space-y-3 mb-8">
                <div className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <p>Dimensions: 12' x 8' x 3.5'</p>
                </div>
                <div className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <p>Weight Capacity: 2 tons</p>
                </div>
                <div className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <p>Perfect for: Small remodels, yard waste, garage cleanouts</p>
                </div>
                <div className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <p>Holds approximately: 3 pickup truck loads</p>
                </div>
              </div>
              <Button className="w-full bg-black hover:bg-black/90 text-white" asChild>
                <a href="#booking-form">Rent Now</a>
              </Button>
            </div>
          </div>

          {/* 20 Yard Dumpster */}
          <div className="border-2 border-primary rounded-lg overflow-hidden shadow-xl relative scale-105 z-10">
            <div className="absolute top-0 right-0 bg-primary text-black font-bold py-1 px-4 text-sm">
              POPULAR
            </div>
            <div className="bg-black text-white p-6 text-center">
              <h3 className="text-2xl font-bold">20 Yard Dumpster</h3>
              <p className="text-gray-300 mt-1">Medium Projects</p>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-4xl font-bold text-black">$399</p>
                <p className="text-gray-500">7 Day Rental</p>
              </div>
              <div className="space-y-3 mb-8">
                <div className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <p>Dimensions: 16' x 8' x 5.5'</p>
                </div>
                <div className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <p>Weight Capacity: 4 tons</p>
                </div>
                <div className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <p>Perfect for: Home renovations, roofing jobs, deck removal</p>
                </div>
                <div className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <p>Holds approximately: 6 pickup truck loads</p>
                </div>
              </div>
              <Button className="w-full bg-primary hover:bg-primary/90 text-black font-bold" asChild>
                <a href="#booking-form" className="flex justify-center items-center">
                  Rent Now <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>

          {/* 30 Yard Dumpster */}
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105">
            <div className="bg-black text-white p-6 text-center">
              <h3 className="text-2xl font-bold">30 Yard Dumpster</h3>
              <p className="text-gray-300 mt-1">Large Projects</p>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-4xl font-bold text-black">$499</p>
                <p className="text-gray-500">7 Day Rental</p>
              </div>
              <div className="space-y-3 mb-8">
                <div className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <p>Dimensions: 20' x 8' x 6'</p>
                </div>
                <div className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <p>Weight Capacity: 6 tons</p>
                </div>
                <div className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <p>Perfect for: Major renovations, new construction, large cleanouts</p>
                </div>
                <div className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <p>Holds approximately: 9 pickup truck loads</p>
                </div>
              </div>
              <Button className="w-full bg-black hover:bg-black/90 text-white" asChild>
                <a href="#booking-form">Rent Now</a>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-6">
            Not sure which size is right for your project? Give us a call and our experts will help you choose.
          </p>
          <Button className="bg-black hover:bg-black/90 text-white" asChild>
            <a href="tel:5551234567" className="font-medium">Call (555) 123-4567</a>
          </Button>
        </div>
      </div>
    </section>
  );
}