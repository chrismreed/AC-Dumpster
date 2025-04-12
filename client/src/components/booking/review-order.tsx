import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dumpster, AddOn, ServiceZone, RentalDuration } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PaymentForm } from "./payment-form";

// Form schema for contact information
const contactSchema = z.object({
  fullName: z.string().min(3, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  termsAgreed: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the terms and conditions" }),
  }),
  paymentMethod: z.enum(["card", "paypal"]),
});

type ContactFormValues = z.infer<typeof contactSchema>;

interface ReviewOrderProps {
  bookingData: any;
  onBack: () => void;
  onSubmit: (data: any) => void;
}

export function ReviewOrder({ bookingData, onBack, onSubmit }: ReviewOrderProps) {
  const { toast } = useToast();
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Create form
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      termsAgreed: false,
      paymentMethod: "card",
    },
  });

  // Fetch related data for display
  const { data: dumpsters } = useQuery<Dumpster[]>({
    queryKey: ["/api/dumpsters"],
  });

  const { data: durations } = useQuery<RentalDuration[]>({
    queryKey: ["/api/durations"],
  });

  const { data: addons } = useQuery<AddOn[]>({
    queryKey: ["/api/addons"],
  });

  const { data: zones } = useQuery<ServiceZone[]>({
    queryKey: ["/api/zones"],
  });

  // Calculate price based on selections
  useEffect(() => {
    if (bookingData.dumpsterId && bookingData.rentalDurationId && bookingData.deliveryZipCode) {
      const calculatePriceMutation = async () => {
        try {
          const response = await apiRequest("POST", "/api/calculate-price", {
            dumpsterId: bookingData.dumpsterId,
            rentalDurationId: bookingData.rentalDurationId,
            deliveryZipCode: bookingData.deliveryZipCode,
            selectedAddOns: bookingData.selectedAddOns || [],
          });
          const data = await response.json();
          setCalculatedPrice(data.totalPrice);
        } catch (error) {
          console.error("Error calculating price:", error);
          toast({
            title: "Error",
            description: "Failed to calculate price. Please try again.",
            variant: "destructive",
          });
        }
      };

      calculatePriceMutation();
    }
  }, [bookingData, toast]);

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/bookings", data);
      return response.json();
    },
    onSuccess: (data) => {
      setBookingId(data.id);
      createPaymentIntent(data.id, calculatedPrice!);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create booking: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Create payment intent mutation
  const createPaymentIntentMutation = useMutation({
    mutationFn: async ({ bookingId, amount }: { bookingId: number; amount: number }) => {
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        bookingId,
        amount,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to initialize payment: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const createPaymentIntent = (bookingId: number, amount: number) => {
    createPaymentIntentMutation.mutate({ bookingId, amount });
  };

  const handleFormSubmit = (formData: ContactFormValues) => {
    if (!calculatedPrice) {
      toast({
        title: "Error",
        description: "Price calculation failed. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Create complete booking data
    const completeBookingData = {
      ...bookingData,
      customerName: formData.fullName,
      customerEmail: formData.email,
      customerPhone: formData.phone,
      totalPrice: calculatedPrice,
      paymentStatus: "pending",
      status: "scheduled",
    };

    // Create booking
    createBookingMutation.mutate(completeBookingData);
  };

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    toast({
      title: "Payment Successful!",
      description: "Your dumpster rental has been booked successfully.",
    });
    
    // Reset the form and go back to step 1
    onSubmit({ paymentSuccess: true, bookingId });
  };

  // Get display data
  const selectedDumpster = dumpsters?.find(d => d.id === bookingData.dumpsterId);
  const selectedDuration = durations?.find(d => d.id === bookingData.rentalDurationId);
  const selectedZone = zones?.find(z => 
    z.zipCodes.split(',').includes(bookingData.deliveryZipCode)
  );

  // Calculate addons total
  const calculateAddonsTotal = () => {
    if (!addons || !bookingData.selectedAddOns) return 0;
    
    return bookingData.selectedAddOns.reduce((total: number, item: any) => {
      const addon = addons.find(a => a.id === item.addonId);
      if (addon) {
        return total + (addon.price * (item.quantity || 1));
      }
      return total;
    }, 0);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-neutral-800 mb-6">Review & Payment</h2>
      <p className="text-neutral-600 mb-8">Please review your order and enter payment details to complete your booking.</p>
      
      {paymentSuccess ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <svg
            className="w-16 h-16 text-green-500 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <h3 className="text-xl font-bold text-green-800 mb-2">Payment Successful!</h3>
          <p className="text-green-700 mb-4">
            Your dumpster rental has been booked successfully. You will receive a confirmation email shortly.
          </p>
          <p className="text-green-700 mb-4">
            Booking ID: <span className="font-bold">#{bookingId}</span>
          </p>
          <Button 
            onClick={() => onSubmit({ paymentSuccess: true, bookingId })}
            className="mt-4"
          >
            Book Another Dumpster
          </Button>
        </div>
      ) : (
        <>
          <div className="bg-neutral-50 rounded-lg p-6 mb-8">
            <h3 className="font-medium text-lg mb-4">Order Summary</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between pb-3 border-b border-neutral-200">
                <div>
                  <p className="font-medium">{selectedDumpster?.name || "Selected Dumpster"}</p>
                  <p className="text-sm text-neutral-600">{selectedDuration?.days || 0} Days Rental</p>
                </div>
                <span className="font-medium">${((selectedDumpster?.basePrice || 0) / 100).toFixed(2)}</span>
              </div>
              
              {selectedDuration && selectedDuration.additionalPrice > 0 && (
                <div className="flex justify-between pb-3 border-b border-neutral-200">
                  <div>
                    <p className="font-medium">Duration Extension</p>
                    <p className="text-sm text-neutral-600">+${(selectedDuration.additionalPrice / 100).toFixed(2)}</p>
                  </div>
                  <span className="font-medium">${(selectedDuration.additionalPrice / 100).toFixed(2)}</span>
                </div>
              )}
              
              {bookingData.selectedAddOns && bookingData.selectedAddOns.length > 0 && (
                <div className="flex justify-between pb-3 border-b border-neutral-200">
                  <div>
                    <p className="font-medium">Selected Add-ons</p>
                    <div className="text-sm text-neutral-600 space-y-1">
                      {bookingData.selectedAddOns.map((item: any, index: number) => {
                        const addon = addons?.find(a => a.id === item.addonId);
                        if (!addon) return null;
                        
                        return (
                          <p key={index}>
                            {addon.name} 
                            {item.quantity > 1 ? ` (x${item.quantity})` : ''} 
                            (+${((addon.price * (item.quantity || 1)) / 100).toFixed(2)})
                          </p>
                        );
                      })}
                    </div>
                  </div>
                  <span className="font-medium">${(calculateAddonsTotal() / 100).toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between pb-3 border-b border-neutral-200">
                <div>
                  <p className="font-medium">Delivery Fee</p>
                  <p className="text-sm text-neutral-600">Based on your location</p>
                </div>
                <span className="font-medium">${((selectedZone?.deliveryFee || 0) / 100).toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-lg font-semibold pt-2">
                <span>Total</span>
                <span className="text-primary">
                  ${calculatedPrice ? (calculatedPrice / 100).toFixed(2) : "Calculating..."}
                </span>
              </div>
            </div>
          </div>
          
          {!clientSecret ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                <div>
                  <h3 className="font-medium text-lg mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input type="tel" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-lg mb-4">Payment Method</h3>
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex space-x-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="card" id="payment-card" />
                              <FormLabel htmlFor="payment-card" className="cursor-pointer">
                                Credit/Debit Card
                              </FormLabel>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="paypal" id="payment-paypal" />
                              <FormLabel htmlFor="payment-paypal" className="cursor-pointer">
                                PayPal
                              </FormLabel>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="termsAgreed"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <div className="mt-10 flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                    className="px-6 py-3"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5 mr-2" 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="px-8 py-3"
                    disabled={createBookingMutation.isPending}
                  >
                    {createBookingMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Proceed to Payment
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div>
              <PaymentForm 
                clientSecret={clientSecret} 
                onSuccess={handlePaymentSuccess} 
              />
              <div className="mt-4 flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  className="px-6 py-3"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 mr-2" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                  Back
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
