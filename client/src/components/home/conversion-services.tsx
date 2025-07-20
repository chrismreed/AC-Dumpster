import { Button } from "@/components/ui/button";
import { Truck, Home, Building, Recycle, ArrowRight } from "lucide-react";

export function ConversionServices() {
  const services = [
    {
      icon: <Truck className="h-12 w-12" />,
      title: "Dumpster Rentals",
      description: "Driveway-friendly containers perfect for home renovations, cleanouts, and small construction projects.",
      features: [
        "10, 20, 30-yard sizes available",
        "2,000 lbs included",
        "Same-day delivery available"
      ],
      cta: "View Dumpster Sizes",
      href: "#booking-form"
    },
    {
      icon: <Home className="h-12 w-12" />,
      title: "Junk Removal",
      description: "Full-service junk removal where our team loads everything for you. Perfect for hassle-free cleanouts.",
      features: [
        "We do all the loading",
        "Furniture & appliance removal",
        "Same-day service available"
      ],
      cta: "Book Junk Removal",
      href: "#contact"
    },
    {
      icon: <Building className="h-12 w-12" />,
      title: "Construction Waste",
      description: "Reliable waste management for contractors and construction projects throughout central Illinois.",
      features: [
        "Flexible rental periods",
        "Multiple container delivery",
        "Contractor-friendly pricing"
      ],
      cta: "Get Contractor Quote",
      href: "#contact"
    },
    {
      icon: <Recycle className="h-12 w-12" />,
      title: "Free Recycling",
      description: "We offer free recycling for electronics, batteries, and appliances when placed next to your dumpster.",
      features: [
        "Electronics recycling",
        "Battery disposal",
        "Appliance pickup"
      ],
      cta: "Learn More",
      href: "#faq"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary mb-4">
            <span className="text-sm font-semibold">Our Services</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Complete Waste Management Solutions
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From dumpster rentals to full-service junk removal, we have the right solution for your project. All backed by our family-owned commitment to quality service.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <div 
              key={index}
              className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:bg-white border border-transparent hover:border-gray-200"
            >
              <div className="text-primary mb-4">
                {service.icon}
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {service.title}
              </h3>
              
              <p className="text-gray-600 mb-4 leading-relaxed">
                {service.description}
              </p>

              <ul className="space-y-2 mb-6">
                {service.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3 flex-shrink-0"></div>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button 
                variant="outline" 
                className="w-full group border-gray-300 hover:border-primary hover:text-primary"
                asChild
              >
                <a href={service.href} className="flex items-center justify-center">
                  {service.cta}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
            </div>
          ))}
        </div>

        {/* Additional CTA section */}
        <div className="mt-16 bg-[#0f172a] rounded-2xl p-8 md:p-12 text-center text-white">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            Not Sure What Service You Need?
          </h3>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Our experienced team can help you choose the right solution for your project. Get personalized recommendations and accurate pricing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-[#f7c948] text-black hover:bg-[#f7c948]/90 font-bold"
              asChild
            >
              <a href="#booking-form">Get Free Quote</a>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-white/30 text-white hover:bg-white/10"
              asChild
            >
              <a href="tel:(217) 242-5222">Call Us Now</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}