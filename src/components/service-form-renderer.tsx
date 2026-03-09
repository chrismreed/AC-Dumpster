'use client';

import { useState } from 'react';
import { FormField, FormSchema } from '@/types/service-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface ServiceFormRendererProps {
  schema: FormSchema;
  serviceName: string;
  basePrice: number;
  onSubmit: (responses: Record<string, any>, calculatedPrice: number) => Promise<void>;
  isSubmitting?: boolean;
}

export function ServiceFormRenderer({
  schema,
  serviceName,
  basePrice,
  onSubmit,
  isSubmitting = false
}: ServiceFormRendererProps) {
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const calculatePrice = () => {
    let totalPrice = basePrice;

    schema.fields.forEach(field => {
      if (!field.pricingImpact?.enabled) return;

      const value = responses[field.id];
      if (value === undefined || value === null || value === '') return;

      if (field.type === 'number' && field.pricingImpact.multiplier) {
        const numValue = parseFloat(value) || 0;
        totalPrice += numValue * field.pricingImpact.multiplier * 100; // Convert to cents
      } else if (field.pricingImpact.optionPrices && typeof value === 'string') {
        const priceModifier = field.pricingImpact.optionPrices[value] || 0;
        totalPrice += priceModifier * 100; // Convert to cents
      } else if (field.pricingImpact.baseModifier) {
        totalPrice += field.pricingImpact.baseModifier * 100; // Convert to cents
      }
    });

    return totalPrice;
  };

  const validateField = (field: FormField, value: any): string | null => {
    if (field.required && (value === undefined || value === null || value === '')) {
      return 'This field is required';
    }

    if (field.validation) {
      if (field.type === 'number') {
        const numValue = parseFloat(value);
        if (field.validation.min !== undefined && numValue < field.validation.min) {
          return `Value must be at least ${field.validation.min}`;
        }
        if (field.validation.max !== undefined && numValue > field.validation.max) {
          return `Value must be at most ${field.validation.max}`;
        }
      }

      if (field.validation.pattern && typeof value === 'string') {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(value)) {
          return 'Invalid format';
        }
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    schema.fields.forEach(field => {
      const error = validateField(field, responses[field.id]);
      if (error) {
        newErrors[field.id] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const calculatedPrice = calculatePrice();
    await onSubmit(responses, calculatedPrice);
  };

  const handleChange = (fieldId: string, value: any) => {
    setResponses(prev => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const renderField = (field: FormField) => {
    const error = errors[field.id];
    const value = responses[field.id];

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <Input
            type={field.type}
            value={value || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={`h-12 rounded-xl ${error ? 'border-red-500' : ''}`}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={`h-12 rounded-xl ${error ? 'border-red-500' : ''}`}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            className={`h-12 rounded-xl ${error ? 'border-red-500' : ''}`}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={`rounded-xl ${error ? 'border-red-500' : ''}`}
            rows={4}
          />
        );

      case 'select':
        return (
          <Select value={value || ''} onValueChange={(val) => handleChange(field.id, val)}>
            <SelectTrigger className={`h-12 rounded-xl ${error ? 'border-red-500' : ''}`}>
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {field.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                  {field.pricingImpact?.enabled && field.pricingImpact.optionPrices?.[option] && (
                    <span className="ml-2 text-green-600 font-bold">
                      +${field.pricingImpact.optionPrices[option].toFixed(2)}
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <RadioGroup value={value || ''} onValueChange={(val) => handleChange(field.id, val)}>
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <RadioGroupItem value={option} id={`${field.id}-${index}`} />
                  <Label htmlFor={`${field.id}-${index}`} className="font-normal cursor-pointer">
                    {option}
                    {field.pricingImpact?.enabled && field.pricingImpact.optionPrices?.[option] && (
                      <span className="ml-2 text-green-600 font-bold">
                        +${field.pricingImpact.optionPrices[option].toFixed(2)}
                      </span>
                    )}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id={`${field.id}-${index}`}
                  checked={(value || []).includes(option)}
                  onChange={(e) => {
                    const currentValues = value || [];
                    const newValues = e.target.checked
                      ? [...currentValues, option]
                      : currentValues.filter((v: string) => v !== option);
                    handleChange(field.id, newValues);
                  }}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor={`${field.id}-${index}`} className="font-normal cursor-pointer">
                  {option}
                  {field.pricingImpact?.enabled && field.pricingImpact.optionPrices?.[option] && (
                    <span className="ml-2 text-green-600 font-bold">
                      +${field.pricingImpact.optionPrices[option].toFixed(2)}
                    </span>
                  )}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'address':
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.placeholder || 'Enter address'}
            className={`h-12 rounded-xl ${error ? 'border-red-500' : ''}`}
          />
        );

      default:
        return null;
    }
  };

  const calculatedPrice = calculatePrice();

  return (
    <form onSubmit={handleSubmit}>
      <Card className="border-none shadow-2xl rounded-3xl">
        <CardHeader>
          <CardTitle className="text-2xl font-black text-gray-900">Request {serviceName}</CardTitle>
          <CardDescription className="font-medium">
            Fill out the form below to get a quote for this service
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {schema.fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label className="text-sm font-bold text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {renderField(field)}
              {errors[field.id] && (
                <p className="text-sm text-red-500 font-medium">{errors[field.id]}</p>
              )}
            </div>
          ))}

          {calculatedPrice !== basePrice && (
            <Card className="bg-green-50 border-green-200 rounded-2xl">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-700">Estimated Price:</span>
                  <span className="text-2xl font-black text-green-700">
                    ${(calculatedPrice / 100).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-black h-14 rounded-2xl shadow-xl"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              'Submit Request'
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
