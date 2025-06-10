import { ImprovedHero } from "@/components/home/improved-hero";
import { ServicesSection } from "@/components/home/services-section";
import { ProcessSection } from "@/components/home/process-section";
import { AboutSection } from "@/components/home/about-section";
import { ImprovedTestimonials } from "@/components/home/improved-testimonials";
import { ComparisonSection } from "@/components/home/comparison-section";
import { ImprovedFAQ } from "@/components/home/improved-faq";
import { ContactSection } from "@/components/home/contact-section";
import { FinalCTA } from "@/components/home/final-cta";
import { BookingForm } from "@/components/booking/booking-form";

export default function HomePage() {
  return (
    <div>
      <ImprovedHero />
      
      <ServicesSection />
      
      <ProcessSection />
      
      <AboutSection />
      
      <section id="booking-form" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary mb-4">
              <span className="text-sm font-semibold">Book Your Dumpster</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Fast & Easy Online Booking
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Complete your reservation in just a few minutes. Our simple booking process makes it easy to get the dumpster you need.
            </p>
          </div>
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
            <BookingForm />
          </div>
        </div>
      </section>
      
      <ImprovedTestimonials />
      
      <ComparisonSection />
      
      <ImprovedFAQ />
      
      <ContactSection />
      
      <FinalCTA />
    </div>
  );
}
