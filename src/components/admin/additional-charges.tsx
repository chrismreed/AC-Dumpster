'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StringNumberInput } from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Trash2,
  Loader2,
  DollarSign,
  Link as LinkIcon,
  Mail,
  MessageSquare,
  QrCode,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Download,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdditionalCharge {
  id: number;
  bookingId: number;
  description: string;
  amount: number;
  isPaid: boolean;
  createdAt: string;
}

interface PaymentLink {
  id: number;
  bookingId: number;
  stripePaymentLinkId: string;
  totalAmount: number;
  status: 'pending' | 'paid' | 'expired';
  expiresAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

interface AdditionalChargesProps {
  bookingId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  onChargesChange?: () => void;
}

export function AdditionalCharges({
  bookingId,
  customerName,
  customerEmail,
  customerPhone,
  onChargesChange,
}: AdditionalChargesProps) {
  const { toast } = useToast();
  const [charges, setCharges] = useState<AdditionalCharge[]>([]);
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isCreatingLink, setIsCreatingLink] = useState(false);

  // Add charge dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newAmount, setNewAmount] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Delete confirmation state
  const [chargeToDelete, setChargeToDelete] = useState<AdditionalCharge | null>(null);
  const [linkToDelete, setLinkToDelete] = useState<PaymentLink | null>(null);

