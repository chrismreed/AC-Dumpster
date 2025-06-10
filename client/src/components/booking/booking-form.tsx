import { useState, useEffect } from "react";
import { BookingSteps } from "@/components/ui/booking-steps";
import { DumpsterSelector } from "@/components/booking/dumpster-selector";
import { DeliveryDetails } from "@/components/booking/delivery-details";
import { ServiceAddons } from "@/components/booking/service-addons";
import { ReviewOrder } from "@/components/booking/review-order";
import { Button } from "@/components/ui/button";
import { scrollToSection } from "@/lib/scroll-utils";

// Define types for booking data
interface BookingData {
  dumpsterId?: number;
  pricingId?: number;
  selectedAddOns?: any[];
  paymentSuccess?: boolean;
  bookingId?: number;
  [key: string]: any;
}

export function BookingForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState<BookingData>({});
  
  const stepLabels = [
    "Select Dumpster",
    "Location & Date",
    "Add-ons",
    "Review & Pay"
  ];

  // Auto-scroll to booking form only on initial load when someone clicks a "Book Now" button
  useEffect(() => {
    const hasScrolled = sessionStorage.getItem('hasScrolledToBooking');
    if (!hasScrolled) {
      scrollToSection('booking-form');
      sessionStorage.setItem('hasScrolledToBooking', 'true');
    }
  }, []);

  // Scroll to top of form when step changes (for varying step heights)
  useEffect(() => {
    if (currentStep > 1) {
      setTimeout(() => {
        scrollToSection('booking-form');
      }, 350); // Wait for slide animation to complete
    }
  }, [currentStep]);

  const handleStepClick = (step: number) => {
    // Only allow going to steps that have already been visited or the next step
    // Don't allow changing steps if payment was successful
    if (step <= currentStep && !bookingData.paymentSuccess) {
      setCurrentStep(step);
    }
  };

  const handleDumpsterSelect = (data: { dumpsterId: number; pricingId: number }) => {
    setBookingData((prevData: BookingData) => ({ ...prevData, ...data }));
    setCurrentStep(2);
  };

  const handleDeliveryDetails = (data: any) => {
    setBookingData((prevData: BookingData) => ({ ...prevData, ...data }));
    setCurrentStep(3);
  };

  const handleAddOns = (data: { selectedAddOns: any[] }) => {
    setBookingData((prevData: BookingData) => ({ ...prevData, ...data }));
    setCurrentStep(4);
  };

  const handleBack = (step: number) => {
    setCurrentStep(step);
  };

  const handleSubmit = (data: any) => {
    // Combine all data from all steps
    const finalData = { ...bookingData, ...data };
    
    // If this is the "Book Another Dumpster" action after a successful payment
    if (data.paymentSuccess) {
      // Only reset form if the user clicks "Book Another Dumpster"
      setBookingData({});
      setCurrentStep(1);
    } else {
      // Otherwise just update the booking data
      setBookingData(finalData);
    }
  };

  const startNewBooking = () => {
    setBookingData({});
    setCurrentStep(1);
  };

  // If payment was successful, keep showing the confirmation
  const showConfirmation = bookingData.paymentSuccess;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {!showConfirmation && (
        <BookingSteps 
          currentStep={currentStep} 
          totalSteps={stepLabels.length} 
          labels={stepLabels} 
          onStepClick={handleStepClick}
        />
      )}
      <div className="p-6 md:p-8">
        {showConfirmation ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <svg
              className="w-16 h-16 text-green-500 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <h3 className="text-xl font-bold text-green-800 mb-2">Payment Successful!</h3>
            <p className="text-green-700 mb-4">
              Your dumpster rental has been booked successfully. You will receive a confirmation email shortly.
            </p>
            <p className="text-green-700 mb-4">
              Booking ID: <span className="font-bold">#{bookingData.bookingId}</span>
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center mt-4">
              <Button 
                variant="outline"
                onClick={() => window.location.href = `/booking-confirmation?id=${bookingData.bookingId}`}
              >
                View Booking Details
              </Button>
              <Button 
                onClick={startNewBooking}
              >
                Book Another Dumpster
              </Button>
            </div>
          </div>
        ) : (
          <div 
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${(currentStep - 1) * 100}%)` }}
          >
            <div className="w-full flex-shrink-0">
              <DumpsterSelector 
                onNext={handleDumpsterSelect}
                selectedDumpsterId={bookingData.dumpsterId}
                selectedPricingId={bookingData.pricingId}
              />
            </div>
            <div className="w-full flex-shrink-0">
              <DeliveryDetails 
                onBack={() => handleBack(1)} 
                onNext={handleDeliveryDetails}
                initialData={bookingData}
              />
            </div>
            <div className="w-full flex-shrink-0">
              <ServiceAddons 
                onBack={() => handleBack(2)} 
                onNext={handleAddOns}
                selectedAddOns={bookingData.selectedAddOns || []}
              />
            </div>
            <div className="w-full flex-shrink-0">
              <ReviewOrder
                bookingData={bookingData}
                onBack={() => handleBack(3)}
                onSubmit={handleSubmit}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
