'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationOption {
  value: string;
  label: string;
  type: 'hub' | 'job' | 'in_transit';
}

interface LocationSelectProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  id?: string;
  placeholder?: string;
  className?: string;
  labelOverride?: string;
}

export function LocationSelect({ value, onChange, id, placeholder = 'Select hub or customer job location', className, labelOverride }: LocationSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [options, setOptions] = useState<{ hubs: LocationOption[]; jobLocations: LocationOption[] }>({ hubs: [], jobLocations: [] });
  const [isSearching, setIsSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchOptions = useCallback(async (searchTerm?: string) => {
    const url = `/api/admin/fleet-location-options${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) return;
    const data = await res.json();
    setOptions({
      hubs: data.hubs || [],
      jobLocations: data.jobLocations || [],
    });
  }, []);

  useEffect(() => {
    if (open) {
      setSearch('');
      setDebouncedSearch('');
      fetchOptions();
    }
  }, [open, fetchOptions]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!open) return;
    if (debouncedSearch) {
      setIsSearching(true);
      fetchOptions(debouncedSearch).finally(() => setIsSearching(false));
    } else {
      fetchOptions();
    }
  }, [debouncedSearch, open, fetchOptions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const displayLabel =
    value === 'in_transit'
      ? 'In Transit'
      : options.hubs.find((o) => o.value === value)?.label
        || options.jobLocations.find((o) => o.value === value)?.label
        || labelOverride
        || null;

  const filterBySearch = (list: LocationOption[], term: string) =>
    !term.trim()
      ? list
      : list.filter((o) => o.label.toLowerCase().includes(term.toLowerCase()));

  const filteredHubs = filterBySearch(options.hubs, search);
  const filteredJobs = filterBySearch(options.jobLocations, search);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-12 w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 px-4 font-medium transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500/20',
          !displayLabel && 'text-gray-500',
          className
        )}
      >
        <span className="truncate">{displayLabel || placeholder}</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 opacity-50 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-[1] mt-1 flex flex-col rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="border-b p-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by customer, address, hub..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full pl-9"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            <button
              type="button"
              onClick={() => {
                onChange('in_transit');
                setOpen(false);
              }}
              className={cn(
                'w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors',
                value === 'in_transit' ? 'bg-yellow-100 text-yellow-900' : 'hover:bg-gray-100'
              )}
            >
              In Transit
            </button>
            {filteredHubs.length > 0 && (
              <>
                <div className="mt-2 px-2 py-1.5 text-xs font-semibold uppercase text-gray-500">Hubs</div>
                {filteredHubs.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={cn(
                      'w-full truncate rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                      value === opt.value ? 'bg-yellow-100 font-medium text-yellow-900' : 'hover:bg-gray-100 text-gray-700'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </>
            )}
            {filteredJobs.length > 0 && (
              <>
                <div className="mt-2 px-2 py-1.5 text-xs font-semibold uppercase text-gray-500">Customer Job Locations</div>
                {filteredJobs.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={cn(
                      'w-full truncate rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                      value === opt.value ? 'bg-yellow-100 font-medium text-yellow-900' : 'hover:bg-gray-100 text-gray-700'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </>
            )}
            {!filteredHubs.length && !filteredJobs.length && !isSearching && search && (
              <div className="px-3 py-6 text-center text-sm text-gray-500">No locations found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
