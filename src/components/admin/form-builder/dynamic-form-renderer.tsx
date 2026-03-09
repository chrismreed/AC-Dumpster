'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FormSchema, FormField as FormFieldType } from './types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { PaymentElement } from '@/components/payment/payment-element';
import { ConversationalFormRenderer } from './conversational-form-renderer';
import { Truck, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface Dumpster {
  id: number;
  name: string;
  dimensions: string;
  description: string;
  weightLimit: number;
  imageUrl?: string;
}

interface DumpsterPricing {
  id: number;
  dumpsterId: number;
  days: number;
  price: number;
}

interface DynamicFormRendererProps {
  schema: FormSchema;
  onSubmit: (data: Record<string, any>, calculatedPrice: number) => void;
  basePrice: number;
  isPreview?: boolean;
}

export function DynamicFormRenderer({ schema, onSubmit, basePrice, isPreview = false }: DynamicFormRendererProps) {
  // If conversational mode is enabled, use the conversational renderer
  if (schema.displayMode === 'conversational') {
    return (
      <ConversationalFormRenderer
        schema={schema}
        onSubmit={onSubmit}
        basePrice={basePrice}
        isPreview={isPreview}
      />
    );
  }

  // Otherwise, use standard form renderer below
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [calculatedPrice, setCalculatedPrice] = useState(basePrice);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checkingAvailability, setCheckingAvailability] = useState<Record<number, boolean>>({});
  const [dumpsterAvailability, setDumpsterAvailability] = useState<Record<number, { available: boolean; availableUnits: number } | null>>({});

  // Fetch dumpsters for dumpster_selector fields
  const hasDumpsterSelector = schema.fields.some(f => f.type === 'dumpster_selector');
  const { data: dumpsters = [] } = useQuery<Dumpster[]>({
    queryKey: ['dumpsters'],
    queryFn: async () => {
      const res = await fetch('/api/dumpsters');
      if (!res.ok) throw new Error('Failed to fetch dumpsters');
      return res.json();
    },
    enabled: hasDumpsterSelector,
  });

  // Fetch dumpster pricing for dumpster_selector fields
  const { data: dumpsterPricing = [] } = useQuery<DumpsterPricing[]>({
    queryKey: ['dumpster-pricing'],
    queryFn: async () => {
      const res = await fetch('/api/dumpster-pricing/all');
      if (!res.ok) throw new Error('Failed to fetch dumpster pricing');
      return res.json();
    },
    enabled: hasDumpsterSelector,
  });

  // Check availability for a dumpster on a specific date
  const checkAvailability = async (dumpsterId: number, dateFieldId: string) => {
    const selectedDate = formData[dateFieldId];
    if (!selectedDate) return;

    // Find a pricing option for this dumpster (use the first one for availability check)
    const pricing = dumpsterPricing.find(p => p.dumpsterId === dumpsterId);
    if (!pricing) return;

    setCheckingAvailability(prev => ({ ...prev, [dumpsterId]: true }));

    try {
      const res = await fetch('/api/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dumpsterId,
          deliveryDate: selectedDate,
          pricingId: pricing.id,
        }),
      });
      const data = await res.json();
      setDumpsterAvailability(prev => ({
        ...prev,
        [dumpsterId]: { available: data.available, availableUnits: data.availableUnits },
      }));
    } catch (error) {
      console.error('Error checking availability:', error);
    } finally {
      setCheckingAvailability(prev => ({ ...prev, [dumpsterId]: false }));
    }
  };

  // Check if field should be visible based on conditional logic
  const isFieldVisible = (field: FormFieldType): boolean => {
    if (!field.conditionalLogic) return true;

    const { action, conditions, matchType } = field.conditionalLogic;

    // If action is not show/hide, field is always visible
    if (action !== 'show' && action !== 'hide') return true;

    // Evaluate conditions
    const results = conditions.map(condition => {
      const targetValue = formData[condition.fieldId];

      switch (condition.operator) {
        case 'equals':
          return Array.isArray(targetValue)
            ? targetValue.includes(condition.value)
            : targetValue === condition.value;
        case 'notEquals':
          return Array.isArray(targetValue)
            ? !targetValue.includes(condition.value)
            : targetValue !== condition.value;
        case 'contains':
          return typeof targetValue === 'string' && targetValue.includes(String(condition.value));
        case 'greaterThan':
          return Number(targetValue) > Number(condition.value);
        case 'lessThan':
          return Number(targetValue) < Number(condition.value);
        default:
          return false;
      }
    });

    // Apply match type logic
    const conditionsMet = matchType === 'all'
      ? results.every(r => r)
      : results.some(r => r);

    // Apply action
    return action === 'show' ? conditionsMet : !conditionsMet;
  };

  // Check if field should be disabled
  const isFieldDisabled = (field: FormFieldType): boolean => {
    if (!field.conditionalLogic || field.conditionalLogic.action !== 'disable') return false;

    const { conditions, matchType } = field.conditionalLogic;
    const results = conditions.map(condition => {
      const targetValue = formData[condition.fieldId];

      switch (condition.operator) {
        case 'equals':
          return Array.isArray(targetValue)
            ? targetValue.includes(condition.value)
            : targetValue === condition.value;
        case 'notEquals':
          return Array.isArray(targetValue)
            ? !targetValue.includes(condition.value)
            : targetValue !== condition.value;
        default:
          return false;
      }
    });

    return matchType === 'all' ? results.every(r => r) : results.some(r => r);
  };

  // Check if field is conditionally required
  const isFieldRequired = (field: FormFieldType): boolean => {
    if (field.required) return true;
    if (!field.conditionalLogic || field.conditionalLogic.action !== 'require') return false;

    const { conditions, matchType } = field.conditionalLogic;
    const results = conditions.map(condition => {
      const targetValue = formData[condition.fieldId];

      switch (condition.operator) {
        case 'equals':
          return Array.isArray(targetValue)
            ? targetValue.includes(condition.value)
            : targetValue === condition.value;
        case 'notEquals':
          return Array.isArray(targetValue)
            ? !targetValue.includes(condition.value)
            : targetValue !== condition.value;
        default:
          return false;
      }
    });

    return matchType === 'all' ? results.every(r => r) : results.some(r => r);
  };

  // Calculate price whenever form data changes
  useEffect(() => {
    let price = basePrice; // Start with base service price
    let hasSetBase = false; // Only allow ONE field to set the base

    schema.fields.forEach((field) => {
      const value = formData[field.id];

      // Legacy: Add price modifier for simple fields (deprecated)
      if (field.priceModifier && value) {
        price += field.priceModifier;
      }

      // New: Handle option-level pricing
      if (field.options && value) {
        if (Array.isArray(value)) {
          // For checkboxes (multiple selections)
          value.forEach((selectedValue: string) => {
            const option = field.options?.find((opt) => opt.value === selectedValue);

            // New pricing system
            if (option?.pricing && option.pricing.type !== 'none') {
              const amount = option.pricing.amount || 0;

              switch (option.pricing.type) {
                case 'setBase':
                  // Only the FIRST "set base" wins - use "add" for other fields!
                  if (!hasSetBase) {
                    price = amount;
                    hasSetBase = true;
                  }
                  break;
                case 'add':
                  price += amount;
                  break;
                case 'subtract':
                  price -= amount;
                  break;
                case 'multiply':
                  // Multiply by the percentage directly (50 = 50% = 0.5x)
                  price = price * (amount / 100);
                  break;
              }
            }
            // Legacy: fallback to old priceModifier
            else if (option?.priceModifier) {
              price += option.priceModifier;
            }
          });
        } else {
          // For radio/select (single selection)
          const option = field.options.find((opt) => opt.value === value);

          // New pricing system
          if (option?.pricing && option.pricing.type !== 'none') {
            const amount = option.pricing.amount || 0;

            switch (option.pricing.type) {
              case 'setBase':
                // Only the FIRST "set base" wins - use "add" for other fields!
                if (!hasSetBase) {
                  price = amount;
                  hasSetBase = true;
                }
                break;
              case 'add':
                price += amount;
                break;
              case 'subtract':
                price -= amount;
                break;
              case 'multiply':
                // Multiply by the percentage directly (50 = 50% = 0.5x)
                price = price * (amount / 100);
                break;
            }
          }
          // Legacy: fallback to old priceModifier
          else if (option?.priceModifier) {
            price += option.priceModifier;
          }
        }
      }

      // Handle number field pricing (e.g., quantity * price per unit)
      if (field.type === 'number' && field.pricing && field.pricing.type === 'perUnit') {
        const quantity = Number(value) || 0;
        const pricePerUnit = field.pricing.pricePerUnit || 0;
        price += quantity * pricePerUnit;
      }

      // Handle dumpster_selector field pricing
      if (field.type === 'dumpster_selector' && value) {
        const selectedDumpsterId = Number(value);
        // Find the lowest price for this dumpster
        const dumpsterPrices = dumpsterPricing.filter(p => p.dumpsterId === selectedDumpsterId);
        if (dumpsterPrices.length > 0) {
          const lowestPrice = Math.min(...dumpsterPrices.map(p => p.price));
          // Add dumpster price (or set as base if configured)
          if (!hasSetBase) {
            price = lowestPrice / 100; // Convert cents to dollars
            hasSetBase = true;
          } else {
            price += lowestPrice / 100;
          }
        }
      }
    });

    setCalculatedPrice(Math.max(0, price)); // Ensure price never goes negative
  }, [formData, schema.fields, basePrice, dumpsterPricing]);

  const validateField = (field: FormFieldType, value: any): string | null => {
    // Special validation for split name fields
    if (field.type === 'name' && field.nameConfig?.format === 'split') {
      const requireFirst = field.nameConfig.requireFirst !== false;
      const requireLast = field.nameConfig.requireLast !== false;

      if (requireFirst && (!value || !value.first || !value.first.trim())) {
        return 'First name is required';
      }
      if (requireLast && (!value || !value.last || !value.last.trim())) {
        return 'Last name is required';
      }
      if (field.required && (!value || (!value.first && !value.last))) {
        return field.validation?.message || 'Name is required';
      }
      return null;
    }

    if (field.required && !value) {
      return field.validation?.message || 'This field is required';
    }

    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return field.validation?.message || 'Invalid email address';
      }
    }

    if (field.type === 'phone' && value) {
      const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
      if (!phoneRegex.test(value)) {
        return field.validation?.message || 'Invalid phone number';
      }
    }

    if (field.type === 'number' && value) {
      const numValue = parseFloat(value);
      if (field.validation?.min !== undefined && numValue < field.validation.min) {
        return `Value must be at least ${field.validation.min}`;
      }
      if (field.validation?.max !== undefined && numValue > field.validation.max) {
        return `Value must be at most ${field.validation.max}`;
      }
    }

    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: Record<string, string> = {};
    schema.fields.forEach((field) => {
      const error = validateField(field, formData[field.id]);
      if (error) {
        newErrors[field.id] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData, calculatedPrice);
  };

  const updateField = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    // Clear error for this field
    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const renderField = (field: FormFieldType) => {
    const error = errors[field.id];
    const required = isFieldRequired(field);
    const disabled = isFieldDisabled(field);

    switch (field.type) {
      case 'name':
        const nameFormat = field.nameConfig?.format || 'single';
        const includeMiddle = field.nameConfig?.includeMiddle || false;
        const includePrefix = field.nameConfig?.includePrefix || false;
        const requireFirst = field.nameConfig?.requireFirst !== false; // Default true
        const requireLast = field.nameConfig?.requireLast !== false; // Default true
        const prefixOptions = field.nameConfig?.prefixOptions || ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'];

        if (nameFormat === 'split') {
          return (
            <div key={field.id} className="space-y-3">
              <Label className="text-sm font-bold">
                {field.label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </Label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {includePrefix && (
                  <div className="md:col-span-2">
                    <Select
                      value={formData[field.id]?.prefix || ''}
                      onValueChange={(value) => updateField(field.id, { ...formData[field.id], prefix: value })}
                      disabled={disabled}
                    >
                      <SelectTrigger className={`h-12 rounded-xl ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <SelectValue placeholder="Prefix (Optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {prefixOptions.map((prefix) => (
                          <SelectItem key={prefix} value={prefix}>{prefix}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Input
                    type="text"
                    value={formData[field.id]?.first || ''}
                    onChange={(e) => updateField(field.id, { ...formData[field.id], first: e.target.value })}
                    placeholder={`First Name${requireFirst ? ' *' : ''}`}
                    disabled={disabled}
                    className={`h-12 rounded-xl ${error ? 'border-red-500' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>

                {includeMiddle && (
                  <div>
                    <Input
                      type="text"
                      value={formData[field.id]?.middle || ''}
                      onChange={(e) => updateField(field.id, { ...formData[field.id], middle: e.target.value })}
                      placeholder="Middle Name (Optional)"
                      disabled={disabled}
                      className={`h-12 rounded-xl ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                  </div>
                )}

                <div>
                  <Input
                    type="text"
                    value={formData[field.id]?.last || ''}
                    onChange={(e) => updateField(field.id, { ...formData[field.id], last: e.target.value })}
                    placeholder={`Last Name${requireLast ? ' *' : ''}`}
                    disabled={disabled}
                    className={`h-12 rounded-xl ${error ? 'border-red-500' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          );
        } else {
          // Single field format
          return (
            <div key={field.id} className="space-y-2">
              <Label className="text-sm font-bold">
                {field.label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Input
                type="text"
                value={formData[field.id] || ''}
                onChange={(e) => updateField(field.id, e.target.value)}
                placeholder={field.placeholder || 'Full Name'}
                disabled={disabled}
                className={`h-12 rounded-xl ${error ? 'border-red-500' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          );
        }

      case 'text':
      case 'email':
      case 'phone':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm font-bold">
              {field.label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
              value={formData[field.id] || ''}
              onChange={(e) => updateField(field.id, e.target.value)}
              placeholder={field.placeholder}
              disabled={disabled}
              className={`h-12 rounded-xl ${error ? 'border-red-500' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm font-bold">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              value={formData[field.id] || ''}
              onChange={(e) => updateField(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={`rounded-xl min-h-[120px] ${error ? 'border-red-500' : ''}`}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm font-bold">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              type="number"
              value={formData[field.id] || ''}
              onChange={(e) => updateField(field.id, e.target.value)}
              placeholder={field.placeholder}
              min={field.validation?.min}
              max={field.validation?.max}
              className={`h-12 rounded-xl ${error ? 'border-red-500' : ''}`}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'date':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm font-bold">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              type="date"
              value={formData[field.id] || ''}
              onChange={(e) => updateField(field.id, e.target.value)}
              className={`h-12 rounded-xl ${error ? 'border-red-500' : ''}`}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm font-bold">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select value={formData[field.id] || ''} onValueChange={(value) => updateField(field.id, value)}>
              <SelectTrigger className={`h-12 rounded-xl ${error ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Select an option..." />
              </SelectTrigger>
              <SelectContent>
                {field.options?.filter(option => option.value && option.value.trim() !== '').map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'radio':
        const radioColumns = field.optionsColumns || 1;
        const radioColClasses: Record<number, string> = {
          1: 'grid-cols-1',
          2: 'grid-cols-2',
          3: 'grid-cols-3',
          4: 'grid-cols-4',
        };
        return (
          <div key={field.id} className="space-y-3">
            <Label className="text-sm font-bold">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <RadioGroup value={formData[field.id] || ''} onValueChange={(value) => updateField(field.id, value)}>
              <div className={`grid ${radioColClasses[radioColumns]} gap-3`}>
                {field.options?.filter(option => option.value && option.value.trim() !== '').map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
                    <Label htmlFor={`${field.id}-${option.value}`} className="font-normal cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'checkbox':
        const checkboxColumns = field.optionsColumns || 1;
        const checkboxColClasses: Record<number, string> = {
          1: 'grid-cols-1',
          2: 'grid-cols-2',
          3: 'grid-cols-3',
          4: 'grid-cols-4',
        };
        return (
          <div key={field.id} className="space-y-3">
            <Label className="text-sm font-bold">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className={`grid ${checkboxColClasses[checkboxColumns]} gap-3`}>
              {field.options?.filter(option => option.value && option.value.trim() !== '').map((option) => {
                const checked = (formData[field.id] || []).includes(option.value);
                return (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${field.id}-${option.value}`}
                      checked={checked}
                      onCheckedChange={(isChecked) => {
                        const currentValues = formData[field.id] || [];
                        const newValues = isChecked
                          ? [...currentValues, option.value]
                          : currentValues.filter((v: string) => v !== option.value);
                        updateField(field.id, newValues);
                      }}
                    />
                    <Label htmlFor={`${field.id}-${option.value}`} className="font-normal cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                );
              })}
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'address':
        return (
          <div key={field.id} className="space-y-3">
            <Label className="text-sm font-bold">
              {field.label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="space-y-2">
              <Input
                type="text"
                value={formData[field.id]?.street || ''}
                onChange={(e) => updateField(field.id, { ...formData[field.id], street: e.target.value })}
                placeholder="Street Address"
                disabled={disabled}
                className={`h-12 rounded-xl ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="text"
                  value={formData[field.id]?.city || ''}
                  onChange={(e) => updateField(field.id, { ...formData[field.id], city: e.target.value })}
                  placeholder="City"
                  disabled={disabled}
                  className={`h-12 rounded-xl ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                <Input
                  type="text"
                  value={formData[field.id]?.state || ''}
                  onChange={(e) => updateField(field.id, { ...formData[field.id], state: e.target.value })}
                  placeholder="State"
                  disabled={disabled}
                  className={`h-12 rounded-xl ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>
              <Input
                type="text"
                value={formData[field.id]?.zip || ''}
                onChange={(e) => updateField(field.id, { ...formData[field.id], zip: e.target.value })}
                placeholder="ZIP Code"
                disabled={disabled}
                className={`h-12 rounded-xl ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'agreement':
        return (
          <div key={field.id} className="space-y-2">
            <div className="flex items-start space-x-3 p-4 border-2 border-gray-200 rounded-xl">
              <Checkbox
                id={field.id}
                checked={formData[field.id] || false}
                onCheckedChange={(checked) => updateField(field.id, checked)}
                disabled={disabled}
                className={disabled ? 'opacity-50 cursor-not-allowed' : ''}
              />
              <Label htmlFor={field.id} className={`text-sm cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <span className="font-bold">{field.label}</span>
                {required && <span className="text-red-500 ml-1">*</span>}
                {field.placeholder && (
                  <p className="mt-1 text-xs text-gray-500 font-normal">{field.placeholder}</p>
                )}
              </Label>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'captcha':
        const captchaProvider = field.captchaConfig?.provider || 'recaptcha-v2';
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm font-bold">
              {field.label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="p-6 border-2 border-blue-200 rounded-xl bg-blue-50">
              <div className="text-center space-y-2">
                <p className="text-sm font-bold text-blue-900">
                  {captchaProvider === 'recaptcha-v2' && '☑️ reCAPTCHA v2'}
                  {captchaProvider === 'recaptcha-v3' && '🔒 reCAPTCHA v3'}
                  {captchaProvider === 'hcaptcha' && '✓ hCaptcha'}
                  {captchaProvider === 'turnstile' && '🛡️ Cloudflare Turnstile'}
                </p>
                <p className="text-xs text-blue-600">
                  {captchaProvider === 'recaptcha-v3' ? 'Invisible verification running in background' : 'Captcha verification will appear here'}
                </p>
                {!field.captchaConfig?.siteKey && (
                  <p className="text-xs text-red-600 font-bold">⚠️ Site key not configured</p>
                )}
              </div>
              {/* In production, actual captcha widget would be rendered here */}
              <input
                type="hidden"
                value={formData[field.id] || ''}
                onChange={(e) => updateField(field.id, e.target.value)}
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'dumpster_selector':
        const config = field.dumpsterSelectorConfig;
        const allowedIds = config?.allowedDumpsterIds || [];
        const showPricing = config?.showPricing !== false;
        const showAvailability = config?.showAvailability !== false;
        const showDimensions = config?.showDimensions !== false;
        const showImages = config?.showImages !== false;
        const dateFieldId = config?.dateFieldId;

        // Filter dumpsters to only show allowed ones
        const availableDumpsters = allowedIds.length > 0
          ? dumpsters.filter(d => allowedIds.includes(d.id))
          : dumpsters;

        // Get lowest price for each dumpster
        const getDumpsterPrice = (dumpsterId: number) => {
          const prices = dumpsterPricing.filter(p => p.dumpsterId === dumpsterId);
          if (prices.length === 0) return null;
          const lowestPrice = Math.min(...prices.map(p => p.price));
          return lowestPrice / 100; // Convert cents to dollars
        };

        // Check availability when date changes
        useEffect(() => {
          if (showAvailability && dateFieldId && formData[dateFieldId]) {
            availableDumpsters.forEach(d => {
              checkAvailability(d.id, dateFieldId);
            });
          }
        }, [formData[dateFieldId || '']]);

        return (
          <div key={field.id} className="space-y-3">
            <Label className="text-sm font-bold">
              {field.label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>

            {dateFieldId && !formData[dateFieldId] && showAvailability && (
              <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <p className="text-sm text-blue-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Please select a date first to see availability
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableDumpsters.map((dumpster) => {
                const isSelected = formData[field.id] === dumpster.id;
                const price = getDumpsterPrice(dumpster.id);
                const availability = dumpsterAvailability[dumpster.id];
                const isChecking = checkingAvailability[dumpster.id];
                const isAvailable = !showAvailability || !dateFieldId || !formData[dateFieldId] || availability?.available !== false;

                return (
                  <div
                    key={dumpster.id}
                    onClick={() => isAvailable && !disabled && updateField(field.id, dumpster.id)}
                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-yellow-500 bg-yellow-50 ring-2 ring-yellow-500'
                        : isAvailable
                          ? 'border-gray-200 hover:border-yellow-300 hover:bg-gray-50'
                          : 'border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle2 className="h-6 w-6 text-yellow-600" />
                      </div>
                    )}

                    <div className="flex gap-4">
                      {/* Dumpster image */}
                      {showImages && dumpster.imageUrl && (
                        <div className="flex-shrink-0">
                          <img
                            src={dumpster.imageUrl}
                            alt={dumpster.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        </div>
                      )}

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-gray-900 flex items-center gap-2">
                              <Truck className="h-4 w-4 text-yellow-600" />
                              {dumpster.name}
                            </h4>
                            {showDimensions && (
                              <p className="text-xs text-gray-500 mt-1">{dumpster.dimensions}</p>
                            )}
                          </div>

                          {/* Price */}
                          {showPricing && price !== null && (
                            <div className="text-right">
                              <p className="text-lg font-black text-gray-900">
                                ${price.toFixed(0)}
                              </p>
                              <p className="text-xs text-gray-500">starting</p>
                            </div>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {dumpster.description}
                        </p>

                        {/* Availability status */}
                        {showAvailability && dateFieldId && formData[dateFieldId] && (
                          <div className="mt-2">
                            {isChecking ? (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Checking availability...
                              </span>
                            ) : availability ? (
                              availability.available ? (
                                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  {availability.availableUnits} available
                                </span>
                              ) : (
                                <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  Not available for selected date
                                </span>
                              )
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'payment':
        const paymentProvider = field.paymentConfig?.provider || 'stripe';
        const paymentMode = field.paymentConfig?.mode || 'redirect';
        const collectBillingAddress = field.paymentConfig?.collectBillingAddress || false;
        const priceBreakdown = getPriceBreakdown();

        // Handler for successful payment - validate all fields and submit
        const handlePaymentSuccess = () => {
          console.log('Payment successful, validating and submitting form...');

          // Validate all non-payment fields before submitting
          const newErrors: Record<string, string> = {};
          schema.fields.forEach((f) => {
            // Skip the payment field itself
            if (f.id === field.id) return;

            const fieldError = validateField(f, formData[f.id]);
            if (fieldError) {
              newErrors[f.id] = fieldError;
            }
          });

          if (Object.keys(newErrors).length > 0) {
            console.error('Form validation failed:', newErrors);
            setErrors(newErrors);
            // Scroll to first error
            const firstErrorElement = document.querySelector('.border-red-500');
            firstErrorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
          }

          // Mark payment as complete
          updateField(field.id, 'paid');

          // Submit the form with all data
          onSubmit(formData, calculatedPrice);
        };

        return (
          <div key={field.id} className="space-y-4">
            <Label className="text-sm font-bold">
              {field.label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>

            {/* Price Breakdown - Show for embedded payments */}
            {paymentMode === 'embedded' && priceBreakdown.length > 0 && (
              <div className="p-6 border-2 border-yellow-500 rounded-xl bg-yellow-50">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Price Breakdown</h3>
                <div className="space-y-2">
                  {priceBreakdown.map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-2">
                      <span className={`text-sm ${
                        item.type === 'base' ? 'font-bold text-gray-900' :
                        item.type === 'add' ? 'text-green-700' :
                        item.type === 'subtract' ? 'text-red-700' :
                        'text-gray-700'
                      }`}>
                        {item.label}
                      </span>
                      <span className={`text-sm font-bold ${
                        item.type === 'base' ? 'text-gray-900' :
                        item.type === 'add' ? 'text-green-700' :
                        item.type === 'subtract' ? 'text-red-700' :
                        'text-gray-700'
                      }`}>
                        {item.type === 'multiply' ? `${item.amount}%` :
                         item.type === 'subtract' ? `-$${Math.abs(item.amount).toFixed(2)}` :
                         item.type === 'add' ? `+$${item.amount.toFixed(2)}` :
                         `$${item.amount.toFixed(2)}`}
                      </span>
                    </div>
                  ))}
                  <div className="border-t-2 border-yellow-600 pt-3 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black text-gray-900">Total</span>
                      <span className="text-2xl font-black text-gray-900">${calculatedPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="p-6 border-2 border-green-200 rounded-xl bg-green-50">
              {/* Embedded Stripe Payment */}
              {paymentMode === 'embedded' ? (
                <div className="bg-white p-6 rounded-xl">
                  <PaymentElement
                    amount={calculatedPrice}
                    collectBillingAddress={collectBillingAddress}
                    onSuccess={handlePaymentSuccess}
                    onError={(error) => {
                      console.error('Payment error:', error);
                      setErrors({ ...errors, [field.id]: error });
                    }}
                  />
                </div>
              ) : (
                /* Non-embedded or other providers */
                <div className="text-center space-y-3">
                  <p className="text-lg font-bold text-green-900">
                    💳 {paymentProvider.charAt(0).toUpperCase() + paymentProvider.slice(1)} Payment
                  </p>
                  <div className="text-sm text-green-700">
                    <p className="font-bold">Total Amount: ${calculatedPrice.toFixed(2)}</p>
                  </div>
                  <p className="text-xs text-green-600">
                    {paymentMode === 'redirect' && `You will be redirected to ${paymentProvider} to complete payment`}
                    {paymentMode === 'display-only' && 'Payment will be collected separately'}
                  </p>
                  {paymentMode === 'redirect' && (
                    <Button className="mt-4 bg-green-600 hover:bg-green-700 rounded-xl">
                      Continue to {paymentProvider.charAt(0).toUpperCase() + paymentProvider.slice(1)}
                    </Button>
                  )}
                </div>
              )}
              <input
                type="hidden"
                value={formData[field.id] || ''}
                onChange={(e) => updateField(field.id, e.target.value)}
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  // Calculate price breakdown for display
  const getPriceBreakdown = () => {
    const items: Array<{ label: string; amount: number; type: string }> = [];
    let baseSet = false;

    schema.fields.forEach((field) => {
      const value = formData[field.id];
      if (!value) return;

      if (field.options) {
        const selectedOptions = Array.isArray(value) ? value : [value];

        selectedOptions.forEach((selectedValue: string) => {
          const option = field.options?.find((opt) => opt.value === selectedValue);
          if (!option) return;

          // Check new pricing system
          if (option.pricing && option.pricing.type !== 'none') {
            const amount = option.pricing.amount || 0;

            if (option.pricing.type === 'setBase' && !baseSet) {
              items.push({ label: option.label, amount, type: 'base' });
              baseSet = true;
            } else if (option.pricing.type === 'add') {
              items.push({ label: option.label, amount, type: 'add' });
            } else if (option.pricing.type === 'subtract') {
              items.push({ label: option.label, amount: -amount, type: 'subtract' });
            } else if (option.pricing.type === 'multiply') {
              items.push({ label: `${option.label} (${amount}%)`, amount, type: 'multiply' });
            }
          }
          // Legacy pricing
          else if (option.priceModifier) {
            items.push({ label: option.label, amount: option.priceModifier, type: 'add' });
          }
        });
      }

      // Number field per-unit pricing
      if (field.type === 'number' && field.pricing && field.pricing.type === 'perUnit') {
        const quantity = Number(value) || 0;
        const pricePerUnit = field.pricing.pricePerUnit || 0;
        if (quantity > 0) {
          items.push({
            label: `${field.label} (${quantity} × $${pricePerUnit})`,
            amount: quantity * pricePerUnit,
            type: 'add'
          });
        }
      }
    });

    return items;
  };

  const priceBreakdown = getPriceBreakdown();

  // Check if there's an embedded payment field
  const hasEmbeddedPayment = schema.fields.some(
    field => field.type === 'payment' &&
    field.paymentConfig?.mode === 'embedded' &&
    isFieldVisible(field)
  );

  // Group fields into rows based on column widths
  const renderFieldsWithLayout = () => {
    const visibleFields = schema.fields.filter(field => isFieldVisible(field));
    const rows: FormFieldType[][] = [];
    let currentRow: FormFieldType[] = [];
    let currentRowWidth = 0;

    visibleFields.forEach((field) => {
      const columnWidth = field.columnWidth || 12;

      // If adding this field would exceed 12 columns, start a new row
      if (currentRowWidth + columnWidth > 12 && currentRow.length > 0) {
        rows.push(currentRow);
        currentRow = [];
        currentRowWidth = 0;
      }

      currentRow.push(field);
      currentRowWidth += columnWidth;

      // If we've filled exactly 12 columns, start a new row
      if (currentRowWidth === 12) {
        rows.push(currentRow);
        currentRow = [];
        currentRowWidth = 0;
      }
    });

    // Add any remaining fields
    if (currentRow.length > 0) {
      rows.push(currentRow);
    }

    // Map column widths to Tailwind classes (needed for proper purging)
    const colSpanClasses: Record<number, string> = {
      1: 'col-span-1',
      2: 'col-span-2',
      3: 'col-span-3',
      4: 'col-span-4',
      5: 'col-span-5',
      6: 'col-span-6',
      7: 'col-span-7',
      8: 'col-span-8',
      9: 'col-span-9',
      10: 'col-span-10',
      11: 'col-span-11',
      12: 'col-span-12',
    };

    console.log('📐 Form Layout Debug:', {
      totalFields: visibleFields.length,
      rows: rows.map(row => row.map(f => ({ label: f.label, width: f.columnWidth || 12 }))),
      totalRows: rows.length
    });

    return rows.map((row, rowIndex) => (
      <div key={rowIndex} className="grid grid-cols-12 gap-4">
        {row.map((field) => {
          const columnWidth = field.columnWidth || 12;
          const colClass = colSpanClasses[columnWidth];
          console.log(`  Field "${field.label}" → ${colClass}`);
          return (
            <div key={field.id} className={colClass}>
              {renderField(field)}
            </div>
          );
        })}
      </div>
    ));
  };

  // When there's an embedded payment, don't use a form wrapper to avoid nested forms
  // The payment element will handle submission and trigger onSubmit when payment succeeds
  const FormWrapper = hasEmbeddedPayment ? 'div' : 'form';
  const wrapperProps = hasEmbeddedPayment
    ? { className: "space-y-6" }
    : { onSubmit: handleSubmit, className: "space-y-6" };

  return (
    <FormWrapper {...wrapperProps}>
      {renderFieldsWithLayout()}

      {/* Price Breakdown - Hide if embedded payment is present (payment shows its own breakdown) */}
      {!hasEmbeddedPayment && priceBreakdown.length > 0 && (
        <Card className="border-2 border-yellow-500 bg-yellow-50 rounded-2xl">
          <CardContent className="py-6">
            <div className="space-y-3">
              <p className="text-sm font-bold text-gray-600 mb-3">Estimated Price</p>

              {/* Line items */}
              <div className="space-y-2">
                {priceBreakdown.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{item.label}</span>
                    <span className={`font-bold ${
                      item.type === 'subtract' ? 'text-red-600' :
                      item.type === 'base' ? 'text-gray-900' :
                      'text-green-600'
                    }`}>
                      {item.type === 'multiply'
                        ? `×${(item.amount / 100).toFixed(2)}`
                        : item.amount < 0
                          ? `-$${Math.abs(item.amount).toFixed(2)}`
                          : `$${item.amount.toFixed(2)}`
                      }
                    </span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="pt-3 mt-3 border-t-2 border-yellow-600 flex items-center justify-between">
                <span className="text-base font-bold text-gray-900">Total</span>
                <span className="text-3xl font-black text-yellow-700">
                  ${calculatedPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button - Hide if embedded payment is present (payment has its own submit) */}
      {!hasEmbeddedPayment && (
        <Button
          type="submit"
          disabled={isPreview}
          className="w-full h-14 bg-yellow-500 hover:bg-yellow-600 text-black font-black rounded-xl text-lg"
        >
          {isPreview ? 'Preview Mode' : 'Submit Request'}
        </Button>
      )}
    </FormWrapper>
  );
}
