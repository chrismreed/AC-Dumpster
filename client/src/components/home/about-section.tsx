import { Button } from "@/components/ui/button";
import { TruckIcon, CalendarIcon, UserIcon, StarIcon } from "lucide-react";

export function AboutSection() {
  return (
    <section id="about" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-[#0f172a] mb-4 bg-[#f7c948]">
              <span className="text-sm font-semibold">About Alley Cat</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0f172a] mb-6">
              Your Local Dumpster Rental Specialists
            </h2>
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              Alley Cat Dumpsters is a family-owned small business based in Effingham, Illinois, specializing in driveway-friendly dumpster rentals and professional junk removal services. We're committed to providing reliable, affordable solutions for your waste management needs.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              Our small, driveway-friendly roll-off containers are designed to protect your property while providing the convenience you need. We serve Effingham and the surrounding area within a 10-mile radius, with extended service available for projects further out.
            </p>
            
            <div className="flex flex-wrap gap-4 mt-8">
              <Button 
                className="bg-primary text-black hover:bg-primary/90 font-bold"
                asChild
              >
                <a href="#booking-form">Book a Dumpster</a>
              </Button>
              <Button 
                variant="outline" 
                className="border-[#0f172a] text-[#0f172a] hover:bg-[#0f172a]/5"
                asChild
              >
                <a href="#contact">Contact Us</a>
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Stats Cards */}
            <div className="bg-[#0f172a] text-[#ffffff] p-6 rounded-lg">
              <div className="mb-4 text-[#facc15]">
                <TruckIcon className="h-10 w-10" />
              </div>
              <h3 className="text-4xl font-bold mb-2">300+</h3>
              <p className="text-gray-300">Dumpsters Delivered</p>
            </div>
            
            <div className="bg-[#0f172a] text-[#ffffff] p-6 rounded-lg">
              <div className="mb-4 text-[#facc15]">
                <CalendarIcon className="h-10 w-10" />
              </div>
              <h3 className="text-4xl font-bold mb-2">5+</h3>
              <p className="text-gray-300">Years in Business</p>
            </div>
            
            <div className="bg-[#0f172a] text-[#ffffff] p-6 rounded-lg">
              <div className="mb-4 text-[#facc15]">
                <UserIcon className="h-10 w-10" />
              </div>
              <h3 className="text-4xl font-bold mb-2">1000+</h3>
              <p className="text-gray-300">Happy Customers</p>
            </div>
            
            <div className="bg-[#0f172a] text-[#ffffff] p-6 rounded-lg">
              <div className="mb-4 text-[#facc15]">
                <StarIcon className="h-10 w-10" />
              </div>
              <h3 className="text-4xl font-bold mb-2">4.9</h3>
              <p className="text-gray-300">Star Rating</p>
            </div>
          </div>
        </div>
        
        {/* Values */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="border-t-4 border-primary pt-4">
            <h3 className="text-xl font-bold mb-3">Local Expertise</h3>
            <p className="text-gray-700">
              We know Effingham and surrounding areas inside and out, allowing us to provide the best service tailored to our community's needs.
            </p>
          </div>
          
          <div className="border-t-4 border-primary pt-4">
            <h3 className="text-xl font-bold mb-3">Customer Satisfaction</h3>
            <p className="text-gray-700">
              Your satisfaction is our top priority. We go above and beyond to ensure a seamless rental experience from start to finish.
            </p>
          </div>
          
          <div className="border-t-4 border-primary pt-4">
            <h3 className="text-xl font-bold mb-3">Environmental Responsibility</h3>
            <p className="text-gray-700">
              We're committed to proper waste disposal practices and work with recycling facilities to minimize environmental impact.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}