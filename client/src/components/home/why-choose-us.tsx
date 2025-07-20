import { Button } from "@/components/ui/button";
import { CheckCircle, Truck, Shield, Clock, DollarSign, Phone } from "lucide-react";

export function WhyChooseUs() {
  const reasons = [
    {
      icon: <Truck className="h-8 w-8" />,
      title: "Driveway-Friendly Containers",
      description: "Our small roll-off containers are designed to protect your property while fitting in tight spaces."
    },
    {
      icon: <DollarSign className="h-8 w-8" />,
      title: "Transparent Pricing",
      description: "No hidden fees. 2,000 lbs included, only $80/ton for overages. Service within 10 miles of Effingham included."
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: "Fast, Reliable Service",
      description: "Same-day delivery available. We deliver when promised and pick up on time, every time."
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Family-Owned & Local",
      description: "We're a small business from Effingham, IL that cares about our community and customers."
    },
    {
      icon: <CheckCircle className="h-8 w-8" />,
      title: "Full-Service Options",
      description: "Don't want to load it yourself? We also offer complete junk removal services."
    },
    {
      icon: <Phone className="h-8 w-8" />,
      title: "Personal Service",
      description: "Talk to real people, not automated systems. We're here to help make your project easier."
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary mb-4">
            <span className="text-sm font-semibold">Why Choose Us</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Alley Cat Dumpsters?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're not just another dumpster company. Here's what makes us different and why thousands of customers trust us with their projects.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reasons.map((reason, index) => (
            <div 
              key={index} 
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="text-primary mb-4">
                {reason.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {reason.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {reason.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Join thousands of satisfied customers who chose Alley Cat Dumpsters for their waste management needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-primary text-black hover:bg-primary/90 font-bold"
                asChild
              >
                <a href="#booking-form">Get Your Quote Now</a>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                asChild
              >
                <a href="#contact">Talk to Our Team</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}