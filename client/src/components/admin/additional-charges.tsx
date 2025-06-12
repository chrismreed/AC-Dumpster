import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, DollarSign, Share2, Send, QrCode, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AdditionalCharge, PaymentLink } from "@shared/schema";

const additionalChargeSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.number().min(1, "Amount must be greater than 0"),
});

const sendPaymentLinkSchema = z.object({
  method: z.enum(["email", "sms"]),
  recipient: z.string().min(1, "Recipient is required"),
});

interface AdditionalChargesProps {
  bookingId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

export function AdditionalCharges({ bookingId, customerName, customerEmail, customerPhone }: AdditionalChargesProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [selectedPaymentLink, setSelectedPaymentLink] = useState<PaymentLink | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch additional charges
  const { data: charges = [], isLoading: chargesLoading } = useQuery({
    queryKey: [`/api/bookings/${bookingId}/additional-charges`],
  });

  // Fetch payment links
  const { data: paymentLinks = [], isLoading: linksLoading } = useQuery({
    queryKey: [`/api/bookings/${bookingId}/payment-links`],
  });

  const addChargeForm = useForm({
    resolver: zodResolver(additionalChargeSchema),
    defaultValues: {
      description: "",
      amount: 0,
    },
  });

  const sendLinkForm = useForm({
    resolver: zodResolver(sendPaymentLinkSchema),
    defaultValues: {
      method: "email" as const,
      recipient: customerEmail,
    },
  });

  // Add charge mutation
  const addChargeMutation = useMutation({
    mutationFn: async (data: { description: string; amount: number }) => {
      return apiRequest("POST", `/api/bookings/${bookingId}/additional-charges`, {
        ...data,
        amount: Math.round(data.amount * 100), // Convert to cents
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings", bookingId, "additional-charges"] });
      setIsAddDialogOpen(false);
      addChargeForm.reset();
      toast({
        title: "Success",
        description: "Additional charge added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add charge",
        variant: "destructive",
      });
    },
  });

  // Delete charge mutation
  const deleteChargeMutation = useMutation({
    mutationFn: async (chargeId: number) => {
      return apiRequest("DELETE", `/api/additional-charges/${chargeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings", bookingId, "additional-charges"] });
      toast({
        title: "Success",
        description: "Additional charge deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete charge",
        variant: "destructive",
      });
    },
  });

  // Create payment link mutation
  const createPaymentLinkMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/bookings/${bookingId}/payment-link`);
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings", bookingId, "payment-links"] });
      toast({
        title: "Success",
        description: "Payment link created successfully",
      });
      
      // Copy link to clipboard
      if (data.paymentLink) {
        navigator.clipboard.writeText(data.paymentLink);
        toast({
          title: "Copied",
          description: "Payment link copied to clipboard",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create payment link",
        variant: "destructive",
      });
    },
  });

  // Send payment link mutation
  const sendPaymentLinkMutation = useMutation({
    mutationFn: async (data: { method: string; recipient: string; paymentLinkId: number }) => {
      const response = await apiRequest("POST", `/api/payment-links/${data.paymentLinkId}/send`, {
        method: data.method,
        recipient: data.recipient,
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      setIsSendDialogOpen(false);
      sendLinkForm.reset();
      toast({
        title: "Success",
        description: data.message || "Payment link sent successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send payment link",
        variant: "destructive",
      });
    },
  });

  const unpaidCharges = (charges as AdditionalCharge[]).filter((charge: AdditionalCharge) => !charge.isPaid);
  const totalUnpaid = unpaidCharges.reduce((sum: number, charge: AdditionalCharge) => sum + charge.amount, 0);
  const hasUnpaidCharges = unpaidCharges.length > 0;

  const handleAddCharge = (data: { description: string; amount: number }) => {
    addChargeMutation.mutate(data);
  };

  const handleDeleteCharge = (chargeId: number) => {
    if (confirm("Are you sure you want to delete this charge?")) {
      deleteChargeMutation.mutate(chargeId);
    }
  };

  const handleCreatePaymentLink = () => {
    if (!hasUnpaidCharges) {
      toast({
        title: "No Charges",
        description: "No unpaid charges to create payment link for",
        variant: "destructive",
      });
      return;
    }
    createPaymentLinkMutation.mutate();
  };

  const handleSendPaymentLink = (data: { method: string; recipient: string }) => {
    if (selectedPaymentLink) {
      sendPaymentLinkMutation.mutate({
        ...data,
        paymentLinkId: selectedPaymentLink.id,
      });
    }
  };

  const openSendDialog = (paymentLink: PaymentLink) => {
    setSelectedPaymentLink(paymentLink);
    sendLinkForm.setValue("method", "email");
    sendLinkForm.setValue("recipient", customerEmail);
    setIsSendDialogOpen(true);
  };

  if (chargesLoading || linksLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Additional Charges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Additional Charges
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Charge
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Additional Charge</DialogTitle>
              </DialogHeader>
              <Form {...addChargeForm}>
                <form onSubmit={addChargeForm.handleSubmit(handleAddCharge)} className="space-y-4">
                  <FormField
                    control={addChargeForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter charge description..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addChargeForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={addChargeMutation.isPending}>
                      {addChargeMutation.isPending ? "Adding..." : "Add Charge"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(charges as AdditionalCharge[]).length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No additional charges for this booking
          </p>
        ) : (
          <div className="space-y-3">
            {(charges as AdditionalCharge[]).map((charge: AdditionalCharge) => (
              <div key={charge.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{charge.description}</p>
                  <p className="text-sm text-muted-foreground">
                    Added on {new Date(charge.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-semibold">${(charge.amount / 100).toFixed(2)}</p>
                    <Badge variant={charge.isPaid ? "default" : "secondary"}>
                      {charge.isPaid ? "Paid" : "Unpaid"}
                    </Badge>
                  </div>
                  {!charge.isPaid && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteCharge(charge.id)}
                      disabled={deleteChargeMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {hasUnpaidCharges && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium">Total Unpaid</span>
                </div>
                <span className="font-bold text-lg">${(totalUnpaid / 100).toFixed(2)}</span>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCreatePaymentLink}
                  disabled={createPaymentLinkMutation.isPending}
                  className="flex-1"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  {createPaymentLinkMutation.isPending ? "Creating..." : "Create Payment Link"}
                </Button>
              </div>
            </div>
          </>
        )}

        {(paymentLinks as PaymentLink[]).length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium">Payment Links</h4>
              {(paymentLinks as PaymentLink[]).map((link: PaymentLink) => (
                <div key={link.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      ${(link.totalAmount ? link.totalAmount / 100 : 0).toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Created {new Date(link.createdAt).toLocaleDateString()}
                    </p>
                    <Badge variant={link.status === "paid" ? "default" : "secondary"}>
                      {link.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openSendDialog(link)}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(`Payment link copied for booking #${bookingId}`);
                        toast({
                          title: "Copied",
                          description: "Payment link info copied to clipboard",
                        });
                      }}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Send Payment Link Dialog */}
        <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Payment Link</DialogTitle>
            </DialogHeader>
            <Form {...sendLinkForm}>
              <form onSubmit={sendLinkForm.handleSubmit(handleSendPaymentLink)} className="space-y-4">
                <FormField
                  control={sendLinkForm.control}
                  name="method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Send Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={sendLinkForm.control}
                  name="recipient"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {sendLinkForm.watch("method") === "email" ? "Email Address" : "Phone Number"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            sendLinkForm.watch("method") === "email" 
                              ? "customer@example.com" 
                              : "+1234567890"
                          }
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsSendDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={sendPaymentLinkMutation.isPending}>
                    {sendPaymentLinkMutation.isPending ? "Sending..." : "Send Link"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}