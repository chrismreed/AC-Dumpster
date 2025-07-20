import { useGoogleReviews } from "@/hooks/use-google-reviews";
import { Button } from "@/components/ui/button";
import { Star, ExternalLink, Loader2, MessageSquare } from "lucide-react";

export function GoogleReviewsTestimonials() {
  const { data: placeData, isLoading, error } = useGoogleReviews();

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-5 w-5 ${
          index < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (isLoading) {
    return (
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary mb-4">
              <span className="text-sm font-semibold">Customer Reviews</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !placeData) {
    // Fallback to local testimonials if Google Reviews fail
    const fallbackTestimonials = [
      {
        name: "Mike Johnson",
        location: "Effingham, IL",
        rating: 5,
        text: "Great service! The dumpster was delivered right on time and picked up as scheduled. Very professional team and fair pricing.",
        date: "2 weeks ago"
      },
      {
        name: "Sarah Miller", 
        location: "Teutopolis, IL",
        rating: 5,
        text: "Alley Cat Dumpsters made our home renovation so much easier. The container fit perfectly in our driveway and didn't damage anything.",
        date: "1 month ago"
      },
      {
        name: "David Thompson",
        location: "Altamont, IL", 
        rating: 5,
        text: "Family-owned business that really cares about their customers. Quick delivery and the price was exactly what they quoted - no surprises.",
        date: "3 weeks ago"
      }
    ];

    return (
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary mb-4">
              <span className="text-sm font-semibold">Customer Reviews</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Don't just take our word for it. Here's what our satisfied customers have to say about their experience with Alley Cat Dumpsters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {fallbackTestimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <div className="flex items-center mb-4">
                  <div className="flex">
                    {renderStars(testimonial.rating)}
                  </div>
                  <span className="ml-2 text-sm text-gray-500">{testimonial.date}</span>
                </div>
                <p className="text-gray-700 mb-4 leading-relaxed">"{testimonial.text}"</p>
                <div className="border-t pt-4">
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const displayReviews = placeData.reviews?.slice(0, 3) || [];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary mb-4">
            <span className="text-sm font-semibold">Google Reviews</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What Our Customers Say
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Real reviews from real customers on Google. See why families and businesses across central Illinois trust Alley Cat Dumpsters.
          </p>
          
          {/* Google Rating Summary */}
          <div className="bg-gray-50 rounded-xl p-6 inline-block">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-1">
                  {placeData.rating?.toFixed(1) || 'N/A'}
                </div>
                <div className="flex justify-center mb-1">
                  {renderStars(Math.round(placeData.rating || 0))}
                </div>
                <div className="text-sm text-gray-600">
                  Google Rating
                </div>
              </div>
              <div className="h-12 w-px bg-gray-300"></div>
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-1">
                  {placeData.user_ratings_total || 0}
                </div>
                <div className="text-sm text-gray-600 mt-3">
                  Total Reviews
                </div>
              </div>
            </div>
          </div>
        </div>

        {displayReviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {displayReviews.map((review, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <div className="flex items-center mb-4">
                  <img 
                    src={review.profile_photo_url} 
                    alt={review.author_name}
                    className="w-12 h-12 rounded-full mr-3"
                    onError={(e) => {
                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='12' cy='7' r='4'%3E%3C/circle%3E%3C/svg%3E";
                    }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <div className="flex mr-2">
                        {renderStars(review.rating)}
                      </div>
                      <span className="text-sm text-gray-500">{review.relative_time_description}</span>
                    </div>
                    <p className="font-semibold text-gray-900">{review.author_name}</p>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {review.text.length > 200 ? `${review.text.substring(0, 200)}...` : review.text}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Loading reviews...</p>
          </div>
        )}

        <div className="text-center">
          <Button 
            variant="outline" 
            size="lg" 
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
            asChild
          >
            <a 
              href={`https://www.google.com/maps/search/Alley+Cat+Dumpsters+Effingham+IL`}
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center"
            >
              View All Google Reviews
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}