'use client';

import { useState, useEffect, useRef } from "react";
import { PricingCard } from "@/components/ui/pricing-card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { calculatePerDayRental } from "@/lib/pricing/per-day-calculator";
import { AvailabilityCalendar } from "@/components/ui/availability-calendar";

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
  pricingMode: 'tier' | 'per_day';
  basePricePerDay?: number | null;
  dailyRate?: number | null;
  minDays?: number | null;
  maxDays?: number | null;
  overageRate?: number | null;
  // Declining daily rate
  firstDayRate?: number | null;
  rateDeclineType?: string | null;
  rateDeclineAmount?: number | null;
  minimumDailyRate?: number | null;
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
  onNext: (data: { dumpsterId: number, pricingId: number | null, rentalDays: number, rentalPrice: number, deliveryDate?: string }) => void;
  selectedDumpsterId?: number;
  selectedPricingId?: number | null;
}

export function DumpsterSelector({ onNext, selectedDumpsterId: initialDumpsterId, selectedPricingId: initialPricingId }: DumpsterSelectorProps) {
  const [selectedDumpsterId, setSelectedDumpsterId] = useState<number | null>(initialDumpsterId || null);
  const [selectedPricingId, setSelectedPricingId] = useState<number | null>(initialPricingId || null);
  const [dumpsters, setDumpsters] = useState<Dumpster[]>([]);
  const [pricingOptions, setPricingOptions] = useState<DumpsterPricing[]>([]);
  const [isLoadingDumpsters, setIsLoadingDumpsters] = useState(true);
  const [isLoadingPricing, setIsLoadingPricing] = useState(false);
  const [perDayRentalDays, setPerDayRentalDays] = useState<number>(1);
  const [deliveryDate, setDeliveryDate] = useState<string | null>(null);
  const durationSectionRef = useRef<HTMLDivElement>(null);

  // Get the currently selected dumpster object
  const selectedDumpster = dumpsters.find(d => d.id === selectedDumpsterId) || null;
  const isPerDayMode = selectedDumpster?.pricingMode === 'per_day';

  // Per-day pricing computed values
  const perDayMinDays = selectedDumpster?.minDays || 1;
  const perDayMaxDays = selectedDumpster?.maxDays || 90;

  // Use shared calculator for correct pricing in both flat and declining modes
  const perDayCalcResult = isPerDayMode && selectedDumpster
    ? calculatePerDayRental(
        {
          basePricePerDay: selectedDumpster.basePricePerDay ?? null,
          dailyRate: selectedDumpster.dailyRate ?? null,
          firstDayRate: selectedDumpster.firstDayRate ?? null,
          rateDeclineType: selectedDumpster.rateDeclineType ?? null,
          rateDeclineAmount: selectedDumpster.rateDeclineAmount ?? null,
          minimumDailyRate: selectedDumpster.minimumDailyRate ?? null,
        },
        perDayRentalDays
      )
    : null;

  const perDayBaseFee = selectedDumpster?.basePricePerDay || 0;
  const perDayDailyRate = selectedDumpster?.dailyRate || 0;
  const perDayTotal = perDayCalcResult?.grandTotal ?? (perDayBaseFee + perDayDailyRate * perDayRentalDays);
  const isDeclineMode = perDayCalcResult?.isDeclineMode ?? false;

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

  // Reset per-day rental days when dumpster changes
  useEffect(() => {
    if (selectedDumpster?.pricingMode === 'per_day') {
      setPerDayRentalDays(selectedDumpster.minDays || 1);
    }
  }, [selectedDumpsterId, selectedDumpster?.pricingMode, selectedDumpster?.minDays]);

  // Scroll to pricing section when a dumpster is selected
  useEffect(() => {
    if (selectedDumpsterId && durationSectionRef.current) {
      setTimeout(() => {
        durationSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
      // Reset pricing/date selection when dumpster changes
      setSelectedPricingId(null);
      setDeliveryDate(null);
    }
  }, [selectedDumpsterId]);

  const handleContinue = () => {
    if (!selectedDumpsterId) return;

    if (isPerDayMode) {
      // Per-day mode: no pricingId, compute price from dumpster config
      onNext({
        dumpsterId: selectedDumpsterId,
        pricingId: null,
        rentalDays: perDayRentalDays,
        rentalPrice: perDayTotal,
        deliveryDate: deliveryDate ?? undefined,
      });
    } else if (selectedPricingId) {
      // Tier mode: use selected pricing tier
      const selectedPricing = pricingOptions.find(p => p.id === selectedPricingId);
      onNext({
        dumpsterId: selectedDumpsterId,
        pricingId: selectedPricingId,
        rentalDays: selectedPricing?.days || 0,
        rentalPrice: selectedPricing?.price || 0,
      });
    }
  };

  // Can the user proceed?
  const canContinue = selectedDumpsterId && (
    isPerDayMode
      ? (
          !!deliveryDate &&
          perDayRentalDays >= perDayMinDays &&
          perDayRentalDays <= perDayMaxDays &&
          (perDayDailyRate > 0 || (selectedDumpster?.firstDayRate ?? 0) > 0)
        )
      : !!selectedPricingId
  );

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
            {isLoadingPricing && !isPerDayMode ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading pricing options...</span>
              </div>
            ) : isPerDayMode ? (
              /* Per-Day Pricing Mode — calendar with direct range selection */
              <div className="space-y-6">
                <AvailabilityCalendar
                  key={selectedDumpsterId}
                  dumpsterId={selectedDumpsterId}
                  selectedDate={deliveryDate || ''}
                  onDateSelect={(date) => setDeliveryDate(date)}
                  onRangeSelect={(startDate, _endDate, days) => {
                    setDeliveryDate(startDate);
                    setPerDayRentalDays(days);
                  }}
                  minDays={perDayMinDays}
                  maxDays={perDayMaxDays}
                />

                {/* Live Price Breakdown — only shown after dates are chosen */}
                {deliveryDate && (
                <div className="bg-primary/10 border-2 border-primary rounded-xl p-6">
                  <div className="space-y-2">
                    {perDayBaseFee > 0 && (
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Delivery fee</span>
                        <span>${(perDayBaseFee / 100).toFixed(2)}</span>
                      </div>
                    )}
                    {isDeclineMode && perDayCalcResult ? (
                      <>
                        {/* Day 1 line */}
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Day 1 rate</span>
                          <span>${((perDayCalcResult.breakdown[0]?.rate ?? 0) / 100).toFixed(2)}</span>
                        </div>
                        {/* Days 2+ line (if any) */}
                        {perDayCalcResult.breakdown.length > 1 && (
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Days 2–{perDayRentalDays} (declining)</span>
                            <span>${(perDayCalcResult.rentalTotal / 100 - perDayCalcResult.breakdown[0].rate / 100).toFixed(2)}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{perDayRentalDays} day{perDayRentalDays !== 1 ? 's' : ''} × ${(perDayDailyRate / 100).toFixed(2)}/day</span>
                        <span>${((perDayDailyRate * perDayRentalDays) / 100).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-primary/30 pt-2 flex justify-between items-center">
                      <span className="font-semibold text-foreground">Total</span>
                      <span className="text-2xl font-bold text-primary">${(perDayTotal / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                )}
              </div>
            ) : pricingOptions && pricingOptions.length > 0 ? (
              /* Tier Pricing Mode */
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
          disabled={!canContinue}
          className="px-8 py-3 font-semibold"
        >
          Continue to Delivery Details
        </Button>
      </div>
    </div>
  );
}
