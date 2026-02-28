'use client';

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { NumberInput, StringNumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Edit, Trash, GripVertical, Check, X } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';
import { useToast } from "@/hooks/use-toast";
import { calculatePerDayRental, formatDeclineSchedule } from "@/lib/pricing/per-day-calculator";

// Types
interface Dumpster {
  id: number;
  name: string;
  dimensions: string;
  description: string;
  weightLimit: number;
  availability: number;
  imageUrl: string | null;
  sortOrder: number;
  pricingMode: string;
  basePricePerDay: number | null;
  dailyRate: number | null;
  minDays: number | null;
  maxDays: number | null;
  overageRate: number | null;
  // Declining daily rate fields
  firstDayRate: number | null;
  rateDeclineType: string | null;
  rateDeclineAmount: number | null;
  minimumDailyRate: number | null;
}

interface Booking {
  id: number;
  dumpsterId: number;
  pricingId: number;
  status: string;
  deliveryDate: string;
}

interface DumpsterPricing {
  id: number;
  dumpsterId: number;
  days: number;
  price: number;
  sortOrder: number;
}

interface InsertDumpster {
  name: string;
  dimensions: string;
  description: string;
  weightLimit: number;
  availability: number;
  imageUrl?: string | null;
  sortOrder: number;
}

// Basic schema for validation
const insertDumpsterSchema = {
  name: { required: true },
  dimensions: { required: true },
  description: { required: true },
  weightLimit: { required: true, min: 0 },
  availability: { required: true, min: 1 },
  imageUrl: { required: false },
  sortOrder: { required: false },
};

// API helper functions
const apiRequest = async (method: string, url: string, data?: any) => {
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (data) {
    options.body = JSON.stringify(data);
  }
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error('API request failed');
  }
  return response;
};

