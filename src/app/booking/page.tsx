import { BookingForm } from './components/booking-form';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

export default function BookingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-primary mb-4 bg-primary">
              <span className="text-sm font-semibold text-primary-foreground">Book Your Dumpster</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Fast & Easy Online Booking
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Complete your reservation in just a few minutes. Our simple booking process makes it easy to get the dumpster you need.
            </p>
          </div>
          <div className="max-w-4xl mx-auto bg-card rounded-lg shadow-lg overflow-hidden border border-border">
            <BookingForm />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
