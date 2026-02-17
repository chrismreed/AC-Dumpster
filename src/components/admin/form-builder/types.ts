// Form builder type definitions
export type FormFieldType =
  | 'text'
  | 'name'
  | 'email'
  | 'phone'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'number'
  | 'date'
  | 'address'
  | 'agreement'
  | 'captcha'
  | 'payment'
  | 'dumpster_selector'; // For services that require dumpster selection

export interface FormFieldOption {
  label: string;
  value: string;
  priceModifier?: number; // Legacy: Add this amount to base price (deprecated)
  pricing?: {
    type: 'setBase' | 'add' | 'subtract' | 'multiply' | 'none';
    amount: number;
  };
}

export interface ConditionalRule {
  fieldId: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
  value: string | string[];
}

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  conditionallyRequired?: boolean; // Can be made required based on conditions
  options?: FormFieldOption[]; // For select, checkbox, radio
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  priceModifier?: number; // Legacy: For simple fields that affect price (deprecated)
  conditionalLogic?: {
    action: 'show' | 'hide' | 'require' | 'disable';
    conditions: ConditionalRule[];
    matchType: 'all' | 'any'; // AND or OR logic
  };
  // New: Field-level pricing for number inputs
  pricing?: {
    type: 'perUnit' | 'none';
    pricePerUnit?: number;
    min?: number;
    max?: number;
  };
  // Layout: Column width (1-12, defaults to 12 for full width)
  columnWidth?: number;
  // Layout: Number of columns for options (checkbox/radio only, 1-4)
  optionsColumns?: number;
  // Captcha configuration
  captchaConfig?: {
    provider: 'recaptcha-v2' | 'recaptcha-v3' | 'hcaptcha' | 'turnstile';
    siteKey?: string;
  };
  // Payment configuration
  paymentConfig?: {
    provider: 'stripe' | 'square' | 'paypal' | 'authorize-net';
    mode: 'redirect' | 'embedded' | 'display-only';
    collectBillingAddress?: boolean;
  };
  // Contact field designation (for extracting customer info from submissions)
  isContactField?: 'name' | 'email' | 'phone' | null;
  // Name field configuration
  nameConfig?: {
    format: 'single' | 'split'; // Single field or separate first/last
    includeMiddle?: boolean;
    includePrefix?: boolean; // Mr., Mrs., Dr., etc.
    requireFirst?: boolean;
    requireLast?: boolean;
    prefixOptions?: string[]; // Custom prefix options
  };
  // Dumpster selector configuration (for services requiring dumpster inventory)
  dumpsterSelectorConfig?: {
    allowedDumpsterIds: number[]; // Which dumpster types to show
    showPricing: boolean; // Show prices for each dumpster option
    showAvailability: boolean; // Show real-time availability
    showDimensions: boolean; // Show dumpster dimensions
    showImages: boolean; // Show dumpster images
    requireDateFirst: boolean; // Require date field to be filled before showing availability
    dateFieldId?: string; // ID of the date field to check for availability
  };
}

export interface FormSchema {
  fields: FormField[];
  version: number;
  displayMode?: 'standard' | 'conversational'; // Display style for the form
}

// Advanced pricing rule for complex scenarios
export interface AdvancedPricingRule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: Array<{
    fieldId: string;
    fieldLabel?: string; // For display purposes
    operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'between';
    value: string | number | [number, number]; // Array for 'between'
  }>;
  matchType: 'all' | 'any'; // AND or OR logic
  priceAction: {
    type: 'setBase' | 'add' | 'subtract' | 'multiply' | 'divide' | 'formula';
    amount?: number;
    formula?: string; // For custom formulas using field values
  };
}

// Legacy - keep for backward compatibility
export interface PricingRule {
  id: string;
  name: string;
  type: 'fieldValue' | 'calculation' | 'conditional';
  config: {
    fieldId?: string;
    formula?: string;
    conditions?: Array<{
      fieldId: string;
      operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan';
      value: string | number;
      priceModifier: number;
    }>;
  };
}

export interface ServiceFormData {
  formSchema: FormSchema;
  pricingRules: PricingRule[]; // Legacy
  advancedPricingRules?: AdvancedPricingRule[]; // New simplified system
}
