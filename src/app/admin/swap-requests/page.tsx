'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Search, Check, X, Clock, DollarSign, Calendar, User, FileText, ArrowRightLeft, Info, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface SwapPricing {
  id: number;
  requestType: string;
  name: string;
  description: string | null;
  baseFee: number;
  isActive: boolean;
}

interface SwapRequest {
  id: number;
  bookingId: number;
  customerAccountId: number;
  requestType: 'early_completion' | 'size_change' | 'extension';
  status: 'pending' | 'approved' | 'scheduled' | 'completed' | 'cancelled';
  requestedDate: string;
  notes?: string;
  adminNotes?: string;
  scheduledDate?: string;
  completedAt?: string;
  feeAmount?: number;
  paymentStatus?: string;
  createdAt: string;
  booking?: {
    id: number;
    customerName: string;
    deliveryDate: string;
  };
  customerAccount?: {
    id: number;
    email: string;
    companyName?: string;
  };
}

export default function AdminSwapRequestsPage() {
  const [requests, setRequests] = useState<SwapRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<SwapRequest[]>([]);
  const [pricingData, setPricingData] = useState<SwapPricing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPricingExpanded, setIsPricingExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SwapRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchRequests();
    fetchPricing();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, statusFilter, typeFilter]);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/admin/swap-requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPricing = async () => {
    try {
      const response = await fetch('/api/admin/swap-pricing');
      if (response.ok) {
        const data = await response.json();
        setPricingData(data);
      }
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
    }
  };

  const filterRequests = () => {
    let filtered = requests;
    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.booking?.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.customerAccount?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.id.toString().includes(searchTerm)
      );
    }
    if (statusFilter !== 'all') filtered = filtered.filter(request => request.status === statusFilter);
    if (typeFilter !== 'all') filtered = filtered.filter(request => request.requestType === typeFilter);
    setFilteredRequests(filtered);
  };

  const handleViewDetails = (request: SwapRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.adminNotes || '');
    setScheduledDate(request.scheduledDate || '');
    setIsDetailsDialogOpen(true);
  };

  const handleUpdateRequest = async (newStatus: string) => {
    if (!selectedRequest) return;
    setIsUpdating(true);
    try {
      const updateData: any = { status: newStatus, adminNotes: adminNotes };
      if (scheduledDate) updateData.scheduledDate = scheduledDate;
      if (newStatus === 'approved') {
        try {
          const creditResponse = await fetch(`/api/admin/swap-requests/${selectedRequest.id}/calculate-credit`);
          if (creditResponse.ok) {
            const creditData = await creditResponse.json();
            updateData.feeAmount = creditData.suggestedCredit;
          }
        } catch (error) { console.error(error); }
      }
      const response = await fetch(`/api/admin/swap-requests/${selectedRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      if (response.ok) {
        await fetchRequests();
        setIsDetailsDialogOpen(false);
        setSelectedRequest(null);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const formatRequestType = (type: string) => {
    switch (type) {
      case 'early_completion': return 'Early Pickup';
      case 'size_change': return 'Size Swap';
      case 'extension': return 'Extension';
      default: return type.replace(/_/g, ' ');
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto w-full">
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Swap Requests</h1>
          <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">Customers wanting empty dumpsters or size changes</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <Card className="relative overflow-hidden border-none shadow-xl shadow-gray-200/50 bg-white group hover:scale-[1.02] transition-all duration-300">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <ArrowRightLeft className="h-16 w-16 text-yellow-600" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-400">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl xl:text-4xl font-black text-gray-900 truncate">{requests.length}</div>
            <div className="flex items-center mt-2 text-xs font-bold text-yellow-600 bg-yellow-50 w-fit px-2 py-1 rounded-full">Swap requests</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-xl shadow-gray-200/50 bg-white group hover:scale-[1.02] transition-all duration-300">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <Clock className="h-16 w-16 text-rose-600" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-400">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl xl:text-4xl font-black text-gray-900 truncate">{requests.filter(r => r.status === 'pending').length}</div>
            <div className="flex items-center mt-2 text-xs font-bold text-rose-600 bg-rose-50 w-fit px-2 py-1 rounded-full">Needs approval</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-xl shadow-gray-200/50 bg-white group hover:scale-[1.02] transition-all duration-300">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <Calendar className="h-16 w-16 text-blue-600" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-400">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl xl:text-4xl font-black text-gray-900 truncate">{requests.filter(r => r.status === 'approved' || r.status === 'scheduled').length}</div>
            <div className="flex items-center mt-2 text-xs font-bold text-blue-600 bg-blue-50 w-fit px-2 py-1 rounded-full">Ready for pickup</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-xl shadow-gray-200/50 bg-white group hover:scale-[1.02] transition-all duration-300">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <DollarSign className="h-16 w-16 text-green-600" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-400">Credits Issued</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl xl:text-4xl font-black text-gray-900 truncate">${requests.reduce((s, r) => s + (r.feeAmount || 0), 0).toFixed(2)}</div>
            <div className="flex items-center mt-2 text-xs font-bold text-green-600 bg-green-50 w-fit px-2 py-1 rounded-full">Total credits</div>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Reference */}
      <Card className="mb-10 border-none shadow-lg shadow-blue-100 bg-gradient-to-br from-blue-50 to-white rounded-2xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Info className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-black text-gray-900 text-sm">Current Swap Pricing</h3>
                <p className="text-xs font-medium text-gray-500">Quick reference for request fees</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open('/admin/swap-pricing', '_blank')}
                className="h-8 px-3 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                <ExternalLink className="h-3 w-3 mr-1.5" />
                Edit Pricing
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPricingExpanded(!isPricingExpanded)}
                className="h-8 w-8 rounded-lg hover:bg-blue-50"
              >
                {isPricingExpanded ? <ChevronUp className="h-4 w-4 text-blue-600" /> : <ChevronDown className="h-4 w-4 text-blue-600" />}
              </Button>
            </div>
          </div>

          {isPricingExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {pricingData.map((pricing) => (
                <div key={pricing.id} className={`p-4 rounded-xl border-2 transition-all ${pricing.isActive ? 'bg-white border-green-100' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-black text-gray-900 text-sm">{pricing.name}</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{pricing.requestType.replace(/_/g, ' ')}</p>
                    </div>
                    {pricing.isActive ? (
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-gray-300" />
                    )}
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-black text-gray-900">${(pricing.baseFee / 100).toFixed(2)}</div>
                    <p className="text-xs font-medium text-gray-500 mt-1">{pricing.description || 'Base fee'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="mb-10 border-none shadow-lg shadow-gray-100 bg-white rounded-2xl overflow-hidden">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-yellow-500 transition-colors" />
                <Input
                  placeholder="Search by customer, email or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-bold"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:ring-yellow-500/20 font-bold">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48 h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:ring-yellow-500/20 font-bold">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="early_completion">Early Pickup</SelectItem>
                <SelectItem value="size_change">Size Swap</SelectItem>
                <SelectItem value="extension">Extension</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-none shadow-xl shadow-gray-200/50 bg-white rounded-3xl overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-black text-gray-900 tracking-tight">Swap Requests</CardTitle>
            <CardDescription className="font-medium">Showing {filteredRequests.length} requests</CardDescription>
          </div>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-20 bg-gray-50/30">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 w-fit mx-auto mb-6">
                  <ArrowRightLeft className="h-12 w-12 text-gray-200" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">No requests found</h3>
                <p className="text-gray-500 font-medium">Clear filters to see all swap requests.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow className="hover:bg-transparent border-gray-50">
                    <TableHead className="px-8 py-4 font-black text-gray-400 uppercase tracking-widest text-[10px]">ID</TableHead>
                    <TableHead className="py-4 font-black text-gray-400 uppercase tracking-widest text-[10px]">Customer</TableHead>
                    <TableHead className="py-4 font-black text-gray-400 uppercase tracking-widest text-[10px]">Type</TableHead>
                    <TableHead className="py-4 font-black text-gray-400 uppercase tracking-widest text-[10px]">Status</TableHead>
                    <TableHead className="py-4 font-black text-gray-400 uppercase tracking-widest text-[10px]">Credit</TableHead>
                    <TableHead className="px-8 py-4 text-right font-black text-gray-400 uppercase tracking-widest text-[10px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id} className="group hover:bg-gray-50/50 border-gray-50 transition-colors">
                      <TableCell className="px-8 font-black text-gray-300 text-xs">#{request.id}</TableCell>
                      <TableCell className="py-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 group-hover:text-yellow-600 transition-colors">{request.booking?.customerName}</span>
                          <span className="text-xs text-gray-400 font-bold">{request.customerAccount?.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-widest border-none px-2.5 py-1 rounded-lg ${request.requestType === 'early_completion' ? 'bg-amber-50 text-amber-600' :
                            request.requestType === 'size_change' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                          }`}>
                          {formatRequestType(request.requestType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${request.status === 'pending' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                            request.status === 'approved' ? 'bg-green-50 text-green-600 border-green-100' :
                              request.status === 'scheduled' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                request.status === 'completed' ? 'bg-gray-50 text-gray-600 border-gray-100' :
                                  'bg-gray-50 text-gray-400 border-gray-100'
                          }`}>
                          <div className={`h-1.5 w-1.5 rounded-full mr-2 ${request.status === 'pending' ? 'bg-rose-500 animate-pulse' : 'bg-current'}`} />
                          {request.status}
                        </div>
                      </TableCell>
                      <TableCell className="font-black text-gray-900">
                        {request.feeAmount ? `$${request.feeAmount.toFixed(2)}` : <span className="text-gray-300 text-[10px] uppercase font-bold tracking-tighter italic">TBD</span>}
                      </TableCell>
                      <TableCell className="px-8 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(request)}
                          className="rounded-xl font-black text-[10px] uppercase tracking-widest h-9 px-4 hover:bg-yellow-50 hover:text-yellow-600 transition-all"
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-gray-50/50 px-8 py-8 border-b border-gray-100">
            <DialogHeader>
              <div className="flex items-center gap-4 mb-2">
                <div className="h-12 w-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  <FileText className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight">Swap Request #{selectedRequest?.id}</DialogTitle>
                  <DialogDescription className="font-bold uppercase tracking-widest text-[10px] text-gray-400">Request Details</DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          {selectedRequest && (
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Customer</Label>
                  <p className="font-black text-gray-900 text-lg">{selectedRequest.booking?.customerName}</p>
                  <p className="text-xs font-bold text-gray-400">{selectedRequest.customerAccount?.email}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Request Type</Label>
                  <div className="flex gap-2 items-center">
                    <Badge variant="outline" className="border-none bg-blue-50 text-blue-600 font-black uppercase text-[10px] tracking-widest">{formatRequestType(selectedRequest.requestType)}</Badge>
                    <Badge variant="outline" className={`border-none font-black uppercase text-[10px] tracking-widest ${selectedRequest.status === 'pending' ? 'bg-rose-50 text-rose-600' : 'bg-gray-100 text-gray-600'}`}>{selectedRequest.status}</Badge>
                  </div>
                </div>
              </div>

              {selectedRequest.notes && (
                <div className="p-6 bg-yellow-50/50 rounded-2xl border border-yellow-100/50">
                  <Label className="text-[10px] font-black uppercase text-yellow-700 tracking-widest block mb-2">Customer Notes</Label>
                  <p className="text-sm font-bold text-gray-700 leading-relaxed">"{selectedRequest.notes}"</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adminNotes" className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Admin Notes</Label>
                  <Textarea
                    id="adminNotes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-bold min-h-[120px]"
                    placeholder="Internal notes for this swap request..."
                  />
                </div>

                {(selectedRequest.status === 'pending' || selectedRequest.status === 'approved') && (
                  <div className="space-y-2">
                    <Label htmlFor="scheduledDate" className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Pickup Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="scheduledDate"
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="pl-12 h-12 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-yellow-500/20 transition-all font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>

              {selectedRequest.feeAmount && (
                <div className="p-6 bg-green-50 rounded-2xl border border-green-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase text-green-700 tracking-widest">Credit Amount</p>
                    <p className="text-2xl font-black text-green-900">${selectedRequest.feeAmount.toFixed(2)}</p>
                  </div>
                  <DollarSign className="h-10 w-10 text-green-200" />
                </div>
              )}
            </div>
          )}

          <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setIsDetailsDialogOpen(false)} className="rounded-2xl h-12 px-8 font-black text-xs uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-all">Close</Button>

            {selectedRequest?.status === 'pending' && (
              <>
                <Button variant="outline" onClick={() => handleUpdateRequest('cancelled')} disabled={isUpdating} className="rounded-2xl h-12 px-6 font-black text-xs uppercase tracking-widest border-rose-100 text-rose-600 hover:bg-rose-50 hover:border-rose-200">Reject</Button>
                <Button onClick={() => handleUpdateRequest('approved')} disabled={isUpdating} className="rounded-2xl h-12 px-8 font-black text-xs uppercase tracking-widest bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 hover:bg-yellow-600 active:scale-95 transition-all">Approve</Button>
              </>
            )}

            {selectedRequest?.status === 'approved' && (
              <Button onClick={() => handleUpdateRequest('scheduled')} disabled={isUpdating} className="rounded-2xl h-12 px-8 font-black text-xs uppercase tracking-widest bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all">Schedule Pickup</Button>
            )}

            {selectedRequest?.status === 'scheduled' && (
              <Button onClick={() => handleUpdateRequest('completed')} disabled={isUpdating} className="rounded-2xl h-12 px-8 font-black text-xs uppercase tracking-widest bg-green-600 text-white shadow-lg shadow-green-600/20 hover:bg-green-700 active:scale-95 transition-all">Mark Complete</Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
