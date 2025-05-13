import { Users, Star, ThumbsUp, Trophy } from 'lucide-react';

export function AboutSection() {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary mb-4">
              <span className="text-sm font-semibold">About Alley Cat</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Your Local Dumpster Rental Experts
            </h2>
            <p className="text-gray-600 mb-6">
              Alley Cat Dumpster Rental is a family-owned business proudly serving Effingham and surrounding areas. 
              We started with a simple mission: to provide reliable, affordable dumpster rentals with exceptional customer service.
            </p>
            <p className="text-gray-600 mb-6">
              Today, we're the area's trusted waste solution provider for homeowners, contractors, and businesses. 
              Our team is committed to making your waste management experience as hassle-free as possible.
            </p>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-primary/10 rounded-full p-2 mr-4">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Our Mission</h4>
                  <p className="text-gray-600">To provide dependable waste solutions with transparent pricing and exceptional service.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-primary/10 rounded-full p-2 mr-4">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Our Team</h4>
                  <p className="text-gray-600">Experienced professionals dedicated to making your project a success from start to finish.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
              <div className="flex justify-center">
                <div className="bg-primary/10 rounded-full p-3 mb-4">
                  <Star className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-4xl font-bold text-center text-gray-900 mb-2">98%</h3>
              <p className="text-center text-gray-600">Customer Satisfaction</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
              <div className="flex justify-center">
                <div className="bg-primary/10 rounded-full p-3 mb-4">
                  <ThumbsUp className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-4xl font-bold text-center text-gray-900 mb-2">500+</h3>
              <p className="text-center text-gray-600">Projects Completed</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
              <div className="flex justify-center">
                <div className="bg-primary/10 rounded-full p-3 mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-4xl font-bold text-center text-gray-900 mb-2">15+</h3>
              <p className="text-center text-gray-600">Team Members</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
              <div className="flex justify-center">
                <div className="bg-primary/10 rounded-full p-3 mb-4">
                  <Trophy className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-4xl font-bold text-center text-gray-900 mb-2">7+</h3>
              <p className="text-center text-gray-600">Years of Experience</p>
            </div>
          </div>
        </div>
        
        <div className="mt-16 pt-12 border-t border-gray-200">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Areas We Serve</h3>
            <p className="text-gray-600 max-w-3xl mx-auto">
              We provide dumpster rental services throughout Effingham County and surrounding areas.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Effingham</h4>
              <p className="text-gray-600 text-sm">Our headquarters with same-day service available</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Altamont</h4>
              <p className="text-gray-600 text-sm">Serving residential and commercial customers</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Teutopolis</h4>
              <p className="text-gray-600 text-sm">Fast delivery for all dumpster sizes</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Dieterich</h4>
              <p className="text-gray-600 text-sm">Supporting local construction projects</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}