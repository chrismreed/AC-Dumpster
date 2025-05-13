import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function ProcessSection() {
  return (
    <section id="how-it-works" className="py-16 bg-black text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/20 text-primary mb-4">
            <span className="text-sm font-semibold">Simple Process</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            We've made getting a dumpster as easy as possible. Just four simple steps and you're done!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Step 1 */}
          <div className="bg-white/5 backdrop-blur-sm p-6 rounded-lg border border-primary/20 relative">
            <div className="absolute -top-5 -left-5 bg-primary text-black w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl">
              1
            </div>
            <div className="pt-4">
              <h3 className="text-xl font-bold mb-3 text-primary">Book Online</h3>
              <p className="text-gray-300">
                Fill out our simple booking form with your project details, location, and preferred delivery date.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white/5 backdrop-blur-sm p-6 rounded-lg border border-primary/20 relative">
            <div className="absolute -top-5 -left-5 bg-primary text-black w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl">
              2
            </div>
            <div className="pt-4">
              <h3 className="text-xl font-bold mb-3 text-primary">We Deliver</h3>
              <p className="text-gray-300">
                Our team will deliver the dumpster to your location on the scheduled date. We'll place it exactly where you need it.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white/5 backdrop-blur-sm p-6 rounded-lg border border-primary/20 relative">
            <div className="absolute -top-5 -left-5 bg-primary text-black w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl">
              3
            </div>
            <div className="pt-4">
              <h3 className="text-xl font-bold mb-3 text-primary">Fill It Up</h3>
              <p className="text-gray-300">
                Take your time filling the dumpster with your waste materials during your rental period.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white/5 backdrop-blur-sm p-6 rounded-lg border border-primary/20 relative">
            <div className="absolute -top-5 -left-5 bg-primary text-black w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl">
              4
            </div>
            <div className="pt-4">
              <h3 className="text-xl font-bold mb-3 text-primary">We Pick Up</h3>
              <p className="text-gray-300">
                When you're finished or your rental period ends, we'll come collect the dumpster and properly dispose of the waste.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Need your dumpster picked up early or want to extend your rental? No problem! Just give us a call and we'll accommodate your schedule.
          </p>
          <Button className="bg-primary text-black hover:bg-primary/90 font-bold" asChild>
            <a href="#booking-form" className="inline-flex items-center">
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}