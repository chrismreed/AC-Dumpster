'use client';

import { useState, useEffect } from 'react';

interface Addon {
  id: number;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
  cutoffTime?: string;
}

interface ServiceAddonsProps {
  onBack: () => void;
  onNext: (data: { selectedAddOns: any[] }) => void;
  selectedAddOns: any[];
  bookingData?: any;
}

export function ServiceAddons({ onBack, onNext, selectedAddOns, bookingData }: ServiceAddonsProps) {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState<number[]>(
    selectedAddOns?.map(addon => addon.id) || []
  );

  useEffect(() => {
    const fetchAddons = async () => {
      try {
        const response = await fetch('/api/addons');
        if (response.ok) {
          const data = await response.json();
          setAddons(data);
        }
      } catch (error) {
        console.error('Error fetching addons:', error);
      }
    };

    fetchAddons();
  }, []);

  const handleAddonToggle = (addonId: number) => {
    setSelectedAddonIds(prev =>
      prev.includes(addonId)
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
  };

  const handleContinue = () => {
    const selectedAddonObjects = addons.filter(addon =>
      selectedAddonIds.includes(addon.id)
    );
    onNext({ selectedAddOns: selectedAddonObjects });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Service Add-ons</h2>
        <p className="text-muted-foreground">
          Choose any additional services you need. These can be added to your booking for an extra fee.
        </p>
      </div>

      <div className="space-y-4">
        {addons.length === 0 ? (
          <div className="p-8 border rounded-xl bg-muted text-center">
            <p className="text-muted-foreground">No additional services are currently available.</p>
            <p className="text-sm text-muted-foreground mt-2">
              You can proceed to review your order, or additional services may be available for selection later.
            </p>
          </div>
        ) : (
          addons.map((addon) => {
            const isSelected = selectedAddonIds.includes(addon.id);
            return (
              <div
                key={addon.id}
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-border bg-card hover:border-muted-foreground hover:bg-accent'
                }`}
                onClick={() => handleAddonToggle(addon.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {/* Custom checkbox */}
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-primary border-primary'
                            : 'bg-background border-border'
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground">{addon.name}</h3>
                      <span className="text-primary font-bold">
                        ${(addon.price / 100).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-2 ml-8">{addon.description}</p>
                    {addon.cutoffTime && (
                      <p className="text-sm text-orange-400 mt-1 ml-8">
                        ⚠️ Same-day cutoff: {addon.cutoffTime}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {selectedAddonIds.length > 0 && (
          <div className="mt-6 p-4 bg-primary/10 border-2 border-primary rounded-xl">
            <h4 className="font-semibold text-foreground mb-2">Selected Add-ons:</h4>
            <ul className="space-y-1">
              {addons
                .filter(addon => selectedAddonIds.includes(addon.id))
                .map(addon => (
                  <li key={addon.id} className="text-muted-foreground text-sm">
                    • {addon.name} - ${(addon.price / 100).toFixed(2)}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-8 flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 px-6 py-3 border-2 border-border text-foreground rounded-xl hover:bg-accent font-medium transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 font-semibold transition-colors shadow-sm"
        >
          Review Order
        </button>
      </div>
    </div>
  );
}
