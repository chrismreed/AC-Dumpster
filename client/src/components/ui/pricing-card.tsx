import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";

interface PricingCardProps {
  id: number;
  name: string;
  dimensions: string;
  description: string;
  basePrice: number;
  weightLimit: number;
  isSelected?: boolean;
  onClick?: () => void;
}

export function PricingCard({
  id,
  name,
  dimensions,
  description,
  basePrice,
  weightLimit,
  isSelected = false,
  onClick
}: PricingCardProps) {
  // Convert pounds to tons for display
  const weightLimitInTons = weightLimit / 2000;
  
  return (
    <div 
      className={cn(
        "border rounded-lg p-6 cursor-pointer hover:shadow-md transition-all",
        isSelected 
          ? "border-[#ffdd33] bg-[#2c2c2c] text-white" 
          : isSelected === false 
            ? "border-[#2c2c2c] bg-white text-[#2c2c2c] hover:border-[#ffdd33]"
            : "border-neutral-200 bg-white text-[#2c2c2c] hover:border-[#ffdd33]"
      )}
      onClick={onClick}
      data-dumpster-id={id}
    >
      <div className="flex flex-col">
        <h3 className="font-bold text-xl mb-1">{name}</h3>
        <p className={cn(
          "text-sm mb-1", 
          isSelected ? "text-neutral-300" : "text-neutral-500"
        )}>{dimensions}</p>
        <p className={cn(
          "text-sm mb-4", 
          isSelected ? "text-neutral-300" : "text-neutral-600"
        )}>{description}</p>
        
        <div className="mt-2 mb-4">
          <span className={cn(
            "text-2xl font-bold", 
            isSelected ? "text-[#ffdd33]" : "text-[#2c2c2c]"
          )}>${(basePrice / 100).toFixed(0)}</span>
          <span className={cn(
            "text-sm", 
            isSelected ? "text-neutral-300" : "text-neutral-500"
          )}> 7-day rental included</span>
        </div>
        
        <div className="mt-2">
          <p className={cn(
            "text-sm font-medium", 
            isSelected ? "text-white" : "text-[#2c2c2c]"
          )}>Best for: Small residential projects</p>
          
          <ul className="mt-2 space-y-1">
            <li className="flex items-center text-sm">
              <span className={cn(
                "mr-2 text-xs", 
                isSelected ? "text-[#ffdd33]" : "text-[#2c2c2c]"
              )}>✓</span>
              <span className={cn(
                isSelected ? "text-neutral-200" : "text-neutral-600"
              )}>Holds {weightLimitInTons} tons</span>
            </li>
            <li className="flex items-center text-sm">
              <span className={cn(
                "mr-2 text-xs", 
                isSelected ? "text-[#ffdd33]" : "text-[#2c2c2c]"
              )}>✓</span>
              <span className={cn(
                isSelected ? "text-neutral-200" : "text-neutral-600"
              )}>Compact footprint</span>
            </li>
            <li className="flex items-center text-sm">
              <span className={cn(
                "mr-2 text-xs", 
                isSelected ? "text-[#ffdd33]" : "text-[#2c2c2c]"
              )}>✓</span>
              <span className={cn(
                isSelected ? "text-neutral-200" : "text-neutral-600"
              )}>7-day rental included</span>
            </li>
          </ul>
        </div>
        
        {isSelected && (
          <div className="mt-4 py-1 px-2 bg-[#ffdd33] text-[#2c2c2c] text-xs font-bold text-center rounded-sm uppercase">
            Selected
          </div>
        )}
      </div>
    </div>
  );
}
