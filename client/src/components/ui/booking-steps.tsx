import React from "react";
import { cn } from "@/lib/utils";

interface BookingStepsProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
  onStepClick?: (step: number) => void;
}

export function BookingSteps({ 
  currentStep, 
  totalSteps, 
  labels,
  onStepClick 
}: BookingStepsProps) {
  return (
    <div className="border-b border-neutral-200">
      <div className="flex">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const step = index + 1;
          const isActive = step === currentStep;
          const isPrevious = step < currentStep;
          const isClickable = onStepClick && (isPrevious || step === currentStep);

          return (
            <div
              key={step}
              className={cn(
                "flex-1 py-4 px-4 text-center border-b-2 font-medium transition-colors",
                isActive 
                  ? "border-[#ffdd33] text-[#2c2c2c] font-bold" 
                  : isPrevious
                    ? "border-[#ffdd33] text-[#2c2c2c]"
                    : "border-neutral-200 text-neutral-400",
                isClickable && "cursor-pointer"
              )}
              onClick={() => isClickable && onStepClick(step)}
              data-step={step}
            >
              <span className="hidden md:inline">{`${step}. ${labels[index]}`}</span>
              <span className="md:hidden">{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
