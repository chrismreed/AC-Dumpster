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
import { GooglePlacesAutocomplete } from "./google-places-autocomplete";
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
  initialData?: any;
  selectedDumpsterId?: number;
  selectedPricingId?: number;
}

export function DeliveryDetails({ onBack, onNext, initialData, selectedDumpsterId, selectedPricingId }: DeliveryDetailsProps) {
  const { toast } = useToast();
  const [isValidatingZip, setIsValidatingZip] = useState(false);
  const [validatedZone, setValidatedZone] = useState<any>(null);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLButtonElement>(null);

  // Fetch dumpster inventory to check availability
  const { data: dumpsters, isLoading: isLoadingDumpsters } = useQuery({
    queryKey: ["/api/dumpsters"],
  });

  // Fetch existing bookings to determine availability (public endpoint)
  const { data: bookings, isLoading: isLoadingBookings } = useQuery({
    queryKey: ["/api/availability"],
  });

  // Fetch pricing details to calculate pickup date
  const { data: pricingOption } = useQuery({
    queryKey: [`/api/dumpster-pricing/item/${selectedPricingId}`],
    enabled: !!selectedPricingId,
  });



  // Initialize form with saved data if available
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      deliveryAddress: initialData?.deliveryAddress || "",
      deliveryCity: initialData?.deliveryCity || "",
      deliveryZipCode: initialData?.deliveryZipCode || "",
      deliveryInstructions: initialData?.deliveryInstructions || "",
      placementLocation: initialData?.placementLocation || "driveway",
      deliveryDate: initialData?.deliveryDate || "",
      deliveryTimePreference: initialData?.deliveryTimePreference || "anytime",
    },
  });

  // Calculate available dates based on specific dumpster availability
  useEffect(() => {
    if (!selectedDumpsterId || !selectedPricingId) {
      // If no dumpster is selected, allow all dates initially
      const today = new Date();
      const dates: Date[] = [];
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 30);
      
      for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d));
      }
      setAvailableDates(dates);
      return;
    }
    
    setIsLoadingAvailability(true);
    
    // Calculate available dates for the next 30 days using batch API
    const checkAvailabilityForDates = async () => {
      const today = new Date();
      const availableDatesArray: Date[] = [];
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 30);
      
      // Generate array of date strings
      const dateStrings: string[] = [];
      for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        dateStrings.push(dateStr);
      }
      
      try {
        const response = await apiRequest("POST", "/api/check-availability-batch", {
          dumpsterId: selectedDumpsterId,
          dates: dateStrings,
          pricingId: selectedPricingId
        });
        
        const data = await response.json();
        
        data.results.forEach((result: { date: string; available: boolean }) => {
          if (result.available) {
            // Parse date string back to Date object
            const dateParts = result.date.split('-');
            const year = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1; // JS months are 0-indexed
            const day = parseInt(dateParts[2]);
            const dateObj = new Date(year, month, day, 12, 0, 0, 0);
            availableDatesArray.push(dateObj);
          }
        });
        
        setAvailableDates(availableDatesArray);
      } catch (error) {
        console.error("Error checking availability:", error);
        toast({
          title: "Availability Check Failed",
          description: "Unable to load available dates. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingAvailability(false);
      }
    };
    
    checkAvailabilityForDates();
  }, [selectedDumpsterId, selectedPricingId, toast]);

  const validateServiceArea = async (coordinates?: { lat: number; lng: number }) => {
    const zipCode = form.getValues("deliveryZipCode");
    const address = form.getValues("deliveryAddress");
    const city = form.getValues("deliveryCity");
    
    if (zipCode && zipCode.length === 5) {
      setIsValidatingZip(true);
      try {
        const requestBody: any = {
          zipCode,
          address,
          city
        };

        // Include coordinates if available from Google Places
        if (coordinates) {
          requestBody.lat = coordinates.lat;
          requestBody.lng = coordinates.lng;
        }

        const response = await apiRequest("POST", "/api/zones/lookup", requestBody);
        const zoneData = await response.json();
        setValidatedZone(zoneData);
        setIsValidatingZip(false);
        // Clear any previous errors
        form.clearErrors("deliveryZipCode");
      } catch (error) {
        setIsValidatingZip(false);
        setValidatedZone(null);
        toast({
          title: "Service Area Check",
          description: "We don't currently service this area. Please try another location.",
          variant: "destructive",
        });
        form.setError("deliveryZipCode", {
          type: "manual",
          message: "Service not available in this area",
        });
      }
    }
  };

  const handleZipCodeChange = async (zipCode: string) => {
    if (zipCode.length === 5) {
      await validateServiceArea();
    }
  };

  const handlePlaceSelect = (place: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates: { lat: number; lng: number };
  }) => {
    // Update form fields with the selected place data
    form.setValue("deliveryAddress", place.address);
    form.setValue("deliveryCity", place.city);
    form.setValue("deliveryZipCode", place.zipCode);

    // Validate the service area with coordinates for more accurate geofencing
    if (place.zipCode && place.zipCode.length === 5) {
      setTimeout(() => validateServiceArea(place.coordinates), 500);
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
                  <GooglePlacesAutocomplete
                    value={field.value}
                    onChange={field.onChange}
                    onPlaceSelect={handlePlaceSelect}
                    placeholder="Start typing your address..."
                  />
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
                    <Input 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        const zipCode = form.getValues("deliveryZipCode");
                        if (zipCode && zipCode.length === 5) {
                          setTimeout(validateServiceArea, 500);
                        }
                      }}
                    />
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
                  {validatedZone && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-800">
                        ✓ Service available in <span className="font-medium">{validatedZone.name}</span>
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Base delivery fee: ${(validatedZone.deliveryFee / 100).toFixed(2)}
                      </p>
                    </div>
                  )}
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
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
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
                            (() => {
                              // Parse the YYYY-MM-DD format directly to avoid timezone issues
                              const dateParts = field.value.split('-');
                              const year = parseInt(dateParts[0]);
                              const month = parseInt(dateParts[1]) - 1; // JS months are 0-indexed
                              const day = parseInt(dateParts[2]);
                              // Create date at noon to avoid timezone shifting
                              const displayDate = new Date(year, month, day, 12, 0, 0, 0);
                              return format(displayDate, "PPP");
                            })()
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
                        <div>
                          <CalendarComponent
                            mode="single"
                            selected={field.value ? (() => {
                              // Create a date object for display in the calendar
                              const dateParts = field.value.split('-');
                              const year = parseInt(dateParts[0]);
                              const month = parseInt(dateParts[1]) - 1; // JS months are 0-indexed
                              const day = parseInt(dateParts[2]);
                              // Create date at noon to avoid timezone issues
                              const selectedDate = new Date(year, month, day, 12, 0, 0, 0);
                              return selectedDate;
                            })() : undefined}
                            onSelect={(date) => {
                              if (date) {
                                // Create a date string in YYYY-MM-DD format from the selected date's components
                                const selectedDay = date.getDate();
                                const selectedMonth = date.getMonth() + 1;
                                const selectedYear = date.getFullYear();
                                
                                // Format the date parts with leading zeros as needed
                                const formattedDay = String(selectedDay).padStart(2, '0');
                                const formattedMonth = String(selectedMonth).padStart(2, '0');
                                
                                // Create the final date string in YYYY-MM-DD format
                                const formattedDate = `${selectedYear}-${formattedMonth}-${formattedDay}`;
                                
                                // Update the form field with this exact string value
                                field.onChange(formattedDate);
                                
                                // Close the date picker after selection
                                setIsDatePickerOpen(false);
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
                            modifiers={{
                              rentalPeriod: field.value && pricingOption ? (() => {
                                // Calculate the rental period dates to highlight
                                const dateParts = field.value.split('-');
                                const year = parseInt(dateParts[0]);
                                const month = parseInt(dateParts[1]) - 1;
                                const day = parseInt(dateParts[2]);
                                const deliveryDate = new Date(year, month, day, 12, 0, 0, 0);
                                
                                const rentalDates = [];
                                for (let i = 0; i < pricingOption.days; i++) {
                                  const date = new Date(deliveryDate);
                                  date.setDate(date.getDate() + i);
                                  rentalDates.push(date);
                                }
                                return rentalDates;
                              })() : []
                            }}
                            modifiersStyles={{
                              rentalPeriod: {
                                backgroundColor: '#dbeafe',
                                color: '#1e40af',
                                fontWeight: '600',
                                border: '1px solid #3b82f6'
                              }
                            }}
                            initialFocus
                          />
                          {field.value && pricingOption && (
                            <div className="p-3 border-t">
                              <div className="flex items-center gap-2 text-xs text-neutral-600">
                                <div className="flex items-center gap-1">
                                  <div className="w-3 h-3 bg-blue-100 border border-blue-400 rounded"></div>
                                  <span>Rental period ({pricingOption.days} day{pricingOption.days === 1 ? '' : 's'})</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
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
                  {/* Show pickup date when delivery date is selected */}
                  {field.value && pricingOption && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-800">Rental Period</p>
                      <div className="text-xs text-blue-600 mt-1">
                        <p><strong>Delivery:</strong> {(() => {
                          const dateParts = field.value.split('-');
                          const year = parseInt(dateParts[0]);
                          const month = parseInt(dateParts[1]) - 1;
                          const day = parseInt(dateParts[2]);
                          const deliveryDate = new Date(year, month, day, 12, 0, 0, 0);
                          return format(deliveryDate, "MMM d, yyyy");
                        })()}</p>
                        <p><strong>Pickup:</strong> {(() => {
                          const dateParts = field.value.split('-');
                          const year = parseInt(dateParts[0]);
                          const month = parseInt(dateParts[1]) - 1;
                          const day = parseInt(dateParts[2]);
                          const deliveryDate = new Date(year, month, day, 12, 0, 0, 0);
                          const pickupDate = new Date(deliveryDate);
                          pickupDate.setDate(pickupDate.getDate() + pricingOption.days);
                          return format(pickupDate, "MMM d, yyyy");
                        })()} ({pricingOption.days} day{pricingOption.days === 1 ? '' : 's'} rental)</p>
                      </div>
                    </div>
                  )}
                  {/* Same-day delivery notice */}
                  {field.value && (() => {
                    const today = new Date().toISOString().split('T')[0];
                    const isToday = field.value === today;
                    if (isToday && validatedZone?.sameDayDeliveryEnabled) {
                      const now = new Date();
                      const cutoffTime = validatedZone.sameDayCutoffTime;
                      
                      if (cutoffTime) {
                        const [hours, minutes] = cutoffTime.split(':').map(Number);
                        const cutoff = new Date();
                        cutoff.setHours(hours, minutes, 0, 0);
                        
                        const formatTime = (time24: string) => {
                          const [h, m] = time24.split(':').map(Number);
                          const period = h >= 12 ? 'PM' : 'AM';
                          const h12 = h % 12 || 12;
                          return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
                        };
                        
                        if (now <= cutoff) {
                          return (
                            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                              <p className="text-sm text-yellow-800 font-medium">
                                🚚 Same-Day Delivery Available
                              </p>
                              <p className="text-xs text-yellow-700 mt-1">
                                Order by {formatTime(cutoffTime)} for delivery today. Additional fee: ${(validatedZone.sameDayDeliveryFee / 100).toFixed(2)}
                              </p>
                            </div>
                          );
                        } else {
                          return (
                            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                              <p className="text-sm text-blue-800">
                                📅 Next-Day Delivery
                              </p>
                              <p className="text-xs text-blue-700 mt-1">
                                Same-day cutoff time ({formatTime(cutoffTime)}) has passed. Your order will be delivered tomorrow.
                              </p>
                            </div>
                          );
                        }
                      }
                    }
                    return null;
                  })()}
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
