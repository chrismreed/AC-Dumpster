'use client';

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface DumpsterPricing {
  id: number;
  dumpsterId: number;
  days: number;
  price: number;
  sortOrder: number;
  createdAt: string;
}

interface PricingCardProps {
  id: number;
  name: string;
  dimensions: string;
  description: string;
  weightLimit: number;
  isSelected?: boolean;
  onClick?: () => void;
  isPopular?: boolean;
}

export function PricingCard({
  id,
  name,
  dimensions,
  description,
  weightLimit,
  isSelected = false,
  onClick,
  isPopular = false
}: PricingCardProps) {
  const [pricingOptions, setPricingOptions] = useState<DumpsterPricing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch pricing options for this dumpster
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await fetch(`/api/dumpster-pricing/${id}`);
        if (response.ok) {
          const data = await response.json();
          setPricingOptions(data);
        }
      } catch (error) {
        console.error('Error fetching pricing:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPricing();
  }, [id]);

  // Convert pounds to tons for display
  const weightLimitInTons = weightLimit / 2000;

  // Get the dumpster size in yards from the name (e.g., "10 Yard Dumpster" -> "10 Yard")
  const yardSize = name.split(" ")[0] + " Yard";

  // Calculate the minimum price from custom pricing options
  const getMinPrice = () => {
    if (pricingOptions && pricingOptions.length > 0) {
      const minPricing = pricingOptions.reduce((min, current) =>
        current.price < min.price ? current : min
      );
      return minPricing.price;
    }
    return 0; // Default to 0 if no pricing options available
  };

  const minPrice = getMinPrice();

  // Determine the best use case based on size
  let bestFor = "Small residential projects";
  let loadSize = `${weightLimitInTons} tons`;
  let feature = "Compact footprint";

  if (name.includes("15")) {
    bestFor = "Medium home renovations";
    loadSize = "5-6 pickup truck loads";
    feature = "Good for mixed debris";
  } else if (name.includes("20")) {
    bestFor = "Large construction projects";
    loadSize = "7-8 pickup truck loads";
    feature = "Great for bulky items";
  } else if (name.includes("10")) {
    loadSize = "3-4 pickup truck loads";
  }

  return (
    <div
      className={cn(
        "border rounded-lg overflow-hidden transition-all relative cursor-pointer",
        // Use elevated card style - warm cream background that works with dumpster images
        isSelected
          ? "border-primary border-2 bg-card-elevated shadow-lg ring-2 ring-primary ring-opacity-30"
          : "border-primary/20 bg-card-elevated hover:border-primary/50 hover:shadow-md shadow-sm"
      )}
      onClick={onClick}
      data-dumpster-id={id}
    >
      {isPopular && (
        <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-bl-lg">
          MOST POPULAR
        </div>
      )}

      <div className="p-6">
        {/* Light text on darker elevated card */}
        <h3 className="font-bold text-2xl mb-2 text-card-elevated-foreground">{yardSize}</h3>
        <p className="text-card-elevated-foreground/80 mb-4">{description}</p>

        <div className="mb-5">
          <span className="text-3xl font-bold text-primary">
            {isLoading ? "Loading..." : `Starting at $${(minPrice / 100).toFixed(0)}`}
          </span>
        </div>

        <div className="mb-4">
          <p className="font-medium text-card-elevated-foreground mb-2">Best for: {bestFor}</p>

          <ul className="space-y-2 mb-6">
            <li className="flex items-center text-sm">
              <span className="text-green-400 mr-2">✓</span>
              <span className="text-card-elevated-foreground/80">Holds {loadSize}</span>
            </li>
            <li className="flex items-center text-sm">
              <span className="text-green-400 mr-2">✓</span>
              <span className="text-card-elevated-foreground/80">{feature}</span>
            </li>
            <li className="flex items-center text-sm">
              <span className="text-green-400 mr-2">✓</span>
              <span className="text-card-elevated-foreground/80">Multiple rental duration options</span>
            </li>
          </ul>

          <Button
            className="w-full font-medium"
            onClick={onClick}
          >
            Rent This Dumpster
          </Button>
        </div>
      </div>
    </div>
  );
}
