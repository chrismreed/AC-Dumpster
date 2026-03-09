'use client';

import { useState } from 'react';
import { PricingRule, FormField } from './types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Calculator } from 'lucide-react';
import { nanoid } from 'nanoid';

interface PricingRulesEditorProps {
  rules: PricingRule[];
  fields: FormField[];
  onUpdate: (rules: PricingRule[]) => void;
}

export function PricingRulesEditor({ rules, fields, onUpdate }: PricingRulesEditorProps) {
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);

  const addRule = (type: 'fieldValue' | 'calculation' | 'conditional') => {
    const newRule: PricingRule = {
      id: nanoid(),
      name: `New ${type} rule`,
      type,
      config: type === 'conditional' ? { conditions: [] } : {}
    };
    onUpdate([...rules, newRule]);
    setExpandedRuleId(newRule.id);
  };

  const updateRule = (id: string, updates: Partial<PricingRule>) => {
    onUpdate(rules.map(rule => rule.id === id ? { ...rule, ...updates } : rule));
  };

  const deleteRule = (id: string) => {
    onUpdate(rules.filter(rule => rule.id !== id));
    if (expandedRuleId === id) {
      setExpandedRuleId(null);
    }
  };

  const addCondition = (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule || rule.type !== 'conditional') return;

    const newCondition = {
      fieldId: fields[0]?.id || '',
      operator: 'equals' as const,
      value: '',
      priceModifier: 0
    };

    updateRule(ruleId, {
      config: {
        ...rule.config,
        conditions: [...(rule.config.conditions || []), newCondition]
      }
    });
  };

  const updateCondition = (ruleId: string, conditionIndex: number, updates: any) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule || rule.type !== 'conditional' || !rule.config.conditions) return;

    const newConditions = [...rule.config.conditions];
    newConditions[conditionIndex] = { ...newConditions[conditionIndex], ...updates };

    updateRule(ruleId, {
      config: {
        ...rule.config,
        conditions: newConditions
      }
    });
  };

  const deleteCondition = (ruleId: string, conditionIndex: number) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule || rule.type !== 'conditional' || !rule.config.conditions) return;

    updateRule(ruleId, {
      config: {
        ...rule.config,
        conditions: rule.config.conditions.filter((_, i) => i !== conditionIndex)
      }
    });
  };

  const getFieldOptions = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    return field?.options || [];
  };

  return (
    <div className="space-y-4">
      <Card className="border-none shadow-lg rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-gray-700">Pricing Rules</CardTitle>
          <p className="text-xs text-gray-500 mt-1">
            Define complex pricing logic based on form responses
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => addRule('conditional')}
              className="rounded-lg text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Conditional Pricing
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addRule('calculation')}
              className="rounded-lg text-xs"
            >
              <Calculator className="h-3 w-3 mr-1" />
              Formula
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rules List */}
      {rules.map((rule) => {
        const isExpanded = expandedRuleId === rule.id;

        return (
          <Card key={rule.id} className="border-none shadow-lg rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Input
                    value={rule.name}
                    onChange={(e) => updateRule(rule.id, { name: e.target.value })}
                    className="font-bold h-10 text-sm"
                    placeholder="Rule name..."
                  />
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedRuleId(isExpanded ? null : rule.id)}
                    className="text-xs"
                  >
                    {isExpanded ? 'Collapse' : 'Expand'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteRule(rule.id)}
                    className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="space-y-4">
                {/* Conditional Pricing */}
                {rule.type === 'conditional' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-gray-500 uppercase">Conditions</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addCondition(rule.id)}
                        className="h-8 text-xs rounded-lg"
                        disabled={fields.length === 0}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Condition
                      </Button>
                    </div>

                    {fields.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">Add form fields first</p>
                    ) : (
                      <div className="space-y-3">
                        {(rule.config.conditions || []).map((condition, index) => {
                          const targetField = fields.find(f => f.id === condition.fieldId);
                          const fieldOptions = getFieldOptions(condition.fieldId);
                          const isOptionField = targetField && ['select', 'radio', 'checkbox'].includes(targetField.type);

                          return (
                            <div key={index} className="p-3 bg-gray-50 rounded-xl space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                {/* Field Selector */}
                                <Select
                                  value={condition.fieldId}
                                  onValueChange={(val) => updateCondition(rule.id, index, { fieldId: val, value: '' })}
                                >
                                  <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder="Select field..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {fields.map((f) => (
                                      <SelectItem key={f.id} value={f.id}>
                                        {f.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                {/* Operator */}
                                <Select
                                  value={condition.operator}
                                  onValueChange={(val: any) => updateCondition(rule.id, index, { operator: val })}
                                >
                                  <SelectTrigger className="h-9 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="equals">equals</SelectItem>
                                    <SelectItem value="notEquals">not equals</SelectItem>
                                    {targetField?.type === 'number' && (
                                      <>
                                        <SelectItem value="greaterThan">greater than</SelectItem>
                                        <SelectItem value="lessThan">less than</SelectItem>
                                      </>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Value */}
                              {isOptionField ? (
                                <Select
                                  value={typeof condition.value === 'string' ? condition.value : ''}
                                  onValueChange={(val) => updateCondition(rule.id, index, { value: val })}
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
                                  value={typeof condition.value === 'string' || typeof condition.value === 'number' ? condition.value : ''}
                                  onChange={(e) => updateCondition(rule.id, index, { value: e.target.value })}
                                  placeholder="Enter value..."
                                  className="h-9 text-xs"
                                />
                              )}

                              {/* Price Modifier */}
                              <div>
                                <Label className="text-xs text-gray-600 mb-1">Price Change ($)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={condition.priceModifier || 0}
                                  onChange={(e) => updateCondition(rule.id, index, { priceModifier: parseFloat(e.target.value) || 0 })}
                                  placeholder="0.00"
                                  className="h-9 text-xs"
                                />
                              </div>

                              {/* Delete */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteCondition(rule.id, index)}
                                className="w-full h-8 text-xs hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Remove
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Formula Calculation */}
                {rule.type === 'calculation' && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-bold text-gray-500 uppercase mb-2">Formula</Label>
                      <Textarea
                        value={rule.config.formula || ''}
                        onChange={(e) => updateRule(rule.id, { config: { ...rule.config, formula: e.target.value } })}
                        placeholder="Example: basePrice + (field_volume * 10) + (field_distance * 2)"
                        className="text-xs font-mono min-h-[100px]"
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        Use field IDs as variables. Example: basePrice + field_abc123 * 10
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}

      {rules.length === 0 && (
        <Card className="border-2 border-dashed border-gray-300 rounded-2xl">
          <CardContent className="py-8 text-center">
            <p className="text-gray-400 font-medium text-sm">No pricing rules yet. Add one to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
