'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StringNumberInput } from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, MapPin, Globe, Map as MapIcon, Navigation, Loader2, AlertTriangle, Activity, DollarSign, Target } from 'lucide-react';
import { GeofenceEditor } from '@/components/GeofenceEditor';

interface ServiceZone {
  id: number;
  name: string;
  zipCodes: string;
  deliveryFee: number;
  useGeofencing: boolean;
  centerLat?: number | null;
  centerLng?: number | null;
  radiusMeters?: number | null;
  polygonPath?: string | null;
  feeMultiplier: number;
  maxDrivingMinutes?: number | null;
  priority: number;
  sameDayDeliveryEnabled: boolean;
  sameDayDeliveryFee: number;
  sameDayCutoffTime?: string | null;
  createdAt: string;
}

interface ZoneForm {
  name: string;
  zipCodes: string;
  deliveryFee: number | string;
  useGeofencing: boolean;
  centerLat: string;
  centerLng: string;
  radiusMeters: string;
  feeMultiplier: number;
  maxDrivingMinutes: string;
  priority: number | string;
  sameDayDeliveryEnabled: boolean;
  sameDayDeliveryFee: number | string;
  sameDayCutoffTime: string;
}

export default function AdminZonesPage() {
  const [zones, setZones] = useState<ServiceZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isGeofenceEditorOpen, setIsGeofenceEditorOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<ServiceZone | null>(null);
  const [zoneForm, setZoneForm] = useState<ZoneForm>({
    name: '',
    zipCodes: '',
    deliveryFee: '',
    useGeofencing: false,
    centerLat: '',
    centerLng: '',
    radiusMeters: '',
    feeMultiplier: 1.0,
    maxDrivingMinutes: '',
    priority: '',
    sameDayDeliveryEnabled: false,
    sameDayDeliveryFee: '',
    sameDayCutoffTime: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [polygonPath, setPolygonPath] = useState<{ lat: number; lng: number }[] | null>(null);

  useEffect(() => {
    fetchZones();
  }, []);

  const getOverlappingZones = (zone: ServiceZone): ServiceZone[] => {
    const overlaps: ServiceZone[] = [];
    for (const otherZone of zones) {
      if (otherZone.id === zone.id) continue;
      if (!zone.useGeofencing && !otherZone.useGeofencing) {
        const zoneZips = zone.zipCodes.split(',').map(z => z.trim());
        const otherZips = otherZone.zipCodes.split(',').map(z => z.trim());
        if (zoneZips.some(zip => otherZips.includes(zip))) {
          overlaps.push(otherZone);
        }
      } else if (zone.useGeofencing !== otherZone.useGeofencing) {
        overlaps.push(otherZone);
      }
    }
    return overlaps;
  };

  const fetchZones = async () => {
    try {
      const response = await fetch('/api/admin/zones');
      if (response.ok) {
        const data = await response.json();
        setZones(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setZoneForm({
      name: '',
      zipCodes: '',
      deliveryFee: '',
      useGeofencing: false,
      centerLat: '',
      centerLng: '',
      radiusMeters: '',
      feeMultiplier: 1.0,
      maxDrivingMinutes: '',
      priority: '',
      sameDayDeliveryEnabled: false,
      sameDayDeliveryFee: '',
      sameDayCutoffTime: '',
    });
  };

  const handleAddZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = {
        name: zoneForm.name,
        zipCodes: zoneForm.zipCodes,
        deliveryFee: Math.round((parseFloat(zoneForm.deliveryFee as string) || 0) * 100),
        useGeofencing: zoneForm.useGeofencing,
        centerLat: zoneForm.centerLat ? parseFloat(zoneForm.centerLat) : null,
        centerLng: zoneForm.centerLng ? parseFloat(zoneForm.centerLng) : null,
        radiusMeters: zoneForm.radiusMeters ? parseInt(zoneForm.radiusMeters) : null,
        feeMultiplier: zoneForm.feeMultiplier,
        maxDrivingMinutes: zoneForm.maxDrivingMinutes ? parseInt(zoneForm.maxDrivingMinutes) : null,
        priority: parseInt(zoneForm.priority as string) || 0,
        sameDayDeliveryEnabled: zoneForm.sameDayDeliveryEnabled,
        sameDayDeliveryFee: Math.round((parseFloat(zoneForm.sameDayDeliveryFee as string) || 0) * 100),
        sameDayCutoffTime: zoneForm.sameDayCutoffTime || null,
      };
      const response = await fetch('/api/admin/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        await fetchZones();
        resetForm();
        setIsAddDialogOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (zone: ServiceZone) => {
    setSelectedZone(zone);
    if (zone.polygonPath) {
      try { setPolygonPath(JSON.parse(zone.polygonPath)); } catch (e) { setPolygonPath(null); }
    } else { setPolygonPath(null); }
    setZoneForm({
      name: zone.name,
      zipCodes: zone.zipCodes,
      deliveryFee: zone.deliveryFee / 100,
      useGeofencing: zone.useGeofencing || false,
      centerLat: zone.centerLat?.toString() || '',
      centerLng: zone.centerLng?.toString() || '',
      radiusMeters: zone.radiusMeters?.toString() || '',
      feeMultiplier: zone.feeMultiplier || 1.0,
      maxDrivingMinutes: zone.maxDrivingMinutes?.toString() || '',
      priority: zone.priority || 0,
      sameDayDeliveryEnabled: zone.sameDayDeliveryEnabled || false,
      sameDayDeliveryFee: zone.sameDayDeliveryFee / 100,
      sameDayCutoffTime: zone.sameDayCutoffTime || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZone) return;
    setIsSubmitting(true);
    try {
      const formData = {
        name: zoneForm.name,
        zipCodes: zoneForm.useGeofencing ? '' : zoneForm.zipCodes,
        deliveryFee: Math.round((parseFloat(zoneForm.deliveryFee as string) || 0) * 100),
        useGeofencing: zoneForm.useGeofencing,
        polygonPath: polygonPath ? JSON.stringify(polygonPath) : null,
        centerLat: polygonPath && polygonPath.length > 0 ? polygonPath.reduce((sum, p) => sum + p.lat, 0) / polygonPath.length : null,
        centerLng: polygonPath && polygonPath.length > 0 ? polygonPath.reduce((sum, p) => sum + p.lng, 0) / polygonPath.length : null,
        radiusMeters: null,
        feeMultiplier: zoneForm.feeMultiplier,
        maxDrivingMinutes: zoneForm.maxDrivingMinutes ? parseInt(zoneForm.maxDrivingMinutes) : null,
        priority: parseInt(zoneForm.priority as string) || 0,
        sameDayDeliveryEnabled: zoneForm.sameDayDeliveryEnabled,
        sameDayDeliveryFee: Math.round((parseFloat(zoneForm.sameDayDeliveryFee as string) || 0) * 100),
        sameDayCutoffTime: zoneForm.sameDayCutoffTime || null,
      };
      const response = await fetch(`/api/admin/zones/${selectedZone.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        await fetchZones();
        setIsEditDialogOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/zones/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchZones();
        if (selectedZone?.id === id) setSelectedZone(null);
      }
    } catch (error) {
      console.error('Failed to delete zone:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto w-full">
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-gray-100 rounded-2xl w-64"></div>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-4 h-96 bg-gray-100 rounded-3xl shadow-sm"></div>
            <div className="col-span-8 h-96 bg-gray-100 rounded-3xl shadow-sm"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto w-full min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 sm:mb-6 min-w-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Service Zones</h1>
          <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">Manage geographic service areas and location-based pricing</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default" size="sm" className="shadow-lg shadow-yellow-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Zone
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] rounded-2xl border-none shadow-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-gray-900">New Service Zone</DialogTitle>
              <DialogDescription className="font-medium">Define pricing and boundaries for a new region.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddZone} className="space-y-6 mt-4">
              <div className="space-y-2">
                <Label htmlFor="zoneName" className="font-bold text-gray-700 ml-1">Zone Name</Label>
                <Input
                  id="zoneName"
                  value={zoneForm.name}
                  onChange={(e) => setZoneForm(prev => ({ ...prev, name: e.target.value }))}
                  className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium"
                  placeholder="e.g., North County"
                  required
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="space-y-0.5">
                  <Label className="font-bold text-gray-900">Use Geofencing</Label>
                  <p className="text-xs text-gray-500 font-medium">Draw custom boundaries instead of ZIP codes</p>
                </div>
                <Switch
                  checked={zoneForm.useGeofencing}
                  onCheckedChange={(checked) => setZoneForm(prev => ({ ...prev, useGeofencing: checked }))}
                />
              </div>

              {!zoneForm.useGeofencing && (
                <div className="space-y-2">
                  <Label htmlFor="zoneZipCodes" className="font-bold text-gray-700 ml-1">ZIP Codes</Label>
                  <Textarea
                    id="zoneZipCodes"
                    value={zoneForm.zipCodes}
                    onChange={(e) => setZoneForm(prev => ({ ...prev, zipCodes: e.target.value }))}
                    className="rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium py-3"
                    rows={3}
                    placeholder="90210, 90211, 90212..."
                    required={!zoneForm.useGeofencing}
                  />
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider ml-1">Comma-separated values</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zoneDeliveryFee" className="font-bold text-gray-700 ml-1">Delivery Fee ($)</Label>
                  <StringNumberInput
                    id="zoneDeliveryFee"
                    value={zoneForm.deliveryFee}
                    onChange={(value) => setZoneForm(prev => ({ ...prev, deliveryFee: value }))}
                    className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium"
                    allowDecimals={true}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zonePriority" className="font-bold text-gray-700 ml-1">Priority (0-99)</Label>
                  <StringNumberInput
                    id="zonePriority"
                    value={zoneForm.priority}
                    onChange={(value) => setZoneForm(prev => ({ ...prev, priority: value }))}
                    className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium"
                    allowDecimals={false}
                    placeholder="0"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isSubmitting} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold h-12 rounded-xl shadow-lg transition-all">
                  {isSubmitting ? 'Processing...' : 'Create Zone'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Sidebar - Zone List */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <Card className="border-none shadow-xl shadow-gray-200/50 bg-white rounded-3xl overflow-hidden h-full">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="text-xl font-black text-gray-900 tracking-tight">Zone Directory</CardTitle>
              <CardDescription className="font-medium">All registered service regions</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-50">
                {zones.map((zone) => {
                  const overlaps = getOverlappingZones(zone);
                  const isSelected = selectedZone?.id === zone.id;
                  return (
                    <button
                      key={zone.id}
                      onClick={() => setSelectedZone(zone)}
                      className={`w-full text-left px-8 py-6 transition-all relative group ${isSelected ? 'bg-yellow-50/50' : 'hover:bg-gray-50'
                        }`}
                    >
                      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-yellow-500 rounded-r-full" />}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {zone.useGeofencing ? <Globe className="h-4 w-4 text-yellow-600" /> : <MapPin className="h-4 w-4 text-blue-600" />}
                            <h3 className={`font-black text-sm truncate ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>{zone.name}</h3>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-black text-gray-900">${(zone.deliveryFee / 100).toFixed(2)}</span>
                            {overlaps.length > 0 && (
                              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border-none px-2 py-0">Overlaps</Badge>
                            )}
                            {zone.priority > 0 && (
                              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 border-none px-2 py-0">P{zone.priority}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Zone Details */}
        <div className="col-span-12 lg:col-span-8">
          {selectedZone ? (
            <Card className="border-none shadow-2xl shadow-gray-200/50 bg-white rounded-3xl overflow-hidden border border-gray-100">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100 px-10 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-white shadow-lg flex items-center justify-center">
                      {selectedZone.useGeofencing ? <Globe className="h-8 w-8 text-yellow-600" /> : <Target className="h-8 w-8 text-blue-600" />}
                    </div>
                    <div>
                      <CardTitle className="text-3xl font-black text-gray-900 tracking-tight">{selectedZone.name}</CardTitle>
                      <CardDescription className="font-bold uppercase tracking-widest text-[10px] text-gray-400 mt-1">
                        {selectedZone.useGeofencing ? 'Polygon Geofence Region' : 'Service Zone ZIP Codes'}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(selectedZone)} className="rounded-xl font-bold h-10 border-gray-100 bg-white hover:bg-yellow-50 hover:text-yellow-600 transition-all">
                      <Edit className="mr-2 h-4 w-4" /> Edit Zone
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="rounded-xl font-bold h-10 hover:bg-rose-50 hover:text-rose-600 text-gray-400 transition-all">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-xl font-black">Confirm Deletion</AlertDialogTitle>
                          <AlertDialogDescription className="font-medium text-gray-500">
                            Delete "{selectedZone.name}"? This will remove all pricing and boundary rules for this region.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(selectedZone.id)} className="rounded-xl font-bold bg-rose-600 hover:bg-rose-700">Delete Permanently</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-10 py-10 space-y-10">
                {/* Stats Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Base Fee</p>
                    <p className="text-2xl font-black text-gray-900">${(selectedZone.deliveryFee / 100).toFixed(2)}</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pricing Priority</p>
                    <p className="text-2xl font-black text-gray-900">{selectedZone.priority}</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Multiplier</p>
                    <p className="text-2xl font-black text-gray-900">{selectedZone.feeMultiplier.toFixed(1)}x</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Service Model</p>
                    <Badge variant="outline" className={`text-[10px] font-black uppercase border-none px-0 ${selectedZone.useGeofencing ? 'text-yellow-600' : 'text-blue-600'}`}>
                      {selectedZone.useGeofencing ? 'Geofence' : 'ZIP Code'}
                    </Badge>
                  </div>
                </div>

                {/* Overlap Warning */}
                {(() => {
                  const overlaps = getOverlappingZones(selectedZone);
                  if (overlaps.length > 0) return (
                    <div className="bg-rose-50 border-2 border-rose-100 rounded-3xl p-8">
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                          <AlertTriangle className="h-5 w-5 text-rose-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-black text-rose-900 text-lg mb-1">Zone Overlap Conflict</h4>
                          <p className="text-sm text-rose-800/80 font-semibold mb-4">This region competes with {overlaps.length} other zones. Highest priority wins conflict.</p>
                          <div className="flex flex-wrap gap-2">
                            {overlaps.map(o => (
                              <div key={o.id} className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-100 rounded-xl text-xs font-black text-rose-700">
                                <span>{o.name}</span>
                                <span className="opacity-50">•</span>
                                <span>P{o.priority}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                  return null;
                })()}

                {/* Data Display */}
                {!selectedZone.useGeofencing ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Navigation className="h-5 w-5 text-blue-600" />
                      <h3 className="font-black text-lg text-gray-900">Service ZIP Directory</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {selectedZone.zipCodes.split(',').map(zip => (
                        <div key={zip} className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 text-center font-black text-gray-700 text-sm shadow-sm">
                          {zip.trim()}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapIcon className="h-5 w-5 text-yellow-600" />
                        <h3 className="font-black text-lg text-gray-900">Boundary Visualization</h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsGeofenceEditorOpen(!isGeofenceEditorOpen)}
                        className="rounded-xl font-black text-[10px] uppercase tracking-wider h-10 px-6 bg-gray-50 hover:bg-yellow-50 hover:text-yellow-600"
                      >
                        {isGeofenceEditorOpen ? 'Exit Editor' : 'Modify Boundary'}
                      </Button>
                    </div>

                    <div className="relative rounded-3xl h-[600px] overflow-hidden border-4 border-gray-50 shadow-inner group">
                      <GeofenceEditor
                        isOpen={isGeofenceEditorOpen}
                        onClose={() => setIsGeofenceEditorOpen(false)}
                        onSave={async (newPolygonPath) => {
                          setPolygonPath(newPolygonPath);
                          setIsGeofenceEditorOpen(false);
                          try {
                            const centerLat = newPolygonPath.reduce((sum, p) => sum + p.lat, 0) / newPolygonPath.length;
                            const centerLng = newPolygonPath.reduce((sum, p) => sum + p.lng, 0) / newPolygonPath.length;
                            await fetch(`/api/admin/zones/${selectedZone.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                ...selectedZone,
                                polygonPath: JSON.stringify(newPolygonPath),
                                centerLat, centerLng, zipCodes: '',
                                deliveryFee: selectedZone.deliveryFee,
                                sameDayDeliveryFee: selectedZone.sameDayDeliveryFee,
                              }),
                            });
                            await fetchZones();
                          } catch (error) { console.error(error); }
                        }}
                        initialPolygon={selectedZone.polygonPath ? JSON.parse(selectedZone.polygonPath) : null}
                        zoneName={selectedZone.name}
                        initialCenter={selectedZone.centerLat && selectedZone.centerLng ? { lat: selectedZone.centerLat, lng: selectedZone.centerLng } : undefined}
                        inline={true}
                      />
                      {!isGeofenceEditorOpen && (
                        <div className="absolute inset-0 bg-transparent pointer-events-none group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="bg-white px-6 py-3 rounded-2xl shadow-2xl font-black text-xs uppercase tracking-widest text-gray-900">ReadOnly Visualization</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-20 rounded-3xl border-4 border-dashed border-gray-100 text-center">
              <div className="bg-gray-50 p-10 rounded-full mb-8">
                <Navigation className="h-20 w-20 text-gray-200" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Focus Region Required</h3>
              <p className="text-gray-400 font-bold uppercase tracking-wider text-xs">Select a service zone from the directory to manage coverage</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl border-none shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-gray-900">Update Service Zone</DialogTitle>
            <DialogDescription className="font-medium">Modify region details and logic.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateZone} className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label htmlFor="editName" className="font-bold text-gray-700 ml-1">Zone Name</Label>
              <Input
                id="editName"
                value={zoneForm.name}
                onChange={(e) => setZoneForm(prev => ({ ...prev, name: e.target.value }))}
                className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium"
                required
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="space-y-0.5">
                <Label className="font-bold text-gray-900">Use Geofencing</Label>
                <p className="text-xs text-gray-500 font-medium">Draw custom boundaries instead of ZIP codes</p>
              </div>
              <Switch
                checked={zoneForm.useGeofencing}
                onCheckedChange={(checked) => setZoneForm(prev => ({ ...prev, useGeofencing: checked }))}
              />
            </div>

            {!zoneForm.useGeofencing && (
              <div className="space-y-2">
                <Label htmlFor="editZipCodes" className="font-bold text-gray-700 ml-1">ZIP Codes</Label>
                <Textarea
                  id="editZipCodes"
                  value={zoneForm.zipCodes}
                  onChange={(e) => setZoneForm(prev => ({ ...prev, zipCodes: e.target.value }))}
                  className="rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium py-3"
                  rows={3}
                  required={!zoneForm.useGeofencing}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editFee" className="font-bold text-gray-700 ml-1">Delivery Fee ($)</Label>
                <StringNumberInput
                  id="editFee"
                  value={zoneForm.deliveryFee}
                  onChange={(value) => setZoneForm(prev => ({ ...prev, deliveryFee: value }))}
                  className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium"
                  allowDecimals={true}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPriority" className="font-bold text-gray-700 ml-1">Priority</Label>
                <StringNumberInput
                  id="editPriority"
                  value={zoneForm.priority}
                  onChange={(value) => setZoneForm(prev => ({ ...prev, priority: value }))}
                  className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium"
                  allowDecimals={false}
                  placeholder="0"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold h-12 rounded-xl shadow-lg transition-all">
                {isSubmitting ? 'Processing...' : 'Update Zone'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
