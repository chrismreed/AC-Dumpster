'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { Search, Plus, MapPin, Phone, Mail, Edit, Trash2, Activity } from 'lucide-react';

interface Hub {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
}

interface HubForm {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  isActive: boolean;
}

export default function AdminHubsPage() {
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [filteredHubs, setFilteredHubs] = useState<Hub[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingHub, setEditingHub] = useState<Hub | null>(null);
  const [hubForm, setHubForm] = useState<HubForm>({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchHubs();
  }, []);

  useEffect(() => {
    filterHubs();
  }, [hubs, searchTerm]);

  const fetchHubs = async () => {
    try {
      const response = await fetch('/api/admin/hubs');
      if (response.ok) {
        const data = await response.json();
        setHubs(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filterHubs = () => {
    let filtered = hubs;

    if (searchTerm) {
      filtered = filtered.filter(hub =>
        hub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hub.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hub.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredHubs(filtered);
  };

  const resetForm = () => {
    setHubForm({
      name: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
      email: '',
      isActive: true,
    });
  };

  const handleCreateHub = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/hubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hubForm),
      });

      if (response.ok) {
        const newHub = await response.json();
        setHubs(prev => [newHub, ...prev]);
        resetForm();
        setIsCreateDialogOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditHub = (hub: Hub) => {
    setEditingHub(hub);
    setHubForm({
      name: hub.name,
      address: hub.address,
      city: hub.city,
      state: hub.state,
      zipCode: hub.zipCode,
      phone: hub.phone || '',
      email: hub.email || '',
      isActive: hub.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHub) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/hubs/${editingHub.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hubForm),
      });

      if (response.ok) {
        const updatedHub = await response.json();
        setHubs(prev => prev.map(h => h.id === editingHub.id ? updatedHub : h));
        setIsEditDialogOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteHub = async (hubId: number) => {
    if (!confirm('Are you sure you want to delete this drop-off location?')) return;

    try {
      const response = await fetch(`/api/admin/hubs/${hubId}`, { method: 'DELETE' });
      if (response.ok) {
        setHubs(prev => prev.filter(h => h.id !== hubId));
      }
    } catch (error) {
      console.error('Failed to delete hub:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto w-full">
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-gray-100 rounded-2xl w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl shadow-sm"></div>)}
          </div>
          <div className="h-96 bg-gray-100 rounded-3xl shadow-sm"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto w-full min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 sm:mb-6 min-w-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Drop-Off Locations</h1>
          <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">Where drivers drop off dumpsters after pickup</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default" size="sm" className="shadow-lg shadow-yellow-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] rounded-2xl border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-gray-900">Add Drop-Off Location</DialogTitle>
              <DialogDescription className="font-medium">
                Add a new location where drivers can drop off dumpsters.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateHub} className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="hubName" className="font-bold text-gray-700 ml-1">Location Name</Label>
                  <Input
                    id="hubName"
                    value={hubForm.name}
                    onChange={(e) => setHubForm(prev => ({ ...prev, name: e.target.value }))}
                    className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium"
                    placeholder="e.g., Main Dump Site, South Yard"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="hubAddress" className="font-bold text-gray-700 ml-1">Street Address</Label>
                  <Input
                    id="hubAddress"
                    value={hubForm.address}
                    onChange={(e) => setHubForm(prev => ({ ...prev, address: e.target.value }))}
                    className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium"
                    placeholder="123 Dump Road"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hubCity" className="font-bold text-gray-700 ml-1">City</Label>
                  <Input
                    id="hubCity"
                    value={hubForm.city}
                    onChange={(e) => setHubForm(prev => ({ ...prev, city: e.target.value }))}
                    className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hubState" className="font-bold text-gray-700 ml-1">State</Label>
                    <Input
                      id="hubState"
                      value={hubForm.state}
                      onChange={(e) => setHubForm(prev => ({ ...prev, state: e.target.value }))}
                      className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hubZip" className="font-bold text-gray-700 ml-1">ZIP</Label>
                    <Input
                      id="hubZip"
                      value={hubForm.zipCode}
                      onChange={(e) => setHubForm(prev => ({ ...prev, zipCode: e.target.value }))}
                      className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hubPhone" className="font-bold text-gray-700 ml-1">Phone</Label>
                  <Input
                    id="hubPhone"
                    value={hubForm.phone}
                    onChange={(e) => setHubForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium"
                    placeholder="(555) 000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hubEmail" className="font-bold text-gray-700 ml-1">Email</Label>
                  <Input
                    id="hubEmail"
                    type="email"
                    value={hubForm.email}
                    onChange={(e) => setHubForm(prev => ({ ...prev, email: e.target.value }))}
                    className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive" className="font-bold text-gray-900">Active</Label>
                  <p className="text-xs text-gray-500 font-medium">Location is open for drop-offs</p>
                </div>
                <Switch
                  id="isActive"
                  checked={hubForm.isActive}
                  onCheckedChange={(checked) => setHubForm(prev => ({ ...prev, isActive: checked }))}
                />
              </div>

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold h-12 rounded-xl shadow-lg shadow-yellow-500/10 transition-all"
                >
                  {isSubmitting ? 'Adding...' : 'Add Location'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card className="relative overflow-hidden border-none shadow-xl shadow-gray-200/50 bg-white group hover:scale-[1.02] transition-all duration-300">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <MapPin className="h-16 w-16 text-yellow-600" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-400">Total Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl xl:text-4xl font-black text-gray-900 truncate">{hubs.length}</div>
            <div className="flex items-center mt-2 text-xs font-bold text-yellow-600 bg-yellow-50 w-fit px-2 py-1 rounded-full">Drop-off sites</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-xl shadow-gray-200/50 bg-white group hover:scale-[1.02] transition-all duration-300">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <Activity className="h-16 w-16 text-green-600" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-400">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl xl:text-4xl font-black text-gray-900 truncate">{hubs.filter(h => h.isActive).length}</div>
            <div className="flex items-center mt-2 text-xs font-bold text-green-600 bg-green-50 w-fit px-2 py-1 rounded-full">Open now</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-xl shadow-gray-200/50 bg-white group hover:scale-[1.02] transition-all duration-300">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <MapPin className="h-16 w-16 text-blue-600" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-400">Cities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl xl:text-4xl font-black text-gray-900 truncate">
              {new Set(hubs.map(h => h.city.toLowerCase())).size}
            </div>
            <div className="flex items-center mt-2 text-xs font-bold text-blue-600 bg-blue-50 w-fit px-2 py-1 rounded-full">Coverage</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-10 border-none shadow-lg shadow-gray-100 bg-white rounded-2xl overflow-hidden">
        <CardContent className="pt-6">
          <div className="relative group max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-yellow-500 transition-colors" />
            <Input
              placeholder="Search by name, city, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-none shadow-xl shadow-gray-200/50 bg-white rounded-2xl overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-50">
          <CardTitle className="text-xl font-black text-gray-900 tracking-tight">Drop-Off Locations</CardTitle>
          <CardDescription className="font-medium">Showing {filteredHubs.length} locations</CardDescription>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {filteredHubs.length === 0 ? (
              <div className="text-center py-20 bg-gray-50/30">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 w-fit mx-auto mb-6">
                  <MapPin className="h-12 w-12 text-gray-200" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">No locations found</h3>
                <p className="text-gray-500 font-medium max-w-sm mx-auto">Try adjusting your search.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow className="hover:bg-transparent border-gray-50">
                    <TableHead className="px-8 py-4 font-bold text-gray-400 uppercase tracking-widest text-[10px]">ID</TableHead>
                    <TableHead className="py-4 font-bold text-gray-400 uppercase tracking-widest text-[10px]">Location</TableHead>
                    <TableHead className="py-4 font-bold text-gray-400 uppercase tracking-widest text-[10px]">Contact</TableHead>
                    <TableHead className="py-4 font-bold text-gray-400 uppercase tracking-widest text-[10px]">Status</TableHead>
                    <TableHead className="px-8 py-4 text-right font-bold text-gray-400 uppercase tracking-widest text-[10px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHubs.map((hub) => (
                    <TableRow key={hub.id} className="group hover:bg-gray-50/50 border-gray-50 transition-colors">
                      <TableCell className="px-8">
                        <span className="font-black text-gray-400 text-xs">#{hub.id}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 group-hover:text-yellow-600 transition-colors">{hub.name}</span>
                          <span className="text-xs text-gray-400 font-medium">{hub.address}, {hub.city} {hub.state}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col gap-1">
                          {hub.phone && (
                            <div className="flex items-center text-xs font-bold text-gray-600">
                              <Phone className="h-3 w-3 mr-1.5 text-gray-400" />
                              {hub.phone}
                            </div>
                          )}
                          {hub.email && (
                            <div className="flex items-center text-xs font-bold text-gray-400">
                              <Mail className="h-3 w-3 mr-1.5" />
                              {hub.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${hub.isActive ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}>
                          <div className={`h-1.5 w-1.5 rounded-full mr-2 ${hub.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                          {hub.isActive ? 'Open' : 'Closed'}
                        </div>
                      </TableCell>
                      <TableCell className="px-8 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 text-gray-400">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditHub(hub)}
                            className="h-9 w-9 rounded-xl hover:bg-yellow-50 hover:text-yellow-600 transition-all"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteHub(hub.id)}
                            className="h-9 w-9 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px] rounded-2xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-gray-900">Edit Drop-Off Location</DialogTitle>
            <DialogDescription className="font-medium">
              Update location details and contact info.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateHub} className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="editName" className="font-bold text-gray-700 ml-1">Location Name</Label>
                <Input
                  id="editName"
                  value={hubForm.name}
                  onChange={(e) => setHubForm(prev => ({ ...prev, name: e.target.value }))}
                  className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium"
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="editAddress" className="font-bold text-gray-700 ml-1">Street Address</Label>
                <Input
                  id="editAddress"
                  value={hubForm.address}
                  onChange={(e) => setHubForm(prev => ({ ...prev, address: e.target.value }))}
                  className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCity" className="font-bold text-gray-700 ml-1">City</Label>
                <Input
                  id="editCity"
                  value={hubForm.city}
                  onChange={(e) => setHubForm(prev => ({ ...prev, city: e.target.value }))}
                  className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editState" className="font-bold text-gray-700 ml-1">State</Label>
                  <Input
                    id="editState"
                    value={hubForm.state}
                    onChange={(e) => setHubForm(prev => ({ ...prev, state: e.target.value }))}
                    className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editZip" className="font-bold text-gray-700 ml-1">ZIP</Label>
                  <Input
                    id="editZip"
                    value={hubForm.zipCode}
                    onChange={(e) => setHubForm(prev => ({ ...prev, zipCode: e.target.value }))}
                    className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPhone" className="font-bold text-gray-700 ml-1">Phone</Label>
                <Input
                  id="editPhone"
                  value={hubForm.phone}
                  onChange={(e) => setHubForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEmail" className="font-bold text-gray-700 ml-1">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={hubForm.email}
                  onChange={(e) => setHubForm(prev => ({ ...prev, email: e.target.value }))}
                  className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="space-y-0.5">
                <Label htmlFor="editIsActive" className="font-bold text-gray-900">Active</Label>
                <p className="text-xs text-gray-500 font-medium">Location is open for drop-offs</p>
              </div>
              <Switch
                id="editIsActive"
                checked={hubForm.isActive}
                onCheckedChange={(checked) => setHubForm(prev => ({ ...prev, isActive: checked }))}
              />
            </div>

            <DialogFooter>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold h-12 rounded-xl shadow-lg shadow-yellow-500/10 transition-all"
              >
                {isSubmitting ? 'Updating...' : 'Update Location'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
