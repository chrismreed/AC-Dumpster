'use client';

import { FormField, ConditionalRule } from './types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface ConditionalLogicEditorProps {
  field: FormField;
  allFields: FormField[];
  onUpdate: (updates: FormField) => void;
}

export function ConditionalLogicEditor({ field, allFields, onUpdate }: ConditionalLogicEditorProps) {
  // Filter out current field from available fields
  const availableFields = allFields.filter(f => f.id !== field.id);

  const hasConditionalLogic = !!field.conditionalLogic;

  const enableConditionalLogic = () => {
    onUpdate({
      ...field,
      conditionalLogic: {
        action: 'show',
        conditions: [],
        matchType: 'all'
      }
    });
  };

  const disableConditionalLogic = () => {
    const { conditionalLogic, ...rest } = field;
    onUpdate(rest as FormField);
  };

  const updateAction = (action: 'show' | 'hide' | 'require' | 'disable') => {
    if (!field.conditionalLogic) return;
    onUpdate({
      ...field,
      conditionalLogic: {
        ...field.conditionalLogic,
        action
      }
    });
  };

  const updateMatchType = (matchType: 'all' | 'any') => {
    if (!field.conditionalLogic) return;
    onUpdate({
      ...field,
      conditionalLogic: {
        ...field.conditionalLogic,
        matchType
      }
    });
  };

  const addCondition = () => {
    if (!field.conditionalLogic) return;
    const newCondition: ConditionalRule = {
      fieldId: availableFields[0]?.id || '',
      operator: 'equals',
      value: ''
    };
    onUpdate({
      ...field,
      conditionalLogic: {
        ...field.conditionalLogic,
        conditions: [...field.conditionalLogic.conditions, newCondition]
      }
    });
  };

  const updateCondition = (index: number, updates: Partial<ConditionalRule>) => {
    if (!field.conditionalLogic) return;
    const newConditions = [...field.conditionalLogic.conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    onUpdate({
      ...field,
      conditionalLogic: {
        ...field.conditionalLogic,
        conditions: newConditions
      }
    });
  };

  const deleteCondition = (index: number) => {
    if (!field.conditionalLogic) return;
    onUpdate({
      ...field,
      conditionalLogic: {
        ...field.conditionalLogic,
        conditions: field.conditionalLogic.conditions.filter((_, i) => i !== index)
      }
    });
  };

  const getFieldOptions = (fieldId: string) => {
    const targetField = allFields.find(f => f.id === fieldId);
    return targetField?.options || [];
  };

  if (!hasConditionalLogic) {
    return (
      <Card className="border-none shadow-lg rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-gray-700">Conditional Logic</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-500 mb-4">
            Show, hide, or require this field based on other field values
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={enableConditionalLogic}
            className="rounded-xl"
          >
            <Plus className="h-3 w-3 mr-2" />
            Add Conditional Logic
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-lg rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-gray-700">Conditional Logic</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={disableConditionalLogic}
            className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            Remove
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action Type */}
        <div>
          <Label className="text-xs font-bold text-gray-500 uppercase mb-2">Action</Label>
          <Select value={field.conditionalLogic.action} onValueChange={updateAction}>
            <SelectTrigger className="h-10 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="show">Show this field</SelectItem>
              <SelectItem value="hide">Hide this field</SelectItem>
              <SelectItem value="require">Make this field required</SelectItem>
              <SelectItem value="disable">Disable this field</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Match Type */}
        {field.conditionalLogic.conditions.length > 1 && (
          <div>
            <Label className="text-xs font-bold text-gray-500 uppercase mb-2">Match Type</Label>
            <RadioGroup value={field.conditionalLogic.matchType} onValueChange={(val: 'all' | 'any') => updateMatchType(val)}>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="match-all" />
                  <Label htmlFor="match-all" className="text-sm font-normal">Match ALL conditions</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="any" id="match-any" />
                  <Label htmlFor="match-any" className="text-sm font-normal">Match ANY condition</Label>
                </div>
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Conditions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs font-bold text-gray-500 uppercase">Conditions</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={addCondition}
              className="h-8 text-xs rounded-lg"
              disabled={availableFields.length === 0}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Condition
            </Button>
          </div>

          {availableFields.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Add more fields to create conditions</p>
          ) : (
            <div className="space-y-3">
              {field.conditionalLogic.conditions.map((condition, index) => {
                const targetField = allFields.find(f => f.id === condition.fieldId);
                const fieldOptions = getFieldOptions(condition.fieldId);
                const isOptionField = targetField && ['select', 'radio', 'checkbox'].includes(targetField.type);

                return (
                  <div key={index} className="p-3 bg-gray-50 rounded-xl space-y-2">
                    {/* Field Selector */}
                    <Select
                      value={condition.fieldId}
                      onValueChange={(val) => updateCondition(index, { fieldId: val, value: '' })}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Select field..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFields.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Operator Selector */}
                    <Select
                      value={condition.operator}
                      onValueChange={(val: any) => updateCondition(index, { operator: val })}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">equals</SelectItem>
                        <SelectItem value="notEquals">does not equal</SelectItem>
                        {!isOptionField && <SelectItem value="contains">contains</SelectItem>}
                        {targetField?.type === 'number' && (
                          <>
                            <SelectItem value="greaterThan">greater than</SelectItem>
                            <SelectItem value="lessThan">less than</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>

                    {/* Value Input */}
                    {isOptionField ? (
                      <Select
                        value={typeof condition.value === 'string' ? condition.value : ''}
                        onValueChange={(val) => updateCondition(index, { value: val })}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select value..." />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={targetField?.type === 'number' ? 'number' : 'text'}
                        value={typeof condition.value === 'string' ? condition.value : ''}
                        onChange={(e) => updateCondition(index, { value: e.target.value })}
                        placeholder="Enter value..."
                        className="h-9 text-xs"
                      />
                    )}

                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCondition(index)}
                      className="w-full h-8 text-xs hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remove Condition
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
