'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Truck, SkipForward } from 'lucide-react';

interface LoadDetailsData {
  bookingId: number;
  loadNumber: number;
  priceCharged: number; // in cents
  loadWeight?: number | null;
  notes?: string | null;
  receiptPhotoUrl?: string | null;
}

interface LoadDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: number;
  customerName: string;
  dumpsterName: string;
  onSubmit: (data: LoadDetailsData) => void;
  onSkip: () => void;
  isSubmitting: boolean;
}

export function LoadDetailsDialog({
  open,
  onOpenChange,
  bookingId,
  customerName,
  dumpsterName,
  onSubmit,
  onSkip,
  isSubmitting,
}: LoadDetailsDialogProps) {
  const [priceCharged, setPriceCharged] = useState('');
  const [loadWeight, setLoadWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptPhotoUrl, setReceiptPhotoUrl] = useState('');
  const [loadNumber, setLoadNumber] = useState(1);
  const [isLoadingCount, setIsLoadingCount] = useState(true);

  // Auto-compute load number from existing records
  useEffect(() => {
    if (!open) return;
    setIsLoadingCount(true);
    fetch(`/api/admin/load-records?bookingId=${bookingId}`)
      .then((res) => res.json())
      .then((records: unknown[]) => {
        setLoadNumber(records.length + 1);
      })
      .catch(() => {
        setLoadNumber(1);
      })
      .finally(() => {
        setIsLoadingCount(false);
      });
  }, [open, bookingId]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setPriceCharged('');
      setLoadWeight('');
      setNotes('');
      setReceiptPhotoUrl('');
    }
  }, [open]);

  const handleSubmit = () => {
    const priceDollars = parseFloat(priceCharged);
    if (isNaN(priceDollars) || priceDollars < 0) return;

    const data: LoadDetailsData = {
      bookingId,
      loadNumber,
      priceCharged: Math.round(priceDollars * 100), // Convert dollars to cents
      loadWeight: loadWeight ? parseInt(loadWeight, 10) : null,
      notes: notes.trim() || null,
      receiptPhotoUrl: receiptPhotoUrl.trim() || null,
    };

    onSubmit(data);
  };

  const isPriceValid = priceCharged !== '' && !isNaN(parseFloat(priceCharged)) && parseFloat(priceCharged) >= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto" forceLight>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Log Dump/Load Details
          </DialogTitle>
          <DialogDescription>
            {customerName} — {dumpsterName}
            <br />
            Load #{isLoadingCount ? '...' : loadNumber} — Enter the details from the dump site.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Price Charged */}
          <div className="space-y-2">
            <Label htmlFor="load-price" className="text-sm font-medium">
              Price Charged ($) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="load-price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={priceCharged}
              onChange={(e) => setPriceCharged(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Amount charged at the dump site</p>
          </div>

          {/* Weight */}
          <div className="space-y-2">
            <Label htmlFor="load-weight" className="text-sm font-medium">
              Weight (lbs)
            </Label>
            <Input
              id="load-weight"
              type="number"
              min="0"
              placeholder="Optional"
              value={loadWeight}
              onChange={(e) => setLoadWeight(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="load-notes" className="text-sm font-medium">
              Notes
            </Label>
            <Textarea
              id="load-notes"
              placeholder="Dump site name, debris type, special conditions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Receipt Photo URL */}
          <div className="space-y-2">
            <Label htmlFor="load-receipt" className="text-sm font-medium">
              Receipt Photo URL
            </Label>
            <Input
              id="load-receipt"
              type="url"
              placeholder="https://..."
              value={receiptPhotoUrl}
              onChange={(e) => setReceiptPhotoUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Link to receipt photo (optional)</p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onSkip}
            disabled={isSubmitting}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            <SkipForward className="h-4 w-4 mr-2" />
            Skip & Continue
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isPriceValid || isSubmitting || isLoadingCount}
            className="bg-[#f7c948] hover:bg-[#f7c948]/90 text-black w-full sm:w-auto order-1 sm:order-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Truck className="h-4 w-4 mr-2" />
            )}
            Log Load & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
