import { Star, Quote } from 'lucide-react';

export function ImprovedTestimonials() {
  return (
    <section id="testimonials" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary mb-4">
            <span className="text-sm font-semibold">Customer Testimonials</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What Our Customers Say
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Don't just take our word for it. See what our satisfied customers have to say about our dumpster rental services.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <TestimonialCard
            quote="Alley Cat made my home renovation project so much easier. They delivered the dumpster right on time and placed it exactly where I needed it. Pickup was just as smooth. Highly recommend!"
            name="Jennifer S."
            title="Homeowner"
            location="Effingham"
            rating={5}
          />
          <TestimonialCard
            quote="As a contractor, I need reliable waste management for my projects. Alley Cat consistently delivers quality service at fair prices. They're now my go-to for all dumpster rentals."
            name="Mike T."
            title="General Contractor"
            location="Altamont"
            rating={5}
            featured={true}
          />
          <TestimonialCard
            quote="I was cleaning out my parents' home and needed a dumpster quickly. Alley Cat was able to deliver the next day, and their team was incredibly helpful throughout the entire process."
            name="David K."
            title="Residential Customer"
            location="Teutopolis"
            rating={5}
          />
        </div>
        
        <div className="mt-16 bg-white rounded-xl p-8 shadow-sm">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Why Our Customers Love Us
              </h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-20 text-center">
                    <div className="flex justify-center">
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    </div>
                    <p className="text-sm font-medium mt-1">Reliability</p>
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-primary h-2.5 rounded-full" style={{ width: '98%' }}></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">98% on-time delivery and pickup rate</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-20 text-center">
                    <div className="flex justify-center">
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    </div>
                    <p className="text-sm font-medium mt-1">Service</p>
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-primary h-2.5 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">100% customer service satisfaction</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-20 text-center">
                    <div className="flex justify-center">
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    </div>
                    <p className="text-sm font-medium mt-1">Value</p>
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-primary h-2.5 rounded-full" style={{ width: '97%' }}></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">97% would recommend us to a friend</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg relative">
              <Quote className="h-12 w-12 text-primary/20 absolute top-3 left-3" />
              <blockquote className="text-gray-600 text-lg italic ml-8 relative z-10">
                "I've been using Alley Cat Dumpster Rental for all my construction projects for the past 3 years. Their pricing is transparent, their service is exceptional, and they always go the extra mile to ensure everything goes smoothly. I wouldn't consider using any other company for my waste management needs."
              </blockquote>
              <div className="mt-6 flex items-center">
                <div className="w-12 h-12 bg-gray-300 rounded-full mr-4"></div>
                <div>
                  <p className="font-semibold text-gray-900">Robert Johnson</p>
                  <p className="text-sm text-gray-600">Johnson Construction, Effingham</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ 
  quote, 
  name, 
  title, 
  location, 
  rating, 
  featured = false 
}: { 
  quote: string; 
  name: string; 
  title: string; 
  location: string; 
  rating: number;
  featured?: boolean;
}) {
  return (
    <div className={`bg-white rounded-lg p-6 shadow-sm ${featured ? 'border-2 border-primary' : ''} relative h-full flex flex-col`}>
      {featured && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full">
          Featured
        </div>
      )}
      <div className="flex mb-4">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
        ))}
      </div>
      <Quote className="h-8 w-8 text-primary/20 mb-2" />
      <blockquote className="text-gray-600 italic mb-6 flex-grow">"{quote}"</blockquote>
      <div className="mt-auto">
        <p className="font-semibold text-gray-900">{name}</p>
        <p className="text-sm text-gray-600">{title}, {location}</p>
      </div>
    </div>
  );
}