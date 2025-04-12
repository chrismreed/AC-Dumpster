import { Star, StarHalf } from "lucide-react";

export function Testimonials() {
  const testimonials = [
    {
      rating: 5,
      text: "Incredibly easy to use. I had my dumpster delivered the next day after ordering online. The driver placed it exactly where I needed it. Great service!",
      name: "Robert J.",
      project: "Home Renovation"
    },
    {
      rating: 5,
      text: "The pricing was straightforward and competitive. I appreciated not having to call around for quotes. The dumpster was clean and in good condition too.",
      name: "Sarah L.",
      project: "Garage Cleanout"
    },
    {
      rating: 4.5,
      text: "I needed to extend my rental by a few days, and it was super easy to do through their website. No hassle, just a few clicks and I was all set.",
      name: "Michael T.",
      project: "Construction Project"
    }
  ];

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`star-${i}`} className="fill-amber-400 text-amber-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<StarHalf key="half-star" className="fill-amber-400 text-amber-400" />);
    }
    
    return stars;
  };

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">What Our Customers Say</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-neutral-100">
              <div className="flex items-center text-amber-400 mb-4">
                {renderStars(testimonial.rating)}
              </div>
              <p className="text-neutral-600 mb-4">"{testimonial.text}"</p>
              <div className="flex items-center">
                <div className="font-medium">{testimonial.name}</div>
                <div className="text-neutral-400 text-sm ml-2">{testimonial.project}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
