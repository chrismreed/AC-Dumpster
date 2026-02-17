'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';
import { Search, Plus, Truck, Edit, Trash2, Wrench, MapPin, Calendar, CheckCircle2, AlertCircle, Settings2, Activity, History, ChevronDown, ChevronRight } from 'lucide-react';

interface FleetUnit {
  id: number;
  unitNumber: string;
  dumpsterId: number;
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_service';
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  location: string;
  lastServiceDate: string | null;
  nextServiceDate: string | null;
  notes: string | null;
  createdAt: string;
  dumpster?: {
    id: number;
    name: string;
    dimensions: string;
  };
  currentBooking?: {
    id: number;
    customerName: string;
    deliveryDate: string;
    status: string;
  };
}

interface DumpsterType {
  id: number;
  name: string;
  dimensions: string;
}

interface FleetUnitForm {
  unitNumber: string;
  dumpsterId: number;
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_service';
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  location: string;
  lastServiceDate: string;
  nextServiceDate: string;
  notes: string;
}

export default function FleetInventoryTab() {
  const [fleetUnits, setFleetUnits] = useState<FleetUnit[]>([]);
  const [dumpsterTypes, setDumpsterTypes] = useState<DumpsterType[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<FleetUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<FleetUnit | null>(null);
  const [unitForm, setUnitForm] = useState<FleetUnitForm>({
    unitNumber: '',
    dumpsterId: 0,
    status: 'available',
    condition: 'good',
    location: '',
    lastServiceDate: '',
    nextServiceDate: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedTypes, setExpandedTypes] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchFleetUnits();
    fetchDumpsterTypes();
  }, []);

  // Initialize expanded state: expand types with NO inventory, collapse types WITH inventory
  useEffect(() => {
    if (dumpsterTypes.length > 0 && fleetUnits.length >= 0) {
      // Get counts per type
      const unitCountsByType = new Map<number, number>();
      fleetUnits.forEach(unit => {
        const count = unitCountsByType.get(unit.dumpsterId) || 0;
        unitCountsByType.set(unit.dumpsterId, count + 1);
      });

      // Expand only types that have NO inventory (need attention)
      const emptyTypes = dumpsterTypes
        .filter(type => !unitCountsByType.get(type.id))
        .map(type => type.id);

      setExpandedTypes(new Set(emptyTypes));
    }
  }, [dumpsterTypes, fleetUnits]);

  // Group filtered units by dumpster type
  const groupedUnits = useMemo(() => {
    const groups: Record<number, { type: DumpsterType; units: FleetUnit[] }> = {};

    // Initialize groups for all dumpster types (so empty types still show)
    dumpsterTypes.forEach(type => {
      groups[type.id] = { type, units: [] };
    });

    // Assign filtered units to their groups
    filteredUnits.forEach(unit => {
      if (unit.dumpsterId && groups[unit.dumpsterId]) {
        groups[unit.dumpsterId].units.push(unit);
      }
    });

    // Convert to array and sort by type name
    return Object.values(groups).sort((a, b) => a.type.name.localeCompare(b.type.name));
  }, [filteredUnits, dumpsterTypes]);

  const toggleTypeExpanded = (typeId: number) => {
    setExpandedTypes(prev => {
      const next = new Set(prev);
      if (next.has(typeId)) {
        next.delete(typeId);
      } else {
        next.add(typeId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedTypes(new Set(dumpsterTypes.map(t => t.id)));
  };

  const collapseAll = () => {
    setExpandedTypes(new Set());
  };

  const getTypeStatusCounts = (units: FleetUnit[]) => {
    return {
      available: units.filter(u => u.status === 'available').length,
      inUse: units.filter(u => u.status === 'in_use').length,
      maintenance: units.filter(u => u.status === 'maintenance').length,
      outOfService: units.filter(u => u.status === 'out_of_service').length,
    };
  };

  useEffect(() => {
    filterUnits();
  }, [fleetUnits, searchTerm, statusFilter]);

  const fetchFleetUnits = async () => {
    try {
      const response = await fetch('/api/admin/fleet-units');
      if (response.ok) {
        const data = await response.json();
        setFleetUnits(data);
      }
    } catch (error) {
      console.error('Failed to fetch fleet units:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDumpsterTypes = async () => {
    try {
      const response = await fetch('/api/admin/dumpsters');
      if (response.ok) {
        const data = await response.json();
        setDumpsterTypes(data);
      }
    } catch (error) {
      console.error('Failed to fetch dumpster types:', error);
    }
  };

  const filterUnits = () => {
    let filtered = fleetUnits;

    if (searchTerm) {
      filtered = filtered.filter(unit =>
        unit.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        unit.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        unit.dumpster?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(unit => unit.status === statusFilter);
    }

    setFilteredUnits(filtered);
  };

  const resetForm = () => {
    setUnitForm({
      unitNumber: '',
      dumpsterId: 0,
      status: 'available',
      condition: 'good',
      location: '',
      lastServiceDate: '',
      nextServiceDate: '',
      notes: '',
    });
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/fleet-units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unitForm),
      });

      if (response.ok) {
        const newUnit = await response.json();
        setFleetUnits(prev => [newUnit, ...prev]);
        resetForm();
        setIsCreateDialogOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUnit = (unit: FleetUnit) => {
    setEditingUnit(unit);
    setUnitForm({
      unitNumber: unit.unitNumber,
      dumpsterId: unit.dumpsterId,
      status: unit.status,
      condition: unit.condition,
      location: unit.location,
      lastServiceDate: unit.lastServiceDate?.split('T')[0] || '',
      nextServiceDate: unit.nextServiceDate?.split('T')[0] || '',
      notes: unit.notes || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnit) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/fleet-units/${editingUnit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unitForm),
      });

      if (response.ok) {
        const updatedUnit = await response.json();
        setFleetUnits(prev => prev.map(u => u.id === editingUnit.id ? updatedUnit : u));
        setIsEditDialogOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUnit = async (unitId: number) => {
    if (!confirm('Are you sure you want to delete this dumpster?')) return;

    try {
      const response = await fetch(`/api/admin/fleet-units/${unitId}`, { method: 'DELETE' });
      if (response.ok) {
        setFleetUnits(prev => prev.filter(u => u.id !== unitId));
      }
    } catch (error) {
      console.error('Failed to delete fleet unit:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl shadow-sm"></div>)}
        </div>
        <div className="h-96 bg-gray-100 rounded-3xl shadow-sm"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 sm:mb-6 min-w-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Fleet Inventory</h2>
          <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">Track individual dumpsters and their status</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default" size="sm" className="shadow-lg shadow-yellow-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Dumpster
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] rounded-2xl border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-gray-900">Add Dumpster</DialogTitle>
              <DialogDescription className="font-medium">
                Add a new dumpster to track in the system.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUnit} className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unitNumber" className="font-bold text-gray-700 ml-1">Unit Number</Label>
                  <Input
                    id="unitNumber"
                    value={unitForm.unitNumber}
                    onChange={(e) => setUnitForm(prev => ({ ...prev, unitNumber: e.target.value }))}
                    className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium"
                    placeholder="e.g., 20YD-101"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dumpsterType" className="font-bold text-gray-700 ml-1">Dumpster Type</Label>
                  <Select
                    value={unitForm.dumpsterId.toString()}
                    onValueChange={(value) => setUnitForm(prev => ({ ...prev, dumpsterId: parseInt(value) }))}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:ring-yellow-500/20 font-medium">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                      {dumpsterTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitStatus" className="font-bold text-gray-700 ml-1">Initial Status</Label>
                  <Select
                    value={unitForm.status}
                    onValueChange={(value: any) => setUnitForm(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:ring-yellow-500/20 font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="in_use">In Use</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="out_of_service">Out of Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitCondition" className="font-bold text-gray-700 ml-1">Condition</Label>
                  <Select
                    value={unitForm.condition}
                    onValueChange={(value: any) => setUnitForm(prev => ({ ...prev, condition: value }))}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:ring-yellow-500/20 font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="unitLocation" className="font-bold text-gray-700 ml-1">Current Location</Label>
                  <Input
                    id="unitLocation"
                    value={unitForm.location}
                    onChange={(e) => setUnitForm(prev => ({ ...prev, location: e.target.value }))}
                    className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium"
                    placeholder="e.g., Main Yard, Warehouse B"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastService" className="font-bold text-gray-700 ml-1">Last Service Date</Label>
                  <Input
                    id="lastService"
                    type="date"
                    value={unitForm.lastServiceDate}
                    onChange={(e) => setUnitForm(prev => ({ ...prev, lastServiceDate: e.target.value }))}
                    className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nextService" className="font-bold text-gray-700 ml-1">Next Service Date</Label>
                  <Input
                    id="nextService"
                    type="date"
                    value={unitForm.nextServiceDate}
                    onChange={(e) => setUnitForm(prev => ({ ...prev, nextServiceDate: e.target.value }))}
                    className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes" className="font-bold text-gray-700 ml-1">Notes</Label>
                  <Textarea
                    id="notes"
                    value={unitForm.notes}
                    onChange={(e) => setUnitForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium py-3"
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold h-12 rounded-xl shadow-lg shadow-yellow-500/10 transition-all"
                >
                  {isSubmitting ? 'Adding...' : 'Add Dumpster'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <Card className="relative overflow-hidden border-none shadow-xl shadow-gray-200/50 bg-white group hover:scale-[1.02] transition-all duration-300">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <Truck className="h-16 w-16 text-yellow-600" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-400">Total Dumpsters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl xl:text-4xl font-black text-gray-900 truncate">{fleetUnits.length}</div>
            <div className="flex items-center mt-2 text-xs font-bold text-yellow-600 bg-yellow-50 w-fit px-2 py-1 rounded-full">Total units</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-xl shadow-gray-200/50 bg-white group hover:scale-[1.02] transition-all duration-300">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-400">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl xl:text-4xl font-black text-gray-900 truncate">{fleetUnits.filter(u => u.status === 'available').length}</div>
            <div className="flex items-center mt-2 text-xs font-bold text-green-600 bg-green-50 w-fit px-2 py-1 rounded-full">Ready to go</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-xl shadow-gray-200/50 bg-white group hover:scale-[1.02] transition-all duration-300">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <Activity className="h-16 w-16 text-blue-600" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-400">In Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl xl:text-4xl font-black text-gray-900 truncate">{fleetUnits.filter(u => u.status === 'in_use').length}</div>
            <div className="flex items-center mt-2 text-xs font-bold text-blue-600 bg-blue-50 w-fit px-2 py-1 rounded-full">Currently rented</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-xl shadow-gray-200/50 bg-white group hover:scale-[1.02] transition-all duration-300">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <Wrench className="h-16 w-16 text-orange-600" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-400">Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl xl:text-4xl font-black text-gray-900 truncate">{fleetUnits.filter(u => u.status === 'maintenance').length}</div>
            <div className="flex items-center mt-2 text-xs font-bold text-orange-600 bg-orange-50 w-fit px-2 py-1 rounded-full">Needs repair</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-10 border-none shadow-lg shadow-gray-100 bg-white rounded-2xl overflow-hidden">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-yellow-500 transition-colors" />
                <Input
                  placeholder="Search by unit number, location, or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-56 h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:ring-yellow-500/20 font-medium">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="in_use">In Use</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="out_of_service">Out of Service</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Grouped by Type */}
      <div className="space-y-4">
        {/* Header with expand/collapse controls */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Fleet by Type</h3>
            <p className="text-sm text-gray-500">{filteredUnits.length} dumpsters across {groupedUnits.filter(g => g.units.length > 0).length} types</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={expandAll}
              className="text-xs font-semibold text-gray-500 hover:text-gray-700"
            >
              Expand All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={collapseAll}
              className="text-xs font-semibold text-gray-500 hover:text-gray-700"
            >
              Collapse All
            </Button>
          </div>
        </div>

        {groupedUnits.length === 0 ? (
          <Card className="border-none shadow-xl shadow-gray-200/50 bg-white rounded-2xl overflow-hidden">
            <div className="text-center py-20 bg-gray-50/30">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 w-fit mx-auto mb-6">
                <Truck className="h-12 w-12 text-gray-200" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">No dumpster types found</h3>
              <p className="text-gray-500 font-medium max-w-sm mx-auto">Add dumpster types in the Types tab first.</p>
            </div>
          </Card>
        ) : (
          groupedUnits.map(({ type, units }) => {
            const statusCounts = getTypeStatusCounts(units);
            const isExpanded = expandedTypes.has(type.id);

            return (
              <Collapsible
                key={type.id}
                open={isExpanded}
                onOpenChange={() => toggleTypeExpanded(type.id)}
              >
                <Card className="border-none shadow-xl shadow-gray-200/50 bg-white rounded-2xl overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <div className="px-6 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-xl ${isExpanded ? 'bg-yellow-100' : 'bg-gray-100'} transition-colors`}>
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-yellow-600" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-lg font-black text-gray-900">{type.name}</h4>
                            <p className="text-xs text-gray-400 font-medium">{type.dimensions}</p>
                          </div>
                          <Badge variant="secondary" className="ml-2 text-xs font-bold bg-gray-100 text-gray-600">
                            {units.length} {units.length === 1 ? 'unit' : 'units'}
                          </Badge>
                        </div>

                        {/* Status summary badges */}
                        <div className="flex items-center gap-2">
                          {statusCounts.available > 0 && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-100">
                              <div className="h-2 w-2 rounded-full bg-green-500" />
                              <span className="text-xs font-bold text-green-700">{statusCounts.available}</span>
                            </div>
                          )}
                          {statusCounts.inUse > 0 && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100">
                              <div className="h-2 w-2 rounded-full bg-blue-500" />
                              <span className="text-xs font-bold text-blue-700">{statusCounts.inUse}</span>
                            </div>
                          )}
                          {statusCounts.maintenance > 0 && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-100">
                              <div className="h-2 w-2 rounded-full bg-orange-500" />
                              <span className="text-xs font-bold text-orange-700">{statusCounts.maintenance}</span>
                            </div>
                          )}
                          {statusCounts.outOfService > 0 && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-100">
                              <div className="h-2 w-2 rounded-full bg-red-500" />
                              <span className="text-xs font-bold text-red-700">{statusCounts.outOfService}</span>
                            </div>
                          )}
                          {units.length === 0 && (
                            <span className="text-xs text-gray-400 font-medium">No units</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    {units.length > 0 ? (
                      <div className="border-t border-gray-100">
                        <Table>
                          <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-gray-50">
                              <TableHead className="px-6 py-3 font-bold text-gray-400 uppercase tracking-widest text-[10px]">Unit ID</TableHead>
                              <TableHead className="py-3 font-bold text-gray-400 uppercase tracking-widest text-[10px]">Status</TableHead>
                              <TableHead className="py-3 font-bold text-gray-400 uppercase tracking-widest text-[10px]">Condition</TableHead>
                              <TableHead className="py-3 font-bold text-gray-400 uppercase tracking-widest text-[10px]">Location</TableHead>
                              <TableHead className="py-3 font-bold text-gray-400 uppercase tracking-widest text-[10px]">Next Service</TableHead>
                              <TableHead className="px-6 py-3 text-right font-bold text-gray-400 uppercase tracking-widest text-[10px]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {units.map((unit) => (
                              <TableRow key={unit.id} className="group hover:bg-gray-50/50 border-gray-50 transition-colors">
                                <TableCell className="px-6">
                                  <span className="font-black text-gray-900 tracking-tight">{unit.unitNumber}</span>
                                </TableCell>
                                <TableCell className="py-3">
                                  <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${unit.status === 'available' ? 'bg-green-100 text-green-700 border border-green-200' :
                                      unit.status === 'in_use' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                        unit.status === 'maintenance' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                          'bg-red-100 text-red-700 border border-red-200'
                                    }`}>
                                    <div className={`h-1.5 w-1.5 rounded-full mr-2 ${unit.status === 'available' ? 'bg-green-500 animate-pulse' :
                                        unit.status === 'in_use' ? 'bg-blue-500' :
                                          unit.status === 'maintenance' ? 'bg-orange-500' : 'bg-red-500'
                                      }`} />
                                    {unit.status.replace('_', ' ')}
                                  </div>
                                </TableCell>
                                <TableCell className="py-3">
                                  <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-wider border-none px-2 py-0.5 rounded-md ${unit.condition === 'excellent' ? 'bg-emerald-50 text-emerald-600' :
                                      unit.condition === 'good' ? 'bg-blue-50 text-blue-600' :
                                        unit.condition === 'fair' ? 'bg-amber-50 text-amber-600' :
                                          'bg-rose-50 text-rose-600'
                                    }`}>
                                    {unit.condition}
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-3">
                                  <div className="flex items-center text-sm font-medium text-gray-500">
                                    <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                    {unit.location}
                                  </div>
                                </TableCell>
                                <TableCell className="py-3">
                                  {unit.nextServiceDate ? (
                                    <div className="flex items-center text-sm font-bold text-gray-500">
                                      <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                      {new Date(unit.nextServiceDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-300 font-bold uppercase tracking-widest">N/A</span>
                                  )}
                                </TableCell>
                                <TableCell className="px-6 py-3 text-right">
                                  <div className="flex items-center justify-end gap-2 text-gray-400">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditUnit(unit);
                                      }}
                                      className="h-8 w-8 rounded-xl hover:bg-yellow-50 hover:text-yellow-600 transition-all"
                                      title="Edit Unit"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => e.stopPropagation()}
                                      className="h-8 w-8 rounded-xl hover:bg-gray-100 transition-all"
                                      title="Service History"
                                    >
                                      <History className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="border-t border-gray-100 px-6 py-8 text-center">
                        <p className="text-sm text-gray-400 font-medium">No dumpsters of this type in inventory</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 font-semibold"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUnitForm(prev => ({ ...prev, dumpsterId: type.id }));
                            setIsCreateDialogOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add {type.name}
                        </Button>
                      </div>
                    )}
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px] rounded-2xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-gray-900">Edit Dumpster</DialogTitle>
            <DialogDescription className="font-medium">
              Update dumpster details and maintenance info.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUnit} className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editUnitNumber" className="font-bold text-gray-700 ml-1">Unit Number</Label>
                <Input
                  id="editUnitNumber"
                  value={unitForm.unitNumber}
                  onChange={(e) => setUnitForm(prev => ({ ...prev, unitNumber: e.target.value }))}
                  className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDumpsterType" className="font-bold text-gray-700 ml-1">Dumpster Type</Label>
                <Select
                  value={unitForm.dumpsterId.toString()}
                  onValueChange={(value) => setUnitForm(prev => ({ ...prev, dumpsterId: parseInt(value) }))}
                >
                  <SelectTrigger className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:ring-yellow-500/20 font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                    {dumpsterTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editUnitStatus" className="font-bold text-gray-700 ml-1">Status</Label>
                <Select
                  value={unitForm.status}
                  onValueChange={(value: any) => setUnitForm(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:ring-yellow-500/20 font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="in_use">In Use</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="out_of_service">Out of Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editUnitCondition" className="font-bold text-gray-700 ml-1">Condition</Label>
                <Select
                  value={unitForm.condition}
                  onValueChange={(value: any) => setUnitForm(prev => ({ ...prev, condition: value }))}
                >
                  <SelectTrigger className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:ring-yellow-500/20 font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="editLocation" className="font-bold text-gray-700 ml-1">Current Location</Label>
                <Input
                  id="editLocation"
                  value={unitForm.location}
                  onChange={(e) => setUnitForm(prev => ({ ...prev, location: e.target.value }))}
                  className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLastService" className="font-bold text-gray-700 ml-1">Last Service</Label>
                <Input
                  id="editLastService"
                  type="date"
                  value={unitForm.lastServiceDate}
                  onChange={(e) => setUnitForm(prev => ({ ...prev, lastServiceDate: e.target.value }))}
                  className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editNextService" className="font-bold text-gray-700 ml-1">Next Service</Label>
                <Input
                  id="editNextService"
                  type="date"
                  value={unitForm.nextServiceDate}
                  onChange={(e) => setUnitForm(prev => ({ ...prev, nextServiceDate: e.target.value }))}
                  className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="editNotes" className="font-bold text-gray-700 ml-1">Notes</Label>
                <Textarea
                  id="editNotes"
                  value={unitForm.notes}
                  onChange={(e) => setUnitForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium py-3"
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <div className="flex items-center justify-between w-full">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => editingUnit && handleDeleteUnit(editingUnit.id)}
                  className="text-red-500 hover:text-red-600 font-bold hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold h-12 rounded-xl shadow-lg shadow-yellow-500/10 transition-all px-10"
                >
                  {isSubmitting ? 'Updating...' : 'Update'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
