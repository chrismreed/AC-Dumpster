import { Hero } from "@/components/home/hero";
import { Features } from "@/components/home/features";
import { Testimonials } from "@/components/home/testimonials";
import { FAQ } from "@/components/home/faq";
import { BookingForm } from "@/components/booking/booking-form";

export default function HomePage() {
  return (
    <div>
      <Hero />
      
      <section id="booking-form" className="py-12 md:py-16 bg-[#f5f5f5]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden border border-[#eaeaea]">
            <BookingForm />
          </div>
        </div>
      </section>
      
      <Features />
      <Testimonials />
      <FAQ />
      
      <section className="py-12 md:py-16 bg-[#2c2c2c] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 text-[#ffdd33]">READY TO GET STARTED?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">Book your dumpster today and enjoy hassle-free waste management for your project.</p>
          <a 
            href="#booking-form" 
            className="inline-flex items-center px-8 py-3 border border-transparent rounded-sm shadow-sm text-base font-bold text-[#2c2c2c] bg-[#ffdd33] hover:bg-[#ffd700] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ffdd33] uppercase"
          >
            RENT NOW
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 ml-2" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" 
                clipRule="evenodd" 
              />
            </svg>
          </a>
        </div>
      </section>
    </div>
  );
}
