import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/ui/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Save, Mail, Building2, Users } from "lucide-react";

export default function SettingsPage() {
  const { toast } = useToast();
  
  const [businessName, setBusinessName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [autoCreateCustomerAccounts, setAutoCreateCustomerAccounts] = useState(false);

  const { data: settings, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/settings"],
  });

  useEffect(() => {
    if (settings) {
      setBusinessName(settings.businessName || "");
      setSenderEmail(settings.senderEmail || "");
      setSenderName(settings.senderName || "");
      setPhoneNumber(settings.phoneNumber || "");
      setSupportEmail(settings.supportEmail || "");
      setAutoCreateCustomerAccounts(settings.autoCreateCustomerAccounts === "true");
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const response = await apiRequest("POST", "/api/admin/settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Settings Updated",
        description: "Your changes have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveBusinessInfo = () => {
    updateSettingsMutation.mutate({
      businessName,
      phoneNumber,
      supportEmail,
    });
  };

  const handleSaveEmailSettings = () => {
    updateSettingsMutation.mutate({
      senderEmail,
      senderName,
    });
  };

  const handleSavePortalSettings = () => {
    updateSettingsMutation.mutate({
      autoCreateCustomerAccounts: autoCreateCustomerAccounts ? "true" : "false",
    });
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
        <h1 className="text-3xl font-bold text-[#2c2c2c]">Business Settings</h1>
        <p className="text-neutral-600 mt-2">
          Configure your business information and email settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Business Information
          </CardTitle>
          <CardDescription>
            Set your business name and contact details that appear in emails and customer communications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              data-testid="input-business-name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Acme Dumpster Rentals"
            />
            <p className="text-sm text-neutral-500">
              This name will appear in email headers and customer-facing communications.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              data-testid="input-phone-number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supportEmail">Support Email</Label>
            <Input
              id="supportEmail"
              data-testid="input-support-email"
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              placeholder="support@yourbusiness.com"
            />
            <p className="text-sm text-neutral-500">
              This email address will be shown to customers for support inquiries.
            </p>
          </div>
          
          <Button 
            onClick={handleSaveBusinessInfo}
            disabled={updateSettingsMutation.isPending}
            data-testid="button-save-business-info"
          >
            {updateSettingsMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Business Info
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Settings
          </CardTitle>
          <CardDescription>
            Configure the sender information for automated emails like booking confirmations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="senderEmail">Sender Email Address</Label>
            <Input
              id="senderEmail"
              data-testid="input-sender-email"
              type="email"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              placeholder="noreply@yourbusiness.com"
            />
            <p className="text-sm text-neutral-500">
              This email address will be used as the "From" address in automated emails.
              Make sure this domain is verified in your Brevo account.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="senderName">Sender Name</Label>
            <Input
              id="senderName"
              data-testid="input-sender-name"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Acme Dumpster Rentals"
            />
            <p className="text-sm text-neutral-500">
              This name will appear as the sender in customer emails (e.g., "Acme Dumpster Rentals").
            </p>
          </div>
          
          <Button 
            onClick={handleSaveEmailSettings}
            disabled={updateSettingsMutation.isPending}
            data-testid="button-save-email-settings"
          >
            {updateSettingsMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Email Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customer Portal Settings
          </CardTitle>
          <CardDescription>
            Configure how customer portal accounts are created and managed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoCreateAccounts">Auto-create customer accounts</Label>
              <p className="text-sm text-neutral-500">
                Automatically create a portal account for every customer when their booking is paid.
                They'll receive an access code to track their rental, request swaps, or complete early.
              </p>
            </div>
            <Switch
              id="autoCreateAccounts"
              data-testid="switch-auto-create-accounts"
              checked={autoCreateCustomerAccounts}
              onCheckedChange={setAutoCreateCustomerAccounts}
            />
          </div>
          
          <Button 
            onClick={handleSavePortalSettings}
            disabled={updateSettingsMutation.isPending}
            data-testid="button-save-portal-settings"
          >
            {updateSettingsMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Portal Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
    </AdminLayout>
  );
}
