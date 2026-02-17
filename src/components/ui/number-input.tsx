import * as React from "react"
import { cn } from "@/lib/utils"

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | string;
  onChange: (value: number) => void;
  allowDecimals?: boolean;
  decimalPlaces?: number;
}

/**
 * A number input that properly handles the "0" display issue.
 * - Shows empty string when value is 0 (allows easy typing)
 * - Allows easy deletion and replacement of values
 * - Validates numeric input only
 */
const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, value, onChange, allowDecimals = true, decimalPlaces = 2, ...props }, ref) => {
    // Convert value to string for display
    const getDisplayValue = (val: number | string): string => {
      if (val === '' || val === 0 || val === '0') return '';
      return String(val);
    };

    // Track the display value separately from the actual numeric value
    const [displayValue, setDisplayValue] = React.useState<string>(() => getDisplayValue(value));
    const [isFocused, setIsFocused] = React.useState(false);

    // Sync display value with prop value when not focused
    React.useEffect(() => {
      if (!isFocused) {
        setDisplayValue(getDisplayValue(value));
      }
    }, [value, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // Allow empty string
      if (inputValue === '') {
        setDisplayValue('');
        onChange(0);
        return;
      }

      // Allow typing decimal point
      if (allowDecimals && (inputValue === '.' || inputValue === '0.')) {
        setDisplayValue(inputValue);
        return;
      }

      // Validate the input
      const regex = allowDecimals ? /^-?\d*\.?\d*$/ : /^-?\d*$/;
      if (!regex.test(inputValue)) {
        return;
      }

      setDisplayValue(inputValue);

      const numValue = parseFloat(inputValue);
      if (!isNaN(numValue)) {
        onChange(numValue);
      }
    };

    const handleFocus = () => {
      setIsFocused(true);
    };

    const handleBlur = () => {
      setIsFocused(false);
      // Format the display value on blur
      if (displayValue === '' || displayValue === '.' || displayValue === '-') {
        setDisplayValue('');
        onChange(0);
      } else {
        const numValue = parseFloat(displayValue);
        if (!isNaN(numValue)) {
          // Format with proper decimal places if it has decimals
          if (allowDecimals && displayValue.includes('.')) {
            setDisplayValue(numValue.toFixed(decimalPlaces));
          } else {
            setDisplayValue(String(numValue));
          }
        }
      }
    };

    return (
      <input
        type="text"
        inputMode="decimal"
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={props.placeholder || "0"}
        {...props}
      />
    )
  }
)
NumberInput.displayName = "NumberInput"

// Simple string-based number input for forms that use string state
export interface StringNumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  allowDecimals?: boolean;
}

/**
 * A simpler number input for string-based state.
 * - Shows placeholder when empty
 * - Only allows numeric input
 */
const StringNumberInput = React.forwardRef<HTMLInputElement, StringNumberInputProps>(
  ({ className, value, onChange, allowDecimals = true, placeholder, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // Allow empty string
      if (inputValue === '') {
        onChange('');
        return;
      }

      // Validate the input
      const regex = allowDecimals ? /^-?\d*\.?\d*$/ : /^-?\d*$/;
      if (!regex.test(inputValue)) {
        return;
      }

      onChange(inputValue);
    };

    return (
      <input
        type="text"
        inputMode="decimal"
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        value={value}
        onChange={handleChange}
        placeholder={placeholder || "0"}
        {...props}
      />
    )
  }
)
StringNumberInput.displayName = "StringNumberInput"

export { NumberInput, StringNumberInput }
