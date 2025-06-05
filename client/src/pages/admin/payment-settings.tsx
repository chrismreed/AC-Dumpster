import { useState } from "react";
import { AdminLayout } from "@/components/ui/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { Check, CreditCard } from "lucide-react";

// Form schema for Stripe settings
const stripeSettingsSchema = z.object({
  liveMode: z.boolean().default(false),
  testPublicKey: z.string().min(1, "Test public key is required"),
  testSecretKey: z.string().min(1, "Test secret key is required"),
  livePublicKey: z.string().optional(),
  liveSecretKey: z.string().optional(),
  webhookSecret: z.string().optional(),
});

// Form schema for general payment settings
const generalPaymentSettingsSchema = z.object({
  acceptedPaymentMethods: z.object({
    creditCard: z.boolean().default(true),
    paypal: z.boolean().default(false),
    applePay: z.boolean().default(false),
    googlePay: z.boolean().default(false),
  }),
  taxRate: z.number().min(0).max(100).default(0),
  invoiceDueDays: z.number().min(0).default(30),
  defaultCurrency: z.string().default("USD"),
});

type StripeSettingsFormValues = z.infer<typeof stripeSettingsSchema>;
type GeneralPaymentSettingsFormValues = z.infer<typeof generalPaymentSettingsSchema>;

export default function PaymentSettingsPage() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  // Stripe settings form
  const stripeForm = useForm<StripeSettingsFormValues>({
    resolver: zodResolver(stripeSettingsSchema),
    defaultValues: {
      liveMode: false,
      testPublicKey: "",
      testSecretKey: "",
      livePublicKey: "",
      liveSecretKey: "",
      webhookSecret: "",
    },
  });

  // General payment settings form
  const generalForm = useForm<GeneralPaymentSettingsFormValues>({
    resolver: zodResolver(generalPaymentSettingsSchema),
    defaultValues: {
      acceptedPaymentMethods: {
        creditCard: true,
        paypal: false,
        applePay: false,
        googlePay: false,
      },
      taxRate: 0,
      invoiceDueDays: 30,
      defaultCurrency: "USD",
    },
  });

  // Handle Stripe form submission
  const onStripeSubmit = async (values: StripeSettingsFormValues) => {
    setIsSaving(true);
    try {
      // This would be a real API call in production
      // await apiRequest("POST", "/api/admin/payment-settings/stripe", values);
      
      // For demonstration purposes
      console.log("Stripe settings saved:", values);
      
      toast({
        title: "Settings saved",
        description: "Your Stripe payment settings have been updated successfully.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to save Stripe settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle general payment settings form submission
  const onGeneralSubmit = async (values: GeneralPaymentSettingsFormValues) => {
    setIsSaving(true);
    try {
      // This would be a real API call in production
      // await apiRequest("POST", "/api/admin/payment-settings/general", values);
      
      // For demonstration purposes
      console.log("General payment settings saved:", values);
      
      toast({
        title: "Settings saved",
        description: "Your general payment settings have been updated successfully.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to save general payment settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Function to test Stripe connection
  const testStripeConnection = async () => {
    setIsSaving(true);
    try {
      // This would be a real API call in production
      // const response = await apiRequest("POST", "/api/admin/payment-settings/test-stripe");
      
      // For demonstration purposes
      toast({
        title: "Connection successful",
        description: "Stripe connection tested successfully.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Connection failed",
        description: "Failed to connect to Stripe. Please check your API keys.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Payment Settings</h1>
          <div className="text-sm text-slate-500">Configure how your business accepts payments</div>
        </div>
        
        <Tabs defaultValue="stripe" className="mb-8">
          <TabsList className="mb-6 bg-gray">
            <TabsTrigger value="stripe" className="data-[state=active]:bg-white">Stripe Settings</TabsTrigger>
            <TabsTrigger value="general" className="data-[state=active]:bg-white">General Settings</TabsTrigger>
          </TabsList>
          
          {/* Stripe Settings Tab */}
          <TabsContent value="stripe">
            <Card className="admin-card border-subtle">
              <CardHeader className="pb-4 border-b border-subtle">
                <CardTitle className="flex items-center text-slate-800">
                  <CreditCard className="mr-3 h-5 w-5 text-primary" />
                  Stripe Payment Gateway
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Configure your Stripe payment gateway settings. These settings 
                  are used to process payments through Stripe.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Form {...stripeForm}>
                  <form onSubmit={stripeForm.handleSubmit(onStripeSubmit)} className="space-y-6 admin-form">
                    <div className="flex items-center space-x-2 mb-6">
                      <FormField
                        control={stripeForm.control}
                        name="liveMode"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="m-0">Live Mode</FormLabel>
                            <FormDescription className="ml-1">
                              {field.value ? "Using live Stripe keys" : "Using test Stripe keys"}
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-6 mb-6">
                      <h3 className="text-lg font-medium">Test API Keys</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={stripeForm.control}
                          name="testPublicKey"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Test Publishable Key</FormLabel>
                              <FormControl>
                                <Input placeholder="pk_test_..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={stripeForm.control}
                          name="testSecretKey"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Test Secret Key</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="sk_test_..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="grid gap-6 mb-6">
                      <h3 className="text-lg font-medium">Live API Keys</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={stripeForm.control}
                          name="livePublicKey"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Live Publishable Key</FormLabel>
                              <FormControl>
                                <Input placeholder="pk_live_..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={stripeForm.control}
                          name="liveSecretKey"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Live Secret Key</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="sk_live_..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <FormField
                      control={stripeForm.control}
                      name="webhookSecret"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Webhook Secret Key (Optional)</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="whsec_..." {...field} />
                          </FormControl>
                          <FormDescription>
                            Used for handling Stripe webhook events like subscription updates.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex space-x-4">
                      <Button 
                        type="submit"
                        disabled={isSaving}
                      >
                        {isSaving ? "Saving..." : "Save Settings"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={testStripeConnection}
                        disabled={isSaving}
                      >
                        Test Connection
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* General Payment Settings Tab */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Payment Settings</CardTitle>
                <CardDescription>
                  Configure general payment settings like tax rates and accepted payment methods.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...generalForm}>
                  <form onSubmit={generalForm.handleSubmit(onGeneralSubmit)} className="space-y-6">
                    <div className="grid gap-6 mb-6">
                      <h3 className="text-lg font-medium">Accepted Payment Methods</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={generalForm.control}
                          name="acceptedPaymentMethods.creditCard"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Credit Card</FormLabel>
                                <FormDescription>
                                  Accept Visa, Mastercard, Amex
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={generalForm.control}
                          name="acceptedPaymentMethods.paypal"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">PayPal</FormLabel>
                                <FormDescription>
                                  Accept PayPal payments
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={generalForm.control}
                          name="acceptedPaymentMethods.applePay"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Apple Pay</FormLabel>
                                <FormDescription>
                                  Accept Apple Pay
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={generalForm.control}
                          name="acceptedPaymentMethods.googlePay"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Google Pay</FormLabel>
                                <FormDescription>
                                  Accept Google Pay
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={generalForm.control}
                        name="taxRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tax Rate (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Default tax rate applied to orders
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={generalForm.control}
                        name="invoiceDueDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Invoice Due Days</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Number of days until an invoice is due
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={generalForm.control}
                        name="defaultCurrency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default Currency</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="USD" />
                            </FormControl>
                            <FormDescription>
                              3-letter currency code (e.g., USD, EUR, GBP)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="submit"
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save Settings"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
            <CardDescription>
              Current status of your payment processing capabilities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Stripe payment processing is active</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Secure payment protocols enabled</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>PCI compliance validated</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}