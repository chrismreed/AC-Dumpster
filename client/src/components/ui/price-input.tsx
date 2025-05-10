import { forwardRef, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface PriceInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onValueChange?: (value: number) => void;
  value?: string | number;
  defaultValue?: string | number;
}

const PriceInput = forwardRef<HTMLInputElement, PriceInputProps>(
  ({ className, onValueChange, value, defaultValue, onChange, ...props }, ref) => {
    // Convert numeric value to string with 2 decimal places and no leading zeros
    const formatValue = (val: string | number | undefined): string => {
      if (val === undefined || val === null || val === "") return "";
      
      const numValue = typeof val === "string" ? parseFloat(val) : val;
      if (isNaN(numValue)) return "";
      
      // Format to 2 decimal places if needed
      const formattedValue = numValue.toString();
      return formattedValue === "0" ? "" : formattedValue;
    };

    const [displayValue, setDisplayValue] = useState<string>(formatValue(value || defaultValue));

    // Update display value when value prop changes
    useEffect(() => {
      setDisplayValue(formatValue(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Allow empty input, numbers, and decimal point
      const inputValue = e.target.value;
      
      // Handle original onChange if provided
      if (onChange) {
        onChange(e);
      }
      
      // Only allow valid numeric input
      if (inputValue === "" || /^[0-9]*\.?[0-9]*$/.test(inputValue)) {
        setDisplayValue(inputValue);
        
        // Convert to number for the parent component
        const numericValue = inputValue === "" ? 0 : parseFloat(inputValue);
        if (onValueChange) {
          onValueChange(isNaN(numericValue) ? 0 : numericValue);
        }
      }
    };

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
        <Input
          type="text"
          className={`pl-7 ${className}`}
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          inputMode="decimal"
          {...props}
        />
      </div>
    );
  }
);

PriceInput.displayName = "PriceInput";

export { PriceInput };