import { useState, useEffect } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Load Stripe outside of component to avoid recreating instance on renders
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLIC_KEY || ""
);

interface PaymentFormContentProps {
  clientSecret: string;
  onSuccess: () => void;
}

function PaymentFormContent({ clientSecret, onSuccess }: PaymentFormContentProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!stripe) {
      return;
    }

    // Check for payment result from redirect
    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      if (!paymentIntent) return;
      
      switch (paymentIntent.status) {
        case "succeeded":
          setPaymentStatus("success");
          toast({
            title: "Payment succeeded!",
            description: "Thank you for your payment.",
          });
          onSuccess();
          break;
        case "processing":
          setPaymentStatus("processing");
          toast({
            title: "Payment processing",
            description: "Your payment is processing.",
          });
          break;
        case "requires_payment_method":
          setPaymentStatus("failed");
          toast({
            title: "Payment failed",
            description: "Please try again with a different payment method.",
            variant: "destructive",
          });
          break;
        default:
          setPaymentStatus("failed");
          toast({
            title: "Something went wrong",
            description: "Please try again later.",
            variant: "destructive",
          });
          break;
      }
    });
  }, [stripe, toast, onSuccess]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return;
    }

    setIsLoading(true);

    try {
      console.log("Confirming payment with Stripe...");
      console.log("Using Stripe public key:", import.meta.env.VITE_STRIPE_PUBLIC_KEY?.substring(0, 8) + "...");
      
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // Redirect to the same page to handle the payment result
          return_url: window.location.origin + window.location.pathname,
        },
        redirect: 'if_required',
      });
      
      console.log("Stripe confirmPayment result:", JSON.stringify(result));
      const { error, paymentIntent } = result;
      
      // If we get a successful payment
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log("Payment succeeded!");
        setPaymentStatus("success");
        toast({
          title: "Payment successful!",
          description: "Your booking is confirmed.",
        });
        onSuccess();
        return;
      }

      if (error) {
        // Handle Stripe specific errors with better messages
        if (error.type === "card_error" || error.type === "validation_error") {
          const errorMessage = getCardErrorMessage(error.code) || error.message || "Your card was declined.";
          toast({
            title: "Payment Failed",
            description: errorMessage,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Payment Error",
            description: "An unexpected error occurred. Please try again with a different payment method.",
            variant: "destructive",
          });
        }
        setPaymentStatus("failed");
        // Don't call onSuccess for failed payments
      }
    } catch (error) {
      console.error("Payment submission error:", error);
      toast({
        title: "Payment Error",
        description: "There was a problem processing your payment. Please try again or use a different card.",
        variant: "destructive",
      });
      setPaymentStatus("failed");
      // Don't call onSuccess for errors
    }

    setIsLoading(false);
  };
  
  // Helper function to provide more user-friendly error messages
  const getCardErrorMessage = (code?: string): string | undefined => {
    if (!code) return undefined;
    
    const errorMessages: Record<string, string> = {
      'card_declined': "Your card was declined. Please try another payment method.",
      'expired_card': "Your card has expired. Please use a different card.",
      'incorrect_cvc': "The security code (CVC) is incorrect. Please check and try again.",
      'incorrect_zip': "The ZIP/postal code is incorrect. Please check and try again.",
      'insufficient_funds': "Your card has insufficient funds. Please use a different payment method.",
      'invalid_expiry_month': "The expiration month is invalid. Please check and try again.",
      'invalid_expiry_year': "The expiration year is invalid. Please check and try again.",
      'invalid_number': "Your card number is invalid. Please check and try again.",
      'processing_error': "An error occurred while processing your card. Please try again."
    };
    
    return errorMessages[code] || undefined;
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      <div className="bg-white p-6 rounded-lg border border-neutral-200">
        <h3 className="text-lg font-medium mb-4">Payment Information</h3>
        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-md text-blue-800 text-sm">
          <p>Test Mode: Use card number <strong>4242 4242 4242 4242</strong> for successful payments.</p>
          <p className="mt-1">Use any future expiration date, any 3-digit CVC, and any 5-digit ZIP code.</p>
        </div>
        {paymentStatus === "failed" && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-md text-red-800 text-sm">
            <p>Payment failed. Please check your card details and try again.</p>
          </div>
        )}
        <PaymentElement id="payment-element" />
      </div>
      <div className="flex items-center justify-center">
        <Button
          type="submit"
          className="px-8 py-3 w-full md:w-auto"
          disabled={!stripe || !elements || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : paymentStatus === "success" ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Payment Complete
            </>
          ) : (
            "Complete Payment"
          )}
        </Button>
      </div>
    </form>
  );
}

interface PaymentFormProps {
  clientSecret: string;
  onSuccess: () => void;
}

export function PaymentForm({ clientSecret, onSuccess }: PaymentFormProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Make sure we set the component to ready state
    setIsReady(true);
  }, []);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading payment form...</span>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const, // Type assertion to fix TS error
      variables: {
        colorPrimary: '#2563EB',
        colorBackground: '#ffffff',
        colorText: '#1F2937',
        colorDanger: '#ef4444',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentFormContent clientSecret={clientSecret} onSuccess={onSuccess} />
    </Elements>
  );
}
