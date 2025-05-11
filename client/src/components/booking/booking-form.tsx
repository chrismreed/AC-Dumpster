import { useState } from "react";
import { BookingSteps } from "@/components/ui/booking-steps";
import { DumpsterSelector } from "@/components/booking/dumpster-selector";
import { DeliveryDetails } from "@/components/booking/delivery-details";
import { ServiceAddons } from "@/components/booking/service-addons";
import { ReviewOrder } from "@/components/booking/review-order";
import { Button } from "@/components/ui/button";

// Define types for booking data
interface BookingData {
  dumpsterId?: number;
  rentalDurationId?: number;
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

  const handleStepClick = (step: number) => {
    // Only allow going to steps that have already been visited or the next step
    // Don't allow changing steps if payment was successful
    if (step <= currentStep && !bookingData.paymentSuccess) {
      setCurrentStep(step);
    }
  };

  const handleDumpsterSelect = (data: { dumpsterId: number; rentalDurationId: number }) => {
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
            <Button 
              onClick={startNewBooking}
              className="mt-4"
            >
              Book Another Dumpster
            </Button>
          </div>
        ) : (
          <>
            {currentStep === 1 && (
              <DumpsterSelector onNext={handleDumpsterSelect} />
            )}
            {currentStep === 2 && (
              <DeliveryDetails 
                onBack={() => handleBack(1)} 
                onNext={handleDeliveryDetails} 
              />
            )}
            {currentStep === 3 && (
              <ServiceAddons 
                onBack={() => handleBack(2)} 
                onNext={handleAddOns} 
              />
            )}
            {currentStep === 4 && (
              <ReviewOrder
                bookingData={bookingData}
                onBack={() => handleBack(3)}
                onSubmit={handleSubmit}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
