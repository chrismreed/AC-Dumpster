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
        "border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all",
        isSelected 
          ? "border-primary bg-neutral-900 text-white" 
          : "border-neutral-200 hover:border-primary"
      )}
      onClick={onClick}
      data-dumpster-id={id}
    >
      <div className="flex items-start">
        <div className={cn(
          "flex-shrink-0 rounded-lg p-2 mr-4",
          isSelected ? "bg-neutral-800" : "bg-neutral-100"
        )}>
          <Trash2 className="text-primary text-2xl h-6 w-6" />
        </div>
        <div className="flex-grow">
          <h3 className="font-medium text-lg">{name}</h3>
          <p className={cn(
            "text-sm mb-2", 
            isSelected ? "text-neutral-300" : "text-neutral-500"
          )}>{dimensions}</p>
          <p className={cn(
            "text-sm mb-4", 
            isSelected ? "text-neutral-200" : "text-neutral-600"
          )}>{description}</p>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-primary">${(basePrice / 100).toFixed(2)}</span>
            <span className={cn(
              "text-xs", 
              isSelected ? "text-neutral-300" : "text-neutral-500"
            )}>Up to {weightLimitInTons} tons included</span>
          </div>
        </div>
      </div>
    </div>
  );
}
