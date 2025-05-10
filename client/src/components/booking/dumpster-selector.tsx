import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dumpster, RentalDuration } from "@shared/schema";
import { PricingCard } from "@/components/ui/pricing-card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface DumpsterSelectorProps {
  onNext: (data: { dumpsterId: number, rentalDurationId: number }) => void;
}

export function DumpsterSelector({ onNext }: DumpsterSelectorProps) {
  const [selectedDumpsterId, setSelectedDumpsterId] = useState<number | null>(null);
  const [selectedDurationId, setSelectedDurationId] = useState<number | null>(null);
  const durationSectionRef = useRef<HTMLDivElement>(null);

  const { data: dumpsters, isLoading: isLoadingDumpsters } = useQuery<Dumpster[]>({
    queryKey: ["/api/dumpsters"],
  });

  const { data: durations, isLoading: isLoadingDurations } = useQuery<RentalDuration[]>({
    queryKey: ["/api/durations"],
  });

  useEffect(() => {
    // Set first duration as default when data loads
    if (durations && durations.length > 0 && !selectedDurationId) {
      setSelectedDurationId(durations[0].id);
    }
  }, [durations, selectedDurationId]);
  
  // Scroll to duration section when a dumpster is selected
  useEffect(() => {
    if (selectedDumpsterId && durationSectionRef.current) {
      setTimeout(() => {
        durationSectionRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    }
  }, [selectedDumpsterId]);

  const handleContinue = () => {
    if (selectedDumpsterId && selectedDurationId) {
      onNext({ 
        dumpsterId: selectedDumpsterId, 
        rentalDurationId: selectedDurationId 
      });
    }
  };

  if (isLoadingDumpsters || isLoadingDurations) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-12 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-[#2c2c2c] mb-4">Our Dumpster Sizes</h2>
        <p className="text-neutral-600">
          We offer a variety of dumpster sizes to fit your specific needs. All rentals include 
          delivery, pickup, and 7 days of usage.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {dumpsters?.map((dumpster, index) => (
          <PricingCard
            key={dumpster.id}
            id={dumpster.id}
            name={dumpster.name}
            dimensions={dumpster.dimensions}
            description={dumpster.description}
            basePrice={dumpster.basePrice}
            weightLimit={dumpster.weightLimit}
            isSelected={selectedDumpsterId === dumpster.id}
            onClick={() => setSelectedDumpsterId(dumpster.id)}
            isPopular={index === 1} // Make the middle option (15 yard) popular
          />
        ))}
      </div>

      <div className="mt-12 pt-8 border-t border-gray-200" ref={durationSectionRef}>
        <h3 className="text-2xl font-bold mb-4 text-[#2c2c2c]">Rental Duration</h3>
        <p className="text-neutral-600 mb-6">How long will you need the dumpster? Choose the rental period that best fits your project timeline.</p>
        <RadioGroup 
          value={selectedDurationId?.toString()} 
          onValueChange={(value) => setSelectedDurationId(parseInt(value))}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {durations?.map((duration) => (
            <div 
              key={duration.id}
              className={`border rounded-lg cursor-pointer transition-all ${
                selectedDurationId === duration.id 
                  ? "border-[#ffdd33] bg-[#2c2c2c] text-white p-4" 
                  : "border-gray-200 hover:border-[#ffdd33] p-4"
              }`}
            >
              <RadioGroupItem
                value={duration.id.toString()}
                id={`duration-${duration.id}`}
                className="sr-only"
              />
              <Label
                htmlFor={`duration-${duration.id}`}
                className="flex flex-col cursor-pointer"
              >
                <span className={`block font-medium ${selectedDurationId === duration.id ? "text-[#ffdd33]" : "text-[#2c2c2c]"}`}>
                  {duration.days} Days
                </span>
                {duration.additionalPrice > 0 && (
                  <span className={`block text-sm ${selectedDurationId === duration.id ? "text-white text-opacity-90" : "text-neutral-600"}`}>
                    +${(duration.additionalPrice / 100).toFixed(2)}
                  </span>
                )}
                {duration.additionalPrice === 0 && (
                  <span className={`block text-sm ${selectedDurationId === duration.id ? "text-white text-opacity-90" : "text-neutral-600"}`}>
                    Standard rental period
                  </span>
                )}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="mt-10 text-center md:text-right">
        <Button 
          onClick={handleContinue}
          disabled={!selectedDumpsterId || !selectedDurationId}
          className="px-8 py-3 font-semibold"
        >
          Continue to Delivery Details
        </Button>
      </div>
    </div>
  );
}
