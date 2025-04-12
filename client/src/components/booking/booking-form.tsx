import { useState } from "react";
import { BookingSteps } from "@/components/ui/booking-steps";
import { DumpsterSelector } from "@/components/booking/dumpster-selector";
import { DeliveryDetails } from "@/components/booking/delivery-details";
import { ServiceAddons } from "@/components/booking/service-addons";
import { ReviewOrder } from "@/components/booking/review-order";

export function BookingForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState<any>({});

  const stepLabels = [
    "Select Dumpster",
    "Location & Date",
    "Add-ons",
    "Review & Pay"
  ];

  const handleStepClick = (step: number) => {
    // Only allow going to steps that have already been visited or the next step
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  };

  const handleDumpsterSelect = (data: { dumpsterId: number; rentalDurationId: number }) => {
    setBookingData(prevData => ({ ...prevData, ...data }));
    setCurrentStep(2);
  };

  const handleDeliveryDetails = (data: any) => {
    setBookingData(prevData => ({ ...prevData, ...data }));
    setCurrentStep(3);
  };

  const handleAddOns = (data: { selectedAddOns: any[] }) => {
    setBookingData(prevData => ({ ...prevData, ...data }));
    setCurrentStep(4);
  };

  const handleBack = (step: number) => {
    setCurrentStep(step);
  };

  const handleSubmit = (data: any) => {
    // Combine all data from all steps
    const finalData = { ...bookingData, ...data };
    
    // Reset form after successful submission
    setBookingData({});
    setCurrentStep(1);
  };

  return (
    <div>
      <BookingSteps 
        currentStep={currentStep} 
        totalSteps={stepLabels.length} 
        labels={stepLabels} 
        onStepClick={handleStepClick}
      />
      <div className="p-6 md:p-8">
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
      </div>
    </div>
  );
}
