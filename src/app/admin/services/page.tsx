'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Search, Plus, Edit, Trash2, DollarSign, Wrench, TrendingUp, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
  createdAt: string;
}

export default function AdminServicesPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', price: 0, isActive: true, serviceType: 'custom_form' });

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ['admin-services'],
    queryFn: async () => {
      const res = await fetch('/api/admin/services');
      if (!res.ok) throw new Error('Failed to fetch services');
      return res.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof serviceForm) => {
      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create service');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      setIsCreateDialogOpen(false);
    }
  });


  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/services/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete service');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
    }
  });

  const filteredServices = services.filter(service => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? service.isActive : !service.isActive);

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: services.length,
    active: services.filter(s => s.isActive).length,
    avgPrice: services.length > 0 ? services.reduce((sum, s) => sum + s.price, 0) / services.length : 0
  };

  if (isLoading && services.length === 0) {
    return (
      <div className="p-10 max-w-[1600px] mx-auto w-full">
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-gray-100 rounded-2xl w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-3xl"></div>)}
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Services</h1>
          <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">Manage rental services and pricing</p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-3xl border-none shadow-2xl p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-gray-900">Add Service</DialogTitle>
                <DialogDescription className="font-medium text-gray-400">Create a new rental service with pricing.</DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(serviceForm); }} className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Name</Label>
                    <Input
                      value={serviceForm.name}
                      onChange={(e) => setServiceForm(prev => ({ ...prev, name: e.target.value }))}
                      className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/10 transition-all font-bold placeholder:font-medium"
                      placeholder="e.g. 10-Yard Dumpster"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Description</Label>
                    <Input
                      value={serviceForm.description}
                      onChange={(e) => setServiceForm(prev => ({ ...prev, description: e.target.value }))}
                      className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/10 transition-all font-bold placeholder:font-medium"
                      placeholder="Service description..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Pricing Type</Label>
                    <Select value={serviceForm.serviceType || 'custom_form'} onValueChange={(val) => setServiceForm(prev => ({ ...prev, serviceType: val }))}>
                      <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 font-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl">
                        <SelectItem value="flat_rate">Fixed Price</SelectItem>
                        <SelectItem value="custom_form">Form-Based Pricing</SelectItem>
                        <SelectItem value="quote_only">Quote Required</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                        Base Price ($) {(serviceForm.serviceType !== 'flat_rate') && <span className="text-gray-300">(Optional)</span>}
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={serviceForm.price || ''}
                        onChange={(e) => setServiceForm(prev => ({ ...prev, price: e.target.value ? parseFloat(e.target.value) : 0 }))}
                        className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/10 transition-all font-bold"
                        placeholder={serviceForm.serviceType === 'quote_only' ? 'N/A' : '0.00'}
                        required={serviceForm.serviceType === 'flat_rate'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Status</Label>
                      <Select value={serviceForm.isActive ? 'active' : 'inactive'} onValueChange={(val) => setServiceForm(prev => ({ ...prev, isActive: val === 'active' }))}>
                        <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 font-black">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-black h-14 rounded-2xl shadow-xl shadow-yellow-500/10 transition-all active:scale-95"
                >
                  {createMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Add Service'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        <StatsCard title="Total Services" value={stats.total} icon={Wrench} color="yellow" subtitle="All rental options" />
        <StatsCard title="Active" value={stats.active} icon={TrendingUp} color="green" subtitle="Available now" />
        <StatsCard title="Avg Price" value={`$${stats.avgPrice.toFixed(2)}`} icon={DollarSign} color="blue" subtitle="Average cost" />
      </div>

      {/* Filters */}
      <Card className="mb-10 border-none shadow-xl shadow-gray-100/50 bg-white rounded-3xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 group-focus-within:text-yellow-500 transition-colors" />
              <Input
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-14 h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/10 transition-all font-bold"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-64 h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:ring-yellow-500/10 font-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card className="border-none shadow-2xl shadow-gray-200/40 bg-white rounded-[32px] overflow-hidden">
        <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-black text-gray-900 tracking-tighter">Services</CardTitle>
            <CardDescription className="font-bold text-gray-400 mt-1 uppercase text-[10px] tracking-widest italic">{filteredServices.length} services</CardDescription>
          </div>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto no-scrollbar">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="px-10 py-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">ID</TableHead>
                  <TableHead className="py-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Service</TableHead>
                  <TableHead className="py-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Price</TableHead>
                  <TableHead className="py-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Status</TableHead>
                  <TableHead className="py-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Created</TableHead>
                  <TableHead className="px-10 py-6 text-right font-black text-gray-400 uppercase tracking-widest text-[10px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => (
                  <TableRow key={service.id} className="group hover:bg-gray-50/80 border-gray-50/50 transition-all duration-300">
                    <TableCell className="px-10">
                      <span className="font-mono font-black text-xs text-gray-300 group-hover:text-yellow-600 transition-colors">#{service.id}</span>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-gray-900 tracking-tight group-hover:text-yellow-700 transition-colors">{service.name}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter max-w-xs truncate" title={service.description}>{service.description}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <span className="font-black text-gray-900 text-lg tracking-tighter">${service.price.toFixed(2)}</span>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${service.isActive
                        ? 'bg-green-50 text-green-700 border-green-100 shadow-green-500/5'
                        : 'bg-gray-50 text-gray-400 border-gray-100'
                        }`}>
                        <div className={`h-2 w-2 rounded-full mr-2.5 ${service.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                        {service.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </TableCell>
                    <TableCell className="py-6 text-sm font-black text-gray-400 tabular-nums">
                      {new Date(service.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="px-10 py-6 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/admin/services/${service.id}/edit`)}
                          className="h-11 w-11 rounded-2xl hover:bg-yellow-50 hover:text-yellow-600 transition-all active:scale-90"
                          title="Edit Service"
                        >
                          <Edit className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(service.id)}
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
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, color, subtitle }: any) {
  const colorMap: any = {
    yellow: "text-yellow-600 bg-yellow-50/50 border-yellow-100 shadow-yellow-500/5",
    green: "text-green-600 bg-green-50/50 border-green-100 shadow-green-500/5",
    blue: "text-blue-600 bg-blue-50/50 border-blue-100 shadow-blue-500/5",
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
