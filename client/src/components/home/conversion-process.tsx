import { Button } from "@/components/ui/button";
import { Phone, Calendar, Truck, CheckCircle, ArrowRight } from "lucide-react";

export function ConversionProcess() {
  const steps = [
    {
      icon: <Phone className="h-8 w-8" />,
      number: "1",
      title: "Get Your Quote",
      description: "Use our online form or call us directly. We'll provide transparent pricing with no hidden fees.",
      time: "2 minutes"
    },
    {
      icon: <Calendar className="h-8 w-8" />,
      number: "2",
      title: "Schedule Delivery",
      description: "Choose your delivery date and time. Same-day delivery available for urgent projects.",
      time: "Same day available"
    },
    {
      icon: <Truck className="h-8 w-8" />,
      number: "3", 
      title: "We Deliver & Pick Up",
      description: "We deliver your driveway-friendly container and pick it up when you're done. Simple as that.",
      time: "On schedule"
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full mb-4 bg-[#f7c948] text-[#111827]">
            <span className="text-sm font-semibold">How It Works</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Simple 3-Step Process
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Getting your dumpster is easier than ever. From quote to pickup, we handle everything so you can focus on your project.
          </p>
        </div>

        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {steps.map((step, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center hover:shadow-lg transition-shadow relative">
                  {/* Number positioned at top left corner */}
                  <div className="absolute top-0 left-0">
                    <div className="inline-flex items-center justify-center px-4 py-2 bg-primary text-black rounded-tl-xl shadow-md text-sm font-bold">
                      {step.number}
                    </div>
                  </div>
                  
                  {/* Centered icon */}
                  <div className="mb-6 flex justify-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-full">
                      <div className="text-primary">
                        {step.icon}
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {step.description}
                  </p>

                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm font-medium">
                    {step.time}
                  </div>
                </div>
            ))}
          </div>
        </div>

        {/* CTA section */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Join thousands of satisfied customers who chose the easiest way to handle their waste management needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-primary text-black hover:bg-primary/90 font-bold"
                asChild
              >
                <a href="#booking-form">Start Your Quote</a>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                asChild
              >
                <a href="tel:(217) 242-5222">Call (217) 242-5222</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}