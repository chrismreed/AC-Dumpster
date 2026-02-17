'use client';

import { useState, useCallback } from 'react';
import { GooglePlacesAutocomplete } from '@/components/google-places-autocomplete';
import { AvailabilityCalendar } from '@/components/ui/availability-calendar';
import { checkServiceZone, AddressInfo } from '@/lib/service-zone-utils';
import {
  MapPin,
  Home,
  Car,
  TreePine,
  MoreHorizontal,
  Sun,
  Clock,
  Sunset,
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface DeliveryDetailsProps {
  onBack: () => void;
  onNext: (data: any) => void;
  initialData?: any;
  selectedDumpsterId?: number;
  selectedPricingId?: number;
  rentalDays?: number;
}

const placementOptions = [
  { value: 'driveway', label: 'Driveway', icon: Car, description: 'On your driveway' },
  { value: 'street', label: 'Street', icon: MapPin, description: 'Curbside on street' },
  { value: 'yard', label: 'Yard', icon: TreePine, description: 'In your yard' },
  { value: 'other', label: 'Other', icon: MoreHorizontal, description: 'Specify in notes' },
];

const timeOptions = [
  { value: 'morning', label: 'Morning', time: '8am - 12pm', icon: Sun },
  { value: 'afternoon', label: 'Afternoon', time: '12pm - 5pm', icon: Clock },
  { value: 'evening', label: 'Evening', time: '5pm - 8pm', icon: Sunset },
  { value: 'anytime', label: 'Anytime', time: 'Flexible', icon: CalendarCheck },
];

export function DeliveryDetails({ onBack, onNext, initialData, selectedDumpsterId, selectedPricingId, rentalDays }: DeliveryDetailsProps) {
  const [formData, setFormData] = useState({
    deliveryAddress: initialData?.deliveryAddress || '',
    deliveryAddressLine2: initialData?.deliveryAddressLine2 || '',
    deliveryCity: initialData?.deliveryCity || '',
    deliveryZipCode: initialData?.deliveryZipCode || '',
    deliveryInstructions: initialData?.deliveryInstructions || '',
    placementLocation: initialData?.placementLocation || 'driveway',
    deliveryDate: initialData?.deliveryDate || '',
    deliveryTimePreference: initialData?.deliveryTimePreference || 'morning',
    serviceZoneId: initialData?.serviceZoneId,
    deliveryFee: initialData?.deliveryFee || 0,
  });

  const [serviceZoneStatus, setServiceZoneStatus] = useState<{
    isChecking: boolean;
    isValid: boolean | null;
    zoneName?: string;
    error?: string;
  }>({
    isChecking: false,
    isValid: initialData?.serviceZoneId ? true : null,
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // If changing address, reset service zone validation
    if (field === 'deliveryAddress' || field === 'deliveryZipCode') {
      setServiceZoneStatus({
        isChecking: false,
        isValid: null,
      });
    }
  };

  const handlePlaceSelect = useCallback(async (place: google.maps.places.PlaceResult) => {
    if (!place.formatted_address) return;

    // Extract address components
    const addressComponents = place.address_components || [];
    let city = '';
    let zipCode = '';

    addressComponents.forEach(component => {
      const types = component.types;
      if (types.includes('locality')) {
        city = component.long_name;
      }
      if (types.includes('postal_code')) {
        zipCode = component.long_name;
      }
    });

    // Update form data
    setFormData(prev => ({
      ...prev,
      deliveryAddress: place.formatted_address,
      deliveryCity: city,
      deliveryZipCode: zipCode,
    }));

    // Check service zone if we have coordinates and ZIP code
    if (place.geometry?.location && zipCode) {
      const latitude = place.geometry.location.lat();
      const longitude = place.geometry.location.lng();

      setServiceZoneStatus({ isChecking: true, isValid: null });

      const addressInfo: AddressInfo = {
        formattedAddress: place.formatted_address,
        zipCode,
        latitude,
        longitude,
      };

      const zoneCheck = await checkServiceZone(addressInfo);

      setServiceZoneStatus({
        isChecking: false,
        isValid: zoneCheck.isValid,
        zoneName: zoneCheck.zoneName,
        error: zoneCheck.error,
      });

      // Update form data with service zone info
      setFormData(prev => ({
        ...prev,
        serviceZoneId: zoneCheck.zoneId,
        deliveryFee: zoneCheck.deliveryFee,
      }));
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.deliveryAddress || !formData.deliveryCity || !formData.deliveryZipCode || !formData.deliveryDate) {
      alert('Please fill in all required fields');
      return;
    }

    // Service zone validation
    if (serviceZoneStatus.isValid === false) {
      alert('This address is outside our service area. Please contact us for availability.');
      return;
    }

    if (serviceZoneStatus.isValid === null) {
      alert('Please select a valid address from the suggestions to verify service availability.');
      return;
    }

    onNext(formData);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Delivery Details</h2>
        <p className="text-muted-foreground">Please provide your delivery information and preferred timing.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Location */}
        <div className="bg-muted rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Delivery Location
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Street Address *
              </label>
              <GooglePlacesAutocomplete
                value={formData.deliveryAddress}
                onChange={(value) => handleInputChange('deliveryAddress', value)}
                onPlaceSelect={handlePlaceSelect}
                placeholder="Start typing your address..."
                required
              />

              {/* Service Zone Status */}
              {serviceZoneStatus.isChecking && (
                <div className="flex items-center gap-2 text-sm text-blue-600 mt-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking service availability...
                </div>
              )}
              {serviceZoneStatus.isValid === true && serviceZoneStatus.zoneName && (
                <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Service available in {serviceZoneStatus.zoneName}
                  {formData.deliveryFee > 0 && (
                    <span className="text-muted-foreground">
                      (Delivery fee: ${(formData.deliveryFee / 100).toFixed(2)})
                    </span>
                  )}
                </div>
              )}
              {serviceZoneStatus.isValid === false && serviceZoneStatus.error && (
                <div className="flex items-center gap-2 text-sm text-red-600 mt-2">
                  <AlertCircle className="h-4 w-4" />
                  {serviceZoneStatus.error}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Apt, Suite, Unit, etc.
                <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.deliveryAddressLine2}
                onChange={(e) => handleInputChange('deliveryAddressLine2', e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                placeholder="Apartment, suite, unit, building, floor, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.deliveryCity}
                  onChange={(e) => handleInputChange('deliveryCity', e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  placeholder="City"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  value={formData.deliveryZipCode}
                  onChange={(e) => handleInputChange('deliveryZipCode', e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  placeholder="ZIP"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Date Selection */}
        <div className="bg-muted rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" />
            Delivery Date
          </h3>

          {selectedDumpsterId && selectedPricingId ? (
            <AvailabilityCalendar
              dumpsterId={selectedDumpsterId}
              pricingId={selectedPricingId}
              selectedDate={formData.deliveryDate}
              onDateSelect={(date) => handleInputChange('deliveryDate', date)}
              rentalDays={rentalDays}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarCheck className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p>Please select a dumpster first to see available dates.</p>
            </div>
          )}
        </div>

        {/* Section 3: Placement Location */}
        <div className="bg-muted rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            Placement Location
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {placementOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = formData.placementLocation === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleInputChange('placementLocation', option.value)}
                  className={`
                    flex flex-col items-center p-4 rounded-xl border-2 transition-all
                    ${isSelected
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border bg-card hover:border-muted-foreground hover:bg-accent'
                    }
                  `}
                >
                  <Icon className={`h-6 w-6 mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {option.label}
                  </span>
                  <span className={`text-xs ${isSelected ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 4: Time Preference */}
        <div className="bg-muted rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Preferred Time
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {timeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = formData.deliveryTimePreference === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleInputChange('deliveryTimePreference', option.value)}
                  className={`
                    flex flex-col items-center p-4 rounded-xl border-2 transition-all
                    ${isSelected
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border bg-card hover:border-muted-foreground hover:bg-accent'
                    }
                  `}
                >
                  <Icon className={`h-6 w-6 mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {option.label}
                  </span>
                  <span className={`text-xs ${isSelected ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
                    {option.time}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 5: Special Instructions */}
        <div className="bg-muted rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Special Instructions
            <span className="text-sm font-normal text-muted-foreground ml-2">(Optional)</span>
          </h3>

          <textarea
            value={formData.deliveryInstructions}
            onChange={(e) => handleInputChange('deliveryInstructions', e.target.value)}
            className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground resize-none"
            rows={3}
            placeholder="Gate code, specific placement requests, or any other notes for our delivery team..."
          />
        </div>

        {/* Navigation */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 px-6 py-3 border-2 border-border text-foreground rounded-xl hover:bg-accent font-medium transition-colors"
          >
            Back
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 font-semibold transition-colors shadow-sm"
          >
            Continue to Add-ons
          </button>
        </div>
      </form>
    </div>
  );
}