// Sortable dumpster card component
function SortableDumpsterCard({ dumpster, getDeployedCount, handleEdit, handleDelete, pricingData, setPricingData, handleAddPricing, handleDeletePricing, handleUpdatePricing, addingPricing, setAddingPricing, newPricingDays, setNewPricingDays, newPricingPrice, setNewPricingPrice, handlePricingDragEnd, onUpdatePricingMode, onUpdatePerDayConfig }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: dumpster.id });

  // Must be called unconditionally at the top level (Rules of Hooks).
  // These are used by the inner DndContext for pricing-tier reordering.
  const pointerSensor = useSensor(PointerSensor);
  const keyboardSensor = useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates });
  const pricingSensors = useSensors(pointerSensor, keyboardSensor);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card ref={setNodeRef} style={style} className="relative">
      <div {...attributes} {...listeners} className="absolute top-2 left-2 cursor-grab active:cursor-grabbing z-10">
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      <CardHeader className="pb-2 pl-8">
        <CardTitle>{dumpster.name}</CardTitle>
        <CardDescription>{dumpster.dimensions}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">{dumpster.description}</p>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">Weight Limit</p>
              <p className="text-lg font-bold text-primary">{dumpster.weightLimit.toLocaleString()} lbs</p>
            </div>
            <div>
              <p className="text-sm font-medium">Capacity</p>
              <p className="text-lg font-bold">{Math.round(dumpster.weightLimit / 2000)} tons</p>
            </div>
            <div>
              <p className="text-sm font-medium">Deployed</p>
              <p className="text-lg font-bold">{getDeployedCount(dumpster.id)}/{dumpster.availability} units</p>
            </div>
          </div>
          <div className="flex space-x-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(dumpster)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Dumpster</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{dumpster.name}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(dumpster.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>

      {/* Pricing Management Section */}
      <div className="px-6 pb-6 border-t border-gray-200">
        <div className="mt-4">
          {/* Pricing Mode Toggle */}
          <div className="flex items-center gap-2 mb-4">
            <h4 className="font-semibold text-gray-900">Pricing Mode</h4>
            <div className="flex bg-gray-100 rounded-lg p-0.5 ml-auto">
              <button
                onClick={() => onUpdatePricingMode(dumpster.id, 'tier')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  dumpster.pricingMode === 'tier'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Duration Tiers
              </button>
              <button
                onClick={() => onUpdatePricingMode(dumpster.id, 'per_day')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  dumpster.pricingMode === 'per_day'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Base + Per Day
              </button>
            </div>
          </div>

          {/* Tier mode: existing pricing tier CRUD */}
          {dumpster.pricingMode === 'tier' && (
            <>
              <div className="flex flex-col gap-3 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddingPricing(dumpster.id)}
                  className="text-xs w-fit"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Option
                </Button>
              </div>

              <DndContext
                sensors={pricingSensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => handlePricingDragEnd(event, dumpster.id, pricingData, setPricingData)}
              >
                <SortableContext
                  items={pricingData[dumpster.id]?.map((p: any) => p.id) || []}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 mb-3">
                    {pricingData[dumpster.id]?.map((pricing: any) => (
                      <SortablePricingItem
                        key={pricing.id}
                        pricing={pricing}
                        onDelete={() => handleDeletePricing(pricing.id, dumpster.id)}
                        onUpdate={(pricingId: number, updates: { days: number; price: number }) =>
                          handleUpdatePricing(pricingId, dumpster.id, updates)
                        }
                      />
                    ))}
                    {(!pricingData[dumpster.id] || pricingData[dumpster.id].length === 0) && (
                      <div className="text-sm text-gray-500 italic">No pricing options set</div>
                    )}
                  </div>
                </SortableContext>
              </DndContext>

              {addingPricing === dumpster.id && (
                <div className="bg-gray-50 p-3 rounded border">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Days</label>
                      <StringNumberInput
                        placeholder="3"
                        value={newPricingDays}
                        onChange={setNewPricingDays}
                        allowDecimals={false}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Price ($)</label>
                      <StringNumberInput
                        placeholder="480.00"
                        value={newPricingPrice}
                        onChange={setNewPricingPrice}
                        allowDecimals={true}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleAddPricing(dumpster.id)} className="text-xs">Add</Button>
                    <Button variant="outline" size="sm" onClick={() => { setAddingPricing(null); setNewPricingDays(""); setNewPricingPrice(""); }} className="text-xs">Cancel</Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Per-day mode: base fee + daily rate config */}
          {dumpster.pricingMode === 'per_day' && (
            <PerDayPricingForm dumpster={dumpster} onSave={onUpdatePerDayConfig} />
          )}

          {/* Overage Rate (both modes) */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <OverageRateField dumpster={dumpster} onSave={onUpdatePerDayConfig} />
          </div>
        </div>
      </div>
    </Card>
  );
}

// Per-day pricing configuration form
function PerDayPricingForm({ dumpster, onSave }: { dumpster: Dumpster; onSave: (id: number, data: any) => void }) {
  const [baseFee, setBaseFee] = useState(
    dumpster.basePricePerDay != null ? (dumpster.basePricePerDay / 100).toFixed(2) : ""
  );
  const [dailyRate, setDailyRate] = useState(
    dumpster.dailyRate != null ? (dumpster.dailyRate / 100).toFixed(2) : ""
  );
  const [minDays, setMinDays] = useState(
    dumpster.minDays != null ? dumpster.minDays.toString() : ""
  );
  const [maxDays, setMaxDays] = useState(
    dumpster.maxDays != null ? dumpster.maxDays.toString() : ""
  );

  // Declining rate state
  const [declineEnabled, setDeclineEnabled] = useState(dumpster.firstDayRate != null);
  const [firstDayRate, setFirstDayRate] = useState(
    dumpster.firstDayRate != null ? (dumpster.firstDayRate / 100).toFixed(2) : ""
  );
  const [declineType, setDeclineType] = useState<string>(
    dumpster.rateDeclineType ?? "flat"
  );
  const [declineAmount, setDeclineAmount] = useState(
    dumpster.rateDeclineAmount != null ? (dumpster.rateDeclineAmount / 100).toFixed(2) : ""
  );
  const [minimumRate, setMinimumRate] = useState(
    dumpster.minimumDailyRate != null ? (dumpster.minimumDailyRate / 100).toFixed(2) : ""
  );

  const [deliveryFeeEnabled, setDeliveryFeeEnabled] = useState(dumpster.basePricePerDay != null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(dumpster.id, {
        basePricePerDay: deliveryFeeEnabled && baseFee ? Math.round(parseFloat(baseFee) * 100) : null,
        dailyRate: dailyRate ? Math.round(parseFloat(dailyRate) * 100) : null,
        minDays: minDays ? parseInt(minDays) : null,
        maxDays: maxDays ? parseInt(maxDays) : null,
        // Declining rate fields
        firstDayRate: declineEnabled && firstDayRate ? Math.round(parseFloat(firstDayRate) * 100) : null,
        rateDeclineType: declineEnabled ? declineType : null,
        // Both flat (cents) and percent (basis points) use ×100 conversion from their display unit
        rateDeclineAmount: declineEnabled && declineAmount ? Math.round(parseFloat(declineAmount) * 100) : null,
        minimumDailyRate: declineEnabled && minimumRate ? Math.round(parseFloat(minimumRate) * 100) : null,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Build live example using the shared calculator
  const liveExample = (() => {
    const exampleDays = 7;
    const base = parseFloat(baseFee || "0");
    const daily = parseFloat(dailyRate || "0");
    const fdr = parseFloat(firstDayRate || "0");
    const da = parseFloat(declineAmount || "0");
    const minR = parseFloat(minimumRate || "0");

    if (declineEnabled && fdr > 0 && daily > 0) {
      const result = calculatePerDayRental(
        {
          basePricePerDay: Math.round(base * 100),
          dailyRate: Math.round(daily * 100),
          firstDayRate: Math.round(fdr * 100),
          rateDeclineType: declineType,
          rateDeclineAmount: Math.round(da * 100),
          minimumDailyRate: Math.round(minR * 100),
        },
        exampleDays
      );
      const schedule = formatDeclineSchedule(result);
      const total = (result.grandTotal / 100).toFixed(2);
      return `Example (${exampleDays} days): ${schedule} = $${total} total`;
    } else if (!declineEnabled && daily > 0) {
      const total = (base + daily * exampleDays).toFixed(2);
      return `Example: 7 days = $${base.toFixed(2)} + (7 × $${daily.toFixed(2)}) = $${total}`;
    }
    return null;
  })();

  return (
    <div className="bg-gray-50 p-3 rounded border space-y-3">
      {/* Drop-off & Pickup fee — optional, toggled */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`delivery-fee-toggle-${dumpster.id}`}
            checked={deliveryFeeEnabled}
            onChange={(e) => {
              setDeliveryFeeEnabled(e.target.checked);
              if (!e.target.checked) setBaseFee("");
            }}
            className="w-3.5 h-3.5 rounded accent-primary cursor-pointer"
          />
          <label
            htmlFor={`delivery-fee-toggle-${dumpster.id}`}
            className="text-xs font-medium text-gray-700 cursor-pointer select-none"
          >
            Charge a separate drop-off &amp; pickup fee
          </label>
        </div>
        {deliveryFeeEnabled && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Drop-off &amp; Pickup Fee ($)</label>
            <StringNumberInput
              placeholder="150.00"
              value={baseFee}
              onChange={setBaseFee}
              allowDecimals={true}
              className="text-sm"
            />
            <p className="text-[10px] text-gray-400 mt-0.5">One-time fee for truck delivery and pickup — not a daily charge</p>
          </div>
        )}
      </div>

      {/* Daily rental rate (flat mode only — decline mode shows it in the blue box) */}
      {!declineEnabled && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Daily Rental Rate ($)</label>
          <StringNumberInput
            placeholder="25.00"
            value={dailyRate}
            onChange={setDailyRate}
            allowDecimals={true}
            className="text-sm"
          />
          <p className="text-[10px] text-gray-400 mt-0.5">Charged for every day the dumpster is on-site</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Min Days</label>
          <StringNumberInput
            placeholder="1"
            value={minDays}
            onChange={setMinDays}
            allowDecimals={false}
            className="text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Max Days</label>
          <StringNumberInput
            placeholder="90"
            value={maxDays}
            onChange={setMaxDays}
            allowDecimals={false}
            className="text-sm"
          />
        </div>
      </div>

      {/* Declining rate toggle */}
      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id={`decline-toggle-${dumpster.id}`}
          checked={declineEnabled}
          onChange={(e) => setDeclineEnabled(e.target.checked)}
          className="w-3.5 h-3.5 rounded accent-primary cursor-pointer"
        />
        <label
          htmlFor={`decline-toggle-${dumpster.id}`}
          className="text-xs font-medium text-gray-700 cursor-pointer select-none"
        >
          Enable declining daily rate
        </label>
      </div>

      {/* Declining rate fields */}
      {declineEnabled && (
        <div className="border border-blue-200 bg-blue-50 rounded p-2.5 space-y-2.5">
          <p className="text-[10px] text-blue-600 font-medium">
            Day 1 uses the first rate. From day 2 onward, the rate starts lower and decreases each day.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Day 1 Rate ($)</label>
              <StringNumberInput
                placeholder="300.00"
                value={firstDayRate}
                onChange={setFirstDayRate}
                allowDecimals={true}
                className="text-sm"
              />
              <p className="text-[10px] text-gray-400 mt-0.5">Rate for day 1 only (e.g. a higher first-day rate)</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Day 2+ Rate ($)</label>
              <StringNumberInput
                placeholder="100.00"
                value={dailyRate}
                onChange={setDailyRate}
                allowDecimals={true}
                className="text-sm"
              />
              <p className="text-[10px] text-gray-400 mt-0.5">Rate on day 2, decreases each additional day</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Decline Type</label>
              <select
                value={declineType}
                onChange={(e) => setDeclineType(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              >
                <option value="flat">Flat ($/day)</option>
                <option value="percent">Percent (%/day)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {declineType === "percent" ? "Decline % per Day" : "Decline $ per Day"}
              </label>
              <StringNumberInput
                placeholder={declineType === "percent" ? "5.00" : "10.00"}
                value={declineAmount}
                onChange={setDeclineAmount}
                allowDecimals={true}
                className="text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Minimum Daily Rate ($)</label>
            <StringNumberInput
              placeholder="50.00"
              value={minimumRate}
              onChange={setMinimumRate}
              allowDecimals={true}
              className="text-sm"
            />
            <p className="text-[10px] text-gray-400 mt-0.5">Rate floor — never goes below this amount</p>
          </div>
        </div>
      )}

      {liveExample && (
        <p className="text-xs text-gray-500 bg-white border rounded px-2 py-1.5">{liveExample}</p>
      )}

      <Button size="sm" onClick={handleSave} disabled={isSaving} className="text-xs">
        {isSaving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
        Save Per-Day Pricing
      </Button>
    </div>
  );
}

// Overage rate field (shown for both pricing modes)
function OverageRateField({ dumpster, onSave }: { dumpster: Dumpster; onSave: (id: number, data: any) => void }) {
  const [overageRate, setOverageRate] = useState(
    dumpster.overageRate != null ? (dumpster.overageRate / 100).toFixed(2) : ""
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(dumpster.id, {
        overageRate: overageRate ? Math.round(parseFloat(overageRate) * 100) : null,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-700 mb-1">Overage Rate ($/day)</label>
        <StringNumberInput
          placeholder="35.00"
          value={overageRate}
          onChange={setOverageRate}
          allowDecimals={true}
          className="text-sm"
        />
      </div>
      <Button size="sm" variant="outline" onClick={handleSave} disabled={isSaving} className="text-xs">
        {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
      </Button>
    </div>
  );
}

// Sortable pricing item component
function SortablePricingItem({ pricing, onDelete, onUpdate }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [editDays, setEditDays] = useState(pricing.days.toString());
  const [editPrice, setEditPrice] = useState((pricing.price / 100).toFixed(2));
  const [isSaving, setIsSaving] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: pricing.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(pricing.id, {
        days: parseInt(editDays),
        price: Math.round(parseFloat(editPrice) * 100)
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditDays(pricing.days.toString());
    setEditPrice((pricing.price / 100).toFixed(2));
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center justify-between bg-blue-50 p-2 rounded border border-blue-200"
      >
        <div className="flex items-center gap-2 flex-1">
          <div className="cursor-not-allowed">
            <GripVertical className="w-3 h-3 text-gray-300" />
          </div>
          <div className="flex items-center gap-2">
            <StringNumberInput
              value={editDays}
              onChange={setEditDays}
              allowDecimals={false}
              className="w-16 h-7 text-sm"
            />
            <span className="text-sm text-gray-600">days</span>
            <span className="text-gray-400">-</span>
            <span className="text-sm text-gray-600">$</span>
            <StringNumberInput
              value={editPrice}
              onChange={setEditPrice}
              allowDecimals={true}
              className="w-20 h-7 text-sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="text-green-600 hover:text-green-700 hover:bg-green-50 h-6 w-6 p-0"
          >
            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isSaving}
            className="text-gray-600 hover:text-gray-700 hover:bg-gray-100 h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between bg-gray-50 p-2 rounded"
    >
      <div className="flex items-center gap-2">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="w-3 h-3 text-gray-400" />
        </div>
        <span className="text-sm text-gray-900">
          {pricing.days} {pricing.days === 1 ? 'day' : 'days'} - ${(pricing.price / 100).toFixed(2)}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(true)}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-6 w-6 p-0"
        >
          <Edit className="w-3 h-3" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
            >
              <Trash className="w-3 h-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Pricing Option</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the {pricing.days} day pricing option (${(pricing.price / 100).toFixed(2)})? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default function DumpsterTypesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDumpster, setSelectedDumpster] = useState<Dumpster | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Pricing management state
  const [pricingData, setPricingData] = useState<Record<number, DumpsterPricing[]>>({});
  const [addingPricing, setAddingPricing] = useState<number | null>(null);
  const [newPricingDays, setNewPricingDays] = useState("");
  const [newPricingPrice, setNewPricingPrice] = useState("");

  // Fetch dumpsters
  const { data: dumpsters, isLoading } = useQuery<Dumpster[]>({
    queryKey: ["/api/dumpsters"],
    queryFn: async () => {
      const response = await fetch("/api/dumpsters");
      if (!response.ok) throw new Error("Failed to fetch dumpsters");
      return response.json();
    },
  });

  // Fetch bookings to show deployed counts
  const { data: bookings } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    queryFn: async () => {
      const response = await fetch("/api/bookings");
      if (!response.ok) throw new Error("Failed to fetch bookings");
      return response.json();
    },
  });

  // Fetch all pricing data reliably for deployed count calculation
  const { data: allPricing } = useQuery<DumpsterPricing[]>({
    queryKey: ["/api/dumpster-pricing/all"],
    queryFn: async () => {
      const response = await fetch("/api/dumpster-pricing/all");
      if (!response.ok) throw new Error("Failed to fetch pricing");
      return response.json();
    },
  });

  // Fetch pricing data for each dumpster
  useEffect(() => {
    if (dumpsters) {
      dumpsters.forEach(async (dumpster) => {
        try {
          const response = await fetch(`/api/dumpster-pricing/${dumpster.id}`);
          if (!response.ok) throw new Error("Failed to fetch pricing");
          const pricing = await response.json();
          setPricingData((prev) => ({
            ...prev,
            [dumpster.id]: pricing
          }));
        } catch (error) {
          console.error(`Error fetching pricing for dumpster ${dumpster.id}:`, error);
        }
      });
    }
  }, [dumpsters]);

  // Get deployed count for a dumpster (only count bookings currently in their rental period)
  const getDeployedCount = (dumpsterId: number) => {
    if (!bookings || !allPricing) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    return bookings.filter(booking => {
      // Must be for this dumpster and in an active status
      if (booking.dumpsterId !== dumpsterId) return false;
      if (!['confirmed', 'delivered', 'picked_up'].includes(booking.status)) return false;

      // Get rental duration from allPricing (reliable query-based data)
      const pricing = allPricing.find(p => p.id === booking.pricingId);
      if (!pricing) return false; // Skip if pricing not found (data integrity issue)

      // Calculate rental period
      const deliveryDate = new Date(booking.deliveryDate);
      deliveryDate.setHours(0, 0, 0, 0);

      const pickupDate = new Date(deliveryDate);
      pickupDate.setDate(pickupDate.getDate() + pricing.days);

      // Check if today is within the rental period (inclusive of delivery, exclusive of pickup)
      return today >= deliveryDate && today < pickupDate;
    }).length;
  };

  // Handle drag end for dumpsters
  const handleDumpsterDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !dumpsters) return;

    if (active.id !== over.id) {
      const oldIndex = dumpsters.findIndex((item) => item.id === active.id);
      const newIndex = dumpsters.findIndex((item) => item.id === over.id);

      const newOrder = arrayMove(dumpsters, oldIndex, newIndex);

      // Update sort orders
      const dumpsterOrders = newOrder.map((dumpster, index) => ({
        id: dumpster.id,
        sortOrder: index
      }));

      try {
        await apiRequest("PUT", "/api/dumpsters/sort-order", { dumpsterOrders });
        toast({
          title: "Success",
          description: "Dumpster order updated successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update dumpster order",
          variant: "destructive",
        });
      }
    }
  };

  // Handle drag end for pricing
  const handlePricingDragEnd = async (event: DragEndEvent, dumpsterId: number, pricingData: Record<number, DumpsterPricing[]>, setPricingData: any) => {
    const { active, over } = event;

    if (!over || !pricingData[dumpsterId]) return;

    if (active.id !== over.id) {
      const oldIndex = pricingData[dumpsterId].findIndex((item) => item.id === active.id);
      const newIndex = pricingData[dumpsterId].findIndex((item) => item.id === over.id);

      const newOrder = arrayMove(pricingData[dumpsterId], oldIndex, newIndex);

      // Update local state immediately
      setPricingData((prev: Record<number, DumpsterPricing[]>) => ({
        ...prev,
        [dumpsterId]: newOrder
      }));

      // Update sort orders on server
      const pricingOrders = newOrder.map((pricing, index) => ({
        id: pricing.id,
        sortOrder: index
      }));

      try {
        await apiRequest("PUT", "/api/dumpster-pricing/sort-order", { pricingOrders });
        toast({
          title: "Success",
          description: "Pricing order updated successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update pricing order",
          variant: "destructive",
        });
      }
    }
  };

  // Add pricing option
  const handleAddPricing = async (dumpsterId: number) => {
    if (!newPricingDays || !newPricingPrice) {
      toast({
        title: "Error",
        description: "Please enter both days and price",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/dumpster-pricing", {
        dumpsterId,
        days: parseInt(newPricingDays),
        price: Math.round(parseFloat(newPricingPrice) * 100), // Convert to cents
        sortOrder: pricingData[dumpsterId]?.length || 0
      });
      const newPricing = await response.json();

      setPricingData((prev) => ({
        ...prev,
        [dumpsterId]: [...(prev[dumpsterId] || []), newPricing]
      }));

      // Invalidate pricing cache
      queryClient.invalidateQueries({ queryKey: ["/api/dumpster-pricing/all"] });

      setAddingPricing(null);
      setNewPricingDays("");
      setNewPricingPrice("");

      toast({
        title: "Success",
        description: "Pricing option added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add pricing option",
        variant: "destructive",
      });
    }
  };

  // Delete pricing option
  const handleDeletePricing = async (pricingId: number, dumpsterId: number) => {
    try {
      await apiRequest("DELETE", `/api/dumpster-pricing/item/${pricingId}`);

      setPricingData((prev) => ({
        ...prev,
        [dumpsterId]: prev[dumpsterId]?.filter(p => p.id !== pricingId) || []
      }));

      // Invalidate pricing cache
      queryClient.invalidateQueries({ queryKey: ["/api/dumpster-pricing/all"] });

      toast({
        title: "Success",
        description: "Pricing option deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete pricing option",
        variant: "destructive",
      });
    }
  };

  // Update pricing option
  const handleUpdatePricing = async (pricingId: number, dumpsterId: number, updates: { days: number; price: number }) => {
    try {
      const response = await apiRequest("PUT", `/api/dumpster-pricing/item/${pricingId}`, updates);
      const updatedPricing = await response.json();

      setPricingData((prev) => ({
        ...prev,
        [dumpsterId]: prev[dumpsterId]?.map(p =>
          p.id === pricingId ? { ...p, ...updatedPricing } : p
        ) || []
      }));

      // Invalidate pricing cache
      queryClient.invalidateQueries({ queryKey: ["/api/dumpster-pricing/all"] });

      toast({
        title: "Success",
        description: "Pricing option updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update pricing option",
        variant: "destructive",
      });
      throw error; // Re-throw so the component knows it failed
    }
  };

  // Add/Edit/Delete dumpster handlers
  const [addForm, setAddForm] = useState<InsertDumpster>({
    name: "",
    dimensions: "",
    description: "",
    weightLimit: 0,
    availability: 1,
    imageUrl: "",
    sortOrder: 0,
  });

  const [editForm, setEditForm] = useState<InsertDumpster>({
    name: "",
    dimensions: "",
    description: "",
    weightLimit: 0,
    availability: 1,
    imageUrl: "",
    sortOrder: 0,
  });

  const addMutation = useMutation({
    mutationFn: async (data: InsertDumpster) => {
      const response = await apiRequest("POST", "/api/dumpsters", {
        ...data,
        sortOrder: dumpsters?.length || 0
      });
      return response.json();
    },
    onSuccess: () => {
      setIsAddDialogOpen(false);
      setAddForm({
        name: "",
        dimensions: "",
        description: "",
        weightLimit: 0,
        availability: 1,
        imageUrl: "",
        sortOrder: 0,
      });
      toast({
        title: "Success",
        description: "Dumpster added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add dumpster",
        variant: "destructive",
      });
    },
  });

  const editMutation = useMutation({
    mutationFn: async (data: InsertDumpster) => {
      if (!selectedDumpster) throw new Error("No dumpster selected");
      const response = await apiRequest("PUT", `/api/dumpsters/${selectedDumpster.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      setIsEditDialogOpen(false);
      setSelectedDumpster(null);
      setEditForm({
        name: "",
        dimensions: "",
        description: "",
        weightLimit: 0,
        availability: 1,
        imageUrl: "",
        sortOrder: 0,
      });
      toast({
        title: "Success",
        description: "Dumpster updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update dumpster",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/dumpsters/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Dumpster deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete dumpster",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (dumpster: Dumpster) => {
    setSelectedDumpster(dumpster);
    setEditForm({
      name: dumpster.name,
      dimensions: dumpster.dimensions,
      description: dumpster.description,
      weightLimit: dumpster.weightLimit,
      availability: dumpster.availability,
      imageUrl: dumpster.imageUrl || "",
      sortOrder: dumpster.sortOrder,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleUpdatePricingMode = async (dumpsterId: number, mode: 'tier' | 'per_day') => {
    try {
      await apiRequest('PUT', `/api/admin/dumpsters/${dumpsterId}`, { pricingMode: mode });
      queryClient.invalidateQueries({ queryKey: ["/api/dumpsters"] });
      toast({
        title: "Success",
        description: `Pricing mode updated to ${mode === 'tier' ? 'Duration Tiers' : 'Base + Per Day'}`,
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update pricing mode",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePerDayConfig = async (dumpsterId: number, config: any) => {
    try {
      await apiRequest('PUT', `/api/admin/dumpsters/${dumpsterId}`, config);
      queryClient.invalidateQueries({ queryKey: ["/api/dumpsters"] });
      toast({
        title: "Success",
        description: "Pricing configuration saved",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to save pricing configuration",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dumpster Types</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Dumpster
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-white" forceLight>
            <DialogHeader>
              <DialogTitle>Add New Dumpster</DialogTitle>
              <DialogDescription>
                Create a new dumpster type for your rental inventory.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); addMutation.mutate(addForm); }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="add-name">Name</Label>
                <Input
                  id="add-name"
                  placeholder="15 Yard Dumpster"
                  value={addForm.name}
                  onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-dimensions">Dimensions</Label>
                <Input
                  id="add-dimensions"
                  placeholder="14' L x 8' W x 4' H"
                  value={addForm.dimensions}
                  onChange={(e) => setAddForm(prev => ({ ...prev, dimensions: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-description">Description</Label>
                <Textarea
                  id="add-description"
                  placeholder="Perfect for medium-sized projects..."
                  value={addForm.description}
                  onChange={(e) => setAddForm(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add-weight">Weight Limit (lbs)</Label>
                  <NumberInput
                    id="add-weight"
                    placeholder="4000"
                    value={addForm.weightLimit}
                    onChange={(value) => setAddForm(prev => ({ ...prev, weightLimit: value }))}
                    allowDecimals={false}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="add-availability">Availability</Label>
                  <NumberInput
                    id="add-availability"
                    placeholder="5"
                    value={addForm.availability}
                    onChange={(value) => setAddForm(prev => ({ ...prev, availability: value }))}
                    allowDecimals={false}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-image">Image URL (optional)</Label>
                <Input
                  id="add-image"
                  placeholder="https://example.com/image.jpg"
                  value={addForm.imageUrl || ""}
                  onChange={(e) => setAddForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                />
              </div>

              <DialogFooter>
                <Button type="submit" disabled={addMutation.isPending}>
                  {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Dumpster
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white" forceLight>
          <DialogHeader>
            <DialogTitle>Edit Dumpster</DialogTitle>
            <DialogDescription>
              Update the dumpster information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); editMutation.mutate(editForm); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-dimensions">Dimensions</Label>
              <Input
                id="edit-dimensions"
                value={editForm.dimensions}
                onChange={(e) => setEditForm(prev => ({ ...prev, dimensions: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-weight">Weight Limit (lbs)</Label>
                <NumberInput
                  id="edit-weight"
                  placeholder="4000"
                  value={editForm.weightLimit}
                  onChange={(value) => setEditForm(prev => ({ ...prev, weightLimit: value }))}
                  allowDecimals={false}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-availability">Availability</Label>
                <NumberInput
                  id="edit-availability"
                  placeholder="5"
                  value={editForm.availability}
                  onChange={(value) => setEditForm(prev => ({ ...prev, availability: value }))}
                  allowDecimals={false}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-image">Image URL (optional)</Label>
              <Input
                id="edit-image"
                value={editForm.imageUrl || ""}
                onChange={(e) => setEditForm(prev => ({ ...prev, imageUrl: e.target.value }))}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={editMutation.isPending}>
                {editMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Dumpster
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dumpster Grid with Drag and Drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDumpsterDragEnd}
      >
        <SortableContext
          items={dumpsters?.map(d => d.id) || []}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dumpsters?.map((dumpster) => (
              <SortableDumpsterCard
                key={dumpster.id}
                dumpster={dumpster}
                getDeployedCount={getDeployedCount}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                pricingData={pricingData}
                setPricingData={setPricingData}
                handleAddPricing={handleAddPricing}
                handleDeletePricing={handleDeletePricing}
                handleUpdatePricing={handleUpdatePricing}
                addingPricing={addingPricing}
                setAddingPricing={setAddingPricing}
                newPricingDays={newPricingDays}
                setNewPricingDays={setNewPricingDays}
                newPricingPrice={newPricingPrice}
                setNewPricingPrice={setNewPricingPrice}
                handlePricingDragEnd={handlePricingDragEnd}
                onUpdatePricingMode={handleUpdatePricingMode}
                onUpdatePerDayConfig={handleUpdatePerDayConfig}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
