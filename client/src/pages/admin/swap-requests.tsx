import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/ui/admin-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, RefreshCw, Truck, Package, Clock, Check, X, Calendar, MapPin, User, MessageSquare, DollarSign, Download, ExternalLink } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface SwapRequestWithDetails {
  id: number;
  bookingId: number;
  customerAccountId: number | null;
  requestType: string;
  status: string;
  requestedDate: string | null;
  notes: string | null;
  adminNotes: string | null;
  scheduledDate: string | null;
  completedAt: string | null;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  deliveryAddress: string;
  feeAmount: number | null;
  paymentStatus: string | null;
  stripePaymentLinkUrl: string | null;
  receiptUrl: string | null;
}

interface SwapPricing {
  id: number;
  requestType: string;
  name: string;
  baseFee: number;
  isActive: boolean;
}

export default function SwapRequestsPage() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [selectedRequest, setSelectedRequest] = useState<SwapRequestWithDetails | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [issueCredit, setIssueCredit] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const [skipPayment, setSkipPayment] = useState(false);

  const { data: requests, isLoading } = useQuery<SwapRequestWithDetails[]>({
    queryKey: ["/api/admin/swap-requests"],
  });

  const { data: swapPricing } = useQuery<SwapPricing[]>({
    queryKey: ["/api/admin/swap-pricing"],
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes, scheduledDate, issueCredit, creditAmount, skipPayment }: { id: number; status: string; adminNotes?: string; scheduledDate?: string; issueCredit?: boolean; creditAmount?: number; skipPayment?: boolean }) => {
      const response = await apiRequest("PUT", `/api/admin/swap-requests/${id}`, {
        status,
        adminNotes,
        scheduledDate,
        issueCredit,
        creditAmount,
        skipPayment,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/swap-requests"] });
      setIsDetailDialogOpen(false);
      setSelectedRequest(null);
      toast({
        title: "Request Updated",
        description: "The swap request has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update request",
        variant: "destructive",
      });
    },
  });

  interface CreditCalculation {
    unusedDays: number;
    dailyRate: number;
    suggestedCredit: number;
  }
  
  const [creditCalc, setCreditCalc] = useState<CreditCalculation | null>(null);
  const [loadingCredit, setLoadingCredit] = useState(false);
  
  const getFeeForRequestType = (requestType: string) => {
    const pricing = swapPricing?.find(p => p.requestType === requestType && p.isActive);
    return pricing?.baseFee || 0;
  };

  const handleOpenDetail = async (request: SwapRequestWithDetails) => {
    setSelectedRequest(request);
    setAdminNotes(request.adminNotes || "");
    setScheduledDate(request.scheduledDate ? format(new Date(request.scheduledDate), "yyyy-MM-dd") : "");
    setNewStatus(request.status);
    setIssueCredit(false);
    setCreditAmount("");
    setCreditCalc(null);
    setSkipPayment(false);
    setIsDetailDialogOpen(true);
    
    // Auto-fetch credit calculation for early_complete requests
    if (request.requestType === "early_complete") {
      setLoadingCredit(true);
      try {
        const response = await apiRequest("GET", `/api/admin/swap-requests/${request.id}/calculate-credit`);
        const data = await response.json();
        if (data.suggestedCredit > 0) {
          setCreditCalc(data);
          setCreditAmount((data.suggestedCredit / 100).toFixed(2));
        } else {
          toast({
            title: "Credit Calculation",
            description: data.message || "No credit available - rental may not have unused days.",
          });
        }
      } catch (error) {
        console.error("Failed to calculate credit:", error);
        toast({
          title: "Calculation Error",
          description: "Could not calculate suggested credit. You can still enter a manual amount.",
          variant: "destructive",
        });
      }
      setLoadingCredit(false);
    }
  };

  const handleUpdateRequest = () => {
    if (!selectedRequest) return;
    
    updateRequestMutation.mutate({
      id: selectedRequest.id,
      status: newStatus,
      adminNotes: adminNotes || undefined,
      scheduledDate: scheduledDate || undefined,
      issueCredit: issueCredit && selectedRequest.requestType === "early_complete",
      creditAmount: issueCredit ? Math.round(parseFloat(creditAmount) * 100) : undefined, // Convert to cents
      skipPayment,
    });
  };

  const handleQuickApprove = (request: SwapRequestWithDetails) => {
    updateRequestMutation.mutate({
      id: request.id,
      status: "approved",
    });
  };

  const handleQuickCancel = (request: SwapRequestWithDetails) => {
    updateRequestMutation.mutate({
      id: request.id,
      status: "cancelled",
    });
  };

  const filteredRequests = requests?.filter(r => 
    statusFilter === "all" ? true : r.status === statusFilter
  ) || [];

  const pendingCount = requests?.filter(r => r.status === "pending").length || 0;
  const approvedCount = requests?.filter(r => r.status === "approved").length || 0;
  const scheduledCount = requests?.filter(r => r.status === "scheduled").length || 0;

  const getRequestTypeBadge = (type: string) => {
    switch (type) {
      case "pickup":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Truck className="h-3 w-3 mr-1" />Final Pickup</Badge>;
      case "swap":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200"><RefreshCw className="h-3 w-3 mr-1" />Swap</Badge>;
      case "early_complete":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><Clock className="h-3 w-3 mr-1" />Early Complete</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "awaiting_payment":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100"><DollarSign className="h-3 w-3 mr-1" />Awaiting Payment</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><Check className="h-3 w-3 mr-1" />Approved</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100"><Calendar className="h-3 w-3 mr-1" />Scheduled</Badge>;
      case "completed":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100"><Package className="h-3 w-3 mr-1" />Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><X className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Swap & Pickup Requests</h1>
        <div className="grid gap-4 md:grid-cols-3">
          <Card data-testid="card-pending-count">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>
          <Card data-testid="card-approved-count">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <Check className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedCount}</div>
              <p className="text-xs text-muted-foreground">Ready to schedule</p>
            </CardContent>
          </Card>
          <Card data-testid="card-scheduled-count">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scheduledCount}</div>
              <p className="text-xs text-muted-foreground">Pickup/swap scheduled</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Requests</CardTitle>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No requests found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id} data-testid={`row-request-${request.id}`}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{request.customerName}</span>
                          <span className="text-sm text-muted-foreground">{request.customerEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getRequestTypeBadge(request.requestType)}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        {request.requestedDate 
                          ? format(new Date(request.requestedDate), "MMM d, yyyy")
                          : "Not specified"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {request.deliveryAddress}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {request.status === "pending" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuickApprove(request)}
                                disabled={updateRequestMutation.isPending}
                                data-testid={`button-approve-${request.id}`}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuickCancel(request)}
                                disabled={updateRequestMutation.isPending}
                                data-testid={`button-cancel-${request.id}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDetail(request)}
                            data-testid={`button-details-${request.id}`}
                          >
                            Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Request Details</DialogTitle>
              <DialogDescription>
                Review and manage this swap/pickup request
              </DialogDescription>
            </DialogHeader>
            
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{selectedRequest.customerName}</span>
                    <span className="text-muted-foreground">({selectedRequest.customerEmail})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedRequest.deliveryAddress}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRequestTypeBadge(selectedRequest.requestType)}
                    {selectedRequest.requestedDate && (
                      <span className="text-sm text-muted-foreground">
                        Requested for: {format(new Date(selectedRequest.requestedDate), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>
                  
                  {selectedRequest.notes && (
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Customer Notes</span>
                      </div>
                      <p className="text-sm">{selectedRequest.notes}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger id="status" data-testid="select-update-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="scheduledDate">Scheduled Date</Label>
                    <Input
                      id="scheduledDate"
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      data-testid="input-scheduled-date"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="adminNotes">Admin Notes</Label>
                    <Textarea
                      id="adminNotes"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes about this request..."
                      data-testid="textarea-admin-notes"
                    />
                  </div>

                  {selectedRequest.status === "pending" && newStatus === "approved" && getFeeForRequestType(selectedRequest.requestType) > 0 && (
                    <div className="p-3 border rounded-lg bg-orange-50 border-orange-200">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-800">Service Fee</span>
                      </div>
                      <p className="text-sm text-orange-700 mb-3">
                        This request type has a configured fee of ${(getFeeForRequestType(selectedRequest.requestType) / 100).toFixed(2)}.
                        The customer will receive a payment link before the request is processed.
                      </p>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="skipPayment"
                          checked={skipPayment}
                          onCheckedChange={(checked) => setSkipPayment(checked === true)}
                          data-testid="checkbox-skip-payment"
                        />
                        <Label htmlFor="skipPayment" className="text-sm">Waive fee for this request</Label>
                      </div>
                    </div>
                  )}

                  {selectedRequest.status === "awaiting_payment" && selectedRequest.stripePaymentLinkUrl && (
                    <div className="p-3 border rounded-lg bg-orange-50 border-orange-200">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-800">Payment Pending</span>
                      </div>
                      <p className="text-sm text-orange-700 mb-2">
                        Fee: ${selectedRequest.feeAmount ? (selectedRequest.feeAmount / 100).toFixed(2) : '0.00'}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(selectedRequest.stripePaymentLinkUrl!, '_blank')}
                        data-testid="button-view-payment-link"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Payment Link
                      </Button>
                    </div>
                  )}

                  {selectedRequest.paymentStatus === "paid" && selectedRequest.feeAmount && (
                    <div className="p-3 border rounded-lg bg-green-50 border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Payment Received</span>
                      </div>
                      <p className="text-sm text-green-700 mb-2">
                        Paid: ${(selectedRequest.feeAmount / 100).toFixed(2)}
                      </p>
                      {selectedRequest.receiptUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-green-500 text-green-700 hover:bg-green-100"
                          onClick={() => window.open(selectedRequest.receiptUrl!, '_blank')}
                          data-testid="button-download-receipt"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Receipt
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {selectedRequest.requestType === "early_complete" && (
                    <div className="p-3 border rounded-lg bg-green-50 border-green-200">
                      <div className="flex items-center gap-2 mb-3">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Early Completion Credit</span>
                      </div>
                      
                      {loadingCredit ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Calculating credit...
                        </div>
                      ) : creditCalc && (
                        <div className="mb-3 p-2 bg-white rounded border text-sm">
                          <div className="grid grid-cols-2 gap-1">
                            <span className="text-muted-foreground">Unused days:</span>
                            <span className="font-medium">{creditCalc.unusedDays} days</span>
                            <span className="text-muted-foreground">Daily rate:</span>
                            <span className="font-medium">${(creditCalc.dailyRate / 100).toFixed(2)}</span>
                            <span className="text-muted-foreground">Suggested credit:</span>
                            <span className="font-medium text-green-700">${(creditCalc.suggestedCredit / 100).toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mb-2">
                        <Checkbox
                          id="issueCredit"
                          checked={issueCredit}
                          onCheckedChange={(checked) => setIssueCredit(checked === true)}
                          data-testid="checkbox-issue-credit"
                        />
                        <Label htmlFor="issueCredit" className="text-sm">Issue credit to customer</Label>
                      </div>
                      {issueCredit && (
                        <div>
                          <Label htmlFor="creditAmount" className="text-sm">Credit Amount ($)</Label>
                          <Input
                            id="creditAmount"
                            type="number"
                            step="0.01"
                            min="0"
                            value={creditAmount}
                            onChange={(e) => setCreditAmount(e.target.value)}
                            placeholder="0.00"
                            data-testid="input-credit-amount"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Credit will be available for their next booking
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDetailDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateRequest}
                disabled={updateRequestMutation.isPending}
                data-testid="button-save-request"
              >
                {updateRequestMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
