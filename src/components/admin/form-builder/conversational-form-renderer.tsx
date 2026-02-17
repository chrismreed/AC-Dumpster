'use client';

import { useState, useEffect, useRef } from 'react';
import { FormField as FormFieldType, FormSchema } from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { PaymentElement } from '@/components/payment/payment-element';

interface ConversationalFormRendererProps {
  schema: FormSchema;
  onSubmit: (data: Record<string, any>, totalPrice: number) => void;
  isPreview?: boolean;
  basePrice?: number;
}

export function ConversationalFormRenderer({
  schema,
  onSubmit,
  isPreview = false,
  basePrice = 0
}: ConversationalFormRendererProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [calculatedPrice, setCalculatedPrice] = useState(basePrice);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get visible fields based on conditional logic
  const getVisibleFields = (): FormFieldType[] => {
    return schema.fields.filter(field => {
      if (!field.conditionalLogic) return true;

      const { action, conditions, matchType } = field.conditionalLogic;
      const results = conditions.map(condition => {
        const fieldValue = formData[condition.fieldId];

        switch (condition.operator) {
          case 'equals':
            return fieldValue === condition.value;
          case 'notEquals':
            return fieldValue !== condition.value;
          case 'contains':
            return Array.isArray(condition.value)
              ? condition.value.includes(fieldValue)
              : String(fieldValue).includes(String(condition.value));
          case 'greaterThan':
            return Number(fieldValue) > Number(condition.value);
          case 'lessThan':
            return Number(fieldValue) < Number(condition.value);
          default:
            return false;
        }
      });

      const conditionMet = matchType === 'all'
        ? results.every(r => r)
        : results.some(r => r);

      return action === 'show' ? conditionMet : !conditionMet;
    });
  };

  const visibleFields = getVisibleFields();
  const currentField = visibleFields[currentStep];
  const isLastStep = currentStep === visibleFields.length - 1;
  const progress = ((currentStep + 1) / visibleFields.length) * 100;

  // Focus input when step changes
  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
  }, [currentStep]);

  // Calculate price
  useEffect(() => {
    let price = basePrice;

    schema.fields.forEach((field) => {
      const value = formData[field.id];
      if (!value) return;

      // Handle option-based pricing (select, radio, checkbox)
      if (field.options && Array.isArray(field.options)) {
        const selectedOptions = Array.isArray(value) ? value : [value];

        selectedOptions.forEach((selectedValue: string) => {
          const option = field.options!.find(opt => opt.value === selectedValue);
          if (option?.pricing) {
            switch (option.pricing.type) {
              case 'setBase':
                price = option.pricing.amount;
                break;
              case 'add':
                price += option.pricing.amount;
                break;
              case 'subtract':
                price -= option.pricing.amount;
                break;
              case 'multiply':
                price = price * (option.pricing.amount / 100);
                break;
            }
          }
        });
      }

      // Handle per-unit pricing for number fields
      if (field.type === 'number' && field.pricing?.type === 'perUnit') {
        const quantity = Number(value) || 0;
        const pricePerUnit = field.pricing.pricePerUnit || 0;
        price += quantity * pricePerUnit;
      }
    });

    setCalculatedPrice(Math.max(0, price));
  }, [formData, schema.fields, basePrice]);

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

    if (field.validation) {
      if (field.validation.min !== undefined && Number(value) < field.validation.min) {
        return field.validation.message || `Minimum value is ${field.validation.min}`;
      }
      if (field.validation.max !== undefined && Number(value) > field.validation.max) {
        return field.validation.message || `Maximum value is ${field.validation.max}`;
      }
      if (field.validation.pattern) {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(String(value))) {
          return field.validation.message || 'Invalid format';
        }
      }
    }

    return null;
  };

  const handleNext = () => {
    if (!currentField) return;

    // Validate current field
    const value = formData[currentField.id];
    const error = validateField(currentField, value);

    if (error) {
      setErrors({ ...errors, [currentField.id]: error });
      return;
    }

    // Clear error for this field
    setErrors({ ...errors, [currentField.id]: '' });

    // Transition to next step
    if (!isLastStep) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsTransitioning(false);
      }, 200);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsTransitioning(false);
      }, 200);
    }
  };

  const handleSubmit = () => {
    if (isPreview) return;

    // Validate all fields before submission
    const newErrors: Record<string, string> = {};
    visibleFields.forEach((field) => {
      const error = validateField(field, formData[field.id]);
      if (error) {
        newErrors[field.id] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Go back to first error
      const firstErrorIndex = visibleFields.findIndex(f => newErrors[f.id]);
      setCurrentStep(firstErrorIndex);
      return;
    }

    onSubmit(formData, calculatedPrice);
  };

  const updateField = (fieldId: string, value: any) => {
    setFormData({ ...formData, [fieldId]: value });
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors({ ...errors, [fieldId]: '' });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleNext();
    }
  };

  const renderField = (field: FormFieldType) => {
    const error = errors[field.id];
    const value = formData[field.id];

    switch (field.type) {
      case 'name':
        const nameFormat = field.nameConfig?.format || 'single';
        const includeMiddle = field.nameConfig?.includeMiddle || false;
        const includePrefix = field.nameConfig?.includePrefix || false;
        const requireFirst = field.nameConfig?.requireFirst !== false;
        const requireLast = field.nameConfig?.requireLast !== false;
        const prefixOptions = field.nameConfig?.prefixOptions || ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'];

        if (nameFormat === 'split') {
          return (
            <div className="space-y-4">
              {includePrefix && (
                <Select
                  value={value?.prefix || ''}
                  onValueChange={(val) => updateField(field.id, { ...value, prefix: val })}
                >
                  <SelectTrigger className="h-14 rounded-2xl text-lg border-2 border-slate-600 bg-slate-800 text-white focus:border-yellow-500">
                    <SelectValue placeholder="Prefix (Optional)" className="text-slate-400" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {prefixOptions.map((prefix) => (
                      <SelectItem key={prefix} value={prefix} className="text-white focus:bg-slate-700 focus:text-white">{prefix}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Input
                ref={inputRef}
                type="text"
                value={value?.first || ''}
                onChange={(e) => updateField(field.id, { ...value, first: e.target.value })}
                onKeyPress={handleKeyPress}
                placeholder={`First Name${requireFirst ? ' *' : ''}`}
                className="h-14 rounded-2xl text-lg border-2 border-slate-600 bg-slate-800 text-white placeholder:text-slate-500 focus:border-yellow-500"
              />

              {includeMiddle && (
                <Input
                  type="text"
                  value={value?.middle || ''}
                  onChange={(e) => updateField(field.id, { ...value, middle: e.target.value })}
                  onKeyPress={handleKeyPress}
                  placeholder="Middle Name (Optional)"
                  className="h-14 rounded-2xl text-lg border-2 border-slate-600 bg-slate-800 text-white placeholder:text-slate-500 focus:border-yellow-500"
                />
              )}

              <Input
                type="text"
                value={value?.last || ''}
                onChange={(e) => updateField(field.id, { ...value, last: e.target.value })}
                onKeyPress={handleKeyPress}
                placeholder={`Last Name${requireLast ? ' *' : ''}`}
                className="h-14 rounded-2xl text-lg border-2 border-slate-600 bg-slate-800 text-white placeholder:text-slate-500 focus:border-yellow-500"
              />
            </div>
          );
        } else {
          return (
            <Input
              ref={inputRef}
              type="text"
              value={value || ''}
              onChange={(e) => updateField(field.id, e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={field.placeholder || 'Your answer'}
              className="h-14 rounded-2xl text-lg border-2 border-slate-600 bg-slate-800 text-white placeholder:text-slate-500 focus:border-yellow-500"
            />
          );
        }

      case 'text':
      case 'email':
      case 'phone':
        return (
          <Input
            ref={inputRef}
            type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
            value={value || ''}
            onChange={(e) => updateField(field.id, e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={field.placeholder || 'Your answer'}
            className="h-14 rounded-2xl text-lg border-2 border-slate-600 bg-slate-800 text-white placeholder:text-slate-500 focus:border-yellow-500"
          />
        );

      case 'textarea':
        return (
          <Textarea
            ref={inputRef as any}
            value={value || ''}
            onChange={(e) => updateField(field.id, e.target.value)}
            placeholder={field.placeholder || 'Your answer'}
            rows={4}
            className="rounded-2xl text-lg border-2 border-slate-600 bg-slate-800 text-white placeholder:text-slate-500 focus:border-yellow-500 resize-none"
          />
        );

      case 'number':
        return (
          <Input
            ref={inputRef}
            type="number"
            value={value || ''}
            onChange={(e) => updateField(field.id, e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={field.placeholder || '0'}
            min={field.validation?.min}
            max={field.validation?.max}
            className="h-14 rounded-2xl text-lg border-2 border-slate-600 bg-slate-800 text-white placeholder:text-slate-500 focus:border-yellow-500"
          />
        );

      case 'date':
        return (
          <Input
            ref={inputRef}
            type="date"
            value={value || ''}
            onChange={(e) => updateField(field.id, e.target.value)}
            className="h-14 rounded-2xl text-lg border-2 border-slate-600 bg-slate-800 text-white placeholder:text-slate-500 focus:border-yellow-500"
          />
        );

      case 'select':
        return (
          <Select value={value || ''} onValueChange={(val) => updateField(field.id, val)}>
            <SelectTrigger className="h-14 rounded-2xl text-lg border-2 border-slate-600 bg-slate-800 text-white focus:border-yellow-500">
              <SelectValue placeholder="Choose an option" className="text-slate-400" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-white focus:bg-slate-700 focus:text-white">
                  {option.label}
                  {option.pricing && option.pricing.type !== 'none' && (
                    <span className="ml-2 text-sm text-slate-400">
                      {option.pricing.type === 'add' && `+$${option.pricing.amount}`}
                      {option.pricing.type === 'subtract' && `-$${option.pricing.amount}`}
                      {option.pricing.type === 'multiply' && `×${option.pricing.amount}%`}
                      {option.pricing.type === 'setBase' && `$${option.pricing.amount}`}
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <RadioGroup value={value || ''} onValueChange={(val) => updateField(field.id, val)} className="space-y-3">
            {field.options?.map((option) => {
              const isSelected = value === option.value;
              return (
                <div
                  key={option.value}
                  className={`flex items-center space-x-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-yellow-500 bg-yellow-500/20'
                      : 'border-slate-600 bg-slate-800 hover:border-yellow-500/50 hover:bg-slate-700'
                  }`}
                  onClick={() => updateField(field.id, option.value)}
                >
                  <RadioGroupItem value={option.value} id={option.value} className="border-slate-500 text-yellow-500" />
                  <Label htmlFor={option.value} className="flex-1 text-lg cursor-pointer text-white">
                    {option.label}
                    {option.pricing && option.pricing.type !== 'none' && (
                      <span className="ml-2 text-sm text-slate-400">
                        {option.pricing.type === 'add' && `+$${option.pricing.amount}`}
                        {option.pricing.type === 'subtract' && `-$${option.pricing.amount}`}
                        {option.pricing.type === 'multiply' && `×${option.pricing.amount}%`}
                        {option.pricing.type === 'setBase' && `$${option.pricing.amount}`}
                      </span>
                    )}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        );

      case 'checkbox':
        const checkboxValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-3">
            {field.options?.map((option) => {
              const isChecked = checkboxValues.includes(option.value);
              return (
                <div
                  key={option.value}
                  className={`flex items-center space-x-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    isChecked
                      ? 'border-yellow-500 bg-yellow-500/20'
                      : 'border-slate-600 bg-slate-800 hover:border-yellow-500/50 hover:bg-slate-700'
                  }`}
                  onClick={() => {
                    const newValues = checkboxValues.includes(option.value)
                      ? checkboxValues.filter((v: string) => v !== option.value)
                      : [...checkboxValues, option.value];
                    updateField(field.id, newValues);
                  }}
                >
                  <Checkbox
                    checked={isChecked}
                    id={option.value}
                    className="border-slate-500 data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
                  />
                  <Label htmlFor={option.value} className="flex-1 text-lg cursor-pointer text-white">
                    {option.label}
                    {option.pricing && option.pricing.type !== 'none' && (
                      <span className="ml-2 text-sm text-slate-400">
                        {option.pricing.type === 'add' && `+$${option.pricing.amount}`}
                      </span>
                    )}
                  </Label>
                </div>
              );
            })}
          </div>
        );

      case 'payment':
        const paymentProvider = field.paymentConfig?.provider || 'stripe';
        const paymentMode = field.paymentConfig?.mode || 'redirect';
        const collectBillingAddress = field.paymentConfig?.collectBillingAddress || false;

        if (paymentMode === 'embedded') {
          return (
            <div className="bg-white p-6 rounded-2xl border-2 border-green-200">
              <PaymentElement
                amount={calculatedPrice}
                collectBillingAddress={collectBillingAddress}
                onSuccess={() => {
                  updateField(field.id, 'paid');
                  handleSubmit();
                }}
                onError={(error) => {
                  setErrors({ ...errors, [field.id]: error });
                }}
              />
            </div>
          );
        }

        return (
          <div className="text-center space-y-4 p-8 bg-green-50 rounded-2xl border-2 border-green-200">
            <p className="text-2xl font-bold text-green-900">
              💳 {paymentProvider.charAt(0).toUpperCase() + paymentProvider.slice(1)} Payment
            </p>
            <p className="text-lg text-green-700">Total: ${calculatedPrice.toFixed(2)}</p>
            <p className="text-sm text-green-600">Payment will be processed after form submission</p>
          </div>
        );

      default:
        return null;
    }
  };

  if (!currentField) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No fields configured</p>
      </div>
    );
  }

  return (
    <div className="min-h-[600px] flex flex-col">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 text-sm text-slate-400 text-right">
          Question {currentStep + 1} of {visibleFields.length}
        </div>
      </div>

      {/* Question Card */}
      <Card className={`flex-1 border-2 border-slate-700 shadow-2xl rounded-3xl transition-all duration-200 bg-slate-900 ${isTransitioning ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'}`}>
        <CardContent className="p-8 md:p-12">
          <div className="space-y-6">
            {/* Question Number */}
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-yellow-500 text-black font-black text-lg">
              {currentStep + 1}
            </div>

            {/* Question Label */}
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-2">
                {currentField.label}
                {currentField.required && <span className="text-yellow-500 ml-2">*</span>}
              </h2>
              {currentField.placeholder && currentField.type !== 'text' && currentField.type !== 'email' && (
                <p className="text-slate-400 text-lg">{currentField.placeholder}</p>
              )}
            </div>

            {/* Field Input */}
            <div className="pt-4">
              {renderField(currentField)}
            </div>

            {/* Error Message */}
            {errors[currentField.id] && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
                <p className="text-red-600 font-medium">{errors[currentField.id]}</p>
              </div>
            )}

            {/* Price Display */}
            {calculatedPrice > 0 && (
              <div className="pt-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 border-2 border-yellow-500/30 rounded-2xl">
                  <span className="text-sm font-bold text-slate-400">Estimated Total:</span>
                  <span className="text-xl font-black text-yellow-500">${calculatedPrice.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-8">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0 || isPreview}
          className="h-14 px-8 rounded-2xl border-2 border-slate-600 text-lg font-bold disabled:opacity-50 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </Button>

        <Button
          onClick={handleNext}
          disabled={isPreview}
          className="h-14 px-8 rounded-2xl text-lg font-bold bg-yellow-500 hover:bg-yellow-600 text-black"
        >
          {isLastStep ? (
            <>
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Submit
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="h-5 w-5 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Keyboard Hint */}
      <div className="text-center mt-4">
        <p className="text-sm text-slate-500">
          Press <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-600 text-xs font-mono text-slate-400">Enter ↵</kbd> to continue
        </p>
      </div>
    </div>
  );
}
