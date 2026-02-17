'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Package, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

interface LoadRecord {
  id: number;
  bookingId: number;
  swapRequestId: number | null;
  loadNumber: number;
  priceCharged: number;
  completedAt: string | null;
  createdAt: string;
}

interface JobLoadTrackingProps {
  bookingId: number;
  swapRequestId?: number | null;
  dumpsterId?: number | null;
  jobType: string;
  onLoadsChange?: () => void;
}

export function JobLoadTracking({
  bookingId,
  swapRequestId,
  dumpsterId,
  jobType,
  onLoadsChange,
}: JobLoadTrackingProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [priceInput, setPriceInput] = useState('');

  const { data: loads = [], isLoading } = useQuery<LoadRecord[]>({
    queryKey: ['load-records', bookingId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/load-records?bookingId=${bookingId}`);
      if (!res.ok) throw new Error('Failed to fetch loads');
      return res.json();
    },
  });

  const nextLoadNumber = loads.length > 0
    ? Math.max(...loads.map((l) => l.loadNumber)) + 1
    : 1;

  const createLoadMutation = useMutation({
    mutationFn: async () => {
      const priceCharged = Math.round(parseFloat(priceInput || '0') * 100);
      const res = await fetch('/api/admin/load-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          swapRequestId: swapRequestId || null,
          loadNumber: nextLoadNumber,
          priceCharged: Math.max(0, priceCharged),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create load');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['load-records', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
      setPriceInput('');
      onLoadsChange?.();
      toast({
        title: 'Load logged',
        description: `Load #${nextLoadNumber} recorded successfully.`,
      });
    },
    onError: (err: Error) => {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

  const showForJobType = ['delivery', 'pickup', 'swap'].includes(jobType);

  if (!showForJobType) return null;

  return (
    <div className="border rounded-md p-4 bg-white">
      <h3 className="text-sm font-medium flex items-center mb-3 text-gray-900">
        <Package className="mr-2 h-4 w-4 text-gray-500" />
        Load Tracking
      </h3>
      <p className="text-xs text-gray-500 mb-3">
        Log dumpster pickups for per-load billing. {loads.length} load{loads.length !== 1 ? 's' : ''} recorded.
      </p>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading loads...
        </div>
      ) : (
        <>
          {/* Existing loads */}
          {loads.length > 0 && (
            <div className="space-y-2 mb-4">
              {loads
                .sort((a, b) => b.loadNumber - a.loadNumber)
                .map((load) => (
                  <div
                    key={load.id}
                    className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">Load #{load.loadNumber}</span>
                      <span className="text-gray-500">
                        {format(new Date(load.createdAt), 'MMM d, HH:mm')}
                      </span>
                    </div>
                    <span className="font-medium text-gray-700">{formatPrice(load.priceCharged)}</span>
                  </div>
                ))}
            </div>
          )}

          {/* Log new load */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-gray-500">Price for Load #{nextLoadNumber} (optional)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button
                size="sm"
                className="bg-[#f7c948] hover:bg-[#e6b83d] text-black"
                onClick={() => createLoadMutation.mutate()}
                disabled={createLoadMutation.isPending}
              >
                {createLoadMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-1" />
                )}
                Log Load #{nextLoadNumber}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
