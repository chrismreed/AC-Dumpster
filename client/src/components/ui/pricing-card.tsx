import { cn } from "@/lib/utils";
import { Button } from "./button";

interface PricingCardProps {
  id: number;
  name: string;
  dimensions: string;
  description: string;
  basePrice: number;
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
  basePrice,
  weightLimit,
  isSelected = false,
  onClick,
  isPopular = false
}: PricingCardProps) {
  // Convert pounds to tons for display
  const weightLimitInTons = weightLimit / 2000;
  
  // Get the dumpster size in yards from the name (e.g., "10 Yard Dumpster" -> "10 Yard")
  const yardSize = name.split(" ")[0] + " Yard";
  
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
        "border rounded-lg overflow-hidden transition-all relative",
        isSelected 
          ? "border-gray-500 border-2 bg-white shadow-md ring-2 ring-gray-400 ring-opacity-20" 
          : "border-neutral-200 bg-white hover:border-neutral-300 shadow-sm"
      )}
      onClick={onClick}
      data-dumpster-id={id}
    >
      {isPopular && (
        <div className="absolute top-0 right-0 bg-gray-700 text-white text-xs font-bold px-4 py-1">
          MOST POPULAR
        </div>
      )}
      
      <div className="p-6">
        <h3 className="font-bold text-2xl mb-2 text-[#2c2c2c]">{yardSize}</h3>
        <p className="text-neutral-600 mb-4">{description}</p>
        
        <div className="mb-5">
          <span className="text-3xl font-bold text-[#2c2c2c]">${(basePrice / 100).toFixed(0)}</span>
          <div className="text-sm text-neutral-500">7-day rental included</div>
        </div>
        
        <div className="mb-4">
          <p className="font-medium text-[#2c2c2c] mb-2">Best for: {bestFor}</p>
          
          <ul className="space-y-2 mb-6">
            <li className="flex items-center text-sm">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-neutral-600">Holds {loadSize}</span>
            </li>
            <li className="flex items-center text-sm">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-neutral-600">{feature}</span>
            </li>
            <li className="flex items-center text-sm">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-neutral-600">7-day rental included</span>
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
