'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Plus, Package, Edit, Trash2, DollarSign, Activity, AlertCircle, ShoppingBag, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface AddOn {
  id: number;
  name: string;
  description: string;
  price: number;
  category: 'disposal' | 'delivery' | 'maintenance' | 'other';
  isActive: boolean;
  isRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminAddOnsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAddOn, setEditingAddOn] = useState<AddOn | null>(null);
  const [addOnForm, setAddOnForm] = useState({
    name: '',
    description: '',
    price: 0,
    category: 'disposal' as 'disposal' | 'delivery' | 'maintenance' | 'other',
    isActive: true,
    isRequired: false,
  });

  const { data: addOns = [], isLoading } = useQuery<AddOn[]>({
    queryKey: ['admin-add-ons'],
    queryFn: async () => {
      const res = await fetch('/api/admin/add-ons');
      if (!res.ok) throw new Error('Failed to fetch add-ons');
      const data = await res.json();
      // Convert cents to dollars for display
      return data.map((addon: AddOn) => ({
        ...addon,
        price: addon.price / 100
      }));
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof addOnForm) => {
      const res = await fetch('/api/admin/add-ons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create add-on');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-add-ons'] });
      setIsCreateDialogOpen(false);
      setAddOnForm({ name: '', description: '', price: 0, category: 'disposal', isActive: true, isRequired: false });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof addOnForm }) => {
      const res = await fetch(`/api/admin/add-ons/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update add-on');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-add-ons'] });
      setIsEditDialogOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/add-ons/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete add-on');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-add-ons'] });
    }
  });

  const filteredAddOns = addOns.filter(addOn => {
    const matchesSearch =
      addOn.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      addOn.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || addOn.category === categoryFilter;

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' ? addOn.isActive : addOn.isRequired);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (isLoading && addOns.length === 0) {
    return (
      <div className="p-10 max-w-[1600px] mx-auto w-full">
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-gray-100 rounded-2xl w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-3xl"></div>)}
          </div>
          <div className="h-96 bg-gray-100 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto w-full min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 sm:mb-6 min-w-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Add-Ons</h1>
          <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">Manage optional services and fees.</p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm" className="shadow-xl transition-all active:scale-95">
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] rounded-[32px] border-none shadow-2xl p-10">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black text-gray-900 tracking-tight">Add Service</DialogTitle>
                <DialogDescription className="font-medium text-gray-400">Create a new add-on service or fee.</DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(addOnForm); }} className="space-y-8 mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Name</Label>
                    <Input
                      value={addOnForm.name}
                      onChange={(e) => setAddOnForm(prev => ({ ...prev, name: e.target.value }))}
                      className="h-12 rounded-xl"
                      placeholder="e.g. Heavy Debris Surcharge"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Category</Label>
                    <Select value={addOnForm.category} onValueChange={(val: any) => setAddOnForm(prev => ({ ...prev, category: val }))}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="disposal">Disposal</SelectItem>
                        <SelectItem value="delivery">Delivery</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Price ($)</Label>
                    <NumberInput
                      value={addOnForm.price}
                      onChange={(value) => setAddOnForm(prev => ({ ...prev, price: value }))}
                      className="h-12 rounded-xl"
                      allowDecimals={true}
                      decimalPlaces={2}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Description</Label>
                    <Textarea
                      value={addOnForm.description}
                      onChange={(e) => setAddOnForm(prev => ({ ...prev, description: e.target.value }))}
                      className="rounded-xl py-3 min-h-[100px]"
                      placeholder="Describe the service..."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-6 bg-gray-50/50 rounded-[24px] border border-gray-100">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-black text-gray-900">Active</Label>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Available to customers</p>
                    </div>
                    <Switch checked={addOnForm.isActive} onCheckedChange={(checked) => setAddOnForm(prev => ({ ...prev, isActive: checked }))} />
                  </div>
                  <div className="flex items-center justify-between p-6 bg-gray-50/50 rounded-[24px] border border-gray-100">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-black text-gray-900">Required</Label>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Add to all bookings</p>
                    </div>
                    <Switch checked={addOnForm.isRequired} onCheckedChange={(checked) => setAddOnForm(prev => ({ ...prev, isRequired: checked }))} />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-black h-16 rounded-[24px] shadow-xl shadow-yellow-500/10 transition-all active:scale-95"
                >
                  {createMutation.isPending ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Add Service'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        <StatsCard title="Total Services" value={addOns.length} icon={Package} color="yellow" subtitle="All add-ons" />
        <StatsCard title="Active" value={addOns.filter(a => a.isActive).length} icon={Activity} color="green" subtitle="Available now" />
        <StatsCard title="Required" value={addOns.filter(a => a.isRequired).length} icon={AlertCircle} color="blue" subtitle="Auto-added" />
        <StatsCard title="Avg Price" value={`$${(addOns.length > 0 ? addOns.reduce((s, a) => s + a.price, 0) / addOns.length : 0).toFixed(2)}`} icon={DollarSign} color="orange" subtitle="Average cost" />
      </div>

      {/* Filters */}
      <Card className="mb-10 border-none shadow-xl shadow-gray-100/50 bg-white rounded-3xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-yellow-500 transition-colors" />
              <Input
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 rounded-xl"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48 h-12 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="disposal">Disposal</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 h-12 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="required">Required</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-none shadow-2xl shadow-gray-200/40 bg-white rounded-[32px] overflow-hidden">
        <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-black text-gray-900 tracking-tighter">Add-Ons</CardTitle>
            <CardDescription className="font-bold text-gray-400 mt-1 uppercase text-[10px] tracking-widest italic">{filteredAddOns.length} services</CardDescription>
          </div>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto no-scrollbar">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="px-10 py-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">ID</TableHead>
                  <TableHead className="py-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Service</TableHead>
                  <TableHead className="py-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Category</TableHead>
                  <TableHead className="py-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Price</TableHead>
                  <TableHead className="py-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Status</TableHead>
                  <TableHead className="px-10 py-6 text-right font-black text-gray-400 uppercase tracking-widest text-[10px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAddOns.map((addOn) => (
                  <TableRow key={addOn.id} className="group hover:bg-gray-50/80 border-gray-50/50 transition-all duration-300">
                    <TableCell className="px-10">
                      <span className="font-mono font-black text-xs text-gray-300 group-hover:text-yellow-600 transition-colors">#ADD-{addOn.id}</span>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-gray-900 tracking-tight group-hover:text-yellow-700 transition-colors">{addOn.name}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter max-w-xs truncate" title={addOn.description}>{addOn.description}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-widest border shadow-sm px-3 py-1 rounded-lg ${addOn.category === 'disposal' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                        addOn.category === 'delivery' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          addOn.category === 'maintenance' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            'bg-gray-50 text-gray-500 border-gray-100'
                        }`}>
                        {addOn.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-6">
                      <span className="font-black text-gray-900 text-lg tracking-tighter">${addOn.price.toFixed(2)}</span>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="flex flex-col gap-2">
                        <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm w-fit ${addOn.isActive
                          ? 'bg-green-50 text-green-700 border-green-100'
                          : 'bg-gray-50 text-gray-400 border-gray-100'
                          }`}>
                          <div className={`h-2 w-2 rounded-full mr-2.5 ${addOn.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                          {addOn.isActive ? 'Active' : 'Inactive'}
                        </div>
                        {addOn.isRequired && (
                          <div className="inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-yellow-100 bg-yellow-50 text-yellow-700 shadow-sm w-fit">
                            Required
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-10 py-6 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingAddOn(addOn);
                            setAddOnForm({ name: addOn.name, description: addOn.description, price: addOn.price, category: addOn.category, isActive: addOn.isActive, isRequired: addOn.isRequired });
                            setIsEditDialogOpen(true);
                          }}
                          className="h-11 w-11 rounded-2xl hover:bg-yellow-50 hover:text-yellow-600 transition-all active:scale-90"
                        >
                          <Edit className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(addOn.id)}
                          className="h-11 w-11 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all active:scale-90"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[32px] border-none shadow-2xl p-10">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black text-gray-900 tracking-tight">Edit Service</DialogTitle>
            <DialogDescription className="font-medium text-gray-400">Update add-on #{editingAddOn?.id}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (editingAddOn) updateMutation.mutate({ id: editingAddOn.id, data: addOnForm }); }} className="space-y-8 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Name</Label>
                <Input
                  value={addOnForm.name}
                  onChange={(e) => setAddOnForm(prev => ({ ...prev, name: e.target.value }))}
                  className="h-12 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Category</Label>
                <Select value={addOnForm.category} onValueChange={(val: any) => setAddOnForm(prev => ({ ...prev, category: val }))}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="disposal">Disposal</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Price ($)</Label>
                <NumberInput
                  value={addOnForm.price}
                  onChange={(value) => setAddOnForm(prev => ({ ...prev, price: value }))}
                  className="h-12 rounded-xl"
                  allowDecimals={true}
                  decimalPlaces={2}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Description</Label>
                <Textarea
                  value={addOnForm.description}
                  onChange={(e) => setAddOnForm(prev => ({ ...prev, description: e.target.value }))}
                  className="rounded-xl py-3 min-h-[100px]"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-6 bg-gray-50/50 rounded-[24px] border border-gray-100">
                <div className="space-y-0.5">
                  <Label className="text-sm font-black text-gray-900">Active</Label>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Available to customers</p>
                </div>
                <Switch checked={addOnForm.isActive} onCheckedChange={(checked) => setAddOnForm(prev => ({ ...prev, isActive: checked }))} />
              </div>
              <div className="flex items-center justify-between p-6 bg-gray-50/50 rounded-[24px] border border-gray-100">
                <div className="space-y-0.5">
                  <Label className="text-sm font-black text-gray-900">Required</Label>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Add to all bookings</p>
                </div>
                <Switch checked={addOnForm.isRequired} onCheckedChange={(checked) => setAddOnForm(prev => ({ ...prev, isRequired: checked }))} />
              </div>
            </div>

            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="w-full bg-gray-900 hover:bg-black text-white font-black h-16 rounded-[24px] shadow-xl transition-all active:scale-95"
            >
              {updateMutation.isPending ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Update Service'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, color, subtitle }: any) {
  const colorMap: any = {
    yellow: "text-yellow-600 bg-yellow-50/50 border-yellow-100 shadow-yellow-500/5",
    green: "text-green-600 bg-green-50/50 border-green-100 shadow-green-500/5",
    blue: "text-blue-600 bg-blue-50/50 border-blue-100 shadow-blue-500/5",
    orange: "text-orange-600 bg-orange-50/50 border-orange-100 shadow-orange-500/5",
  };

  return (
    <Card className={`border-none shadow-2xl bg-white group hover:scale-[1.03] transition-all duration-500 rounded-[32px] overflow-hidden ${colorMap[color]}`}>
      <CardContent className="p-10 flex items-center justify-between relative">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-150 transition-transform duration-700">
          <Icon className="h-32 w-32" />
        </div>
        <div className="relative z-10">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{title}</p>
          <div className="text-4xl font-black text-gray-900 tracking-tighter">{value}</div>
          {subtitle && <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest italic">{subtitle}</p>}
        </div>
        <div className={`h-16 w-16 rounded-[24px] border-2 border-white flex items-center justify-center shadow-xl transition-all group-hover:rotate-12 duration-500 ${colorMap[color]}`}>
          <Icon className="h-8 w-8" />
        </div>
      </CardContent>
    </Card>
  );
}