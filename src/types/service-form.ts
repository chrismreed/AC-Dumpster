export type FieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'number'
  | 'date'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'address';

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select, radio, checkbox
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  pricingImpact?: {
    enabled: boolean;
    baseModifier?: number; // Fixed amount to add/subtract
    multiplier?: number; // Multiply by field value
    optionPrices?: { [key: string]: number }; // Price for each option
  };
}

export interface FormSchema {
  fields: FormField[];
}

export interface ServiceResponse {
  id: number;
  serviceId: number;
  bookingId?: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  responses: Record<string, any>;
  calculatedPrice?: number;
  status: 'pending' | 'quoted' | 'approved' | 'rejected';
  adminNotes?: string;
  quotedPrice?: number;
  quotedAt?: Date;
  quotedBy?: number;
  createdAt: Date;
  updatedAt: Date;
}
