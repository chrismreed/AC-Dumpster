'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { checkServiceZone } from '@/lib/service-zone-utils';
import type { FormSchema, FormField } from '@/components/admin/form-builder/types';
import { calculatePerDayRental } from '@/lib/pricing/per-day-calculator';

interface Dumpster {
  id: number;
  name: string;
  dimensions?: string;
  pricingMode?: string;
  basePricePerDay?: number | null;
  dailyRate?: number | null;
  minDays?: number | null;
  maxDays?: number | null;
  // Declining daily rate
  firstDayRate?: number | null;
  rateDeclineType?: string | null;
  rateDeclineAmount?: number | null;
  minimumDailyRate?: number | null;
}

interface DumpsterPricing {
  id: number;
  dumpsterId: number;
  days: number;
  price: number;
}

interface Service {
  id: number;
  name: string;
  isActive?: boolean;
  formSchema?: FormSchema | null;
}

interface Addon {
  id: number;
  name: string;
  price: number;
}

type JobType = 'dumpster_rental' | 'swap' | 'service';

interface CreateJobDialogProps {
  queryInvalidate: () => void;
}

export function CreateJobDialog({ queryInvalidate }: CreateJobDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [jobType, setJobType] = useState<JobType>('dumpster_rental');

  // Dumpster rental form
  const [rentalForm, setRentalForm] = useState({
    dumpsterId: '',
    pricingId: '',
    perDayRentalDays: 1,
    deliveryDate: format(new Date(), 'yyyy-MM-dd'),
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    deliveryAddress: '',
    deliveryCity: '',
    deliveryZipCode: '',
    deliveryInstructions: '',
    placementLocation: 'driveway',
    deliveryTimePreference: 'morning',
    serviceZoneId: null as number | null,
    selectedAddOns: [] as Addon[],
  });
  const [zoneStatus, setZoneStatus] = useState<{ isValid: boolean | null; zoneName?: string; error?: string; deliveryFee?: number }>({ isValid: null });
  const [priceData, setPriceData] = useState<{ total: number; rentalDays?: number } | null>(null);

  // Swap form
  const [swapForm, setSwapForm] = useState({
    dumpsterId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    address: '',
    city: '',
    zipCode: '',
    scheduledDate: format(new Date(), 'yyyy-MM-dd'),
    placementInstructions: '',
    timePreference: 'morning',
  });

  // Service form
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [serviceFormData, setServiceFormData] = useState<Record<string, unknown>>({});
  const [serviceCalculatedPrice, setServiceCalculatedPrice] = useState(0);

  const { data: dumpsters = [] } = useQuery<Dumpster[]>({
    queryKey: ['admin-dumpsters'],
    queryFn: async () => {
      const res = await fetch('/api/admin/dumpsters');
      if (!res.ok) throw new Error('Failed to fetch dumpsters');
      return res.json();
    },
    enabled: open,
  });

  const { data: dumpsterPricingData, isLoading: loadingPricing } = useQuery<DumpsterPricing[]>({
    queryKey: ['dumpster-pricing', rentalForm.dumpsterId],
    queryFn: async () => {
      const res = await fetch(`/api/dumpster-pricing/${rentalForm.dumpsterId}`);
      if (!res.ok) throw new Error('Failed to fetch pricing');
      return res.json();
    },
    enabled: open && !!rentalForm.dumpsterId,
  });
  const dumpsterPricing = useMemo(() => dumpsterPricingData ?? [], [dumpsterPricingData]);

  const selectedDumpster = dumpsters.find(d => String(d.id) === rentalForm.dumpsterId) ?? null;
  const isPerDayMode = selectedDumpster?.pricingMode === 'per_day';
  const perDayMin = selectedDumpster?.minDays ?? 1;
  const perDayMax = selectedDumpster?.maxDays ?? 90;

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ['admin-services-full'],
    queryFn: async () => {
      const res = await fetch('/api/admin/services');
      if (!res.ok) throw new Error('Failed to fetch services');
      return res.json();
    },
    enabled: open && jobType === 'service',
  });
  const activeServices = services.filter((s) => s.isActive !== false);

  const { data: selectedService } = useQuery<Service | null>({
    queryKey: ['admin-service', selectedServiceId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/services/${selectedServiceId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: open && jobType === 'service' && !!selectedServiceId,
  });

  const { data: addons = [] } = useQuery<Addon[]>({
    queryKey: ['addons'],
    queryFn: async () => {
      const res = await fetch('/api/addons');
      if (!res.ok) throw new Error('Failed to fetch add-ons');
      return res.json();
    },
    enabled: open && jobType === 'dumpster_rental',
  });

  // Zone lookup when zip changes
  const checkZone = useCallback(async () => {
    if (!rentalForm.deliveryZipCode?.trim()) {
      setZoneStatus((prev) => (prev.isValid === null ? prev : { isValid: null }));
      return;
    }
    try {
      const result = await checkServiceZone({
        formattedAddress: rentalForm.deliveryAddress || '',
        zipCode: rentalForm.deliveryZipCode,
      });
      const next = {
        isValid: result.isValid,
        zoneName: result.zoneName,
        error: result.error,
        deliveryFee: result.deliveryFee,
      };
      setZoneStatus((prev) =>
        prev.isValid === next.isValid && prev.zoneName === next.zoneName ? prev : next
      );
      if (result.isValid && result.zoneId) {
        setRentalForm((p) => ({ ...p, serviceZoneId: result.zoneId! }));
      }
    } catch {
      setZoneStatus({ isValid: false, error: 'Could not verify service area' });
    }
  }, [rentalForm.deliveryZipCode, rentalForm.deliveryAddress]);

  useEffect(() => {
    if (!open || jobType !== 'dumpster_rental') return;
    const t = setTimeout(checkZone, 500);
    return () => clearTimeout(t);
  }, [open, jobType, rentalForm.deliveryZipCode, rentalForm.deliveryAddress, checkZone]);

  // Price calculation for dumpster rental
  useEffect(() => {
    if (
      jobType !== 'dumpster_rental' ||
      !rentalForm.dumpsterId ||
      !rentalForm.deliveryZipCode ||
      zoneStatus.isValid !== true ||
      rentalForm.serviceZoneId == null
    ) {
      setPriceData(null);
      return;
    }

    // For tier mode, require a pricingId
    const pricingId = isPerDayMode ? null : (rentalForm.pricingId || dumpsterPricing[0]?.id);
    if (!isPerDayMode && !pricingId) {
      setPriceData(null);
      return;
    }

    const calc = async () => {
      try {
        const body = isPerDayMode
          ? {
              dumpsterId: Number(rentalForm.dumpsterId),
              rentalDays: rentalForm.perDayRentalDays,
              deliveryZipCode: rentalForm.deliveryZipCode,
              deliveryAddress: rentalForm.deliveryAddress,
              deliveryCity: rentalForm.deliveryCity,
              selectedAddOns: rentalForm.selectedAddOns.map((a) => ({ id: a.id, price: a.price })),
            }
          : {
              dumpsterId: Number(rentalForm.dumpsterId),
              pricingId: Number(pricingId),
              deliveryZipCode: rentalForm.deliveryZipCode,
              deliveryAddress: rentalForm.deliveryAddress,
              deliveryCity: rentalForm.deliveryCity,
              selectedAddOns: rentalForm.selectedAddOns.map((a) => ({ id: a.id, price: a.price })),
            };

        const res = await fetch('/api/calculate-price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) return;
        const data = await res.json();
        const selected = isPerDayMode ? null : dumpsterPricing.find((p) => p.id === Number(pricingId));
        setPriceData({
          total: data.total * 100, // Convert to cents
          rentalDays: selected?.days ?? data.rentalDays,
        });
      } catch {
        setPriceData(null);
      }
    };
    calc();
  }, [
    jobType,
    isPerDayMode,
    rentalForm.dumpsterId,
    rentalForm.pricingId,
    rentalForm.perDayRentalDays,
    rentalForm.deliveryZipCode,
    rentalForm.deliveryAddress,
    rentalForm.deliveryCity,
    rentalForm.selectedAddOns,
    rentalForm.serviceZoneId,
    zoneStatus.isValid,
    dumpsterPricing,
  ]);

  // Reset pricing when dumpster changes (only update when value actually needs to change)
  const firstPricingId = dumpsterPricing[0]?.id;
  useEffect(() => {
    if (!open || jobType !== 'dumpster_rental') return;
    if (!rentalForm.dumpsterId) {
      if (rentalForm.pricingId !== '') setRentalForm((p) => ({ ...p, pricingId: '' }));
    } else if (isPerDayMode) {
      // Reset to min days when switching to a per-day dumpster
      setRentalForm((p) => ({ ...p, pricingId: '', perDayRentalDays: perDayMin }));
    } else if (dumpsterPricing.length > 0 && !rentalForm.pricingId) {
      setRentalForm((p) => ({ ...p, pricingId: String(firstPricingId) }));
    }
  }, [open, jobType, rentalForm.dumpsterId, rentalForm.pricingId, dumpsterPricing.length, firstPricingId, isPerDayMode, perDayMin]);

  const createBookingMutation = useMutation({
    mutationFn: async () => {
      const totalPrice = priceData?.total ?? 0;

      const tierSelected = isPerDayMode ? null : dumpsterPricing.find((p) => p.id === Number(rentalForm.pricingId));
      const rentalDays = isPerDayMode
        ? rentalForm.perDayRentalDays
        : (priceData?.rentalDays ?? tierSelected?.days ?? 0);
      const rentalPrice = isPerDayMode && selectedDumpster
        ? calculatePerDayRental(
            {
              basePricePerDay: selectedDumpster.basePricePerDay ?? null,
              dailyRate: selectedDumpster.dailyRate ?? null,
              firstDayRate: selectedDumpster.firstDayRate ?? null,
              rateDeclineType: selectedDumpster.rateDeclineType ?? null,
              rateDeclineAmount: selectedDumpster.rateDeclineAmount ?? null,
              minimumDailyRate: selectedDumpster.minimumDailyRate ?? null,
            },
            rentalForm.perDayRentalDays
          ).grandTotal
        : (tierSelected ? tierSelected.price : 0);

      const payload = {
        dumpsterId: Number(rentalForm.dumpsterId),
        pricingId: isPerDayMode ? null : Number(rentalForm.pricingId),
        customerName: rentalForm.customerName,
        customerEmail: rentalForm.customerEmail,
        customerPhone: rentalForm.customerPhone,
        deliveryAddress: rentalForm.deliveryAddress,
        deliveryCity: rentalForm.deliveryCity,
        deliveryZipCode: rentalForm.deliveryZipCode,
        deliveryInstructions: rentalForm.deliveryInstructions || undefined,
        placementLocation: rentalForm.placementLocation,
        deliveryDate: rentalForm.deliveryDate,
        deliveryTimePreference: rentalForm.deliveryTimePreference,
        serviceZoneId: rentalForm.serviceZoneId!,
        selectedAddOns: rentalForm.selectedAddOns,
        totalPrice,
        rentalDays,
        rentalPrice,
        bookingPricingMode: isPerDayMode ? 'per_day' : 'tier',
      };
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.details || err.message || 'Failed to create booking');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryInvalidate();
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
      toast({ title: 'Dumpster rental created', description: `Booking #${data.bookingId} and jobs created.` });
      setOpen(false);
      resetForms();
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const createSwapJobMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        jobType: 'swap',
        customerName: swapForm.customerName,
        customerEmail: swapForm.customerEmail,
        customerPhone: swapForm.customerPhone,
        address: swapForm.address,
        city: swapForm.city,
        zipCode: swapForm.zipCode,
        scheduledDate: swapForm.scheduledDate,
        placementInstructions: swapForm.placementInstructions || undefined,
        timePreference: swapForm.timePreference || undefined,
        dumpsterId: swapForm.dumpsterId ? Number(swapForm.dumpsterId) : undefined,
      };
      const res = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create job');
      }
      return res.json();
    },
    onSuccess: () => {
      queryInvalidate();
      toast({ title: 'Swap job created' });
      setOpen(false);
      resetForms();
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const createServiceMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        serviceId: Number(selectedServiceId),
        formData: { ...serviceFormData },
        calculatedPrice: serviceCalculatedPrice / 100, // API expects dollars
      };
      const res = await fetch('/api/service-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create service request');
      }
      return res.json();
    },
    onSuccess: () => {
      queryInvalidate();
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
      toast({ title: 'Service request created' });
      setOpen(false);
      resetForms();
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const resetForms = () => {
    setJobType('dumpster_rental');
    setRentalForm({
      dumpsterId: '',
      pricingId: '',
      perDayRentalDays: 1,
      deliveryDate: format(new Date(), 'yyyy-MM-dd'),
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      deliveryAddress: '',
      deliveryCity: '',
      deliveryZipCode: '',
      deliveryInstructions: '',
      placementLocation: 'driveway',
      deliveryTimePreference: 'morning',
      serviceZoneId: null,
      selectedAddOns: [],
    });
    setZoneStatus({ isValid: null });
    setSwapForm({
      dumpsterId: '',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      address: '',
      city: '',
      zipCode: '',
      scheduledDate: format(new Date(), 'yyyy-MM-dd'),
      placementInstructions: '',
      timePreference: 'morning',
    });
    setSelectedServiceId('');
    setServiceFormData({});
    setServiceCalculatedPrice(0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (jobType === 'dumpster_rental') {
      if (
        !rentalForm.dumpsterId ||
        !rentalForm.customerName ||
        !rentalForm.customerEmail ||
        !rentalForm.customerPhone ||
        !rentalForm.deliveryAddress ||
        !rentalForm.deliveryCity ||
        !rentalForm.deliveryZipCode ||
        !rentalForm.deliveryDate
      ) {
        toast({ title: 'Missing fields', description: 'Please fill in all required fields.', variant: 'destructive' });
        return;
      }
      if (!isPerDayMode && !rentalForm.pricingId) {
        toast({ title: 'Missing fields', description: 'Please select a rental duration.', variant: 'destructive' });
        return;
      }
      if (zoneStatus.isValid !== true || rentalForm.serviceZoneId == null) {
        toast({ title: 'Service area', description: 'Please enter a valid address in our service area.', variant: 'destructive' });
        return;
      }
      if (!priceData?.total) {
        toast({ title: 'Price', description: 'Could not calculate price. Check address and selections.', variant: 'destructive' });
        return;
      }
      createBookingMutation.mutate();
    } else if (jobType === 'swap') {
      if (
        !swapForm.customerName ||
        !swapForm.customerEmail ||
        !swapForm.customerPhone ||
        !swapForm.address ||
        !swapForm.city ||
        !swapForm.zipCode ||
        !swapForm.scheduledDate
      ) {
        toast({ title: 'Missing fields', description: 'Please fill in all required fields.', variant: 'destructive' });
        return;
      }
      createSwapJobMutation.mutate();
    } else {
      if (!selectedServiceId) {
        toast({ title: 'Service required', description: 'Please select a service.', variant: 'destructive' });
        return;
      }
      if (selectedService?.formSchema?.fields?.length) {
        const required = selectedService.formSchema.fields.filter((f) => f.required);
        const missing = required.filter((f) => !serviceFormData[f.id]);
        if (missing.length) {
          toast({ title: 'Missing fields', description: `Please fill: ${missing.map((m) => m.label).join(', ')}`, variant: 'destructive' });
          return;
        }
      }
      createServiceMutation.mutate();
    }
  };

  const isPending =
    createBookingMutation.isPending || createSwapJobMutation.isPending || createServiceMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Job
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px] rounded-3xl border-none shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-gray-900">Create Job</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 mt-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Job Type</Label>
          <Select value={jobType} onValueChange={(v) => setJobType(v as JobType)}>
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dumpster_rental">Dumpster Rental</SelectItem>
              <SelectItem value="swap">Swap</SelectItem>
              <SelectItem value="service">Service</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {/* ========== DUMPSTER RENTAL ========== */}
          {jobType === 'dumpster_rental' && (
            <>
              <div className="space-y-2">
                <Label>Dumpster</Label>
                <Select
                  value={rentalForm.dumpsterId}
                  onValueChange={(v) => setRentalForm((p) => ({ ...p, dumpsterId: v }))}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Select dumpster" />
                  </SelectTrigger>
                  <SelectContent>
                    {dumpsters.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name} {d.dimensions ? `(${d.dimensions})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {rentalForm.dumpsterId && !isPerDayMode && (
                <div className="space-y-2">
                  <Label>Rental Duration</Label>
                  {loadingPricing ? (
                    <div className="h-11 flex items-center text-gray-500 text-sm">Loading...</div>
                  ) : (
                    <Select
                      value={rentalForm.pricingId}
                      onValueChange={(v) => setRentalForm((p) => ({ ...p, pricingId: v }))}
                    >
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {dumpsterPricing.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.days} days — ${(p.price / 100).toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
              {rentalForm.dumpsterId && isPerDayMode && (
                <div className="space-y-2">
                  <Label>Rental Days</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 p-0 rounded-lg"
                      onClick={() => setRentalForm((p) => ({ ...p, perDayRentalDays: Math.max(perDayMin, p.perDayRentalDays - 1) }))}
                      disabled={rentalForm.perDayRentalDays <= perDayMin}
                    >
                      −
                    </Button>
                    <span className="w-10 text-center font-semibold text-lg">{rentalForm.perDayRentalDays}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 p-0 rounded-lg"
                      onClick={() => setRentalForm((p) => ({ ...p, perDayRentalDays: Math.min(perDayMax, p.perDayRentalDays + 1) }))}
                      disabled={rentalForm.perDayRentalDays >= perDayMax}
                    >
                      +
                    </Button>
                    <span className="text-xs text-gray-500">({perDayMin}–{perDayMax} days)</span>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Delivery Date</Label>
                  <Input
                    type="date"
                    value={rentalForm.deliveryDate}
                    onChange={(e) => setRentalForm((p) => ({ ...p, deliveryDate: e.target.value }))}
                    className="h-11 rounded-xl"
                    required
                  />
                </div>
                {priceData?.rentalDays && (
                  <div className="space-y-2">
                    <Label>Pickup Date</Label>
                    <div className="h-11 flex items-center text-sm text-gray-600 rounded-xl bg-gray-50 px-3">
                      {format(
                        new Date(new Date(rentalForm.deliveryDate).getTime() + priceData.rentalDays * 24 * 60 * 60 * 1000),
                        'MMM d, yyyy'
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Customer Name</Label>
                  <Input
                    value={rentalForm.customerName}
                    onChange={(e) => setRentalForm((p) => ({ ...p, customerName: e.target.value }))}
                    className="h-11 rounded-xl"
                    placeholder="John Smith"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={rentalForm.customerPhone}
                    onChange={(e) => setRentalForm((p) => ({ ...p, customerPhone: e.target.value }))}
                    className="h-11 rounded-xl"
                    placeholder="555-123-4567"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={rentalForm.customerEmail}
                  onChange={(e) => setRentalForm((p) => ({ ...p, customerEmail: e.target.value }))}
                  className="h-11 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={rentalForm.deliveryAddress}
                  onChange={(e) => setRentalForm((p) => ({ ...p, deliveryAddress: e.target.value }))}
                  className="h-11 rounded-xl"
                  placeholder="123 Main St"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={rentalForm.deliveryCity}
                    onChange={(e) => setRentalForm((p) => ({ ...p, deliveryCity: e.target.value }))}
                    className="h-11 rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>ZIP</Label>
                  <Input
                    value={rentalForm.deliveryZipCode}
                    onChange={(e) => setRentalForm((p) => ({ ...p, deliveryZipCode: e.target.value }))}
                    className="h-11 rounded-xl"
                    required
                  />
                  {zoneStatus.isValid === true && zoneStatus.zoneName && (
                    <div className="flex items-center gap-1.5 text-xs text-green-600">
                      <CheckCircle2 className="h-3 w-3" />
                      {zoneStatus.zoneName}
                    </div>
                  )}
                  {zoneStatus.isValid === false && (
                    <div className="flex items-center gap-1.5 text-xs text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      {zoneStatus.error}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Placement</Label>
                <Select
                  value={rentalForm.placementLocation}
                  onValueChange={(v) => setRentalForm((p) => ({ ...p, placementLocation: v }))}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="driveway">Driveway</SelectItem>
                    <SelectItem value="street">Street</SelectItem>
                    <SelectItem value="yard">Yard</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Time Preference</Label>
                <Select
                  value={rentalForm.deliveryTimePreference}
                  onValueChange={(v) => setRentalForm((p) => ({ ...p, deliveryTimePreference: v }))}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="anytime">Any</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {addons.length > 0 && (
                <div className="space-y-2">
                  <Label>Add-ons</Label>
                  <div className="flex flex-wrap gap-2">
                    {addons.map((a) => {
                      const isSelected = rentalForm.selectedAddOns.some((s) => s.id === a.id);
                      return (
                        <Button
                          key={a.id}
                          type="button"
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setRentalForm((p) => ({
                              ...p,
                              selectedAddOns: isSelected
                                ? p.selectedAddOns.filter((s) => s.id !== a.id)
                                : [...p.selectedAddOns, { id: a.id, name: a.name, price: a.price }],
                            }));
                          }}
                        >
                          {a.name} (+${(a.price / 100).toFixed(2)})
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
              {priceData && (
                <div className="rounded-xl bg-yellow-50 p-3 text-sm font-semibold">
                  Total: ${(priceData.total / 100).toFixed(2)}
                </div>
              )}
            </>
          )}

          {/* ========== SWAP ========== */}
          {jobType === 'swap' && (
            <>
              <div className="space-y-2">
                <Label>Dumpster</Label>
                <Select
                  value={swapForm.dumpsterId}
                  onValueChange={(v) => setSwapForm((p) => ({ ...p, dumpsterId: v }))}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    {dumpsters.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Customer Name</Label>
                  <Input
                    value={swapForm.customerName}
                    onChange={(e) => setSwapForm((p) => ({ ...p, customerName: e.target.value }))}
                    className="h-11 rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={swapForm.customerPhone}
                    onChange={(e) => setSwapForm((p) => ({ ...p, customerPhone: e.target.value }))}
                    className="h-11 rounded-xl"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={swapForm.customerEmail}
                  onChange={(e) => setSwapForm((p) => ({ ...p, customerEmail: e.target.value }))}
                  className="h-11 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={swapForm.address}
                  onChange={(e) => setSwapForm((p) => ({ ...p, address: e.target.value }))}
                  className="h-11 rounded-xl"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={swapForm.city}
                    onChange={(e) => setSwapForm((p) => ({ ...p, city: e.target.value }))}
                    className="h-11 rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>ZIP</Label>
                  <Input
                    value={swapForm.zipCode}
                    onChange={(e) => setSwapForm((p) => ({ ...p, zipCode: e.target.value }))}
                    className="h-11 rounded-xl"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Scheduled Date</Label>
                <Input
                  type="date"
                  value={swapForm.scheduledDate}
                  onChange={(e) => setSwapForm((p) => ({ ...p, scheduledDate: e.target.value }))}
                  className="h-11 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Placement Instructions</Label>
                <Textarea
                  value={swapForm.placementInstructions}
                  onChange={(e) => setSwapForm((p) => ({ ...p, placementInstructions: e.target.value }))}
                  className="min-h-[60px] rounded-xl"
                />
              </div>
            </>
          )}

          {/* ========== SERVICE ========== */}
          {jobType === 'service' && (
            <>
              <div className="space-y-2">
                <Label>Service</Label>
                <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeServices.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedService?.formSchema?.fields && selectedService.formSchema.fields.length > 0 ? (
                <div className="border-t pt-4 mt-4">
                  <Label className="mb-3 block">Service Details</Label>
                  <AdminServiceFields
                    schema={selectedService.formSchema}
                    formData={serviceFormData}
                    onChange={setServiceFormData}
                    onPriceChange={setServiceCalculatedPrice}
                    basePriceCents={Math.round(((selectedService as { basePrice?: number; price?: number }).basePrice ?? (selectedService as { price?: number }).price ?? 0) * 100)}
                  />
                </div>
              ) : selectedServiceId && selectedService && (!selectedService.formSchema?.fields?.length) ? (
                <p className="text-sm text-gray-500">This service has no custom fields.</p>
              ) : null}
            </>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-black h-12 rounded-2xl"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : `Create ${jobType === 'dumpster_rental' ? 'Booking' : 'Job'}`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Minimal admin-only field renderer for service forms (no payment/captcha)
function AdminServiceFields({
  schema,
  formData,
  onChange,
  onPriceChange,
  basePriceCents,
}: {
  schema: FormSchema;
  formData: Record<string, unknown>;
  onChange: (d: Record<string, unknown>) => void;
  onPriceChange: (cents: number) => void;
  basePriceCents: number;
}) {
  const updateField = (id: string, value: unknown) => {
    const next = { ...formData, [id]: value };
    onChange(next);
    // Simple price calc for admin using FormField pricing fields
    let total = basePriceCents;
    schema.fields?.forEach((f) => {
      if (!next[f.id]) return;
      const v = next[f.id];
      if (f.type === 'number' && f.pricing?.type === 'perUnit' && f.pricing.pricePerUnit) {
        // Per-unit pricing for number inputs (pricePerUnit is in dollars)
        total += Math.round((Number(v) || 0) * f.pricing.pricePerUnit * 100);
      } else if ((f.type === 'select' || f.type === 'radio') && typeof v === 'string') {
        // Option-based pricing
        const opt = f.options?.find((o) => o.value === v);
        if (opt?.pricing?.type === 'add') {
          total += Math.round((opt.pricing.amount || 0) * 100);
        } else if (opt?.priceModifier) {
          total += Math.round(opt.priceModifier * 100);
        }
      } else if (f.priceModifier) {
        // Simple flat modifier when field has any value
        total += Math.round(f.priceModifier * 100);
      }
    });
    onPriceChange(total);
  };

  const fields = schema.fields?.filter((f) => !['payment', 'captcha', 'agreement'].includes(f.type)) ?? [];
  if (fields.length === 0) return null;

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.id} className="space-y-2">
          <Label>
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {field.type === 'text' && (
            <Input
              value={(formData[field.id] as string) || ''}
              onChange={(e) => updateField(field.id, e.target.value)}
              className="h-11 rounded-xl"
              placeholder={field.placeholder}
            />
          )}
          {field.type === 'email' && (
            <Input
              type="email"
              value={(formData[field.id] as string) || ''}
              onChange={(e) => updateField(field.id, e.target.value)}
              className="h-11 rounded-xl"
            />
          )}
          {field.type === 'phone' && (
            <Input
              type="tel"
              value={(formData[field.id] as string) || ''}
              onChange={(e) => updateField(field.id, e.target.value)}
              className="h-11 rounded-xl"
            />
          )}
          {field.type === 'number' && (
            <Input
              type="number"
              value={(formData[field.id] as string) || ''}
              onChange={(e) => updateField(field.id, e.target.value)}
              className="h-11 rounded-xl"
              min={field.validation?.min}
              max={field.validation?.max}
            />
          )}
          {field.type === 'date' && (
            <Input
              type="date"
              value={(formData[field.id] as string) || ''}
              onChange={(e) => updateField(field.id, e.target.value)}
              className="h-11 rounded-xl"
            />
          )}
          {field.type === 'textarea' && (
            <Textarea
              value={(formData[field.id] as string) || ''}
              onChange={(e) => updateField(field.id, e.target.value)}
              className="min-h-[60px] rounded-xl"
              placeholder={field.placeholder}
            />
          )}
          {field.type === 'select' && (
            <Select
              value={(formData[field.id] as string) || ''}
              onValueChange={(v) => updateField(field.id, v)}
            >
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {(field.options ?? []).map((opt) => {
                  const val = typeof opt === 'string' ? opt : opt.value;
                  const lab = typeof opt === 'string' ? opt : (opt.label ?? opt.value);
                  return (
                    <SelectItem key={String(val)} value={String(val)}>
                      {lab}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
          {field.type === 'radio' && (
            <div className="flex flex-wrap gap-2">
              {(field.options ?? []).map((opt) => {
                const val = typeof opt === 'string' ? opt : opt.value;
                const lab = typeof opt === 'string' ? opt : (opt.label ?? opt.value);
                return (
                  <Button
                    key={String(val)}
                    type="button"
                    variant={(formData[field.id] as string) === val ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateField(field.id, val)}
                  >
                    {lab}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
