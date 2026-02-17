'use client';

import { useState } from 'react';
import { formTemplates, FormTemplate } from './form-templates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Sparkles, Building2, Home, Wrench } from 'lucide-react';

interface TemplateSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (template: FormTemplate) => void;
}

export function TemplateSelector({ open, onClose, onSelect }: TemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'residential' | 'commercial' | 'specialty'>('all');

  const filteredTemplates = selectedCategory === 'all'
    ? formTemplates
    : formTemplates.filter(t => t.category === selectedCategory);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'residential':
        return <Home className="h-4 w-4" />;
      case 'commercial':
        return <Building2 className="h-4 w-4" />;
      case 'specialty':
        return <Wrench className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'residential':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'commercial':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'specialty':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleSelect = (template: FormTemplate) => {
    onSelect(template);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden rounded-3xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-yellow-500 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-black" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black">Form Templates</DialogTitle>
              <p className="text-sm text-gray-500 mt-1">Start with a pre-built form and customize it</p>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-6">
          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={(val: any) => setSelectedCategory(val)} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="all">All Templates</TabsTrigger>
              <TabsTrigger value="residential">
                <Home className="h-4 w-4 mr-2" />
                Residential
              </TabsTrigger>
              <TabsTrigger value="commercial">
                <Building2 className="h-4 w-4 mr-2" />
                Commercial
              </TabsTrigger>
              <TabsTrigger value="specialty">
                <Wrench className="h-4 w-4 mr-2" />
                Specialty
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedCategory} className="max-h-[50vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                {filteredTemplates.map((template) => (
                  <Card
                    key={template.id}
                    className="border-2 hover:border-yellow-500 hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => handleSelect(template)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-bold group-hover:text-yellow-600 transition-colors">
                            {template.name}
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {template.description}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className={`ml-2 ${getCategoryColor(template.category)}`}>
                          <span className="flex items-center gap-1">
                            {getCategoryIcon(template.category)}
                            {template.category}
                          </span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          <span className="font-bold text-gray-700">{template.schema.fields.length}</span> fields
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="group-hover:bg-yellow-500 group-hover:text-black transition-all"
                        >
                          Use Template
                        </Button>
                      </div>

                      {/* Field Preview */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-400 mb-2">Includes:</p>
                        <div className="flex flex-wrap gap-1">
                          {template.schema.fields.slice(0, 4).map((field, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {field.label}
                            </Badge>
                          ))}
                          {template.schema.fields.length > 4 && (
                            <Badge variant="secondary" className="text-xs">
                              +{template.schema.fields.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredTemplates.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-gray-400 font-medium">No templates in this category</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
