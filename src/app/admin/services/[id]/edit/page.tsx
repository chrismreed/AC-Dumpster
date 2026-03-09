'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { FormBuilder } from '@/components/admin/form-builder/form-builder';
import { DynamicFormRenderer } from '@/components/admin/form-builder/dynamic-form-renderer';
import { FormSchema, PricingRule } from '@/components/admin/form-builder/types';
import { ArrowLeft, Save, Loader2, Eye, Code, Copy, Check, Package, Truck } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface Service {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  priceUnit: string;
  isActive: boolean;
  formSchema?: FormSchema;
  pricingRules?: any;
  imageUrl?: string;
  showOnHomepage?: boolean;
  showOnServicesPage?: boolean;
  isFeatured?: boolean;
  category?: string;
  // Inventory settings
  requiresDumpster?: boolean;
  dumpsterAssignmentMode?: 'fixed' | 'customer_choice' | null;
  allowedDumpsterIds?: number[];
  defaultDumpsterId?: number | null;
  dumpsterQuantity?: number;
  showDumpsterPricing?: boolean;
}

interface Dumpster {
  id: number;
  name: string;
  dimensions: string;
  imageUrl?: string;
}

export default function ServiceEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const serviceId = Number(params.id);

  const [basicForm, setBasicForm] = useState({
    name: '',
    description: '',
    basePrice: 0,
    priceUnit: 'per rental',
    isActive: true,
    imageUrl: '',
    category: '',
    showOnHomepage: false,
    showOnServicesPage: true,
    isFeatured: false,
  });

  const [showPreview, setShowPreview] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [embedConfig, setEmbedConfig] = useState({
    primaryColor: '#f7c948',
    showHeader: true,
    customLogo: '',
  });

  const [inventoryForm, setInventoryForm] = useState({
    requiresDumpster: false,
    dumpsterAssignmentMode: null as 'fixed' | 'customer_choice' | null,
    allowedDumpsterIds: [] as number[],
    defaultDumpsterId: null as number | null,
    dumpsterQuantity: 1,
    showDumpsterPricing: true,
  });

  // Fetch available dumpsters
  const { data: dumpsters = [] } = useQuery<Dumpster[]>({
    queryKey: ['dumpsters'],
    queryFn: async () => {
      const res = await fetch('/api/dumpsters');
      if (!res.ok) throw new Error('Failed to fetch dumpsters');
      return res.json();
    },
  });

  // Fetch service data
  const { data: service, isLoading } = useQuery<Service>({
    queryKey: ['admin-service', serviceId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/services/${serviceId}`);
      if (!res.ok) throw new Error('Failed to fetch service');
      const data = await res.json();
      console.log('📥 Fetched service data:', data);

      // Update form with fetched data (API already returns dollars, not cents)
      const formData = {
        name: data.name,
        description: data.description,
        basePrice: data.basePrice || 0, // API returns dollars already
        priceUnit: data.priceUnit || 'per rental',
        isActive: data.isActive,
        imageUrl: data.imageUrl || '',
        category: data.category || '',
        showOnHomepage: data.showOnHomepage ?? false,
        showOnServicesPage: data.showOnServicesPage ?? true,
        isFeatured: data.isFeatured ?? false,
      };
      console.log('📋 Setting form state to:', formData);
      setBasicForm(formData);

      // Update inventory form state
      setInventoryForm({
        requiresDumpster: data.requiresDumpster ?? false,
        dumpsterAssignmentMode: data.dumpsterAssignmentMode ?? null,
        allowedDumpsterIds: data.allowedDumpsterIds ?? [],
        defaultDumpsterId: data.defaultDumpsterId ?? null,
        dumpsterQuantity: data.dumpsterQuantity ?? 1,
        showDumpsterPricing: data.showDumpsterPricing ?? true,
      });

      return data;
    },
  });

  // Update basic service info
  const updateBasicMutation = useMutation({
    mutationFn: async (data: typeof basicForm) => {
      const payload = {
        ...data,
        basePrice: Math.round(data.basePrice * 100), // Convert to cents
      };
      console.log('🚀 Sending update request with payload:', payload);

      const res = await fetch(`/api/admin/services/${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to update service');
      const result = await res.json();
      console.log('✅ Update response:', result);
      return result;
    },
    onSuccess: async () => {
      // Small delay to ensure database has committed changes
      await new Promise(resolve => setTimeout(resolve, 100));
      queryClient.invalidateQueries({ queryKey: ['admin-service', serviceId] });
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      toast({
        title: 'Service updated',
        description: 'Basic service information has been updated successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update service information.',
        variant: 'destructive',
      });
    },
  });

  // Update form schema
  const updateFormMutation = useMutation({
    mutationFn: async ({ formSchema, pricingRules }: { formSchema: FormSchema; pricingRules: PricingRule[] }) => {
      const res = await fetch(`/api/admin/services/${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formSchema, pricingRules }),
      });
      if (!res.ok) throw new Error('Failed to update form');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-service', serviceId] });
      toast({
        title: 'Form saved',
        description: 'Custom form and pricing rules have been saved successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to save form.',
        variant: 'destructive',
      });
    },
  });

  // Update inventory settings
  const updateInventoryMutation = useMutation({
    mutationFn: async (data: typeof inventoryForm) => {
      const res = await fetch(`/api/admin/services/${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requiresDumpster: data.requiresDumpster,
          dumpsterAssignmentMode: data.requiresDumpster ? data.dumpsterAssignmentMode : null,
          allowedDumpsterIds: data.requiresDumpster ? data.allowedDumpsterIds : [],
          defaultDumpsterId: data.requiresDumpster && data.dumpsterAssignmentMode === 'fixed' ? data.defaultDumpsterId : null,
          dumpsterQuantity: data.dumpsterQuantity,
          showDumpsterPricing: data.showDumpsterPricing,
        }),
      });
      if (!res.ok) throw new Error('Failed to update inventory settings');
      return res.json();
    },
    onSuccess: async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      queryClient.invalidateQueries({ queryKey: ['admin-service', serviceId] });
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      toast({
        title: 'Inventory settings updated',
        description: 'Service inventory configuration has been saved successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update inventory settings.',
        variant: 'destructive',
      });
    },
  });

  const handleSaveBasic = (e: React.FormEvent) => {
    e.preventDefault();
    updateBasicMutation.mutate(basicForm);
  };

  const handleSaveForm = (schema: FormSchema, pricingRules: PricingRule[]) => {
    updateFormMutation.mutate({ formSchema: schema, pricingRules });
  };

  const handleSaveInventory = (e: React.FormEvent) => {
    e.preventDefault();
    updateInventoryMutation.mutate(inventoryForm);
  };

  const toggleDumpsterSelection = (dumpsterId: number) => {
    setInventoryForm(prev => {
      const isSelected = prev.allowedDumpsterIds.includes(dumpsterId);
      return {
        ...prev,
        allowedDumpsterIds: isSelected
          ? prev.allowedDumpsterIds.filter(id => id !== dumpsterId)
          : [...prev.allowedDumpsterIds, dumpsterId],
      };
    });
  };

  const handlePreviewSubmit = (data: Record<string, any>, calculatedPrice: number) => {
    console.log('Preview form data:', data);
    console.log('Calculated price:', calculatedPrice);
    toast({
      title: 'Preview Mode',
      description: `Form would calculate a price of $${calculatedPrice.toFixed(2)}`,
    });
  };

  const generateEmbedCode = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const params = new URLSearchParams();

    if (embedConfig.primaryColor !== '#f7c948') {
      params.append('primaryColor', embedConfig.primaryColor);
    }
    if (!embedConfig.showHeader) {
      params.append('showHeader', 'false');
    }
    if (embedConfig.customLogo) {
      params.append('logo', embedConfig.customLogo);
    }

    const embedUrl = `${baseUrl}/embed/service/${serviceId}${params.toString() ? '?' + params.toString() : ''}`;

    return `<!-- Alley Cat Dumpsters - Service Form Embed -->
<iframe
  src="${embedUrl}"
  data-alleycat-embed="true"
  style="width: 100%; border: none; overflow: hidden;"
  title="${service?.name || 'Service Request Form'}"
></iframe>

<!-- Auto-resize script -->
<script src="${baseUrl}/embed.js"></script>`;
  };

  const generateJavaScriptEmbed = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

    return `<!-- Alley Cat Dumpsters - JavaScript Widget -->
<div id="alleycat-service-${serviceId}"></div>
<script src="${baseUrl}/embed.js"></script>
<script>
  AlleyCatEmbed.create(${serviceId}, {
    container: '#alleycat-service-${serviceId}',
    baseUrl: '${baseUrl}',
    primaryColor: '${embedConfig.primaryColor}',
    showHeader: ${embedConfig.showHeader},
    logo: '${embedConfig.customLogo}'
  });
</script>`;
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(type);
      toast({
        title: 'Copied!',
        description: 'Embed code has been copied to clipboard.',
      });
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-10 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="p-10">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-500">Service not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/services')} className="rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Edit Service</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure service details and custom forms</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full max-w-[800px] grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="inventory">
            <Truck className="h-4 w-4 mr-2" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="form">Custom Form</TabsTrigger>
          <TabsTrigger value="embed">
            <Code className="h-4 w-4 mr-2" />
            Embed
          </TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic">
          <Card className="border-none shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="text-xl font-black">Service Information</CardTitle>
              <CardDescription>Update basic service details and pricing</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveBasic} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold">Service Name</Label>
                    <Input
                      value={basicForm.name}
                      onChange={(e) => setBasicForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="h-12 rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-bold">Description</Label>
                    <Input
                      value={basicForm.description}
                      onChange={(e) => setBasicForm((prev) => ({ ...prev, description: e.target.value }))}
                      className="h-12 rounded-xl"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-bold">Base Price ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={basicForm.basePrice || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          if (!isNaN(value) && value >= 0) {
                            setBasicForm((prev) => ({ ...prev, basePrice: value }));
                          }
                        }}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="h-12 rounded-xl"
                        placeholder="0.00"
                      />
                      <p className="text-xs text-gray-500">
                        Optional starting price. Leave at $0 for quote-only services.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-bold">Price Unit</Label>
                      <Input
                        value={basicForm.priceUnit}
                        onChange={(e) => setBasicForm((prev) => ({ ...prev, priceUnit: e.target.value }))}
                        className="h-12 rounded-xl"
                        placeholder="e.g. per rental, per day"
                      />
                      <p className="text-xs text-gray-500">
                        How pricing is measured (optional)
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-bold">Image URL</Label>
                    <Input
                      value={basicForm.imageUrl}
                      onChange={(e) => setBasicForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                      className="h-12 rounded-xl"
                      placeholder="https://example.com/image.jpg"
                    />
                    <p className="text-xs text-gray-500">URL to the service image (optional)</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-bold">Category</Label>
                    <Input
                      value={basicForm.category}
                      onChange={(e) => setBasicForm((prev) => ({ ...prev, category: e.target.value }))}
                      className="h-12 rounded-xl"
                      placeholder="e.g. Residential, Commercial, Specialty"
                    />
                    <p className="text-xs text-gray-500">Optional category for organizing services</p>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <Label className="text-sm font-bold text-gray-700">Display Settings</Label>

                    <div className="flex items-center space-x-3">
                      <Switch
                        checked={basicForm.isActive}
                        onCheckedChange={(checked) => setBasicForm((prev) => ({ ...prev, isActive: checked }))}
                      />
                      <Label className="text-sm font-medium cursor-pointer">Service is active</Label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Switch
                        checked={basicForm.showOnHomepage}
                        onCheckedChange={(checked) => setBasicForm((prev) => ({ ...prev, showOnHomepage: checked }))}
                      />
                      <Label className="text-sm font-medium cursor-pointer">Show on homepage</Label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Switch
                        checked={basicForm.showOnServicesPage}
                        onCheckedChange={(checked) => setBasicForm((prev) => ({ ...prev, showOnServicesPage: checked }))}
                      />
                      <Label className="text-sm font-medium cursor-pointer">Show on services page</Label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Switch
                        checked={basicForm.isFeatured}
                        onCheckedChange={(checked) => setBasicForm((prev) => ({ ...prev, isFeatured: checked }))}
                      />
                      <Label className="text-sm font-medium cursor-pointer">Featured service (highlighted)</Label>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={updateBasicMutation.isPending}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-xl px-8"
                >
                  {updateBasicMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Settings Tab */}
        <TabsContent value="inventory">
          <Card className="border-none shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="text-xl font-black flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inventory Settings
              </CardTitle>
              <CardDescription>
                Configure whether this service requires a dumpster from your fleet inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveInventory} className="space-y-6">
                {/* Main toggle */}
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                  <Switch
                    checked={inventoryForm.requiresDumpster}
                    onCheckedChange={(checked) => setInventoryForm(prev => ({ ...prev, requiresDumpster: checked }))}
                  />
                  <div>
                    <Label className="text-sm font-bold cursor-pointer">This service requires a dumpster</Label>
                    <p className="text-xs text-gray-500 mt-1">
                      When enabled, completing this service will reserve a dumpster from your fleet
                    </p>
                  </div>
                </div>

                {inventoryForm.requiresDumpster && (
                  <div className="space-y-6 border-l-4 border-yellow-400 pl-6">
                    {/* Assignment Mode */}
                    <div className="space-y-3">
                      <Label className="text-sm font-bold">How should the dumpster be assigned?</Label>
                      <RadioGroup
                        value={inventoryForm.dumpsterAssignmentMode || ''}
                        onValueChange={(value) => setInventoryForm(prev => ({
                          ...prev,
                          dumpsterAssignmentMode: value as 'fixed' | 'customer_choice',
                        }))}
                        className="space-y-3"
                      >
                        <div className="flex items-start space-x-3 p-3 rounded-xl border-2 border-gray-200 hover:border-yellow-400 transition-colors">
                          <RadioGroupItem value="fixed" id="fixed" className="mt-1" />
                          <div>
                            <Label htmlFor="fixed" className="text-sm font-bold cursor-pointer">Fixed dumpster type</Label>
                            <p className="text-xs text-gray-500 mt-1">
                              Admin selects one dumpster type that will always be used for this service
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 p-3 rounded-xl border-2 border-gray-200 hover:border-yellow-400 transition-colors">
                          <RadioGroupItem value="customer_choice" id="customer_choice" className="mt-1" />
                          <div>
                            <Label htmlFor="customer_choice" className="text-sm font-bold cursor-pointer">Customer chooses</Label>
                            <p className="text-xs text-gray-500 mt-1">
                              Customers can select which dumpster size they need from allowed options
                            </p>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Fixed Mode: Select default dumpster */}
                    {inventoryForm.dumpsterAssignmentMode === 'fixed' && (
                      <div className="space-y-2">
                        <Label className="text-sm font-bold">Default Dumpster Type</Label>
                        <Select
                          value={inventoryForm.defaultDumpsterId?.toString() || ''}
                          onValueChange={(value) => setInventoryForm(prev => ({
                            ...prev,
                            defaultDumpsterId: value ? parseInt(value) : null,
                          }))}
                        >
                          <SelectTrigger className="h-12 rounded-xl">
                            <SelectValue placeholder="Select a dumpster type" />
                          </SelectTrigger>
                          <SelectContent>
                            {dumpsters.map((dumpster) => (
                              <SelectItem key={dumpster.id} value={dumpster.id.toString()}>
                                {dumpster.name} ({dumpster.dimensions})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500">
                          This dumpster type will be automatically reserved for this service
                        </p>
                      </div>
                    )}

                    {/* Customer Choice Mode: Select allowed dumpsters */}
                    {inventoryForm.dumpsterAssignmentMode === 'customer_choice' && (
                      <div className="space-y-3">
                        <Label className="text-sm font-bold">Allowed Dumpster Types</Label>
                        <p className="text-xs text-gray-500 -mt-1">
                          Select which dumpster sizes customers can choose from
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {dumpsters.map((dumpster) => (
                            <div
                              key={dumpster.id}
                              className={`flex items-center space-x-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                                inventoryForm.allowedDumpsterIds.includes(dumpster.id)
                                  ? 'border-yellow-400 bg-yellow-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => toggleDumpsterSelection(dumpster.id)}
                            >
                              <Checkbox
                                checked={inventoryForm.allowedDumpsterIds.includes(dumpster.id)}
                                onCheckedChange={() => toggleDumpsterSelection(dumpster.id)}
                              />
                              <div>
                                <p className="text-sm font-bold">{dumpster.name}</p>
                                <p className="text-xs text-gray-500">{dumpster.dimensions}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Show pricing toggle */}
                        <div className="flex items-center space-x-3 pt-4">
                          <Switch
                            checked={inventoryForm.showDumpsterPricing}
                            onCheckedChange={(checked) => setInventoryForm(prev => ({ ...prev, showDumpsterPricing: checked }))}
                          />
                          <div>
                            <Label className="text-sm font-medium cursor-pointer">Show pricing to customers</Label>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Display dumpster prices when customers are choosing
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quantity */}
                    <div className="space-y-2">
                      <Label className="text-sm font-bold">Dumpster Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={inventoryForm.dumpsterQuantity}
                        onChange={(e) => setInventoryForm(prev => ({
                          ...prev,
                          dumpsterQuantity: Math.max(1, parseInt(e.target.value) || 1),
                        }))}
                        className="h-12 rounded-xl w-32"
                      />
                      <p className="text-xs text-gray-500">
                        How many dumpsters are needed for this service (usually 1)
                      </p>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={updateInventoryMutation.isPending}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-xl px-8"
                >
                  {updateInventoryMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Inventory Settings
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Form Tab */}
        <TabsContent value="form">
          <FormBuilder
            initialSchema={service.formSchema}
            initialPricingRules={service.pricingRules || []}
            onSave={handleSaveForm}
            onPreview={() => setShowPreview(true)}
          />
        </TabsContent>

        {/* Embed Code Tab */}
        <TabsContent value="embed">
          <div className="space-y-6">
            {/* Customization Options */}
            <Card className="border-none shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-black">Embed Customization</CardTitle>
                <CardDescription>
                  Customize how the form appears when embedded on external websites
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-bold">Primary Color</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="color"
                      value={embedConfig.primaryColor}
                      onChange={(e) => setEmbedConfig({ ...embedConfig, primaryColor: e.target.value })}
                      className="w-20 h-12 rounded-xl cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={embedConfig.primaryColor}
                      onChange={(e) => setEmbedConfig({ ...embedConfig, primaryColor: e.target.value })}
                      className="h-12 rounded-xl"
                      placeholder="#f7c948"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Accent color for buttons and highlights
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-bold">Custom Logo URL (Optional)</Label>
                  <Input
                    value={embedConfig.customLogo}
                    onChange={(e) => setEmbedConfig({ ...embedConfig, customLogo: e.target.value })}
                    className="h-12 rounded-xl"
                    placeholder="https://example.com/logo.png"
                  />
                  <p className="text-xs text-gray-500">
                    Display a custom logo at the top of the embedded form
                  </p>
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <Switch
                    checked={embedConfig.showHeader}
                    onCheckedChange={(checked) => setEmbedConfig({ ...embedConfig, showHeader: checked })}
                  />
                  <Label className="text-sm font-medium cursor-pointer">
                    Show service header (name, description, image)
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* iframe Embed Code */}
            <Card className="border-none shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-black flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  iframe Embed (Recommended)
                </CardTitle>
                <CardDescription>
                  Simple iframe embed - works on any website without JavaScript knowledge
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-xl overflow-x-auto text-xs font-mono">
                    {generateEmbedCode()}
                  </pre>
                  <Button
                    onClick={() => copyToClipboard(generateEmbedCode(), 'iframe')}
                    className="absolute top-3 right-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                    size="sm"
                  >
                    {copiedCode === 'iframe' ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </>
                    )}
                  </Button>
                </div>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <p className="text-sm font-bold text-blue-900 mb-2">How to use:</p>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Copy the code above</li>
                    <li>Paste it into your website's HTML where you want the form to appear</li>
                    <li>The form will auto-resize to fit its content</li>
                    <li>Form submissions save to your admin panel</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            {/* JavaScript Widget Code */}
            <Card className="border-none shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-black flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  JavaScript Widget (Advanced)
                </CardTitle>
                <CardDescription>
                  Programmatic embed with more control - requires JavaScript knowledge
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-xl overflow-x-auto text-xs font-mono">
                    {generateJavaScriptEmbed()}
                  </pre>
                  <Button
                    onClick={() => copyToClipboard(generateJavaScriptEmbed(), 'javascript')}
                    className="absolute top-3 right-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                    size="sm"
                  >
                    {copiedCode === 'javascript' ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </>
                    )}
                  </Button>
                </div>
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                  <p className="text-sm font-bold text-purple-900 mb-2">Advanced features:</p>
                  <ul className="text-sm text-purple-800 space-y-1 list-disc list-inside">
                    <li>Programmatic control over embed options</li>
                    <li>Listen for form submission events</li>
                    <li>Better for dynamic websites and SPAs</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Direct Link */}
            <Card className="border-none shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-black">Direct Link</CardTitle>
                <CardDescription>
                  Share this link directly or use it in emails and social media
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Input
                    readOnly
                    value={typeof window !== 'undefined' ? `${window.location.origin}/services/${serviceId}` : ''}
                    className="h-12 rounded-xl pr-24 font-mono text-sm bg-gray-50"
                  />
                  <Button
                    onClick={() => copyToClipboard(typeof window !== 'undefined' ? `${window.location.origin}/services/${serviceId}` : '', 'link')}
                    className="absolute right-2 top-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg"
                    size="sm"
                  >
                    {copiedCode === 'link' ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Link
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Form Preview</DialogTitle>
          </DialogHeader>
          {service.formSchema && service.formSchema.fields && service.formSchema.fields.length > 0 ? (
            <DynamicFormRenderer
              schema={service.formSchema}
              basePrice={service.basePrice || 0}
              onSubmit={handlePreviewSubmit}
              isPreview={true}
            />
          ) : (
            <div className="py-12 text-center">
              <p className="text-gray-500">No form configured yet. Add fields to see a preview.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
