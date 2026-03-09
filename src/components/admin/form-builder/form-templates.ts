import { FormSchema, PricingRule } from './types';
import { nanoid } from 'nanoid';

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: 'residential' | 'commercial' | 'specialty';
  schema: FormSchema;
  pricingRules?: PricingRule[];
}

export const formTemplates: FormTemplate[] = [
  // 1. Residential Dumpster Rental
  {
    id: 'residential-dumpster',
    name: 'Residential Dumpster Rental',
    description: 'Standard dumpster rental for homeowners',
    category: 'residential',
    schema: {
      version: 1,
      fields: [
        {
          id: nanoid(),
          type: 'select',
          label: 'Project Type',
          required: true,
          placeholder: '',
          options: [
            { label: 'Home Renovation', value: 'home-renovation', priceModifier: 0 },
            { label: 'Spring Cleaning', value: 'spring-cleaning', priceModifier: 0 },
            { label: 'Moving', value: 'moving', priceModifier: 0 },
            { label: 'Garage Cleanout', value: 'garage-cleanout', priceModifier: 0 },
            { label: 'Landscaping', value: 'landscaping', priceModifier: 0 },
            { label: 'Other', value: 'other', priceModifier: 0 }
          ]
        },
        {
          id: nanoid(),
          type: 'radio',
          label: 'Dumpster Size',
          required: true,
          placeholder: '',
          options: [
            { label: '10 Yard', value: '10-yard', priceModifier: 0 },
            { label: '15 Yard', value: '15-yard', priceModifier: 50 },
            { label: '20 Yard', value: '20-yard', priceModifier: 100 },
            { label: '30 Yard', value: '30-yard', priceModifier: 150 }
          ]
        },
        {
          id: nanoid(),
          type: 'radio',
          label: 'Rental Duration',
          required: true,
          placeholder: '',
          options: [
            { label: '3 Days', value: '3-days', priceModifier: 0 },
            { label: '1 Week', value: '1-week', priceModifier: 25 },
            { label: '2 Weeks', value: '2-weeks', priceModifier: 50 },
            { label: '1 Month', value: '1-month', priceModifier: 75 }
          ]
        },
        {
          id: nanoid(),
          type: 'date',
          label: 'Preferred Delivery Date',
          required: true,
          placeholder: ''
        },
        {
          id: nanoid(),
          type: 'address',
          label: 'Delivery Address',
          required: true,
          placeholder: ''
        },
        {
          id: nanoid(),
          type: 'textarea',
          label: 'Special Instructions',
          required: false,
          placeholder: 'Any special delivery instructions or access notes...'
        },
        {
          id: nanoid(),
          type: 'agreement',
          label: 'I agree to the rental terms and conditions',
          required: true,
          placeholder: 'By checking this box, you agree to our terms of service, weight limits, prohibited items list, and cancellation policy.'
        }
      ]
    }
  },

  // 2. Construction/Contractor Service
  {
    id: 'construction-contractor',
    name: 'Construction/Contractor Service',
    description: 'Heavy-duty service for construction projects',
    category: 'commercial',
    schema: {
      version: 1,
      fields: [
        {
          id: nanoid(),
          type: 'select',
          label: 'Project Type',
          required: true,
          placeholder: '',
          options: [
            { label: 'New Construction', value: 'new-construction', priceModifier: 0 },
            { label: 'Demolition', value: 'demolition', priceModifier: 50 },
            { label: 'Remodeling', value: 'remodeling', priceModifier: 0 },
            { label: 'Roofing', value: 'roofing', priceModifier: 0 },
            { label: 'Other', value: 'other', priceModifier: 0 }
          ]
        },
        {
          id: nanoid(),
          type: 'checkbox',
          label: 'Material Types',
          required: true,
          placeholder: '',
          options: [
            { label: 'General Debris', value: 'general-debris', priceModifier: 0 },
            { label: 'Concrete/Brick', value: 'concrete-brick', priceModifier: 50 },
            { label: 'Wood', value: 'wood', priceModifier: 0 },
            { label: 'Shingles', value: 'shingles', priceModifier: 30 },
            { label: 'Mixed Materials', value: 'mixed-materials', priceModifier: 0 }
          ]
        },
        {
          id: nanoid(),
          type: 'radio',
          label: 'Dumpster Size',
          required: true,
          placeholder: '',
          options: [
            { label: '20 Yard', value: '20-yard', priceModifier: 0 },
            { label: '30 Yard', value: '30-yard', priceModifier: 50 },
            { label: '40 Yard', value: '40-yard', priceModifier: 100 }
          ]
        },
        {
          id: nanoid(),
          type: 'radio',
          label: 'Site Access',
          required: true,
          placeholder: '',
          options: [
            { label: 'Easy Access', value: 'easy-access', priceModifier: 0 },
            { label: 'Tight Space', value: 'tight-space', priceModifier: 50 },
            { label: 'Requires Placement Planning', value: 'placement-planning', priceModifier: 75 }
          ]
        },
        {
          id: nanoid(),
          type: 'date',
          label: 'Delivery Date',
          required: true,
          placeholder: ''
        },
        {
          id: nanoid(),
          type: 'text',
          label: 'Project Address',
          required: true,
          placeholder: 'Enter construction site address...'
        }
      ]
    }
  },

  // 3. Junk Removal Service
  {
    id: 'junk-removal',
    name: 'Junk Removal Service',
    description: 'Full-service junk removal with volume-based pricing',
    category: 'specialty',
    schema: {
      version: 1,
      fields: [
        {
          id: nanoid(),
          type: 'radio',
          label: 'Service Type',
          required: true,
          placeholder: '',
          options: [
            { label: 'Full Service Removal', value: 'full-service', priceModifier: 150 },
            { label: 'Drop & Swap', value: 'drop-swap', priceModifier: 0 },
            { label: 'Scheduled Pickup', value: 'scheduled-pickup', priceModifier: 0 }
          ]
        },
        {
          id: nanoid(),
          type: 'radio',
          label: 'Volume Estimate',
          required: true,
          placeholder: '',
          options: [
            { label: 'Quarter Load', value: 'quarter-load', priceModifier: 150 },
            { label: 'Half Load', value: 'half-load', priceModifier: 250 },
            { label: 'Three-Quarter Load', value: 'three-quarter-load', priceModifier: 350 },
            { label: 'Full Load', value: 'full-load', priceModifier: 450 }
          ]
        },
        {
          id: nanoid(),
          type: 'checkbox',
          label: 'Items Include',
          required: false,
          placeholder: '',
          options: [
            { label: 'Furniture', value: 'furniture', priceModifier: 0 },
            { label: 'Appliances', value: 'appliances', priceModifier: 25 },
            { label: 'Electronics', value: 'electronics', priceModifier: 20 },
            { label: 'Mattresses', value: 'mattresses', priceModifier: 30 },
            { label: 'Yard Waste', value: 'yard-waste', priceModifier: 0 },
            { label: 'Construction Debris', value: 'construction-debris', priceModifier: 0 }
          ]
        },
        {
          id: nanoid(),
          type: 'checkbox',
          label: 'Heavy Items',
          required: false,
          placeholder: '',
          options: [
            { label: 'Piano/Safe/Hot Tub', value: 'heavy-items', priceModifier: 100 }
          ]
        },
        {
          id: nanoid(),
          type: 'number',
          label: 'Number of Stairs/Flights',
          required: false,
          placeholder: '0',
          priceModifier: 25
        },
        {
          id: nanoid(),
          type: 'date',
          label: 'Preferred Date',
          required: true,
          placeholder: ''
        },
        {
          id: nanoid(),
          type: 'textarea',
          label: 'Special Access Requirements',
          required: false,
          placeholder: 'Describe any access challenges, parking restrictions, etc...'
        }
      ]
    }
  },

  // 4. Commercial/Business Service
  {
    id: 'commercial-business',
    name: 'Commercial/Business Service',
    description: 'Recurring service for businesses',
    category: 'commercial',
    schema: {
      version: 1,
      fields: [
        {
          id: nanoid(),
          type: 'select',
          label: 'Business Type',
          required: true,
          placeholder: '',
          options: [
            { label: 'Retail', value: 'retail', priceModifier: 0 },
            { label: 'Restaurant', value: 'restaurant', priceModifier: 0 },
            { label: 'Office', value: 'office', priceModifier: 0 },
            { label: 'Warehouse', value: 'warehouse', priceModifier: 0 },
            { label: 'Property Management', value: 'property-management', priceModifier: 0 },
            { label: 'Other', value: 'other', priceModifier: 0 }
          ]
        },
        {
          id: nanoid(),
          type: 'radio',
          label: 'Service Frequency',
          required: true,
          placeholder: '',
          options: [
            { label: 'One-Time', value: 'one-time', priceModifier: 0 },
            { label: 'Weekly', value: 'weekly', priceModifier: 100 },
            { label: 'Bi-Weekly', value: 'bi-weekly', priceModifier: 75 },
            { label: 'Monthly', value: 'monthly', priceModifier: 50 }
          ]
        },
        {
          id: nanoid(),
          type: 'select',
          label: 'Dumpster Size',
          required: true,
          placeholder: '',
          options: [
            { label: '2 Yard', value: '2-yard', priceModifier: 0 },
            { label: '4 Yard', value: '4-yard', priceModifier: 50 },
            { label: '6 Yard', value: '6-yard', priceModifier: 100 },
            { label: '8 Yard', value: '8-yard', priceModifier: 150 }
          ]
        },
        {
          id: nanoid(),
          type: 'number',
          label: 'Number of Dumpsters',
          required: true,
          placeholder: '1',
          priceModifier: 50
        },
        {
          id: nanoid(),
          type: 'checkbox',
          label: 'Waste Type',
          required: true,
          placeholder: '',
          options: [
            { label: 'General Trash', value: 'general-trash', priceModifier: 0 },
            { label: 'Cardboard/Recycling', value: 'cardboard-recycling', priceModifier: 0 },
            { label: 'Food Waste', value: 'food-waste', priceModifier: 0 },
            { label: 'Confidential Documents', value: 'confidential-documents', priceModifier: 50 }
          ]
        },
        {
          id: nanoid(),
          type: 'date',
          label: 'Service Start Date',
          required: true,
          placeholder: ''
        },
        {
          id: nanoid(),
          type: 'email',
          label: 'Billing Contact Email',
          required: true,
          placeholder: 'billing@company.com'
        }
      ]
    }
  },

  // 5. Yard Waste & Landscaping
  {
    id: 'yard-waste-landscaping',
    name: 'Yard Waste & Landscaping',
    description: 'Specialized service for green waste and landscaping debris',
    category: 'specialty',
    schema: {
      version: 1,
      fields: [
        {
          id: nanoid(),
          type: 'select',
          label: 'Project Type',
          required: true,
          placeholder: '',
          options: [
            { label: 'Tree Removal', value: 'tree-removal', priceModifier: 0 },
            { label: 'Lawn Cleanup', value: 'lawn-cleanup', priceModifier: 0 },
            { label: 'Garden Renovation', value: 'garden-renovation', priceModifier: 0 },
            { label: 'Storm Cleanup', value: 'storm-cleanup', priceModifier: 50 },
            { label: 'Other', value: 'other', priceModifier: 0 }
          ]
        },
        {
          id: nanoid(),
          type: 'checkbox',
          label: 'Waste Type',
          required: true,
          placeholder: '',
          options: [
            { label: 'Leaves/Grass', value: 'leaves-grass', priceModifier: 0 },
            { label: 'Branches', value: 'branches', priceModifier: 25 },
            { label: 'Tree Stumps', value: 'tree-stumps', priceModifier: 75 },
            { label: 'Dirt/Soil', value: 'dirt-soil', priceModifier: 40 },
            { label: 'Rocks/Gravel', value: 'rocks-gravel', priceModifier: 50 }
          ]
        },
        {
          id: nanoid(),
          type: 'radio',
          label: 'Estimated Volume',
          required: true,
          placeholder: '',
          options: [
            { label: 'Small (5 yards)', value: 'small', priceModifier: 0 },
            { label: 'Medium (10 yards)', value: 'medium', priceModifier: 50 },
            { label: 'Large (15 yards)', value: 'large', priceModifier: 100 },
            { label: 'Extra Large (20 yards)', value: 'extra-large', priceModifier: 150 }
          ]
        },
        {
          id: nanoid(),
          type: 'checkbox',
          label: 'Green Waste Only',
          required: false,
          placeholder: '',
          options: [
            { label: 'Organic materials only (discount)', value: 'green-waste-only', priceModifier: -25 }
          ]
        },
        {
          id: nanoid(),
          type: 'date',
          label: 'Delivery Date',
          required: true,
          placeholder: ''
        },
        {
          id: nanoid(),
          type: 'radio',
          label: 'Property Type',
          required: true,
          placeholder: '',
          options: [
            { label: 'Residential', value: 'residential', priceModifier: 0 },
            { label: 'Commercial Property', value: 'commercial', priceModifier: 50 }
          ]
        }
      ]
    }
  },

  // 6. Roofing Specific
  {
    id: 'roofing-specific',
    name: 'Roofing Project',
    description: 'Specialized dumpster service for roofing contractors',
    category: 'specialty',
    schema: {
      version: 1,
      fields: [
        {
          id: nanoid(),
          type: 'radio',
          label: 'Roof Type',
          required: true,
          placeholder: '',
          options: [
            { label: 'Shingles', value: 'shingles', priceModifier: 0 },
            { label: 'Tile', value: 'tile', priceModifier: 50 },
            { label: 'Metal', value: 'metal', priceModifier: 0 },
            { label: 'Flat Roof', value: 'flat-roof', priceModifier: 0 }
          ]
        },
        {
          id: nanoid(),
          type: 'select',
          label: 'Roof Size',
          required: true,
          placeholder: '',
          options: [
            { label: 'Small (under 1500 sq ft)', value: 'small', priceModifier: 0 },
            { label: 'Medium (1500-2500 sq ft)', value: 'medium', priceModifier: 75 },
            { label: 'Large (2500-4000 sq ft)', value: 'large', priceModifier: 150 },
            { label: 'Extra Large (4000+ sq ft)', value: 'extra-large', priceModifier: 200 }
          ]
        },
        {
          id: nanoid(),
          type: 'number',
          label: 'Number of Shingle Layers Being Removed',
          required: true,
          placeholder: '1',
          priceModifier: 50
        },
        {
          id: nanoid(),
          type: 'radio',
          label: 'Dumpster Size',
          required: true,
          placeholder: '',
          options: [
            { label: '20 Yard', value: '20-yard', priceModifier: 0 },
            { label: '30 Yard', value: '30-yard', priceModifier: 50 },
            { label: '40 Yard', value: '40-yard', priceModifier: 100 }
          ]
        },
        {
          id: nanoid(),
          type: 'checkbox',
          label: 'Additional Services',
          required: false,
          placeholder: '',
          options: [
            { label: 'Magnet Sweep (nail cleanup)', value: 'magnet-sweep', priceModifier: 75 }
          ]
        },
        {
          id: nanoid(),
          type: 'date',
          label: 'Delivery Date',
          required: true,
          placeholder: ''
        }
      ]
    }
  },

  // 7. Estate Cleanout
  {
    id: 'estate-cleanout',
    name: 'Estate Cleanout',
    description: 'Compassionate service for estate and whole-home cleanouts',
    category: 'residential',
    schema: {
      version: 1,
      fields: [
        {
          id: nanoid(),
          type: 'radio',
          label: 'Property Size',
          required: true,
          placeholder: '',
          options: [
            { label: 'Apartment', value: 'apartment', priceModifier: 0 },
            { label: 'Small House', value: 'small-house', priceModifier: 100 },
            { label: 'Medium House', value: 'medium-house', priceModifier: 200 },
            { label: 'Large House', value: 'large-house', priceModifier: 350 },
            { label: 'Multi-Unit', value: 'multi-unit', priceModifier: 500 }
          ]
        },
        {
          id: nanoid(),
          type: 'radio',
          label: 'Service Level',
          required: true,
          placeholder: '',
          options: [
            { label: 'Drop Dumpster (Self-Load)', value: 'self-load', priceModifier: 0 },
            { label: 'Partial Assistance', value: 'partial-assistance', priceModifier: 200 },
            { label: 'Full Service Cleanout', value: 'full-service', priceModifier: 400 }
          ]
        },
        {
          id: nanoid(),
          type: 'checkbox',
          label: 'Additional Options',
          required: false,
          placeholder: '',
          options: [
            { label: "Separate items for donation", value: 'donation-separation', priceModifier: 50 }
          ]
        },
        {
          id: nanoid(),
          type: 'checkbox',
          label: 'Hazardous Materials',
          required: false,
          placeholder: '',
          options: [
            { label: 'Paint/Chemicals/etc (Quote Required)', value: 'hazardous-materials', priceModifier: 0 }
          ]
        },
        {
          id: nanoid(),
          type: 'radio',
          label: 'Timeline',
          required: true,
          placeholder: '',
          options: [
            { label: 'Rush (Within 48 hrs)', value: 'rush', priceModifier: 150 },
            { label: 'Standard (3-5 days)', value: 'standard', priceModifier: 0 },
            { label: 'Flexible', value: 'flexible', priceModifier: 0 }
          ]
        },
        {
          id: nanoid(),
          type: 'radio',
          label: 'Access Type',
          required: true,
          placeholder: '',
          options: [
            { label: 'Easy Access', value: 'easy-access', priceModifier: 0 },
            { label: 'Limited Access', value: 'limited-access', priceModifier: 50 },
            { label: 'Requires Estate Sale Coordination', value: 'estate-sale-coordination', priceModifier: 100 }
          ]
        }
      ]
    }
  },

  // 8. Concrete & Heavy Debris
  {
    id: 'concrete-heavy-debris',
    name: 'Concrete & Heavy Debris',
    description: 'Specialized service for concrete, asphalt, and heavy materials',
    category: 'specialty',
    schema: {
      version: 1,
      fields: [
        {
          id: nanoid(),
          type: 'select',
          label: 'Material Type',
          required: true,
          placeholder: '',
          options: [
            { label: 'Concrete Only', value: 'concrete-only', priceModifier: 0 },
            { label: 'Asphalt', value: 'asphalt', priceModifier: 0 },
            { label: 'Brick', value: 'brick', priceModifier: 0 },
            { label: 'Mixed Masonry', value: 'mixed-masonry', priceModifier: 25 }
          ]
        },
        {
          id: nanoid(),
          type: 'number',
          label: 'Estimated Weight (Tons)',
          required: true,
          placeholder: '1',
          priceModifier: 75
        },
        {
          id: nanoid(),
          type: 'checkbox',
          label: 'Contains Rebar',
          required: false,
          placeholder: '',
          options: [
            { label: 'Metal reinforcement present', value: 'contains-rebar', priceModifier: 100 }
          ]
        },
        {
          id: nanoid(),
          type: 'radio',
          label: 'Dumpster Size',
          required: true,
          placeholder: '',
          options: [
            { label: '10 Yard', value: '10-yard', priceModifier: 0 },
            { label: '15 Yard', value: '15-yard', priceModifier: 50 },
            { label: '20 Yard', value: '20-yard', priceModifier: 100 }
          ]
        },
        {
          id: nanoid(),
          type: 'date',
          label: 'Delivery Date',
          required: true,
          placeholder: ''
        },
        {
          id: nanoid(),
          type: 'textarea',
          label: 'Site Conditions',
          required: false,
          placeholder: 'Describe site access, parking, or special requirements...'
        }
      ]
    }
  }
];
