'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw, Save, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SwapPricingItem {
  id: number;
  requestType: string;
  name: string;
  description: string | null;
  baseFee: number;
  isActive: boolean;
}

interface PricingFormData {
  name: string;
  description: string;
  baseFee: number;
  isActive: boolean;
}

export default function AdminSwapPricingPage() {
  const queryClient = useQueryClient();

  // State for each pricing type
  const [swapPricing, setSwapPricing] = useState<PricingFormData>({
    name: 'Dumpster Swap',
    description: '',
    baseFee: 0,
    isActive: true,
  });

  const [pickupPricing, setPickupPricing] = useState<PricingFormData>({
    name: 'Final Pickup',
    description: '',
    baseFee: 0,
    isActive: true,
  });

  const [earlyCompletePricing, setEarlyCompletePricing] = useState<PricingFormData>({
    name: 'Early Completion',
    description: '',
    baseFee: 0,
    isActive: true,
  });

  // Fetch pricing data
  const { data: pricingData, isLoading } = useQuery({
    queryKey: ['swapPricing'],
    queryFn: async () => {
      const response = await fetch('/api/admin/swap-pricing');
      if (!response.ok) throw new Error('Failed to fetch pricing');
      return response.json() as Promise<SwapPricingItem[]>;
    },
  });

  // Update form data when pricing data is loaded
  useEffect(() => {
    if (pricingData) {
      pricingData.forEach((item) => {
        const formData: PricingFormData = {
          name: item.name,
          description: item.description || '',
          baseFee: item.baseFee / 100, // Convert cents to dollars
          isActive: item.isActive,
        };

        if (item.requestType === 'swap') {
          setSwapPricing(formData);
        } else if (item.requestType === 'pickup') {
          setPickupPricing(formData);
        } else if (item.requestType === 'early_complete') {
          setEarlyCompletePricing(formData);
        }
      });
    }
  }, [pricingData]);

  // Save pricing mutation
  const savePricingMutation = useMutation({
    mutationFn: async ({ requestType, data }: { requestType: string; data: PricingFormData }) => {
      const response = await fetch('/api/admin/swap-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType,
          name: data.name,
          description: data.description,
          baseFee: Math.round(data.baseFee * 100), // Convert dollars to cents
          isActive: data.isActive,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save pricing');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swapPricing'] });
    },
    onError: (error: Error) => {
      console.error('Failed to save pricing:', error);
    },
  });

  const handleSaveSwap = () => {
    savePricingMutation.mutate({ requestType: 'swap', data: swapPricing });
  };

  const handleSavePickup = () => {
    savePricingMutation.mutate({ requestType: 'pickup', data: pickupPricing });
  };

  const handleSaveEarlyComplete = () => {
    savePricingMutation.mutate({ requestType: 'early_complete', data: earlyCompletePricing });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Swap & Service Pricing</h1>
        <p className="text-muted-foreground">
          Configure fees for dumpster swaps, pickups, and early completions. Customers will be invoiced for these services.
        </p>
      </div>

      {/* Dumpster Swap Fee */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Dumpster Swap Fee
          </CardTitle>
          <CardDescription>
            Charge a fee when customers request to swap their current dumpster for a new empty one.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="swap-active">Enable swap service</Label>
              <p className="text-sm text-muted-foreground">Allow customers to request dumpster swaps</p>
            </div>
            <Switch
              id="swap-active"
              checked={swapPricing.isActive}
              onCheckedChange={(checked) => setSwapPricing({ ...swapPricing, isActive: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="swap-name">Service Name</Label>
            <Input
              id="swap-name"
              value={swapPricing.name}
              onChange={(e) => setSwapPricing({ ...swapPricing, name: e.target.value })}
              placeholder="Dumpster Swap"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="swap-fee">Fee Amount ($)</Label>
            <NumberInput
              id="swap-fee"
              value={swapPricing.baseFee}
              onChange={(value) => setSwapPricing({ ...swapPricing, baseFee: value })}
              allowDecimals={true}
              decimalPlaces={2}
              placeholder="0.00"
            />
            <p className="text-sm text-muted-foreground">Set to $0 for free swaps</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="swap-description">Description</Label>
            <Textarea
              id="swap-description"
              value={swapPricing.description}
              onChange={(e) => setSwapPricing({ ...swapPricing, description: e.target.value })}
              placeholder="Describe the swap service..."
              rows={3}
            />
          </div>

          <Button
            onClick={handleSaveSwap}
            disabled={savePricingMutation.isPending}
            className="w-full"
          >
            {savePricingMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Swap Pricing
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Final Pickup Fee */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Final Pickup Fee
          </CardTitle>
          <CardDescription>
            Charge a fee when customers request early pickup of their dumpster (before the rental period ends).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pickup-active">Enable pickup service</Label>
              <p className="text-sm text-muted-foreground">Allow customers to request early pickups</p>
            </div>
            <Switch
              id="pickup-active"
              checked={pickupPricing.isActive}
              onCheckedChange={(checked) => setPickupPricing({ ...pickupPricing, isActive: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pickup-name">Service Name</Label>
            <Input
              id="pickup-name"
              value={pickupPricing.name}
              onChange={(e) => setPickupPricing({ ...pickupPricing, name: e.target.value })}
              placeholder="Final Pickup"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pickup-fee">Fee Amount ($)</Label>
            <NumberInput
              id="pickup-fee"
              value={pickupPricing.baseFee}
              onChange={(value) => setPickupPricing({ ...pickupPricing, baseFee: value })}
              allowDecimals={true}
              decimalPlaces={2}
              placeholder="0.00"
            />
            <p className="text-sm text-muted-foreground">Set to $0 for free pickups</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pickup-description">Description</Label>
            <Textarea
              id="pickup-description"
              value={pickupPricing.description}
              onChange={(e) => setPickupPricing({ ...pickupPricing, description: e.target.value })}
              placeholder="Describe the pickup service..."
              rows={3}
            />
          </div>

          <Button
            onClick={handleSavePickup}
            disabled={savePricingMutation.isPending}
            className="w-full"
          >
            {savePricingMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Pickup Pricing
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Early Completion Fee */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Early Completion Fee
          </CardTitle>
          <CardDescription>
            Charge a fee when customers want to complete their rental early. Customers may still receive credit for unused days.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="early-active">Enable early completion</Label>
              <p className="text-sm text-muted-foreground">Allow customers to complete rentals early and receive credit</p>
            </div>
            <Switch
              id="early-active"
              checked={earlyCompletePricing.isActive}
              onCheckedChange={(checked) => setEarlyCompletePricing({ ...earlyCompletePricing, isActive: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="early-name">Service Name</Label>
            <Input
              id="early-name"
              value={earlyCompletePricing.name}
              onChange={(e) => setEarlyCompletePricing({ ...earlyCompletePricing, name: e.target.value })}
              placeholder="Early Completion"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="early-fee">Fee Amount ($)</Label>
            <NumberInput
              id="early-fee"
              value={earlyCompletePricing.baseFee}
              onChange={(value) => setEarlyCompletePricing({ ...earlyCompletePricing, baseFee: value })}
              allowDecimals={true}
              decimalPlaces={2}
              placeholder="0.00"
            />
            <p className="text-sm text-muted-foreground">Set to $0 for no fee</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="early-description">Description</Label>
            <Textarea
              id="early-description"
              value={earlyCompletePricing.description}
              onChange={(e) => setEarlyCompletePricing({ ...earlyCompletePricing, description: e.target.value })}
              placeholder="Describe the early completion service..."
              rows={3}
            />
          </div>

          <Button
            onClick={handleSaveEarlyComplete}
            disabled={savePricingMutation.isPending}
            className="w-full"
          >
            {savePricingMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Early Completion Pricing
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
