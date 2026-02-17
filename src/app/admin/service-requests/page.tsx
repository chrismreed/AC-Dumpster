'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, FileText, Mail, Phone, User, DollarSign, Calendar, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ServiceResponse {
  id: number;
  serviceId: number;
  serviceName?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  responses: Record<string, any>;
  calculatedPrice?: number;
  status: 'pending' | 'quoted' | 'approved' | 'rejected';
  adminNotes?: string;
  quotedPrice?: number;
  quotedAt?: string;
  quotedBy?: number;
  createdAt: string;
  updatedAt: string;
}

export default function ServiceRequestsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<ServiceResponse | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [quotedPrice, setQuotedPrice] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');

  const { data: requests = [], isLoading } = useQuery<ServiceResponse[]>({
    queryKey: ['service-responses'],
    queryFn: async () => {
      const res = await fetch('/api/service-responses');
      if (!res.ok) throw new Error('Failed to fetch service responses');
      return res.json();
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, quotedPrice, adminNotes }: {
      id: number;
      status: string;
      quotedPrice?: number;
      adminNotes?: string;
    }) => {
      const res = await fetch(`/api/service-responses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, quotedPrice, adminNotes }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-responses'] });
      toast({
        title: 'Status updated',
        description: 'The service request has been updated successfully.',
      });
      setIsDetailOpen(false);
      setSelectedRequest(null);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update the request. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const openDetail = (request: ServiceResponse) => {
    setSelectedRequest(request);
    setQuotedPrice(request.quotedPrice ? (request.quotedPrice / 100).toString() : '');
    setAdminNotes(request.adminNotes || '');
    setIsDetailOpen(true);
  };

  const handleQuote = () => {
    if (!selectedRequest) return;
    const price = parseFloat(quotedPrice) * 100;
    updateStatusMutation.mutate({
      id: selectedRequest.id,
      status: 'quoted',
      quotedPrice: price,
      adminNotes,
    });
  };

  const handleStatusChange = (status: 'approved' | 'rejected') => {
    if (!selectedRequest) return;
    updateStatusMutation.mutate({
      id: selectedRequest.id,
      status,
      adminNotes,
    });
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch =
      request.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.customerPhone.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    quoted: requests.filter(r => r.status === 'quoted').length,
    approved: requests.filter(r => r.status === 'approved').length,
  };

  if (isLoading && requests.length === 0) {
    return (
      <div className="p-10 max-w-[1600px] mx-auto w-full">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto w-full min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Service Requests</h1>
          <p className="text-sm text-gray-500 mt-0.5">Review and respond to custom service inquiries</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <StatsCard title="Total Requests" value={stats.total} icon={FileText} color="blue" />
        <StatsCard title="Pending" value={stats.pending} icon={Clock} color="yellow" />
        <StatsCard title="Quoted" value={stats.quoted} icon={DollarSign} color="purple" />
        <StatsCard title="Approved" value={stats.approved} icon={CheckCircle} color="green" />
      </div>

      {/* Filters */}
      <Card className="mb-10 border-none shadow-xl rounded-3xl">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-14 h-14 rounded-2xl border-gray-100 bg-gray-50/50 font-bold"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-64 h-14 rounded-2xl border-gray-100 bg-gray-50/50 font-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="quoted">Quoted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card className="border-none shadow-2xl rounded-[32px] overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="px-6 py-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">ID</TableHead>
                  <TableHead className="py-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Customer</TableHead>
                  <TableHead className="py-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Contact</TableHead>
                  <TableHead className="py-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Price</TableHead>
                  <TableHead className="py-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Status</TableHead>
                  <TableHead className="py-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Date</TableHead>
                  <TableHead className="px-6 py-6 text-right font-black text-gray-400 uppercase tracking-widest text-[10px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <p className="text-gray-400 font-bold">No service requests found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => (
                    <TableRow key={request.id} className="group hover:bg-gray-50/80 border-gray-50/50">
                      <TableCell className="px-6">
                        <span className="font-mono font-black text-xs text-gray-300">#{request.id}</span>
                      </TableCell>
                      <TableCell className="py-6">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-bold text-gray-900">{request.customerName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600">{request.customerEmail}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600">{request.customerPhone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-6">
                        {request.quotedPrice ? (
                          <span className="font-black text-green-600">${(request.quotedPrice / 100).toFixed(2)}</span>
                        ) : request.calculatedPrice ? (
                          <span className="font-black text-gray-400">${(request.calculatedPrice / 100).toFixed(2)}</span>
                        ) : (
                          <span className="text-gray-300 text-sm">Not set</span>
                        )}
                      </TableCell>
                      <TableCell className="py-6">
                        <StatusBadge status={request.status} />
                      </TableCell>
                      <TableCell className="py-6 text-sm font-black text-gray-400 tabular-nums">
                        {new Date(request.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </TableCell>
                      <TableCell className="px-6 py-6 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDetail(request)}
                          className="rounded-xl font-bold opacity-0 group-hover:opacity-100"
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      {selectedRequest && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-[600px] rounded-3xl border-none shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-gray-900">Service Request #{selectedRequest.id}</DialogTitle>
              <DialogDescription className="font-medium text-gray-400">
                Review and respond to this custom service request
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-6">
              {/* Customer Info */}
              <Card className="bg-gray-50 border-none rounded-2xl">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-bold text-gray-900">{selectedRequest.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{selectedRequest.customerEmail}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{selectedRequest.customerPhone}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Form Responses */}
              <div className="space-y-3">
                <h3 className="font-black text-sm text-gray-900">Customer Responses</h3>
                {Object.entries(selectedRequest.responses).map(([key, value]) => (
                  <div key={key} className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs font-black text-gray-400 uppercase mb-1">{key}</p>
                    <p className="text-sm font-bold text-gray-900">{JSON.stringify(value)}</p>
                  </div>
                ))}
              </div>

              {/* Pricing */}
              {selectedRequest.status === 'pending' && (
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-gray-400">Quoted Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={quotedPrice}
                    onChange={(e) => setQuotedPrice(e.target.value)}
                    className="h-12 rounded-xl"
                    placeholder="Enter quoted price"
                  />
                  {selectedRequest.calculatedPrice && (
                    <p className="text-xs text-gray-500">
                      Calculated estimate: ${(selectedRequest.calculatedPrice / 100).toFixed(2)}
                    </p>
                  )}
                </div>
              )}

              {/* Admin Notes */}
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-gray-400">Admin Notes</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="rounded-xl"
                  rows={3}
                  placeholder="Add internal notes..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                {selectedRequest.status === 'pending' && (
                  <>
                    <Button
                      onClick={handleQuote}
                      disabled={!quotedPrice || updateStatusMutation.isPending}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-black rounded-2xl"
                    >
                      {updateStatusMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Quote'}
                    </Button>
                    <Button
                      onClick={() => handleStatusChange('rejected')}
                      disabled={updateStatusMutation.isPending}
                      variant="outline"
                      className="flex-1 rounded-2xl font-bold"
                    >
                      Reject
                    </Button>
                  </>
                )}
                {selectedRequest.status === 'quoted' && (
                  <>
                    <Button
                      onClick={() => handleStatusChange('approved')}
                      disabled={updateStatusMutation.isPending}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white font-black rounded-2xl"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleStatusChange('rejected')}
                      disabled={updateStatusMutation.isPending}
                      variant="outline"
                      className="flex-1 rounded-2xl font-bold"
                    >
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: any }> = {
    pending: { bg: 'bg-yellow-50 border-yellow-100', text: 'text-yellow-700', icon: Clock },
    quoted: { bg: 'bg-purple-50 border-purple-100', text: 'text-purple-700', icon: DollarSign },
    approved: { bg: 'bg-green-50 border-green-100', text: 'text-green-700', icon: CheckCircle },
    rejected: { bg: 'bg-red-50 border-red-100', text: 'text-red-700', icon: XCircle },
  };

  const { bg, text, icon: Icon } = config[status] || config.pending;

  return (
    <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${bg} ${text}`}>
      <Icon className="h-3 w-3 mr-1.5" />
      {status}
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, color }: any) {
  const colorMap: any = {
    blue: "text-blue-600 bg-blue-50/50 border-blue-100",
    yellow: "text-yellow-600 bg-yellow-50/50 border-yellow-100",
    purple: "text-purple-600 bg-purple-50/50 border-purple-100",
    green: "text-green-600 bg-green-50/50 border-green-100",
  };

  return (
    <Card className={`border-none shadow-xl rounded-3xl ${colorMap[color]}`}>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{title}</p>
          <div className="text-3xl font-black text-gray-900 tracking-tighter">{value}</div>
        </div>
        <div className={`h-12 w-12 rounded-2xl border-2 border-white flex items-center justify-center shadow-lg ${colorMap[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );
}
