import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/ui/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Save, DollarSign, RefreshCw, Truck, CheckCircle } from "lucide-react";
import type { SwapPricing } from "@shared/schema";

interface PricingFormData {
  requestType: string;
  name: string;
  description: string;
  baseFee: number;
  isActive: boolean;
}

const defaultPricing: Record<string, PricingFormData> = {
  swap: {
    requestType: "swap",
    name: "Dumpster Swap",
    description: "Exchange your current dumpster for a new empty one",
    baseFee: 0,
    isActive: true,
  },
  pickup: {
    requestType: "pickup",
    name: "Final Pickup",
    description: "Request early pickup when you're done with your rental",
    baseFee: 0,
    isActive: true,
  },
  early_complete: {
    requestType: "early_complete",
    name: "Early Completion",
    description: "Complete your rental early and receive credit for unused days",
    baseFee: 0,
    isActive: true,
  },
};

export default function SwapPricingPage() {
  const { toast } = useToast();
  
  const [swapData, setSwapData] = useState<PricingFormData>(defaultPricing.swap);
  const [pickupData, setPickupData] = useState<PricingFormData>(defaultPricing.pickup);
  const [earlyCompleteData, setEarlyCompleteData] = useState<PricingFormData>(defaultPricing.early_complete);

  const { data: pricing, isLoading } = useQuery<SwapPricing[]>({
    queryKey: ["/api/admin/swap-pricing"],
  });

  useEffect(() => {
    if (pricing) {
      const swapPricing = pricing.find(p => p.requestType === "swap");
      const pickupPricing = pricing.find(p => p.requestType === "pickup");
      const earlyCompletePricing = pricing.find(p => p.requestType === "early_complete");

      if (swapPricing) {
        setSwapData({
          requestType: swapPricing.requestType,
          name: swapPricing.name,
          description: swapPricing.description || "",
          baseFee: swapPricing.baseFee / 100,
          isActive: swapPricing.isActive ?? true,
        });
      }

      if (pickupPricing) {
        setPickupData({
          requestType: pickupPricing.requestType,
          name: pickupPricing.name,
          description: pickupPricing.description || "",
          baseFee: pickupPricing.baseFee / 100,
          isActive: pickupPricing.isActive ?? true,
        });
      }

      if (earlyCompletePricing) {
        setEarlyCompleteData({
          requestType: earlyCompletePricing.requestType,
          name: earlyCompletePricing.name,
          description: earlyCompletePricing.description || "",
          baseFee: earlyCompletePricing.baseFee / 100,
          isActive: earlyCompletePricing.isActive ?? true,
        });
      }
    }
  }, [pricing]);

  const savePricingMutation = useMutation({
    mutationFn: async (data: PricingFormData) => {
      const response = await apiRequest("POST", "/api/admin/swap-pricing", {
        ...data,
        baseFee: Math.round(data.baseFee * 100),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/swap-pricing"] });
      toast({
        title: "Pricing Saved",
        description: "Swap pricing has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save pricing. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = (data: PricingFormData) => {
    savePricingMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#2c2c2c]">Swap & Service Pricing</h1>
          <p className="text-neutral-600 mt-2">
            Configure fees for dumpster swaps, pickups, and early completions. Customers will be invoiced for these services.
          </p>
        </div>

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
                <Label htmlFor="swapActive">Enable swap service</Label>
                <p className="text-sm text-neutral-500">
                  Allow customers to request dumpster swaps
                </p>
              </div>
              <Switch
                id="swapActive"
                data-testid="switch-swap-active"
                checked={swapData.isActive}
                onCheckedChange={(checked) => setSwapData(prev => ({ ...prev, isActive: checked }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="swapName">Service Name</Label>
                <Input
                  id="swapName"
                  data-testid="input-swap-name"
                  value={swapData.name}
                  onChange={(e) => setSwapData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Dumpster Swap"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="swapFee">Fee Amount ($)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <Input
                    id="swapFee"
                    data-testid="input-swap-fee"
                    type="number"
                    min="0"
                    step="0.01"
                    className="pl-9"
                    value={swapData.baseFee}
                    onChange={(e) => setSwapData(prev => ({ ...prev, baseFee: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
                <p className="text-sm text-neutral-500">
                  Set to $0 for free swaps
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="swapDescription">Description</Label>
              <Textarea
                id="swapDescription"
                data-testid="textarea-swap-description"
                value={swapData.description}
                onChange={(e) => setSwapData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the swap service..."
                rows={2}
              />
            </div>
            
            <Button 
              onClick={() => handleSave(swapData)}
              disabled={savePricingMutation.isPending}
              data-testid="button-save-swap-pricing"
            >
              {savePricingMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Swap Pricing
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Final Pickup Fee
            </CardTitle>
            <CardDescription>
              Charge a fee when customers request early pickup of their dumpster (before the rental period ends).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="pickupActive">Enable pickup service</Label>
                <p className="text-sm text-neutral-500">
                  Allow customers to request early pickups
                </p>
              </div>
              <Switch
                id="pickupActive"
                data-testid="switch-pickup-active"
                checked={pickupData.isActive}
                onCheckedChange={(checked) => setPickupData(prev => ({ ...prev, isActive: checked }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickupName">Service Name</Label>
                <Input
                  id="pickupName"
                  data-testid="input-pickup-name"
                  value={pickupData.name}
                  onChange={(e) => setPickupData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Final Pickup"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pickupFee">Fee Amount ($)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <Input
                    id="pickupFee"
                    data-testid="input-pickup-fee"
                    type="number"
                    min="0"
                    step="0.01"
                    className="pl-9"
                    value={pickupData.baseFee}
                    onChange={(e) => setPickupData(prev => ({ ...prev, baseFee: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
                <p className="text-sm text-neutral-500">
                  Set to $0 for free pickups
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickupDescription">Description</Label>
              <Textarea
                id="pickupDescription"
                data-testid="textarea-pickup-description"
                value={pickupData.description}
                onChange={(e) => setPickupData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the pickup service..."
                rows={2}
              />
            </div>
            
            <Button 
              onClick={() => handleSave(pickupData)}
              disabled={savePricingMutation.isPending}
              data-testid="button-save-pickup-pricing"
            >
              {savePricingMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Pickup Pricing
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Early Completion Fee
            </CardTitle>
            <CardDescription>
              Charge a fee when customers want to complete their rental early. Customers may still receive credit for unused days.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="earlyCompleteActive">Enable early completion</Label>
                <p className="text-sm text-neutral-500">
                  Allow customers to complete rentals early and receive credit
                </p>
              </div>
              <Switch
                id="earlyCompleteActive"
                data-testid="switch-early-complete-active"
                checked={earlyCompleteData.isActive}
                onCheckedChange={(checked) => setEarlyCompleteData(prev => ({ ...prev, isActive: checked }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="earlyCompleteName">Service Name</Label>
                <Input
                  id="earlyCompleteName"
                  data-testid="input-early-complete-name"
                  value={earlyCompleteData.name}
                  onChange={(e) => setEarlyCompleteData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Early Completion"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="earlyCompleteFee">Fee Amount ($)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <Input
                    id="earlyCompleteFee"
                    data-testid="input-early-complete-fee"
                    type="number"
                    min="0"
                    step="0.01"
                    className="pl-9"
                    value={earlyCompleteData.baseFee}
                    onChange={(e) => setEarlyCompleteData(prev => ({ ...prev, baseFee: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
                <p className="text-sm text-neutral-500">
                  Set to $0 for no fee
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="earlyCompleteDescription">Description</Label>
              <Textarea
                id="earlyCompleteDescription"
                data-testid="textarea-early-complete-description"
                value={earlyCompleteData.description}
                onChange={(e) => setEarlyCompleteData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the early completion service..."
                rows={2}
              />
            </div>
            
            <Button 
              onClick={() => handleSave(earlyCompleteData)}
              disabled={savePricingMutation.isPending}
              data-testid="button-save-early-complete-pricing"
            >
              {savePricingMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Early Completion Pricing
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
