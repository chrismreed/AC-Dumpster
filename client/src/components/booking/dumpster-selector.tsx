import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dumpster, DumpsterPricing } from "@shared/schema";
import { PricingCard } from "@/components/ui/pricing-card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface DumpsterSelectorProps {
  onNext: (data: { dumpsterId: number, pricingId: number }) => void;
}

export function DumpsterSelector({ onNext }: DumpsterSelectorProps) {
  const [selectedDumpsterId, setSelectedDumpsterId] = useState<number | null>(null);
  const [selectedPricingId, setSelectedPricingId] = useState<number | null>(null);
  const durationSectionRef = useRef<HTMLDivElement>(null);

  const { data: dumpsters, isLoading: isLoadingDumpsters } = useQuery<Dumpster[]>({
    queryKey: ["/api/dumpsters"],
  });

  // Fetch pricing options for the selected dumpster
  const { data: pricingOptions, isLoading: isLoadingPricing } = useQuery<DumpsterPricing[]>({
    queryKey: ["/api/dumpster-pricing", selectedDumpsterId],
    queryFn: async () => {
      if (!selectedDumpsterId) return [];
      const response = await apiRequest("GET", `/api/dumpster-pricing/${selectedDumpsterId}`);
      return response.json();
    },
    enabled: !!selectedDumpsterId,
  });

  useEffect(() => {
    // Set first pricing option as default when data loads
    if (pricingOptions && pricingOptions.length > 0 && !selectedPricingId) {
      setSelectedPricingId(pricingOptions[0].id);
    }
  }, [pricingOptions, selectedPricingId]);
  
  // Scroll to pricing section when a dumpster is selected
  useEffect(() => {
    if (selectedDumpsterId && durationSectionRef.current) {
      setTimeout(() => {
        durationSectionRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
      // Reset pricing selection when dumpster changes
      setSelectedPricingId(null);
    }
  }, [selectedDumpsterId]);

  const handleContinue = () => {
    if (selectedDumpsterId && selectedPricingId) {
      onNext({ 
        dumpsterId: selectedDumpsterId, 
        pricingId: selectedPricingId 
      });
    }
  };

  if (isLoadingDumpsters) {
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
        
        {selectedDumpsterId && (
          <>
            {isLoadingPricing ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-neutral-600">Loading pricing options...</span>
              </div>
            ) : pricingOptions && pricingOptions.length > 0 ? (
              <RadioGroup 
                value={selectedPricingId?.toString()} 
                onValueChange={(value) => setSelectedPricingId(parseInt(value))}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                {pricingOptions.map((pricing) => (
                  <div 
                    key={pricing.id}
                    className={`border rounded-lg cursor-pointer transition-all ${
                      selectedPricingId === pricing.id 
                        ? "border-[#ffdd33] bg-[#2c2c2c] text-white p-4" 
                        : "border-gray-200 hover:border-[#ffdd33] p-4"
                    }`}
                  >
                    <RadioGroupItem
                      value={pricing.id.toString()}
                      id={`pricing-${pricing.id}`}
                      className="sr-only"
                    />
                    <Label
                      htmlFor={`pricing-${pricing.id}`}
                      className="flex flex-col cursor-pointer"
                    >
                      <span className={`block font-medium ${selectedPricingId === pricing.id ? "text-[#ffdd33]" : "text-[#2c2c2c]"}`}>
                        {pricing.days} Days
                      </span>
                      <span className={`block text-sm ${selectedPricingId === pricing.id ? "text-white text-opacity-90" : "text-neutral-600"}`}>
                        ${(pricing.price / 100).toFixed(2)}
                      </span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="text-center p-8 border rounded-lg bg-gray-50">
                <p className="text-neutral-600">No custom pricing options available for this dumpster.</p>
                <p className="text-sm text-neutral-500 mt-2">Using base price for standard rental.</p>
              </div>
            )}
          </>
        )}
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
