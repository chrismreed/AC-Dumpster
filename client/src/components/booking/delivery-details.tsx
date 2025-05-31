import { useState, useEffect, useRef } from "react";
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
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Dumpster, Booking } from "@shared/schema";

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
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const datePickerRef = useRef<HTMLButtonElement>(null);

  // Fetch dumpster inventory to check availability
  const { data: dumpsters, isLoading: isLoadingDumpsters } = useQuery({
    queryKey: ["/api/dumpsters"],
  });

  // Fetch existing bookings to determine availability (public endpoint)
  const { data: bookings, isLoading: isLoadingBookings } = useQuery({
    queryKey: ["/api/availability"],
  });

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

  // Calculate minimum delivery date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Calculate available dates based on dumpster inventory and existing bookings
  useEffect(() => {
    if (!dumpsters) return;
    
    setIsLoadingAvailability(true);
    
    // Helper function to check if a date has available dumpsters
    const isDumpsterAvailable = (date: Date) => {
      const dateStr = date.toISOString().split('T')[0];
      
      // If we don't have dumpsters data yet, don't show as available
      if (!Array.isArray(dumpsters) || dumpsters.length === 0) {
        return false;
      }
      
      // Count total dumpsters across all types
      const totalDumpsters = dumpsters.reduce((total: number, dumpster: Dumpster) => {
        const availability = dumpster.availability || 1;
        return total + availability;
      }, 0);
      
      // Count booked dumpsters for this date
      const bookedOnDate = Array.isArray(bookings) 
        ? bookings.filter((booking: any) => {
            if (!booking.deliveryDate) return false;
            const bookingDate = new Date(booking.deliveryDate).toISOString().split('T')[0];
            return bookingDate === dateStr;
          }).length
        : 0;
      
      // Return true if there are available dumpsters
      return totalDumpsters > bookedOnDate;
    };
    
    // Generate next 30 days and filter by availability
    const dates: Date[] = [];
    const endDate = new Date();
    endDate.setDate(tomorrow.getDate() + 30);
    
    for (let d = new Date(tomorrow); d <= endDate; d.setDate(d.getDate() + 1)) {
      if (isDumpsterAvailable(new Date(d))) {
        dates.push(new Date(d));
      }
    }
    
    setAvailableDates(dates);
    setIsLoadingAvailability(false);
  }, [dumpsters, bookings, tomorrow]);

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
                <FormItem className="flex flex-col">
                  <FormLabel>Delivery Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild ref={datePickerRef}>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(new Date(field.value), "PPP")
                          ) : (
                            <span>Select a delivery date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      {isLoadingAvailability || isLoadingDumpsters || isLoadingBookings ? (
                        <div className="p-6 flex items-center justify-center">
                          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mr-2" />
                          <span>Loading available dates...</span>
                        </div>
                      ) : availableDates.length > 0 ? (
                        <CalendarComponent
                          mode="single"
                          selected={field.value ? (() => {
                            // Create a date object for display in the calendar
                            // Log the current value for debugging
                            console.log("Current field value:", field.value);
                            const dateParts = field.value.split('-');
                            const year = parseInt(dateParts[0]);
                            const month = parseInt(dateParts[1]) - 1; // JS months are 0-indexed
                            const day = parseInt(dateParts[2]);
                            // Create date at noon to avoid timezone issues
                            const selectedDate = new Date(year, month, day, 12, 0, 0, 0);
                            console.log("Display date in calendar:", selectedDate);
                            return selectedDate;
                          })() : undefined}
                          onSelect={(date) => {
                            if (date) {
                              // The fundamental issue is that new Date() in JS uses the timezone offset
                              // We need to create a date that doesn't shift when converted to ISO string
                              
                              // Create a date string in YYYY-MM-DD format from the selected date's components
                              const selectedDay = date.getDate();
                              const selectedMonth = date.getMonth() + 1;
                              const selectedYear = date.getFullYear();
                              
                              // Log the raw selected date for debugging
                              console.log('User clicked on date:', date);
                              console.log(`Raw selection - Year: ${selectedYear}, Month: ${selectedMonth}, Day: ${selectedDay}`);
                              
                              // Format the date parts with leading zeros as needed
                              const formattedDay = String(selectedDay).padStart(2, '0');
                              const formattedMonth = String(selectedMonth).padStart(2, '0');
                              
                              // Create the final date string in YYYY-MM-DD format
                              const formattedDate = `${selectedYear}-${formattedMonth}-${formattedDay}`;
                              
                              // Log the final formatted date
                              console.log(`Final formatted date: ${formattedDate}`);
                              
                              // Update the form field with this exact string value
                              field.onChange(formattedDate);
                            }
                          }}
                          disabled={(date) => {
                            return !availableDates.some(
                              availableDate => 
                                availableDate.getDate() === date.getDate() && 
                                availableDate.getMonth() === date.getMonth() && 
                                availableDate.getFullYear() === date.getFullYear()
                            );
                          }}
                          initialFocus
                        />
                      ) : (
                        <div className="p-6 text-center">
                          <p className="text-sm text-muted-foreground">No available dates found.</p>
                          <p className="text-xs mt-1 text-muted-foreground">All dumpsters are booked.</p>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                  {availableDates.length === 0 && !isLoadingAvailability && !isLoadingDumpsters && !isLoadingBookings && (
                    <p className="text-xs text-red-500 mt-1">No dumpsters available for the next 30 days.</p>
                  )}
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
