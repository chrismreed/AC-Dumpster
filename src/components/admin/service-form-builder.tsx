'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Trash2,
  GripVertical,
  Type,
  Hash,
  Calendar,
  CheckSquare,
  List,
  FileText,
  Mail,
  Phone,
  MapPin,
  DollarSign
} from 'lucide-react';

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

interface ServiceFormBuilderProps {
  initialSchema?: FormSchema;
  onSave: (schema: FormSchema) => void;
  onCancel: () => void;
}

const FIELD_TYPES: { type: FieldType; label: string; icon: any }[] = [
  { type: 'text', label: 'Text', icon: Type },
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'phone', label: 'Phone', icon: Phone },
  { type: 'number', label: 'Number', icon: Hash },
  { type: 'date', label: 'Date', icon: Calendar },
  { type: 'textarea', label: 'Long Text', icon: FileText },
  { type: 'select', label: 'Dropdown', icon: List },
  { type: 'checkbox', label: 'Checkboxes', icon: CheckSquare },
  { type: 'radio', label: 'Multiple Choice', icon: CheckSquare },
  { type: 'address', label: 'Address', icon: MapPin },
];

export default function ServiceFormBuilder({ initialSchema, onSave, onCancel }: ServiceFormBuilderProps) {
  const [fields, setFields] = useState<FormField[]>(initialSchema?.fields || []);
  const [editingField, setEditingField] = useState<string | null>(null);

  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type,
      label: `New ${type} field`,
      required: false,
      pricingImpact: { enabled: false }
    };

    if (type === 'select' || type === 'radio' || type === 'checkbox') {
      newField.options = ['Option 1', 'Option 2'];
    }

    setFields([...fields, newField]);
    setEditingField(newField.id);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const deleteField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
    if (editingField === id) setEditingField(null);
  };

  const moveField = (id: string, direction: 'up' | 'down') => {
    const index = fields.findIndex(f => f.id === id);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;

    const newFields = [...fields];
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    setFields(newFields);
  };

  const handleSave = () => {
    onSave({ fields });
  };

  return (
    <div className="space-y-6">
      {/* Field Type Selector */}
      <Card className="border-none shadow-xl rounded-3xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-black text-gray-900">Add Fields</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {FIELD_TYPES.map(({ type, label, icon: Icon }) => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                onClick={() => addField(type)}
                className="flex flex-col h-auto py-3 gap-2 rounded-2xl border-gray-200 hover:border-yellow-500 hover:bg-yellow-50 transition-all"
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-bold">{label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Form Fields */}
      <div className="space-y-4">
        {fields.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-200 rounded-3xl">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 font-bold">No fields yet. Add some fields above to get started.</p>
            </CardContent>
          </Card>
        ) : (
          fields.map((field, index) => (
            <Card key={field.id} className="border-none shadow-lg rounded-3xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Drag Handle */}
                  <div className="flex flex-col gap-1 pt-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 cursor-move"
                      disabled={index === 0}
                      onClick={() => moveField(field.id, 'up')}
                    >
                      <GripVertical className="h-4 w-4 text-gray-400" />
                    </Button>
                  </div>

                  {/* Field Content */}
                  <div className="flex-1 space-y-4">
                    {editingField === field.id ? (
                      <EditFieldForm
                        field={field}
                        onUpdate={(updates) => updateField(field.id, updates)}
                        onClose={() => setEditingField(null)}
                      />
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-mono text-xs">
                            {field.type}
                          </Badge>
                          <span className="font-black text-gray-900">{field.label}</span>
                          {field.required && (
                            <Badge variant="destructive" className="text-xs">Required</Badge>
                          )}
                          {field.pricingImpact?.enabled && (
                            <Badge className="bg-green-100 text-green-700 text-xs">
                              <DollarSign className="h-3 w-3 mr-1" />
                              Affects Price
                            </Badge>
                          )}
                        </div>
                        {field.placeholder && (
                          <p className="text-sm text-gray-500">Placeholder: {field.placeholder}</p>
                        )}
                        {field.options && (
                          <div className="flex flex-wrap gap-2">
                            {field.options.map((opt, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {opt}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {editingField !== field.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingField(field.id)}
                        className="h-9 w-9 rounded-xl hover:bg-yellow-50 hover:text-yellow-600"
                      >
                        <Type className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteField(field.id)}
                      className="h-9 w-9 rounded-xl hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Save/Cancel Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          variant="outline"
          onClick={onCancel}
          className="rounded-2xl font-bold"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          className="rounded-2xl font-black bg-yellow-500 hover:bg-yellow-600 text-black"
        >
          Save Form
        </Button>
      </div>
    </div>
  );
}

function EditFieldForm({
  field,
  onUpdate,
  onClose
}: {
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
  onClose: () => void;
}) {
  const [localField, setLocalField] = useState(field);

  const handleSave = () => {
    onUpdate(localField);
    onClose();
  };

  const addOption = () => {
    const newOptions = [...(localField.options || []), `Option ${(localField.options?.length || 0) + 1}`];
    setLocalField({ ...localField, options: newOptions });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...(localField.options || [])];
    newOptions[index] = value;
    setLocalField({ ...localField, options: newOptions });
  };

  const deleteOption = (index: number) => {
    const newOptions = localField.options?.filter((_, i) => i !== index) || [];
    setLocalField({ ...localField, options: newOptions });
  };

  const needsOptions = ['select', 'radio', 'checkbox'].includes(field.type);

  return (
    <div className="space-y-4 bg-gray-50 p-4 rounded-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2">
          <Label className="text-xs font-black uppercase text-gray-500">Field Label</Label>
          <Input
            value={localField.label}
            onChange={(e) => setLocalField({ ...localField, label: e.target.value })}
            className="rounded-xl font-bold"
          />
        </div>

        {!needsOptions && (
          <div className="col-span-2 space-y-2">
            <Label className="text-xs font-black uppercase text-gray-500">Placeholder</Label>
            <Input
              value={localField.placeholder || ''}
              onChange={(e) => setLocalField({ ...localField, placeholder: e.target.value })}
              className="rounded-xl"
            />
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Switch
            checked={localField.required}
            onCheckedChange={(required) => setLocalField({ ...localField, required })}
          />
          <Label className="text-sm font-bold">Required field</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={localField.pricingImpact?.enabled || false}
            onCheckedChange={(enabled) =>
              setLocalField({
                ...localField,
                pricingImpact: { ...localField.pricingImpact, enabled }
              })
            }
          />
          <Label className="text-sm font-bold">Affects pricing</Label>
        </div>
      </div>

      {/* Options for select/radio/checkbox */}
      {needsOptions && (
        <div className="space-y-2">
          <Label className="text-xs font-black uppercase text-gray-500">Options</Label>
          <div className="space-y-2">
            {localField.options?.map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className="rounded-xl"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteOption(index)}
                  className="h-10 w-10 rounded-xl hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={addOption}
              className="w-full rounded-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Option
            </Button>
          </div>
        </div>
      )}

      {/* Pricing Impact Configuration */}
      {localField.pricingImpact?.enabled && (
        <div className="space-y-3 bg-green-50 p-4 rounded-xl border border-green-200">
          <Label className="text-xs font-black uppercase text-green-700">Pricing Rules</Label>

          {field.type === 'number' && (
            <div className="space-y-2">
              <Label className="text-sm">Multiply value by:</Label>
              <Input
                type="number"
                step="0.01"
                value={localField.pricingImpact?.multiplier || ''}
                onChange={(e) => setLocalField({
                  ...localField,
                  pricingImpact: {
                    ...localField.pricingImpact,
                    enabled: true,
                    multiplier: parseFloat(e.target.value) || 0
                  }
                })}
                className="rounded-xl"
                placeholder="e.g., 10.00"
              />
            </div>
          )}

          {needsOptions && localField.options && (
            <div className="space-y-2">
              <Label className="text-sm">Price per option:</Label>
              {localField.options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm flex-1 font-bold">{option}</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={localField.pricingImpact?.optionPrices?.[option] || ''}
                    onChange={(e) => {
                      const newPrices = { ...localField.pricingImpact?.optionPrices };
                      newPrices[option] = parseFloat(e.target.value) || 0;
                      setLocalField({
                        ...localField,
                        pricingImpact: {
                          ...localField.pricingImpact,
                          enabled: true,
                          optionPrices: newPrices
                        }
                      });
                    }}
                    className="rounded-xl w-32"
                    placeholder="0.00"
                  />
                </div>
              ))}
            </div>
          )}

          {!needsOptions && field.type !== 'number' && (
            <div className="space-y-2">
              <Label className="text-sm">Fixed price modifier:</Label>
              <Input
                type="number"
                step="0.01"
                value={localField.pricingImpact?.baseModifier || ''}
                onChange={(e) => setLocalField({
                  ...localField,
                  pricingImpact: {
                    ...localField.pricingImpact,
                    enabled: true,
                    baseModifier: parseFloat(e.target.value) || 0
                  }
                })}
                className="rounded-xl"
                placeholder="e.g., 25.00"
              />
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} size="sm" className="rounded-xl">
          Cancel
        </Button>
        <Button onClick={handleSave} size="sm" className="rounded-xl bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
          Save Changes
        </Button>
      </div>
    </div>
  );
}
