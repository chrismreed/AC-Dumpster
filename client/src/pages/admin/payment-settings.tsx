import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/ui/admin-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Save } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function PaymentSettingsPage() {
  const { toast } = useToast();
  const [splitPaymentEnabled, setSplitPaymentEnabled] = useState(false);
  const [splitPaymentPercentage, setSplitPaymentPercentage] = useState(50);

  // Fetch current payment settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/payment-settings"],
    onSuccess: (data) => {
      if (data) {
        setSplitPaymentEnabled(data.splitPaymentEnabled || false);
        setSplitPaymentPercentage(data.splitPaymentPercentage || 50);
      }
    },
  });

  // Update payment settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settingsData: { splitPaymentEnabled: boolean; splitPaymentPercentage: number }) => {
      return await apiRequest("PUT", "/api/payment-settings", settingsData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-settings"] });
      toast({
        title: "Settings Updated",
        description: "Payment settings have been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update payment settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateSettingsMutation.mutate({
      splitPaymentEnabled,
      splitPaymentPercentage,
    });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Settings</h1>
          <p className="text-muted-foreground">
            Configure payment options and billing preferences for your customers.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              Split Payment Options
            </CardTitle>
            <CardDescription>
              Allow customers to split their payment into two parts: upfront and upon pickup.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="split-payment"
                checked={splitPaymentEnabled}
                onCheckedChange={setSplitPaymentEnabled}
              />
              <Label htmlFor="split-payment" className="font-medium">
                Enable Split Payment Option
              </Label>
            </div>

            {splitPaymentEnabled && (
              <div className="space-y-4 pl-6 border-l-2 border-muted">
                <div className="space-y-2">
                  <Label htmlFor="percentage">First Payment Percentage</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="percentage"
                      type="number"
                      min="1"
                      max="99"
                      value={splitPaymentPercentage}
                      onChange={(e) => setSplitPaymentPercentage(Number(e.target.value))}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">
                      % charged upfront, {100 - splitPaymentPercentage}% charged at pickup
                    </span>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">How Split Payment Works:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Customers can choose to split their payment during checkout</li>
                    <li>• {splitPaymentPercentage}% is charged immediately when booking</li>
                    <li>• Remaining {100 - splitPaymentPercentage}% is automatically charged when status changes to "Picked Up"</li>
                    <li>• Customers receive email notifications for both payments</li>
                  </ul>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleSave}
                disabled={updateSettingsMutation.isPending}
                className="min-w-24"
              >
                {updateSettingsMutation.isPending ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {splitPaymentEnabled && (
          <Card>
            <CardHeader>
              <CardTitle>Important Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="text-yellow-600 bg-yellow-50 p-3 rounded-lg">
                  <strong>⚠️ Stripe Configuration Required:</strong> Make sure your Stripe account is properly configured to handle split payments and automatic charges.
                </p>
                <p className="text-blue-600 bg-blue-50 p-3 rounded-lg">
                  <strong>📧 Customer Communication:</strong> Customers will be notified via email about the split payment schedule and when the second payment is processed.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}