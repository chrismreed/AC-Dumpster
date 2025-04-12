import { useState, useEffect } from "react";
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
      <h2 className="text-2xl font-bold text-neutral-800 mb-6">Select Your Dumpster Size</h2>
      <p className="text-neutral-600 mb-8">
        Choose the right size for your project. Not sure what size you need? 
        <a href="#" className="text-primary hover:underline ml-1">View our size guide</a>.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {dumpsters?.map((dumpster) => (
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
          />
        ))}
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-bold mb-4 text-[#2c2c2c]">Rental Duration</h3>
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

      <div className="mt-10 text-right">
        <Button 
          onClick={handleContinue}
          disabled={!selectedDumpsterId || !selectedDurationId}
          className="px-8 py-3 bg-[#ffdd33] text-[#2c2c2c] hover:bg-[#ffd700] font-semibold rounded-sm border-none"
        >
          CONTINUE
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 ml-2" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" 
              clipRule="evenodd" 
            />
          </svg>
        </Button>
      </div>
    </div>
  );
}
