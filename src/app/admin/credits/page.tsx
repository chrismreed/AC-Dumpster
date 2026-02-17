'use client';

import { useState, useEffect } from 'react';
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
import { Search, Plus, DollarSign, CreditCard, User, Calendar, TrendingUp, History, Info, Banknote } from 'lucide-react';

interface CustomerCredit {
  id: number;
  customerAccountId: number;
  bookingId?: number;
  amount: number;
  type: 'refund' | 'credit' | 'adjustment';
  description?: string;
  expiresAt: string;
  createdAt: string;
  customerName?: string;
  customerEmail?: string;
}

interface CustomerAccount {
  id: number;
  customerName: string;
  customerEmail: string;
}

interface CreditForm {
  customerAccountId: string;
  amount: number;
  type: 'refund' | 'credit' | 'adjustment';
  description: string;
  bookingId?: string;
}

export default function AdminCreditsPage() {
  const [credits, setCredits] = useState<CustomerCredit[]>([]);
  const [customers, setCustomers] = useState<CustomerAccount[]>([]);
  const [filteredCredits, setFilteredCredits] = useState<CustomerCredit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [creditForm, setCreditForm] = useState<CreditForm>({
    customerAccountId: '',
    amount: 0,
    type: 'credit',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCredits();
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterCredits();
  }, [credits, searchTerm, customerFilter]);

  const fetchCredits = async () => {
    try {
      const customerCredits = [];
      const customersResponse = await fetch('/api/admin/customer-accounts');
      const customersData = await customersResponse.json();

      for (const customer of customersData.slice(0, 20)) {
        try {
          const creditsResponse = await fetch(`/api/admin/credits/${customer.id}`);
          if (creditsResponse.ok) {
            const customerCreditsData = await creditsResponse.json();
            const creditsWithCustomer = customerCreditsData.map((credit: any) => ({
              ...credit,
              customerName: customer.customerName,
              customerEmail: customer.customerEmail,
            }));
            customerCredits.push(...creditsWithCustomer);
          }
        } catch (error) { }
      }
      setCredits(customerCredits);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/admin/customer-accounts');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) { console.error(error); }
  };

  const filterCredits = () => {
    let filtered = credits;
    if (searchTerm) {
      filtered = filtered.filter(credit =>
        credit.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        credit.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        credit.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (customerFilter !== 'all') filtered = filtered.filter(credit => credit.customerAccountId.toString() === customerFilter);
    setFilteredCredits(filtered);
  };

  const handleCreateCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...creditForm,
          customerAccountId: Number(creditForm.customerAccountId),
          bookingId: creditForm.bookingId ? Number(creditForm.bookingId) : undefined,
        }),
      });
      if (response.ok) {
        await fetchCredits();
        resetForm();
        setIsCreateDialogOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCreditForm({
      customerAccountId: '',
      amount: 0,
      type: 'credit',
      description: '',
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto w-full min-w-0">
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-gray-100 rounded-2xl w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl shadow-sm"></div>)}
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Customer Credits</h1>
          <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">Issue refunds, manage customer balances, and track billing adjustments</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default" size="sm" className="shadow-lg shadow-yellow-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Issue New Credit
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-2xl border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-gray-900">Issue Credit</DialogTitle>
              <DialogDescription className="font-medium">Apply a credit or refund to a customer account.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCredit} className="space-y-6 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customerSelect" className="font-bold text-gray-700 ml-1">Customer</Label>
                  <Select
                    value={creditForm.customerAccountId}
                    onValueChange={(value) => setCreditForm(prev => ({ ...prev, customerAccountId: value }))}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:ring-yellow-500/20 font-medium">
                      <SelectValue placeholder="Select customer..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-100 shadow-xl max-h-60">
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.customerName} ({customer.customerEmail})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="creditAmount" className="font-bold text-gray-700 ml-1">Value ($)</Label>
                    <Input
                      id="creditAmount"
                      type="number"
                      step="0.01"
                      value={creditForm.amount}
                      onChange={(e) => setCreditForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="creditType" className="font-bold text-gray-700 ml-1">Action Type</Label>
                    <Select
                      value={creditForm.type}
                      onValueChange={(value: any) => setCreditForm(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:ring-yellow-500/20 font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                        <SelectItem value="credit">Credit Balance</SelectItem>
                        <SelectItem value="refund">Process Refund</SelectItem>
                        <SelectItem value="adjustment">Internal Adjust</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="creditDescription" className="font-bold text-gray-700 ml-1">Description</Label>
                  <Input
                    id="creditDescription"
                    value={creditForm.description}
                    onChange={(e) => setCreditForm(prev => ({ ...prev, description: e.target.value }))}
                    className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-medium"
                    placeholder="Reason for this credit..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold h-12 rounded-xl shadow-lg transition-all">
                  {isSubmitting ? 'Processing...' : 'Issue Credit'}
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
            <CreditCard className="h-16 w-16 text-yellow-600" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-400">Ledger Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl xl:text-4xl font-black text-gray-900 truncate">{credits.length}</div>
            <div className="flex items-center mt-2 text-xs font-bold text-yellow-600 bg-yellow-50 w-fit px-2 py-1 rounded-full">Total adjustments</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-xl shadow-gray-200/50 bg-white group hover:scale-[1.02] transition-all duration-300">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <Banknote className="h-16 w-16 text-green-600" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-400">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl xl:text-4xl font-black text-gray-900 truncate">
              ${credits.reduce((sum, c) => sum + c.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center mt-2 text-xs font-bold text-green-600 bg-green-50 w-fit px-2 py-1 rounded-full">Cumulative credit</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-xl shadow-gray-200/50 bg-white group hover:scale-[1.02] transition-all duration-300">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <Calendar className="h-16 w-16 text-blue-600" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-400">Active Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl xl:text-4xl font-black text-gray-900 truncate">
              {credits.filter(c => new Date(c.expiresAt) > new Date()).length}
            </div>
            <div className="flex items-center mt-2 text-xs font-bold text-blue-600 bg-blue-50 w-fit px-2 py-1 rounded-full">Non-expired credits</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-xl shadow-gray-200/50 bg-white group hover:scale-[1.02] transition-all duration-300">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <User className="h-16 w-16 text-orange-600" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-400">Beneficiaries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl xl:text-4xl font-black text-gray-900 truncate">{new Set(credits.map(c => c.customerAccountId)).size}</div>
            <div className="flex items-center mt-2 text-xs font-bold text-orange-600 bg-orange-50 w-fit px-2 py-1 rounded-full">Unique accounts</div>
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
                  placeholder="Search by name, email, or resolution memo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-bold"
                />
              </div>
            </div>
            <Select value={customerFilter} onValueChange={setCustomerFilter}>
              <SelectTrigger className="w-full sm:w-64 h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:ring-yellow-500/20 font-bold">
                <SelectValue placeholder="All Customers" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-100 shadow-xl max-h-60">
                <SelectItem value="all">Every Customer Account</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.customerName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-none shadow-xl shadow-gray-200/50 bg-white rounded-3xl overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-black text-gray-900 tracking-tight">Credit Log</CardTitle>
            <CardDescription className="font-medium">Showing {filteredCredits.length} adjustment entries</CardDescription>
          </div>
          <History className="h-5 w-5 text-gray-200" />
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {filteredCredits.length === 0 ? (
              <div className="text-center py-20 bg-gray-50/30">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 w-fit mx-auto mb-6">
                  <DollarSign className="h-12 w-12 text-gray-200" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">No Credits Found</h3>
                <p className="text-gray-500 font-medium">No credits match your search.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow className="hover:bg-transparent border-gray-50">
                    <TableHead className="px-8 py-4 font-black text-gray-400 uppercase tracking-widest text-[10px]">ID</TableHead>
                    <TableHead className="py-4 font-black text-gray-400 uppercase tracking-widest text-[10px]">Customer</TableHead>
                    <TableHead className="py-4 font-black text-gray-400 uppercase tracking-widest text-[10px]">Type</TableHead>
                    <TableHead className="py-4 font-black text-gray-400 uppercase tracking-widest text-[10px]">Amount</TableHead>
                    <TableHead className="py-4 font-black text-gray-400 uppercase tracking-widest text-[10px]">Description</TableHead>
                    <TableHead className="px-8 py-4 text-right font-black text-gray-400 uppercase tracking-widest text-[10px]">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCredits.map((credit) => (
                    <TableRow key={credit.id} className="group hover:bg-gray-50/50 border-gray-50 transition-colors">
                      <TableCell className="px-8 font-black text-gray-300 text-xs">#{credit.id}</TableCell>
                      <TableCell className="py-6">
                        <div className="flex flex-col">
                          <span className="font-black text-gray-900 group-hover:text-yellow-600 transition-colors">{credit.customerName}</span>
                          <span className="text-[10px] font-black uppercase text-gray-400 tracking-tighter italic">{credit.customerEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-widest border-none px-2.5 py-1 rounded-lg ${credit.type === 'refund' ? 'bg-rose-50 text-rose-600' :
                            credit.type === 'credit' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                          {credit.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`font-black text-lg tracking-tight ${credit.amount < 0 ? 'text-rose-600' : 'text-gray-900'}`}>
                          {credit.amount < 0 ? '-' : '+'}${Math.abs(credit.amount).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-bold text-gray-600 line-clamp-2" title={credit.description}>
                            {credit.description || <span className="text-gray-200 italic font-black uppercase tracking-tighter">No memo provided</span>}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-8 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-black text-gray-900 uppercase tracking-tighter">
                            {new Date(credit.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">
                            Expires {new Date(credit.expiresAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                          </span>
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
    </div>
  );
}