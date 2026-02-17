'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import type { FormSchema, FormField } from './service-form-builder';
import { DollarSign } from 'lucide-react';

interface ServiceFormRendererProps {
  schema: FormSchema;
  serviceBasePrice: number;
  onSubmit: (data: FormSubmissionData) => void;
  submitButtonText?: string;
}

export interface FormSubmissionData {
  responses: { [fieldId: string]: any };
  calculatedPrice: number;
}

export default function ServiceFormRenderer({
  schema,
  serviceBasePrice,
  onSubmit,
  submitButtonText = 'Submit Request'
}: ServiceFormRendererProps) {
  const [formData, setFormData] = useState<{ [fieldId: string]: any }>({});
  const [calculatedPrice, setCalculatedPrice] = useState(serviceBasePrice);
  const [errors, setErrors] = useState<{ [fieldId: string]: string }>({});

  // Calculate price whenever form data changes
  useEffect(() => {
    let totalPrice = serviceBasePrice;

    schema.fields.forEach(field => {
      if (!field.pricingImpact?.enabled) return;

      const value = formData[field.id];
      if (!value) return;

      // Number field with multiplier
      if (field.type === 'number' && field.pricingImpact.multiplier) {
        totalPrice += parseFloat(value) * field.pricingImpact.multiplier;
      }

      // Select/Radio with option prices
      if ((field.type === 'select' || field.type === 'radio') && field.pricingImpact.optionPrices) {
        const optionPrice = field.pricingImpact.optionPrices[value];
        if (optionPrice) totalPrice += optionPrice;
      }

      // Checkbox with option prices (multiple selections)
      if (field.type === 'checkbox' && field.pricingImpact.optionPrices) {
        const selectedOptions = Array.isArray(value) ? value : [];
        selectedOptions.forEach(option => {
          const optionPrice = field.pricingImpact.optionPrices?.[option];
          if (optionPrice) totalPrice += optionPrice;
        });
      }

      // Fixed modifier
      if (field.pricingImpact.baseModifier && value) {
        totalPrice += field.pricingImpact.baseModifier;
      }
    });

    setCalculatedPrice(Math.max(0, totalPrice));
  }, [formData, schema.fields, serviceBasePrice]);

  const validateField = (field: FormField, value: any): string | null => {
    if (field.required && (!value || (Array.isArray(value) && value.length === 0))) {
      return 'This field is required';
    }

    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
    }

    if (field.type === 'phone' && value) {
      const phoneRegex = /^\+?[\d\s\-()]+$/;
      if (!phoneRegex.test(value)) {
        return 'Please enter a valid phone number';
      }
    }

    if (field.type === 'number' && value) {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return 'Please enter a valid number';
      }
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
    const newErrors: { [fieldId: string]: string } = {};
    schema.fields.forEach(field => {
      const error = validateField(field, formData[field.id]);
      if (error) newErrors[field.id] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      responses: formData,
      calculatedPrice
    });
  };

  const updateFieldValue = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldId];
      return newErrors;
    });
  };

  const handleCheckboxChange = (fieldId: string, option: string, checked: boolean) => {
    const currentValues = formData[fieldId] || [];
    const newValues = checked
      ? [...currentValues, option]
      : currentValues.filter((v: string) => v !== option);
    updateFieldValue(fieldId, newValues);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Price Display */}
      {calculatedPrice !== serviceBasePrice && (
        <Card className="border-green-200 bg-green-50/50 rounded-3xl border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-green-700 uppercase tracking-wider">Estimated Price</p>
                <p className="text-3xl font-black text-green-900 tracking-tight">
                  ${calculatedPrice.toFixed(2)}
                </p>
                {serviceBasePrice > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    Base: ${serviceBasePrice.toFixed(2)} + Additions: ${(calculatedPrice - serviceBasePrice).toFixed(2)}
                  </p>
                )}
              </div>
              <DollarSign className="h-12 w-12 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Fields */}
      {schema.fields.map((field) => (
        <Card key={field.id} className="border-none shadow-lg rounded-3xl">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <Label className="text-sm font-black text-gray-900">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {field.pricingImpact?.enabled && (
                  <Badge className="bg-green-100 text-green-700 text-xs">
                    <DollarSign className="h-3 w-3 mr-1" />
                    Affects Price
                  </Badge>
                )}
              </div>

              {/* Render different field types */}
              {field.type === 'text' && (
                <Input
                  value={formData[field.id] || ''}
                  onChange={(e) => updateFieldValue(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  className="rounded-xl h-12 font-medium"
                />
              )}

              {field.type === 'email' && (
                <Input
                  type="email"
                  value={formData[field.id] || ''}
                  onChange={(e) => updateFieldValue(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  className="rounded-xl h-12 font-medium"
                />
              )}

              {field.type === 'phone' && (
                <Input
                  type="tel"
                  value={formData[field.id] || ''}
                  onChange={(e) => updateFieldValue(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  className="rounded-xl h-12 font-medium"
                />
              )}

              {field.type === 'number' && (
                <Input
                  type="number"
                  value={formData[field.id] || ''}
                  onChange={(e) => updateFieldValue(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  className="rounded-xl h-12 font-medium"
                  min={field.validation?.min}
                  max={field.validation?.max}
                />
              )}

              {field.type === 'date' && (
                <Input
                  type="date"
                  value={formData[field.id] || ''}
                  onChange={(e) => updateFieldValue(field.id, e.target.value)}
                  className="rounded-xl h-12 font-medium"
                />
              )}

              {field.type === 'textarea' && (
                <Textarea
                  value={formData[field.id] || ''}
                  onChange={(e) => updateFieldValue(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  className="rounded-xl font-medium min-h-32"
                />
              )}

              {field.type === 'select' && field.options && (
                <Select
                  value={formData[field.id] || ''}
                  onValueChange={(value) => updateFieldValue(field.id, value)}
                >
                  <SelectTrigger className="rounded-xl h-12 font-medium">
                    <SelectValue placeholder="Select an option..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {field.options.map((option) => (
                      <SelectItem key={option} value={option} className="font-medium">
                        {option}
                        {field.pricingImpact?.optionPrices?.[option] && (
                          <span className="text-green-600 ml-2">
                            (+${field.pricingImpact.optionPrices[option].toFixed(2)})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {field.type === 'radio' && field.options && (
                <RadioGroup
                  value={formData[field.id] || ''}
                  onValueChange={(value) => updateFieldValue(field.id, value)}
                  className="space-y-3"
                >
                  {field.options.map((option) => (
                    <div key={option} className="flex items-center space-x-3 bg-gray-50 p-4 rounded-xl">
                      <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                      <Label htmlFor={`${field.id}-${option}`} className="flex-1 font-medium cursor-pointer">
                        {option}
                        {field.pricingImpact?.optionPrices?.[option] && (
                          <span className="text-green-600 ml-2 font-bold">
                            +${field.pricingImpact.optionPrices[option].toFixed(2)}
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {field.type === 'checkbox' && field.options && (
                <div className="space-y-3">
                  {field.options.map((option) => (
                    <div key={option} className="flex items-center space-x-3 bg-gray-50 p-4 rounded-xl">
                      <input
                        type="checkbox"
                        id={`${field.id}-${option}`}
                        checked={(formData[field.id] || []).includes(option)}
                        onChange={(e) => handleCheckboxChange(field.id, option, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor={`${field.id}-${option}`} className="flex-1 font-medium cursor-pointer">
                        {option}
                        {field.pricingImpact?.optionPrices?.[option] && (
                          <span className="text-green-600 ml-2 font-bold">
                            +${field.pricingImpact.optionPrices[option].toFixed(2)}
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              )}

              {field.type === 'address' && (
                <Textarea
                  value={formData[field.id] || ''}
                  onChange={(e) => updateFieldValue(field.id, e.target.value)}
                  placeholder={field.placeholder || 'Enter your address...'}
                  className="rounded-xl font-medium"
                  rows={3}
                />
              )}

              {errors[field.id] && (
                <p className="text-sm text-red-600 font-medium">{errors[field.id]}</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-14 rounded-2xl bg-yellow-500 hover:bg-yellow-600 text-black font-black text-lg shadow-xl"
      >
        {submitButtonText}
        {calculatedPrice > 0 && ` - $${calculatedPrice.toFixed(2)}`}
      </Button>
    </form>
  );
}
