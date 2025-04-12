import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define form schema
const formSchema = z.object({
  deliveryAddress: z.string().min(1, "Address is required"),
  deliveryCity: z.string().min(1, "City is required"),
  deliveryZipCode: z.string().min(5, "Valid ZIP code is required").max(10),
  deliveryInstructions: z.string().optional(),
  placementLocation: z.enum(["driveway", "street", "yard", "other"]),
  deliveryDate: z.string().min(1, "Delivery date is required"),
  deliveryTimePreference: z.enum(["morning", "afternoon", "evening", "anytime"]),
});

type FormValues = z.infer<typeof formSchema>;

interface DeliveryDetailsProps {
  onBack: () => void;
  onNext: (data: FormValues) => void;
}

export function DeliveryDetails({ onBack, onNext }: DeliveryDetailsProps) {
  const { toast } = useToast();
  const [isValidatingZip, setIsValidatingZip] = useState(false);

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      deliveryAddress: "",
      deliveryCity: "",
      deliveryZipCode: "",
      deliveryInstructions: "",
      placementLocation: "driveway",
      deliveryDate: "",
      deliveryTimePreference: "anytime",
    },
  });

  const handleZipCodeChange = async (zipCode: string) => {
    if (zipCode.length === 5) {
      setIsValidatingZip(true);
      try {
        await apiRequest("GET", `/api/zones/zipcode/${zipCode}`);
        setIsValidatingZip(false);
      } catch (error) {
        setIsValidatingZip(false);
        toast({
          title: "Service Area Check",
          description: "We don't currently service this ZIP code. Please try another area.",
          variant: "destructive",
        });
        form.setError("deliveryZipCode", {
          type: "manual",
          message: "Service not available in this area",
        });
      }
    }
  };

  // Calculate minimum delivery date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const onSubmit = (data: FormValues) => {
    onNext(data);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-neutral-800 mb-6">Delivery Details</h2>
      <p className="text-neutral-600 mb-8">Let us know where and when you need your dumpster.</p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="deliveryAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delivery Address</FormLabel>
                <FormControl>
                  <Input placeholder="Street Address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="deliveryCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="deliveryZipCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ZIP Code</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        handleZipCodeChange(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                  {isValidatingZip && <p className="text-xs text-blue-500">Checking service availability...</p>}
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="deliveryInstructions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delivery Instructions (optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="E.g., Place the dumpster on the left side of the driveway" 
                    className="resize-none" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200">
            <FormField
              control={form.control}
              name="placementLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Delivery Location</FormLabel>
                  <p className="text-sm text-neutral-600 mb-3">Where should we place the dumpster?</p>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-1 md:grid-cols-2 gap-3"
                    >
                      <div className="flex items-center">
                        <RadioGroupItem value="driveway" id="location-driveway" />
                        <label htmlFor="location-driveway" className="text-sm cursor-pointer ml-2">Driveway</label>
                      </div>
                      <div className="flex items-center">
                        <RadioGroupItem value="street" id="location-street" />
                        <label htmlFor="location-street" className="text-sm cursor-pointer ml-2">Street (permit may be required)</label>
                      </div>
                      <div className="flex items-center">
                        <RadioGroupItem value="yard" id="location-yard" />
                        <label htmlFor="location-yard" className="text-sm cursor-pointer ml-2">Front Yard</label>
                      </div>
                      <div className="flex items-center">
                        <RadioGroupItem value="other" id="location-other" />
                        <label htmlFor="location-other" className="text-sm cursor-pointer ml-2">Other (specify in instructions)</label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="deliveryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Date</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      min={minDate}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="deliveryTimePreference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Time</FormLabel>
                  <FormControl>
                    <select
                      className="w-full px-4 py-3 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      {...field}
                    >
                      <option value="morning">Morning (8am - 12pm)</option>
                      <option value="afternoon">Afternoon (12pm - 4pm)</option>
                      <option value="evening">Evening (4pm - 7pm)</option>
                      <option value="anytime">Anytime</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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
              className="px-6 py-3"
            >
              Continue
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 ml-2" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" 
                  clipRule="evenodd" 
                />
              </svg>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
