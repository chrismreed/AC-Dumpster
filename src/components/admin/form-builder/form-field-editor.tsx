'use client';

import { FormField, FormFieldType, FormFieldOption } from './types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { useState } from 'react';

interface FormFieldEditorProps {
  field: FormField;
  onUpdate: (field: FormField) => void;
  onDelete: () => void;
}

export function FormFieldEditor({ field, onUpdate, onDelete }: FormFieldEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const fieldTypes: { value: FormFieldType; label: string }[] = [
    { value: 'text', label: 'Text Input' },
    { value: 'name', label: 'Name (Contact Field)' },
    { value: 'email', label: 'Email (Contact Field)' },
    { value: 'phone', label: 'Phone (Contact Field)' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Dropdown' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'checkbox', label: 'Checkboxes' },
    { value: 'address', label: 'Address' },
    { value: 'agreement', label: 'Agreement/Terms' },
    { value: 'captcha', label: 'Captcha Verification' },
    { value: 'payment', label: 'Payment' },
  ];

  const needsOptions = ['select', 'radio', 'checkbox'].includes(field.type);

  const addOption = () => {
    const newOption: FormFieldOption = { label: 'New Option', value: 'new-option', priceModifier: 0 };
    onUpdate({
      ...field,
      options: [...(field.options || []), newOption],
    });
  };

  const updateOption = (index: number, updates: Partial<FormFieldOption>) => {
    const newOptions = [...(field.options || [])];
    newOptions[index] = { ...newOptions[index], ...updates };
    onUpdate({ ...field, options: newOptions });
  };

  const deleteOption = (index: number) => {
    const newOptions = (field.options || []).filter((_, i) => i !== index);
    onUpdate({ ...field, options: newOptions });
  };

  return (
    <div className="border border-gray-200 rounded-2xl p-6 bg-white hover:shadow-lg transition-all">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <div className="cursor-move">
          <GripVertical className="h-5 w-5 text-gray-400" />
        </div>
        <div className="flex-1">
          <Input
            value={field.label}
            onChange={(e) => onUpdate({ ...field, label: e.target.value })}
            placeholder="Field Label"
            className="font-bold h-12 rounded-xl"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="h-10 w-10 rounded-xl hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Field Type */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <Label className="text-xs font-bold text-gray-500 uppercase mb-2">Field Type</Label>
          <Select
            value={field.type}
            onValueChange={(value: FormFieldType) =>
              onUpdate({ ...field, type: value, options: needsOptions ? field.options || [] : undefined })
            }
          >
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fieldTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs font-bold text-gray-500 uppercase mb-2">Column Width</Label>
          <Select
            value={String(field.columnWidth || 12)}
            onValueChange={(value) => onUpdate({ ...field, columnWidth: Number(value) })}
          >
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12">Full Width (12/12)</SelectItem>
              <SelectItem value="6">Half Width (6/12)</SelectItem>
              <SelectItem value="4">One-Third (4/12)</SelectItem>
              <SelectItem value="3">One-Quarter (3/12)</SelectItem>
              <SelectItem value="8">Two-Thirds (8/12)</SelectItem>
              <SelectItem value="9">Three-Quarters (9/12)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <div className="flex items-center space-x-2">
            <Switch
              checked={field.required}
              onCheckedChange={(checked) => onUpdate({ ...field, required: checked })}
            />
            <Label className="text-sm font-bold">Required</Label>
          </div>
        </div>
      </div>

      {/* Placeholder */}
      {!needsOptions && field.type !== 'name' && (
        <div className="mb-4">
          <Label className="text-xs font-bold text-gray-500 uppercase mb-2">Placeholder</Label>
          <Input
            value={field.placeholder || ''}
            onChange={(e) => onUpdate({ ...field, placeholder: e.target.value })}
            placeholder="Placeholder text..."
            className="h-12 rounded-xl"
          />
        </div>
      )}

      {/* Name Field Configuration */}
      {field.type === 'name' && (
        <div className="mb-4 space-y-3 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
          <Label className="text-sm font-bold text-blue-900">Name Field Configuration</Label>

          <div>
            <Label className="text-xs font-bold text-gray-500 uppercase mb-2">Format</Label>
            <Select
              value={field.nameConfig?.format || 'single'}
              onValueChange={(value: 'single' | 'split') =>
                onUpdate({
                  ...field,
                  nameConfig: {
                    ...field.nameConfig,
                    format: value
                  }
                })
              }
            >
              <SelectTrigger className="h-12 rounded-xl bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single Field (Full Name)</SelectItem>
                <SelectItem value="split">Split Fields (First/Last Name)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-blue-600 mt-1.5">
              Single field shows one input, split fields show separate inputs for first/last name
            </p>
          </div>

          {field.nameConfig?.format === 'split' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-blue-100">
                  <Switch
                    checked={field.nameConfig?.includePrefix !== false}
                    onCheckedChange={(checked) =>
                      onUpdate({
                        ...field,
                        nameConfig: {
                          ...field.nameConfig,
                          format: 'split',
                          includePrefix: checked
                        }
                      })
                    }
                  />
                  <Label className="text-sm font-medium">Include Prefix</Label>
                </div>

                <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-blue-100">
                  <Switch
                    checked={field.nameConfig?.includeMiddle || false}
                    onCheckedChange={(checked) =>
                      onUpdate({
                        ...field,
                        nameConfig: {
                          ...field.nameConfig,
                          format: 'split',
                          includeMiddle: checked
                        }
                      })
                    }
                  />
                  <Label className="text-sm font-medium">Include Middle Name</Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-blue-100">
                  <Switch
                    checked={field.nameConfig?.requireFirst !== false}
                    onCheckedChange={(checked) =>
                      onUpdate({
                        ...field,
                        nameConfig: {
                          ...field.nameConfig,
                          format: 'split',
                          requireFirst: checked
                        }
                      })
                    }
                  />
                  <Label className="text-sm font-medium">Require First Name</Label>
                </div>

                <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-blue-100">
                  <Switch
                    checked={field.nameConfig?.requireLast !== false}
                    onCheckedChange={(checked) =>
                      onUpdate({
                        ...field,
                        nameConfig: {
                          ...field.nameConfig,
                          format: 'split',
                          requireLast: checked
                        }
                      })
                    }
                  />
                  <Label className="text-sm font-medium">Require Last Name</Label>
                </div>
              </div>

              {field.nameConfig?.includePrefix && (
                <div>
                  <Label className="text-xs font-bold text-gray-500 uppercase mb-2">Prefix Options</Label>
                  <Input
                    value={(field.nameConfig?.prefixOptions || ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.']).join(', ')}
                    onChange={(e) =>
                      onUpdate({
                        ...field,
                        nameConfig: {
                          ...field.nameConfig,
                          format: 'split',
                          prefixOptions: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        }
                      })
                    }
                    placeholder="Mr., Mrs., Ms., Dr., Prof."
                    className="h-12 rounded-xl"
                  />
                  <p className="text-xs text-blue-600 mt-1.5">
                    Comma-separated list of prefix options (e.g., Mr., Mrs., Ms., Dr.)
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Options for select/radio/checkbox */}
      {needsOptions && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs font-bold text-gray-500 uppercase">Options</Label>
            <Button variant="outline" size="sm" onClick={addOption} className="h-8 text-xs rounded-lg">
              <Plus className="h-3 w-3 mr-1" />
              Add Option
            </Button>
          </div>
          <div className="space-y-2">
            {(field.options || []).map((option, index) => (
              <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex-1 space-y-2">
                  <Input
                    value={option.label}
                    onChange={(e) => updateOption(index, { label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    placeholder="Option label"
                    className="h-10 text-sm font-medium"
                  />

                  {/* Pricing Configuration */}
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={option.pricing?.type || 'none'}
                      onValueChange={(value: 'setBase' | 'add' | 'multiply' | 'none') =>
                        updateOption(index, {
                          pricing: {
                            type: value,
                            amount: option.pricing?.amount || 0
                          }
                        })
                      }
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No pricing</SelectItem>
                        <SelectItem value="setBase">Set base price</SelectItem>
                        <SelectItem value="add">Add to price</SelectItem>
                        <SelectItem value="subtract">Subtract from price</SelectItem>
                        <SelectItem value="multiply">Multiply by %</SelectItem>
                      </SelectContent>
                    </Select>

                    {option.pricing?.type !== 'none' && (
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                          {option.pricing?.type === 'multiply' ? '%' : '$'}
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={option.pricing?.amount || 0}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            updateOption(index, {
                              pricing: {
                                type: option.pricing?.type || 'add',
                                amount: Math.max(0, value)
                              }
                            });
                          }}
                          onWheel={(e) => e.currentTarget.blur()}
                          placeholder="Amount"
                          className="h-9 text-sm pl-7"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteOption(index)}
                  className="h-10 w-10 hover:bg-red-50 hover:text-red-600 flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-xs text-blue-800 font-medium mb-1">💡 Pricing Types:</p>
            <ul className="text-xs text-blue-700 space-y-0.5 ml-4">
              <li><strong>Set base:</strong> Replaces total with this amount (use for size/tier selection)</li>
              <li><strong>Add:</strong> Adds this amount to current total (use for add-ons)</li>
              <li><strong>Subtract:</strong> Removes this amount from current total (use for discounts)</li>
              <li><strong>Multiply:</strong> Multiplies total BY percentage (e.g., 50 = 50% of price, 150 = 1.5x price)</li>
            </ul>
          </div>

          {/* Options Layout - only for checkbox/radio */}
          {(field.type === 'checkbox' || field.type === 'radio') && (
            <div className="mt-3">
              <Label className="text-xs font-bold text-gray-500 uppercase mb-2">Options Layout</Label>
              <Select
                value={String(field.optionsColumns || 1)}
                onValueChange={(value) => onUpdate({ ...field, optionsColumns: Number(value) })}
              >
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Single Column</SelectItem>
                  <SelectItem value="2">Two Columns</SelectItem>
                  <SelectItem value="3">Three Columns</SelectItem>
                  <SelectItem value="4">Four Columns</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1.5">Split options into multiple columns for compact display</p>
            </div>
          )}
        </div>
      )}

      {/* Captcha Configuration - Always visible for captcha fields */}
      {field.type === 'captcha' && (
        <div className="mb-4 space-y-3 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
          <Label className="text-sm font-bold text-blue-900">Captcha Configuration</Label>

          <div>
            <Label className="text-xs font-bold text-gray-500 uppercase mb-2">Provider</Label>
            <Select
              value={field.captchaConfig?.provider || 'recaptcha-v2'}
              onValueChange={(value: 'recaptcha-v2' | 'recaptcha-v3' | 'hcaptcha' | 'turnstile') =>
                onUpdate({
                  ...field,
                  captchaConfig: { provider: value, siteKey: field.captchaConfig?.siteKey }
                })
              }
            >
              <SelectTrigger className="h-12 rounded-xl bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recaptcha-v2">Google reCAPTCHA v2 (Checkbox)</SelectItem>
                <SelectItem value="recaptcha-v3">Google reCAPTCHA v3 (Invisible)</SelectItem>
                <SelectItem value="hcaptcha">hCaptcha</SelectItem>
                <SelectItem value="turnstile">Cloudflare Turnstile</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-bold text-gray-500 uppercase mb-2">Site Key</Label>
            <Input
              value={field.captchaConfig?.siteKey || ''}
              onChange={(e) =>
                onUpdate({
                  ...field,
                  captchaConfig: {
                    provider: field.captchaConfig?.provider || 'recaptcha-v2',
                    siteKey: e.target.value
                  }
                })
              }
              placeholder="Enter your site key"
              className="h-12 rounded-xl"
            />
            <p className="text-xs text-blue-600 mt-1.5">
              Get your site key from the provider's dashboard
            </p>
          </div>
        </div>
      )}

      {/* Payment Configuration - Always visible for payment fields */}
      {field.type === 'payment' && (
        <div className="mb-4 space-y-3 p-4 bg-green-50 rounded-xl border-2 border-green-200">
          <Label className="text-sm font-bold text-green-900">Payment Configuration</Label>

          <div>
            <Label className="text-xs font-bold text-gray-500 uppercase mb-2">Payment Provider</Label>
            <Select
              value={field.paymentConfig?.provider || 'stripe'}
              onValueChange={(value: 'stripe' | 'square' | 'paypal' | 'authorize-net') =>
                onUpdate({
                  ...field,
                  paymentConfig: {
                    ...field.paymentConfig,
                    provider: value,
                    mode: field.paymentConfig?.mode || 'redirect'
                  }
                })
              }
            >
              <SelectTrigger className="h-12 rounded-xl bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="square">Square</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="authorize-net">Authorize.Net</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-bold text-gray-500 uppercase mb-2">Payment Mode</Label>
            <Select
              value={field.paymentConfig?.mode || 'redirect'}
              onValueChange={(value: 'redirect' | 'embedded' | 'display-only') =>
                onUpdate({
                  ...field,
                  paymentConfig: {
                    ...field.paymentConfig,
                    provider: field.paymentConfig?.provider || 'stripe',
                    mode: value
                  }
                })
              }
            >
              <SelectTrigger className="h-12 rounded-xl bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="redirect">Redirect to payment page</SelectItem>
                <SelectItem value="embedded">Embedded payment form</SelectItem>
                <SelectItem value="display-only">Display total only</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-green-600 mt-1.5">
              {field.paymentConfig?.mode === 'redirect' && 'User will be redirected to complete payment'}
              {field.paymentConfig?.mode === 'embedded' && 'Payment form embedded in this page (requires API keys)'}
              {(!field.paymentConfig?.mode || field.paymentConfig?.mode === 'display-only') && 'Shows total, payment handled separately'}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={field.paymentConfig?.collectBillingAddress || false}
              onCheckedChange={(checked) =>
                onUpdate({
                  ...field,
                  paymentConfig: {
                    ...field.paymentConfig,
                    provider: field.paymentConfig?.provider || 'stripe',
                    mode: field.paymentConfig?.mode || 'redirect',
                    collectBillingAddress: checked
                  }
                })
              }
            />
            <Label className="text-sm font-medium">Collect billing address</Label>
          </div>
        </div>
      )}

      {/* Advanced Options Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-xs text-gray-500 mt-2"
      >
        {isExpanded ? 'Hide' : 'Show'} Advanced Options
      </Button>

      {/* Advanced Options */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
          {/* Pricing for number fields */}
          {field.type === 'number' && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={field.pricing?.type === 'perUnit'}
                  onCheckedChange={(checked) =>
                    onUpdate({
                      ...field,
                      pricing: checked ? { type: 'perUnit', pricePerUnit: 0 } : undefined
                    })
                  }
                />
                <Label className="text-sm font-medium">Enable per-unit pricing</Label>
              </div>

              {field.pricing?.type === 'perUnit' && (
                <div>
                  <Label className="text-xs font-bold text-gray-500 uppercase mb-2">Price Per Unit ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={field.pricing.pricePerUnit || 0}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      onUpdate({
                        ...field,
                        pricing: {
                          ...field.pricing!,
                          pricePerUnit: Math.max(0, value)
                        }
                      });
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="0.00"
                    className="h-10 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Example: If set to $5, customer entering "10" will add $50 to total
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Legacy price modifier for other field types */}
          {!needsOptions && field.type !== 'number' && (
            <div>
              <Label className="text-xs font-bold text-gray-500 uppercase mb-2">Price Modifier ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={field.priceModifier || 0}
                onChange={(e) => onUpdate({ ...field, priceModifier: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="h-10 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">Amount to add to base price when this field is filled</p>
            </div>
          )}

          {/* Validation */}
          {field.type === 'number' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold text-gray-500 uppercase mb-2">Min Value</Label>
                <Input
                  type="number"
                  value={field.validation?.min || ''}
                  onChange={(e) =>
                    onUpdate({
                      ...field,
                      validation: { ...field.validation, min: parseInt(e.target.value) || undefined },
                    })
                  }
                  className="h-10 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-gray-500 uppercase mb-2">Max Value</Label>
                <Input
                  type="number"
                  value={field.validation?.max || ''}
                  onChange={(e) =>
                    onUpdate({
                      ...field,
                      validation: { ...field.validation, max: parseInt(e.target.value) || undefined },
                    })
                  }
                  className="h-10 text-sm"
                />
              </div>
            </div>
          )}

          {/* Custom Validation Message */}
          <div>
            <Label className="text-xs font-bold text-gray-500 uppercase mb-2">Validation Message</Label>
            <Input
              value={field.validation?.message || ''}
              onChange={(e) =>
                onUpdate({
                  ...field,
                  validation: { ...field.validation, message: e.target.value },
                })
              }
              placeholder="Custom error message"
              className="h-10 text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}
