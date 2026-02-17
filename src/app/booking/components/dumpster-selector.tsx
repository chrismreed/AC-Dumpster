'use client';

import { useState, useEffect, useRef } from "react";
import { PricingCard } from "@/components/ui/pricing-card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface Dumpster {
  id: number;
  name: string;
  dimensions: string;
  description: string;
  weightLimit: number;
  availability: number;
  imageUrl?: string;
  sortOrder: number;
  createdAt: string;
}

interface DumpsterPricing {
  id: number;
  dumpsterId: number;
  days: number;
  price: number;
  sortOrder: number;
  createdAt: string;
}

interface DumpsterSelectorProps {
  onNext: (data: { dumpsterId: number, pricingId: number, rentalDays: number, rentalPrice: number }) => void;
  selectedDumpsterId?: number;
  selectedPricingId?: number;
}

export function DumpsterSelector({ onNext, selectedDumpsterId: initialDumpsterId, selectedPricingId: initialPricingId }: DumpsterSelectorProps) {
  const [selectedDumpsterId, setSelectedDumpsterId] = useState<number | null>(initialDumpsterId || null);
  const [selectedPricingId, setSelectedPricingId] = useState<number | null>(initialPricingId || null);
  const [dumpsters, setDumpsters] = useState<Dumpster[]>([]);
  const [pricingOptions, setPricingOptions] = useState<DumpsterPricing[]>([]);
  const [isLoadingDumpsters, setIsLoadingDumpsters] = useState(true);
  const [isLoadingPricing, setIsLoadingPricing] = useState(false);
  const durationSectionRef = useRef<HTMLDivElement>(null);

  // Fetch dumpsters on mount
  useEffect(() => {
    const fetchDumpsters = async () => {
      try {
        const response = await fetch('/api/dumpsters');
        if (response.ok) {
          const data = await response.json();
          setDumpsters(data);
        }
      } catch (error) {
        console.error('Error fetching dumpsters:', error);
      } finally {
        setIsLoadingDumpsters(false);
      }
    };

    fetchDumpsters();
  }, []);

  // Fetch pricing options for the selected dumpster
  useEffect(() => {
    const fetchPricing = async () => {
      if (!selectedDumpsterId) {
        setPricingOptions([]);
        return;
      }

      setIsLoadingPricing(true);
      try {
        const response = await fetch(`/api/dumpster-pricing/${selectedDumpsterId}`);
        if (response.ok) {
          const data = await response.json();
          setPricingOptions(data);
        }
      } catch (error) {
        console.error('Error fetching pricing:', error);
        setPricingOptions([]);
      } finally {
        setIsLoadingPricing(false);
      }
    };

    fetchPricing();
  }, [selectedDumpsterId]);

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
      const selectedPricing = pricingOptions.find(p => p.id === selectedPricingId);
      onNext({
        dumpsterId: selectedDumpsterId,
        pricingId: selectedPricingId,
        rentalDays: selectedPricing?.days || 0,
        rentalPrice: selectedPricing?.price || 0
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
        <h2 className="text-3xl font-bold text-foreground mb-4">Our Dumpster Sizes</h2>
        <p className="text-muted-foreground">
          We offer a variety of dumpster sizes to fit your specific needs. All rentals include
          delivery, pickup, and 24 hours of usage.
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
            weightLimit={dumpster.weightLimit}
            isSelected={selectedDumpsterId === dumpster.id}
            onClick={() => setSelectedDumpsterId(dumpster.id)}
            isPopular={index === 1} // Make the middle option (15 yard) popular
          />
        ))}
      </div>

      <div className="mt-12 pt-8 border-t border-border" ref={durationSectionRef}>
        <h3 className="text-2xl font-bold mb-4 text-foreground">Rental Duration</h3>
        <p className="text-muted-foreground mb-6">How long will you need the dumpster? Choose the rental period that best fits your project timeline.</p>

        {selectedDumpsterId && (
          <>
            {isLoadingPricing ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading pricing options...</span>
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
                    className={`border-2 rounded-lg cursor-pointer transition-all ${
                      selectedPricingId === pricing.id
                        ? "border-primary bg-primary/10 p-4 shadow-sm"
                        : "border-border hover:border-primary hover:bg-accent p-4"
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
                      <span className="block font-semibold text-foreground">
                        {pricing.days} Days
                      </span>
                      <span className={`block text-sm font-medium ${selectedPricingId === pricing.id ? "text-primary" : "text-muted-foreground"}`}>
                        ${(pricing.price / 100).toFixed(2)}
                      </span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="text-center p-8 border rounded-lg bg-muted">
                <p className="text-muted-foreground">No custom pricing options available for this dumpster.</p>
                <p className="text-sm text-muted-foreground mt-2">Using base price for standard rental.</p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-10 text-center md:text-right">
        <Button
          onClick={handleContinue}
          disabled={!selectedDumpsterId || !selectedPricingId}
          className="px-8 py-3 font-semibold"
        >
          Continue to Delivery Details
        </Button>
      </div>
    </div>
  );
}
