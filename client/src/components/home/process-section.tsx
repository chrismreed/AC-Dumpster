import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { scrollToSection } from "@/lib/scroll-utils";

export function ProcessSection() {
  return (
    <section id="how-it-works" className="py-16 bg-[#0f172a] text-[#ffffff]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#facc15]/20 text-[#facc15] mb-4">
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
          <div className="bg-white/5 backdrop-blur-sm p-8 rounded-xl border border-white/10 shadow-lg relative">
            <div className="absolute -top-5 -left-5 bg-[#facc15] text-[#0f172a] w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-md">
              1
            </div>
            <div className="pt-4">
              <h3 className="text-xl font-bold mb-4 text-[#facc15]">Book Online</h3>
              <p className="text-gray-300 leading-relaxed">
                Fill out our simple booking form with your project details, location, and preferred delivery date.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white/5 backdrop-blur-sm p-8 rounded-xl border border-white/10 shadow-lg relative">
            <div className="absolute -top-5 -left-5 bg-[#facc15] text-[#0f172a] w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-md">
              2
            </div>
            <div className="pt-4">
              <h3 className="text-xl font-bold mb-4 text-[#facc15]">We Deliver</h3>
              <p className="text-gray-300 leading-relaxed">
                Our team will deliver the dumpster to your location on the scheduled date. We'll place it exactly where you need it.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white/5 backdrop-blur-sm p-8 rounded-xl border border-white/10 shadow-lg relative">
            <div className="absolute -top-5 -left-5 bg-[#facc15] text-[#0f172a] w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-md">
              3
            </div>
            <div className="pt-4">
              <h3 className="text-xl font-bold mb-4 text-[#facc15]">Fill It Up</h3>
              <p className="text-gray-300 leading-relaxed">
                Take your time filling the dumpster with your waste materials during your rental period.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white/5 backdrop-blur-sm p-8 rounded-xl border border-white/10 shadow-lg relative">
            <div className="absolute -top-5 -left-5 bg-[#facc15] text-[#0f172a] w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-md">
              4
            </div>
            <div className="pt-4">
              <h3 className="text-xl font-bold mb-4 text-[#facc15]">We Pick Up</h3>
              <p className="text-gray-300 leading-relaxed">
                When you're finished or your rental period ends, we'll come collect the dumpster and properly dispose of the waste.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto text-lg">
            Need your dumpster picked up early or want to extend your rental? No problem! Just give us a call and we'll accommodate your schedule.
          </p>
          <Button 
            onClick={() => scrollToSection('booking-form')}
            className="bg-[#facc15] text-[#0f172a] hover:bg-[#eab308] font-bold px-8 py-3 rounded-lg shadow-md inline-flex items-center text-lg"
          >
            Get Started <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}