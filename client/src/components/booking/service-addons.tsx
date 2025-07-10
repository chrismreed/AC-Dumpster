import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AddOn } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface SelectedAddOn {
  addonId: number;
  quantity: number;
}

interface ServiceAddonsProps {
  onBack: () => void;
  onNext: (data: { selectedAddOns: SelectedAddOn[] }) => void;
  selectedAddOns?: SelectedAddOn[];
  bookingData?: any;
}

export function ServiceAddons({ onBack, onNext, selectedAddOns: initialSelectedAddOns, bookingData }: ServiceAddonsProps) {
  const [selectedAddOns, setSelectedAddOns] = useState<{ [key: number]: SelectedAddOn }>(() => {
    // Initialize with saved data if available
    const initial: { [key: number]: SelectedAddOn } = {};
    if (initialSelectedAddOns) {
      initialSelectedAddOns.forEach(addon => {
        initial[addon.addonId] = addon;
      });
    }
    return initial;
  });
  
  const { data: addons, isLoading } = useQuery<AddOn[]>({
    queryKey: ["/api/addons"],
  });

  // Get zone information for same-day delivery notices
  const { data: zone } = useQuery({
    queryKey: ["/api/zones/lookup"],
    queryFn: async () => {
      if (bookingData?.deliveryZipCode) {
        const response = await apiRequest("POST", "/api/zones/lookup", {
          zipCode: bookingData.deliveryZipCode,
          address: bookingData.deliveryAddress || "",
          city: bookingData.deliveryCity || "",
        });
        return response.json();
      }
      return null;
    },
    enabled: !!bookingData?.deliveryZipCode,
  });

  // Function to check if same-day delivery is available based on cutoff time
  const isSameDayDeliveryAvailable = (addon: AddOn) => {
    if (!addon.cutoffTime) return true; // If no cutoff time set, always available
    
    const now = new Date();
    const [hours, minutes] = addon.cutoffTime.split(':').map(Number);
    const cutoffTime = new Date();
    cutoffTime.setHours(hours, minutes, 0, 0);
    
    return now <= cutoffTime;
  };

  // Function to format time from 24-hour to 12-hour format
  const formatTime = (time24: string) => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Check if today is selected for same-day delivery notice
  const isSelectedDateToday = () => {
    if (!bookingData?.deliveryDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return bookingData.deliveryDate === today;
  };

  // Check if same-day delivery is available
  const getSameDayDeliveryStatus = () => {
    if (!isSelectedDateToday() || !zone?.sameDayDeliveryEnabled) return null;
    
    const now = new Date();
    const cutoffTime = zone.sameDayCutoffTime;
    
    if (cutoffTime) {
      const [hours, minutes] = cutoffTime.split(':').map(Number);
      const cutoff = new Date();
      cutoff.setHours(hours, minutes, 0, 0);
      
      return {
        isAvailable: now <= cutoff,
        cutoffTime: formatTime(cutoffTime),
        fee: zone.sameDayDeliveryFee
      };
    }
    
    return null;
  };

  const sameDayStatus = getSameDayDeliveryStatus();

  // Function to get delivery label for same-day delivery add-ons
  const getDeliveryLabel = (addon: AddOn) => {
    if (addon.name.toLowerCase().includes('same day') && addon.cutoffTime) {
      const isAvailable = isSameDayDeliveryAvailable(addon);
      if (isAvailable) {
        const formattedTime = formatTime(addon.cutoffTime);
        return `Same Day Delivery (order by ${formattedTime})`;
      } else {
        return 'Next Day Delivery';
      }
    }
    return addon.name;
  };

  // Function to get delivery description for same-day delivery add-ons
  const getDeliveryDescription = (addon: AddOn) => {
    if (addon.name.toLowerCase().includes('same day') && addon.cutoffTime) {
      const isAvailable = isSameDayDeliveryAvailable(addon);
      if (isAvailable) {
        return addon.description; // Use original description for same-day
      } else {
        return 'Get your dumpster delivered tomorrow (subject to availability).';
      }
    }
    return addon.description;
  };

  const handleAddonChange = (checked: boolean, addon: AddOn) => {
    if (checked) {
      setSelectedAddOns(prev => ({
        ...prev,
        [addon.id]: { addonId: addon.id, quantity: 1 }
      }));
    } else {
      setSelectedAddOns(prev => {
        const newAddons = { ...prev };
        delete newAddons[addon.id];
        return newAddons;
      });
    }
  };

  const handleQuantityChange = (addonId: number, quantity: number) => {
    setSelectedAddOns(prev => ({
      ...prev,
      [addonId]: { addonId, quantity }
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-neutral-800 mb-6">Service Add-ons</h2>
      <p className="text-neutral-600 mb-6">Customize your rental with these optional services.</p>
      
      {/* Same-day delivery notice */}
      {sameDayStatus && (
        <div className={`mb-8 p-4 rounded-lg border ${
          sameDayStatus.isAvailable 
            ? 'bg-yellow-50 border-yellow-200' 
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center">
            <span className="text-2xl mr-3">
              {sameDayStatus.isAvailable ? '🚚' : '📅'}
            </span>
            <div>
              <h3 className={`font-semibold text-lg ${
                sameDayStatus.isAvailable ? 'text-yellow-800' : 'text-blue-800'
              }`}>
                {sameDayStatus.isAvailable ? 'Same-Day Delivery Available' : 'Next-Day Delivery'}
              </h3>
              <p className={`text-sm ${
                sameDayStatus.isAvailable ? 'text-yellow-700' : 'text-blue-700'
              }`}>
                {sameDayStatus.isAvailable 
                  ? `Order by ${sameDayStatus.cutoffTime} for delivery today. Additional fee: $${(sameDayStatus.fee / 100).toFixed(2)}`
                  : `Same-day cutoff time (${sameDayStatus.cutoffTime}) has passed. Your order will be delivered tomorrow.`
                }
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-6">
        {addons?.filter(addon => addon.isActive).map((addon) => (
          <div 
            key={addon.id} 
            className={`border rounded-lg p-4 transition-all ${
              selectedAddOns[addon.id]
                ? "border-[#ffdd33] bg-[#2c2c2c] text-white" 
                : "border-neutral-200 hover:border-[#ffdd33]"
            }`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-1">
                <Checkbox 
                  id={`addon-${addon.id}`} 
                  checked={!!selectedAddOns[addon.id]}
                  onCheckedChange={(checked) => handleAddonChange(!!checked, addon)}
                />
              </div>
              <div className="ml-3 flex-grow">
                <Label 
                  htmlFor={`addon-${addon.id}`} 
                  className="font-medium cursor-pointer"
                >
                  {getDeliveryLabel(addon)}
                </Label>
                <p className={`text-sm mt-1 ${selectedAddOns[addon.id] ? "text-neutral-300" : "text-neutral-600"}`}>
                  {getDeliveryDescription(addon)}
                </p>
                <p className={`text-sm font-medium mt-2 ${selectedAddOns[addon.id] ? "text-[#ffdd33]" : "text-[#2c2c2c]"}`}>
                  +${(addon.price / 100).toFixed(2)}
                </p>
                
                {/* Quantity selector for weight and extension add-ons */}
                {(addon.name.includes("Weight") || addon.name.includes("Extension")) && 
                 selectedAddOns[addon.id] && (
                  <div className="mt-3">
                    <Select
                      value={selectedAddOns[addon.id]?.quantity.toString()}
                      onValueChange={(value) => handleQuantityChange(addon.id, parseInt(value))}
                    >
                      <SelectTrigger className="w-full bg-white text-gray-900 border-gray-300">
                        <SelectValue placeholder="Select quantity" />
                      </SelectTrigger>
                      <SelectContent>
                        {addon.name.includes("Weight") ? (
                          // Weight options
                          <>
                            <SelectItem value="1">1 Additional Ton (+${(addon.price / 100).toFixed(2)})</SelectItem>
                            <SelectItem value="2">2 Additional Tons (+${((addon.price * 2) / 100).toFixed(2)})</SelectItem>
                            <SelectItem value="3">3 Additional Tons (+${((addon.price * 3) / 100).toFixed(2)})</SelectItem>
                            <SelectItem value="4">4 Additional Tons (+${((addon.price * 4) / 100).toFixed(2)})</SelectItem>
                            <SelectItem value="5">5 Additional Tons (+${((addon.price * 5) / 100).toFixed(2)})</SelectItem>
                          </>
                        ) : (
                          // Extension options
                          <>
                            <SelectItem value="1">1 Additional Day (+${(addon.price / 100).toFixed(2)})</SelectItem>
                            <SelectItem value="2">2 Additional Days (+${((addon.price * 2) / 100).toFixed(2)})</SelectItem>
                            <SelectItem value="3">3 Additional Days (+${((addon.price * 3) / 100).toFixed(2)})</SelectItem>
                            <SelectItem value="4">4 Additional Days (+${((addon.price * 4) / 100).toFixed(2)})</SelectItem>
                            <SelectItem value="5">5 Additional Days (+${((addon.price * 5) / 100).toFixed(2)})</SelectItem>
                            <SelectItem value="6">6 Additional Days (+${((addon.price * 6) / 100).toFixed(2)})</SelectItem>
                            <SelectItem value="7">7 Additional Days (+${((addon.price * 7) / 100).toFixed(2)})</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="bg-white border-[#2c2c2c] text-[#2c2c2c] hover:bg-[#2c2c2c] hover:text-white px-8 py-3"
        >
          ← Back
        </Button>
        <Button
          type="button"
          onClick={() => onNext({ selectedAddOns: Object.values(selectedAddOns) })}
          className="bg-[#ffdd33] text-[#2c2c2c] hover:bg-[#e6c42e] font-medium px-8 py-3"
        >
          Review Order →
        </Button>
      </div>
    </div>
  );
}