  // QR Code dialog state
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrPaymentUrl, setQrPaymentUrl] = useState('');

  // Send dialog state
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [sendMethod, setSendMethod] = useState<'email' | 'sms'>('email');
  const [sendContent, setSendContent] = useState<{ to: string; subject?: string; body: string; paymentUrl: string } | null>(null);
  const [selectedLinkForSend, setSelectedLinkForSend] = useState<PaymentLink | null>(null);

  // Copied state for URL
  const [copied, setCopied] = useState(false);

  const fetchCharges = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/additional-charges`);
      if (!res.ok) throw new Error('Failed to fetch charges');
      const data = await res.json();
      setCharges(data);
    } catch (error) {
      console.error('Error fetching charges:', error);
    }
  }, [bookingId]);

  const fetchPaymentLinks = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/payment-links`);
      if (!res.ok) throw new Error('Failed to fetch payment links');
      const data = await res.json();
      setPaymentLinks(data);
    } catch (error) {
      console.error('Error fetching payment links:', error);
    }
  }, [bookingId]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchCharges(), fetchPaymentLinks()]);
    setIsLoading(false);
  }, [fetchCharges, fetchPaymentLinks]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddCharge = async () => {
    if (!newAmount || !newDescription) return;

    const amountInCents = Math.round(parseFloat(newAmount) * 100);
    if (isNaN(amountInCents) || amountInCents <= 0) {
      toast({ title: 'Invalid amount', variant: 'destructive' });
      return;
    }

    setIsAdding(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/additional-charges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: newDescription.trim(),
          amount: amountInCents,
        }),
      });

      if (!res.ok) throw new Error('Failed to add charge');

      toast({ title: 'Charge added successfully' });
      setShowAddDialog(false);
      setNewAmount('');
      setNewDescription('');
      await loadData();
      onChargesChange?.();
    } catch (error) {
      toast({ title: 'Failed to add charge', variant: 'destructive' });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteCharge = async () => {
    if (!chargeToDelete) return;

    try {
      const res = await fetch(`/api/admin/additional-charges/${chargeToDelete.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete charge');

      toast({ title: 'Charge deleted' });
      setChargeToDelete(null);
      await loadData();
      onChargesChange?.();
    } catch (error) {
      toast({ title: 'Failed to delete charge', variant: 'destructive' });
    }
  };

  const handleCreatePaymentLink = async () => {
    setIsCreatingLink(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/payment-link`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to create payment link');
      }

      toast({ title: 'Payment link created' });
      await loadData();
    } catch (error: any) {
      toast({ title: error.message || 'Failed to create payment link', variant: 'destructive' });
    } finally {
      setIsCreatingLink(false);
    }
  };

  const handleCheckPaymentStatus = async (linkId: number) => {
    try {
      const res = await fetch(`/api/admin/payment-links/${linkId}/check-status`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to check status');

      const data = await res.json();
      
      if (data.status === 'paid') {
        toast({ title: 'Payment confirmed!', description: data.message });
      } else {
        toast({ title: data.message });
      }

      await loadData();
      onChargesChange?.();
    } catch (error) {
      toast({ title: 'Failed to check payment status', variant: 'destructive' });
    }
  };

  const handleSendLink = async (link: PaymentLink, method: 'email' | 'sms') => {
    try {
      const res = await fetch(`/api/admin/payment-links/${link.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method }),
      });

      if (!res.ok) throw new Error('Failed to prepare message');

      const data = await res.json();
      setSelectedLinkForSend(link);
      setSendMethod(method);
      setSendContent(data);
      setShowSendDialog(true);
    } catch (error) {
      toast({ title: 'Failed to prepare message', variant: 'destructive' });
    }
  };

  const handleGenerateQrCode = async (paymentUrl: string) => {
    try {
      // Generate QR code using a canvas
      const QRCode = (await import('qrcode')).default;
      const qrDataUrl = await QRCode.toDataURL(paymentUrl, {
        width: 256,
        margin: 2,
      });
      setQrCodeUrl(qrDataUrl);
      setQrPaymentUrl(paymentUrl);
      setShowQrDialog(true);
    } catch (error) {
      toast({ title: 'Failed to generate QR code', variant: 'destructive' });
    }
  };

  const handleDownloadQr = () => {
    const link = document.createElement('a');
    link.download = `payment-qr-${bookingId}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  const handleDeleteLink = async () => {
    if (!linkToDelete) return;

    try {
      const res = await fetch(`/api/admin/payment-links/${linkToDelete.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete link');

      toast({ title: 'Payment link deleted' });
      setLinkToDelete(null);
      await loadData();
    } catch (error) {
      toast({ title: 'Failed to delete payment link', variant: 'destructive' });
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied to clipboard' });
  };

  const unpaidCharges = charges.filter((c) => !c.isPaid);
  const totalUnpaid = unpaidCharges.reduce((sum, c) => sum + c.amount, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header with total unpaid */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-medium text-sm sm:text-base text-gray-900">Additional Charges</h3>
          {totalUnpaid > 0 && (
            <Badge variant="destructive" className="text-xs whitespace-nowrap">
              ${(totalUnpaid / 100).toFixed(2)} unpaid
            </Badge>
          )}
        </div>
        <Button size="sm" onClick={() => setShowAddDialog(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Charge
        </Button>
      </div>

      {/* Charges list */}
      {charges.length === 0 ? (
        <p className="text-sm text-gray-500 py-2">No additional charges</p>
      ) : (
        <div className="space-y-3">
          {charges.map((charge) => (
            <div
              key={charge.id}
              className="p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="font-medium text-sm flex-1 text-gray-900">{charge.description}</p>
                {!charge.isPaid && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 -mt-1 flex-shrink-0"
                    onClick={() => setChargeToDelete(charge)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                )}
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-gray-500">
                  {new Date(charge.createdAt).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-medium text-sm whitespace-nowrap text-gray-900">
                    ${(charge.amount / 100).toFixed(2)}
                  </span>
                  {charge.isPaid ? (
                    <Badge className="bg-green-100 text-green-800 whitespace-nowrap text-xs px-2.5 py-1">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Paid
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800 whitespace-nowrap text-xs px-2.5 py-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Unpaid
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Link Section */}
      {unpaidCharges.length > 0 && (
        <div className="border-t pt-5 mt-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h4 className="font-medium text-sm text-gray-900">Payment Links</h4>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCreatePaymentLink}
              disabled={isCreatingLink}
              className="w-full sm:w-auto"
            >
              {isCreatingLink ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <LinkIcon className="h-4 w-4 mr-2" />
              )}
              Create Payment Link
            </Button>
          </div>

          {paymentLinks.length === 0 ? (
            <p className="text-sm text-gray-500">No payment links created yet</p>
          ) : (
            <div className="space-y-4">
              {paymentLinks.map((link) => (
                <div
                  key={link.id}
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-gray-900">
                        ${(link.totalAmount / 100).toFixed(2)}
                      </span>
                      {link.status === 'paid' ? (
                        <Badge className="bg-green-100 text-green-800 text-xs px-2.5 py-1">
                          Paid
                        </Badge>
                      ) : link.status === 'expired' ? (
                        <Badge className="bg-gray-100 text-gray-800 text-xs px-2.5 py-1">
                          Expired
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs px-2.5 py-1">
                          Pending
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(link.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {link.status === 'pending' && (
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs h-9 px-3"
                          onClick={() => handleSendLink(link, 'email')}
                        >
                          <Mail className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                          <span>Email</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs h-9 px-3"
                          onClick={() => handleSendLink(link, 'sms')}
                        >
                          <MessageSquare className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                          <span>SMS</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs h-9 px-3"
                          onClick={async () => {
                            // Get payment URL from send endpoint first
                            const res = await fetch(`/api/admin/payment-links/${link.id}/send`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ method: 'email' }),
                            });
                            if (res.ok) {
                              const data = await res.json();
                              handleGenerateQrCode(data.paymentUrl);
                            }
                          }}
                        >
                          <QrCode className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                          <span>QR Code</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs h-9 px-3"
                          onClick={() => handleCheckPaymentStatus(link.id)}
                        >
                          <RefreshCw className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                          <span>Check</span>
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full text-xs h-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setLinkToDelete(link)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                        Delete Link
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Charge Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Additional Charge</DialogTitle>
            <DialogDescription>
              Add an extra charge for overage, damage, or other fees to this booking.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount ($)</Label>
              <div className="relative mt-1">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <StringNumberInput
                  id="amount"
                  placeholder="0.00"
                  value={newAmount}
                  onChange={setNewAmount}
                  allowDecimals={true}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="e.g., Overage fee, damage charge, extended rental"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddCharge}
              disabled={!newAmount || !newDescription || isAdding}
            >
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              Add Charge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Charge Confirmation */}
      <AlertDialog open={!!chargeToDelete} onOpenChange={() => setChargeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Charge</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this charge? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCharge}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Payment Link Confirmation */}
      <AlertDialog open={!!linkToDelete} onOpenChange={() => setLinkToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment Link</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment link? The link will no longer be accessible to the customer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLink}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Send via {sendMethod === 'email' ? 'Email' : 'SMS'}
            </DialogTitle>
            <DialogDescription>
              Copy the message below and send it to the customer.
            </DialogDescription>
          </DialogHeader>
          {sendContent && (
            <div className="space-y-4">
              <div>
                <Label>To</Label>
                <p className="text-sm font-medium mt-1">{sendContent.to}</p>
              </div>
              {sendContent.subject && (
                <div>
                  <Label>Subject</Label>
                  <p className="text-sm mt-1">{sendContent.subject}</p>
                </div>
              )}
              <div>
                <Label>Message</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {sendContent.body}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={sendContent.paymentUrl}
                  readOnly
                  className="text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(sendContent.paymentUrl)}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(sendContent.paymentUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              Close
            </Button>
            {sendMethod === 'email' && sendContent && (
              <Button
                onClick={() => {
                  window.open(
                    `mailto:${sendContent.to}?subject=${encodeURIComponent(sendContent.subject || '')}&body=${encodeURIComponent(sendContent.body)}`,
                    '_blank'
                  );
                }}
              >
                <Mail className="h-4 w-4 mr-1" />
                Open Email Client
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Payment QR Code</DialogTitle>
            <DialogDescription>
              Customer can scan this QR code to make payment.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-4">
            {qrCodeUrl && (
              <img
                src={qrCodeUrl}
                alt="Payment QR Code"
                className="w-64 h-64 border rounded-lg"
              />
            )}
            <p className="text-xs text-gray-500 mt-2 text-center break-all max-w-full">
              {qrPaymentUrl}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQrDialog(false)}>
              Close
            </Button>
            <Button onClick={handleDownloadQr}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
