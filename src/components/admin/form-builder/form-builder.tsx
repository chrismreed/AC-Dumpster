'use client';

import { useState } from 'react';
import { FormField, FormSchema, FormFieldType, PricingRule } from './types';
import { FormFieldEditor } from './form-field-editor';
import { ConditionalLogicEditor } from './conditional-logic-editor';
import { PricingRulesEditor } from './pricing-rules-editor';
import { TemplateSelector } from './template-selector';
import { FormTemplate } from './form-templates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Save, Eye, ArrowUp, ArrowDown, Trash2, Sparkles } from 'lucide-react';
import { nanoid } from 'nanoid';

interface FormBuilderProps {
  initialSchema?: FormSchema;
  initialPricingRules?: PricingRule[];
  onSave: (schema: FormSchema, pricingRules: PricingRule[]) => void;
  onPreview?: () => void;
}

export function FormBuilder({ initialSchema, initialPricingRules = [], onSave, onPreview }: FormBuilderProps) {
  const [fields, setFields] = useState<FormField[]>(initialSchema?.fields || []);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>(initialPricingRules);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'form' | 'pricing'>('form');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [displayMode, setDisplayMode] = useState<'standard' | 'conversational'>(initialSchema?.displayMode || 'standard');

  const addField = (type: FormFieldType = 'text') => {
    const newField: FormField = {
      id: nanoid(),
      type,
      label: 'New Field',
      required: false,
      placeholder: '',
    };

    // Set default configuration for name fields
    if (type === 'name') {
      newField.label = 'Full Name';
      newField.nameConfig = {
        format: 'single',
        includeMiddle: false,
        includePrefix: false,
        requireFirst: true,
        requireLast: true,
        prefixOptions: ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.']
      };
    }

    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
  };

  const updateField = (id: string, updates: FormField) => {
    setFields(fields.map((field) => (field.id === id ? updates : field)));
  };

  const deleteField = (id: string) => {
    setFields(fields.filter((field) => field.id !== id));
    if (selectedFieldId === id) {
      setSelectedFieldId(null);
    }
  };

  const moveField = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= fields.length) return;

    const newFields = [...fields];
    const [movedField] = newFields.splice(fromIndex, 1);
    newFields.splice(toIndex, 0, movedField);
    setFields(newFields);
  };

  const handleSave = () => {
    const schema: FormSchema = {
      fields,
      version: 1,
      displayMode,
    };
    onSave(schema, pricingRules);
  };

  const handleTemplateSelect = (template: FormTemplate) => {
    setFields(template.schema.fields);
    setPricingRules(template.pricingRules || []);
    setSelectedFieldId(null);
    setShowTemplateSelector(false);
  };

  const selectedField = fields.find(f => f.id === selectedFieldId);

  // Render field preview in left column
  const renderFieldPreview = (field: FormField, index: number) => {
    const isSelected = selectedFieldId === field.id;

    return (
      <div
        key={field.id}
        onClick={() => setSelectedFieldId(field.id)}
        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
          isSelected
            ? 'border-yellow-500 bg-yellow-50/50 shadow-md'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <Label className="text-sm font-bold">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => { e.stopPropagation(); moveField(index, 'up'); }}
              disabled={index === 0}
            >
              <ArrowUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => { e.stopPropagation(); moveField(index, 'down'); }}
              disabled={index === fields.length - 1}
            >
              <ArrowDown className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-red-50 hover:text-red-600"
              onClick={(e) => { e.stopPropagation(); deleteField(field.id); }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Field Preview */}
        {(field.type === 'text' || field.type === 'email' || field.type === 'phone' || field.type === 'number' || field.type === 'date') && (
          <Input
            placeholder={field.placeholder}
            disabled
            className="h-12 rounded-xl bg-gray-50"
            type={field.type}
          />
        )}

        {field.type === 'textarea' && (
          <Textarea
            placeholder={field.placeholder}
            disabled
            className="rounded-xl bg-gray-50 min-h-[100px]"
          />
        )}

        {field.type === 'select' && (
          <Select disabled>
            <SelectTrigger className="h-12 rounded-xl bg-gray-50">
              <SelectValue placeholder="Select an option..." />
            </SelectTrigger>
            <SelectContent>
              {field.options?.filter(opt => opt.value).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {field.type === 'radio' && (
          <RadioGroup disabled>
            {field.options?.filter(opt => opt.value).map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`preview-${field.id}-${option.value}`} />
                <Label htmlFor={`preview-${field.id}-${option.value}`} className="font-normal">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {field.type === 'checkbox' && (
          <div className="space-y-2">
            {field.options?.filter(opt => opt.value).map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox id={`preview-${field.id}-${option.value}`} disabled />
                <Label htmlFor={`preview-${field.id}-${option.value}`} className="font-normal">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        )}

        {field.type === 'address' && (
          <div className="space-y-2">
            <Input
              placeholder="Street Address"
              disabled
              className="h-10 rounded-xl bg-gray-50"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="City"
                disabled
                className="h-10 rounded-xl bg-gray-50"
              />
              <Input
                placeholder="State"
                disabled
                className="h-10 rounded-xl bg-gray-50"
              />
            </div>
            <Input
              placeholder="ZIP Code"
              disabled
              className="h-10 rounded-xl bg-gray-50"
            />
          </div>
        )}

        {field.type === 'agreement' && (
          <div className="flex items-start space-x-2">
            <Checkbox id={`preview-${field.id}-agreement`} disabled />
            <Label htmlFor={`preview-${field.id}-agreement`} className="font-normal text-xs">
              {field.placeholder || 'I agree to the terms and conditions'}
            </Label>
          </div>
        )}

        {field.type === 'captcha' && (
          <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50 text-center">
            <p className="text-xs font-bold text-blue-900">☑️ Captcha Widget</p>
            <p className="text-[10px] text-blue-600 mt-1">
              {field.captchaConfig?.provider || 'recaptcha-v2'}
            </p>
          </div>
        )}

        {field.type === 'payment' && (
          <div className="p-4 border-2 border-green-200 rounded-lg bg-green-50 text-center">
            <p className="text-xs font-bold text-green-900">💳 Payment</p>
            <p className="text-[10px] text-green-600 mt-1">
              {field.paymentConfig?.provider || 'stripe'} • {field.paymentConfig?.mode || 'redirect'}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-none shadow-lg rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl font-black">Form Builder</CardTitle>
              <CardDescription className="text-sm font-medium mt-1">
                Design a custom form for this service
              </CardDescription>

              {/* Simplified - no tabs needed anymore */}
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                <div className="px-4 py-2 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                  <span className="text-sm font-bold text-yellow-900">✨ Form Builder</span>
                </div>

                {/* Display Mode Selector */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 border-2 border-purple-200 rounded-xl">
                  <span className="text-xs font-bold text-purple-700">Display:</span>
                  <Select value={displayMode} onValueChange={(value: 'standard' | 'conversational') => setDisplayMode(value)}>
                    <SelectTrigger className="h-7 w-[140px] border-0 bg-white rounded-lg text-xs font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard Form</SelectItem>
                      <SelectItem value="conversational">Conversational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="text-xs text-gray-500 italic">
                  Configure pricing directly on field options below
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowTemplateSelector(true)}
                className="rounded-xl border-yellow-500 text-yellow-700 hover:bg-yellow-50"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Use Template
              </Button>
              {onPreview && (
                <Button variant="outline" onClick={onPreview} className="rounded-xl">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              )}
              <Button onClick={handleSave} className="bg-yellow-500 hover:bg-yellow-600 text-black rounded-xl">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Form Builder */}
      {true && (
        <div className="grid grid-cols-2 gap-6">
        {/* Left Column - Form Preview */}
        <div className="space-y-4">
          <Card className="border-none shadow-lg rounded-2xl sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-gray-700">Form Preview</CardTitle>
              <CardDescription className="text-xs">Click a field to edit it</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[calc(100vh-250px)] overflow-y-auto space-y-3">
              {fields.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-gray-400 font-medium text-sm">No fields yet. Add a field to get started.</p>
                </div>
              ) : (
                fields.map((field, index) => renderFieldPreview(field, index))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Field Editor */}
        <div className="space-y-4">
          {/* Pricing Info Banner */}
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">💰</div>
                <div>
                  <h3 className="text-sm font-bold text-blue-900 mb-1">Easy Pricing Configuration</h3>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Set prices directly on your field options! For select/radio/checkbox fields, click the dropdown
                    under each option to choose: <strong>Set base price</strong> (for size/tier), <strong>Add to price</strong> (for add-ons),
                    or <strong>Multiply</strong> (for percentages). For number fields, enable per-unit pricing in Advanced Options.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Field Palette */}
          <Card className="border-none shadow-lg rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-gray-700">Add Field</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addField('text')}
                  className="rounded-lg text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Text
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addField('name')}
                  className="rounded-lg text-xs border-blue-200 bg-blue-50/50 hover:bg-blue-100/50"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Name
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addField('email')}
                  className="rounded-lg text-xs border-blue-200 bg-blue-50/50 hover:bg-blue-100/50"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Email
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addField('phone')}
                  className="rounded-lg text-xs border-blue-200 bg-blue-50/50 hover:bg-blue-100/50"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Phone
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addField('textarea')}
                  className="rounded-lg text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Text Area
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addField('number')}
                  className="rounded-lg text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Number
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addField('date')}
                  className="rounded-lg text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Date
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addField('select')}
                  className="rounded-lg text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Dropdown
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addField('radio')}
                  className="rounded-lg text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Radio
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addField('checkbox')}
                  className="rounded-lg text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Checkbox
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addField('address')}
                  className="rounded-lg text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Address
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addField('agreement')}
                  className="rounded-lg text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Agreement
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addField('captcha')}
                  className="rounded-lg text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Captcha
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addField('payment')}
                  className="rounded-lg text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Payment
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Field Editor */}
          {selectedField ? (
            <div className="space-y-4">
              <FormFieldEditor
                field={selectedField}
                onUpdate={(updatedField) => updateField(selectedField.id, updatedField)}
                onDelete={() => deleteField(selectedField.id)}
              />
              <ConditionalLogicEditor
                field={selectedField}
                allFields={fields}
                onUpdate={(updatedField) => updateField(selectedField.id, updatedField)}
              />
            </div>
          ) : (
            <Card className="border-2 border-dashed border-gray-300 rounded-2xl">
              <CardContent className="py-12 text-center">
                <p className="text-gray-400 font-medium text-sm">
                  Select a field from the preview to edit it
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      )}

      {/* Pricing Rules Tab */}
      {activeTab === 'pricing' && (
        <PricingRulesEditor
          rules={pricingRules}
          fields={fields}
          onUpdate={setPricingRules}
        />
      )}

      {/* Template Selector Dialog */}
      <TemplateSelector
        open={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelect={handleTemplateSelect}
      />
    </div>
  );
}
