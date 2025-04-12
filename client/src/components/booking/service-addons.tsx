import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AddOn } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface SelectedAddOn {
  addonId: number;
  quantity: number;
}

interface ServiceAddonsProps {
  onBack: () => void;
  onNext: (data: { selectedAddOns: SelectedAddOn[] }) => void;
}

export function ServiceAddons({ onBack, onNext }: ServiceAddonsProps) {
  const [selectedAddOns, setSelectedAddOns] = useState<{ [key: number]: SelectedAddOn }>({});
  
  const { data: addons, isLoading } = useQuery<AddOn[]>({
    queryKey: ["/api/addons"],
  });

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
      [addonId]: { ...prev[addonId], quantity }
    }));
  };

  const handleContinue = () => {
    onNext({ 
      selectedAddOns: Object.values(selectedAddOns) 
    });
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
      <p className="text-neutral-600 mb-8">Customize your rental with these optional services.</p>
      
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
                  {addon.name}
                </Label>
                <p className={`text-sm mt-1 ${selectedAddOns[addon.id] ? "text-neutral-300" : "text-neutral-600"}`}>
                  {addon.description}
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
                      <SelectTrigger className="w-[280px] max-w-full">
                        <SelectValue placeholder="Select quantity" />
                      </SelectTrigger>
                      <SelectContent>
                        {addon.name.includes("Weight") ? (
                          // Weight options
                          <>
                            <SelectItem value="1">1 Additional Ton (+${(addon.price / 100).toFixed(2)})</SelectItem>
                            <SelectItem value="2">2 Additional Tons (+${((addon.price * 2) / 100).toFixed(2)})</SelectItem>
                            <SelectItem value="3">3 Additional Tons (+${((addon.price * 3) / 100).toFixed(2)})</SelectItem>
                          </>
                        ) : (
                          // Extension options
                          <>
                            <SelectItem value="1">1 Extra Day (+${(addon.price / 100).toFixed(2)})</SelectItem>
                            <SelectItem value="2">2 Extra Days (+${((addon.price * 2) / 100).toFixed(2)})</SelectItem>
                            <SelectItem value="3">3 Extra Days (+${((addon.price * 3) / 100).toFixed(2)})</SelectItem>
                            <SelectItem value="4">4 Extra Days (+${((addon.price * 4) / 100).toFixed(2)})</SelectItem>
                            <SelectItem value="5">5 Extra Days (+${((addon.price * 5) / 100).toFixed(2)})</SelectItem>
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
          onClick={onBack}
          variant="outline"
          className="px-6 py-2 text-[#ffdd33] border-[#ffdd33] hover:bg-[#2c2c2c]"
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
          onClick={handleContinue}
          className="px-6 py-2 bg-[#ffdd33] text-[#2c2c2c] hover:bg-[#ffd700] font-bold"
        >
          Review Order
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
    </div>
  );
}
